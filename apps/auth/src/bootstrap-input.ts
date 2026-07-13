export function parseUSSTMAdministratorEmails(values: string[]) {
  const emails = [...new Set(values.map((email) => email.trim().toLowerCase()))]
  if (emails.length !== 3 || emails.some((email) => !email.includes("@"))) {
    throw new Error(
      "Provide exactly three distinct USSTM Administrator email addresses",
    )
  }
  return emails
}
