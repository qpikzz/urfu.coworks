import { useSyncExternalStore } from 'react'
import { getState, subscribe } from './store.js'

const MINUTE_MS = 60 * 1000

function getVirtualMinute() {
  return Math.floor(getState().time.now / MINUTE_MS)
}

export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function useVirtualClockMinute() {
  return useSyncExternalStore(subscribe, getVirtualMinute, getVirtualMinute)
}
