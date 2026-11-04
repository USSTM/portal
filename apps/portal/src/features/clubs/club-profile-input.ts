import { z } from 'zod'

const optionalText = (schema: z.ZodString) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .pipe(schema.optional())

export const clubProfileInput = z.object({
  clubId: z.string().uuid(),
  contactEmail: optionalText(z.string().email()),
  description: optionalText(z.string().max(1000)),
  instagramHandle: optionalText(
    z
      .string()
      .regex(
        /^@?[A-Za-z0-9._]{1,30}$/,
        'Use an Instagram handle such as usstm',
      ),
  ),
  type: z.enum(['student_group', 'course_union']).optional(),
  websiteUrl: optionalText(
    z.string().url().startsWith('https://', 'Website must start with https://'),
  ),
})
