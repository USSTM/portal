import { describe, expect, it } from 'vitest'

import {
  exportStudentGroup,
  lexicalToPlainText,
  type StudentGroupArchiveRow,
} from '@/lib/student-groups-export'

const paragraph = (...texts: string[]) => ({
  type: 'paragraph',
  children: texts.map((text) =>
    text === '\n' ? { type: 'linebreak' } : { type: 'text', text },
  ),
})

const row = (
  overrides: Partial<StudentGroupArchiveRow> = {},
): StudentGroupArchiveRow => ({
  contact_email: ' robotics@example.com ',
  description: {
    root: { type: 'root', children: [paragraph('We build robots.')] },
  },
  instagram: '@robotics',
  is_active: true,
  logo_filename: 'robotics logo.png',
  name: ' Robotics Club ',
  short_name: 'RC',
  type: 'sg',
  website: 'https://robotics.example.com',
  ...overrides,
})

describe('exportStudentGroup', () => {
  it('maps an archived Student Group to the Portal import format', () => {
    expect(exportStudentGroup(row(), 'https://usstm.example')).toEqual({
      active: true,
      contactEmail: 'robotics@example.com',
      description: 'We build robots.',
      instagram: '@robotics',
      logoUrl: 'https://usstm.example/api/media/file/robotics%20logo.png',
      name: 'Robotics Club',
      shortName: 'RC',
      type: 'student_group',
      website: 'https://robotics.example.com',
    })
  })

  it('maps course unions, inactive groups and blank fields', () => {
    expect(
      exportStudentGroup(
        row({
          contact_email: '',
          description: null,
          is_active: false,
          logo_filename: null,
          short_name: ' ',
          type: 'cu',
        }),
        'https://usstm.example',
      ),
    ).toMatchObject({
      active: false,
      contactEmail: null,
      description: null,
      logoUrl: null,
      shortName: null,
      type: 'course_union',
    })
  })
})

describe('lexicalToPlainText', () => {
  it('keeps paragraphs, headings, list items and line breaks', () => {
    expect(
      lexicalToPlainText({
        root: {
          type: 'root',
          children: [
            { type: 'heading', children: [{ type: 'text', text: 'About' }] },
            paragraph('We build ', 'robots.', '\n', 'Join us!'),
            {
              type: 'list',
              children: [
                {
                  type: 'listitem',
                  children: [{ type: 'text', text: 'Design' }],
                },
                {
                  type: 'listitem',
                  children: [{ type: 'text', text: 'Build' }],
                },
              ],
            },
            paragraph('  '),
          ],
        },
      }),
    ).toBe('About\n\nWe build robots.\nJoin us!\n\nDesign\n\nBuild')
  })

  it('returns an empty string for missing or malformed content', () => {
    expect(lexicalToPlainText(null)).toBe('')
    expect(lexicalToPlainText({ nope: true })).toBe('')
  })
})
