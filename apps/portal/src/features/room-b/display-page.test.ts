// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { roomBDisplayHtml, roomBDisplayScript } from './display-page'

let stop: (() => void) | undefined
const fetchMock = vi.fn()
const startAt = '2030-01-07T13:00:00Z'
const reservation = {
  date: '2030-01-07',
  startHour: 8,
  endHour: 9,
  ownerLabel: 'Science Club',
  boardPosition: null,
  startAt,
  endAt: '2030-01-07T14:00:00Z',
}
function snapshot(reservations = [reservation]) {
  return {
    date: '2030-01-07',
    updatedAt: new Date().toISOString(),
    reservations,
    nextReservation: null,
  }
}
async function start() {
  document.body.innerHTML = roomBDisplayHtml
  stop = window.eval(roomBDisplayScript) as () => void
  await vi.advanceTimersByTimeAsync(0)
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime('2030-01-07T13:30:00Z')
  localStorage.clear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  stop?.()
  stop = undefined
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})
const content = (id: string) => document.getElementById(id)!.textContent

describe('unattended display', () => {
  it('shows current bookings and retains them on refresh failure, then recovers', async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json(snapshot()))
      .mockRejectedValueOnce(new Error('offline'))
      .mockImplementation(() => Promise.resolve(Response.json(snapshot([]))))
    await start()
    expect(content('status')).toBe('Currently reserved')
    expect(content('current')).toBe('Science Club')
    const updated = content('updated')
    await vi.advanceTimersByTimeAsync(180000)
    expect(content('reservations')).toContain('Science Club')
    expect(content('updated')).toBe(updated)
    expect(content('status')).toContain('Last known')
    expect(document.getElementById('warning')!.hidden).toBe(false)
    await vi.advanceTimersByTimeAsync(180000)
    expect(content('status')).toBe('Available now')
    expect(content('reservations')).toBe('No bookings today')
    expect(document.getElementById('warning')!.hidden).toBe(true)
  })
  it('loads the cached schedule when starting offline and retries on reconnect', async () => {
    localStorage.setItem('usstm-room-b-display-v1', JSON.stringify(snapshot()))
    fetchMock
      .mockRejectedValueOnce(new Error('offline'))
      .mockImplementation(() => Promise.resolve(Response.json(snapshot([]))))
    await start()
    expect(content('reservations')).toContain('Science Club')
    expect(content('status')).toContain('Last known')
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)
    expect(content('reservations')).toBe('No bookings today')
    expect(document.getElementById('warning')!.hidden).toBe(true)
  })
  it('never describes yesterday’s cached schedule as today or claims current availability', async () => {
    localStorage.setItem(
      'usstm-room-b-display-v1',
      JSON.stringify({ ...snapshot(), date: '2030-01-06', reservations: [] }),
    )
    fetchMock.mockRejectedValue(new Error('offline'))
    await start()
    expect(content('status')).toBe('Schedule unavailable')
    expect(content('schedule-title')).toContain('2030-01-06')
    expect(content('reservations')).not.toBe('No bookings today')
  })
  it.each([
    '2030-01-07T12:59:00Z',
    '2030-01-08T03:00:00Z',
    '2030-01-12T17:00:00Z',
  ])('shows closed hours at %s', async (stamp) => {
    vi.setSystemTime(stamp)
    fetchMock.mockResolvedValue(Response.json(snapshot([])))
    await start()
    expect(content('status')).toBe('Outside booking hours')
  })
  it('updates current status between refreshes and displays names as text', async () => {
    vi.setSystemTime('2030-01-07T13:59:55Z')
    fetchMock.mockResolvedValue(
      Response.json(
        snapshot([
          { ...reservation, ownerLabel: '<img src=x onerror=alert(1)>' },
        ]),
      ),
    )
    await start()
    expect(content('status')).toBe('Currently reserved')
    expect(document.querySelector('#reservations img')).toBeNull()
    await vi.advanceTimersByTimeAsync(10000)
    expect(content('status')).toBe('Available now')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('times out hung requests and retries without overlapping requests', async () => {
    fetchMock.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () =>
            reject(new Error('aborted')),
          )
        }),
    )
    await start()
    window.dispatchEvent(new Event('online'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(20000)
    expect(content('warning')).toContain('Schedule unavailable')
    await vi.advanceTimersByTimeAsync(180000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
