# USSTM Portal Terms of Service

**Effective Date:** September 4, 2026  
**Last Updated:** September 4, 2026  

---

## 1. Acceptance of Terms

These **Terms of Service ("Terms")** constitute a binding agreement between you ("you", "your", "User", or "Member") and the **Undergraduate Science Society of TMU ("USSTM", "we", "us", or "our")**, governing your access to and use of the **USSTM Portal** (the "Portal"), located at 40 Gould Street, Toronto, Ontario, Canada, including all associated services and the public Events Application Programming Interface ("API").

By accessing the Portal, authenticating as a Member, or consuming the public Events API, you agree to comply with and be bound by these Terms, the [USSTM Portal Privacy Policy](file:///docs/PRIVACY.md), and all applicable policies of Toronto Metropolitan University ("TMU"), including the TMU Student Code of Non-Academic Conduct.

**IF YOU DO NOT AGREE TO THESE TERMS, DO NOT ACCESS OR USE THE PORTAL OR ITS APIS.**

---

## 2. Eligibility & Member Provisioning

1. **Pre-Provisioned Membership Only:**
   - The Portal does not provide public registration or open account creation.
   - Access to authenticated features is restricted strictly to individuals explicitly admitted in advance by an authorized Administrator or the Superuser ("Members").
   - Admittance as a Member is an organizational privilege granted solely to facilitate legitimate USSTM leadership, club operations, and administrative functions. It does not convey any perpetual property or employment right.

2. **Personal Identity Requirement ([ADR 0001](file:///docs/adr/0001-use-personal-identities-for-club-access.md)):**
   - Every sign-in represents an individual human being.
   - **Shared, generic, or group-owned credentials (e.g., sharing a single executive Gmail login among multiple club officers) are strictly prohibited.**
   - Clubs and student groups are organizations that individual Members receive explicit authority to represent ("Club Access").

---

## 3. Authentication & Account Security

1. **Google OAuth Authentication:**
   - Authentication is performed solely through authorized Google accounts using OAuth 2.0 with Proof Key for Code Exchange (PKCE).
   - You must authenticate using your own verified personal or university-affiliated Google account matching the exact email admitted by USSTM.
2. **Credential Protection:**
   - You are solely responsible for maintaining the security and confidentiality of the Google account used to authenticate to the Portal.
   - You must immediately notify USSTM of any unauthorized access, security breach, or compromise of your Google account.
3. **Stateless Sessions:**
   - Authenticated sessions are issued via host-only, signed, encrypted cookies valid for eight (8) hours. Sessions do not support sliding renewal or persistent storage. You must re-authenticate once your session expires.

---

## 4. User Roles, Authority & Conduct

Users of the Portal operate under defined roles and must comply with corresponding responsibilities:

### A. Public Visitors & API Consumers
- You may freely view the public Office Hours schedule and consume the unauthenticated public Events API (`GET /api/v1/events`).
- You agree not to abuse, overburden, scrape aggressively, flood, or circumvent rate limits on public endpoints.

### B. Club Representatives (Club Access)
- Members granted Club Access have authority to manage event details and schedules for their designated club(s).
- You represent and warrant that any event information, room location, promotional copy, or contact details submitted are accurate, current, and officially sanctioned by your student club.

### C. Board Members
- Members designated as Board Members have authority to reserve and manage Office Hours shifts.
- By booking a shift slot, you commit to staffing the designated USSTM Office Hours for the reserved duration. If you are unable to fulfill a scheduled shift, you must cancel your booking in advance through the Portal.

### D. Administrators & Superuser
- Administrators possess privileged authority to manage member grants, clubs, resources, and event overrides.
- Privileged administrative mutations are subject to immutable audit logging ([ADR 0010](file:///docs/adr/0006-deactivate-members-instead-of-deleting-them.md)). Privileged access must be exercised strictly for official USSTM governance and in good faith.

---

## 5. Acceptable Use Policy

When accessing or using the Portal or its APIs, you agree that you **will not**:

1. **Violate Laws or University Policies:** Use the Portal in violation of any municipal, provincial, or federal law of Ontario or Canada, or any policies of Toronto Metropolitan University, including policies prohibiting harassment, discrimination, hate speech, or hazing.
2. **Impersonate Others:** Impersonate any person or entity, misrepresent your authority to act for USSTM or any club, or access another Member's account.
3. **Distribute Prohibited Content:** Publish event titles, descriptions, or resources that are fraudulent, defamatory, obscene, infringing on third-party intellectual property, or promoting unauthorized commercial solicitations.
4. **Interfere with System Integrity:** Attempt to probe, scan, test the vulnerability of, or breach the authentication or security mechanisms of the Portal, Caddy reverse proxy, auth service, or PostgreSQL database.
5. **Reverse Engineer or Exploit:** Reverse engineer, decompile, or attempt to forge session tokens, tamper with asymmetric signing keys, or execute unauthorized database mutations.
6. **Automated Scraping of Protected Routes:** Use automated bots, spiders, or scripts to access or extract data from authenticated portal routes or administrative dashboards.

---

## 6. Events Publishing & Content Ownership

1. **Immediate Public Publication ([ADR 0005](file:///docs/adr/0005-expose-events-through-a-public-api.md)):**
   - The Portal does not support draft states for events. Creating an event immediately publishes it to the public web interface and the public Events API (`GET /api/v1/events`).
   - You are responsible for reviewing event details (start and end times, room locations, addresses) for accuracy prior to submission.
2. **License to Submitted Content:**
   - By creating events or publishing information on the Portal, you grant USSTM a non-exclusive, worldwide, royalty-free license to host, display, reproduce, format, and distribute the content across USSTM platforms, student displays, feeds, and public APIs.
3. **Administrative Moderation & Overrides:**
   - USSTM Administrators reserve the right, at their sole discretion, to modify, override, unpublish, or delete any event listing, club record, or resource that violates these Terms, university policies, or operational standards.

---

## 7. Account Deactivation & Termination ([ADR 0006](file:///docs/adr/0006-deactivate-members-instead-of-deleting-them.md))

1. **Revocation & Deactivation:**
   - USSTM Administrators or the Superuser may suspend, revoke grants, or place any Member account into **`deactivated`** status at any time, with or without notice, for violation of these Terms, upon resignation, upon graduation, or pursuant to USSTM governance decisions.
   - When a Member's last remaining authorization grant is revoked, the account is automatically deactivated.
2. **Consequences of Deactivation:**
   - Immediate termination and blocking of sign-in capabilities.
   - Automatic revocation of all authority grants (Club Access, Board Member, Administrator).
   - Immediate cancellation of all upcoming/future Office Hours bookings.
3. **Preservation of Institutional Audit Records:**
   - In accordance with ADR 0006, deactivation does not permanently purge past activity. Past bookings, event authorship records, and immutable administrative audit logs are retained to ensure organizational accountability, legal compliance, and historical continuity.

---

## 8. Intellectual Property

1. **USSTM Materials:**
   - All rights, title, and interest in and to the Portal, including its source code, architecture, UI designs, brand assets, logos, and the USSTM navy design system, are the exclusive property of the Undergraduate Science Society of TMU or its licensors.
2. **Feedback:**
   - Any ideas, suggestions, or feedback submitted regarding the Portal may be implemented by USSTM without obligation, payment, or attribution to you.

---

## 9. Disclaimers of Warranties

1. **"As-Is" and "As-Available":**
   - THE PORTAL, ITS CONTENTS, AND THE PUBLIC EVENTS API ARE PROVIDED ON AN **"AS IS"** AND **"AS AVAILABLE"** BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
2. **No Guarantee of Availability or Real-Time Accuracy:**
   - USSTM does not warrant that the Portal will be uninterrupted, error-free, completely secure, or free of bugs or viruses.
   - While USSTM endeavors to maintain accurate records, we do not warrant that event listings or office hours schedules reflect real-time last-minute campus closures, weather emergencies, or room relocations.

---

## 10. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW IN THE PROVINCE OF ONTARIO AND THE LAWS OF CANADA:

1. **No Indirect or Consequential Damages:**
   - IN NO EVENT SHALL USSTM, ITS BOARD OF DIRECTORS, EXECUTIVES, OFFICERS, VOLUNTEERS, STUDENT EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF DATA, LOSS OF USE, OR SERVICE INTERRUPTIONS) ARISING OUT OF OR IN CONNECTION WITH YOUR USE OR INABILITY TO USE THE PORTAL OR ITS APIS.
2. **Aggregate Cap:**
   - THE AGGREGATE LIABILITY OF USSTM FOR ALL CLAIMS RELATING TO THE PORTAL, WHETHER IN CONTRACT, TORT (INCLUDING NEGLIGENCE), OR OTHERWISE, SHALL BE LIMITED TO FIFTY CANADIAN DOLLARS ($50.00 CAD).

---

## 11. Indemnification

You agree to defend, indemnify, and hold harmless USSTM, its directors, officers, executives, student leaders, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising from:
1. Your breach of these Terms or the Acceptable Use Policy;
2. Any content or event information you post or submit through the Portal;
3. Your violation of any third-party right or Toronto Metropolitan University policy; or
4. Misconduct, negligence, or unauthorized actions committed under your authenticated credentials.

---

## 12. Governing Law & Dispute Resolution

These Terms and any dispute arising from or related to the Portal shall be governed by and construed in accordance with the laws of the **Province of Ontario** and the federal laws of **Canada** applicable therein, without giving effect to conflict of laws principles.

Any legal suit, action, or proceeding arising out of or related to these Terms or the Portal shall be instituted exclusively in the courts located in **Toronto, Ontario, Canada**, and you irrevocably submit to the personal and exclusive jurisdiction of such courts.

---

## 13. Modifications to Terms

USSTM reserves the right to revise or replace these Terms at any time. When updates occur, the "Last Updated" date at the top of this document will be amended. Your continued use of the Portal or public APIs following the posting of revised Terms constitutes your acceptance of the changes.

---

## 14. Contact Information

If you have questions, inquiries, or notice obligations concerning these Terms, please contact:

**Undergraduate Science Society of TMU (USSTM)**  
40 Gould Street, Toronto, ON M5B 2K3, Canada  
- **Email:** View support contact details on the [Contact Us](file:///apps/portal/src/routes/contact.tsx) page within the Portal  
- **Official Website:** [https://usstm.ca](https://usstm.ca)  
- **Instagram:** [@usstmu](https://www.instagram.com/usstmu)  
