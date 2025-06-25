import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createRouter } from './router/router.js'

const app = new Hono()

createRouter(app)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
