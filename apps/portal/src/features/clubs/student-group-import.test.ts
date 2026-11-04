import { describe, expect, it } from 'vitest'

import {
  normalizeInstagramHandle,
  planClubProfileImport,
} from './student-group-import'
import type {
  ClubForImport,
  ExportedStudentGroup,
} from './student-group-import'

function club(overrides: Partial<ClubForImport> = {}): ClubForImport {
  return {
    contactEmail: null,
    description: null,
    fullName: 'Robotics Club',
    id: crypto.randomUUID(),
    imageId: null,
    instagramHandle: null,
    shortName: 'RC',
    type: null,
    websiteUrl: null,
    ...overrides,
  }
}

function group(
  overrides: Partial<ExportedStudentGroup> = {},
): ExportedStudentGroup {
  return {
    active: true,
    contactEmail: 'Robotics@Example.com',
    description: 'We build robots.',
    instagram: '@robotics',
    logoUrl: 'https://website.test/api/media/file/rc.png',
    name: 'Robotics Club',
    shortName: 'RC',
    type: 'student_group',
    website: 'https://robotics.example.com',
    ...overrides,
  }
}

describe('planClubProfileImport', () => {
  it('fills an empty Club Profile from the matching Student Group', () => {
    const target = club()
    const plan = planClubProfileImport([group()], [target])

    expect(plan.unmatched).toEqual([])
    expect(plan.matched).toEqual([
      {
        club: target,
        filled: [
          'type',
          'description',
          'instagramHandle',
          'websiteUrl',
          'contactEmail',
        ],
        group: 'Robotics Club',
        logoUrl: 'https://website.test/api/media/file/rc.png',
        profile: {
          contactEmail: 'robotics@example.com',
          description: 'We build robots.',
          instagramHandle: 'robotics',
          type: 'student_group',
          websiteUrl: 'https://robotics.example.com',
        },
        skipped: [],
      },
    ])
  })

  it('keeps everything a Club has already set, including its image', () => {
    const target = club({
      description: 'Our own words.',
      imageId: `${crypto.randomUUID()}.png`,
    })
    const [entry] = planClubProfileImport([group()], [target]).matched

    expect(entry.profile.description).toBe('Our own words.')
    expect(entry.filled).not.toContain('description')
    expect(entry.logoUrl).toBeNull()
  })

  it('matches by full name when short names differ, ignoring case and spacing', () => {
    const target = club({ shortName: 'ROBO' })
    const plan = planClubProfileImport(
      [group({ name: ' robotics   club ', shortName: 'RBC' })],
      [target],
    )

    expect(plan.matched.map((entry) => entry.club.id)).toEqual([target.id])
  })

  it('lists inactive, unknown, ambiguous and duplicate groups for a human', () => {
    const plan = planClubProfileImport(
      [
        group({ active: false, name: 'Old Group', shortName: 'OG' }),
        group({ name: 'Unknown Group', shortName: 'UG' }),
        group({ name: 'Shared', shortName: 'SH' }),
        group(),
        group({ name: 'Robotics Club Again', shortName: 'RC' }),
      ],
      [
        club(),
        club({ fullName: 'Shared Name One', shortName: 'SH' }),
        club({ fullName: 'Shared Name Two', shortName: 'sh' }),
      ],
    )

    expect(plan.matched.map((entry) => entry.group)).toEqual(['Robotics Club'])
    expect(plan.unmatched.map((entry) => [entry.group, entry.reason])).toEqual([
      ['Old Group', 'Student Group was inactive on the Website'],
      ['Unknown Group', 'No active Club has a matching short or full name'],
      ['Shared', 'Matches several Clubs: SH, sh'],
      ['Robotics Club Again', 'Club RC already matched Robotics Club'],
    ])
  })

  it('skips values that break the Club Profile rules and says why', () => {
    const [entry] = planClubProfileImport(
      [
        group({
          contactEmail: 'not an email',
          description: 'x'.repeat(1001),
          instagram: 'robotics club!',
          website: 'http://robotics.example.com',
        }),
      ],
      [club()],
    ).matched

    expect(entry.filled).toEqual(['type'])
    expect(entry.skipped).toEqual([
      'description: longer than 1000 characters',
      'instagramHandle: "robotics club!" is not an Instagram handle',
      'websiteUrl: "http://robotics.example.com" is not an https:// URL',
      'contactEmail: "not an email" is not an email address',
    ])
  })
})

describe('normalizeInstagramHandle', () => {
  it.each([
    ['robotics', 'robotics'],
    ['@robotics', 'robotics'],
    ['https://www.instagram.com/robotics.tmu/?hl=en', 'robotics.tmu'],
    ['instagram.com/robotics', 'robotics'],
    ['https://example.com/robotics', undefined],
    ['two words', undefined],
  ])('maps %j to %j', (value, expected) => {
    expect(normalizeInstagramHandle(value)).toBe(expected)
  })
})
