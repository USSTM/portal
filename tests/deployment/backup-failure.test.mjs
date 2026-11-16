import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

test('a failed repository check never initializes a backup repository', () => {
  const directory = mkdtempSync(join(tmpdir(), 'usstm-backup-test-'))
  const calls = join(directory, 'calls')
  writeFileSync(calls, '')
  writeFileSync(
    join(directory, 'restic'),
    '#!/bin/sh\nprintf "%s\\n" "$1" >> "$BACKUP_TEST_CALLS"\nexit 1\n',
    { mode: 0o755 },
  )
  const result = spawnSync('bash', [resolve('deployment/backup/backup-now')], {
    env: {
      ...process.env,
      BACKUP_TEST_CALLS: calls,
      DATABASE_NAME: 'test',
      DATABASE_PASSWORD: 'test',
      DATABASE_USER: 'test',
      PATH: `${directory}:${process.env.PATH}`,
      RESTIC_PASSWORD: 'test',
      RESTIC_REPOSITORY: 'test',
    },
  })

  assert.notEqual(result.status, 0)
  assert.doesNotMatch(readFileSync(calls, 'utf8'), /^init$/m)
})

test('EC2 role mode does not pass static AWS credentials to restic', () => {
  const directory = mkdtempSync(join(tmpdir(), 'usstm-backup-role-test-'))
  const calls = join(directory, 'credentials')
  writeFileSync(
    join(directory, 'restic'),
    '#!/bin/sh\nprintf "%s" "${AWS_ACCESS_KEY_ID-unset}" > "$BACKUP_TEST_CALLS"\nexit 1\n',
    { mode: 0o755 },
  )
  spawnSync('bash', [resolve('deployment/backup/backup-now')], {
    env: {
      ...process.env,
      AWS_ACCESS_KEY_ID: 'placeholder',
      AWS_SECRET_ACCESS_KEY: 'placeholder',
      AWS_USE_EC2_ROLE: 'true',
      BACKUP_TEST_CALLS: calls,
      DATABASE_NAME: 'test',
      DATABASE_PASSWORD: 'test',
      DATABASE_USER: 'test',
      PATH: `${directory}:${process.env.PATH}`,
      RESTIC_PASSWORD: 'test',
      RESTIC_REPOSITORY: 'test',
    },
  })
  assert.equal(readFileSync(calls, 'utf8'), 'unset')
})
