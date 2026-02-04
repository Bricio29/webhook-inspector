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
          201: z.object({ id: z.uuidv7() })
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

      // SOLUÇÃO: Tratamos a URL como uma string simples para evitar o erro ERR_INVALID_URL
      // Pegamos o caminho completo e removemos os parâmetros de busca (query params)
      const urlPath = request.url.split('?')[0]
      // Removemos o prefixo '/capture' para salvar apenas o sub-caminho desejado
      const pathname = urlPath.replace('/capture', '')

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
          contentType,
          contentLength,
          body,
          headers,
          pathname,
        })
        .returning()

      return reply.code(201).send({ id: result[0].id })
    },
  )
}