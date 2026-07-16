import { exportJWK, generateKeyPair } from 'jose'

const keyId = process.argv[2] ?? 'current'
const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true })

const privateJwk = await exportJWK(privateKey)
const publicJwk = await exportJWK(publicKey)

Object.assign(privateJwk, { alg: 'ES256', kid: keyId, use: 'sig' })
Object.assign(publicJwk, { alg: 'ES256', kid: keyId, use: 'sig' })

console.log('# Keep AUTH_SESSION_PRIVATE_JWK secret. Do not commit it.')
console.log(`AUTH_SESSION_KEY_ID=${keyId}`)
console.log(`PORTAL_AUTH_KEY_ID=${keyId}`)
console.log(`AUTH_SESSION_PRIVATE_JWK='${JSON.stringify(privateJwk)}'`)
console.log(`PORTAL_AUTH_PUBLIC_JWK='${JSON.stringify(publicJwk)}'`)
