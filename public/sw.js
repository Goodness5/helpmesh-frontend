// HelpMesh Service Worker v1.0.0
const CACHE_NAME = "helpmesh-v1"
const OFFLINE_URL = "/offline.html"

// Assets to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Install event - cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Precaching assets")
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name)
            return caches.delete(name)
          })
      )
    })
  )
  // Take control of all clients immediately
  self.clients.claim()
})

// Fetch event - network-first strategy with offline fallback
self.addEventListener("fetch", (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip browser-sync and hot reload requests in dev
  if (request.url.includes("/_next/") || request.url.includes("__webpack")) {
    return
  }

  // Skip API requests (they need fresh data)
  if (request.url.includes("/api/")) {
    return
  }

  // For navigation requests, use network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(OFFLINE_URL)
        })
    )
    return
  }

  // For static assets, use cache-first strategy
  if (
    request.url.includes("/icons/") ||
    request.url.includes("/images/") ||
    request.url.endsWith(".png") ||
    request.url.endsWith(".jpg") ||
    request.url.endsWith(".svg") ||
    request.url.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Return cached and update in background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response)
                })
              }
            })
            .catch(() => {})
          return cached
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Default: network-first for other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Background sync for offline actions (future use)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-help-requests") {
    console.log("[SW] Syncing help requests...")
    // Future: sync pending help requests when back online
  }
})

// Push notifications (future use)
self.addEventListener("push", (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: [
      { action: "open", title: "Open" },
      { action: "close", title: "Dismiss" },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "HelpMesh", options)
  )
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "close") return

  const url = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url === url && "focus" in client) {
          return client.focus()
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
