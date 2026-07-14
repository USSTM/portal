alter table "oauthRefreshToken"
  alter column "id" set default gen_random_uuid()::text;

alter table "oauthAccessToken"
  alter column "id" set default gen_random_uuid()::text;

alter table "oauthConsent"
  alter column "id" set default gen_random_uuid()::text;
