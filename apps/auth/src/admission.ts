export type AdmissionFacts = {
  emailVerified: boolean
  isUSSTMAdministrator: boolean
}

export type AdmissionDecision =
  | { admitted: true }
  | { admitted: false; reason: "access_not_provisioned" }

export function decideAdmission(facts: AdmissionFacts): AdmissionDecision {
  if (facts.emailVerified && facts.isUSSTMAdministrator) {
    return { admitted: true }
  }

  return { admitted: false, reason: "access_not_provisioned" }
}
