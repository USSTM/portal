import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import { getRoomBDisplaySchedule, getRoomBSchedule } from './schedule'

const { state, where, limit } = vi.hoisted(() => ({
  state: {
    rows: [] as Array<{
      date: string
      startHour: number
      ownerLabel: string
      boardPosition: string | null
      clubId: string | null
      memberId: string | null
    }>,
  },
  where: vi.fn(),
  limit: vi.fn(),
}))
vi.mock('../../db/index.js', () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: (query: unknown) => {
          where(query)
          return {
            orderBy: () =>
              Object.assign(Promise.resolve(state.rows), {
                limit: (count: number) => {
                  limit(count)
                  return Promise.resolve(state.rows)
                },
              }),
          }
        },
      }),
    }),
  }),
}))
beforeEach(() => {
  state.rows = []
  vi.clearAllMocks()
})
const now = new Date('2030-01-07T13:30:00Z')
function row(startHour: number, clubId = 'club-1', date = '2030-01-07') {
  return {
    date,
    startHour,
    ownerLabel: 'Science Club',
    boardPosition: null,
    clubId,
    memberId: null,
  }
}

describe('schedule reads', () => {
  it('reads a bounded month without returning management identifiers', async () => {
    state.rows = [row(8)]
    const calendar = await getRoomBSchedule({
      date: '2030-01-07',
      view: 'month',
      now,
    })
    expect(calendar.days.length).toBeGreaterThanOrEqual(28)
    expect(
      calendar.days.find((day) => day.date === '2030-01-07')?.slots[0].booking,
    ).toEqual({ ownerLabel: 'Science Club', boardPosition: null })
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0])
    expect(query.sql).toContain('"cancelled_at" is null')
    expect(query.params).toEqual([
      calendar.days[0].date,
      calendar.days.at(-1)!.date,
    ])
    expect(JSON.stringify(calendar)).not.toContain('club-1')
    expect(calendar.currentWeek).toBe('2030-01-07')
    expect(calendar.nextBookableWeek).toBe('2030-01-14')
  })
  it('allows browsing outside the booking window and shows closed weekend days', async () => {
    const history = await getRoomBSchedule({
      date: '2020-01-04',
      view: 'day',
      now,
    })
    expect(history.days).toEqual([
      { date: '2020-01-04', label: 'Saturday', slots: [] },
    ])
    const future = await getRoomBSchedule({
      date: '2040-01-02',
      view: 'day',
      now,
    })
    expect(future.date).toBe('2040-01-02')
    await expect(getRoomBSchedule({ date: '2030-02-30' })).rejects.toThrow()
  })
  it('merges adjacent hours by actual owner and returns a next reservation on a later date', async () => {
    state.rows = [
      row(8),
      row(9),
      row(10, 'different-club'),
      row(8, 'club-1', '2030-01-08'),
    ]
    const snapshot = await getRoomBDisplaySchedule(
      new Date('2030-01-07T16:00:00Z'),
    )
    expect(snapshot.reservations).toHaveLength(2)
    expect(snapshot.reservations[0]).toMatchObject({
      startHour: 8,
      endHour: 10,
      startAt: '2030-01-07T13:00:00.000Z',
      endAt: '2030-01-07T15:00:00.000Z',
    })
    expect(snapshot.nextReservation?.date).toBe('2030-01-08')
    expect(limit).toHaveBeenCalledWith(42)
    for (const privateField of [
      'clubId',
      'memberId',
      'bookedByEmail',
      'club-1',
      'different-club',
    ])
      expect(JSON.stringify(snapshot)).not.toContain(privateField)
  })
  it('returns an empty current-day schedule when the next booking is after the weekend', async () => {
    state.rows = [row(8, 'club-1', '2030-01-14')]
    const snapshot = await getRoomBDisplaySchedule(
      new Date('2030-01-12T17:00:00Z'),
    )
    expect(snapshot.date).toBe('2030-01-12')
    expect(snapshot.reservations).toEqual([])
    expect(snapshot.nextReservation?.date).toBe('2030-01-14')
  })
})
