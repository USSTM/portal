import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { resolvePortalIdentity } from '../../auth/identity.js'
import { validateImage } from '../../storage/images.js'

import {
  listEditableClubProfiles,
  removeClubImage,
  replaceClubImage,
  requireClubProfileActor,
  updateClubProfile,
} from './club-profiles.js'

import { clubProfileInput } from './club-profile-input.js'

const clubIdSchema = z.string().uuid()

export const getEditableClubProfiles = createServerFn({
  method: 'GET',
}).handler(async () =>
  listEditableClubProfiles(
    requireClubProfileActor(await resolvePortalIdentity()),
  ),
)

export const updateClubProfileAction = createServerFn({ method: 'POST' })
  .inputValidator(clubProfileInput)
  .handler(async ({ data: { clubId, ...profile } }) =>
    updateClubProfile({
      actor: requireClubProfileActor(await resolvePortalIdentity()),
      clubId,
      profile,
    }),
  )

export const uploadClubImageAction = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error('Expected form data')
    const image = data.get('image')
    if (!(image instanceof File)) throw new Error('Choose an image to upload')
    return { clubId: clubIdSchema.parse(data.get('clubId')), image }
  })
  .handler(async ({ data }) => {
    const actor = requireClubProfileActor(await resolvePortalIdentity())
    const image = validateImage(new Uint8Array(await data.image.arrayBuffer()))
    return replaceClubImage({ actor, clubId: data.clubId, image })
  })

export const removeClubImageAction = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ clubId: clubIdSchema }))
  .handler(async ({ data }) =>
    removeClubImage({
      actor: requireClubProfileActor(await resolvePortalIdentity()),
      clubId: data.clubId,
    }),
  )
