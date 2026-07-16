import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'
import { ChevronLeft, ChevronRight, Calendar, UserPlus, X, Clock, ShieldAlert } from 'lucide-react'

import {
  cancelOwnBookingAction,
  cancelOverrideBookingAction,
  createOwnBookingAction,
  createOverrideBookingAction,
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
  const createOverrideBooking = useServerFn(createOverrideBookingAction)
  const cancelOverrideBooking = useServerFn(cancelOverrideBookingAction)
  const [pending, setPending] = useState<string>()
  const [error, setError] = useState<string>()
  const [overrideMemberId, setOverrideMemberId] = useState('')
  const previousWeek = addDays(calendar.week, -7)
  const nextWeek = addDays(calendar.week, 7)

  return (
    <main className="mx-auto max-w-[1400px] space-y-8 px-4 py-8 sm:px-6 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">USSTM Operations</p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Office Hours</h1>
          <p className="mt-2 text-muted-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Week of {formatDate(calendar.week)} · All times in Toronto (EST/EDT)
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
          {/* Override Select */}
          {calendar.canOverrideBookings && (
            <div className="flex items-center gap-2 bg-secondary/40 p-1.5 rounded-lg border border-border">
              <ShieldAlert className="w-4 h-4 text-muted-foreground ml-2" />
              <select
                className="bg-transparent border-none text-sm font-medium focus:ring-0 text-foreground cursor-pointer py-1 pl-1 pr-8"
                onChange={(event) => setOverrideMemberId(event.currentTarget.value)}
                value={overrideMemberId}
              >
                <option value="">Admin: Select Override Member...</option>
                {calendar.overrideMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName} ({member.boardPosition})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Week Navigation */}
          <div className="flex items-center bg-card border border-border rounded-lg shadow-sm p-1">
            <Link 
              search={{ week: previousWeek }} 
              to="/office-hours"
              className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <Link 
              search={{ week: calendar.currentWeek }} 
              to="/office-hours"
              className="px-4 py-2 rounded-md hover:bg-secondary text-sm font-medium text-foreground transition-colors mx-1"
            >
              Current
            </Link>
            <Link 
              search={{ week: nextWeek }} 
              to="/office-hours"
              className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      ) : null}

      {/* Grid container: 1 col on mobile, 5 cols on lg+ */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 items-start">
        {calendar.days.map((day) => (
          <section className="flex flex-col gap-4" key={day.date}>
            {/* Day Header */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm text-center">
              <h2 className="font-bold text-lg text-foreground">{day.label}</h2>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">{formatDate(day.date)}</p>
            </div>

            {/* Shifts */}
            <div className="flex flex-col gap-3">
              {day.shifts.map((shift) => {
                const isMyBooking = shift.bookings.find((booking) => booking.ownBookingId)
                const hasBookings = shift.bookings.length > 0

                return (
                  <div className={`rounded-xl border p-4 transition-colors ${isMyBooking ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}`} key={shift.id}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-sm flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                      </p>
                    </div>

                    {/* Bookings List */}
                    <div className="space-y-2 mb-4 min-h-[40px]">
                      {hasBookings ? (
                        shift.bookings.map((booking) => (
                          <div 
                            key={`${booking.displayName}-${booking.boardPosition}`}
                            className="flex items-center justify-between bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 group"
                          >
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm font-medium truncate" title={booking.displayName}>{booking.displayName}</span>
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate" title={booking.boardPosition}>{booking.boardPosition}</span>
                            </div>
                            
                            {/* Override Cancel Action */}
                            {calendar.canOverrideBookings && booking.overrideBookingId && (
                              <button
                                onClick={async () => {
                                  if (!booking.overrideBookingId) return
                                  try {
                                    await cancelOverrideBooking({
                                      data: { bookingId: booking.overrideBookingId },
                                    })
                                    setError(undefined)
                                    await queryClient.invalidateQueries()
                                    await router.invalidate()
                                  } catch (caught) {
                                    setError(caught instanceof Error ? caught.message : 'Unable to cancel Booking override.')
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                                title="Cancel override booking"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center text-xs text-muted-foreground italic px-1">
                          Available
                        </div>
                      )}
                    </div>

                    {/* Personal Booking Actions */}
                    {calendar.canManageBookings && (
                      isMyBooking ? (
                        <button
                          className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 px-3 py-2 rounded-md text-xs font-medium transition-colors"
                          disabled={pending === shift.id}
                          onClick={async () => {
                            const bookingId = shift.bookings.find((b) => b.ownBookingId)?.ownBookingId
                            if (!bookingId) return
                            setPending(shift.id)
                            try {
                              await cancelBooking({ data: { bookingId } })
                              setError(undefined)
                              await queryClient.invalidateQueries()
                              await router.invalidate()
                            } catch (caught) {
                              setError(caught instanceof Error ? caught.message : 'Unable to cancel this Booking.')
                            } finally {
                              setPending(undefined)
                            }
                          }}
                        >
                          {pending === shift.id ? 'Cancelling…' : 'Cancel My Booking'}
                        </button>
                      ) : (
                        <button
                          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border px-3 py-2 rounded-md text-xs font-medium transition-colors"
                          disabled={pending === shift.id}
                          onClick={async () => {
                            setPending(shift.id)
                            try {
                              await createBooking({ data: { date: day.date, shiftSlotId: shift.id } })
                              setError(undefined)
                              await queryClient.invalidateQueries()
                              await router.invalidate()
                            } catch (caught) {
                              setError(caught instanceof Error ? caught.message : 'Unable to book this Shift.')
                            } finally {
                              setPending(undefined)
                            }
                          }}
                        >
                          {pending === shift.id ? 'Booking…' : 'Book Shift'}
                        </button>
                      )
                    )}

                    {/* Override Booking Action */}
                    {calendar.canOverrideBookings && overrideMemberId && (
                       <button
                       className="w-full mt-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 px-3 py-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                       disabled={pending === `${day.date}-${shift.id}`}
                       onClick={async () => {
                         const pendingKey = `${day.date}-${shift.id}`
                         setPending(pendingKey)
                         try {
                           await createOverrideBooking({
                             data: {
                               date: day.date,
                               memberId: overrideMemberId,
                               shiftSlotId: shift.id,
                             },
                           })
                           setError(undefined)
                           await queryClient.invalidateQueries()
                           await router.invalidate()
                         } catch (caught) {
                           setError(caught instanceof Error ? caught.message : 'Unable to create Booking override.')
                         } finally {
                           setPending(undefined)
                         }
                       }}
                     >
                       <UserPlus className="w-3.5 h-3.5" />
                       {pending === `${day.date}-${shift.id}` ? 'Adding…' : 'Add Override'}
                     </button>
                    )}
                  </div>
                )
              })}
            </div>
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
