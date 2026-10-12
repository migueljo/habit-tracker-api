import {
  createTestUser,
  createTestHabit,
  cleanupDatabase,
} from './db-helpers.ts'

describe('Test setup', () => {
  test('Should connect to the test DB', async () => {
    const { user, token } = await createTestUser()

    expect(user).toBeDefined()
    await cleanupDatabase()
  })
})
