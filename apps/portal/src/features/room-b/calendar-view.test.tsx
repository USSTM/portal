// @vitest-environment jsdom
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RoomBCalendarView } from './calendar-view'
import type { RoomBCalendarViewProps } from './calendar-view'

beforeEach(() => vi.spyOn(window, 'scrollTo').mockImplementation(() => {}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const clubId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const memberId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const now = '2030-01-07T12:00:00.000Z'
const week = '2030-01-07'

function props(): RoomBCalendarViewProps {
  const dates = Array.from(
    { length: 5 },
    (_, index) => `2030-01-${String(7 + index).padStart(2, '0')}`,
  )
  return {
    calendar: {
      week,
      currentWeek: week,
      nextBookableWeek: '2030-01-14',
      days: dates.map((date, index) => ({
        date,
        label: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][index],
        slots: Array.from({ length: 14 }, (_, offset) => ({
          startHour: 8 + offset,
          endHour: 9 + offset,
          booking: null,
        })),
      })),
    },
    bookingContext: {
      week,
      isAdministrator: false,
      defaultOwner: null,
      owners: [
        {
          owner: { kind: 'club', clubId },
          label: 'Science Club',
          boardPosition: null,
          unlimited: false,
          weeklyHoursUsed: 0,
          weeklyHoursRemaining: 6,
          days: dates.map((date) => ({
            date,
            hoursUsed: 0,
            hoursRemaining: 2,
          })),
        },
      ],
      cancellableBookings: [],
    },
    initialNow: now,
    onBook: vi.fn().mockResolvedValue([]),
    onCancel: vi.fn().mockResolvedValue({ id: 'booking-1' }),
    onOverwrite: vi.fn().mockResolvedValue({ id: 'replacement-1' }),
    onRefresh: vi.fn().mockResolvedValue(undefined),
  }
}

async function renderCalendar(input: RoomBCalendarViewProps) {
  const root = createRootRoute()
  const route = createRoute({
    getParentRoute: () => root,
    path: '/room-b',
    component: () => <RoomBCalendarView {...input} />,
  })
  const router = createRouter({
    routeTree: root.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ['/room-b'] }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  await screen.findByRole('heading', {
    name: 'EPH 442B Room Booking',
    level: 1,
  })
  return router
}

function addBoardOwner(input: RoomBCalendarViewProps, unlimited = false) {
  const context = input.bookingContext!
  context.owners.push({
    ...context.owners[0],
    owner: { kind: 'boardMember', memberId },
    label: 'Alex',
    boardPosition: 'Director',
    unlimited,
    weeklyHoursRemaining: unlimited ? null : 6,
  })
}

function firstHour(owner = 'Science Club') {
  return screen.getByRole<HTMLButtonElement>('button', {
    name: `Book Monday, Jan 7, 8 AM–9 AM for ${owner}`,
  })
}

describe('Room B calendar', () => {
  it('keeps the public calendar read-only even when administrator context is supplied', async () => {
    const input = props()
    input.readOnly = true
    input.bookingContext!.isAdministrator = true
    input.calendar.days[0].slots[0].booking = {
      ownerLabel: 'Other Club',
      boardPosition: null,
    }
    input.bookingContext!.cancellableBookings = [
      { id: 'booking-1', date: week, startHour: 8 },
    ]
    await renderCalendar(input)
    expect(screen.getByText('Other Club')).toBeTruthy()
    expect(screen.getByText('Public calendar · View only')).toBeTruthy()
    expect(
      screen.queryByRole('combobox', { name: 'Override member' }),
    ).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'Booking for' })).toBeNull()
    expect(
      screen.queryByRole('button', {
        name: /^Book |^Cancel booking|^Delete booking|^Overwrite booking/,
      }),
    ).toBeNull()
    expect(input.onBook).not.toHaveBeenCalled()
    expect(input.onCancel).not.toHaveBeenCalled()
    expect(input.onOverwrite).not.toHaveBeenCalled()
  })

  it.each([
    ['2030-01-08T15:00:00Z', '2030-01-08'], // Tuesday in the displayed week
    ['2030-01-08T02:00:00Z', '2030-01-07'], // Still Monday in Toronto
    ['2030-01-11T15:00:00Z', '2030-01-11'], // Friday
    ['2030-01-06T15:00:00Z', '2030-01-07'], // Weekend before this week
    ['2030-01-14T15:00:00Z', '2030-01-07'], // Viewing an earlier week
  ])('defaults the phone day correctly at %s', async (timestamp, date) => {
    const input = props()
    input.initialNow = timestamp
    await renderCalendar(input)
    const select = screen.getByRole<HTMLSelectElement>('combobox', {
      name: 'Day',
    })
    expect(select.value).toBe(date)
    expect(within(select).getAllByRole('option')).toHaveLength(5)
  })

  it('lets phone users pick a day and book an hour on that date', async () => {
    const input = props()
    await renderCalendar(input)
    const select = screen.getByRole<HTMLSelectElement>('combobox', {
      name: 'Day',
    })
    fireEvent.change(select, { target: { value: '2030-01-08' } })
    expect(select.value).toBe('2030-01-08')
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Book Tuesday, Jan 8, 8 AM–9 AM for Science Club',
      }),
    )
    await waitFor(() =>
      expect(input.onBook).toHaveBeenCalledWith({
        owner: { kind: 'club', clubId },
        date: '2030-01-08',
        startHour: 8,
        endHour: 9,
      }),
    )
    await waitFor(() => expect(input.onRefresh).toHaveBeenCalledOnce())
    expect(select.value).toBe('2030-01-08')
  })

  it('lets administrators confirm an overwrite inside an occupied calendar card', async () => {
    const input = props()
    input.bookingContext!.isAdministrator = true
    input.calendar.days[0].slots[0].booking = {
      ownerLabel: 'Other Club',
      boardPosition: null,
    }
    input.bookingContext!.cancellableBookings = [
      { id: 'booking-1', date: week, startHour: 8 },
    ]
    await renderCalendar(input)
    fireEvent.click(
      screen.getByRole('button', { name: /^Overwrite booking for Other Club/ }),
    )
    expect(input.onOverwrite).not.toHaveBeenCalled()
    const confirmation = screen.getByRole('group', {
      name: /^Confirm overwrite/,
    })
    expect(confirmation.textContent).toContain(
      'Replace Other Club with Science Club?',
    )
    fireEvent.click(
      within(confirmation).getByRole('button', { name: 'Confirm overwrite' }),
    )
    await waitFor(() =>
      expect(input.onOverwrite).toHaveBeenCalledWith({
        bookingId: 'booking-1',
        owner: { kind: 'club', clubId },
        confirmed: true,
      }),
    )
    await waitFor(() => expect(input.onRefresh).toHaveBeenCalledOnce())
    expect(screen.getByRole('status').textContent).toContain('Booking replaced')
  })

  it('allows administrators to delete other owners’ calendar bookings', async () => {
    const input = props()
    input.bookingContext!.isAdministrator = true
    input.calendar.days[0].slots[0].booking = {
      ownerLabel: 'Other Club',
      boardPosition: null,
    }
    input.bookingContext!.cancellableBookings = [
      { id: 'booking-1', date: week, startHour: 8 },
    ]
    await renderCalendar(input)
    fireEvent.click(
      screen.getByRole('button', { name: /^Delete booking for Other Club/ }),
    )
    await waitFor(() =>
      expect(input.onCancel).toHaveBeenCalledWith('booking-1'),
    )
    expect((await screen.findByRole('status')).textContent).toContain('Deleted')
  })

  it('lets signed-in users without booking authority view the calendar', async () => {
    const input = props()
    input.bookingContext!.owners = []
    input.calendar.days[4].slots[13].booking = {
      ownerLabel: 'Other Club',
      boardPosition: null,
    }
    await renderCalendar(input)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5)
    expect(screen.getAllByText('Available')).toHaveLength(69)
    expect(screen.getByText('Other Club')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Sign in to book' })).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'Booking for' })).toBeNull()
    expect(
      screen.queryByRole('button', { name: /^Book |^Cancel booking/ }),
    ).toBeNull()
    expect(document.querySelector('form')).toBeNull()
    expect(
      screen.getByRole('link', { name: 'Next week' }).getAttribute('href'),
    ).toContain('week=2030-01-14')
    expect(
      screen.getByRole('link', { name: 'Previous week' }).getAttribute('href'),
    ).toContain('week=2029-12-31')
  })

  it('books a club hour directly in the calendar and refreshes balances', async () => {
    const input = props()
    await renderCalendar(input)
    expect(firstHour().textContent).toBe('Book Room')
    expect(screen.queryByRole('combobox', { name: 'Date' })).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'Start time' })).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'End time' })).toBeNull()
    fireEvent.click(firstHour())
    await waitFor(() =>
      expect(input.onBook).toHaveBeenCalledWith({
        owner: { kind: 'club', clubId },
        date: week,
        startHour: 8,
        endHour: 9,
      }),
    )
    await waitFor(() => expect(input.onRefresh).toHaveBeenCalledOnce())
    expect(screen.getByRole('status').textContent).toContain(
      'Reserved 8 AM–9 AM',
    )
  })

  it('lets ordinary members choose between their club and personal booking', async () => {
    const input = props()
    addBoardOwner(input)
    await renderCalendar(input)
    const select = screen.getByRole<HTMLSelectElement>('combobox', {
      name: 'Booking for',
    })
    expect(select.value).toBe('')
    expect(screen.queryByRole('button', { name: /^Book Monday/ })).toBeNull()
    fireEvent.change(select, { target: { value: `boardMember:${memberId}` } })
    fireEvent.click(firstHour('Alex'))
    await waitFor(() =>
      expect(input.onBook).toHaveBeenCalledWith({
        owner: { kind: 'boardMember', memberId },
        date: week,
        startHour: 8,
        endHour: 9,
      }),
    )
  })

  it('defaults administrators to themselves and switches to inline override booking', async () => {
    const input = props()
    addBoardOwner(input, true)
    input.bookingContext!.isAdministrator = true
    input.bookingContext!.defaultOwner = { kind: 'boardMember', memberId }
    await renderCalendar(input)
    const select = screen.getByRole<HTMLSelectElement>('combobox', {
      name: 'Override member',
    })
    expect(select.value).toBe(`boardMember:${memberId}`)
    expect(
      within(select).getByRole('option', { name: 'Myself — Alex (Director)' }),
    ).toBeTruthy()
    expect(screen.getByText('No hourly limit', { exact: false })).toBeTruthy()
    expect(firstHour('Alex').textContent).toBe('Book Room')
    fireEvent.click(firstHour('Alex'))
    await waitFor(() =>
      expect(input.onBook).toHaveBeenCalledWith({
        owner: { kind: 'boardMember', memberId },
        date: week,
        startHour: 8,
        endHour: 9,
      }),
    )
    await waitFor(() => expect(input.onRefresh).toHaveBeenCalledOnce())
    fireEvent.change(select, { target: { value: `club:${clubId}` } })
    expect(firstHour().textContent).toBe('Add Override')
    fireEvent.click(firstHour())
    await waitFor(() =>
      expect(input.onBook).toHaveBeenLastCalledWith({
        owner: { kind: 'club', clubId },
        date: week,
        startHour: 8,
        endHour: 9,
      }),
    )
  })

  it('lets the Superuser select an override owner without inventing a personal profile', async () => {
    const input = props()
    addBoardOwner(input)
    input.bookingContext!.isAdministrator = true
    await renderCalendar(input)
    const select = screen.getByRole<HTMLSelectElement>('combobox', {
      name: 'Override member',
    })
    expect(select.value).toBe('')
    expect(screen.queryByRole('option', { name: /^Myself/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Book Monday/ })).toBeNull()
    fireEvent.change(select, { target: { value: `boardMember:${memberId}` } })
    expect(firstHour('Alex').textContent).toBe('Add Override')
    fireEvent.click(firstHour('Alex'))
    await waitFor(() =>
      expect(input.onBook).toHaveBeenCalledWith({
        owner: { kind: 'boardMember', memberId },
        date: week,
        startHour: 8,
        endHour: 9,
      }),
    )
  })

  it('keeps occupied hours unavailable and shows daily balances in the calendar', async () => {
    const input = props()
    input.calendar.days[0].slots[0].booking = {
      ownerLabel: 'Other Club',
      boardPosition: null,
    }
    input.bookingContext!.owners[0].days[0].hoursRemaining = 0
    await renderCalendar(input)
    expect(
      screen.queryByRole('button', {
        name: 'Book Monday, Jan 7, 8 AM–9 AM for Science Club',
      }),
    ).toBeNull()
    expect(
      screen.getByRole<HTMLButtonElement>('button', {
        name: 'Book Monday, Jan 7, 9 AM–10 AM for Science Club',
      }).disabled,
    ).toBe(true)
    expect(
      screen.getByRole<HTMLButtonElement>('button', {
        name: 'Book Tuesday, Jan 8, 8 AM–9 AM for Science Club',
      }).disabled,
    ).toBe(false)
    expect(screen.getByText('0 of 2 daily hours remaining')).toBeTruthy()
  })

  it('disables every booking button when the weekly balance is exhausted', async () => {
    const input = props()
    input.bookingContext!.owners[0].weeklyHoursRemaining = 0
    await renderCalendar(input)
    expect(
      screen.getByText('0 of 6 weekly hours remaining', { exact: false }),
    ).toBeTruthy()
    expect(
      screen
        .getAllByRole<HTMLButtonElement>('button', { name: /^Book / })
        .every((button) => button.disabled),
    ).toBe(true)
  })

  it('offers cancellation only for authorized future reservations', async () => {
    const input = props()
    input.calendar.days[0].slots[0].booking = {
      ownerLabel: 'Science Club',
      boardPosition: null,
    }
    input.calendar.days[0].slots[1].booking = {
      ownerLabel: 'Other Club',
      boardPosition: null,
    }
    input.bookingContext!.cancellableBookings = [
      { id: 'booking-1', date: week, startHour: 8 },
    ]
    await renderCalendar(input)
    expect(
      screen.getAllByRole('button', { name: /^Cancel booking/ }),
    ).toHaveLength(1)
    fireEvent.click(
      screen.getByRole('button', { name: /^Cancel booking for Science Club/ }),
    )
    await waitFor(() =>
      expect(input.onCancel).toHaveBeenCalledWith('booking-1'),
    )
    await waitFor(() => expect(input.onRefresh).toHaveBeenCalledOnce())
    expect(screen.getByRole('status').textContent).toContain(
      'Cancelled 8 AM–9 AM',
    )
  })

  it('hides started-hour actions and prevents booking outside the current/next week', async () => {
    const input = props()
    input.initialNow = '2030-01-07T13:00:00Z'
    await renderCalendar(input)
    expect(
      screen.queryByRole('button', { name: /^Book Monday, Jan 7, 8 AM/ }),
    ).toBeNull()
    cleanup()
    input.calendar.currentWeek = '2030-01-21'
    input.calendar.nextBookableWeek = '2030-01-28'
    await renderCalendar(input)
    expect(screen.queryByRole('button', { name: /^Book / })).toBeNull()
    expect(
      screen.getByText(
        /Reservations are available for the current week and next week/,
      ),
    ).toBeTruthy()
  })

  it('shows save errors and allows retry on the same calendar cell', async () => {
    const input = props()
    input.onBook = vi
      .fn()
      .mockRejectedValue(
        new Error('EPH 442B is already booked for the selected time'),
      )
    await renderCalendar(input)
    fireEvent.click(firstHour())
    expect((await screen.findByRole('alert')).textContent).toContain(
      'already booked',
    )
    expect(screen.queryByRole('status')).toBeNull()
    expect(input.onRefresh).not.toHaveBeenCalled()
    expect(firstHour().disabled).toBe(false)
  })

  it('prevents duplicate bookings while the clicked calendar cell is saving', async () => {
    const input = props()
    let complete!: () => void
    input.onBook = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve
        }),
    )
    await renderCalendar(input)
    fireEvent.click(firstHour())
    expect(firstHour().textContent).toBe('Booking…')
    expect(firstHour().disabled).toBe(true)
    fireEvent.click(firstHour())
    expect(input.onBook).toHaveBeenCalledOnce()
    await act(async () => complete())
    await waitFor(() => expect(input.onRefresh).toHaveBeenCalledOnce())
  })

  it('distinguishes a saved booking from a failed calendar refresh', async () => {
    const input = props()
    input.onRefresh = vi.fn().mockRejectedValue(new Error('Offline'))
    await renderCalendar(input)
    fireEvent.click(firstHour())
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Your change was saved',
    )
    expect(screen.getByRole('status').textContent).toContain('Reserved')
    expect(input.onBook).toHaveBeenCalledOnce()
  })

  it('keeps the authenticated calendar available if booking controls fail', async () => {
    const input = props()
    input.bookingContext = null
    input.contextUnavailable = true
    await renderCalendar(input)
    expect(screen.getAllByText('Available')).toHaveLength(70)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(input.onRefresh).toHaveBeenCalledOnce())
  })
})
