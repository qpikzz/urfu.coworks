import { useSyncExternalStore } from 'react'
import { getState, subscribe } from './store.js'
import { getMinute, subscribeMinute } from './virtualClock.js'

export function useStore() {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function useVirtualClockMinute() {
  return useSyncExternalStore(subscribeMinute, getMinute, getMinute)
}
