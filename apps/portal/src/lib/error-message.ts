/**
 * The message to show someone for a failed action. A server action whose input
 * fails validation throws an error whose message is the validator's JSON list
 * of issues, such as `[{"path":["websiteUrl"],"message":"Website must start
 * with https://"}]`; this shows each issue's message instead of that JSON.
 */
export function errorMessage(caught: unknown, fallback: string) {
  if (!(caught instanceof Error) || !caught.message) return fallback
  const issues = validationIssues(caught.message)
  return issues ? issues.join(' ') : caught.message
}

function validationIssues(message: string) {
  if (!message.trimStart().startsWith('[')) return undefined
  try {
    const parsed: unknown = JSON.parse(message)
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every(
        (issue) =>
          typeof issue === 'object' &&
          issue !== null &&
          typeof (issue as { message?: unknown }).message === 'string',
      )
    ) {
      return parsed.map((issue) => (issue as { message: string }).message)
    }
  } catch {
    return undefined
  }
  return undefined
}
