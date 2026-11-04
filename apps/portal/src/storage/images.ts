import { AwsClient } from 'aws4fetch'

// Public images (Club Profile images, and Member Profile photos) live in a
// private S3-compatible bucket. The Portal serves them itself from
// /api/v1/*-images/<id>, so they stay same-origin under the Portal CSP and the
// bucket never needs public access.

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp'

const extensions: Record<ImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export interface StoredImage {
  body: Uint8Array
  contentType: ImageType
}

export interface ImageStore {
  delete: (key: string) => Promise<void>
  get: (key: string) => Promise<StoredImage | undefined>
  put: (key: string, image: StoredImage) => Promise<void>
}

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageValidationError'
  }
}

/**
 * Checks size and detects the type from the file's leading bytes, never from
 * the name or the browser-supplied content type.
 */
export function validateImage(bytes: Uint8Array): StoredImage {
  if (bytes.byteLength === 0) throw new ImageValidationError('Image is empty')
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageValidationError('Image must be 2 MB or smaller')
  }
  const contentType = detectImageType(bytes)
  if (!contentType) {
    throw new ImageValidationError('Image must be a JPEG, PNG or WebP file')
  }
  return { body: bytes, contentType }
}

export function detectImageType(bytes: Uint8Array): ImageType | undefined {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte)
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png'
  }
  // RIFF....WEBP
  if (
    startsWith([0x52, 0x49, 0x46, 0x46]) &&
    startsWith([0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp'
  }
  return undefined
}

/** Image IDs are random UUIDs with the type's extension, e.g. `<uuid>.png`. */
export function newImageId(contentType: ImageType) {
  return `${crypto.randomUUID()}.${extensions[contentType]}`
}

export function isImageId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(
    value,
  )
}

export function s3ImageStore(config: {
  accessKeyId: string
  bucket: string
  endpoint: string
  region: string
  secretAccessKey: string
}): ImageStore {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    region: config.region,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
  })
  // Path-style URLs work with AWS S3 and other S3-compatible providers.
  const objectUrl = (key: string) =>
    `${config.endpoint.replace(/\/+$/, '')}/${encodeURIComponent(config.bucket)}/${key
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`

  return {
    async delete(key) {
      const response = await client.fetch(objectUrl(key), { method: 'DELETE' })
      if (!response.ok && response.status !== 404) {
        throw new Error(`Image delete failed with ${response.status}`)
      }
    },
    async get(key) {
      const response = await client.fetch(objectUrl(key))
      if (response.status === 404) return undefined
      if (!response.ok) {
        throw new Error(`Image read failed with ${response.status}`)
      }
      const body = new Uint8Array(await response.arrayBuffer())
      const contentType = detectImageType(body)
      return contentType ? { body, contentType } : undefined
    },
    async put(key, image) {
      const response = await client.fetch(objectUrl(key), {
        // slice() copies into a plain ArrayBuffer, which BodyInit requires.
        body: image.body.slice(),
        headers: { 'content-type': image.contentType },
        method: 'PUT',
      })
      if (!response.ok) {
        throw new Error(`Image upload failed with ${response.status}`)
      }
    },
  }
}

let configuredStore: ImageStore | undefined

/** The bucket configured by `PORTAL_S3_*`; tests replace it with their own. */
export function getImageStore(): ImageStore {
  configuredStore ??= s3ImageStore({
    accessKeyId: requiredEnvironment('PORTAL_S3_ACCESS_KEY_ID'),
    bucket: requiredEnvironment('PORTAL_S3_BUCKET'),
    endpoint: requiredEnvironment('PORTAL_S3_ENDPOINT'),
    region: requiredEnvironment('PORTAL_S3_REGION'),
    secretAccessKey: requiredEnvironment('PORTAL_S3_SECRET_ACCESS_KEY'),
  })
  return configuredStore
}

export function setImageStoreForTesting(store: ImageStore | undefined) {
  configuredStore = store
}

export function memoryImageStore(): ImageStore & {
  objects: Map<string, StoredImage>
} {
  const objects = new Map<string, StoredImage>()
  return {
    objects,
    async delete(key) {
      objects.delete(key)
    },
    async get(key) {
      return objects.get(key)
    },
    async put(key, image) {
      objects.set(key, image)
    },
  }
}

function requiredEnvironment(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}
