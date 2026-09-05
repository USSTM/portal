import { createFileRoute } from '@tanstack/react-router'
import { getPortalShell } from '../auth/shell'
import { LegalLayout } from '../components/legal-layout'

export const Route = createFileRoute('/terms')({
  component: TermsRoute,
  head: () => ({
    meta: [
      {
        title: 'Terms of Service - USSTM Portal',
      },
    ],
  }),
  loader: () => getPortalShell(),
})

function TermsRoute() {
  const shell = Route.useLoaderData()

  return (
    <LegalLayout
      currentDocument="terms"
      shell={shell}
      title="Terms of Service"
      lastUpdated="September 4, 2026"
    >
      <h2>1. Acceptance of Terms</h2>
      <p>
        These <strong>Terms of Service (&ldquo;Terms&rdquo;)</strong> constitute
        a binding agreement between you (&ldquo;you&rdquo;, &ldquo;your&rdquo;,
        &ldquo;User&rdquo;, or &ldquo;Member&rdquo;) and the{' '}
        <strong>
          Undergraduate Science Society of TMU (&ldquo;USSTM&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
        </strong>
        , governing your access to and use of the <strong>USSTM Portal</strong>{' '}
        (the &ldquo;Portal&rdquo;), located at 40 Gould Street, Toronto,
        Ontario, Canada, including all associated services and the public Events
        Application Programming Interface (&ldquo;API&rdquo;).
      </p>
      <p>
        By accessing the Portal, authenticating as a Member, or consuming the
        public Events API, you agree to comply with and be bound by these Terms,
        the USSTM Portal Privacy Policy, and all applicable policies of Toronto
        Metropolitan University (&ldquo;TMU&rdquo;), including the TMU Student
        Code of Non-Academic Conduct.
      </p>
      <p className="font-semibold text-foreground">
        IF YOU DO NOT AGREE TO THESE TERMS, DO NOT ACCESS OR USE THE PORTAL OR
        ITS APIS.
      </p>

      <h2>2. Eligibility &amp; Member Provisioning</h2>
      <ol>
        <li>
          <strong>Pre-Provisioned Membership Only:</strong> The Portal does not
          provide public registration or open account creation. Access to
          authenticated features is restricted strictly to individuals
          explicitly admitted in advance by an authorized Administrator or the
          Superuser (&ldquo;Members&rdquo;). Admittance is an organizational
          privilege granted solely to facilitate legitimate USSTM leadership,
          club operations, and administrative functions.
        </li>
        <li>
          <strong>Personal Identity Requirement:</strong> Every sign-in
          represents an individual human being. Shared, generic, or group-owned
          credentials (e.g., sharing a single executive Gmail login among
          multiple club officers) are strictly prohibited. Clubs and student
          groups are organizations that individual Members receive explicit
          authority to represent (&ldquo;Club Access&rdquo;).
        </li>
      </ol>

      <h2>3. Authentication &amp; Account Security</h2>
      <ol>
        <li>
          <strong>Google OAuth Authentication:</strong> Authentication is
          performed solely through authorized Google accounts using OAuth 2.0
          with Proof Key for Code Exchange (PKCE). You must authenticate using
          your own verified personal or university-affiliated Google account
          matching the exact email admitted by USSTM.
        </li>
        <li>
          <strong>Credential Protection:</strong> You are solely responsible for
          maintaining the security and confidentiality of the Google account
          used to authenticate to the Portal. You must immediately notify USSTM
          of any unauthorized access, security breach, or compromise of your
          Google account.
        </li>
        <li>
          <strong>Stateless Sessions:</strong> Authenticated sessions are issued
          via host-only, signed, encrypted cookies valid for eight (8) hours.
          Sessions do not support sliding renewal or persistent storage. You
          must re-authenticate once your session expires.
        </li>
      </ol>

      <h2>4. User Roles, Authority &amp; Conduct</h2>
      <p>
        Users of the Portal operate under defined roles and must comply with
        corresponding responsibilities:
      </p>
      <ul>
        <li>
          <strong>Public Visitors &amp; API Consumers:</strong> You may freely
          view the public Office Hours schedule and consume the unauthenticated
          public Events API (<code>GET /api/v1/events</code>). You agree not to
          abuse, overburden, scrape aggressively, flood, or circumvent rate
          limits on public endpoints.
        </li>
        <li>
          <strong>Club Representatives (Club Access):</strong> Members granted
          Club Access have authority to manage event details and schedules for
          their designated club(s). You represent and warrant that any event
          information, room location, promotional copy, or contact details
          submitted are accurate, current, and officially sanctioned by your
          student club.
        </li>
        <li>
          <strong>Board Members:</strong> Members designated as Board Members
          have authority to reserve and manage Office Hours shifts. By booking a
          shift slot, you commit to staffing the designated USSTM Office Hours
          for the reserved duration. If you are unable to fulfill a scheduled
          shift, you must cancel your booking in advance through the Portal.
        </li>
        <li>
          <strong>Administrators &amp; Superuser:</strong> Administrators
          possess privileged authority to manage member grants, clubs,
          resources, and event overrides. Privileged administrative mutations
          are subject to immutable audit logging. Privileged access must be
          exercised strictly for official USSTM governance and in good faith.
        </li>
      </ul>

      <h2>5. Acceptable Use Policy</h2>
      <p>
        When accessing or using the Portal or its APIs, you agree that you will
        not:
      </p>
      <ol>
        <li>
          <strong>Violate Laws or University Policies:</strong> Use the Portal
          in violation of any municipal, provincial, or federal law of Ontario
          or Canada, or any policies of Toronto Metropolitan University,
          including policies prohibiting harassment, discrimination, hate
          speech, or hazing.
        </li>
        <li>
          <strong>Impersonate Others:</strong> Impersonate any person or entity,
          misrepresent your authority to act for USSTM or any club, or access
          another Member&rsquo;s account.
        </li>
        <li>
          <strong>Distribute Prohibited Content:</strong> Publish event titles,
          descriptions, or resources that are fraudulent, defamatory, obscene,
          infringing on third-party intellectual property, or promoting
          unauthorized commercial solicitations.
        </li>
        <li>
          <strong>Interfere with System Integrity:</strong> Attempt to probe,
          scan, test the vulnerability of, or breach the authentication or
          security mechanisms of the Portal, Caddy reverse proxy, auth service,
          or PostgreSQL database.
        </li>
        <li>
          <strong>Reverse Engineer or Exploit:</strong> Reverse engineer,
          decompile, or attempt to forge session tokens, tamper with asymmetric
          signing keys, or execute unauthorized database mutations.
        </li>
        <li>
          <strong>Automated Scraping of Protected Routes:</strong> Use automated
          bots, spiders, or scripts to access or extract data from authenticated
          portal routes or administrative dashboards.
        </li>
      </ol>

      <h2>6. Events Publishing &amp; Content Ownership</h2>
      <ol>
        <li>
          <strong>Immediate Public Publication:</strong> The Portal does not
          support draft states for events. Creating an event immediately
          publishes it to the public web interface and the public Events API (
          <code>GET /api/v1/events</code>). You are responsible for reviewing
          event details for accuracy prior to submission.
        </li>
        <li>
          <strong>License to Submitted Content:</strong> By creating events or
          publishing information on the Portal, you grant USSTM a non-exclusive,
          worldwide, royalty-free license to host, display, reproduce, format,
          and distribute the content across USSTM platforms, student displays,
          feeds, and public APIs.
        </li>
        <li>
          <strong>Administrative Moderation &amp; Overrides:</strong> USSTM
          Administrators reserve the right, at their sole discretion, to modify,
          override, unpublish, or delete any event listing, club record, or
          resource that violates these Terms, university policies, or
          operational standards.
        </li>
      </ol>

      <h2>7. Account Deactivation &amp; Termination</h2>
      <ol>
        <li>
          <strong>Revocation &amp; Deactivation:</strong> USSTM Administrators
          or the Superuser may suspend, revoke grants, or place any Member
          account into{' '}
          <strong>
            <code>deactivated</code>
          </strong>{' '}
          status at any time, with or without notice, for violation of these
          Terms, upon resignation, upon graduation, or pursuant to USSTM
          governance decisions. When a Member&rsquo;s last remaining
          authorization grant is revoked, the account is automatically
          deactivated.
        </li>
        <li>
          <strong>Consequences of Deactivation:</strong> Sign-in capabilities
          are immediately terminated, all authority grants are revoked, and
          upcoming Office Hours bookings are canceled.
        </li>
        <li>
          <strong>Preservation of Institutional Records:</strong> Deactivation
          does not permanently purge past activity. Past bookings, event
          authorship records, and immutable administrative audit logs are
          retained to ensure organizational accountability, legal compliance,
          and historical continuity.
        </li>
      </ol>

      <h2>8. Intellectual Property</h2>
      <p>
        All rights, title, and interest in and to the Portal, including its
        source code, architecture, UI designs, brand assets, logos, and the
        USSTM navy design system, are the exclusive property of the
        Undergraduate Science Society of TMU or its licensors.
      </p>

      <h2>9. Disclaimers of Warranties</h2>
      <p className="uppercase text-sm text-muted-foreground">
        The Portal, its contents, and the public Events API are provided on an
        &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without
        warranties of any kind, either express or implied. USSTM does not
        warrant that the Portal will be uninterrupted, error-free, completely
        secure, or free of bugs.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p className="uppercase text-sm text-muted-foreground">
        To the maximum extent permitted by applicable law in Ontario and Canada,
        in no event shall USSTM, its board of directors, executives, officers,
        volunteers, student employees, or agents be liable for any indirect,
        incidental, special, consequential, or punitive damages. The aggregate
        liability of USSTM for all claims relating to the Portal shall be
        limited to fifty Canadian dollars ($50.00 CAD).
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless USSTM, its directors,
        officers, executives, student leaders, and agents from and against any
        claims, liabilities, damages, losses, costs, or expenses (including
        reasonable legal fees) arising from your breach of these Terms, your
        submitted content, your violation of university policy, or misconduct
        committed under your credentials.
      </p>

      <h2>12. Governing Law &amp; Dispute Resolution</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the
        laws of the Province of Ontario and the federal laws of Canada
        applicable therein. Any legal proceeding shall be instituted exclusively
        in the courts located in Toronto, Ontario, Canada.
      </p>

      <h2>13. Modifications to Terms</h2>
      <p>
        USSTM reserves the right to revise these Terms at any time. Your
        continued use of the Portal or public APIs following the posting of
        revised Terms constitutes your acceptance of the changes.
      </p>

      <h2>14. Contact Information</h2>
      <p>If you have questions concerning these Terms, please contact:</p>
      <div className="bg-card border border-border rounded-lg p-5 my-4">
        <p className="font-semibold text-foreground mb-1">
          Undergraduate Science Society of TMU (USSTM)
        </p>
        <p className="text-muted-foreground text-sm">
          40 Gould Street, Toronto, ON M5B 2K3, Canada
        </p>
        <p className="text-muted-foreground text-sm mt-2">
          Contact the USSTM Tech Committee through your student representative
          or via the portal contact page.
        </p>
      </div>
    </LegalLayout>
  )
}
