import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

test('a release pulls images, migrates, and checks the new services before recording success', () => {
  const directory = mkdtempSync(join(tmpdir(), 'usstm-release-test-'))
  const log = join(directory, 'calls')
  writeFileSync(log, '')
  for (const executable of ['docker', 'curl', 'flock']) {
    writeFileSync(
      join(directory, executable),
      `#!/bin/sh\nprintf '%s %s\\n' '${executable}' "$*" >> "$RELEASE_TEST_LOG"\n`,
      { mode: 0o755 },
    )
  }
  const digest = 'a'.repeat(64)
  const result = spawnSync('bash', [resolve('deployment/release.sh')], {
    env: {
      ...process.env,
      APP_ENV_FILE: join(directory, 'app.env'),
      AUTH_IMAGE: `ghcr.io/usstm/portal-auth@sha256:${digest}`,
      BACKUP_IMAGE: `ghcr.io/usstm/portal-backup@sha256:${digest}`,
      DEPLOY_STATE_DIR: join(directory, 'state'),
      MIGRATE_IMAGE: `ghcr.io/usstm/portal-migrate@sha256:${digest}`,
      PATH: `${directory}:${process.env.PATH}`,
      PORTAL_IMAGE: `ghcr.io/usstm/portal-web@sha256:${digest}`,
      RELEASE_SHA: 'b'.repeat(40),
      RELEASE_RUN_NUMBER: '42',
      RELEASE_TEST_LOG: log,
      ROLLBACK_COMPATIBLE: 'true',
    },
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  const calls = readFileSync(log, 'utf8')
  assert.match(calls, /docker .* pull .*portal.*auth.*migrate/)
  assert.match(calls, /docker .* run .*migrate/)
  assert.match(calls, /docker .* run .*backup.*backup-now/)
  assert.ok(
    calls.indexOf(' backup backup-now') <
      calls.indexOf(' run ', calls.indexOf(' backup backup-now')),
  )
  assert.match(calls, /docker .* up .*portal.*auth/)
  assert.ok(calls.indexOf(' pull ') < calls.indexOf(' run '))
  assert.ok(calls.indexOf(' run ') < calls.lastIndexOf(' up '))
  assert.match(calls, /curl .*\/health\/ready/)
  assert.match(
    readFileSync(join(directory, 'state/current.env'), 'utf8'),
    /RELEASE_SHA=b{40}/,
  )
})

test('a compatible failed release restores the previous application images', () => {
  const directory = mkdtempSync(join(tmpdir(), 'usstm-release-rollback-'))
  const log = join(directory, 'calls')
  const state = join(directory, 'state')
  mkdirSync(state)
  writeFileSync(log, '')
  writeFileSync(join(state, 'current.env'), 'RELEASE_RUN_NUMBER=41\n')
  writeFileSync(
    join(directory, 'docker'),
    '#!/bin/sh\nprintf "docker %s\\n" "$*" >> "$RELEASE_TEST_LOG"\ncase "$*" in *".candidate."*" up "*"portal"*) exit 1;; esac\n',
    { mode: 0o755 },
  )
  for (const executable of ['curl', 'flock']) {
    writeFileSync(join(directory, executable), '#!/bin/sh\nexit 0\n', {
      mode: 0o755,
    })
  }
  const digest = 'a'.repeat(64)
  const result = spawnSync('bash', [resolve('deployment/release.sh')], {
    env: {
      ...process.env,
      APP_ENV_FILE: join(directory, 'app.env'),
      AUTH_IMAGE: `ghcr.io/usstm/portal-auth@sha256:${digest}`,
      BACKUP_IMAGE: `ghcr.io/usstm/portal-backup@sha256:${digest}`,
      DEPLOY_STATE_DIR: state,
      MIGRATE_IMAGE: `ghcr.io/usstm/portal-migrate@sha256:${digest}`,
      PATH: `${directory}:${process.env.PATH}`,
      PORTAL_IMAGE: `ghcr.io/usstm/portal-web@sha256:${digest}`,
      RELEASE_SHA: 'b'.repeat(40),
      RELEASE_RUN_NUMBER: '42',
      RELEASE_TEST_LOG: log,
      ROLLBACK_COMPATIBLE: 'true',
    },
    encoding: 'utf8',
  })
  assert.notEqual(result.status, 0)
  assert.match(readFileSync(log, 'utf8'), /current\.env .* up .*portal.*auth/)
  assert.equal(
    readFileSync(join(state, 'current.env'), 'utf8'),
    'RELEASE_RUN_NUMBER=41\n',
  )
})

test('an older release cannot overwrite a newer successful release', () => {
  const directory = mkdtempSync(join(tmpdir(), 'usstm-release-stale-'))
  const state = join(directory, 'state')
  const log = join(directory, 'calls')
  mkdirSync(state)
  writeFileSync(log, '')
  writeFileSync(join(state, 'current.env'), 'RELEASE_RUN_NUMBER=41\n')
  writeFileSync(join(state, 'highest-run'), '43\n')
  for (const executable of ['docker', 'curl', 'flock']) {
    writeFileSync(
      join(directory, executable),
      `#!/bin/sh\nprintf '%s\\n' '${executable}' >> "$RELEASE_TEST_LOG"\n`,
      { mode: 0o755 },
    )
  }
  const digest = 'a'.repeat(64)
  const result = spawnSync('bash', [resolve('deployment/release.sh')], {
    env: {
      ...process.env,
      APP_ENV_FILE: join(directory, 'app.env'),
      AUTH_IMAGE: `ghcr.io/usstm/portal-auth@sha256:${digest}`,
      BACKUP_IMAGE: `ghcr.io/usstm/portal-backup@sha256:${digest}`,
      DEPLOY_STATE_DIR: state,
      MIGRATE_IMAGE: `ghcr.io/usstm/portal-migrate@sha256:${digest}`,
      PATH: `${directory}:${process.env.PATH}`,
      PORTAL_IMAGE: `ghcr.io/usstm/portal-web@sha256:${digest}`,
      RELEASE_SHA: 'b'.repeat(40),
      RELEASE_RUN_NUMBER: '42',
      RELEASE_TEST_LOG: log,
      ROLLBACK_COMPATIBLE: 'true',
    },
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /superseded/)
  assert.doesNotMatch(readFileSync(log, 'utf8'), /docker/)
  assert.equal(
    readFileSync(join(state, 'current.env'), 'utf8'),
    'RELEASE_RUN_NUMBER=41\n',
  )
})

test('an incompatible failed release does not automatically roll back the application', () => {
  const directory = mkdtempSync(join(tmpdir(), 'usstm-release-unsafe-'))
  const state = join(directory, 'state')
  const log = join(directory, 'calls')
  mkdirSync(state)
  writeFileSync(log, '')
  writeFileSync(join(state, 'current.env'), 'RELEASE_RUN_NUMBER=41\n')
  writeFileSync(
    join(directory, 'docker'),
    '#!/bin/sh\nprintf "docker %s\\n" "$*" >> "$RELEASE_TEST_LOG"\ncase "$*" in *".candidate."*" up "*"portal"*) exit 1;; esac\n',
    { mode: 0o755 },
  )
  writeFileSync(join(directory, 'flock'), '#!/bin/sh\nexit 0\n', {
    mode: 0o755,
  })
  const digest = 'a'.repeat(64)
  const result = spawnSync('bash', [resolve('deployment/release.sh')], {
    env: {
      ...process.env,
      APP_ENV_FILE: join(directory, 'app.env'),
      AUTH_IMAGE: `ghcr.io/usstm/portal-auth@sha256:${digest}`,
      BACKUP_IMAGE: `ghcr.io/usstm/portal-backup@sha256:${digest}`,
      DEPLOY_STATE_DIR: state,
      MIGRATE_IMAGE: `ghcr.io/usstm/portal-migrate@sha256:${digest}`,
      PATH: `${directory}:${process.env.PATH}`,
      PORTAL_IMAGE: `ghcr.io/usstm/portal-web@sha256:${digest}`,
      RELEASE_SHA: 'b'.repeat(40),
      RELEASE_RUN_NUMBER: '42',
      RELEASE_TEST_LOG: log,
      ROLLBACK_COMPATIBLE: 'false',
    },
    encoding: 'utf8',
  })
  assert.notEqual(result.status, 0)
  assert.doesNotMatch(readFileSync(log, 'utf8'), /current\.env .* up .*portal/)
  assert.match(result.stderr, /manual intervention is required/)
})
