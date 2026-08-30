import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

import { getDb } from '../index.ts'
import { shiftSlots } from '../schema.ts'

export const defaultShiftSlotsSeedPath = fileURLToPath(
  new URL('./shift-slots.json', import.meta.url),
)

const timeSchema = z.string().regex(/^\d{2}:\d{2}:\d{2}$/)

const shiftSlotSeedSchema = z.object({
  id: z.uuid(),
  startTime: timeSchema,
  endTime: timeSchema,
})

const shiftSlotsSeedSchema = z.array(shiftSlotSeedSchema)

export type ShiftSlotsSeed = z.infer<typeof shiftSlotsSeedSchema>

export async function loadShiftSlotsSeed(
  path: string = defaultShiftSlotsSeedPath,
): Promise<ShiftSlotsSeed> {
  const raw = await readFile(path, 'utf8')
  return shiftSlotsSeedSchema.parse(JSON.parse(raw))
}

export async function importShiftSlotsSeed(
  seed: ShiftSlotsSeed,
): Promise<{ inserted: number }> {
  if (seed.length === 0) return { inserted: 0 }

  const inserted = await getDb()
    .insert(shiftSlots)
    .values(seed)
    .onConflictDoNothing()
    .returning({ id: shiftSlots.id })

  return { inserted: inserted.length }
}
