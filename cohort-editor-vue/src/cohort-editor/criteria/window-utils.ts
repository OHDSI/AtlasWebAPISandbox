import type { Offset, Window } from '../circe.types'

export interface WindowPresetValue {
  startWindow: Window
  endWindow?: Window
}

export interface WindowPresetOption {
  label: string
  value: WindowPresetValue
}

export function createDefaultWindow(): Window {
  return {
    Start: createDefaultEndpoint(-1),
    End: createDefaultEndpoint(1),
    UseIndexEnd: false,
    UseEventEnd: false,
  }
}

export function cloneWindow(window: Window): Window {
  return {
    Start: cloneEndpoint(window.Start, -1),
    End: cloneEndpoint(window.End, 1),
    UseIndexEnd: window.UseIndexEnd ?? false,
    UseEventEnd: window.UseEventEnd ?? false,
  }
}

export function formatWindowSummary(window?: Window, label = 'Window'): string {
  if (!window) {
    return `${label}: not set`
  }

  return formatWindowExpression(window)
}

export function formatWindowExpression(window?: Window): string {
  if (!window) {
    return 'No window'
  }

  return `${formatAnchor(window)} between ${formatEndpoint(window.Start)} and ${formatEndpoint(window.End)} ${formatIndexAnchor(window)}`
}

export function getWindowPresetOptions(): WindowPresetOption[] {
  return [
    buildPreset('Short-term baseline (−30 to 0 days)',
      createWindow(30, 'before', 0, 'after'),
      undefined
    ),
    buildPreset('Medium-term baseline (−180 to 0 days)',
      createWindow(180, 'before', 0, 'after'),
      undefined
    ),
    buildPreset('Long-term baseline (−365 to 0 days)',
      createWindow(365, 'before', 0, 'after'),
      undefined
    ),
    buildPreset('All time prior to index',
      createWindow(null, 'before', 0, 'after'),
      undefined
    ),
    buildPreset('On index date',
      createWindow(0, 'after', 0, 'after'),
      createWindow(0, 'after', 0, 'after')
    ),
    buildPreset('Acute follow-up (0 to 30 days after)',
      createWindow(0, 'after', 0, 'after'),
      undefined
    ),
    buildPreset('90-day follow-up (0 to 90 days after)',
      createWindow(0, 'after', 0, 'after'),
      createWindow(0, 'after', 90, 'after')
    ),
    buildPreset('1-year follow-up (0 to 365 days after)',
      createWindow(0, 'after', 0, 'after'),
      createWindow(0, 'after', 365, 'after')
    ),
    buildPreset('All time after index',
      createWindow(0, 'after', 0, 'after'),
      undefined
    ),buildPreset('event overlapps with index',
      createWindow(0, 'after', null, 'after',false, true),
      createWindow(null, 'before', 0, 'after',true, false)
    ),
  ]
}

function createDefaultEndpoint(coeff: number): Offset {
  return {
    Days: null,
    Coeff: coeff,
  }
}

function createWindow(
  startDays: number | null,
  startDirection: 'before' | 'after',
  endDays: number | null,
  endDirection: 'before' | 'after',
  useIndexEnd = false,
  useEventEnd = false
): Window {
  return {
    Start: {
      Days: startDays,
      Coeff: startDirection === 'after' ? 1 : -1,
    },
    End: {
      Days: endDays,
      Coeff: endDirection === 'after' ? 1 : -1,
    },
    UseIndexEnd: useIndexEnd,
    UseEventEnd: useEventEnd,
  }
}

function buildPreset(label: string, startWindow: Window, endWindow?: Window): WindowPresetOption {
  return {
    label,
    value: {
      startWindow: cloneWindow(startWindow),
      ...(endWindow ? { endWindow: cloneWindow(endWindow) } : {}),
    },
  }
}

function cloneEndpoint(endpoint: Offset | undefined, defaultCoeff: number): Offset {
  return {
    Days: endpoint?.Days ?? null,
    Coeff: endpoint?.Coeff ?? defaultCoeff,
  }
}

function formatEndpoint(endpoint: Offset | undefined): string {
  if (!endpoint) {
    return 'unset'
  }

  const direction = endpoint.Coeff === -1 ? 'before' : 'after'
  const days = endpoint.Days === null || endpoint.Days === undefined ? 'all days' : `${endpoint.Days} day${endpoint.Days === 1 ? '' : 's'}`

  return `${days} ${direction}`
}

function formatAnchor(window: Pick<Window, 'UseIndexEnd' | 'UseEventEnd'>): string {
  return window.UseEventEnd ? 'event ends' : 'event starts'
}

function formatIndexAnchor(window: Pick<Window, 'UseIndexEnd' | 'UseEventEnd'>): string {
  if (window.UseIndexEnd && window.UseEventEnd) {
    return 'index end'
  }

  if (window.UseIndexEnd) {
    return 'index end'
  }

  return 'index start'
}