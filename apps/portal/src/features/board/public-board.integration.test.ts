import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  memoryImageStore,
  setImageStoreForTesting,
  validateImage,
} from '../../storage/images.js'
import { grantBoardPositionToAdministrator } from '../admin/administrators.js'
import {
  createMemberWithBoardAuthority,
  revokeBoardAuthority,
} from '../admin/board-members.js'
import {
  createMemberWithClubAccess,
  deactivateMember,
} from '../admin/members.js'
import {
  replaceOwnPhoto,
  updateOwnBio,
} from '../member-profiles/member-profiles.js'
import {
  listBoardPositionOrder,
  listPublicBoard,
  readPublicBoardPhoto,
  setBoardPositionOrder,
} from './public-board.js'

const describeWithDatabase = process.env.DATABASE_URL ? describe : describe.skip
const jpeg = validateImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1]))

describeWithDatabase('public board', () => {
  const run = crypto.randomUUID().slice(0, 8)
  const position = (name: string) => `${name} ${run}`

  beforeEach(() => {
    setImageStoreForTesting(memoryImageStore())
  })

  afterEach(() => {
    setImageStoreForTesting(undefined)
  })

  async function boardMember(displayName: string, boardPosition: string) {
    return createMemberWithBoardAuthority({
      actorEmail: 'admin@example.com',
      boardPosition,
      displayName,
      email: `board-${crypto.randomUUID()}@example.com`,
    })
  }

  async function ownBoard() {
    const { boardMembers } = await listPublicBoard()
    return boardMembers.filter((member) => member.boardPosition.endsWith(run))
  }

  it('publishes current Board Members in the Administrator-set order', async () => {
    const president = await boardMember('Pat President', position('President'))
    await boardMember('Zoe Director', position('Director'))
    await boardMember('Al Director', position('Director'))
    await boardMember('Tess Treasurer', position('Treasurer'))
    const administrator = await createMemberWithClubAccess({
      actorEmail: 'superuser@example.com',
      administrator: true,
      clubIds: [],
      displayName: 'Vic Vice',
      email: `vice-${crypto.randomUUID()}@example.com`,
    })
    await grantBoardPositionToAdministrator({
      actorEmail: 'superuser@example.com',
      boardPosition: position('Vice President'),
      memberId: administrator.id,
    })
    await updateOwnBio(president.email, 'Leads the society.')
    const photoId = await replaceOwnPhoto(president.email, jpeg)

    await setBoardPositionOrder([
      position('President'),
      position('Vice President'),
      position('Director'),
    ])

    expect(await ownBoard()).toEqual([
      {
        bio: 'Leads the society.',
        boardPosition: position('President'),
        displayName: 'Pat President',
        photoUrl: `/api/v1/board-photos/${photoId}`,
      },
      expect.objectContaining({ displayName: 'Vic Vice' }),
      expect.objectContaining({ displayName: 'Al Director' }),
      expect.objectContaining({ displayName: 'Zoe Director' }),
      // Unordered positions follow the ordered ones.
      expect.objectContaining({ displayName: 'Tess Treasurer' }),
    ])
    expect(
      (await listBoardPositionOrder()).filter((name) => name.endsWith(run)),
    ).toEqual([
      position('President'),
      position('Vice President'),
      position('Director'),
      position('Treasurer'),
    ])
  })

  it('publishes no email or Member ID', async () => {
    const member = await boardMember('Private Person', position('Secretary'))

    const entry = (await ownBoard()).find(
      (candidate) => candidate.displayName === 'Private Person',
    )

    expect(Object.keys(entry ?? {}).sort()).toEqual([
      'bio',
      'boardPosition',
      'displayName',
      'photoUrl',
    ])
    expect(JSON.stringify(await listPublicBoard())).not.toContain(member.email)
    expect(JSON.stringify(await listPublicBoard())).not.toContain(member.id)
  })

  it('keeps Member Profiles private once Board Member authority ends', async () => {
    const revoked = await boardMember('Former Member', position('Outreach'))
    const deactivated = await boardMember('Gone Member', position('Events'))
    const notOnBoard = await createMemberWithClubAccess({
      actorEmail: 'admin@example.com',
      clubIds: [],
      contentManager: true,
      displayName: 'Not On Board',
      email: `not-board-${crypto.randomUUID()}@example.com`,
    })
    const revokedPhoto = await replaceOwnPhoto(revoked.email, jpeg)
    const deactivatedPhoto = await replaceOwnPhoto(deactivated.email, jpeg)
    const notOnBoardPhoto = await replaceOwnPhoto(notOnBoard.email, jpeg)
    expect(await readPublicBoardPhoto(revokedPhoto)).toEqual(jpeg)

    await revokeBoardAuthority({
      actorEmail: 'admin@example.com',
      memberId: revoked.id,
    })
    await deactivateMember({
      actorEmail: 'admin@example.com',
      memberId: deactivated.id,
    })

    const names = (await listPublicBoard()).boardMembers.map(
      (member) => member.displayName,
    )
    expect(names).not.toContain('Former Member')
    expect(names).not.toContain('Gone Member')
    expect(names).not.toContain('Not On Board')
    expect(await readPublicBoardPhoto(revokedPhoto)).toBeUndefined()
    expect(await readPublicBoardPhoto(deactivatedPhoto)).toBeUndefined()
    expect(await readPublicBoardPhoto(notOnBoardPhoto)).toBeUndefined()
  })
})
