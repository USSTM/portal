import { describe, expect, it } from 'vitest'

import { projectMemberAccount } from './shell'

describe('projectMemberAccount', () => {
  it('lists the active member grants, accessible clubs, and board position', () => {
    expect(
      projectMemberAccount({
        email: 'alex@example.com',
        displayName: 'Alex Member',
        administrator: true,
        boardPosition: 'Treasurer',
        clubs: [
          { id: 'club-1', shortName: 'ASC', fullName: 'Alpha Sports Club' },
        ],
      }),
    ).toEqual({
      email: 'alex@example.com',
      displayName: 'Alex Member',
      grants: ['Club Access', 'Board Member', 'Administrator'],
      clubs: [
        { id: 'club-1', shortName: 'ASC', fullName: 'Alpha Sports Club' },
      ],
      boardPosition: 'Treasurer',
    })
  })
})
