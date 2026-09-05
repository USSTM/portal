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
        description: 'View your account and permissions.',
      },
      {
        label: 'Contact',
        to: '/contact',
        description: 'Find USSTM contact details.',
      },
      {
        label: 'Resources',
        to: '/resources',
        description: 'Useful links and resources.',
      },
      {
        label: 'Events',
        to: '/events',
        description: 'Create and manage events for your club.',
      },
      {
        label: 'Club Access',
        to: '/account',
        hash: 'clubs',
        description: 'Manage club access.',
      },
      {
        label: 'Office Hours',
        to: '/office-hours',
        description: 'View and book Office Hours shifts.',
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
        description: 'View your account and permissions.',
      },
      {
        label: 'Contact',
        to: '/contact',
        description: 'Find USSTM contact details.',
      },
      {
        label: 'Resources',
        to: '/resources',
        description: 'Useful links and resources.',
      },
      {
        label: 'Board Member',
        to: '/account',
        hash: 'board-position',
        description: 'Manage USSTM board member details.',
      },
      {
        label: 'Office Hours',
        to: '/office-hours',
        description: 'View and book Office Hours shifts.',
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
          description: 'Manage USSTM members.',
          section: 'admin',
        },
        {
          label: 'Clubs',
          to: '/admin/clubs',
          description: 'Manage USSTM clubs.',
          section: 'admin',
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
        description: 'View your account and permissions.',
      },
      {
        label: 'Contact',
        to: '/contact',
        description: 'Find USSTM contact details.',
      },
      {
        label: 'Resources',
        to: '/resources',
        description: 'Useful links and resources.',
      },
      {
        label: 'Events',
        to: '/events',
        description: 'Create and manage events for your club.',
      },
      {
        label: 'Office Hours',
        to: '/office-hours',
        description: 'View and book Office Hours shifts.',
      },
      {
        label: 'Members',
        to: '/admin/members',
        description: 'Manage USSTM members.',
        section: 'admin',
      },
      {
        label: 'Clubs',
        to: '/admin/clubs',
        description: 'Manage USSTM clubs.',
        section: 'admin',
      },
      {
        label: 'Manage Resources',
        to: '/admin/resources',
        description: 'Manage resources.',
        section: 'admin',
      },
      {
        label: 'Board Members',
        to: '/admin/board-members',
        description: 'Manage board members.',
        section: 'admin',
      },
      {
        label: 'Audit History',
        to: '/admin/audit-history',
        description: 'View audit history.',
        section: 'admin',
      },
    ])
  })
})
