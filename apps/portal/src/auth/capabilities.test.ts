import { describe, expect, it } from 'vitest'

import { navigationForCapabilities } from './capabilities'

describe('navigationForCapabilities', () => {
  it('shows only member destinations for club access', () => {
    expect(
      navigationForCapabilities({
        clubAccess: true,
        boardMember: false,
        administrator: false,
        superuser: false,
      }),
    ).toEqual([
      {
        label: 'Dashboard',
        to: '/',
        description: 'Open dashboard.',
      },
      {
        label: 'Account',
        to: '/account',
        description: 'View your identity and active grants.',
      },
      {
        label: 'Contact',
        to: '/contact',
        description: 'Find USSTM contact details.',
      },
      {
        label: 'Resources',
        to: '/resources',
        description: 'Open resources.',
      },
      {
        label: 'Events',
        to: '/events',
        description: 'Open events.',
      },
      {
        label: 'Club Access',
        to: '/account',
        hash: 'clubs',
        description: 'Open club access.',
      },
    ])
  })

  it('shows a Board Member account shortcut only with Board Member authority', () => {
    expect(
      navigationForCapabilities({
        clubAccess: false,
        boardMember: true,
        administrator: false,
        superuser: false,
      }),
    ).toEqual([
      {
        label: 'Dashboard',
        to: '/',
        description: 'Open dashboard.',
      },
      {
        label: 'Account',
        to: '/account',
        description: 'View your identity and active grants.',
      },
      {
        label: 'Contact',
        to: '/contact',
        description: 'Find USSTM contact details.',
      },
      {
        label: 'Resources',
        to: '/resources',
        description: 'Open resources.',
      },
      {
        label: 'Board Member',
        to: '/account',
        hash: 'board-position',
        description: 'Open board member.',
      },
    ])
  })

  it('gives the Superuser the administrator destinations', () => {
    expect(
      navigationForCapabilities({
        clubAccess: false,
        boardMember: false,
        administrator: false,
        superuser: true,
      }),
    ).toEqual(
      expect.arrayContaining([
        {
          label: 'Members',
          to: '/admin/members',
          description: 'Open members.',
        },
        {
          label: 'Clubs',
          to: '/admin/clubs',
          description: 'Open clubs.',
        },
      ]),
    )
  })

  it('adds all administration destinations for an administrator', () => {
    expect(
      navigationForCapabilities({
        clubAccess: false,
        boardMember: false,
        administrator: true,
        superuser: false,
      }),
    ).toEqual([
      {
        label: 'Dashboard',
        to: '/',
        description: 'Open dashboard.',
      },
      {
        label: 'Account',
        to: '/account',
        description: 'View your identity and active grants.',
      },
      {
        label: 'Contact',
        to: '/contact',
        description: 'Find USSTM contact details.',
      },
      {
        label: 'Resources',
        to: '/resources',
        description: 'Open resources.',
      },
      {
        label: 'Events',
        to: '/events',
        description: 'Open events.',
      },
      {
        label: 'Members',
        to: '/admin/members',
        description: 'Open members.',
      },
      {
        label: 'Clubs',
        to: '/admin/clubs',
        description: 'Open clubs.',
      },
      {
        label: 'Resources',
        to: '/admin/resources',
        description: 'Open resources.',
      },
      {
        label: 'Board Members',
        to: '/admin/board-members',
        description: 'Open board members.',
      },
      {
        label: 'Audit History',
        to: '/admin/audit-history',
        description: 'Open audit history.',
      },
    ])
  })
})
