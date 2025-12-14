/* eslint-disable */
/* tslint:disable */

/**
 * Mock Service Worker (2.2.1).
 * @see https://github.com/mswjs/msw
 * - Please do NOT modify this file.
 * - Please do NOT serve this file on production.
 */

const INTEGRITY_CHECKSUM = '3d6b9f06410d162b75727103db7f2824'
const activeClientIds = new Set()

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', async function (event) {
  const clientId = event.source.id

  if (!clientId || !self.clients) {
    return
  }

  const client = await self.clients.get(clientId)

  if (!client) {
    return
  }

  const allClients = await self.clients.matchAll({
    type: 'window',
  })

  switch (event.data) {
    case 'KEEPALIVE_REQUEST': {
      sendToClient(client, {
        type: 'KEEPALIVE_RESPONSE',
      })
      break
    }

    case 'INTEGRITY_CHECK_REQUEST': {
      sendToClient(client, {
        type: 'INTEGRITY_CHECK_RESPONSE',
        payload: INTEGRITY_CHECKSUM,
      })
      break
    }

    case 'MOCK_ACTIVATE': {
      activeClientIds.add(clientId)

      sendToClient(client, {
        type: 'MOCK_ACTIVATE',
      })
      break
    }

    case 'MOCK_DEACTIVATE': {
      activeClientIds.delete(clientId)
      break
    }

    case 'CLIENT_CLOSED': {
      activeClientIds.delete(clientId)
      break
    }

    default: {
      // Do nothing
    }
  }
})

self.addEventListener('fetch', function (event) {
  const { request } = event
  const accept = request.headers.get('accept') || ''

  // Bypass server-sent events.
  if (accept.includes('text/event-stream')) {
    return
  }

  // Bypass navigation requests.
  if (request.mode === 'navigate') {
    return
  }

  // Opening the DevTools triggers the "only-if-cached" mode
  // request, which cannot be handled by the worker.
  // Bypass such requests.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return
  }

  // Bypass requests from clients that didn't explicitly
  // enable the mocking.
  if (!activeClientIds.has(event.clientId)) {
    return
  }

  // Bypass requests that are not HTTP/HTTPS.
  if (!request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    handleRequest(event, request).catch((error) => {
      // If the request handler throws, fall back to the actual request.
      console.error(
        '[MSW] Failed to handle a "%s" request to "%s": %s',
        request.method,
        request.url,
        error,
      )
      return fetch(request)
    }),
  )
})

async function handleRequest(event, request) {
  const client = await self.clients.get(event.clientId)
  const requestId = Math.random().toString(36).substring(2)

  return new Promise((resolve, reject) => {
    const responseTimeout = setTimeout(() => {
      // If the client doesn't respond in time, assume it's busy/reload
      // and fall back to the actual request.
      resolve(fetch(request))
    }, 1000)

    const messageChannel = new MessageChannel()

    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.error) {
        reject(event.data.error)
      } else {
        const { type, payload } = event.data

        if (type === 'MOCK_RESPONSE') {
          clearTimeout(responseTimeout)
          
          // Construct Response from payload
          const { body, status, statusText, headers } = payload
          const response = new Response(body, {
            status,
            statusText,
            headers: new Headers(headers),
          })
          
          resolve(response)
        } else if (type === 'MOCK_NOT_FOUND') {
            clearTimeout(responseTimeout)
            resolve(fetch(request))
        }
      }
    }

    if (client) {
        // Read body if possible (basic handling)
        const method = request.method
        const bodyPromise = (method !== 'GET' && method !== 'HEAD') 
            ? request.clone().text() 
            : Promise.resolve(undefined)

        bodyPromise.then((body) => {
            client.postMessage(
                {
                    type: 'REQUEST',
                    payload: {
                        url: request.url,
                        method: request.method,
                        headers: Object.fromEntries(request.headers.entries()),
                        cache: request.cache,
                        mode: request.mode,
                        credentials: request.credentials,
                        destination: request.destination,
                        integrity: request.integrity,
                        redirect: request.redirect,
                        referrer: request.referrer,
                        referrerPolicy: request.referrerPolicy,
                        body,
                        requestId,
                    },
                },
                [messageChannel.port2],
            )
        }).catch(err => {
            console.error('[MSW] Failed to read request body', err);
            resolve(fetch(request))
        })
    } else {
      resolve(fetch(request))
    }
  })
}

function sendToClient(client, message) {
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel()

    messageChannel.port1.onmessage = (event) => {
      if (event.data && event.data.error) {
        reject(event.data.error)
      } else {
        resolve(event.data)
      }
    }

    client.postMessage(message, [messageChannel.port2])
  })
}
