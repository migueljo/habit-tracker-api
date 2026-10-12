import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { remember } from '@epic-web/remember'

import * as schema from './schema.ts'
import { env, isProduction } from '../../env.ts'

const createPool = () => {
  return new Pool({
    connectionString: env.DATABASE_URL,
  })
}

let client

if (isProduction) {
  client = createPool()
} else {
  client = remember('dbPool', () => createPool())
}

export const db = drizzle({ client, schema })

export default db
