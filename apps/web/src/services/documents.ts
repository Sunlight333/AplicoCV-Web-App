import { env } from '@/lib/env'
import { tokenStore } from '@/lib/tokenStore'
import type { ParseProgressEvent } from '@/types'
import { delay, store } from './mock/store'
import { emptyProfile } from './mock/data'

export interface UploadResult {
  documentId: string
}

/**
 * Upload a CV with real upload-progress reporting. Uses XMLHttpRequest because
 * fetch does not expose upload progress events.
 */
export function uploadCv(
  file: File,
  onProgress: (pct: number) => void,
): Promise<UploadResult> {
  if (env.useMocks) {
    return new Promise((resolve) => {
      let pct = 0
      const timer = setInterval(() => {
        pct = Math.min(100, pct + 12)
        onProgress(pct)
        if (pct >= 100) {
          clearInterval(timer)
          resolve({ documentId: 'doc_mock_1' })
        }
      }, 120)
    })
  }

  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${env.apiBaseUrl}/documents/upload`)
    const token = tokenStore.get()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.withCredentials = true
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as UploadResult)
      } else {
        reject(new Error(`Upload failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(form)
  })
}

const MOCK_STAGES: Array<Omit<ParseProgressEvent, 'done' | 'profile'>> = [
  { stage: 'read', message: 'Reading document…' },
  { stage: 'work', message: 'Extracting work history…' },
  { stage: 'skills', message: 'Identifying skills…' },
  { stage: 'education', message: 'Structuring education…' },
  { stage: 'contact', message: 'Collecting contact details…' },
]

/**
 * Stream CV parsing progress. In real mode this consumes the FastAPI
 * StreamingResponse (SSE) at /documents/parse; the access token is sent via the
 * Authorization header using fetch streaming (EventSource cannot set headers).
 */
export async function* parseCv(
  documentId: string,
): AsyncGenerator<ParseProgressEvent> {
  if (env.useMocks) {
    for (const s of MOCK_STAGES) {
      await delay(700)
      yield { ...s, done: false }
    }
    await delay(500)
    yield {
      stage: 'complete',
      message: 'Done',
      done: true,
      profile: structuredClone({ ...emptyProfile, version: 1 }),
    }
    return
  }

  const res = await fetch(`${env.apiBaseUrl}/documents/parse?documentId=${documentId}`, {
    headers: {
      Authorization: `Bearer ${tokenStore.get() ?? ''}`,
      Accept: 'text/event-stream',
    },
    credentials: 'include',
  })
  if (!res.body) throw new Error('No stream returned from parse endpoint')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    // SSE frames are separated by a blank line.
    const frames = buffer.split('\n\n')
    buffer = frames.pop() ?? ''
    for (const frame of frames) {
      const dataLine = frame.split('\n').find((l) => l.startsWith('data:'))
      if (!dataLine) continue
      yield JSON.parse(dataLine.slice(5).trim()) as ParseProgressEvent
    }
  }
}

/** Persist the reviewed profile at the end of onboarding. */
export async function saveParsedProfile(profile: ParseProgressEvent['profile']) {
  if (env.useMocks) {
    await delay(200)
    if (profile) store.profile = profile
    return
  }
  await fetch(`${env.apiBaseUrl}/profiles/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenStore.get() ?? ''}`,
    },
    credentials: 'include',
    body: JSON.stringify(profile),
  })
}

/** Parse a pasted CV (plain text) into the profile — the alternative to upload. */
export async function parseText(text: string): Promise<ParseProgressEvent['profile']> {
  if (env.useMocks) {
    await delay(400)
    return store.profile
  }
  const res = await fetch(`${env.apiBaseUrl}/documents/parse-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenStore.get() ?? ''}`,
    },
    credentials: 'include',
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('Failed to parse pasted text')
  const data = (await res.json()) as { profile: ParseProgressEvent['profile'] }
  return data.profile
}
