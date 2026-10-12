import z from 'zod'

const uniqueConstraintSchema = z.object({
  cause: z.object({
    code: z.literal('23505'),
    constraint: z.string(),
  }),
})

type PgErrorUniqueConstraint = z.infer<typeof uniqueConstraintSchema>

export function isUniqueViolation(
  error: unknown,
): error is PgErrorUniqueConstraint {
  return uniqueConstraintSchema.safeParse(error).success
}
