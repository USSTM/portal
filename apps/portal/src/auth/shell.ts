import { asc, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'

import type { PortalCapabilities } from './capabilities'
import { getPortalIdentity } from './identity'
import { getDb } from '../db/index.js'
import {
  administrators,
  boardMembers,
  clubAccess,
  clubs,
  members,
} from '../db/schema.js'

export interface MemberAccount {
  email: string
  displayName: string
  grants: Array<'Club Access' | 'Board Member' | 'Administrator'>
  clubs: Array<{ id: string; shortName: string; fullName: string }>
  boardPosition: string | null
}

interface MemberAccountInput {
  email: string
  displayName: string
  administrator: boolean
  boardPosition: string | null
  clubs: Array<{ id: string; shortName: string; fullName: string }>
}

export type PortalShell =
  | { kind: 'anonymous' }
  | { kind: 'denied' }
  | {
      kind: 'superuser'
      email: string
      capabilities: PortalCapabilities
      account: { email: string; authorityDescription: string }
    }
  | {
      kind: 'member'
      email: string
      capabilities: PortalCapabilities
      account: MemberAccount
    }

export function projectMemberAccount(input: MemberAccountInput): MemberAccount {
  const grants: MemberAccount['grants'] = []
  if (input.clubs.length > 0) grants.push('Club Access')
  if (input.boardPosition) grants.push('Board Member')
  if (input.administrator) grants.push('Administrator')

  return {
    email: input.email,
    displayName: input.displayName,
    grants,
    clubs: input.clubs,
    boardPosition: input.boardPosition,
  }
}

export const getPortalShell = createServerFn({ method: 'GET' }).handler(() =>
  withRequestId(async () => {
    const identity = await getPortalIdentity()
    if (identity.kind === 'anonymous') return { kind: 'anonymous' } as const
    if (identity.kind === 'denied') return { kind: 'denied' } as const

    if (identity.kind === 'superuser') {
      return {
        kind: 'superuser',
        email: identity.email,
        capabilities: {
          clubAccess: false,
          boardMember: false,
          administrator: true,
          superuser: true,
        },
        account: {
          email: identity.email,
          authorityDescription:
            'Deployment-owned Superuser with all portal authority and exclusive control of Administrator access.',
        },
      } as const
    }

    const grants = await getDb()
      .select({
        displayName: members.displayName,
        administratorId: administrators.memberId,
        boardPosition: boardMembers.boardPosition,
        clubId: clubs.id,
        clubShortName: clubs.shortName,
        clubFullName: clubs.fullName,
      })
      .from(members)
      .leftJoin(administrators, eq(administrators.memberId, members.id))
      .leftJoin(boardMembers, eq(boardMembers.memberId, members.id))
      .leftJoin(clubAccess, eq(clubAccess.memberId, members.id))
      .leftJoin(clubs, eq(clubs.id, clubAccess.clubId))
      .where(eq(members.email, identity.email))
      .orderBy(asc(clubs.shortName))

    const firstGrant = grants.at(0)
    if (firstGrant === undefined) return { kind: 'denied' } as const

    const account = projectMemberAccount({
      email: identity.email,
      displayName: firstGrant.displayName,
      administrator: firstGrant.administratorId !== null,
      boardPosition: firstGrant.boardPosition,
      clubs: grants.flatMap((grant) =>
        grant.clubId && grant.clubShortName && grant.clubFullName
          ? [
              {
                id: grant.clubId,
                shortName: grant.clubShortName,
                fullName: grant.clubFullName,
              },
            ]
          : [],
      ),
    })

    return {
      kind: 'member',
      email: identity.email,
      capabilities: {
        clubAccess: account.clubs.length > 0,
        boardMember: account.boardPosition !== null,
        administrator: account.grants.includes('Administrator'),
        superuser: false,
      },
      account,
    } as const
  }),
)

export const getPortalContact = createServerFn({ method: 'GET' }).handler(() =>
  withRequestId(async () => {
    const shell = await getPortalShell()
    if (shell.kind === 'anonymous' || shell.kind === 'denied') return shell

    return {
      ...shell,
      contact: {
        email: requiredEnvironment('PORTAL_CONTACT_EMAIL'),
        instagram: requiredEnvironment('PORTAL_CONTACT_INSTAGRAM'),
        website: requiredEnvironment('PORTAL_CONTACT_WEBSITE'),
        linktree: requiredEnvironment('PORTAL_CONTACT_LINKTREE'),
      },
    }
  }),
)

async function withRequestId<T>(operation: () => Promise<T>) {
  try {
    return await operation()
  } catch (error) {
    const requestId = crypto.randomUUID()
    console.error('Portal request failed', { error, requestId })
    throw new Error(`Unexpected portal error. Request ID: ${requestId}`)
  }
}

function requiredEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}
