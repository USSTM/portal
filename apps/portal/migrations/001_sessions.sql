create table "oauthFlow" (
  "id" text primary key,
  "state" text not null unique,
  "codeVerifier" text not null,
  "createdAt" timestamptz default current_timestamp not null,
  "expiresAt" timestamptz not null
);

create table "portalSession" (
  "id" text primary key,
  "subject" text not null,
  "email" text not null,
  "accessToken" text not null,
  "refreshToken" text,
  "accessTokenExpiresAt" timestamptz not null,
  "idleExpiresAt" timestamptz not null,
  "absoluteExpiresAt" timestamptz not null,
  "createdAt" timestamptz default current_timestamp not null,
  "revokedAt" timestamptz
);

create index "portalSession_subject_idx" on "portalSession" ("subject");
