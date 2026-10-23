"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { MapPin, Loader2, Navigation, X, Search } from "lucide-react"
import { useAnnounce } from "@/components/announce"

interface LocationResult {
  display_name: string
  lat: string
  lon: string
  type: string
}

interface LocationPickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  
  return debouncedValue
}

export function LocationPicker({ value, onChange, placeholder = "Search for a location..." }: LocationPickerProps) {
  const announce = useAnnounce()
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [gettingGPS, setGettingGPS] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  
  const debouncedInput = useDebounce(inputValue, 400)
  
  // Search for locations using Nominatim
  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            "User-Agent": "HelpMesh/1.0",
          },
        }
      )
      const data = await res.json()
      setSuggestions(data || [])
      setShowSuggestions(true)
    } catch (err) {
      console.error("Geocoding error:", err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Search when debounced input changes
  useEffect(() => {
    if (debouncedInput && debouncedInput !== value) {
      searchLocations(debouncedInput)
    }
  }, [debouncedInput, value, searchLocations])
  
  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  // Get current GPS location
  const getGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      announce("GPS not available on this device")
      return
    }
    
    setGettingGPS(true)
    announce("Getting your precise location...")
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const locationText = `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`
        setInputValue(locationText)
        onChange(locationText)
        setGettingGPS(false)
        setShowSuggestions(false)
        announce(`Location found with ${Math.round(accuracy)} meter accuracy`)
      },
      (error) => {
        setGettingGPS(false)
        if (error.code === error.PERMISSION_DENIED) {
          announce("Location permission denied")
        } else {
          announce("Could not get location")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [onChange, announce])
  
  // Select a suggestion
  const selectSuggestion = (suggestion: LocationResult) => {
    // Format: "Address Name | GPS: lat, lng"
    const lat = parseFloat(suggestion.lat).toFixed(6)
    const lng = parseFloat(suggestion.lon).toFixed(6)
    const shortName = suggestion.display_name.split(",").slice(0, 3).join(",")
    const locationText = `${shortName} | GPS: ${lat}, ${lng}`
    
    setInputValue(locationText)
    onChange(locationText)
    setShowSuggestions(false)
    setSuggestions([])
    announce(`Selected: ${shortName}`)
  }
  
  // Clear input
  const clearInput = () => {
    setInputValue("")
    onChange("")
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        {/* Main input with search */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              if (!e.target.value) {
                setSuggestions([])
                setShowSuggestions(false)
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true)
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#25f497]/50"
          />
          {inputValue && (
            <button
              type="button"
              onClick={clearInput}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        
        {/* GPS button */}
        <button
          type="button"
          onClick={getGPSLocation}
          disabled={gettingGPS}
          className="px-4 py-3 rounded-xl bg-[#25f497] hover:bg-[#1ee088] disabled:bg-zinc-800 text-black disabled:text-zinc-500 font-mono font-semibold transition-colors flex items-center gap-2"
        >
          {gettingGPS ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Navigation className="size-4" />
          )}
          <span className="hidden sm:inline">GPS</span>
        </button>
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.lat}-${suggestion.lon}-${index}`}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-zinc-900 border-b border-zinc-800 last:border-b-0 transition-colors"
            >
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-[#25f497] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-white truncate">
                    {suggestion.display_name.split(",").slice(0, 2).join(",")}
                  </p>
                  <p className="text-xs font-mono text-zinc-500 truncate">
                    {suggestion.display_name.split(",").slice(2).join(",").trim()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Hint text */}
      <p className="mt-2 text-xs font-mono text-zinc-500">
        Search for an address or use GPS for precise location
      </p>
    </div>
  )
}

// Parse location string to get coordinates (for displaying on map)
export function parseLocationToCoords(location: string): { lat: number; lng: number; name?: string } | null {
  if (!location) return null
  
  // Try to extract GPS coordinates from various formats
  // Format 1: "GPS: lat, lng"
  // Format 2: "Address | GPS: lat, lng"
  // Format 3: "GPS: lat, lng (±accuracy)"
  
  const gpsMatch = location.match(/GPS:\s*([-\d.]+),\s*([-\d.]+)/)
  if (gpsMatch) {
    const lat = parseFloat(gpsMatch[1])
    const lng = parseFloat(gpsMatch[2])
    if (!isNaN(lat) && !isNaN(lng)) {
      // Extract name if present (before the |)
      const namePart = location.split("|")[0]?.trim()
      const name = namePart && !namePart.startsWith("GPS:") ? namePart : undefined
      return { lat, lng, name }
    }
  }
  
  // Format 4: Plain "lat, lng"
  const plainMatch = location.match(/^([-\d.]+),\s*([-\d.]+)$/)
  if (plainMatch) {
    const lat = parseFloat(plainMatch[1])
    const lng = parseFloat(plainMatch[2])
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng }
    }
  }
  
  return null
}
