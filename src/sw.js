const CACHE = 'believersflow-v1'

const precacheManifest = self.__WB_MANIFEST

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  ...(precacheManifest || []).map(e => typeof e === 'string' ? e : e.url),
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (url.hostname === 'bible-api.com') {
    event.respondWith(
      caches.open('bible-api-cache').then(cache =>
        cache.match(request).then(resp => resp || fetch(request).then(resp => {
          cache.put(request, resp.clone())
          return resp
        }))
      )
    )
    return
  }

  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(resp => resp || fetch(request))
      )
    )
    return
  }

  event.respondWith(
    caches.match(request).then(resp =>
      resp || fetch(request).catch(() => caches.match('./index.html'))
    )
  )
})

self.addEventListener('push', event => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const title = data.title || 'BelieversFlow'
    const options = {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
      tag: data.tag || 'default',
      renotify: true,
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch {
    const title = 'BelieversFlow'
    const options = {
      body: event.data.text(),
      icon: './icon-192.png',
      badge: './icon-192.png',
    }
    event.waitUntil(self.registration.showNotification(title, options))
  }
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || './'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(urlToOpen)
    })
  )
})
