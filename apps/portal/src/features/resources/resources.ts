import { asc, eq } from 'drizzle-orm'

import type { PortalIdentity } from '../../auth/access.js'

import { getDb } from '../../db/index.js'
import { auditEntries, resources } from '../../db/schema.js'

export type ResourceCategory = 'finance' | 'operations'

type ResourceInput = {
  actorEmail: string
  category: ResourceCategory
  description: string
  displayOrder: number
  title: string
  url: string
}

export async function createResource(input: ResourceInput) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [resource] = await tx
      .insert(resources)
      .values(resourceValues(input))
      .returning()
    await writeAudit(tx, input.actorEmail, 'resource.created', resource)
    return resource
  })
}

export async function editResource(
  input: ResourceInput & { resourceId: string },
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [resource] = await tx
      .update(resources)
      .set({ ...resourceValues(input), updatedAt: new Date() })
      .where(eq(resources.id, input.resourceId))
      .returning()
    await writeAudit(tx, input.actorEmail, 'resource.updated', resource)
    return resource
  })
}

export async function setResourceActive(input: {
  active: boolean
  actorEmail: string
  resourceId: string
}) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const [resource] = await tx
      .update(resources)
      .set({ active: input.active, updatedAt: new Date() })
      .where(eq(resources.id, input.resourceId))
      .returning()
    await writeAudit(
      tx,
      input.actorEmail,
      input.active ? 'resource.activated' : 'resource.deactivated',
      resource,
    )
  })
}

export async function browseResources(input: { active?: boolean } = {}) {
  return getDb()
    .select()
    .from(resources)
    .where(
      input.active === undefined
        ? undefined
        : eq(resources.active, input.active),
    )
    .orderBy(
      asc(resources.category),
      asc(resources.displayOrder),
      asc(resources.id),
    )
}

export function requireResourceAdministrationAuthority(
  identity: PortalIdentity,
) {
  if (identity.kind === 'administrator' || identity.kind === 'superuser') {
    return identity.email
  }
  throw new Error('Access denied')
}

export function requireResourceBrowseAuthority(identity: PortalIdentity) {
  if (identity.kind !== 'denied') return identity.email
  throw new Error('Access denied')
}

function resourceValues(input: Omit<ResourceInput, 'actorEmail'>) {
  return {
    category: input.category,
    description: input.description.trim(),
    displayOrder: input.displayOrder,
    title: input.title.trim(),
    url: input.url.trim(),
  }
}

async function writeAudit(
  tx: Parameters<ReturnType<typeof getDb>['transaction']>[0] extends (
    tx: infer Transaction,
  ) => unknown
    ? Transaction
    : never,
  actorEmail: string,
  action: string,
  resource: typeof resources.$inferSelect,
) {
  await tx.insert(auditEntries).values({
    action,
    actorEmail: actorEmail.trim().toLowerCase(),
    changedValues: {
      active: resource.active,
      category: resource.category,
      description: resource.description,
      displayOrder: resource.displayOrder,
      title: resource.title,
      url: resource.url,
    },
    targetId: resource.id,
    targetType: 'resource',
  })
}
