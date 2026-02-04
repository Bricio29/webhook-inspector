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
      // 1. Extração de metadados da requisição
      const method = request.method
      const ip = request.ip
      const contentType = request.headers['content-type']
      const contentLength = request.headers['content-length']
        ? Number(request.headers['content-length'])
        : null

      // 2. Tratamento do corpo (Body)
      let body: string | null = null
      if (request.body) {
        body = typeof request.body === 'string'
          ? request.body
          : JSON.stringify(request.body, null, 2)
      }

      // 3. CORREÇÃO CRÍTICA: Tratamento de URL para evitar ERR_INVALID_URL
      // Usamos uma base fictícia para que o Node consiga processar o caminho relativo
      const urlObj = new URL(request.url, 'http://localhost')
      const pathname = urlObj.pathname.replace('/capture', '') || '/'
      
      // 4. Captura de Query Params e Headers
      const queryParams = request.query // Objeto com os parâmetros da URL (?id=123)
      const headers = Object.fromEntries(
        Object.entries(request.headers).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.join(', ') : value || '',
        ])
      )

      // 5. Inserção no Banco de Dados (Neon)
      // Nota: statusCode tem default 200 no teu banco, então não é obrigatório enviar
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
          // Se o teu schema do Drizzle já tiver estes campos, podes descomentar:
          // queryParams, 
          // statusCode: 200,
        })
        .returning()

      // 6. Resposta de sucesso
      return reply.code(201).send({ id: result[0].id })
    },
  )
}