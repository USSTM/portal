import { describe, expect, it } from 'vitest'

import { errorMessage } from './error-message'

describe('errorMessage', () => {
  it('shows the messages of a validation error instead of its JSON', () => {
    const caught = new Error(
      JSON.stringify([
        {
          code: 'invalid_format',
          message: 'Website must start with https://',
          path: ['websiteUrl'],
        },
        {
          code: 'too_big',
          message: 'Too big: expected string to have <=1000 characters',
          path: ['description'],
        },
      ]),
    )

    expect(errorMessage(caught, 'Unable to save profile.')).toBe(
      'Website must start with https:// Too big: expected string to have <=1000 characters',
    )
  })

  it('keeps an ordinary error message', () => {
    expect(
      errorMessage(
        new Error('A Board Archive for 2099-2100 already exists'),
        'Unable to archive.',
      ),
    ).toBe('A Board Archive for 2099-2100 already exists')
  })

  it('keeps a message that only looks like JSON', () => {
    expect(errorMessage(new Error('[not json'), 'Failed.')).toBe('[not json')
    expect(errorMessage(new Error('[1, 2]'), 'Failed.')).toBe('[1, 2]')
  })

  it.each([undefined, 'a string', new Error('')])(
    'falls back for %j',
    (caught) => {
      expect(errorMessage(caught, 'Action failed.')).toBe('Action failed.')
    },
  )
})
