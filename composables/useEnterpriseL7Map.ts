import type { CompanyRecord } from '~/types/company'
import { matchParkId, type ParkInfo } from '~/composables/useGeoAmapMap'

type GeoGeometry = {
  type?: string
  coordinates?: number[][][] | number[][][][] | number[][]
}

type GeoFeature = {
  properties?: Record<string, unknown>
  geometry?: GeoGeometry
}

type GeoFeatureCollection = {
  features?: GeoFeature[]
}

export type ParkLegendItem = {
  name: string
  displayName: string
  color: string
  count: number
}

type AMapLike = {
  Map: new (...args: any[]) => any
  Polygon: new (...args: any[]) => any
  Polyline: new (...args: any[]) => any
  Text: new (...args: any[]) => any
  CircleMarker?: new (...args: any[]) => any
  Marker?: new (...args: any[]) => any
}

declare global {
  interface Window {
    AMap?: AMapLike
    Loca?: any
    _AMapSecurityConfig?: { securityJsCode: string }
    __enterpriseAmapPromise__?: Promise<AMapLike>
    __enterpriseLocaPromise__?: Promise<any>
  }
}

/** Loca 官方示例呼吸波纹序列帧纹理（贴地扩散） */
const BREATH_TEXTURE = 'https://a.amap.com/Loca/static/loca-v2/demos/images/breath_blue.png'
const BREATH_TEXTURE_ALT = 'https://a.amap.com/Loca/static/loca-v2/demos/images/breath_yellow.png'

const PARK_PALETTE = [
  '#6fa3cc', // 浅钢蓝
  '#8fb5a3', // 浅灰绿
  '#d4ad7a', // 浅沙褐
  '#b094cc', // 浅灰紫
  '#7fa0c0', // 浅板岩蓝
  '#bc9a88', // 浅陶土
  '#9fadc2', // 浅冷灰蓝
  '#94b088', // 浅橄榄绿
]

/** 相邻园区易混淆时单独指定色（略提亮，仍保持低饱和） */
const PARK_COLOR_OVERRIDES: Record<string, string> = {
  '光谷未来科技城': '#da8f9c', // 浅灰玫
  '光谷智能制造产业园': '#d9c070', // 浅暗金
  '光谷生物城': '#6db396', // 浅墨绿
}

function brightenHex(hex: string, amount = 0.28): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount))
  return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`
}

function isHighlightPark(parkName: string) {
  return parkName in PARK_COLOR_OVERRIDES
}

/**
 * 企业大屏地图：高德 AMap 3D + 高新区园区边界 + 各园区企业数标注
 */
export function useEnterpriseL7Map() {
  const config = useRuntimeConfig()
  const mapContainerRef = ref<HTMLDivElement>()
  const mapReady = ref(false)
  const parkLegend = ref<ParkLegendItem[]>([])
  const selectedParkName = ref<string | null>(null)

  let AMap: AMapLike | null = null
  let map: any = null
  let zonePolygons: any[] = []
  let zoneLines: any[] = []
  let parkPolygons: any[] = []
  let parkLabels: any[] = []
  let companyMarkers: any[] = []
  let companyHoverText: any = null
  let parkFeatures: GeoFeature[] = []
  let parkColorMap = new Map<string, string>()
  let parkApiList: ParkInfo[] = []
  let latestCompanies: CompanyRecord[] = []
  let zoneCenter: [number, number] = [114.475, 30.50]
  let mapControls: any[] = []
  let suppressMapClick = false
  let onParkSelectHandler: ((parkName: string | null) => void) | undefined

  function onParkSelect(handler: (parkName: string | null) => void) {
    onParkSelectHandler = handler
  }

  type MapViewState = {
    center: [number, number]
    zoom: number
    pitch: number
    rotation: number
  }

  let overviewViewState: MapViewState | null = null
  let overviewViewSettled = false
  let loca: any = null
  let breathLayers: any[] = []

  /** 全览：轻微倾斜；选中园区：平面俯视 */
  const MAP_PITCH = 30
  const MAP_PITCH_FLAT = 0
  const MAP_ROTATION = 12
  const MAP_ROTATION_FLAT = 0
  const MAP_ZOOM = 13.2
  const MAP_FIT_MAX_ZOOM = 14.0
  const MAP_PARK_FIT_MAX_ZOOM = 15.2

  function getParkName(feature: GeoFeature): string {
    return String(feature.properties?.park_name || feature.properties?.Layer || '').trim()
  }

  function resolveParkApiItem(geoParkName: string): ParkInfo | null {
    if (!parkApiList.length) return null
    const parkId = matchParkId(geoParkName, parkApiList)
    return parkId != null
      ? parkApiList.find(p => p.park_id === parkId) ?? null
      : null
  }

  function displayParkName(geoParkName: string): string {
    return resolveParkApiItem(geoParkName)?.park_name ?? geoParkName
  }

  function polygonRing(geoData: GeoFeatureCollection): number[][] {
    const geometry = geoData.features?.[0]?.geometry
    if (!geometry || geometry.type !== 'Polygon') return []
    const ring = geometry.coordinates?.[0]
    return Array.isArray(ring) ? ring as number[][] : []
  }

  function linePath(geoData: GeoFeatureCollection): number[][] {
    const geometry = geoData.features?.[0]?.geometry
    if (!geometry || geometry.type !== 'LineString') return []
    const path = geometry.coordinates
    return Array.isArray(path) ? path as number[][] : []
  }

  function outerRingsFromGeometry(geometry: GeoGeometry): number[][][] {
    if (geometry.type === 'Polygon') {
      const ring = geometry.coordinates?.[0]
      return Array.isArray(ring) ? [ring as number[][]] : []
    }
    if (geometry.type === 'MultiPolygon') {
      const polys = geometry.coordinates as number[][][][]
      return polys.map(poly => poly[0]).filter(Boolean)
    }
    return []
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

  function pointInGeometry(lng: number, lat: number, geometry: GeoGeometry): boolean {
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates as number[][][]
      const [outer, ...holes] = coords
      if (!outer || !pointInRing(lng, lat, outer)) return false
      return !holes.some(h => pointInRing(lng, lat, h))
    }
    if (geometry.type === 'MultiPolygon') {
      const polys = geometry.coordinates as number[][][][]
      return polys.some((poly) => {
        const [outer, ...holes] = poly
        if (!outer || !pointInRing(lng, lat, outer)) return false
        return !holes.some(h => pointInRing(lng, lat, h))
      })
    }
    return false
  }

  function featureHitArea(feature: GeoFeature): number {
    const geom = feature.geometry
    if (!geom) return Infinity
    const rings = outerRingsFromGeometry(geom)
    if (!rings.length) return Infinity
    return Math.min(...rings.map((ring) => {
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
    }))
  }

  function findParkNameAt(lng: number, lat: number): string | null {
    const hits = parkFeatures.filter(f => f.geometry && pointInGeometry(lng, lat, f.geometry))
    if (!hits.length) return null
    if (hits.length === 1) return getParkName(hits[0])
    const best = hits.reduce((a, b) => (featureHitArea(a) < featureHitArea(b) ? a : b))
    return getParkName(best)
  }

  /** 企业数优先用 /company/park 接口 num，不再按坐标落入地理范围统计 */
  function countCompaniesByPark(_companies: CompanyRecord[]): Map<string, number> {
    const counts = new Map<string, number>()
    for (const name of parkColorMap.keys()) {
      const item = resolveParkApiItem(name)
      counts.set(name, Number(item?.num) || 0)
    }
    return counts
  }

  function setParkApiList(list: ParkInfo[]) {
    parkApiList = Array.isArray(list) ? list : []
    if (map && parkColorMap.size) {
      renderParks(latestCompanies, Boolean(selectedParkName.value), selectedParkName.value)
    }
  }

  function centroidForPark(parkName: string): [number, number] {
    const features = parkFeatures.filter(f => getParkName(f) === parkName)
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity

    for (const feature of features) {
      if (!feature.geometry) continue
      for (const ring of outerRingsFromGeometry(feature.geometry)) {
        for (const [lng, lat] of ring) {
          minLng = Math.min(minLng, lng)
          minLat = Math.min(minLat, lat)
          maxLng = Math.max(maxLng, lng)
          maxLat = Math.max(maxLat, lat)
        }
      }
    }

    if (!Number.isFinite(minLng)) return [114.475, 30.50]
    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
  }

  function boundsForPark(parkName: string): [[number, number], [number, number]] | null {
    const features = parkFeatures.filter(f => getParkName(f) === parkName)
    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity

    for (const feature of features) {
      if (!feature.geometry) continue
      for (const ring of outerRingsFromGeometry(feature.geometry)) {
        for (const [lng, lat] of ring) {
          minLng = Math.min(minLng, lng)
          minLat = Math.min(minLat, lat)
          maxLng = Math.max(maxLng, lng)
          maxLat = Math.max(maxLat, lat)
        }
      }
    }

    if (!Number.isFinite(minLng)) return null
    return [[minLng, minLat], [maxLng, maxLat]]
  }

  function calloutLayoutForPark(
    parkName: string,
    anchor: [number, number],
    index: number,
  ): { path: [number, number][]; labelPos: [number, number]; textAnchor: string } {
    const [lng, lat] = anchor
    const [cx, cy] = zoneCenter
    let dx = lng - cx
    let dy = lat - cy
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len

    // 轻微错开方向，减少相邻标签重叠
    const angleOffset = ((index % 7) - 3) * 0.18
    const cos = Math.cos(angleOffset)
    const sin = Math.sin(angleOffset)
    const ndx = dx * cos - dy * sin
    const ndy = dx * sin + dy * cos

    const bounds = boundsForPark(parkName)
    let stub = 0.012
    let arm = 0.022
    if (bounds) {
      const [[minLng, minLat], [maxLng, maxLat]] = bounds
      const span = Math.max(maxLng - minLng, maxLat - minLat)
      stub = Math.max(0.008, Math.min(0.02, span * 0.7))
      arm = Math.max(0.014, Math.min(0.032, span * 1.15))
    }

    // 折线：锚点 → 折点 → 标签（L 形，先短伸出再拐向外侧）
    const preferHorizontal = Math.abs(ndx) >= Math.abs(ndy)
    const sx = Math.sign(ndx) || 1
    const sy = Math.sign(ndy) || 1
    let elbow: [number, number]
    let labelPos: [number, number]
    let textAnchor: string

    if (preferHorizontal) {
      // 先竖直伸出，再水平指向标签
      elbow = [lng, lat + sy * stub]
      labelPos = [lng + sx * arm, elbow[1]]
      textAnchor = sx > 0 ? 'middle-left' : 'middle-right'
    } else {
      // 先水平伸出，再竖直指向标签
      elbow = [lng + sx * stub, lat]
      labelPos = [elbow[0], lat + sy * arm]
      textAnchor = sy > 0 ? 'bottom-center' : 'top-center'
    }

    return {
      path: [anchor, elbow, labelPos],
      labelPos,
      textAnchor,
    }
  }

  function attachParkSelectHandler(overlay: any, parkName: string) {
    overlay.on?.('click', (e: any) => {
      e?.originEvent?.stopPropagation?.()
      e?.originEvent?.preventDefault?.()
      deferSelectPark(parkName, true)
    })
  }

  function createParkCallout(parkName: string, displayName: string, color: string, index: number) {
    if (!map || !AMap) return

    const anchor = centroidForPark(parkName)
    const { path, labelPos, textAnchor } = calloutLayoutForPark(parkName, anchor, index)

    const accent = brightenHex(color, 0.38)
    const soft = brightenHex(color, 0.18)

    // 底层柔边：略粗、低透明，让折线在深色底上更干净
    const glow = new AMap.Polyline({
      path,
      strokeColor: soft,
      strokeWeight: 3.2,
      strokeOpacity: 0.28,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      zIndex: 196,
      bubble: true,
      cursor: 'pointer',
    })
    glow.setMap(map)
    attachParkSelectHandler(glow, parkName)
    parkLabels.push(glow)

    // 主引线：细实线 + 圆角折点
    const line = new AMap.Polyline({
      path,
      strokeColor: accent,
      strokeWeight: 1.15,
      strokeOpacity: 0.92,
      strokeStyle: 'solid',
      lineJoin: 'round',
      lineCap: 'round',
      zIndex: 198,
      bubble: true,
      cursor: 'pointer',
    })
    line.setMap(map)
    attachParkSelectHandler(line, parkName)
    parkLabels.push(line)

    if (AMap.CircleMarker) {
      // 锚点外环
      const ring = new AMap.CircleMarker({
        center: anchor,
        radius: 5,
        strokeColor: accent,
        strokeWeight: 1.2,
        strokeOpacity: 0.75,
        fillColor: '#0b1a2c',
        fillOpacity: 0.55,
        zIndex: 199,
        bubble: true,
        cursor: 'pointer',
      })
      ring.setMap(map)
      attachParkSelectHandler(ring, parkName)
      parkLabels.push(ring)

      // 锚点芯点
      const core = new AMap.CircleMarker({
        center: anchor,
        radius: 2.2,
        strokeColor: '#f4f8fc',
        strokeWeight: 0.8,
        strokeOpacity: 0.9,
        fillColor: accent,
        fillOpacity: 1,
        zIndex: 200,
        bubble: true,
        cursor: 'pointer',
      })
      core.setMap(map)
      attachParkSelectHandler(core, parkName)
      parkLabels.push(core)

      // 标签端小端点，收住折线
      const tip = new AMap.CircleMarker({
        center: labelPos,
        radius: 1.6,
        strokeColor: accent,
        strokeWeight: 0,
        strokeOpacity: 0,
        fillColor: accent,
        fillOpacity: 0.95,
        zIndex: 200,
        bubble: true,
        cursor: 'pointer',
      })
      tip.setMap(map)
      attachParkSelectHandler(tip, parkName)
      parkLabels.push(tip)
    }

    const isLeft = textAnchor.includes('left')
    const isRight = textAnchor.includes('right')
    const isBottom = textAnchor.includes('bottom')
    const isTop = textAnchor.includes('top')

    const labelStyle: Record<string, string> = {
      'background-color': 'rgba(12, 24, 40, 0.92)',
      'border': `1px solid ${accent}88`,
      'border-radius': '3px',
      'color': '#eef5fb',
      'font-size': '11px',
      'font-weight': '500',
      'letter-spacing': '0.02em',
      'padding': isLeft ? '3px 10px 3px 8px' : isRight ? '3px 8px 3px 10px' : '3px 10px',
      'text-align': 'center',
      'line-height': '1.35',
      'white-space': 'nowrap',
      'box-shadow': '0 4px 14px rgba(0, 0, 0, 0.28)',
      'cursor': 'pointer',
    }
    if (isLeft) labelStyle['border-left'] = `2px solid ${accent}`
    if (isRight) labelStyle['border-right'] = `2px solid ${accent}`

    const label = new AMap.Text({
      text: displayName,
      position: labelPos,
      anchor: textAnchor,
      offset: (AMap as any).Pixel
        ? new (AMap as any).Pixel(
          isLeft ? 6 : isRight ? -6 : 0,
          isBottom ? -6 : isTop ? 6 : 0,
        )
        : [0, 0],
      zIndex: 210,
      style: labelStyle,
    })
    label.setMap(map)
    attachParkSelectHandler(label, parkName)
    parkLabels.push(label)
  }

  function boundsFromZone(geoData: GeoFeatureCollection): [[number, number], [number, number]] | null {
    const ring = polygonRing(geoData)
    if (!ring.length) return null

    let minLng = Infinity
    let minLat = Infinity
    let maxLng = -Infinity
    let maxLat = -Infinity

    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng)
      minLat = Math.min(minLat, lat)
      maxLng = Math.max(maxLng, lng)
      maxLat = Math.max(maxLat, lat)
    }

    return [[minLng, minLat], [maxLng, maxLat]]
  }

  function centerFromBounds(bounds: [[number, number], [number, number]]): [number, number] {
    const [[minLng, minLat], [maxLng, maxLat]] = bounds
    return [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
  }

  function buildParkColorMap(features: GeoFeature[]) {
    const names = [...new Set(features.map(getParkName).filter(Boolean))]
    const map = new Map<string, string>()
    names.forEach((name, index) => {
      map.set(name, PARK_COLOR_OVERRIDES[name] ?? PARK_PALETTE[index % PARK_PALETTE.length])
    })
    return map
  }

  function loadAmap(key: string, securityCode: string) {
    if (typeof window === 'undefined') return Promise.reject(new Error('AMap only runs in browser'))
    if (window.AMap) return Promise.resolve(window.AMap)
    if (window.__enterpriseAmapPromise__) return window.__enterpriseAmapPromise__

    if (securityCode) {
      window._AMapSecurityConfig = { securityJsCode: securityCode }
    }

    window.__enterpriseAmapPromise__ = new Promise<AMapLike>((resolve, reject) => {
      const callbackName = `__enterprise_amap_init_${Date.now()}`
      ;(window as any)[callbackName] = () => {
        if (window.AMap) resolve(window.AMap)
        else reject(new Error('AMap 加载失败'))
        delete (window as any)[callbackName]
      }

      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.Map3D,AMap.ToolBar,AMap.ControlBar&callback=${callbackName}`
      script.async = true
      script.onerror = () => {
        delete (window as any)[callbackName]
        reject(new Error('Failed to load AMap JS API'))
      }
      document.head.appendChild(script)
    })

    return window.__enterpriseAmapPromise__
  }

  async function ensureMapPlugins(amapApi: AMapLike) {
    return new Promise<void>((resolve) => {
      const plugin = (amapApi as any).plugin
      if (!plugin) {
        resolve()
        return
      }
      plugin(['AMap.Map3D', 'AMap.ToolBar', 'AMap.ControlBar'], () => resolve())
    })
  }

  function addMapControls() {
    if (!map || !AMap) return
    clearMapControls()
    const amapAny = AMap as any
    try {
      if (amapAny.ControlBar) {
        const controlBar = new amapAny.ControlBar({
          position: { right: '12px', top: '12px' },
          showZoomBar: true,
          showControlButton: true,
        })
        map.addControl(controlBar)
        mapControls.push(controlBar)
      }
      if (amapAny.ToolBar) {
        const toolBar = new amapAny.ToolBar({
          position: { right: '20px', bottom: '28px' },
          locate: false,
          liteStyle: true,
        })
        map.addControl(toolBar)
        mapControls.push(toolBar)
      }
    } catch (e) {
      console.warn('地图控件加载失败', e)
    }
  }

  function clearMapControls() {
    if (!map) {
      mapControls = []
      return
    }
    mapControls.forEach((ctrl) => {
      try {
        map.removeControl?.(ctrl)
      } catch {
        // ignore
      }
    })
    mapControls = []
  }

  function saveOverviewView() {
    if (!map) return
    const c = map.getCenter?.()
    overviewViewState = {
      center: c ? [c.getLng(), c.getLat()] : zoneCenter,
      zoom: Number(map.getZoom?.() ?? MAP_ZOOM),
      pitch: Number(map.getPitch?.() ?? MAP_PITCH),
      rotation: Number(map.getRotation?.() ?? MAP_ROTATION),
    }
  }

  function restoreOverviewView() {
    if (!map) return
    if (!overviewViewState) {
      applyMapView(zoneCenter, true)
      return
    }
    const { center, zoom, pitch, rotation } = overviewViewState
    map.setZoomAndCenter(zoom, center, true, 0)
    if (typeof map.setPitch === 'function') map.setPitch(pitch)
    if (typeof map.setRotation === 'function') map.setRotation(rotation)
  }

  function settleOverviewView(targetCenter: [number, number]) {
    if (!map || overviewViewSettled) return
    applyMapView(targetCenter, true)
    overviewViewSettled = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => saveOverviewView())
    })
  }

  function loadLoca(key: string) {
    if (typeof window === 'undefined') return Promise.reject(new Error('Loca only runs in browser'))
    if (window.Loca) return Promise.resolve(window.Loca)
    if (window.__enterpriseLocaPromise__) return window.__enterpriseLocaPromise__

    window.__enterpriseLocaPromise__ = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/loca?v=2.0.0&key=${encodeURIComponent(key)}`
      script.async = true
      script.onload = () => {
        if (window.Loca) resolve(window.Loca)
        else reject(new Error('Loca 加载失败'))
      }
      script.onerror = () => reject(new Error('Failed to load Loca'))
      document.head.appendChild(script)
    })

    return window.__enterpriseLocaPromise__
  }

  function stopMapRipple(destroyContainer = true) {
    breathLayers.forEach((layer) => {
      try {
        loca?.remove?.(layer)
        layer?.destroy?.()
      } catch {
        // ignore
      }
    })
    breathLayers = []
    if (destroyContainer) {
      try {
        loca?.animate?.stop?.()
        loca?.destroy?.()
      } catch {
        // ignore
      }
      loca = null
    }
  }

  function buildBreathGeoJSON(points: [number, number][]) {
    return {
      type: 'FeatureCollection',
      features: points.map(([lng, lat], index) => ({
        type: 'Feature',
        properties: { id: index },
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      })),
    }
  }

  function breathPointsForFocus(focusParkName?: string | null): [number, number][] {
    const parkNames = focusParkName
      ? [focusParkName].filter(name => parkColorMap.has(name))
      : [...parkColorMap.keys()]
    const parkPoints = parkNames.map(name => centroidForPark(name))
    if (parkPoints.length) return parkPoints
    return focusParkName ? [] : [zoneCenter]
  }

  /** 贴地呼吸波纹：放在标注线起始点（园区中心）；选中园区时仅保留该园区 */
  function startMapRipple(focusParkName?: string | null) {
    if (!map || !window.Loca) return

    const points = breathPointsForFocus(focusParkName)
    // 只移除波纹图层，不要 destroy Loca 容器（会清掉园区 Polygon）
    stopMapRipple(false)
    if (!points.length) return

    if (!loca) {
      loca = new window.Loca.Container({ map })
    }

    // 主波纹：标注线起点
    const parkLayer = new window.Loca.ScatterLayer({
      loca,
      zIndex: 120,
      opacity: 0.82,
      visible: true,
      zooms: [10, 20],
    })
    parkLayer.setSource(new window.Loca.GeoJSONSource({
      data: buildBreathGeoJSON(points),
    }))
    parkLayer.setStyle({
      unit: 'meter',
      size: [2600, 2600],
      borderWidth: 0,
      texture: BREATH_TEXTURE,
      duration: 1400,
      animate: true,
    })
    loca.add(parkLayer)
    breathLayers.push(parkLayer)

    // 次级波纹：同一起点，节奏错开
    const sparkLayer = new window.Loca.ScatterLayer({
      loca,
      zIndex: 121,
      opacity: 0.55,
      visible: true,
      zooms: [11, 20],
    })
    sparkLayer.setSource(new window.Loca.GeoJSONSource({
      data: buildBreathGeoJSON(points),
    }))
    sparkLayer.setStyle({
      unit: 'meter',
      size: [1400, 1400],
      borderWidth: 0,
      texture: BREATH_TEXTURE_ALT,
      duration: 1000,
      animate: true,
    })
    loca.add(sparkLayer)
    breathLayers.push(sparkLayer)

    requestAnimationFrame(() => {
      try {
        loca?.animate?.start?.()
      } catch (e) {
        console.warn('启动园区波纹动画失败', e)
      }
    })
  }

  function applyMapView(targetCenter: [number, number], fitRegion = false) {
    if (!map) return
    if (fitRegion) {
      // 框住高新区后略再拉近一点
      const fitTargets = [...zonePolygons, ...zoneLines]
      if (fitTargets.length) {
        map.setFitView(fitTargets, true, [24, 24, 24, 24], MAP_FIT_MAX_ZOOM)
        const z = typeof map.getZoom === 'function' ? Number(map.getZoom()) : MAP_ZOOM
        map.setZoom(Math.min(z + 0.65, MAP_FIT_MAX_ZOOM))
      } else {
        map.setZoomAndCenter(MAP_ZOOM, targetCenter, true, 0)
      }
    } else {
      map.setZoomAndCenter(MAP_ZOOM, targetCenter, true, 0)
    }
    // setFitView 会清掉俯仰/旋转，随后强制恢复
    if (typeof map.setPitch === 'function') map.setPitch(MAP_PITCH)
    if (typeof map.setRotation === 'function') map.setRotation(MAP_ROTATION)
  }

  function applyParkFocusView() {
    if (!map || !parkPolygons.length) return
    map.setFitView(parkPolygons, true, [64, 64, 64, 64], MAP_PARK_FIT_MAX_ZOOM)
    // 选中园区后仍保持 3D 俯仰与旋转
    if (typeof map.setPitch === 'function') map.setPitch(MAP_PITCH)
    if (typeof map.setRotation === 'function') map.setRotation(MAP_ROTATION)
  }

  function showCompanyHoverLabel(name: string, lng: number, lat: number) {
    if (!AMap || !map) return
    if (!companyHoverText) {
      companyHoverText = new AMap.Text({
        text: name,
        position: [lng, lat],
        anchor: 'bottom-center',
        offset: (AMap as any).Pixel ? new (AMap as any).Pixel(0, -10) : [0, -10],
        zIndex: 400,
        style: {
          'background-color': 'rgba(10, 32, 64, 0.94)',
          'border': '1px solid rgba(56, 189, 248, 0.45)',
          'border-radius': '3px',
          'color': '#e8f4ff',
          'font-size': '11px',
          'font-weight': '500',
          'padding': '3px 8px',
          'line-height': '1.35',
          'white-space': 'nowrap',
          'box-shadow': '0 2px 10px rgba(37, 99, 235, 0.25)',
          'pointer-events': 'none',
        },
      })
    } else {
      companyHoverText.setText(name)
      companyHoverText.setPosition([lng, lat])
    }
    companyHoverText.setMap(map)
  }

  function hideCompanyHoverLabel() {
    companyHoverText?.setMap?.(null)
  }

  function companiesInPark(parkName: string, companies: CompanyRecord[]) {
    return companies.filter((company) => {
      const lng = Number(company.company_longitude)
      const lat = Number(company.company_latitude)
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false
      return findParkNameAt(lng, lat) === parkName
    })
  }

  function clearCompanyMarkers() {
    hideCompanyHoverLabel()
    clearOverlays(companyMarkers)
  }

  function companyMarkerColor(company: CompanyRecord): string {
    return company.company_traded === 1 ? '#ef4444' : '#10b981'
  }

  function parkExtrusionHeight(parkName: string, count: number): number {
    const [lng] = centroidForPark(parkName)
    const lngs = [...parkColorMap.keys()].map(name => centroidForPark(name)[0])
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const t = maxLng > minLng ? (lng - minLng) / (maxLng - minLng) : 0.5
    // 右侧略高，保持可见突起与区域高度差
    const base = 1000 + t * 3000
    return Math.max(1000, Math.min(5200, base + count * 8))
  }

  function renderCompanyMarkers(parkName: string, companies: CompanyRecord[]) {
    clearCompanyMarkers()
    if (!map || !AMap) return

    const list = companiesInPark(parkName, companies)

    for (const company of list) {
      const lng = Number(company.company_longitude)
      const lat = Number(company.company_latitude)
      const color = companyMarkerColor(company)
      const Marker = AMap.Marker
      let marker: any

      if (Marker) {
        marker = new Marker({
          position: [lng, lat],
          offset: (AMap as any).Pixel ? new (AMap as any).Pixel(-4, -4) : [-4, -4],
          content: `<div style="width:7px;height:7px;border-radius:50%;background:${color};border:1px solid #fff;box-shadow:0 0 6px ${color};"></div>`,
          zIndex: company.company_traded === 1 ? 330 : 320,
          cursor: 'pointer',
        })
      } else if (AMap.CircleMarker) {
        marker = new AMap.CircleMarker({
          center: [lng, lat],
          radius: 3.5,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          strokeOpacity: 0.9,
          fillColor: color,
          fillOpacity: 0.95,
          zIndex: company.company_traded === 1 ? 330 : 320,
          bubble: false,
          cursor: 'pointer',
        })
      } else {
        continue
      }

      marker.setMap(map)
      marker.setExtData?.(company)
      marker.on?.('mouseover', () => {
        showCompanyHoverLabel(company.company_name, lng, lat)
      })
      marker.on?.('mouseout', () => {
        hideCompanyHoverLabel()
      })
      companyMarkers.push(marker)
    }
  }

  async function waitForMapContainer() {
    for (let i = 0; i < 20; i++) {
      const el = mapContainerRef.value
      if (el && el.clientWidth > 0 && el.clientHeight > 0) return el
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    }
    return mapContainerRef.value
  }

  function clearOverlays(list: any[]) {
    list.forEach(item => item?.setMap?.(null))
    list.length = 0
  }

  function createPolygonsForFeature(feature: GeoFeature, options: Record<string, unknown>) {
    if (!AMap || !feature.geometry) return []
    const makePolygon = (path: number[][][]) => new AMap.Polygon({
      path,
      bubble: false,
      ...options,
    })

    if (feature.geometry.type === 'Polygon') {
      return [makePolygon(feature.geometry.coordinates as number[][][])]
    }
    if (feature.geometry.type === 'MultiPolygon') {
      return (feature.geometry.coordinates as number[][][][]).map(coords => makePolygon(coords))
    }
    return []
  }

  function releaseMapDrag() {
    if (!map || typeof window === 'undefined') return
    try {
      const container = map.getContainer?.() as HTMLElement | undefined
      container?.dispatchEvent?.(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }))
      container?.dispatchEvent?.(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window }))
      map.setStatus?.({
        dragEnable: true,
        rotateEnable: false,
        pitchEnable: false,
      })
    } catch {
      // ignore
    }
  }

  function deferSelectPark(parkName: string | null, fit = true) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        releaseMapDrag()
        selectPark(parkName, fit)
      })
    })
  }

  function selectPark(parkName: string | null, fit = true) {
    suppressMapClick = true
    setTimeout(() => { suppressMapClick = false }, 80)

    const prevFocus = selectedParkName.value
    if (!parkName) {
      selectedParkName.value = null
    } else if (selectedParkName.value === parkName) {
      selectedParkName.value = null
    } else {
      selectedParkName.value = parkName
    }
    onParkSelectHandler?.(selectedParkName.value)
    renderParks(latestCompanies, fit, prevFocus)
  }

  function renderParks(companies: CompanyRecord[], fit = false, prevFocus: string | null = null) {
    if (!map || !AMap) return

    latestCompanies = companies
    clearOverlays(parkPolygons)
    clearOverlays(parkLabels)
    clearCompanyMarkers()

    const counts = countCompaniesByPark(companies)
    const legend: ParkLegendItem[] = []
    const focusName = selectedParkName.value
    let parkIndex = 0

    for (const [parkName, color] of parkColorMap.entries()) {
      const count = counts.get(parkName) || 0
      const displayName = displayParkName(parkName)
      legend.push({ name: parkName, displayName, color, count })

      if (focusName && focusName !== parkName) continue

      const features = parkFeatures.filter(f => getParkName(f) === parkName)
      for (const feature of features) {
        const extrusionHeight = parkExtrusionHeight(parkName, count)
        const highlighted = isHighlightPark(parkName)
        createPolygonsForFeature(feature, {
          fillColor: color,
          fillOpacity: focusName ? 0.76 : (highlighted ? 0.66 : 0.54),
          strokeColor: brightenHex(color, 0.18),
          strokeWeight: focusName ? 2 : (highlighted ? 1.6 : 1.3),
          strokeOpacity: highlighted ? 0.9 : 0.82,
          extrusionHeight,
          wallColor: '#062038',
          roofColor: color,
          zIndex: 30 + Math.min(40, Math.floor(count / 5)),
          cursor: 'pointer',
          extData: { parkName },
        }).forEach((polygon) => {
          polygon.setMap(map)
          polygon.on('click', (e: any) => {
            e?.originEvent?.stopPropagation?.()
            e?.originEvent?.preventDefault?.()
            deferSelectPark(parkName, true)
          })
          parkPolygons.push(polygon)
        })
      }

      createParkCallout(parkName, displayName, color, parkIndex)
      parkIndex += 1
    }

    parkLegend.value = legend.sort((a, b) => b.count - a.count)

    if (focusName) {
      // 选中园区：保持 3D，不展示企业坐标点
      if (fit) {
        requestAnimationFrame(() => {
          if (prevFocus === null) saveOverviewView()
          applyParkFocusView()
          releaseMapDrag()
        })
      } else {
        if (typeof map.setPitch === 'function') map.setPitch(MAP_PITCH)
        if (typeof map.setRotation === 'function') map.setRotation(MAP_ROTATION)
      }
    } else if (fit) {
      restoreOverviewView()
      releaseMapDrag()
    }

    // 选中园区时只保留该园区波纹，返回全览再恢复全部
    try {
      startMapRipple(focusName)
    } catch (e) {
      console.warn('更新园区波纹失败', e)
    }
  }

  async function initMap(
    companies: CompanyRecord[],
    _onCompanyClick?: (c: CompanyRecord) => void,
    _onCompanyHover?: (c: CompanyRecord | null) => void,
    parkInfos?: ParkInfo[],
  ) {
    mapReady.value = false

    const container = await waitForMapContainer()
    if (!container) {
      console.error('地图容器未就绪')
      return
    }

    try {
      const amapKey = config.public.amapKey as string
      const securityCode = config.public.amapSecurityCode as string
      if (!amapKey) {
        console.error('未配置 NUXT_PUBLIC_AMAP_KEY')
        return
      }

      const [amapApi, zoneData, parkAreas] = await Promise.all([
        loadAmap(amapKey, securityCode),
        fetch('/geo/高新区范围_gcj02.json').then(r => r.json()) as Promise<GeoFeatureCollection>,
        fetch('/geo/park_areas_gcj02.json').then(r => r.json()) as Promise<GeoFeatureCollection>,
      ])

      AMap = amapApi
      await ensureMapPlugins(AMap)
      await loadLoca(amapKey)
      destroyMap()

      parkFeatures = parkAreas.features ?? []
      parkColorMap = buildParkColorMap(parkFeatures)
      if (parkInfos?.length) {
        parkApiList = parkInfos
      }

      const bounds = boundsFromZone(zoneData)
      const center = bounds ? centerFromBounds(bounds) : [114.475, 30.50] as [number, number]
      zoneCenter = center
      const ring = polygonRing(zoneData)

      selectedParkName.value = null
      latestCompanies = companies

      map = new AMap.Map(container, {
        center,
        zoom: MAP_ZOOM,
        pitch: MAP_PITCH,
        rotation: MAP_ROTATION,
        viewMode: '3D',
        pitchEnable: false,
        rotateEnable: false,
        zoomEnable: true,
        dragEnable: true,
        mapStyle: 'amap://styles/dark',
        showLabel: false,
        showBuildingBlock: true,
        skyColor: '#1a4070',
        resizeEnable: true,
      })

      // 仅用透明面框住高新区视野，不画外轮廓蓝线
      if (ring.length) {
        const zonePolygon = new AMap.Polygon({
          path: ring,
          fillColor: 'rgba(0,0,0,0)',
          fillOpacity: 0,
          strokeOpacity: 0,
          strokeWeight: 0,
          zIndex: 1,
        })
        zonePolygon.setMap(map)
        zonePolygons.push(zonePolygon)
      }

      renderParks(companies, false)

      map.on('click', () => {
        if (suppressMapClick || !selectedParkName.value) return
        deferSelectPark(null, true)
      })

      overviewViewSettled = false
      map.on('complete', () => {
        settleOverviewView(center)
        mapReady.value = true
        requestAnimationFrame(() => {
          startMapRipple(selectedParkName.value)
        })
      })

      setTimeout(() => {
        if (!mapReady.value && map) {
          settleOverviewView(center)
          mapReady.value = true
        }
        startMapRipple(selectedParkName.value)
      }, 2500)
    } catch (e) {
      console.error('地图初始化失败', e)
    }
  }

  function highlightCompany(_company: CompanyRecord | null) {
    // 园区模式不展示企业气泡
  }

  function flyToCompany(company: CompanyRecord) {
    if (!map) return
    const lng = Number(company.company_longitude) || 114.42
    const lat = Number(company.company_latitude) || 30.49
    map.setZoomAndCenter(13, [lng, lat], false, 400)
    if (typeof map.setPitch === 'function') map.setPitch(MAP_PITCH)
  }

  function updateCompanies(companies: CompanyRecord[]) {
    latestCompanies = companies
    if (selectedParkName.value && !parkColorMap.has(selectedParkName.value)) {
      selectedParkName.value = null
    }
    const focus = selectedParkName.value
    renderParks(companies, Boolean(focus), focus)
  }

  function destroyMap() {
    stopMapRipple()
    hideCompanyHoverLabel()
    companyHoverText = null
    clearOverlays(companyMarkers)
    clearOverlays(parkLabels)
    clearOverlays(parkPolygons)
    clearOverlays(zoneLines)
    clearOverlays(zonePolygons)
    clearMapControls()
    parkFeatures = []
    parkColorMap = new Map()
    parkLegend.value = []
    selectedParkName.value = null
    latestCompanies = []
    overviewViewState = null
    overviewViewSettled = false
    if (map) {
      map.destroy()
      map = null
    }
  }

  return {
    mapContainerRef,
    mapReady,
    parkLegend,
    selectedParkName,
    selectPark,
    onParkSelect,
    initMap,
    updateCompanies,
    setParkApiList,
    highlightCompany,
    flyToCompany,
    destroyMap,
  }
}
