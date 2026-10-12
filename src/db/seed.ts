import { pathToFileURL } from 'node:url'
import { db } from './connection.ts'
import { users, habits, entries, tags, habitTags } from './schema.ts'

export const seed = async () => {
  console.log('🌱 Starting database seed...')

  try {
    console.log('Clearing existing data...')
    await db.delete(users)
    await db.delete(habits)
    await db.delete(entries)
    await db.delete(tags)
    await db.delete(habitTags)

    console.log('Creating demo users...')
    const [demoUser] = await db
      .insert(users)
      .values({
        email: 'demo@app.com',
        password: 'password',
        username: 'demo',
        firstName: 'Demo',
        lastName: 'Person',
      })
      .returning()

    console.log('Creating tags...')
    const [healthTag] = await db
      .insert(tags)
      .values({
        userId: demoUser.id,
        name: 'health',
        color: '#f0f0f0',
      })
      .returning()
    const [exerciseHabit] = await db
      .insert(habits)
      .values({
        userId: demoUser.id,
        name: 'Exercise',
        description: 'Daily workout',
        frequency: 'daily',
        targetCount: 1,
      })
      .returning()

    await db.insert(habitTags).values({
      habitId: exerciseHabit.id,
      tagId: healthTag.id,
    })

    console.log('Adding completion entries...')
    const today = new Date()
    today.setHours(12, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      let date = new Date(today)
      date.setDate(date.getDate() - i)
      await db.insert(entries).values({
        completionDate: date,
        habitId: exerciseHabit.id,
      })
    }

    console.log('✅ DB seeded successfully')
    console.log('User data:')
    console.log(JSON.stringify(demoUser, null, 2))
  } catch (error) {
    console.error('❌ Seed failed', error)
    process.exit(1)
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export default seed
