import db from '../../src/db/connection.ts'
import {
  users,
  habits,
  entries,
  type NewUser,
  type NewHabit,
  tags,
  habitTags,
} from '../../src/db/schema.ts'
import { generateJWTToken } from '../../src/utils/jwt.ts'
import { hashPassword } from '../../src/utils/passwords.ts'

export const createTestUser = async (userData: Partial<NewUser> = {}) => {
  const defaultData = {
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    username: `test-user-${Date.now()}-${Math.random()}`,
    password: 'admin-password1234',
    firstName: 'User',
    lastName: 'Test',
    userData,
  }

  const hashedPassword = await hashPassword(defaultData.password)
  const [user] = await db
    .insert(users)
    .values({
      ...defaultData,
      password: hashedPassword,
    })
    .returning()
  const token = await generateJWTToken({
    id: user.id,
    email: user.email,
    username: user.username,
  })

  return {
    user,
    token,
    rawPassword: defaultData.password,
  }
}

export const createTestHabit = async (
  userId: string,
  habitData: Partial<NewHabit> = {},
) => {
  const defaultData = {
    name: `New Habit ${Date.now()} ${Math.random()}`,
    description: 'A test habit',
    frequency: 'daily',
    targetCount: 1,
    ...habitData,
  }
  const [habit] = await db
    .insert(habits)
    .values({
      frequency: defaultData.frequency,
      name: defaultData.name,
      userId,
      description: defaultData.description,
      targetCount: defaultData.targetCount,
    })
    .returning()

  return habit
}

export const cleanupDatabase = async () => {
  await db.delete(users)
  await db.delete(habits)
  await db.delete(entries)
  await db.delete(tags)
  await db.delete(habitTags)
}
