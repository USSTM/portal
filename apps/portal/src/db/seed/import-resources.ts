import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import { getDb } from '../index.ts'
import { resources } from '../schema.ts'

export const defaultResourcesSeedPath = fileURLToPath(
  new URL('./resources.json', import.meta.url),
)

const resourceSeedSchema = z.object({
  id: z.uuid(),
  category: z.enum(['finance', 'operations']),
  title: z.string().min(1),
  description: z.string().min(1),
  url: z.url(),
  displayOrder: z.number().int(),
})

const resourcesSeedSchema = z.array(resourceSeedSchema)

export type ResourcesSeed = z.infer<typeof resourcesSeedSchema>

export async function loadResourcesSeed(
  path: string = defaultResourcesSeedPath,
): Promise<ResourcesSeed> {
  const raw = await readFile(path, 'utf8')
  return resourcesSeedSchema.parse(JSON.parse(raw))
}

export async function importResourcesSeed(
  seed: ResourcesSeed,
): Promise<{ inserted: number }> {
  if (seed.length === 0) return { inserted: 0 }

  const inserted = await getDb()
    .insert(resources)
    .values(seed)
    .onConflictDoNothing()
    .returning({ id: resources.id })

  return { inserted: inserted.length }
}
