import { z } from 'zod'

export const webhookListItemSchema = z.object({
  id: z.string(), // Mudamos de uuidv7() para string() para evitar erros de validação rigorosa
  method: z.string(),
  pathname: z.string(),
  createdAt: z.coerce.date(),
})

export const webhookListSchema = z.object({
  webhooks: z.array(webhookListItemSchema),
  nextCursor: z.string().nullable(),
})

export const webhookDetailsSchema = z.object({
  id: z.string(), // Mudamos aqui também
  method: z.string(),
  pathname: z.string(),
  ip: z.string(),
  statusCode: z.number().default(200), // Adicionado default para bater com seu banco
  contentType: z.string().nullable(),
  contentLength: z.number().nullable(),
  // Mudamos para z.any() ou record flexível para não quebrar com objetos complexos
  // Em vez de z.record(z.any()), use:
  queryParams: z.record(z.string(), z.any()).nullable(),
  headers: z.record(z.string(), z.any()),
  body: z.string().nullable(),
  createdAt: z.coerce.date(),
})