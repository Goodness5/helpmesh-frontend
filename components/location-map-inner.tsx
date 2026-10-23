"use client"

import { MapPin, Navigation, ExternalLink } from "lucide-react"

interface LocationMapInnerProps {
  coords: { lat: number; lng: number }
  requesterName: string
  helperLocation?: { lat: number; lng: number } | null
  height: string
}

// Calculate distance between two points in meters
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function LocationMapInner({ coords, requesterName, helperLocation, height }: LocationMapInnerProps) {
  // Use OpenStreetMap static embed (no API key needed)
  const zoom = 15
  const bbox = 0.005 // Bounding box size
  
  // OpenStreetMap embed URL
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - bbox},${coords.lat - bbox},${coords.lng + bbox},${coords.lat + bbox}&layer=mapnik&marker=${coords.lat},${coords.lng}`
  
  // Google Maps directions URL (opens in new tab)
  const googleMapsUrl = helperLocation 
    ? `https://www.google.com/maps/dir/${helperLocation.lat},${helperLocation.lng}/${coords.lat},${coords.lng}`
    : `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
  
  // Calculate distance if helper location exists
  const distance = helperLocation 
    ? calculateDistance(helperLocation.lat, helperLocation.lng, coords.lat, coords.lng)
    : null
  const distanceText = distance !== null
    ? distance < 1000 
      ? `${Math.round(distance)}m away`
      : `${(distance / 1000).toFixed(1)}km away`
    : null

  return (
    <div className="space-y-2">
      {/* Map iframe */}
      <div 
        className="relative rounded-xl overflow-hidden border border-zinc-800"
        style={{ height }}
      >
        <iframe
          title={`Location of ${requesterName}`}
          src={osmEmbedUrl}
          className="w-full h-full border-0"
          style={{ filter: "invert(90%) hue-rotate(180deg)" }} // Dark mode effect
          loading="lazy"
        />
        
        {/* Overlay with info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono">
              <MapPin className="size-4 text-[#25f497]" />
              <span className="text-white">{requesterName}</span>
              {distanceText && (
                <span className="px-2 py-0.5 rounded-full bg-[#25f497]/20 text-[#25f497]">
                  {distanceText}
                </span>
              )}
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25f497] text-black text-xs font-mono font-semibold hover:bg-[#1ee088] transition-colors"
            >
              <Navigation className="size-3" />
              Directions
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
