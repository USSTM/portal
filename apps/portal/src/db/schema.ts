import {
  check,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const memberLifecycle = pgEnum('member_lifecycle', [
  'active',
  'deactivated',
])

export const members = pgTable(
  'members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    displayName: text('display_name').notNull(),
    lifecycle: memberLifecycle('lifecycle').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('members_email_normalized', sql`${table.email} = lower(btrim(${table.email}))`),
  ],
)

export const administrators = pgTable('administrators', {
  memberId: uuid('member_id')
    .primaryKey()
    .references(() => members.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const auditEntries = pgTable('audit_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  changedValues: jsonb('changed_values').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
