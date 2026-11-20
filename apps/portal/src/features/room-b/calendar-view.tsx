import { Link } from '@tanstack/react-router'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldAlert,
  UserPlus,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { torontoLocalDateTime } from '../office-hours/time'
import type { getRoomBBookingContext } from './bookings'
import type { getRoomBCalendar } from './calendar'
import type {
  RoomBBookingInput,
  RoomBOwner,
  RoomBOverwriteInput,
} from './policy'

type Calendar = Awaited<ReturnType<typeof getRoomBCalendar>>
type BookingContext = Awaited<ReturnType<typeof getRoomBBookingContext>>

export interface RoomBCalendarViewProps {
  readOnly?: boolean
  displayView?: 'day' | 'week'
  focusDate?: string
  toolbar?: ReactNode
  calendar: Calendar
  bookingContext: BookingContext | null
  contextUnavailable?: boolean
  initialNow: string
  onBook?: (input: RoomBBookingInput) => Promise<unknown>
  onCancel?: (bookingId: string) => Promise<unknown>
  onOverwrite?: (input: RoomBOverwriteInput) => Promise<unknown>
  onRefresh: () => Promise<unknown>
}

const buttonClass =
  'rounded-md border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50'

export function RoomBCalendarView({
  readOnly = false,
  displayView,
  focusDate,
  toolbar,
  calendar,
  bookingContext: suppliedBookingContext,
  contextUnavailable = false,
  initialNow,
  onBook,
  onCancel,
  onOverwrite,
  onRefresh,
}: RoomBCalendarViewProps) {
  const bookingContext = readOnly ? null : suppliedBookingContext
  const [now, setNow] = useState(() => Date.parse(initialNow))
  const [selectedDay, setSelectedDay] = useState<string>()
  const [ownerKey, setOwnerKey] = useState('')
  const [pendingKey, setPendingKey] = useState<string>()
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()
  const [overwriteChoice, setOverwriteChoice] = useState<string>()
  const saving = useRef(false)
  const pending = pendingKey !== undefined
  const today = torontoDateFormatter.format(new Date(now))
  const mobileDay =
    calendar.days.find((day) => day.date === selectedDay)?.date ??
    calendar.days.find((day) => day.date === today)?.date ??
    calendar.days.at(0)?.date

  useEffect(() => {
    setNow(Date.parse(initialNow))
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [initialNow])

  const owners = bookingContext?.owners ?? []
  const defaultKey = bookingContext?.defaultOwner
    ? ownerValue(bookingContext.defaultOwner)
    : ''
  const selectedOwner =
    owners.find((option) => ownerValue(option.owner) === ownerKey) ??
    owners.find((option) => ownerValue(option.owner) === defaultKey) ??
    (owners.length === 1 ? owners.at(0) : undefined)
  const isAdministrator = bookingContext?.isAdministrator ?? false
  const isOverride =
    isAdministrator &&
    selectedOwner !== undefined &&
    ownerValue(selectedOwner.owner) !== defaultKey
  const visibleDays = calendar.days.filter(
    (day) => displayView !== 'day' || day.date === (focusDate ?? mobileDay),
  )
  const canBookWeek =
    calendar.week === calendar.currentWeek ||
    calendar.week === calendar.nextBookableWeek
  const isFuture = (date: string, hour: number) => {
    const start = torontoLocalDateTime(
      `${date}T${String(hour).padStart(2, '0')}:00`,
    )
    return start !== undefined && start.getTime() > now
  }

  async function mutate(
    key: string,
    operation: () => Promise<unknown>,
    message: string,
    refreshAfter = true,
  ) {
    if (saving.current) return
    saving.current = true
    setPendingKey(key)
    setError(undefined)
    setSuccess(undefined)
    try {
      await operation()
      setSuccess(message)
      if (refreshAfter) {
        try {
          await onRefresh()
        } catch {
          setError(
            'Your change was saved, but the calendar could not refresh. Refresh the page to see the latest bookings.',
          )
        }
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to save this booking. Please try again.',
      )
    } finally {
      saving.current = false
      setPendingKey(undefined)
    }
  }

  async function book(date: string, startHour: number) {
    if (!selectedOwner || !onBook) return
    await mutate(
      `book:${date}:${startHour}`,
      () =>
        onBook({
          owner: selectedOwner.owner,
          date,
          startHour,
          endHour: startHour + 1,
        }),
      `Reserved ${formatHour(startHour)}–${formatHour(startHour + 1)} on ${formatDate(date)} for ${selectedOwner.label}.`,
    )
  }

  async function overwrite(bookingId: string) {
    if (!selectedOwner || !onOverwrite) return
    await mutate(
      `overwrite:${bookingId}`,
      () =>
        onOverwrite({ bookingId, owner: selectedOwner.owner, confirmed: true }),
      `Booking replaced for ${selectedOwner.label}.`,
    )
    setOverwriteChoice(undefined)
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1600px] space-y-6 px-4 py-8 [overflow-wrap:anywhere] sm:px-6 sm:py-12">
      <div className="flex min-w-0 flex-col justify-between gap-6 2xl:flex-row 2xl:items-start">
        <div className="min-w-0">
          <Link
            to="/"
            className="mb-1 block text-sm font-medium uppercase tracking-wider text-muted-foreground hover:text-primary"
          >
            USSTM Operations
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            EPH 442B Room Booking
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {displayView === 'day'
              ? formatDate(focusDate ?? mobileDay ?? calendar.week, true)
              : `Week of ${formatDate(calendar.week, true)}`}{' '}
            · Toronto (EST/EDT)
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Monday–Friday, 8 AM–10 PM
          </p>
          {readOnly && (
            <p className="mt-2 text-sm text-muted-foreground">
              Public calendar · View only
            </p>
          )}
        </div>
        <div className="flex w-full min-w-0 flex-wrap items-center gap-3 2xl:w-auto 2xl:justify-end">
          {owners.length > 0 && (owners.length > 1 || isAdministrator) && (
            <div className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-secondary/40 p-1.5 sm:w-auto sm:max-w-sm sm:flex-1 2xl:flex-initial">
              {isAdministrator && (
                <ShieldAlert
                  className="ml-2 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <label htmlFor="room-b-owner" className="sr-only">
                {isAdministrator ? 'Override member' : 'Booking for'}
              </label>
              <select
                id="room-b-owner"
                className="w-full min-w-0 max-w-full flex-1 cursor-pointer truncate rounded-md bg-transparent py-1.5 pl-2 pr-6 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                value={selectedOwner ? ownerValue(selectedOwner.owner) : ''}
                disabled={pending}
                onChange={(event) => {
                  setOwnerKey(event.currentTarget.value)
                  setError(undefined)
                  setSuccess(undefined)
                  setOverwriteChoice(undefined)
                }}
              >
                <option value="" disabled>
                  {isAdministrator
                    ? 'Admin: Select Override Member…'
                    : 'Choose who to book for…'}
                </option>
                {owners.some((option) => option.owner.kind === 'club') && (
                  <optgroup label="Clubs">
                    {owners
                      .filter((option) => option.owner.kind === 'club')
                      .map((option) => (
                        <option
                          key={ownerValue(option.owner)}
                          value={ownerValue(option.owner)}
                        >
                          {option.label}
                        </option>
                      ))}
                  </optgroup>
                )}
                {owners.some(
                  (option) => option.owner.kind === 'boardMember',
                ) && (
                  <optgroup label="Board members">
                    {owners
                      .filter((option) => option.owner.kind === 'boardMember')
                      .map((option) => (
                        <option
                          key={ownerValue(option.owner)}
                          value={ownerValue(option.owner)}
                        >
                          {ownerValue(option.owner) === defaultKey
                            ? 'Myself — '
                            : ''}
                          {option.label} ({option.boardPosition})
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}
          {toolbar ?? (
            <nav
              aria-label="EPH 442B calendar weeks"
              className="flex w-fit max-w-full flex-wrap items-center rounded-lg border border-border bg-card p-1 shadow-sm"
            >
              <Link
                to="/room-b"
                search={{ week: addDays(calendar.week, -7) }}
                aria-label="Previous week"
                className="rounded-md p-2 text-muted-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                to="/room-b"
                search={{ week: calendar.currentWeek }}
                className="rounded-md px-4 py-2 text-sm font-medium hover:bg-secondary"
              >
                Current
              </Link>
              <Link
                to="/room-b"
                search={{ week: addDays(calendar.week, 7) }}
                aria-label="Next week"
                className="rounded-md p-2 text-muted-foreground hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  void mutate(
                    'refresh',
                    onRefresh,
                    'Calendar refreshed.',
                    false,
                  )
                }
                className="ml-1 rounded-md border-l border-border px-3 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                Refresh
              </button>
            </nav>
          )}
        </div>
      </div>

      {!readOnly && contextUnavailable && (
        <div
          role="alert"
          className="rounded-xl border border-border bg-card p-4 text-sm"
        >
          <p>
            Booking controls are unavailable for your current access, or could
            not load. You can still view the calendar.
          </p>
          <button
            type="button"
            disabled={pending}
            className={`${buttonClass} mt-3 border-border hover:bg-secondary`}
            onClick={() =>
              void mutate('refresh', onRefresh, 'Calendar refreshed.', false)
            }
          >
            Try again
          </button>
        </div>
      )}
      {bookingContext && owners.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Your current access does not include EPH 442B room bookings.
        </p>
      )}
      {selectedOwner && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Booking for {selectedOwner.label}
          </span>
          {' · '}
          {selectedOwner.unlimited
            ? 'No hourly limit'
            : `${selectedOwner.weeklyHoursRemaining} of 6 weekly hours remaining`}
        </p>
      )}
      {owners.length > 1 && !selectedOwner && (
        <p className="text-sm text-muted-foreground">
          {isAdministrator
            ? 'Select an override member or club, then book an available hour in the calendar.'
            : 'Choose who you are booking for, then book an available hour in the calendar.'}
        </p>
      )}
      {owners.length > 0 && !canBookWeek && (
        <p className="text-sm text-muted-foreground">
          Reservations are available for the current week and next week. You can
          browse other weeks using the calendar.
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}
      {success && (
        <p
          role="status"
          className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
        >
          {success}
        </p>
      )}

      {!displayView && (
        <label className="flex min-w-0 flex-col gap-1.5 md:hidden">
          <span className="text-sm font-medium text-muted-foreground">Day</span>
          <select
            className="w-full min-w-0 rounded-lg border border-border bg-card px-3 py-2 text-base font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            value={mobileDay}
            onChange={(event) => {
              setSelectedDay(event.currentTarget.value)
              setOverwriteChoice(undefined)
            }}
          >
            {calendar.days.map((day) => (
              <option key={day.date} value={day.date}>
                {day.label}, {formatDate(day.date)}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="w-full min-w-0 pb-3">
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]">
          {visibleDays.map((day) => {
            const balance = selectedOwner?.days.find(
              (value) => value.date === day.date,
            )
            const withinQuota =
              selectedOwner?.unlimited ||
              ((balance?.hoursRemaining ?? 0) > 0 &&
                (selectedOwner?.weeklyHoursRemaining ?? 0) > 0)
            return (
              <section
                key={day.date}
                aria-label={`${day.label}, ${formatDate(day.date)}`}
                className={`${displayView || day.date === mobileDay ? 'flex' : 'hidden md:flex'} min-w-0 flex-col gap-4`}
              >
                <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
                  <h2 className="text-lg font-bold text-foreground">
                    {day.label}
                  </h2>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                    {formatDate(day.date)}
                  </p>
                  {selectedOwner && !selectedOwner.unlimited && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {balance?.hoursRemaining ?? 0} of 2 daily hours remaining
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  {day.slots.length === 0 && (
                    <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                      Outside booking hours. Room bookings are Monday–Friday.
                    </p>
                  )}
                  {day.slots.map((slot) => {
                    const cancellable =
                      bookingContext?.cancellableBookings.find(
                        (booking) =>
                          booking.date === day.date &&
                          booking.startHour === slot.startHour,
                      )
                    const future = isFuture(day.date, slot.startHour)
                    const key = `book:${day.date}:${slot.startHour}`
                    const slotLabel = `${day.label}, ${formatDate(day.date)}, ${formatHour(slot.startHour)}–${formatHour(slot.endHour)}`
                    return (
                      <div
                        key={slot.startHour}
                        className={`rounded-xl border p-4 transition-colors ${cancellable ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'} ${future ? '' : 'opacity-65'}`}
                      >
                        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                          <Clock
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                          />
                          {formatHour(slot.startHour)} –{' '}
                          {formatHour(slot.endHour)}
                        </p>
                        <div className="mb-4 min-h-10">
                          {slot.booking ? (
                            <div className="break-words rounded-md border border-border bg-secondary/40 px-2.5 py-1.5">
                              <p className="text-sm font-medium">
                                {slot.booking.ownerLabel}
                              </p>
                              {slot.booking.boardPosition && (
                                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {slot.booking.boardPosition}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs italic text-muted-foreground">
                              {future ? 'Available' : 'Not booked'}
                            </p>
                          )}
                        </div>
                        {slot.booking && cancellable && future && onCancel && (
                          <button
                            type="button"
                            disabled={pending}
                            className={`${buttonClass} w-full border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20`}
                            aria-label={`${isAdministrator ? 'Delete' : 'Cancel'} booking for ${slot.booking.ownerLabel}: ${slotLabel}`}
                            onClick={() =>
                              void mutate(
                                `cancel:${cancellable.id}`,
                                () => onCancel(cancellable.id),
                                `${isAdministrator ? 'Deleted' : 'Cancelled'} ${formatHour(slot.startHour)}–${formatHour(slot.endHour)} on ${formatDate(day.date)}.`,
                              )
                            }
                          >
                            {pendingKey === `cancel:${cancellable.id}`
                              ? isAdministrator
                                ? 'Deleting…'
                                : 'Cancelling…'
                              : isAdministrator
                                ? 'Delete booking'
                                : 'Cancel booking'}
                          </button>
                        )}
                        {slot.booking &&
                          cancellable &&
                          future &&
                          canBookWeek &&
                          isAdministrator &&
                          selectedOwner &&
                          onOverwrite &&
                          (overwriteChoice === cancellable.id ? (
                            <div
                              role="group"
                              aria-label={`Confirm overwrite: ${slotLabel}`}
                              className="mt-2 space-y-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs"
                            >
                              <p>
                                Replace {slot.booking.ownerLabel} with{' '}
                                {selectedOwner.label}?
                              </p>
                              <button
                                type="button"
                                disabled={pending}
                                className={`${buttonClass} w-full border-primary/20 bg-primary/10 text-primary hover:bg-primary/20`}
                                onClick={() => void overwrite(cancellable.id)}
                              >
                                {pendingKey === `overwrite:${cancellable.id}`
                                  ? 'Replacing…'
                                  : 'Confirm overwrite'}
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                className={`${buttonClass} w-full border-border hover:bg-secondary`}
                                onClick={() => setOverwriteChoice(undefined)}
                              >
                                Keep booking
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={pending}
                              className={`${buttonClass} mt-2 w-full border-primary/20 bg-primary/10 text-primary hover:bg-primary/20`}
                              aria-label={`Overwrite booking for ${slot.booking.ownerLabel}: ${slotLabel}`}
                              onClick={() => setOverwriteChoice(cancellable.id)}
                            >
                              Overwrite booking
                            </button>
                          ))}
                        {!slot.booking &&
                          selectedOwner &&
                          future &&
                          onBook &&
                          canBookWeek && (
                            <button
                              type="button"
                              disabled={pending || !withinQuota}
                              className={`${buttonClass} flex w-full items-center justify-center gap-1.5 ${isOverride ? 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20' : 'border-border bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                              aria-label={`Book ${slotLabel} for ${selectedOwner.label}`}
                              onClick={() =>
                                void book(day.date, slot.startHour)
                              }
                            >
                              {isOverride && (
                                <UserPlus
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                              )}
                              {pendingKey === key
                                ? 'Booking…'
                                : isOverride
                                  ? 'Add Override'
                                  : 'Book Room'}
                            </button>
                          )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {readOnly
          ? 'Public schedule · View only. Sign in to manage room bookings.'
          : 'Book each hour directly in the calendar. Club allowances are shared across representatives. Cancel future bookings to release the room and restore the owner’s allowance.'}
      </p>
    </main>
  )
}

function ownerValue(owner: RoomBOwner) {
  return owner.kind === 'club'
    ? `club:${owner.clubId}`
    : `boardMember:${owner.memberId}`
}
function addDays(date: string, count: number) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + count)
  return value.toISOString().slice(0, 10)
}
function formatDate(date: string, includeYear = false) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
    year: includeYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}
function formatHour(hour: number) {
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`
}

const torontoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'America/Toronto',
  year: 'numeric',
})
