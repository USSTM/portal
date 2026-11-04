// Portal image IDs are random UUIDs with the image type's extension.
export function isPortalImageId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(
    value,
  )
}

/**
 * Maps a portal image path, such as /api/v1/board-photos/<id>, to the same
 * image on this site, such as /board-photos/<id>, which proxies the portal.
 */
export function websiteImagePath(
  portalUrl: string | null,
  portalPath: '/api/v1/club-images' | '/api/v1/board-photos',
  websitePath: '/club-images' | '/board-photos',
) {
  if (!portalUrl?.startsWith(`${portalPath}/`)) return null
  const imageId = portalUrl.slice(portalPath.length + 1)
  return isPortalImageId(imageId) ? `${websitePath}/${imageId}` : null
}
