import { z } from 'zod'

export const sessionClaimsSchema = z.object({
  audience: z.string().min(1),
  email: z.string().email(),
  expiresAt: z.number().int().positive(),
  issuedAt: z.number().int().positive(),
})

export type SessionClaims = z.infer<typeof sessionClaimsSchema>
