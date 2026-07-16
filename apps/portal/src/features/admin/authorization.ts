import type { PortalIdentity } from '../../auth/access.js'

export function requireAdministratorManagementAuthority(identity: PortalIdentity) {
  if (identity.kind !== 'superuser') {
    throw new Error('Access denied')
  }
  return identity.email
}
