import type { CollectionConfig } from 'payload'

import {
  CONTENT_MANAGERS_SLUG,
  createContentManagerStrategy,
} from '../lib/content-manager-auth'

// Payload needs an auth collection for /admin, and its document locks and
// preferences reference stored user rows. This collection only mirrors the
// Content Managers who have signed in: the Portal owns who they are and what
// they may do (ADR-0020), so rows are created by the auth strategy and never
// edited here. There are no passwords.
export const ContentManagers: CollectionConfig = {
  slug: CONTENT_MANAGERS_SLUG,
  labels: { singular: 'Content Manager', plural: 'Content Managers' },
  admin: {
    useAsTitle: 'email',
    description:
      'Content Managers are granted in the Portal. This list shows who has signed in.',
  },
  access: {
    create: () => false,
    delete: () => false,
    read: ({ req }) => Boolean(req.user),
    update: () => false,
  },
  auth: {
    disableLocalStrategy: true,
    strategies: [createContentManagerStrategy()],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
  ],
}
