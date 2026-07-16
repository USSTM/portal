import { z } from 'zod'

const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)

const eventDetailsInput = z.object({
  address: z.string().trim().min(1).max(300),
  description: z.string().trim().min(10).max(1000),
  endAt: localDateTime,
  location: z.string().trim().min(1).max(200),
  startAt: localDateTime,
  title: z.string().trim().min(3).max(100),
})

export const eventInput = eventDateTimeInput(
  eventDetailsInput.extend({ owningClubId: z.string().uuid() }),
)

export const eventEditInput = eventDateTimeInput(
  eventDetailsInput.extend({
    eventId: z.string().uuid(),
    updatedAt: z
      .string()
      .datetime({ offset: true })
      .transform((value) => new Date(value)),
  }),
)

function eventDateTimeInput<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema
    .superRefine((data, context) => {
      const startAt = torontoLocalDateTime(String(data.startAt))
      const endAt = torontoLocalDateTime(String(data.endAt))
      if (!startAt) {
        context.addIssue({
          code: 'custom',
          message: 'Start must be a valid Toronto-local date and time.',
          path: ['startAt'],
        })
      }
      if (!endAt) {
        context.addIssue({
          code: 'custom',
          message: 'End must be a valid Toronto-local date and time.',
          path: ['endAt'],
        })
      }
      if (
        startAt &&
        endAt &&
        endAt.getTime() - startAt.getTime() < 60 * 60 * 1000
      ) {
        context.addIssue({
          code: 'custom',
          message: 'An Event must be at least one hour long.',
          path: ['endAt'],
        })
      }
    })
    .transform((data) => ({
      ...data,
      endAt: torontoLocalDateTime(String(data.endAt))!,
      startAt: torontoLocalDateTime(String(data.startAt))!,
    }))
}

export function torontoLocalDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return undefined
  const [, year, month, day, hour, minute] = match
  const localAsUtc = Date.UTC(+year, +month - 1, +day, +hour, +minute)
  let timestamp = localAsUtc

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = torontoFormatter.formatToParts(new Date(timestamp))
    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, part.value]),
    )
    const formattedAsUtc = Date.UTC(
      +values.year,
      +values.month - 1,
      +values.day,
      +values.hour,
      +values.minute,
    )
    timestamp += localAsUtc - formattedAsUtc
  }

  const date = new Date(timestamp)
  return formatTorontoDateTime(date) === value ? date : undefined
}

function formatTorontoDateTime(date: Date) {
  const values = Object.fromEntries(
    torontoFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

const torontoFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  month: '2-digit',
  timeZone: 'America/Toronto',
  year: 'numeric',
})
