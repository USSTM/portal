// Shared by the server and the browser, so it must not import server code.
export function boardPhotoPath(photoId: string) {
  return `/api/v1/board-photos/${photoId}`
}
