import { createClubImageProxy } from '@/lib/club-image-proxy'

// Proxies Club Profile images from the portal so they stay same-origin under
// the Website CSP (docs/api/clubs.md).
export const GET = createClubImageProxy()
