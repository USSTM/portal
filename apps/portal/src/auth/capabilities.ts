export interface PortalCapabilities {
  clubAccess: boolean
  boardMember: boolean
  administrator: boolean
  superuser: boolean
}

export interface PortalNavigationItem {
  label: string
  to: string
  hash?: string
}

export function navigationForCapabilities(
  capabilities: PortalCapabilities,
): Array<PortalNavigationItem> {
  const navigation: Array<PortalNavigationItem> = [
    { label: 'Dashboard', to: '/' },
    { label: 'Account', to: '/account' },
    { label: 'Contact', to: '/contact' },
    { label: 'Resources', to: '/resources' },
  ]

  if (
    capabilities.clubAccess ||
    capabilities.administrator ||
    capabilities.superuser
  ) {
    navigation.push({ label: 'Events', to: '/events' })
  }

  if (capabilities.clubAccess) {
    navigation.push({ label: 'Club Access', to: '/account', hash: 'clubs' })
  }

  if (capabilities.boardMember) {
    navigation.push({
      label: 'Board Member',
      to: '/account',
      hash: 'board-position',
    })
  }

  if (capabilities.administrator || capabilities.superuser) {
    navigation.push(
      { label: 'Members', to: '/admin/members' },
      { label: 'Clubs', to: '/admin/clubs' },
      { label: 'Resources', to: '/admin/resources' },
      { label: 'Board members', to: '/admin/board-members' },
      { label: 'Audit history', to: '/admin/audit-history' },
    )
  }

  return navigation
}
