import { env as loadEnv } from 'custom-env'
import { z } from 'zod'

process.env.APP_STAGE = process.env.APP_STAGE || 'development'

export const isProduction = process.env.APP_STAGE === 'production'
export const isDevelopment = process.env.APP_STAGE === 'development'
export const isTest = process.env.APP_STAGE === 'test'

if (isDevelopment) {
  loadEnv('development')
} else if (isTest) {
  loadEnv('test')
}

console.log('process.env', process.env.DATABASE_URL)

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  APP_STAGE: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().startsWith('postgresql://'),
  // JWT_SECRET: z.string().min(32, 'Must be 32 chars long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(20).default(12),
  JWT_SECRET: z.string(),
})

export type Env = z.infer<typeof envSchema>

let env: Env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('Invalid env var')
    console.error(JSON.stringify(z.treeifyError(error).errors), null, 2)
    error.issues.forEach((issue) => {
      const path = issue.path.join('.')
      console.log(`${path}: ${issue.message}`)
    })

    process.exit(1)
  }

  throw error
}

export { env }
export default env
