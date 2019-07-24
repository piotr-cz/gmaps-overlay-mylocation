#! /usr/bin/env node

/**
 * Example server as module imports, geolocation and maps (when not configured) won't work on file: protocol
 * Based on [https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework]
 */

const fs = require('fs')
const fsPromises = fs.promises
const http = require('http')

const listenOptions = {
  port: 3000,
  host: '127.0.0.1',
}

// Create an instance of the http server to handle HTTP requests
const server = http.createServer(async (request, response) => {
  /** @type {string} Response content type */
  let contentType
  /** @type {Buffer|string} Response body */
  let body

  // Expand base url
  const filePath = request.url === '/' ? '/examples/index.html' : request.url

  // Set mime type and check whitelist
  switch (filePath) {
    case '/examples/index.html':
      contentType = 'text/html'
      break

    case '/dist/index.css':
      contentType = 'text/css'
      break

    case '/src/index.js':
    case '/dist/index.cjs.js':
    case '/dist/index.esm.js':
    case '/dist/index.iife.js':
      contentType = 'text/javascript'
      break

    default:
      response
        .writeHead(404)
        .end()

      return
  }

  // Read file
  try {
    body = await fsPromises.readFile(`.${filePath}`)
  } catch (error) {
    response
      .writeHead(error.code === 'ENOENT' ? 404 : 500)
      .end()

    return
  }

  // Replace env variables in html files
  if (process.env.GOOGLE_MAPS_KEY && contentType === 'text/html') {
    body = body
      .toString()
      .replace(/\bGOOGLE_MAPS_KEY\b/g, process.env.GOOGLE_MAPS_KEY)
  }

  response
    .writeHead(200, {'content-type': contentType})
    .end(body, 'utf-8')
})

// Start the server on port 3000
server.listen(listenOptions, () => {
  const { address, port } = server.address()

  console.info(`Node server running on ${address}:${port}`)
})
