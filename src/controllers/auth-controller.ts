import type { Request, Response } from 'express'

import { db } from '../db/connection.ts'
import { users, type NewUser } from '../db/schema.ts'
import { comparePassword, hashPassword } from '../utils/passwords.ts'
import { generateJWTToken } from '../utils/jwt.ts'
import { eq } from 'drizzle-orm'
import { isUniqueViolation } from '../utils/errors.ts'

export const register = async (
  req: Request<any, any, NewUser>,
  res: Response,
) => {
  try {
    const hashedPassword = await hashPassword(req.body.password)
    const [user] = await db
      .insert(users)
      .values({
        ...req.body,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })
    const token = await generateJWTToken({
      id: user.id,
      email: user.email,
      username: user.username,
    })
    res.status(201).json({
      message: 'User created',
      user,
      token,
    })

    return
  } catch (error) {
    console.error('Registration error', JSON.stringify(error, null, 2))

    if (isUniqueViolation(error)) {
      const errors = []
      if (error.cause.constraint === 'users_email_unique') {
        errors.push('email already exists')
      } else if (error.cause.constraint === 'users_username_unique') {
        errors.push('username already exists')
      }
      res.status(409).json({ error: errors.join(', ') })
      return
    }

    res.status(500).json({
      error: 'Failed to create user',
    })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const [user] = await db.select().from(users).where(eq(users.email, email))

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isValidPassword = await comparePassword(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = await generateJWTToken({
      email: email,
      id: user.id,
      username: user.username,
    })
    return res.status(201).json({
      message: 'Login success',
      token,
      user: {
        // TODO: Reuse the same object in register()
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.log('Login error', error)
    res.status(500).json({ error: 'Login failed' })
    return
  }
}
