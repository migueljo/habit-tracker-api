import { Router } from 'express'
import { validateBody, validateParams } from '../middleware/validation.ts'
import z from 'zod'

import { authenticateToken } from '../middleware/auth.ts'
import {
  createHabit,
  getUserHabits,
  updateHabit,
} from '../controllers/habits-controller.ts'
import { createHabitSchema } from '../schemas/habits-schema.ts'

const habitsRouter = Router()

habitsRouter.use(authenticateToken)

habitsRouter.get('/', getUserHabits)

habitsRouter.get('/:id', (req, res) => {
  res.json({ message: `Here's habit with id ${req.params.id}` })
})

habitsRouter.post('/', validateBody(createHabitSchema), createHabit)

const updateHabitSchemaBody = createHabitSchema.partial()
const updateHabitSchemaParams = z.object({
  id: z.uuid(),
})
habitsRouter.patch(
  '/:id',
  validateBody(updateHabitSchemaBody),
  validateParams(updateHabitSchemaParams),
  updateHabit,
)

habitsRouter.delete('/:id', (req, res) => {
  res.status(200).json({
    message: `Habit with id ${req.params.id} has been deleted`,
  })
})

habitsRouter.post('/:id/complete', (req, res) => {
  res.json({ message: `Habit with id ${req.params.id} completed` })
})

export default habitsRouter
