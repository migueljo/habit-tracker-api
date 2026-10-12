import { Router } from 'express'

import { login, register } from '../controllers/auth-controller.ts'
import { validateBody } from '../middleware/validation.ts'
import { insertUserSchema } from '../db/schema.ts'
import z from 'zod'

export const authRouter = Router()

authRouter.post('/register', validateBody(insertUserSchema), register)

// TODO: Use this inferred type in login function to type body
const loginSchema = z.object({
  email: z.email({ error: "'Invalid email'" }),
  password: z.string().min(1, 'Password is required'),
})
authRouter.post('/login', validateBody(loginSchema), login)

export default authRouter
