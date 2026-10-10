'use client'

import { create } from 'zustand'

export interface ToastItem {
  id: number
  message: string
  tone: 'neutral' | 'success' | 'error'
}

interface ToastState {
  toasts: ToastItem[]
  show: (message: string, tone?: ToastItem['tone']) => void
  dismiss: (id: number) => void
}

let nextId = 1
export const TOAST_MS = 4000

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  show(message, tone = 'neutral') {
    const id = nextId++
    set({ toasts: [...get().toasts.slice(-2), { id, message, tone }] })
    setTimeout(() => get().dismiss(id), TOAST_MS)
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((x) => x.id !== id) })
  },
}))

export const toast = (message: string, tone?: ToastItem['tone']) =>
  useToasts.getState().show(message, tone)
