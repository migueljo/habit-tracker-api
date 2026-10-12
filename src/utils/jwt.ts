import { createSecretKey } from 'node:crypto'
import { jwtVerify, SignJWT } from 'jose'
import z from 'zod'

import { env } from '../../env.ts'

const jwtTokenPayloadSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
})
export type JWTTokenPayload = z.infer<typeof jwtTokenPayloadSchema>

export const generateJWTToken = (payload: JWTTokenPayload) => {
  const secret = env.JWT_SECRET
  const secretKey = createSecretKey(secret, 'utf-8')

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN || '1d')
    .sign(secretKey)
}

export const verifyJWTToken = async (token: string) => {
  const secretKey = createSecretKey(env.JWT_SECRET, 'utf-8')
  const { payload } = await jwtVerify(token, secretKey)

  return jwtTokenPayloadSchema.parse(payload)
}
