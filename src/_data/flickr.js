import Fetch from "@11ty/eleventy-fetch"
import { group, sort } from "d3-array"
import { format, startOfDay, endOfDay, getUnixTime, fromUnixTime } from "date-fns"
import { createFlickr } from "flickr-sdk"

/* CachingFlickr
 *
 * This is a wrapper around the Flickr SDK that caches the results of API calls.
 * This slightly complex approach is required because Flickr API requests use OAuth,
 * which includes a timestamp in the request. That makes them not cacheable based on URL alone,
 * so instead we use this custom client that caches based on API method anc parameters.
 */
class CachingFlickr {
    // Note: This does not distinguish between different auths, so it's not safe to use for multiple users in a single process.
    constructor({auth, transport, cacheDuration = "1h"}) {
        this.flickr = createFlickr(auth, transport).flickr
        this.cacheDuration = cacheDuration
    }

    cacheKey(method, params) {
        const sortedKeys = Object.keys(params).sort()
        const paramString = sortedKeys.map(key => `${key}=${params[key]}`).join('&')
        return `${method.replace(/\./g, '-')}-${paramString}`
    }

    async query(method, params) {
        const cacheKey = this.cacheKey(method, params)

        return await Fetch(async () => {
            return await this.flickr(method, params)
        }, {
            requestId: cacheKey,
            duration: this.cacheDuration,
            type: "json",
        })
    }
}

export default async function() {
  const FLICKR_API_KEY = process.env.FLICKR_API_KEY
  const FLICKR_API_SECRET = process.env.FLICKR_API_SECRET
  const FLICKR_OAUTH_TOKEN = process.env.FLICKR_OAUTH_TOKEN
  const FLICKR_OAUTH_SECRET = process.env.FLICKR_OAUTH_SECRET
  const USERNAME = 'harrislapiroff'

  if (!FLICKR_API_KEY || !FLICKR_API_SECRET || !FLICKR_OAUTH_TOKEN || !FLICKR_OAUTH_SECRET) {
    console.warn('Required Flickr environment variables not set. Returning empty photo data.')
    return {
      photos: [],
      photosByDate: [],
      totalPhotos: 0
    }
  }

  try {
    // Initialize cached Flickr client
    const auth = {
      consumerKey: FLICKR_API_KEY,
      consumerSecret: FLICKR_API_SECRET,
      oauthToken: FLICKR_OAUTH_TOKEN,
      oauthTokenSecret: FLICKR_OAUTH_SECRET
    }
    const flickr = new CachingFlickr({ auth })

    // Get user ID from username (cached)
    const userData = await flickr.query('flickr.people.findByUsername', { username: USERNAME })
    const userId = userData.user.nsid

    // Get all public photos with geo data (with pagination)
    let allPhotos = []
    let page = 1
    const perPage = 500

    while (true) {
      const photosData = await flickr.query('flickr.people.getPublicPhotos', {
        user_id: userId,
        extras: 'date_upload,date_taken,description,tags,url_s,url_q,url_m,url_l,url_o,geo',
        per_page: perPage,
        page: page
      })

      allPhotos.push(...photosData.photos.photo)

      if (page >= photosData.photos.pages) {
        break
      }
      page++
    }

    // First pass: map basic photo data and identify geotagged photos
    const basicPhotos = allPhotos.map(photo => ({
      id: photo.id,
      title: photo.title,
      description: photo.description._content || '',
      tags: photo.tags,
      dateUpload: fromUnixTime(parseInt(photo.dateupload)),
      dateTaken: new Date(photo.datetaken),
      urls: {
        small: photo.url_s,
        square: photo.url_q,
        medium: photo.url_m,
        large: photo.url_l,
        original: photo.url_o
      },
      hasGeoData: !!(photo.latitude && photo.longitude && photo.latitude !== 0 && photo.longitude !== 0),
      coords: photo.latitude && photo.longitude && photo.latitude !== 0 && photo.longitude !== 0 ? {
        latitude: parseFloat(photo.latitude),
        longitude: parseFloat(photo.longitude),
        accuracy: photo.accuracy ? parseInt(photo.accuracy) : null
      } : null,
      flickrUrl: `https://www.flickr.com/photos/${userId}/${photo.id}/`
    }))

    // Second pass: fetch detailed location data for geotagged photos
    const geotaggedPhotos = basicPhotos.filter(photo => photo.hasGeoData)
    console.log(`Found ${geotaggedPhotos.length} geotagged photos, fetching location details...`)

    const photosWithLocations = await Promise.all(
      basicPhotos.map(async photo => {
        if (!photo.hasGeoData) {
          return { ...photo, location: null }
        }

        // Cache location data per photo with longer duration
        const locationFlickr = new CachingFlickr({ auth, cacheDuration: "30d" })
        const locationData = await locationFlickr.query('flickr.photos.geo.getLocation', {
          photo_id: photo.id
        })

        try {
          if (locationData.photo && locationData.photo.location) {
            const loc = locationData.photo.location
            return {
              ...photo,
              location: {
                ...photo.coords,
                locality: loc.locality?._content || null,
                county: loc.county?._content || null,
                region: loc.region?._content || null,
                country: loc.country?._content || null,
                displayName: [
                  loc.locality?._content,
                  loc.region?._content,
                  loc.country?._content
                ].filter(Boolean).join(', ')
              }
            }
          } else {
            // Keep coordinates even if detailed location fetch fails
            return { ...photo, location: photo.coords }
          }
        } catch (error) {
          console.warn(`Failed to fetch location for photo ${photo.id}:`, error.message)
          // Keep coordinates even if detailed location fetch fails
          return { ...photo, location: photo.coords }
        }
      })
    )

    const photos = photosWithLocations

    // Sort photos by upload date (newest first) using d3.sort
    const sortedPhotos = sort(photos, d => -d.dateUpload)

    // Group photos by upload date (YYYY-MM-DD format for daily grouping) using d3.group
    const photosByDate = Array.from(
      group(sortedPhotos, d => format(d.dateUpload, 'yyyy-MM-dd')),
      ([dateString, photos]) => {
        // Use the first photo's actual date to get the correct timezone
        const firstPhoto = photos[0]
        const date = startOfDay(firstPhoto.dateUpload)
        const minUploadDate = getUnixTime(startOfDay(firstPhoto.dateUpload))
        const maxUploadDate = getUnixTime(endOfDay(firstPhoto.dateUpload))

        return {
          date,
          photos,
          flickrUrl: `https://www.flickr.com/search/?user_id=${userId}&min_upload_date=${minUploadDate}&max_upload_date=${maxUploadDate}&view_all=1`
        }
      }
    )

    const photosWithDetailedLocations = sortedPhotos.filter(p => p.location && p.location.displayName)
    console.log(`Fetched ${sortedPhotos.length} photos from Flickr for user ${USERNAME}`)
    console.log(`${photosWithDetailedLocations.length} photos have detailed location data`)

    return {
      photos: sortedPhotos,
      photosByDate,
      totalPhotos: sortedPhotos.length,
      lastUpdated: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error fetching Flickr photos:', error)
    console.error('Error stack:', error.stack)
    return {
      photos: [],
      photosByDate: [],
      totalPhotos: 0,
      error: error.message
    }
  }
}
