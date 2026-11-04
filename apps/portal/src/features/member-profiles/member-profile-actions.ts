import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { resolvePortalIdentity } from '../../auth/identity.js'
import { validateImage } from '../../storage/images.js'

import {
  getOwnMemberProfile,
  MAX_BIO_LENGTH,
  removeOwnPhoto,
  replaceOwnPhoto,
  requireMemberProfileOwner,
  updateOwnBio,
} from './member-profiles.js'

// No action takes a Member ID: each acts on the signed-in Member only.

export const getOwnMemberProfileAction = createServerFn({
  method: 'GET',
}).handler(async () =>
  getOwnMemberProfile(requireMemberProfileOwner(await resolvePortalIdentity())),
)

export const updateOwnBioAction = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      bio: z
        .string()
        .max(MAX_BIO_LENGTH * 2)
        .optional(),
    }),
  )
  .handler(async ({ data }) =>
    updateOwnBio(
      requireMemberProfileOwner(await resolvePortalIdentity()),
      data.bio,
    ),
  )

export const uploadOwnPhotoAction = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error('Expected form data')
    const photo = data.get('photo')
    if (!(photo instanceof File)) throw new Error('Choose a photo to upload')
    return { photo }
  })
  .handler(async ({ data }) => {
    const email = requireMemberProfileOwner(await resolvePortalIdentity())
    const image = validateImage(new Uint8Array(await data.photo.arrayBuffer()))
    await replaceOwnPhoto(email, image)
  })

export const removeOwnPhotoAction = createServerFn({ method: 'POST' }).handler(
  async () =>
    removeOwnPhoto(requireMemberProfileOwner(await resolvePortalIdentity())),
)
