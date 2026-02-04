import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { webhooks } from '../db/schema'
import { db } from '../db'

export const captureWebhook: FastifyPluginAsyncZod = async (app) => {
  app.all(
    '/capture/*',
    {
      schema: {
        summary: 'Capture incoming webhook requests',
        tags: ['External'],
        hide: true,
        response: {
          201: z.object({ id: z.string() })
        },
      },
    },
    async (request, reply) => {
      const method = request.method
      const ip = request.ip
      const contentType = request.headers['content-type']
      const contentLength = request.headers['content-length']
        ? Number(request.headers['content-length'])
        : null

      let body: string | null = null
      if (request.body) {
        body = typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body, null, 2)
      }

      // SOLUÇÃO DEFINITIVA PARA ERR_INVALID_URL:
      // Usamos o segundo parâmetro do new URL para fornecer uma base fictícia.
      // Isso permite que o Node processe o caminho relativo sem dar erro.
      const urlObj = new URL(request.url, 'http://localhost')
      const pathname = urlObj.pathname.replace('/capture', '') || '/'
      
      const headers = Object.fromEntries(
        Object.entries(request.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(', ') : value || '',
        ])
      )

      const result = await db
        .insert(webhooks)
        .values({
          method,
          ip,
          pathname,
          headers,
          body,
          contentType,
          contentLength,
          // statusCode: 200, // O banco já tem default 200
        })
        .returning()

      return reply.code(201).send({ id: result[0].id })
    },
  )
}