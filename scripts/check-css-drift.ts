import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'

const FRONTEND_REPO_PATH =
  process.env.FRONTEND_REPO_PATH ?? '/Users/harshkhandelwal/Documents/frontend-ai-orchestrator'
const UPSTREAM_FILE = path.join(FRONTEND_REPO_PATH, 'app', 'globals.css')
const LOCAL_FILE = path.join(process.cwd(), 'styles', 'globals.css')

async function main() {
  let upstream: string
  try {
    upstream = await fs.readFile(UPSTREAM_FILE, 'utf8')
  } catch (e) {
    console.error(`[check-css-drift] cannot read ${UPSTREAM_FILE}: ${e}`)
    console.error('Set FRONTEND_REPO_PATH or run from a machine with the frontend repo checked out.')
    process.exit(2)
  }

  const local = await fs.readFile(LOCAL_FILE, 'utf8')

  const localTrimmed = local.split('/* === LIGHT MODE ===')[0]?.trimEnd() ?? local
  const upstreamTrimmed = upstream.trimEnd()

  if (localTrimmed === upstreamTrimmed) {
    console.log('[check-css-drift] no drift — local matches upstream')
    process.exit(0)
  }

  console.log('[check-css-drift] DRIFT DETECTED. Diff:\n')
  try {
    execSync(`diff -u "${UPSTREAM_FILE}" "${LOCAL_FILE}" || true`, { stdio: 'inherit' })
  } catch {
    // diff returns 1 when files differ; that's expected
  }
  process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
