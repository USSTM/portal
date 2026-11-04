import { describe, expect, it } from 'vitest'

import {
  detectImageType,
  isImageId,
  MAX_IMAGE_BYTES,
  newImageId,
  validateImage,
} from './images'

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0])
const webp = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
])

describe('image validation', () => {
  it.each([
    ['PNG', png, 'image/png'],
    ['JPEG', jpeg, 'image/jpeg'],
    ['WebP', webp, 'image/webp'],
  ])('detects %s from its leading bytes', (_name, bytes, type) => {
    expect(detectImageType(bytes)).toBe(type)
    expect(validateImage(bytes).contentType).toBe(type)
  })

  it('rejects other files, whatever they are called', () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg"/>',
    )
    expect(() => validateImage(svg)).toThrow('JPEG, PNG or WebP')
  })

  it('rejects empty and oversized images', () => {
    expect(() => validateImage(new Uint8Array())).toThrow('empty')
    const oversized = new Uint8Array(MAX_IMAGE_BYTES + 1)
    oversized.set(png)
    expect(() => validateImage(oversized)).toThrow('2 MB')
  })

  it('accepts an image of exactly the size limit', () => {
    const largest = new Uint8Array(MAX_IMAGE_BYTES)
    largest.set(png)
    expect(validateImage(largest).contentType).toBe('image/png')
  })
})

describe('image IDs', () => {
  it('are random UUIDs with the type extension', () => {
    const id = newImageId('image/webp')
    expect(id).toMatch(/\.webp$/)
    expect(isImageId(id)).toBe(true)
  })

  it.each(['../secret.png', 'abc.png', `${crypto.randomUUID()}.svg`, ''])(
    'rejects %j',
    (value) => {
      expect(isImageId(value)).toBe(false)
    },
  )
})
