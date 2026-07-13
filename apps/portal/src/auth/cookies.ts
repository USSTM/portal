export const flowCookieName = "__Host-usstm_portal_flow"
export const sessionCookieName = "__Host-usstm_portal_session"

export function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`
}

export function clearCookie(name: string) {
  return cookie(name, "", 0)
}

export function readCookie(request: Request, name: string) {
  const match = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)
  return match?.[1] ? decodeURIComponent(match[1]) : undefined
}
