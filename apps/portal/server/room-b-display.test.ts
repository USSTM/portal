import { beforeEach, describe, expect, it, vi } from 'vitest'
import roomBDisplay from './room-b-display'
import roomBDisplayPage from './room-b-display-page'
import { getRoomBDisplaySchedule } from '../src/features/room-b/schedule'

vi.mock('../src/features/room-b/schedule', () => ({
  getRoomBDisplaySchedule: vi.fn(),
}))
beforeEach(() => vi.resetAllMocks())
describe('public room display', () => {
  it('serves the display without authentication or database access', async () => {
    const response = roomBDisplayPage(
      new Request('https://portal.example.com/room-b/display'),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/html')
    expect(await response.text()).toContain('EPH 442B')
    expect(getRoomBDisplaySchedule).not.toHaveBeenCalled()
  })
  it('returns a fresh public schedule without requiring cookies', async () => {
    const snapshot = {
      date: '2030-01-07',
      updatedAt: '2030-01-07T13:30:00Z',
      reservations: [],
      nextReservation: null,
    }
    vi.mocked(getRoomBDisplaySchedule).mockResolvedValue(snapshot)
    const response = await roomBDisplay(
      new Request('https://portal.example.com/api/v1/room-b/display'),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual(snapshot)
  })
  it('rejects writes and returns a generic retryable error on database failures', async () => {
    expect(
      (
        await roomBDisplay(
          new Request('https://portal.example.com/api/v1/room-b/display', {
            method: 'POST',
          }),
        )
      ).status,
    ).toBe(405)
    expect(getRoomBDisplaySchedule).not.toHaveBeenCalled()
    vi.mocked(getRoomBDisplaySchedule).mockRejectedValue(
      new Error('private connection details'),
    )
    const response = await roomBDisplay(
      new Request('https://portal.example.com/api/v1/room-b/display'),
    )
    expect(response.status).toBe(503)
    expect(await response.text()).not.toContain('private connection details')
  })
})
