const WM_ID = 'app-watermark-overlay'
const TILE_W = 300
const TILE_H = 200
const WM_Z_INDEX = 2147483647

let currentDataUrl = ''
let guardStarted = false
let guardPaused = false
let bodyObserver: MutationObserver | null = null

export function getThemeWatermarkColor(): string {
  if (typeof document === 'undefined') return 'rgba(0, 0, 0, 0.16)'
  const theme = document.documentElement.getAttribute('data-theme') || 'warm'
  return ['dark', 'purple'].includes(theme)
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(0, 0, 0, 0.16)'
}

export function getWatermarkContent(): string {
  if (typeof window === 'undefined') return '智知云'
  try {
    const stored = localStorage.getItem('zhizhi_user')
    if (stored) {
      const user = JSON.parse(stored) as { name?: string }
      if (user?.name) return user.name
    }
  } catch { /* ignore */ }
  return '智知云'
}

function cacheKey(content: string, color: string) {
  return `wm-cache:${content}:${color}`
}

export function buildWatermarkDataUrl(content: string, color: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = TILE_W
  canvas.height = TILE_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.translate(TILE_W / 2, TILE_H / 2)
  ctx.rotate((45 * Math.PI) / 180)
  ctx.font = '600 18px PingFang SC, Microsoft YaHei, sans-serif'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(content, 0, 0)
  return canvas.toDataURL('image/png')
}

function getCachedDataUrl(content: string, color: string): string | null {
  try {
    return sessionStorage.getItem(cacheKey(content, color))
  } catch {
    return null
  }
}

function setCachedDataUrl(content: string, color: string, dataUrl: string) {
  try {
    sessionStorage.setItem(cacheKey(content, color), dataUrl)
  } catch { /* ignore */ }
}

function watermarkStyle(dataUrl: string) {
  return [
    'position:fixed',
    'inset:0',
    'pointer-events:none',
    `z-index:${WM_Z_INDEX}`,
    'background-repeat:repeat',
    `background-size:${TILE_W}px ${TILE_H}px`,
    `background-image:url("${dataUrl}")`,
  ].join(';')
}

function isWatermarkIntact(el: HTMLElement): boolean {
  if (!el.isConnected) return false
  const cs = getComputedStyle(el)
  if (cs.display === 'none' || cs.visibility === 'hidden') return false
  if (Number.parseFloat(cs.opacity) === 0) return false
  if (!cs.backgroundImage || cs.backgroundImage === 'none') return false
  const z = cs.zIndex
  if (z !== 'auto' && Number(z) < 999999) return false
  return true
}

function repairWatermark() {
  if (guardPaused || !currentDataUrl || typeof document === 'undefined') return
  const el = document.getElementById(WM_ID) as HTMLElement | null
  if (!el || !isWatermarkIntact(el)) {
    guardPaused = true
    applyWatermarkOverlay(currentDataUrl)
    guardPaused = false
  }
}

/** 监听 DOM 篡改，删除或隐藏水印后立即恢复 */
export function startWatermarkGuard() {
  if (guardStarted || typeof document === 'undefined') return
  guardStarted = true

  if (typeof MutationObserver !== 'undefined') {
    bodyObserver = new MutationObserver(() => {
      queueMicrotask(repairWatermark)
    })
    bodyObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    })
  }
}

export function stopWatermarkGuard() {
  bodyObserver?.disconnect()
  bodyObserver = null
  guardStarted = false
}

export function applyWatermarkOverlay(dataUrl: string) {
  if (typeof document === 'undefined' || !dataUrl) return
  currentDataUrl = dataUrl
  let el = document.getElementById(WM_ID) as HTMLElement | null
  if (!el) {
    el = document.createElement('div')
    el.id = WM_ID
    el.setAttribute('aria-hidden', 'true')
    el.setAttribute('data-wm', '1')
    document.body.appendChild(el)
  }
  el.style.cssText = watermarkStyle(dataUrl)
}

/** 同步渲染水印，优先读 sessionStorage 缓存 */
export function renderWatermark(content?: string) {
  const text = content ?? getWatermarkContent()
  const color = getThemeWatermarkColor()
  let dataUrl = getCachedDataUrl(text, color)
  if (!dataUrl) {
    dataUrl = buildWatermarkDataUrl(text, color)
    if (dataUrl) setCachedDataUrl(text, color, dataUrl)
  }
  applyWatermarkOverlay(dataUrl)
  startWatermarkGuard()
}
