import { API_URL } from './config'
import type { PublicConfig, Session, SessionResult } from './types'

async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(API_URL + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

export const getConfig = () => request<PublicConfig>('/api/config')
export const getSessions = () => request<Session[]>('/api/sessions')
export const saveSession = (result: SessionResult) => request<{ id: number }>('/api/session', result)
export const saveMood = (score: number) => request<{ id: number }>('/api/mood', { score })
export const callNow = () => request<{ attempt_id: string }>('/api/call-now', {})
