import type { NextFunction, Request, Response } from 'express'
import { ZodError, ZodType } from 'zod'

function handleZodValidationError(
  error: ZodError,
  errorTitle: string,
  res: Response,
) {
  console.log(JSON.stringify(error, null, 2))
  res.status(400).json({
    error: errorTitle,
    details: error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  })
}

export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = schema.parse(req.body)
      req.body = validatedBody
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        handleZodValidationError(error, 'Body validation error', res)
        return
      }
      next(error)
    }
  }
}

export function validateParams(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        handleZodValidationError(error, 'Params validation error', res)
        return
      }
      next(error)
    }
  }
}

export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        handleZodValidationError(error, 'Query validation error', res)
        return
      }
      next(error)
    }
  }
}
