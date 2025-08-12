import Fetch from "@11ty/eleventy-fetch"

function getWeatherCondition(code) {
  // Open-Meteo weather codes to readable conditions
  if (code === 0) return 'clear'
  if (code >= 1 && code <= 3) return 'partly cloudy'
  if (code >= 45 && code <= 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'rain showers'
  if (code >= 85 && code <= 86) return 'snow showers'
  if (code >= 95 && code <= 99) return 'thunderstorm'
  return 'unknown'
}

export default async function() {
  // Somerville, MA coordinates
  const latitude = 42.3876
  const longitude = -71.0995

  // Query parameters for the API request
  const params = new URLSearchParams({
    latitude,
    longitude,
    temperature_unit: 'fahrenheit',
    current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
    timezone: 'America/New_York'
  })

  try {
    const url = `https://api.open-meteo.com/v1/forecast?${params}`

    const data = await Fetch(url, {
      duration: "15m",
      type: "json"
    })

    const current = data.current ? {
      temp: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      condition: getWeatherCondition(data.current.weather_code),
      isDay: data.current.is_day,
      timestamp: new Date(data.current.time)
    } : null

    return {
      current,
      location: 'Somerville MA',
      lastUpdated: new Date().toISOString()
    }

  } catch (error) {
    console.error('Error fetching weather data:', error)
    return {
      current: null,
      error: error.message
    }
  }
}
