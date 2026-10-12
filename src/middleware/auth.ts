import type { NextFunction, Request, Response } from 'express'

import { verifyJWTToken, type JWTTokenPayload } from '../utils/jwt.ts'

export type AuthenticatedRequest = Request & {
  user?: JWTTokenPayload
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ error: 'Bad Request' })
    }

    const payload = await verifyJWTToken(token)
    req.user = payload
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden' })
  }
}
