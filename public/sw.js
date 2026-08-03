// public/sw.js
const CACHE_NAME = 'waaw-kicks-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request)
      if (cached) return cached

      try {
        const response = await fetch(event.request)
        if (response.ok) cache.put(event.request, response.clone())
        return response
      } catch {
        return cached || Response.error()
      }
    })
  )
})
