import { describe, expect, it } from 'vitest'

import { clubProfileInput } from './club-profile-input'
import { normalizeClubProfile, requireClubProfileActor } from './club-profiles'

const clubId = crypto.randomUUID()

describe('Club Profile actors', () => {
  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('lets $kind edit any active Club', (identity) => {
    expect(requireClubProfileActor(identity)).toEqual({
      email: identity.email,
      privileged: true,
    })
  })

  it('leaves Club Access checks to the database for Members', () => {
    expect(
      requireClubProfileActor({ email: 'member@example.com', kind: 'member' }),
    ).toEqual({ email: 'member@example.com', privileged: false })
  })

  it.each([{ kind: 'anonymous' as const }, { kind: 'denied' as const }])(
    'denies $kind',
    (identity) => {
      expect(() => requireClubProfileActor(identity)).toThrow('Access denied')
    },
  )
})

describe('Club Profile input', () => {
  it('accepts a complete profile', () => {
    expect(
      clubProfileInput.parse({
        clubId,
        contactEmail: 'club@example.com',
        description: 'We build robots.',
        instagramHandle: '@robotics.tmu',
        type: 'student_group',
        websiteUrl: 'https://robotics.example.com',
      }),
    ).toMatchObject({ instagramHandle: '@robotics.tmu', type: 'student_group' })
  })

  it('treats blank fields as absent, since every field is optional', () => {
    expect(
      clubProfileInput.parse({
        clubId,
        contactEmail: ' ',
        description: '',
        instagramHandle: '',
        websiteUrl: '',
      }),
    ).toEqual({ clubId })
  })

  it.each([
    ['an http website', { websiteUrl: 'http://example.com' }],
    ['a website that is not a URL', { websiteUrl: 'https//example' }],
    ['an Instagram URL', { instagramHandle: 'instagram.com/usstm' }],
    ['a long description', { description: 'x'.repeat(1001) }],
    ['an invalid email', { contactEmail: 'club' }],
    ['an unknown type', { type: 'society' }],
  ])('rejects %s', (_name, profile) => {
    expect(clubProfileInput.safeParse({ clubId, ...profile }).success).toBe(
      false,
    )
  })

  it('normalizes the stored values', () => {
    expect(
      normalizeClubProfile({
        contactEmail: ' Club@Example.com ',
        description: '  Hello  ',
        instagramHandle: '@usstm',
      }),
    ).toEqual({
      contactEmail: 'club@example.com',
      description: 'Hello',
      instagramHandle: 'usstm',
      type: null,
      websiteUrl: null,
    })
  })
})
