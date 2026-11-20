// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from '@tanstack/react-router'
import { RoomBScheduleBrowser } from './schedule-browser'
import { scheduleDates } from './schedule-dates'
import type { RoomBScheduleBrowserProps } from './schedule-browser'

async function show(
  view?: 'day' | 'week' | 'month',
  phone = false,
  date = '2030-01-09',
) {
  vi.stubGlobal('matchMedia', () => ({
    matches: phone,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const props: RoomBScheduleBrowserProps = {
    date,
    requestedView: view,
    onNavigate: vi.fn(),
    bookingContext: null,
    initialNow: '2030-01-09T12:00:00Z',
    onBook: vi.fn(),
    onCancel: vi.fn(),
    onOverwrite: vi.fn(),
    onRefresh: vi.fn(),
    calendar: {
      week: '2030-01-07',
      currentWeek: '2030-01-07',
      nextBookableWeek: '2030-01-14',
      days: scheduleDates(date, view ?? 'week').map((value) => ({
        date: value,
        label: new Intl.DateTimeFormat('en-CA', {
          weekday: 'long',
          timeZone: 'UTC',
        }).format(new Date(`${value}T12:00:00Z`)),
        slots: [],
      })),
    },
  }
  const root = createRootRoute()
  const route = createRoute({
    getParentRoute: () => root,
    path: '/room-b',
    component: () => <RoomBScheduleBrowser {...props} />,
  })
  const router = createRouter({
    routeTree: root.addChildren([route]),
    history: createMemoryHistory({ initialEntries: ['/room-b'] }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  await screen.findByRole('heading', { name: 'EPH 442B Room Booking' })
  return props
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('schedule browser', () => {
  it.each([true, false])(
    'defaults appropriately for phone=%s and permits changing views',
    async (phone) => {
      const props = await show(undefined, phone)
      const group = screen.getByRole('group', { name: 'Calendar view' })
      expect(
        within(group)
          .getByRole('button', { name: phone ? 'Day' : 'Week' })
          .getAttribute('aria-pressed'),
      ).toBe('true')
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(
        phone ? 1 : 5,
      )
      fireEvent.click(within(group).getByRole('button', { name: 'Month' }))
      expect(props.onNavigate).toHaveBeenCalledWith('2030-01-09', 'month')
    },
  )
  it('honors explicit week view on phones', async () => {
    await show('week', true)
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(5)
  })
  it('opens a month date as its full day schedule and navigates months safely', async () => {
    const props = await show('month', false, '2030-01-31')
    fireEvent.click(
      screen.getByRole('button', {
        name: 'View schedule for Monday, January 7, 2030',
      }),
    )
    expect(props.onNavigate).toHaveBeenCalledWith('2030-01-07', 'day')
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(props.onNavigate).toHaveBeenCalledWith('2030-02-28', 'month')
  })
  it('lets users return to today and jump to a past date', async () => {
    const props = await show('day')
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    expect(props.onNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      'day',
    )
    fireEvent.change(screen.getByLabelText('Go to date'), {
      target: { value: '2020-01-01' },
    })
    expect(props.onNavigate).toHaveBeenCalledWith('2020-01-01', 'day')
  })
})
