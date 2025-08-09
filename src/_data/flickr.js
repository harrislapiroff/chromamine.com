import Fetch from "@11ty/eleventy-fetch"
import { group, sort } from "d3-array"
import { format, startOfDay, endOfDay, getUnixTime, fromUnixTime } from "date-fns"

export default async function() {
  const FLICKR_API_KEY = process.env.FLICKR_API_KEY
  const USERNAME = 'harrislapiroff'

  if (!FLICKR_API_KEY) {
    console.warn('FLICKR_API_KEY environment variable not set. Returning empty photo data.')
    return {
      photos: [],
      photosByDate: [],
      totalPhotos: 0
    }
  }

  try {
    // First, get the user ID from the username
    const userUrl = `https://api.flickr.com/services/rest/?method=flickr.people.findByUsername&api_key=${FLICKR_API_KEY}&username=${USERNAME}&format=json&nojsoncallback=1`

    const userData = await Fetch(userUrl, {
      duration: "1d", // Cache for 1 day
      type: "json"
    })

    if (userData.stat !== 'ok') {
      throw new Error(`Flickr API error: ${userData.message}`)
    }

    const userId = userData.user.nsid

    // Get public photos for the user (with pagination support)
    let allPhotos = []
    let page = 1
    const perPage = 500 // Maximum allowed by Flickr API

    while (true) {
      const photosUrl = `https://api.flickr.com/services/rest/?method=flickr.people.getPublicPhotos&api_key=${FLICKR_API_KEY}&user_id=${userId}&format=json&nojsoncallback=1&extras=date_upload,date_taken,description,tags,url_s,url_q,url_m,url_l,url_o&per_page=${perPage}&page=${page}`

      const photosData = await Fetch(photosUrl, {
        duration: "1h", // Cache for 1 hour
        type: "json"
      })

      if (photosData.stat !== 'ok') {
        throw new Error(`Flickr API error: ${photosData.message}`)
      }

      // Add photos from this page
      allPhotos.push(...photosData.photos.photo)

      // Check if we've got all pages
      if (page >= photosData.photos.pages) {
        break
      }

      page++
    }

    const photos = allPhotos.map(photo => ({
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
      flickrUrl: `https://www.flickr.com/photos/${userId}/${photo.id}/`
    }))

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

    console.log(`Fetched ${sortedPhotos.length} photos from Flickr for user ${USERNAME}`)

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
