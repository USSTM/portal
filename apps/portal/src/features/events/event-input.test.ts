import { describe, expect, it } from 'vitest'

import { eventEditInput, eventInput } from './event-input'

describe('eventInput', () => {
  const validEvent = {
    address: '40 Gould Street, Toronto',
    description: 'A welcoming Toronto event for prospective club members.',
    endAt: '2026-09-12T12:00',
    location: 'Student Centre',
    owningClubId: 'd47f2bf0-46de-4adc-9644-1df9a3a5af1f',
    startAt: '2026-09-12T10:00',
    title: 'Welcome Day',
  }

  it('converts Toronto-local date/time input to instants', () => {
    const result = eventInput.parse(validEvent)

    expect(result.startAt.toISOString()).toBe('2026-09-12T14:00:00.000Z')
    expect(result.endAt.toISOString()).toBe('2026-09-12T16:00:00.000Z')
  })

  it('rejects events shorter than one hour', () => {
    expect(() =>
      eventInput.parse({ ...validEvent, endAt: '2026-09-12T10:59' }),
    ).toThrow('at least one hour')
  })

  it('rejects an invalid Toronto-local time', () => {
    expect(() =>
      eventInput.parse({ ...validEvent, startAt: '2026-03-08T02:30' }),
    ).toThrow('valid Toronto-local')
  })

  it('applies the same rules to Event edits', () => {
    expect(() =>
      eventEditInput.parse({
        ...validEvent,
        description: 'too short',
        eventId: 'd47f2bf0-46de-4adc-9644-1df9a3a5af1e',
        updatedAt: '2026-09-10T12:00:00.000Z',
      }),
    ).toThrow()
  })
})
