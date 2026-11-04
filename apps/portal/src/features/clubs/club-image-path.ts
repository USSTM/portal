// Shared by the server and the browser, so it must not import server code.
export function clubImagePath(imageId: string) {
  return `/api/v1/club-images/${imageId}`
}
