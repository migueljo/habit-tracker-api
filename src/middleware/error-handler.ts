import type { NextFunction, Request, Response } from 'express'
import env from '../../env.ts'

export const errorHandler = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error('Error handler middleware', error)

  let status = 'status' in error ? (error.status as number) : 500
  let message = error.message || 'Internal Error'

  if (error.name === 'ValidationError') {
    status = 400
    message = 'Validation Error'
  }

  if (error.name === 'UnauthorizedError') {
    status = 401
    message = 'Unauthorized'
  }

  return res.status(status).json({
    message,
    ...(env.APP_STAGE === 'development'
      ? { stack: error.stack, details: error.message }
      : {}),
  })
}
