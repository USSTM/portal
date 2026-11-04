import { describe, expect, it } from 'vitest'

import {
  normalizeAcademicYear,
  requireBoardArchiveAuthority,
} from './board-archives'
import { planBoardHistoryImport } from './board-history-import'

describe('normalizeAcademicYear', () => {
  it.each([
    ['2025-2026', '2025-2026'],
    [' 2025/2026 ', '2025-2026'],
    ['2025-26', '2025-2026'],
    ['2099/00', '2099-2100'],
    ['2025 – 2026', '2025-2026'],
  ])('reads %j as %s', (value, expected) => {
    expect(normalizeAcademicYear(value)).toBe(expected)
  })

  it.each(['2025', '2025-2027', '2026-2025', '25-26', 'Fall 2025'])(
    'rejects %j',
    (value) => {
      expect(normalizeAcademicYear(value)).toBeUndefined()
    },
  )
})

describe('Board Archive authority', () => {
  it.each([
    { email: 'admin@example.com', kind: 'administrator' as const },
    { email: 'superuser@example.com', kind: 'superuser' as const },
  ])('lets $kind archive the board', (identity) => {
    expect(requireBoardArchiveAuthority(identity)).toBe(identity.email)
  })

  it.each([
    { email: 'board@example.com', kind: 'member' as const },
    { kind: 'anonymous' as const },
    { kind: 'denied' as const },
  ])('denies $kind', (identity) => {
    expect(() => requireBoardArchiveAuthority(identity)).toThrow(
      'Access denied',
    )
  })
})

describe('planBoardHistoryImport', () => {
  const entries = [{ boardPosition: 'President', displayName: 'Jane Doe' }]

  it('imports new years and reports everything it leaves out', () => {
    const plan = planBoardHistoryImport(
      [
        {
          academicYear: '2022/23',
          entries,
          skipped: ['Directors: a person has no name'],
        },
        { academicYear: '2023-2024', entries, skipped: [] },
        { academicYear: 'Last year', entries, skipped: [] },
        { academicYear: '2022-2023', entries, skipped: [] },
        { academicYear: '2021-2022', entries: [], skipped: [] },
      ],
      new Set(['2023-2024']),
    )

    expect(plan.importable).toEqual([
      {
        academicYear: '2022-2023',
        entries,
        skippedPeople: ['Directors: a person has no name'],
      },
    ])
    expect(plan.notImported).toEqual([
      {
        academicYear: '2023-2024',
        reason: 'A Board Archive for 2023-2024 already exists',
      },
      {
        academicYear: 'Last year',
        reason: 'Not an academic year such as 2023-2024',
      },
      {
        academicYear: '2022-2023',
        reason: '2022-2023 appears more than once in the export',
      },
      { academicYear: '2021-2022', reason: 'No people with a name' },
    ])
  })
})
