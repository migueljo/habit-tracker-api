import { Router } from 'express'
import { authenticateToken } from '../middleware/auth.ts'

export const userRouter = Router()

userRouter.use(authenticateToken)

userRouter.get('/', (req, res) => {
  res.json({ message: 'All users' })
})

userRouter.get('/:id', (req, res) => {
  res.json({ message: `User with id ${req.params.id}` })
})

userRouter.post('/', (req, res) => {
  const { body } = req
  res.status(201).json({ message: 'User created', body })
})

userRouter.patch('/:id', (req, res) => {
  const { body } = req
  res.send({ message: 'User updated', body })
})

userRouter.delete('/:id', (req, res) => {
  res.send({ message: 'User deleted' })
})

export default userRouter
