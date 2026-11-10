import {
  CLOCK_TICK_MS,
  DEFAULT_TIME_SPEED,
  MINUTE_MS,
  TIME_SPEEDS,
} from '../config.js'

let now = Date.now()
let lastRealNow = Date.now()
let speed = DEFAULT_TIME_SPEED
let intervalId = null
let currentMinute = Math.floor(now / MINUTE_MS)
const listeners = new Set()

function projectedNow() {
  return now + (Date.now() - lastRealNow) * speed
}

function advance() {
  const realNow = Date.now()

  if (realNow > lastRealNow) {
    now += (realNow - lastRealNow) * speed
    lastRealNow = realNow
  }

  return now
}

function emitMinuteChange() {
  const minute = Math.floor(projectedNow() / MINUTE_MS)

  if (minute === currentMinute) return

  currentMinute = minute
  listeners.forEach((listener) => listener())
}

export function getNow() {
  return advance()
}

export function getMinute() {
  return currentMinute
}

export function getSpeed() {
  return speed
}

export function setSpeed(nextSpeed) {
  if (!TIME_SPEEDS.includes(nextSpeed)) return false

  advance()
  speed = nextSpeed
  lastRealNow = Date.now()

  const minute = Math.floor(now / MINUTE_MS)

  if (minute !== currentMinute) {
    currentMinute = minute
    listeners.forEach((listener) => listener())
  }

  return true
}

export function subscribeMinute(listener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function startClock() {
  if (intervalId !== null) return

  advance()
  lastRealNow = Date.now()
  currentMinute = Math.floor(now / MINUTE_MS)
  intervalId = setInterval(emitMinuteChange, CLOCK_TICK_MS)
}

export function stopClock() {
  if (intervalId === null) return

  clearInterval(intervalId)
  intervalId = null
}
