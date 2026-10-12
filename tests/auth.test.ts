import supertest from 'supertest'

import app from '../src/server.ts'
import {
  createTestHabit,
  cleanupDatabase,
  createTestUser,
} from './setup/db-helpers.ts'
import type { NewUser } from '../src/db/schema.ts'

describe('Authentication endpoints', async () => {
  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData: NewUser = {
        email: 'testuser@gmail.com',
        password: 'testpassword',
        username: 'testuser',
      }
      const response = await supertest(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user).not.toHaveProperty('password')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const testUser = await createTestUser()
      const credentials = {
        email: testUser.user.email,
        password: testUser.rawPassword,
      }

      const response = await supertest(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(201)

      expect(response.body).toHaveProperty('message')
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user).not.toHaveProperty('password')
    })
  })
})
