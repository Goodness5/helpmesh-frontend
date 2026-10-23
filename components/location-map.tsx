"use client"

import { useEffect, useState } from "react"
import { MapPin, Navigation } from "lucide-react"

// Parse GPS coordinates from place string
// Formats supported:
// - "GPS: 6.524372, 3.379210 (±15m)"
// - "Address Name | GPS: lat, lng"
// - Plain "lat, lng"
export function parseCoordinates(place: string): { lat: number; lng: number; name?: string } | null {
  if (!place) return null
  
  // Try to match "GPS: lat, lng" format (with optional address prefix)
  const gpsMatch = place.match(/GPS:\s*([-\d.]+),\s*([-\d.]+)/)
  if (gpsMatch) {
    const lat = parseFloat(gpsMatch[1])
    const lng = parseFloat(gpsMatch[2])
    if (!isNaN(lat) && !isNaN(lng)) {
      // Extract name if present (before the |)
      const namePart = place.split("|")[0]?.trim()
      const name = namePart && !namePart.includes("GPS:") ? namePart : undefined
      return { lat, lng, name }
    }
  }
  
  // Try to match plain "lat, lng" format
  const plainMatch = place.match(/^([-\d.]+),\s*([-\d.]+)$/)
  if (plainMatch) {
    const lat = parseFloat(plainMatch[1])
    const lng = parseFloat(plainMatch[2])
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng }
    }
  }
  
  return null
}

// Get display name from place string
export function getPlaceName(place: string): string {
  if (!place) return "Unknown location"
  
  // If it has a name part before |
  const parts = place.split("|")
  if (parts.length > 1 && parts[0].trim() && !parts[0].includes("GPS:")) {
    return parts[0].trim()
  }
  
  // If it's just GPS coordinates
  if (place.includes("GPS:")) {
    return "GPS Location"
  }
  
  return place
}

interface LocationMapProps {
  place: string
  requesterName?: string
  helperLocation?: { lat: number; lng: number } | null
  height?: string
}

// Dynamic import for Leaflet to avoid SSR issues
export function LocationMap({ place, requesterName = "Requester", helperLocation, height = "200px" }: LocationMapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    coords: { lat: number; lng: number }
    requesterName: string
    helperLocation?: { lat: number; lng: number } | null
    height: string
  }> | null>(null)
  
  const coords = parseCoordinates(place)
  
  useEffect(() => {
    // Dynamically import map to avoid SSR issues
    import("./location-map-inner").then((mod) => {
      setMapComponent(() => mod.LocationMapInner)
    }).catch(() => {
      // Leaflet not available
    })
  }, [])
  
  if (!coords) {
    // No coordinates - show placeholder
    return (
      <div 
        className="rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center text-zinc-500"
        style={{ height }}
      >
        <div className="text-center space-y-2 p-4">
          <MapPin className="size-8 mx-auto text-zinc-600" />
          <p className="text-xs font-mono">Location: {place || "Not specified"}</p>
        </div>
      </div>
    )
  }
  
  if (!MapComponent) {
    // Loading map
    return (
      <div 
        className="rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center space-y-2 text-zinc-500">
          <Navigation className="size-6 mx-auto animate-pulse" />
          <p className="text-xs font-mono">Loading map...</p>
        </div>
      </div>
    )
  }
  
  return <MapComponent coords={coords} requesterName={requesterName} helperLocation={helperLocation} height={height} />
}

// Hook to get current user's location
export function useMyLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not available")
      return
    }
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setError(null)
      },
      (err) => {
        setError(err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    )
    
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])
  
  return { location, error }
}
