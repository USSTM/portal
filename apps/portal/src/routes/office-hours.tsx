import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'

import {
  cancelOwnBookingAction,
  createOwnBookingAction,
  getOfficeHoursCalendarAction,
} from '../features/office-hours/calendar-actions'
import { addDays } from '../features/office-hours/calendar'

const searchSchema = z.object({ week: z.string().optional() })

export const Route = createFileRoute('/office-hours')({
  component: OfficeHours,
  loader: ({ deps }) => getOfficeHoursCalendarAction({ data: deps }),
  loaderDeps: ({ search }) => searchSchema.parse(search),
  validateSearch: searchSchema,
})

function OfficeHours() {
  const calendar = Route.useLoaderData()
  const router = useRouter()
  const queryClient = useQueryClient()
  const createBooking = useServerFn(createOwnBookingAction)
  const cancelBooking = useServerFn(cancelOwnBookingAction)
  const [pending, setPending] = useState<string>()
  const [error, setError] = useState<string>()
  const previousWeek = addDays(calendar.week, -7)
  const nextWeek = addDays(calendar.week, 7)

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <p className="text-sm font-medium text-muted-foreground">USSTM</p>
        <h1 className="text-3xl font-semibold tracking-tight">Office Hours</h1>
        <p className="mt-1 text-muted-foreground">
          Week of {formatDate(calendar.week)}. All times are Toronto time.
        </p>
      </div>
      <nav aria-label="Office Hours week" className="flex flex-wrap gap-3">
        <Link search={{ week: previousWeek }} to="/office-hours">
          Previous week
        </Link>
        <Link search={{ week: calendar.currentWeek }} to="/office-hours">
          Current week
        </Link>
        <Link search={{ week: nextWeek }} to="/office-hours">
          Next week
        </Link>
      </nav>
      {error ? <p role="alert">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-5">
        {calendar.days.map((day) => (
          <section className="rounded-lg border bg-card p-4" key={day.date}>
            <h2 className="font-semibold">{day.label}</h2>
            <p className="text-sm text-muted-foreground">
              {formatDate(day.date)}
            </p>
            <ul className="mt-4 space-y-3">
              {day.shifts.map((shift) => (
                <li className="border-t pt-3" key={shift.id}>
                  <p className="font-medium">
                    {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                  </p>
                  {shift.bookings.length > 0 ? (
                    <ul className="mt-1 text-sm text-muted-foreground">
                      {shift.bookings.map((booking) => (
                        <li
                          key={`${booking.displayName}-${booking.boardPosition}`}
                        >
                          {booking.displayName} · {booking.boardPosition}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      No bookings
                    </p>
                  )}
                  {calendar.canManageBookings ? (
                    shift.bookings.find((booking) => booking.ownBookingId) ? (
                      <button
                        className="mt-2"
                        disabled={pending === shift.id}
                        onClick={async () => {
                          const bookingId = shift.bookings.find(
                            (booking) => booking.ownBookingId,
                          )?.ownBookingId
                          if (!bookingId) return
                          setPending(shift.id)
                          try {
                            await cancelBooking({ data: { bookingId } })
                            setError(undefined)
                            await queryClient.invalidateQueries()
                            await router.invalidate()
                          } catch (caught) {
                            setError(
                              caught instanceof Error
                                ? caught.message
                                : 'Unable to cancel this Booking.',
                            )
                          } finally {
                            setPending(undefined)
                          }
                        }}
                        type="button"
                      >
                        {pending === shift.id
                          ? 'Cancelling…'
                          : 'Cancel my Booking'}
                      </button>
                    ) : (
                      <button
                        className="mt-2"
                        disabled={pending === shift.id}
                        onClick={async () => {
                          setPending(shift.id)
                          try {
                            await createBooking({
                              data: { date: day.date, shiftSlotId: shift.id },
                            })
                            setError(undefined)
                            await queryClient.invalidateQueries()
                            await router.invalidate()
                          } catch (caught) {
                            setError(
                              caught instanceof Error
                                ? caught.message
                                : 'Unable to book this Shift.',
                            )
                          } finally {
                            setPending(undefined)
                          }
                        }}
                        type="button"
                      >
                        {pending === shift.id ? 'Booking…' : 'Book this Shift'}
                      </button>
                    )
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00Z`))
}

function formatTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return new Intl.DateTimeFormat('en-CA', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2026, 0, 1, hour, minute)))
}
