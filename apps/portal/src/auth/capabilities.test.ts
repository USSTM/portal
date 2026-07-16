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
      { label: 'Dashboard', to: '/' },
      { label: 'Account', to: '/account' },
      { label: 'Contact', to: '/contact' },
      { label: 'Resources', to: '/resources' },
      { label: 'Events', to: '/events' },
      { label: 'Club Access', to: '/account', hash: 'clubs' },
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
      { label: 'Dashboard', to: '/' },
      { label: 'Account', to: '/account' },
      { label: 'Contact', to: '/contact' },
      { label: 'Resources', to: '/resources' },
      { label: 'Board Member', to: '/account', hash: 'board-position' },
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
        { label: 'Members', to: '/admin/members' },
        { label: 'Clubs', to: '/admin/clubs' },
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
      { label: 'Dashboard', to: '/' },
      { label: 'Account', to: '/account' },
      { label: 'Contact', to: '/contact' },
      { label: 'Resources', to: '/resources' },
      { label: 'Events', to: '/events' },
      { label: 'Members', to: '/admin/members' },
      { label: 'Clubs', to: '/admin/clubs' },
      { label: 'Resources', to: '/admin/resources' },
      { label: 'Board members', to: '/admin/board-members' },
      { label: 'Audit history', to: '/admin/audit-history' },
    ])
  })
})
