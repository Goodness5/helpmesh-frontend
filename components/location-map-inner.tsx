"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface LocationMapInnerProps {
  coords: { lat: number; lng: number }
  requesterName: string
  helperLocation?: { lat: number; lng: number } | null
  height: string
}

// Custom marker icons
const requesterIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="
    width: 32px;
    height: 32px;
    background: #25f497;
    border: 3px solid #000;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <span style="transform: rotate(45deg); font-size: 14px;">📍</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

const helperIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="
    width: 32px;
    height: 32px;
    background: #3b82f6;
    border: 3px solid #000;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <span style="font-size: 14px;">👤</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

export function LocationMapInner({ coords, requesterName, helperLocation, height }: LocationMapInnerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    
    // Initialize map
    const map = L.map(mapRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    })
    
    mapInstanceRef.current = map
    
    // Add dark tile layer (CartoDB Dark Matter)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map)
    
    // Add requester marker
    L.marker([coords.lat, coords.lng], { icon: requesterIcon })
      .addTo(map)
      .bindPopup(`<b>${requesterName}</b><br/>Needs help here`)
    
    // Add helper marker and route if helper location exists
    if (helperLocation) {
      L.marker([helperLocation.lat, helperLocation.lng], { icon: helperIcon })
        .addTo(map)
        .bindPopup("<b>You</b><br/>Your location")
      
      // Draw a line between helper and requester
      const line = L.polyline([
        [helperLocation.lat, helperLocation.lng],
        [coords.lat, coords.lng]
      ], {
        color: "#25f497",
        weight: 3,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(map)
      
      // Fit bounds to show both markers
      map.fitBounds(line.getBounds(), { padding: [50, 50] })
      
      // Calculate distance
      const distance = map.distance([helperLocation.lat, helperLocation.lng], [coords.lat, coords.lng])
      const distanceText = distance < 1000 
        ? `${Math.round(distance)}m away`
        : `${(distance / 1000).toFixed(1)}km away`
      
      // Add distance label at midpoint
      const midLat = (helperLocation.lat + coords.lat) / 2
      const midLng = (helperLocation.lng + coords.lng) / 2
      L.marker([midLat, midLng], {
        icon: L.divIcon({
          className: "distance-label",
          html: `<div style="
            background: rgba(0,0,0,0.8);
            color: #25f497;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-family: monospace;
            white-space: nowrap;
          ">${distanceText}</div>`,
          iconSize: [100, 20],
          iconAnchor: [50, 10],
        })
      }).addTo(map)
    }
    
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [coords, requesterName, helperLocation])
  
  return (
    <div 
      ref={mapRef}
      className="rounded-xl overflow-hidden border border-zinc-800"
      style={{ height, width: "100%" }}
    />
  )
}
