import { readJSON, writeJSON } from './storage'

// kvdb.io is a free, keyless JSON-over-HTTP store meant for exactly this kind
// of "no backend of our own" browser use case: PUT/GET by URL, no signup.
// It's a third-party service with no SLA — live sharing degrades gracefully
// (clear error surfaced in the UI) if it's ever unreachable or slow.
const KVDB_BASE = 'https://kvdb.io'
const BUCKET_STORAGE_KEY = 'odometer.liveShareBucket'

async function ensureBucket() {
  const cached = readJSON(localStorage, BUCKET_STORAGE_KEY, null)
  if (cached) return cached

  const res = await fetch(`${KVDB_BASE}/`, { method: 'POST' })
  if (!res.ok) throw new Error(`Could not reach the sharing service (${res.status})`)
  const bucket = (await res.text()).trim()
  if (!bucket) throw new Error('Sharing service returned no bucket id')
  writeJSON(localStorage, BUCKET_STORAGE_KEY, bucket)
  return bucket
}

function makeKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

async function putValue(bucket, key, payload) {
  const res = await fetch(`${KVDB_BASE}/${bucket}/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Could not reach the sharing service (${res.status})`)
}

export async function createLiveShare(payload) {
  const bucket = await ensureBucket()
  const key = makeKey()
  await putValue(bucket, key, payload)
  return `${bucket}.${key}`
}

export async function updateLiveShare(id, payload) {
  const [bucket, key] = id.split('.')
  if (!bucket || !key) throw new Error('Malformed live share id')
  await putValue(bucket, key, payload)
}

export async function fetchLiveShare(id) {
  const [bucket, key] = id.split('.')
  if (!bucket || !key) throw new Error('Malformed live share link')
  const res = await fetch(`${KVDB_BASE}/${bucket}/${key}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Could not reach the sharing service (${res.status})`)
  return res.json()
}
