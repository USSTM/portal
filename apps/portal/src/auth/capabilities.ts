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
  description: string
}

export function navigationForCapabilities(
  capabilities: PortalCapabilities,
): Array<PortalNavigationItem> {
  const navigation: Array<PortalNavigationItem> = [
    {
      label: 'Dashboard',
      to: '/',
      description: 'Open dashboard.',
    },
    {
      label: 'Account',
      to: '/account',
      description: 'View your account and permissions.',
    },
    {
      label: 'Contact',
      to: '/contact',
      description: 'Find USSTM contact details.',
    },
    {
      label: 'Resources',
      to: '/resources',
      description: 'Useful links and resources.',
    },
  ]

  if (
    capabilities.clubAccess ||
    capabilities.administrator ||
    capabilities.superuser
  ) {
    navigation.push({
      label: 'Events',
      to: '/events',
      description: 'Create and manage events for your club.',
    })
  }

  if (capabilities.clubAccess) {
    navigation.push({
      label: 'Club Access',
      to: '/account',
      hash: 'clubs',
      description: 'Manage club access.',
    })
  }

  if (capabilities.boardMember) {
    navigation.push({
      label: 'Board Member',
      to: '/account',
      hash: 'board-position',
      description: 'Manage USSTM board member details.',
    })
  }

  if (capabilities.administrator || capabilities.superuser) {
    navigation.push(
      {
        label: 'Members',
        to: '/admin/members',
        description: 'Manage USSTM members.',
      },
      {
        label: 'Clubs',
        to: '/admin/clubs',
        description: 'Manage USSTM clubs.',
      },
      {
        label: 'Resources',
        to: '/admin/resources',
        description: 'Manage resources.',
      },
      {
        label: 'Board Members',
        to: '/admin/board-members',
        description: 'Manage board members.',
      },
      {
        label: 'Audit History',
        to: '/admin/audit-history',
        description: 'View audit history.',
      },
    )
  }

  return navigation
}
