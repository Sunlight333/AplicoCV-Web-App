import { api } from '@/lib/apiClient'
import { env } from '@/lib/env'
import { delay } from './mock/store'

export interface FaqAnswer {
  id: string
  question: string
  answer: string
}

let mockFaq: FaqAnswer[] = []

export async function listFaq(): Promise<FaqAnswer[]> {
  if (env.useMocks) {
    await delay(150)
    return mockFaq
  }
  return api.get<FaqAnswer[]>('/faq')
}

export async function suggestedQuestions(): Promise<string[]> {
  if (env.useMocks) {
    await delay(100)
    return ['Why do you want to work here?', 'What are your salary expectations?']
  }
  return api.get<string[]>('/faq/suggested')
}

export async function createFaq(question: string, answer: string): Promise<FaqAnswer> {
  if (env.useMocks) {
    await delay()
    const f = { id: crypto.randomUUID(), question, answer }
    mockFaq = [...mockFaq, f]
    return f
  }
  return api.post<FaqAnswer>('/faq', { question, answer })
}

export async function updateFaq(id: string, question: string, answer: string): Promise<FaqAnswer> {
  if (env.useMocks) {
    await delay()
    mockFaq = mockFaq.map((f) => (f.id === id ? { ...f, question, answer } : f))
    return { id, question, answer }
  }
  return api.put<FaqAnswer>(`/faq/${id}`, { question, answer })
}

export async function deleteFaq(id: string): Promise<void> {
  if (env.useMocks) {
    await delay()
    mockFaq = mockFaq.filter((f) => f.id !== id)
    return
  }
  await api.delete(`/faq/${id}`)
}
