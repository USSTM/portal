import { describe, expect, it } from 'vitest'

import {
  boardHistoryFromArchive,
  exportBoardHistory,
  type BoardHistoryArchiveRow,
} from '@/lib/board-history-export'

describe('boardHistoryFromArchive', () => {
  const row = (
    overrides: Partial<BoardHistoryArchiveRow>,
  ): BoardHistoryArchiveRow => ({
    academic_year: '2023-2024',
    group_name: 'Executives',
    group_order: 1,
    member_order: 1,
    person_name: 'Jane Doe',
    person_position: 'President',
    ...overrides,
  })

  it('rebuilds years newest first, with groups and people in their order', () => {
    expect(
      boardHistoryFromArchive([
        row({ member_order: 2, person_name: 'Sam Lee', person_position: 'VP' }),
        row({
          group_name: 'Directors',
          group_order: 2,
          member_order: null,
          person_name: null,
          person_position: null,
        }),
        row({}),
        row({ academic_year: '2024-2025', person_name: 'Ana Ruiz' }),
      ]),
    ).toEqual([
      {
        academicYear: '2024-2025',
        groups: [
          {
            groupName: 'Executives',
            members: [{ name: 'Ana Ruiz', position: 'President' }],
          },
        ],
      },
      {
        academicYear: '2023-2024',
        groups: [
          {
            groupName: 'Executives',
            members: [
              { name: 'Jane Doe', position: 'President' },
              { name: 'Sam Lee', position: 'VP' },
            ],
          },
          { groupName: 'Directors', members: [] },
        ],
      },
    ])
  })

  it('keeps a deleted person so the export reports them', () => {
    const [year] = boardHistoryFromArchive([
      row({ person_name: null, person_position: null }),
    ])

    expect(exportBoardHistory(year).skipped).toEqual([
      'Executives: a person has no name',
    ])
  })
})

describe('exportBoardHistory', () => {
  it('flattens groups into ordered names and Board Positions only', () => {
    expect(
      exportBoardHistory({
        academicYear: ' 2023-2024 ',
        groups: [
          {
            groupName: 'Executives',
            members: [
              { name: 'Jane Doe', position: 'President' },
              { name: ' Sam Lee ', position: ' ' },
            ],
          },
          {
            groupName: 'First Year Directors',
            members: [{ name: 'Ana Ruiz', position: null }],
          },
        ],
      }),
    ).toEqual({
      academicYear: '2023-2024',
      entries: [
        { boardPosition: 'President', displayName: 'Jane Doe' },
        { boardPosition: 'Executives', displayName: 'Sam Lee' },
        { boardPosition: 'First Year Directors', displayName: 'Ana Ruiz' },
      ],
      skipped: [],
    })
  })

  it('reports people it cannot export instead of guessing', () => {
    expect(
      exportBoardHistory({
        academicYear: '2022-2023',
        groups: [
          {
            groupName: 'Directors',
            members: [42, { name: '', position: 'Director' }],
          },
        ],
      }),
    ).toEqual({
      academicYear: '2022-2023',
      entries: [],
      skipped: [
        'Directors: person 42 no longer exists',
        'Directors: a person has no name',
      ],
    })
  })

  it('handles a year with no groups', () => {
    expect(
      exportBoardHistory({ academicYear: '2021-2022', groups: null }).entries,
    ).toEqual([])
  })
})
