import { createPortalImageProxy } from '@/lib/club-image-proxy'

// Proxies current Board Members' photos from the portal so they stay
// same-origin under the Website CSP (docs/api/board.md). The portal serves a
// photo only while its Member is a Board Member.
export const GET = createPortalImageProxy({
  portalPath: '/api/v1/board-photos',
})
