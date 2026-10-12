import express, {
  type NextFunction,
  type Request,
  type Response,
} from 'express'
import userRouter from './routes/user-routes.ts'
import habitsRouter from './routes/habits-routes.ts'
import authRouter from './routes/auth-routes.ts'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { isTest } from '../env.ts'
import { errorHandler } from './middleware/error-handler.ts'

const app = express()

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  morgan('dev', {
    skip: () => isTest,
  }),
)

app.get('/health', (req, res) => {
  res.json({ message: 'hello' }).status(200)
})

app.use('/api/users', userRouter)
app.use('/api/habits', habitsRouter)
app.use('/api/auth', authRouter)

app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400 &&
    'type' in error &&
    error.type === 'entity.parse.failed'
  ) {
    res.status(400).json({ error: 'Invalid JSON body' })
    return
  }
  next(error)
})

app.use(errorHandler)

export { app }

export default app
