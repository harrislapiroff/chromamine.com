import Fetch from "@11ty/eleventy-fetch"
import { group, sort } from "d3-array"
import { format, startOfDay, endOfDay, getUnixTime, fromUnixTime } from "date-fns"
import { createFlickr, FetchTransport } from "flickr-sdk"

// Custom transport that uses Eleventy Fetch for caching
class EleventyFetchTransport extends FetchTransport {
  constructor(options = {}) {
    super(options)
    this.cacheDuration = options.cacheDuration || "1h"
  }

  async request(url) {
    return Fetch(url, {
      duration: this.cacheDuration,
      type: "json"
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
    // Initialize Flickr SDK with custom transport
    const { flickr } = createFlickr({
      consumerKey: FLICKR_API_KEY,
      consumerSecret: FLICKR_API_SECRET,
      oauthToken: FLICKR_OAUTH_TOKEN,
      oauthTokenSecret: FLICKR_OAUTH_SECRET,
      transport: new EleventyFetchTransport({ cacheDuration: "1h" })
    })

    // Get user ID from username
    const userData = await flickr('flickr.people.findByUsername', { username: USERNAME })
    const userId = userData.user.nsid

    // Get all public photos with geo data (with pagination)
    let allPhotos = []
    let page = 1
    const perPage = 500

    while (true) {
      const photosData = await flickr('flickr.people.getPublicPhotos', {
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

    // Create a transport with longer caching for location data
    const { flickr: locationFlickr } = createFlickr({
      consumerKey: FLICKR_API_KEY,
      consumerSecret: FLICKR_API_SECRET,
      oauthToken: FLICKR_OAUTH_TOKEN,
      oauthTokenSecret: FLICKR_OAUTH_SECRET,
      transport: new EleventyFetchTransport({ cacheDuration: "7d" })
    })

    const photosWithLocations = await Promise.all(
      basicPhotos.map(async photo => {
        if (!photo.hasGeoData) {
          return { ...photo, location: null }
        }

        try {
          const locationData = await locationFlickr('flickr.photos.geo.getLocation', {
            photo_id: photo.id
          })

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
    return {
      photos: [],
      photosByDate: [],
      totalPhotos: 0,
      error: error.message
    }
  }
}