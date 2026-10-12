import z from 'zod'

export const createHabitSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  frequency: z.string(),
  targetCount: z.int(),
  tagIds: z.array(z.string()).optional(),
})

export type CreateHabitSchema = z.infer<typeof createHabitSchema>
