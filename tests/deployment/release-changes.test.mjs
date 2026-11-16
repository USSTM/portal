import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

test('documentation-only changes do not require an application release', () => {
  const result = spawnSync('bash', ['deployment/release-changes.sh'], {
    input: 'README.md\ndocs/production-deployment.md\n',
    encoding: 'utf8',
  })
  assert.equal(result.status, 0)
  assert.equal(result.stdout.trim(), 'skip')
})

test('application or deployment changes require a release', () => {
  const result = spawnSync('bash', ['deployment/release-changes.sh'], {
    input: 'docs/production-deployment.md\napps/portal/Dockerfile\n',
    encoding: 'utf8',
  })
  assert.equal(result.status, 0)
  assert.equal(result.stdout.trim(), 'deploy')
})
