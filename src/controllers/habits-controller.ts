import { type Response } from 'express'
import { and, desc, eq } from 'drizzle-orm'

import type { AuthenticatedRequest } from '../middleware/auth.ts'
import db from '../db/connection.ts'
import { habits, habitTags } from '../db/schema.ts'
import type { CreateHabitSchema } from '../schemas/habits-schema.ts'

export const createHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tagIds, ...habit }: CreateHabitSchema = req.body

    const newHabit = await db.transaction(async (tx) => {
      const [newHabit] = await tx
        .insert(habits)
        .values({
          userId: req.user!.id,
          ...habit,
        })
        .returning()

      if (tagIds && tagIds.length > 0) {
        const habitTagValues = tagIds.map((tagId: string) => ({
          habitId: newHabit.id,
          tagId,
        }))
        await tx.insert(habitTags).values(habitTagValues)
      }
      console.log('createHabit()', newHabit)

      return newHabit
    })

    return res.status(201).json({ message: 'Habit created', habit: newHabit })
  } catch (error) {
    console.error('Error creating habit', JSON.stringify(error, null, 2))
    res.status(500).json({ error: 'Error creating habit' })
  }
}

export const getUserHabits = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userHabitsWithTags = await db.query.habits.findMany({
      where: eq(habits.userId, req.user!.id),
      with: {
        habitsTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(habits.createdAt)],
    })
    const habitsWithTags = userHabitsWithTags.map((habit) => ({
      ...habit,
      tags: habit.habitsTags.map((habitTag) => habitTag.tag),
      habitsTags: undefined,
    }))

    return res.status(200).json({ habits: habitsWithTags })
  } catch (error) {
    console.error('Getting user habits error', JSON.stringify(error, null, 2))
    return res.status(500).json({ error: 'Error getting user habits' })
  }
}

export const updateHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id
    const { tagIds, ...updates } = req.body
    const resultUpdatedHabit = await db.transaction(async (tx) => {
      console.log('updateHabit() begin transaction')
      const [updatedHabit] = await tx
        .update(habits)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(habits.id, id), eq(habits.userId, req.user!.id)))
        .returning()
      console.log('updateHabit() updating habit')

      if (!updatedHabit) {
        return res.status(401).end()
      }

      if (tagIds !== undefined) {
        await tx.delete(habitTags).where(eq(habitTags.habitId, id))

        if (tagIds.length > 0) {
          const habitTagsValues = tagIds.map((tagId: string) => ({
            habitId: id,
            tagId,
          }))
          await tx.insert(habitTags).values(habitTagsValues)
        }
      }
      return updatedHabit
    })
    return res.json({
      message: 'Habit was updated',
      habit: resultUpdatedHabit,
    })
  } catch (error) {
    console.error('Updating user habit error', JSON.stringify(error, null, 2))
    return res.status(500).json({ error: 'Error updating user habit' })
  }
}
