import { API_URL } from './config'
import type { PublicConfig, Session, SessionResult } from './types'

async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(API_URL + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await errorText(res))
  return res.json()
}

// FastAPI puts the reason in "detail"; show that instead of raw JSON.
async function errorText(res: Response) {
  const text = await res.text()
  try {
    const { detail } = JSON.parse(text)
    return typeof detail === 'string' ? detail : JSON.stringify(detail)
  } catch {
    return text || `${res.status} ${res.statusText}`
  }
}

export const getConfig = () => request<PublicConfig>('/api/config')
export const getSessions = () => request<Session[]>('/api/sessions')
export const saveSession = (result: SessionResult) => request<{ id: number }>('/api/session', result)
export const saveMood = (score: number) => request<{ id: number }>('/api/mood', { score })
export const getCompanionToken = () => request<{ token: string }>('/api/companion/token')
export const callNow = () => request<{ attempt_id: string }>('/api/call-now', {})
