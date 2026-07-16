import type { CompanyRecord } from '~/types/company'

export type RegionSelectPayload =
  | { type: 'park', park_id: number, name: string }
  | { type: 'zone', name: string }
  | { type: 'city', name: string, adcode: number }

export interface ParkInfo {
  park_id: number
  park_name: string
  num?: number
}

export function matchParkId(layerName: string, parks: ParkInfo[]): number | null {
  const name = layerName.trim()
  if (!name) return null
  const exact = parks.find(p => p.park_name === name)
  if (exact) return exact.park_id
  const stripped = name.replace(/^光谷/, '')
  const byStripped = parks.find(p => p.park_name === stripped)
  if (byStripped) return byStripped.park_id
  const contained = parks.find(p => name.includes(p.park_name) || p.park_name.includes(stripped))
  return contained?.park_id ?? null
}

const INDUSTRY_COLORS: Record<string, string> = {
  '信息技术': '#6366f1', '人工智能': '#8b5cf6', '云计算': '#3b82f6',
  '半导体': '#0ea5e9', '网络安全': '#06b6d4', '金融科技': '#10b981',
  '新能源': '#22c55e', '新能源汽车': '#84cc16', '汽车制造': '#eab308',
  '智能制造': '#f59e0b', '节能环保': '#14b8a6', '新材料': '#a855f7',
  '高端装备': '#f97316', '电子': '#0ea5e9', '通信': '#6366f1',
  '软件': '#8b5cf6', '信息服务': '#3b82f6', '医疗健康': '#ec4899',
  '仪器仪表': '#f43f5e', '技术服务': '#14b8a6', '建筑': '#64748b',
  '电力': '#f59e0b', '制造': '#78716c', '生物': '#22c55e',
  '化工': '#84cc16', '食品': '#f97316', '物流': '#06b6d4',
  '金融服务': '#10b981', '房地产': '#ef4444', '制药': '#ec4899',
  '医疗器械': '#f43f5e', '测绘': '#6366f1', '检测': '#14b8a6',
  '科研服务': '#8b5cf6', '科技': '#3b82f6', '工程技术': '#0ea5e9',
  '环保工程': '#14b8a6', '农业': '#22c55e', '文化创意': '#a855f7',
  '电子商务': '#f97316', '批发零售': '#64748b', '租赁': '#78716c',
  '其他': '#94a3b8',
}

export function getIndustryColor(industry: string): string {
  return INDUSTRY_COLORS[industry] || '#6366f1'
}

const HIGHLIGHT_PROVINCE = '\u6e56\u5317\u7701'
const HIGHLIGHT_CITY = '\u6b66\u6c49\u5e02'
const ZONE_LABEL = '\u9ad8\u65b0\u533a'

const WUHAN_CENTER: [number, number] = [30.5928, 114.3055]
const WUHAN_ZOOM = 12
const WUHAN_FIT_MAX_ZOOM = 13

type BlurFocusMode = 'hubei' | 'wuhan' | 'zone' | 'city'

type HoverTarget =
  | { kind: 'park', feature: GeoJSON.Feature }
  | { kind: 'city', feature: GeoJSON.Feature }
  | { kind: 'province', feature: GeoJSON.Feature }

type AMapLike = any

declare global {
  interface Window {
    AMap?: AMapLike
    _AMapSecurityConfig?: Record<string, string>
    __amapPromise__?: Promise<AMapLike>
  }
}

const HOVER_OUTLINE = {
  strokeColor: '#ea580c',
  strokeWeight: 5,
  strokeOpacity: 1,
  fillOpacity: 0.08,
  fillColor: '#ea580c',
}

const HOVER_CITY_OUTLINE = {
  strokeColor: '#ff3b30',
  strokeWeight: 5,
  strokeOpacity: 1,
  fillOpacity: 0.25,
  fillColor: '#ff3b30',
}

const FOCUSED_CITY_STYLE = {
  strokeColor: '#ff3b30',
  strokeWeight: 5,
  strokeOpacity: 1,
  fillOpacity: 0.25,
  fillColor: '#ff3b30',
}

function getCityStyle(
  feature: GeoJSON.Feature | undefined,
  hovered = false,
  focusMode: BlurFocusMode = 'wuhan',
  focusedAdcode?: number | null,
) {
  const isWuhan = feature?.properties?.name === HIGHLIGHT_CITY
  if (hovered) return { ...HOVER_CITY_OUTLINE }
  if (focusedAdcode != null && feature?.properties?.adcode === focusedAdcode) {
    return { ...FOCUSED_CITY_STYLE }
  }
  // 武汉市边界：任何视图下都高亮显示（青蓝描边 + 轻微填充，营造发光边界感）
  if (isWuhan) {
    return {
      strokeColor: '#06b6d4',
      strokeWeight: 3.5,
      strokeOpacity: 1,
      fillOpacity: 0.06,
      fillColor: '#22d3ee',
    }
  }
  if (focusMode === 'zone') {
    return {
      strokeColor: '#94a3b8',
      strokeWeight: hovered ? 1.5 : 1,
      strokeOpacity: hovered ? 0.35 : 0.22,
      fillOpacity: 0,
      fillColor: 'transparent',
    }
  }
  return {
    strokeColor: '#6366f1',
    strokeWeight: 2,
    strokeOpacity: 0.85,
    fillOpacity: 0,
    fillColor: 'transparent',
  }
}

function getProvinceStyle(
  _feature: GeoJSON.Feature | undefined,
  hovered = false,
  focusMode: BlurFocusMode = 'wuhan',
) {
  if (hovered) return { ...HOVER_OUTLINE }
  // 湖北省范围：任何视图下都以科技蓝虚线高亮描边
  return {
    strokeColor: '#2f7cf6',
    strokeWeight: focusMode === 'zone' ? 2 : 2.4,
    strokeOpacity: focusMode === 'zone' ? 0.62 : 0.82,
    strokeStyle: 'dashed',
    fillOpacity: 0,
    fillColor: 'transparent',
  }
}

function getZoneStyle(hovered = false, focusMode: BlurFocusMode = 'wuhan') {
  if (hovered) {
    return {
      strokeColor: '#dc2626',
      strokeWeight: 3,
      strokeOpacity: 1,
      fillOpacity: 0,
      fillColor: 'transparent',
    }
  }
  if (focusMode === 'zone') {
    return {
      strokeColor: '#ea580c',
      strokeWeight: 2.75,
      strokeOpacity: 0.98,
      fillOpacity: 0,
      fillColor: 'transparent',
    }
  }
  return {
    strokeColor: '#ea580c',
    strokeWeight: 2.5,
    strokeOpacity: 0.95,
    fillOpacity: 0,
    fillColor: 'transparent',
  }
}

const PARK_COLORS: Record<number, string> = {
  1: '#2563eb',
  2: '#16a34a',
  3: '#9333ea',
  4: '#0891b2',
  5: '#d97706',
  6: '#dc2626',
  7: '#db2777',
}

const FALLBACK_PARK_COLORS = ['#64748b', '#78716c', '#0d9488', '#ca8a04']

function getParkColor(parkId: number | null | undefined, fallbackIndex = 0): string {
  if (parkId && PARK_COLORS[parkId]) return PARK_COLORS[parkId]
  return FALLBACK_PARK_COLORS[fallbackIndex % FALLBACK_PARK_COLORS.length]
}

function getParkStyle(
  parkId: number | null | undefined,
  hovered = false,
  focusedParkId: number | null = null,
  fallbackIndex = 0,
  focusedUnmappedIndex: number | null = null,
) {
  const color = getParkColor(parkId, fallbackIndex)
  const isFocused = (focusedParkId != null && parkId === focusedParkId)
    || (focusedUnmappedIndex != null && parkId == null && fallbackIndex === focusedUnmappedIndex)
  const dimmed = focusedParkId != null
    ? parkId !== focusedParkId
    : focusedUnmappedIndex != null
      ? !(parkId == null && fallbackIndex === focusedUnmappedIndex)
      : false
  if (hovered) {
    return {
      strokeColor: color,
      strokeWeight: 4,
      strokeOpacity: 1,
      fillOpacity: 0,
      fillColor: 'transparent',
    }
  }
  if (isFocused) {
    return {
      strokeColor: color,
      strokeWeight: 3.5,
      strokeOpacity: 1,
      fillOpacity: 0,
      fillColor: 'transparent',
    }
  }
  if (dimmed) {
    return {
      strokeColor: color,
      strokeWeight: 1.5,
      strokeOpacity: 0.12,
      fillOpacity: 0,
      fillColor: 'transparent',
    }
  }
  return {
    strokeColor: color,
    strokeWeight: 2.75,
    strokeOpacity: 0.95,
    fillOpacity: 0,
    fillColor: 'transparent',
  }
}

function filterCompaniesInPark(companies: CompanyRecord[], parkId: number, features: GeoJSON.Feature[]): CompanyRecord[] {
  const polys = features.filter(f => f.properties?.park_id === parkId && f.geometry)
  if (!polys.length) return companies
  return companies.filter(c => polys.some(f => pointInGeoJSON(c.company_longitude, c.company_latitude, f.geometry!)))
}

function outerRingsFromGeometry(geometry: GeoJSON.Geometry): number[][][] {
  if (geometry.type === 'Polygon') return [geometry.coordinates[0]]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.map(p => p[0])
  return []
}

function ringBBoxArea(ring: number[][]): number {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  for (const [lng, lat] of ring) {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }
  return (maxLng - minLng) * (maxLat - minLat)
}

function featureHitArea(feature: GeoJSON.Feature): number {
  const geom = feature.geometry
  if (!geom) return Infinity
  const rings = outerRingsFromGeometry(geom)
  if (!rings.length) return Infinity
  return Math.min(...rings.map(ringBBoxArea))
}

function pointInRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

function pointInGeoJSON(lng: number, lat: number, geometry: GeoJSON.Geometry): boolean {
  if (geometry.type === 'Polygon') {
    const [outer, ...holes] = geometry.coordinates
    if (!pointInRing(lng, lat, outer)) return false
    return !holes.some(h => pointInRing(lng, lat, h))
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((poly) => {
      const [outer, ...holes] = poly
      if (!pointInRing(lng, lat, outer)) return false
      return !holes.some(h => pointInRing(lng, lat, h))
    })
  }
  return false
}

function findFeatureAt(
  latlng: { lat: number, lng: number },
  features: GeoJSON.Feature[],
  bboxCache?: Map<GeoJSON.Feature, [number, number, number, number] | null>,
): GeoJSON.Feature | null {
  const lng = latlng.lng
  const lat = latlng.lat
  const hits: GeoJSON.Feature[] = []
  for (let i = 0; i < features.length; i++) {
    const f = features[i]
    if (!f.geometry) continue
    let bbox = bboxCache?.get(f)
    if (bbox === undefined) {
      bbox = bboxFromGeometry(f.geometry)
      bboxCache?.set(f, bbox ?? null)
    }
    if (bbox && (lng < bbox[0] || lng > bbox[2] || lat < bbox[1] || lat > bbox[3])) continue
    if (pointInGeoJSON(lng, lat, f.geometry)) hits.push(f)
  }
  if (!hits.length) return null
  if (hits.length === 1) return hits[0]
  return hits.reduce((best, f) => (featureHitArea(f) < featureHitArea(best) ? f : best))
}

function filterCompaniesInZone(companies: CompanyRecord[], zone: GeoJSON.FeatureCollection): CompanyRecord[] {
  const polys = zone.features.filter(f => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
  if (!polys.length) return companies
  return companies.filter(c => polys.some(f => pointInGeoJSON(c.company_longitude, c.company_latitude, f.geometry!)))
}

function bboxFromGeometry(geometry: GeoJSON.Geometry): [number, number, number, number] | null {
  const rings = outerRingsFromGeometry(geometry)
  if (!rings.length) return null
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity
  rings.flat().forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng)
    maxLng = Math.max(maxLng, lng)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  })
  return [minLng, minLat, maxLng, maxLat]
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function companyLabelHtml(color: string, name: string, highlighted = false) {
  const displayName = name.length > 12 ? `${name.slice(0, 12)}...` : name
  return `<div class="gs-company-wrap${highlighted ? ' gs-company-highlight' : ''}">
    <div class="gs-company-label">${escapeHtml(displayName)}</div>
    <div class="gs-company-dot" style="background:${color}"></div>
  </div>`
}

function companyDotHtml(color: string, highlighted = false) {
  return `<div class="gs-company-wrap gs-company-wrap-dot-only${highlighted ? ' gs-company-highlight' : ''}">
    <div class="gs-company-dot" style="background:${color}"></div>
  </div>`
}

function clusterBubbleHtml(count: number, highlighted = false) {
  return `<div class="gs-cluster-bubble${highlighted ? ' gs-cluster-bubble-highlight' : ''}">${count}</div>`
}

function isCompanyHighlighted(c: CompanyRecord, highlightedIds: Set<string>) {
  return highlightedIds.has(c.id) || highlightedIds.has(c.company_credit_code)
}

function loadAmap(key: string, securityCode: string) {
  if (typeof window === 'undefined') return Promise.reject(new Error('AMap only runs in browser'))
  if ((window as any).AMap) return Promise.resolve((window as any).AMap)
  if ((window as any).__amapPromise__) return (window as any).__amapPromise__

  if (securityCode) {
    window._AMapSecurityConfig = { securityJsCode: securityCode }
  }

  window.__amapPromise__ = new Promise((resolve, reject) => {
    const callbackName = `__amap_init_${Date.now()}`
    ;(window as any)[callbackName] = () => {
      resolve((window as any).AMap)
      delete (window as any)[callbackName]
    }

    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.LabelsLayer,AMap.LabelMarker&callback=${callbackName}`
    script.async = true
    script.onerror = () => {
      delete (window as any)[callbackName]
      reject(new Error('Failed to load AMap JS API'))
    }
    document.head.appendChild(script)
  })

  return window.__amapPromise__
}

export function useGeoAmapMap() {
  const config = useRuntimeConfig()

  const mapContainerRef = ref<HTMLDivElement>()
  const mapReady = ref(false)
  const quickView = ref<'zone' | 'wuhan' | null>(null)
  const showCompanyLabels = ref(true)

  let AMap: AMapLike | null = null
  let map: any = null
  let latestCompanies: CompanyRecord[] = []
  let highlightedCompanyIds = new Set<string>()
  let baseCompanies: CompanyRecord[] = []
  let focusedParkId: number | null = null
  let focusedUnmappedParkIndex: number | null = null
  let hoveringCompanyMarker = false

  let zoneFeatures: GeoJSON.Feature[] = []
  let zoneBboxCache: Map<GeoJSON.Feature, [number, number, number, number] | null> = new Map()
  let cityFeatures: GeoJSON.Feature[] = []
  let cityBboxCache: Map<GeoJSON.Feature, [number, number, number, number] | null> = new Map()
  const cityList = ref<{ adcode: number, name: string }[]>([])
  let otherProvinceFeatures: GeoJSON.Feature[] = []
  let hubeiFeatureStored: GeoJSON.Feature | null = null
  let wuhanFeatureStored: GeoJSON.Feature | null = null
  let blurFocusMode: BlurFocusMode = 'zone'
  let focusedCityAdcode: number | null = null
  let hoveredRegion: string | null = null
  let zoneBoundaryGeometry: GeoJSON.Geometry | null = null
  let zoneBoundaryRings: number[][][] = []
  let hubeiOuterRingsStored: number[][][] = []

  function getMaskAlpha(): number {
    if (blurFocusMode === 'zone') {
      if (focusedParkId != null) return 0.5
      return 0.34
    }
    if (focusedParkId != null) return 0.46
    return 0.3
  }

  function getMaskFillColor(): string {
    if (typeof document === 'undefined') return 'rgba(0,0,0,0.42)'
    const sysTheme = document.documentElement.getAttribute('data-theme') || 'light'
    const darkThemes = ['dark', 'purple']
    const alpha = getMaskAlpha()
    if (darkThemes.includes(sysTheme)) {
      return `rgba(0,0,0,${alpha})`
    }
    return `rgba(240,244,250,${alpha})`
  }

  function applyMaskForFocus() {
    rebuildMask()
  }

  function rebuildMask() {
    if (!map || !AMap) return
    const worldRing: [number, number][] = [
      [-180, -90], [180, -90], [180, 90], [-180, 90],
    ]
    const holes = blurFocusMode === 'zone' && zoneBoundaryRings.length
      ? zoneBoundaryRings
      : hubeiOuterRingsStored
    if (!holes.length) return

    clearOverlayList(maskPolygons)
    try {
      const maskPolygon = new AMap.Polygon({
        path: [worldRing, ...holes],
        fillColor: getMaskFillColor(),
        fillOpacity: 1,
        strokeColor: 'transparent',
        strokeWeight: 0,
        zIndex: 425,
        bubble: false,
        cursor: 'default',
      })
      maskPolygon.setMap(map)
      maskPolygons.push(maskPolygon)
    }
    catch { /* fallback: mask not supported */ }
  }

  function ensureMapBaseLabels() {
    if (!map) return
    // 只保留背景图层，不开 point（避免底图 POI 与我们自绘的市名标注重叠）
    map.setStatus?.({ showLabel: false })
    map.setFeatures?.(['bg'])
  }

  let cityNameLabelsLayer: any = null

  function renderCityNameLabels() {
    if (!map || !AMap?.LabelsLayer || !AMap?.LabelMarker) return
    if (cityNameLabelsLayer) {
      try { map.remove(cityNameLabelsLayer) } catch { /* ignore */ }
      cityNameLabelsLayer = null
    }
    if (!cityFeatures.length) return
    const layer = new AMap.LabelsLayer({ zIndex: 460, collision: false, animation: false })
    for (const feature of cityFeatures) {
      const name = feature.properties?.name as string | undefined
      const center = feature.properties?.center as [number, number] | undefined
      if (!name || !Array.isArray(center) || center.length < 2) continue
      const isWuhan = name === HIGHLIGHT_CITY
      layer.add(new AMap.LabelMarker({
        position: [center[0], center[1]],
        zIndex: isWuhan ? 20 : 10,
        text: {
          content: name,
          direction: 'center',
          style: {
            fontSize: isWuhan ? 14 : 12,
            fontWeight: isWuhan ? '800' : '600',
            fillColor: isWuhan ? '#0e7490' : '#334155',
            strokeColor: '#ffffff',
            strokeWidth: isWuhan ? 3 : 2,
          },
        },
      }))
    }
    map.add(layer)
    cityNameLabelsLayer = layer
  }

  const zonePolygons: any[] = []
  const parkPolygonsById = new Map<number, any[]>()
  const unmappedParkPolygons = new Map<number, any[]>()
  const cityPolygonsByAdcode = new Map<number, any[]>()
  const provincePolygonsByName = new Map<string, any[]>()

  let markerOverlays: any[] = []
  let clusterOverlays: any[] = []
  let maskPolygons: any[] = []
  let regionHoverText: any = null
  let companyHoverText: any = null

  let onCompanyClick: ((c: CompanyRecord) => void) | undefined
  let onRegionSelect: ((payload: RegionSelectPayload) => void) | undefined
  let onBubbleClick: ((companies: CompanyRecord[], label: string) => void) | undefined

  function clearOverlayList(list: any[]) {
    list.forEach(overlay => overlay?.setMap?.(null))
    list.length = 0
  }

  function createPolygonsForFeature(feature: GeoJSON.Feature, options: Record<string, any>) {
    if (!AMap || !feature.geometry) return []
    const makePolygon = (path: any) => new AMap.Polygon({
      path,
      bubble: true,
      cursor: 'pointer',
      fillColor: 'transparent',
      fillOpacity: 0,
      ...options,
    })

    if (feature.geometry.type === 'Polygon') {
      return [makePolygon(feature.geometry.coordinates)]
    }
    if (feature.geometry.type === 'MultiPolygon') {
      return feature.geometry.coordinates.map(coords => makePolygon(coords))
    }
    return []
  }

  function setPolygonsStyle(polygons: any[], style: Record<string, any>) {
    polygons.forEach(p => p.setOptions(style))
  }

  function getParkPolygons(parkId: number) {
    return parkPolygonsById.get(parkId) ?? []
  }

  function applyParkStyles() {
    parkPolygonsById.forEach((polygons, parkId) => {
      const hovered = hoveredRegion === `park-${parkId}`
      setPolygonsStyle(polygons, getParkStyle(parkId, hovered, focusedParkId, 0, focusedUnmappedParkIndex))
    })
    unmappedParkPolygons.forEach((polygons, index) => {
      const hovered = hoveredRegion === `park-unmapped-${index}`
      setPolygonsStyle(polygons, getParkStyle(null, hovered, focusedParkId, index, focusedUnmappedParkIndex))
    })
  }

  function clearRegionHover() {
    if (hoveredRegion?.startsWith('park-')) {
      applyParkStyles()
    }
    else if (hoveredRegion?.startsWith('city-')) {
      const adcode = Number(hoveredRegion.slice(5))
      const polygons = cityPolygonsByAdcode.get(adcode) ?? []
      const feature = cityFeatures.find(f => f.properties?.adcode === adcode)
      setPolygonsStyle(polygons, getCityStyle(feature, false, blurFocusMode, focusedCityAdcode))
    }
    else if (hoveredRegion?.startsWith('province-')) {
      const name = hoveredRegion.slice(9)
      const polygons = provincePolygonsByName.get(name) ?? []
      const feature = otherProvinceFeatures.find(f => f.properties?.name === name) || hubeiFeatureStored || undefined
      setPolygonsStyle(polygons, getProvinceStyle(feature, false, blurFocusMode))
    }
    hoveredRegion = null
    regionHoverText?.setMap?.(null)
    regionHoverText = null
  }

  function showRegionTooltip(label: string, lng: number, lat: number) {
    if (!AMap || !map) return
    const position = [lng, lat]
    if (!regionHoverText) {
      regionHoverText = new AMap.Text({
        text: label,
        position,
        anchor: 'bottom-center',
        offset: new AMap.Pixel(0, -8),
        style: {
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #ea580c',
          color: '#c2410c',
          fontSize: '11px',
          fontWeight: '700',
          padding: '2px 6px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
        },
      })
    }
    else {
      regionHoverText.setText(label)
      regionHoverText.setPosition(position)
    }
    regionHoverText.setMap(map)
  }

  function showCompanyHoverLabel(name: string, lng: number, lat: number) {
    if (!AMap || !map || showCompanyLabels.value) return
    if (!companyHoverText) {
      companyHoverText = new AMap.Text({
        text: name,
        position: [lng, lat],
        anchor: 'bottom-center',
        offset: new AMap.Pixel(0, -14),
        style: {
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid rgba(226,232,240,0.9)',
          color: '#0f172a',
          fontSize: '11px',
          fontWeight: '600',
          padding: '2px 7px',
          borderRadius: '4px',
          boxShadow: '0 2px 6px rgba(15,23,42,0.14)',
          lineHeight: '1.35',
          whiteSpace: 'nowrap',
        },
      })
    }
    else {
      companyHoverText.setText(name)
      companyHoverText.setPosition([lng, lat])
    }
    companyHoverText.setMap(map)
  }

  function hideCompanyHoverLabel() {
    companyHoverText?.setMap?.(null)
  }

  function isInZone(latlng: { lat: number, lng: number }) {
    if (zoneBoundaryGeometry) {
      return pointInGeoJSON(latlng.lng, latlng.lat, zoneBoundaryGeometry)
    }
    const lng = latlng.lng
    const lat = latlng.lat
    return zoneFeatures.some((f) => {
      if (!f.geometry) return false
      let bbox = zoneBboxCache.get(f)
      if (bbox === undefined) {
        bbox = bboxFromGeometry(f.geometry)
        zoneBboxCache.set(f, bbox ?? null)
      }
      if (bbox && (lng < bbox[0] || lng > bbox[2] || lat < bbox[1] || lat > bbox[3])) return false
      return pointInGeoJSON(lng, lat, f.geometry)
    })
  }

  function isInWuhan(latlng: { lat: number, lng: number }) {
    return !!(wuhanFeatureStored?.geometry && pointInGeoJSON(latlng.lng, latlng.lat, wuhanFeatureStored.geometry))
  }

  function findParkTarget(latlng: { lat: number, lng: number }): GeoJSON.Feature | null {
    return findFeatureAt(latlng, zoneFeatures, zoneBboxCache)
  }

  function applyFocusVisuals() {
    cityPolygonsByAdcode.forEach((polygons, adcode) => {
      const feature = cityFeatures.find(f => f.properties?.adcode === adcode)
      setPolygonsStyle(polygons, getCityStyle(feature, false, blurFocusMode, focusedCityAdcode))
    })

    provincePolygonsByName.forEach((polygons, name) => {
      if (name !== HIGHLIGHT_PROVINCE) return
      setPolygonsStyle(polygons, getProvinceStyle(hubeiFeatureStored ?? undefined, false, blurFocusMode))
    })

    applyParkStyles()
    applyMaskForFocus()
  }

  function setParkHover(feature: GeoJSON.Feature, latlng: { lng: number, lat: number }, featureIndex?: number) {
    const parkId = feature.properties?.park_id as number | undefined
    const name = (feature.properties?.park_name || feature.properties?.name) as string | undefined
    if (!name) return
    const regionKey = parkId ? `park-${parkId}` : `park-unmapped-${featureIndex ?? zoneFeatures.indexOf(feature)}`
    if (hoveredRegion === regionKey) {
      showRegionTooltip(name, latlng.lng, latlng.lat)
      return
    }
    clearRegionHover()
    hoveredRegion = regionKey
    applyParkStyles()
    showRegionTooltip(name, latlng.lng, latlng.lat)
  }

  function focusPark(parkId: number | null, name: string, unmappedIndex?: number) {
    const validParkId = parkId && parkId > 0 ? parkId : null
    const targetUnmappedIndex = validParkId ? null : (unmappedIndex ?? null)
    const isSamePark = validParkId
      ? focusedParkId === validParkId
      : focusedUnmappedParkIndex === targetUnmappedIndex
    focusedParkId = validParkId
    focusedUnmappedParkIndex = targetUnmappedIndex
    quickView.value = 'zone'
    setBlurFocus('zone')
    if (validParkId) {
      const overlays = getParkPolygons(validParkId)
      if (overlays.length) fitOverlays(overlays, 14)
    }
    else if (unmappedIndex != null) {
      const overlays = unmappedParkPolygons.get(unmappedIndex) ?? []
      if (overlays.length) fitOverlays(overlays, 14)
    }
    applyParkStyles()
    refreshMarkers([])
    if (!isSamePark) {
      onRegionSelect?.({ type: 'park', park_id: validParkId ?? 0, name })
    }
  }

  function showAllMapCompanies() {
    focusedParkId = null
    focusedUnmappedParkIndex = null
    applyParkStyles()
    refreshMarkers(baseCompanies)
  }

  function showFilteredCompanies(companies: CompanyRecord[], options?: { flyToZone?: boolean }) {
    focusedParkId = null
    focusedUnmappedParkIndex = null
    quickView.value = 'zone'
    setBlurFocus('zone')
    if (options?.flyToZone !== false) {
      fitOverlays(zonePolygons, 13)
    }
    applyParkStyles()
    refreshMarkers(companies)
  }

  function setParkMapCompanies(companies: CompanyRecord[]) {
    if (focusedParkId == null && focusedUnmappedParkIndex == null) return
    refreshMarkers(companies)
  }

  function setZoneHover(latlng: { lng: number, lat: number }) {
    if (hoveredRegion === 'zone') {
      showRegionTooltip(ZONE_LABEL, latlng.lng, latlng.lat)
      return
    }
    clearRegionHover()
    hoveredRegion = 'zone'
    setPolygonsStyle(zonePolygons, getZoneStyle(true, blurFocusMode))
    showRegionTooltip(ZONE_LABEL, latlng.lng, latlng.lat)
  }

  function setCityHover(feature: GeoJSON.Feature, latlng: { lng: number, lat: number }) {
    if (isInZone(latlng)) return
    const adcode = feature.properties?.adcode as number
    if (!adcode) return
    const regionKey = `city-${adcode}`
    if (hoveredRegion === regionKey) {
      const name = feature.properties?.name as string
      if (name) showRegionTooltip(name, latlng.lng, latlng.lat)
      return
    }
    clearRegionHover()
    hoveredRegion = regionKey
    setPolygonsStyle(cityPolygonsByAdcode.get(adcode) ?? [], getCityStyle(feature, true, blurFocusMode, focusedCityAdcode))
    const name = feature.properties?.name as string
    if (name) showRegionTooltip(name, latlng.lng, latlng.lat)
  }

  function setProvinceHover(feature: GeoJSON.Feature, latlng: { lng: number, lat: number }) {
    const name = feature.properties?.name as string
    if (!name) return
    const regionKey = `province-${name}`
    if (hoveredRegion === regionKey) {
      showRegionTooltip(name, latlng.lng, latlng.lat)
      return
    }
    clearRegionHover()
    hoveredRegion = regionKey
    setPolygonsStyle(provincePolygonsByName.get(name) ?? [], getProvinceStyle(feature, true, blurFocusMode))
    showRegionTooltip(name, latlng.lng, latlng.lat)
  }

  function setBlurFocus(mode: BlurFocusMode, cityAdcode?: number | null) {
    blurFocusMode = mode
    focusedCityAdcode = cityAdcode ?? null
    clearRegionHover()
    applyFocusVisuals()
  }

  function focusZone() {
    flyToZone()
  }

  function handleRegionClick(latlng: { lng: number, lat: number }) {
    const parkHit = findParkTarget(latlng)
    if (parkHit) {
      const parkId = parkHit.properties?.park_id as number | undefined
      const name = (parkHit.properties?.park_name || parkHit.properties?.name) as string | undefined
      if (name) {
        const featureIndex = zoneFeatures.indexOf(parkHit)
        focusPark(parkId && parkId > 0 ? parkId : null, name, parkId && parkId > 0 ? undefined : featureIndex)
        return
      }
    }
    if (isInZone(latlng)) {
      showAllMapCompanies()
      focusZone()
    }
  }

  function fitOverlays(overlays: any[], maxZoom: number) {
    if (!map || !overlays.length) return
    map.setFitView(overlays, false, [48, 48, 48, 48], maxZoom)
  }

  function flyToZone() {
    focusedParkId = null
    focusedUnmappedParkIndex = null
    quickView.value = 'zone'
    setBlurFocus('zone')
    fitOverlays(zonePolygons, 13)
    refreshMarkers(baseCompanies)
    onRegionSelect?.({ type: 'zone', name: ZONE_LABEL })
  }

  function flyToWuhan() {
    quickView.value = 'wuhan'
    const wuhanFeature = cityFeatures.find(f => f.properties?.name === HIGHLIGHT_CITY)
    const adcode = wuhanFeature?.properties?.adcode as number | undefined
    setBlurFocus('wuhan', adcode ?? null)
    const overlays = adcode ? cityPolygonsByAdcode.get(adcode) ?? [] : []
    if (overlays.length) fitOverlays(overlays, WUHAN_FIT_MAX_ZOOM)
    else map?.setZoomAndCenter?.(WUHAN_ZOOM, [WUHAN_CENTER[1], WUHAN_CENTER[0]])
    onRegionSelect?.({ type: 'city', name: HIGHLIGHT_CITY, adcode: adcode ?? 420100 })
  }

  function flyToCity(adcode: number, name: string) {
    quickView.value = 'wuhan'
    setBlurFocus('city', adcode)
    const overlays = cityPolygonsByAdcode.get(adcode) ?? []
    if (overlays.length) fitOverlays(overlays, 11)
    onRegionSelect?.({ type: 'city', name, adcode })
  }

  function resetMarkers() {
    markerOverlays.forEach(marker => marker.setMap(null))
    clusterOverlays.forEach(marker => marker.setMap(null))
    markerOverlays = []
    clusterOverlays = []
    hideCompanyHoverLabel()
  }

  function getCellThreshold(count: number): number {
    if (count >= 15) return 15
    if (count >= 10) return 14
    if (count >= 5) return 13
    if (count >= 3) return 12
    if (count >= 2) return 11
    return 10
  }

  function createClusterMarker(cell: { lat: number, lng: number, count: number, companies: CompanyRecord[] }) {
    const hasHighlight = cell.companies.some(c => isCompanyHighlighted(c, highlightedCompanyIds))
    const marker = new AMap.Marker({
      position: [cell.lng, cell.lat],
      content: clusterBubbleHtml(cell.count, hasHighlight),
      offset: new AMap.Pixel(-11, -11),
      zIndex: hasHighlight ? 690 : 670,
    })
    marker.on('click', () => {
      const districtName = cell.companies[0]?.conpany_district || cell.companies[0]?.company_city || '\u9644\u8fd1'
      onBubbleClick?.(cell.companies, `${districtName} / ${cell.count} \u5bb6\u4f01\u4e1a`)
    })
    marker.setMap(map)
    clusterOverlays.push(marker)
  }

  function createIndividualMarker(c: CompanyRecord) {
    const lat = c.company_latitude
    const lng = c.company_longitude
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    const color = c.company_traded === 1 ? '#ef4444' : '#10b981'
    const highlighted = isCompanyHighlighted(c, highlightedCompanyIds)
    const content = showCompanyLabels.value
      ? companyLabelHtml(color, c.company_name, highlighted)
      : companyDotHtml(color, highlighted)
    const marker = new AMap.Marker({
      position: [lng, lat],
      content,
      offset: new AMap.Pixel(showCompanyLabels.value ? -66 : -8, showCompanyLabels.value ? -36 : -8),
      zIndex: highlighted ? 700 : 650,
    })

    marker.on('mouseover', () => {
      hoveringCompanyMarker = true
      clearRegionHover()
      showCompanyHoverLabel(c.company_name, lng, lat)
    })
    marker.on('mouseout', () => {
      hoveringCompanyMarker = false
      hideCompanyHoverLabel()
    })
    marker.on('click', () => {
      onCompanyClick?.(c)
    })

    marker.setMap(map)
    markerOverlays.push(marker)
  }

  function refreshMarkers(companies: CompanyRecord[]) {
    if (!map || !AMap) return
    latestCompanies = companies
    resetMarkers()
    hoveringCompanyMarker = false

    const zoom = map.getZoom()
    const gridSize = 0.02
    const grid = new Map<string, { lat: number, lng: number, count: number, companies: CompanyRecord[] }>()

    companies.forEach((c) => {
      const gridX = Math.floor(c.company_longitude / gridSize)
      const gridY = Math.floor(c.company_latitude / gridSize)
      const key = `${gridX},${gridY}`
      const existing = grid.get(key)
      if (existing) {
        existing.count++
        existing.lat = (existing.lat * (existing.count - 1) + c.company_latitude) / existing.count
        existing.lng = (existing.lng * (existing.count - 1) + c.company_longitude) / existing.count
        existing.companies.push(c)
      }
      else {
        grid.set(key, { lat: c.company_latitude, lng: c.company_longitude, count: 1, companies: [c] })
      }
    })

    grid.forEach((cell) => {
      const threshold = getCellThreshold(cell.count)
      if (zoom < threshold) {
        createClusterMarker(cell)
      }
      else {
        cell.companies.forEach(c => createIndividualMarker(c))
      }
    })
  }

  function setupMapEvents() {
    if (!map) return

    let lastHoverTarget: string | null = null

    map.on('mousemove', (e: any) => {
      if (hoveringCompanyMarker) {
        clearRegionHover()
        lastHoverTarget = null
        return
      }
      const lng = e.lnglat.getLng()
      const lat = e.lnglat.getLat()

      const parkHit = findParkTarget({ lng, lat })
      const parkFeatureIndex = parkHit ? zoneFeatures.indexOf(parkHit) : -1
      const targetKey = parkHit
        ? (parkHit.properties?.park_id
            ? `park-${parkHit.properties?.park_id}`
            : `park-unmapped-${parkFeatureIndex}`)
        : null

      if (targetKey === lastHoverTarget) {
        if (parkHit) {
          const name = (parkHit.properties?.park_name || parkHit.properties?.name) as string
          if (name) showRegionTooltip(name, lng, lat)
        }
        return
      }
      lastHoverTarget = targetKey

      if (parkHit) setParkHover(parkHit, { lng, lat }, parkFeatureIndex)
      else { clearRegionHover(); lastHoverTarget = null }
    })

    map.on('mouseout', () => {
      lastHoverTarget = null
      if (!hoveringCompanyMarker) clearRegionHover()
    })

    map.on('click', (e: any) => {
      if (hoveringCompanyMarker) return
      handleRegionClick({ lng: e.lnglat.getLng(), lat: e.lnglat.getLat() })
    })

    map.on('dblclick', (e: any) => {
      const lng = e.lnglat.getLng()
      const lat = e.lnglat.getLat()
      if (!isInZone({ lng, lat })) return
      focusZone()
    })

    const MIN_ZOOM = 7
let zoomTimer: ReturnType<typeof setTimeout> | null = null

function enforceMinZoom() {
  if (!map) return
  const z = map.getZoom()
  if (z < MIN_ZOOM) map.setZoom(MIN_ZOOM)
}

map.on('zoomend', () => {
  if (zoomTimer) clearTimeout(zoomTimer)
  zoomTimer = setTimeout(() => {
    zoomTimer = null
    enforceMinZoom()
    refreshMarkers(latestCompanies)
  }, 60)
})
  }

  async function initMap(
    companies: CompanyRecord[],
    handlers?: {
      onCompany?: (c: CompanyRecord) => void
      onRegion?: (payload: RegionSelectPayload) => void
      onBubble?: (companies: CompanyRecord[], label: string) => void
    },
  ): Promise<CompanyRecord[]> {
    onCompanyClick = handlers?.onCompany
    onRegionSelect = handlers?.onRegion
    onBubbleClick = handlers?.onBubble

    if (!mapContainerRef.value) return []

    AMap = await loadAmap(config.public.amapKey, config.public.amapSecurityCode)

    const [region, parkAreas, hubeiCities, zoneBoundary, parkListRes] = await Promise.all([
      $fetch<any>('/geo/region_gcj02.json'),
      $fetch<GeoJSON.FeatureCollection>('/geo/park_areas_gcj02.json'),
      $fetch<any>('/geo/hubei-cities_gcj02.json'),
      $fetch<GeoJSON.FeatureCollection>('/geo/高新区范围_gcj02.json'),
      $fetch<{ code: number, data?: ParkInfo[] }>(`${config.public.apiBase}/company/park/`),
    ])

    const parks: ParkInfo[] = parkListRes?.code === 0 && Array.isArray(parkListRes.data)
      ? parkListRes.data
      : []

    const zoneGcj02: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: (parkAreas.features ?? []).map((feature) => {
        const park_name = (feature.properties?.park_name || feature.properties?.Layer || '') as string
        const park_id = matchParkId(park_name, parks)
        return {
          ...feature,
          properties: {
            ...feature.properties,
            park_name,
            park_id,
          },
        }
      }),
    }

    map = new AMap.Map(mapContainerRef.value, {
      center: [WUHAN_CENTER[1], WUHAN_CENTER[0]],
      zoom: WUHAN_ZOOM,
      mapStyle: 'amap://styles/normal',
      viewMode: '2D',
      showLabel: false,
      showBuildingBlock: false,
      isHotspot: false,
      features: ['bg'],
      zooms: [7, 18],
      resizeEnable: true,
      doubleClickZoom: false,
    })

    zoneFeatures = (zoneGcj02 as GeoJSON.FeatureCollection).features ?? []
    cityFeatures = ((hubeiCities as GeoJSON.FeatureCollection).features ?? [])
    cityList.value = cityFeatures
      .map(f => ({ adcode: f.properties?.adcode as number, name: f.properties?.name as string }))
      .filter(c => c.adcode && c.name)
      .sort((a, b) => a.name === HIGHLIGHT_CITY ? -1 : b.name === HIGHLIGHT_CITY ? 1 : a.adcode - b.adcode)
    hubeiFeatureStored = (region.features.find((f: any) => f.properties?.name === HIGHLIGHT_PROVINCE) as GeoJSON.Feature | undefined) ?? null
    wuhanFeatureStored = cityFeatures.find(f => f.properties?.name === HIGHLIGHT_CITY) ?? null
    otherProvinceFeatures = (region.features as GeoJSON.Feature[]).filter(f => f.properties?.name !== HIGHLIGHT_PROVINCE)

    const zoneBoundaryFeature = zoneBoundary.features?.[0]
    if (zoneBoundaryFeature?.geometry) {
      zoneBoundaryGeometry = zoneBoundaryFeature.geometry
      zoneBoundaryRings = outerRingsFromGeometry(zoneBoundaryFeature.geometry)
    }

    provincePolygonsByName.clear()

    hubeiOuterRingsStored = hubeiFeatureStored
      ? outerRingsFromGeometry(hubeiFeatureStored.geometry)
      : []

    if (hubeiFeatureStored) {
      const name = hubeiFeatureStored.properties?.name as string
      if (name) {
        const polygons = createPolygonsForFeature(hubeiFeatureStored, {
          zIndex: 435,
          ...getProvinceStyle(hubeiFeatureStored, false, blurFocusMode),
        })
        polygons.forEach((polygon) => {
          polygon.setMap(map)
        })
        provincePolygonsByName.set(name, polygons)
      }
    }

    if (hubeiOuterRingsStored.length > 0) {
      rebuildMask()
    }

    cityPolygonsByAdcode.clear()
    cityFeatures.forEach((feature) => {
      const adcode = feature.properties?.adcode as number
      if (!adcode) return
      const polygons = createPolygonsForFeature(feature, {
        zIndex: 450,
        ...getCityStyle(feature, false, blurFocusMode, focusedCityAdcode),
      })
      polygons.forEach((polygon) => {
        polygon.setMap(map)
      })
      cityPolygonsByAdcode.set(adcode, polygons)
    })

    clearOverlayList(zonePolygons)
    parkPolygonsById.clear()
    unmappedParkPolygons.clear()
    zoneFeatures.forEach((feature, featureIndex) => {
      const parkId = feature.properties?.park_id as number | undefined
      const style = getParkStyle(parkId, false, null, featureIndex)
      createPolygonsForFeature(feature, {
        zIndex: 520,
        ...style,
      }).forEach((polygon) => {
        polygon.setMap(map)
        polygon.on('click', () => {
          if (hoveringCompanyMarker) return
          const name = (feature.properties?.park_name || feature.properties?.name) as string
          if (!name) return
          if (parkId && parkId > 0) {
            focusPark(parkId, name)
            return
          }
          focusPark(null, name, featureIndex)
        })
        zonePolygons.push(polygon)
        if (parkId) {
          const list = parkPolygonsById.get(parkId) ?? []
          list.push(polygon)
          parkPolygonsById.set(parkId, list)
        }
        else {
          const list = unmappedParkPolygons.get(featureIndex) ?? []
          list.push(polygon)
          unmappedParkPolygons.set(featureIndex, list)
        }
      })
    })

    setupMapEvents()
    map.on('complete', () => {
      ensureMapBaseLabels()
      renderCityNameLabels()
    })
    requestAnimationFrame(() => {
      ensureMapBaseLabels()
      if (!cityNameLabelsLayer) renderCityNameLabels()
    })
    baseCompanies = companies
    refreshMarkers(companies)
    setBlurFocus('zone')
    flyToZone()
    quickView.value = 'zone'

    mapReady.value = true
    return companies
  }

  function destroyMap() {
    clearRegionHover()
    hideCompanyHoverLabel()
    clearOverlayList(markerOverlays)
    clearOverlayList(clusterOverlays)
    clearOverlayList(maskPolygons)
    clearOverlayList(zonePolygons)
    if (cityNameLabelsLayer) {
      try { map?.remove(cityNameLabelsLayer) } catch { /* ignore */ }
      cityNameLabelsLayer = null
    }
    parkPolygonsById.clear()
    unmappedParkPolygons.clear()
    provincePolygonsByName.forEach(polygons => clearOverlayList(polygons))
    cityPolygonsByAdcode.forEach(polygons => clearOverlayList(polygons))
    provincePolygonsByName.clear()
    cityPolygonsByAdcode.clear()
    map?.destroy?.()
    map = null
    AMap = null
    latestCompanies = []
    baseCompanies = []
    focusedParkId = null
    focusedUnmappedParkIndex = null
    zoneFeatures = []
    cityFeatures = []
    cityList.value = []
    otherProvinceFeatures = []
    hubeiFeatureStored = null
    wuhanFeatureStored = null
    blurFocusMode = 'zone'
    focusedCityAdcode = null
    zoneBoundaryGeometry = null
    zoneBoundaryRings = []
    hubeiOuterRingsStored = []
    hoveringCompanyMarker = false
    mapReady.value = false
  }

  function zoomIn() { map?.zoomIn?.() }
  function zoomOut() { map?.zoomOut?.() }

  function resetView() {
    flyToZone()
  }

  function setQuickView(view: 'zone' | 'wuhan' | { city: { adcode: number, name: string } }) {
    if (typeof view === 'object') {
      flyToCity(view.city.adcode, view.city.name)
      return
    }
    if (view === 'zone') flyToZone()
    else flyToWuhan()
  }

  function invalidateSize() {
    map?.resize?.()
  }

  function setCompanyLabelVisible(visible: boolean) {
    showCompanyLabels.value = visible
    hideCompanyHoverLabel()
    refreshMarkers(latestCompanies)
  }

  function setHighlightedCompanies(ids: string[]) {
    highlightedCompanyIds = new Set(ids)
    refreshMarkers(latestCompanies)
  }

  function updateMaskColor() {
    applyMaskForFocus()
  }

  return {
    mapContainerRef,
    mapReady,
    quickView,
    showCompanyLabels,
    cityList,
    initMap,
    destroyMap,
    zoomIn,
    zoomOut,
    resetView,
    setQuickView,
    flyToCity,
    flyToZone,
    flyToWuhan,
    setCompanyLabelVisible,
    updateMaskColor,
    invalidateSize,
    isInZone,
    showAllMapCompanies,
    showFilteredCompanies,
    setParkMapCompanies,
    setHighlightedCompanies,
  }
}
