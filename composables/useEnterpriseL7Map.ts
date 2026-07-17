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

type AMapLike = any

declare global {
  interface Window {
    AMap?: AMapLike
    Loca?: any
    _AMapSecurityConfig?: Record<string, string>
    __enterpriseAmapPromise__?: Promise<AMapLike>
    __enterpriseLocaPromise__?: Promise<any>
  }
}

/** Loca 官方示例呼吸波纹序列帧纹理（贴地扩散） */
const BREATH_TEXTURE = 'https://a.amap.com/Loca/static/loca-v2/demos/images/breath_blue.png'
const BREATH_TEXTURE_ALT = 'https://a.amap.com/Loca/static/loca-v2/demos/images/breath_yellow.png'

const PARK_PALETTE = [
  '#38bdf8', // sky-400
  '#60a5fa', // blue-400
  '#2563eb', // blue-600
  '#22d3ee', // cyan-400
  '#0ea5e9', // sky-500
  '#7dd3fc', // sky-300
  '#4f8ef7',
  '#5b9bd5',
]

/** 8 大园区固定配色，确保彼此区分明显 */
const PARK_COLOR_OVERRIDES: Record<string, string> = {
  '光谷中华科技产业园': '#3b82f6',
  '光谷未来科技城': '#22d3ee',
  '光谷生物城': '#10b981',
  '光谷光电子信息产业园': '#f59e0b',
  '光谷中心城': '#8b5cf6',
  '光谷现代服务业园': '#f43f5e',
  '光谷智能制造产业园': '#06b6d4',
}

/** 园区边界线默认宽度 */
const PARK_LINE_WIDTH = 2.2
/** 园区边界线悬停/选中宽度 */
const PARK_LINE_WIDTH_ACTIVE = 4.2
/** 园区边界线默认透明度 */
const PARK_LINE_OPACITY = 0.9
/** 园区边界线悬停/选中透明度 */
const PARK_LINE_OPACITY_ACTIVE = 1
/** 园区边界线悬停时 zIndex */
const PARK_LINE_Z_HOVER = 520
/** 园区边界线默认 zIndex */
const PARK_LINE_Z_NORMAL = 500
/** 园区悬停时 3D 抬升高度（凸起效果） */
const PARK_HOVER_ALTITUDE = 3200

/** 地图图层 zIndex */
const MAP_LAYER_Z = {
  city: 8,
  zone: 18,
  park: 22,
  heatmap: 120,
  companyMarker: 320,
  parkLabel: 380,
  mask: 400,
  hoverLabel: 410,
} as const

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
 * 企业大屏地图：高德 AMap 3D + 原生热力图 + Loca 光柱 / 城市亮点
 */
export function useEnterpriseL7Map() {
  const config = useRuntimeConfig()
  const mapContainerRef = ref<HTMLDivElement>()
  const mapReady = ref(false)
  const parkLegend = ref<ParkLegendItem[]>([])
  const selectedParkName = ref<string | null>(null)
  const hoveredParkName = ref<string | null>(null)

  let AMap: AMapLike | null = null
  let map: any = null
  /** 武汉市轮廓，用于默认视野 */
  let cityPolygons: any[] = []
  /** 遮住武汉市以外区域 */
  let maskPolygons: any[] = []
  let wuhanOuterRings: number[][][] = []
  /** 高新区高亮面 */
  let zonePolygons: any[] = []
  let zoneLines: any[] = []
  /** 高新区聚焦遮罩（区外压暗虚化）+ 区界清晰发光边 */
  let zoneFocusMask: any[] = []
  /** 湖北省各地市边界线（省域范围高亮，绘制于遮罩之上） */
  let provinceLines: any[] = []
  /** 湖北省外轮廓（省界高亮） */
  let provinceOutline: any[] = []
  const HUBEI_NAME = '湖北省'
  let parkPolygons: any[] = []
  let parkLines: any[] = []
  let parkHoverPolygons: any[] = []
  /** 园区透明命中面：用于在园区内部也能触发鼠标悬停 */
  let parkHitPolygons: any[] = []
  let parkLabels: any[] = []
  let companyMarkers: any[] = []
  let companyHoverText: any = null
  let heatmapLayer: any = null
  /** 高新区漂浮透明立体板块（Loca PolygonLayer） */
  let zoneBoardLayer: any = null
  let companyGlowLayers: any[] = []
  let companyPrismLayer: any = null
  /** 园区定位激光束（Loca LaserLayer） */
  let parkPillarLayer: any = null
  /** 园区中心地面扩散波纹层 */
  let parkRingLayers: any[] = []
  let parkFeatures: GeoFeature[] = []
  let parkColorMap = new Map<string, string>()
  let parkApiList: ParkInfo[] = []
  let latestCompanies: CompanyRecord[] = []
  let zoneCenter: [number, number] = [114.3055, 30.5928]
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

  /** 全览：武汉市尽量铺满视口；选中园区再拉近 */
  const MAP_PITCH = 20
  const MAP_PITCH_FLAT = 0
  const MAP_ROTATION = 0
  const MAP_ROTATION_FLAT = 0
  const MAP_ZOOM = 13.2
  const MAP_FIT_MAX_ZOOM = 15.8
  /** setFitView: [top, right, bottom, left]；左留白更大，全览时武汉视觉略偏右 */
  const MAP_FIT_PADDING: [number, number, number, number] = [64, 300, 180, 400]
  const MAP_PARK_FIT_MAX_ZOOM = 15.2
  const MAP_PARK_FIT_PADDING: [number, number, number, number] = [72, 200, 160, 200]
  /** 默认全览直接聚焦八大园区范围，让园区居中并自适应屏幕 */
  const MAP_ZONE_FIT_MAX_ZOOM = 16
  const MAP_ZONE_FIT_PADDING: [number, number, number, number] = [40, 40, 40, 40]
  const WUHAN_NAME = '武汉市'

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
      renderParks(latestCompanies)
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

  function attachParkInteractionHandler(overlay: any, parkName: string) {
    overlay.on?.('click', (e: any) => {
      e?.originEvent?.stopPropagation?.()
      e?.originEvent?.preventDefault?.()
      selectParkData(parkName)
    })
    overlay.on?.('mouseover', () => enterParkHover(parkName))
    overlay.on?.('mouseout', () => leaveParkHover(parkName))
  }

  function createParkInlineLabel(parkName: string, displayName: string, color: string) {
    if (!map || !AMap) return

    const center = centroidForPark(parkName)
    const accent = brightenHex(color, 0.35)

    const content = document.createElement('div')
    content.className = 'park-inline-label'
    content.innerHTML = `<span class="park-inline-label__text">${displayName}</span>`
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transform: translateY(-100%);
      pointer-events: auto;
      cursor: pointer;
    `
    const textSpan = content.querySelector('.park-inline-label__text') as HTMLElement
    if (textSpan) {
      textSpan.style.cssText = `
        padding: 5px 12px;
        border-radius: 6px;
        background: rgba(2, 12, 28, 0.58);
        border: 1px solid ${accent}88;
        box-shadow: 0 0 18px ${accent}66, inset 0 1px 0 rgba(255,255,255,0.14);
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-align: center;
        line-height: 1.3;
        white-space: nowrap;
        text-shadow: 0 0 8px ${accent}cc, 0 1px 2px rgba(0,0,0,0.7);
        backdrop-filter: blur(4px);
      `
    }

    const label = new AMap.Marker({
      position: center,
      content,
      anchor: 'bottom-center',
      offset: new AMap.Pixel(0, -70),
      zIndex: MAP_LAYER_Z.parkLabel,
      extData: { parkName },
    })
    label.setMap(map)
    attachParkInteractionHandler(label, parkName)
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
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.Map3D,AMap.ToolBar,AMap.ControlBar,AMap.HeatMap&callback=${callbackName}`
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
      plugin(['AMap.Map3D', 'AMap.ToolBar', 'AMap.ControlBar', 'AMap.HeatMap'], () => resolve())
    })
  }

  function rebuildWuhanMask() {
    if (!map || !AMap || !wuhanOuterRings.length) return
    clearOverlays(maskPolygons)
    const worldRing: [number, number][] = [
      [-180, -85], [180, -85], [180, 85], [-180, 85],
    ]
    try {
      const mask = new AMap.Polygon({
        path: [worldRing, ...wuhanOuterRings],
        fillColor: '#0a2a45',
        fillOpacity: 0.52,
        strokeColor: 'transparent',
        strokeWeight: 0,
        strokeOpacity: 0,
        zIndex: 400,
        bubble: false,
        cursor: 'default',
      })
      mask.setMap(map)
      maskPolygons.push(mask)
    } catch (e) {
      console.warn('武汉市遮罩创建失败', e)
    }
  }

  function clearHeatmap() {
    if (heatmapLayer) {
      try {
        heatmapLayer.setMap?.(null)
        heatmapLayer.hide?.()
      } catch {
        // ignore
      }
      heatmapLayer = null
    }
  }

  function bringHeatmapToFront() {
    try {
      heatmapLayer?.show?.()
    } catch {
      // ignore
    }
  }

  function buildCompanyPoints(companies: CompanyRecord[]) {
    return companies
      .map((c) => {
        const lng = Number(c.company_longitude)
        const lat = Number(c.company_latitude)
        if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < 70 || lat < 15) return null
        if (wuhanOuterRings.length && !wuhanOuterRings.some(ring => pointInRing(lng, lat, ring))) {
          return null
        }
        const score = Number(c.company_score)
        const count = Number.isFinite(score) && score > 0
          ? Math.max(1, Math.round(score / 25))
          : 1
        const height = Number.isFinite(score) && score > 0
          ? Math.max(80, Math.round(score * 12))
          : 80
        const glow = Number.isFinite(score) && score > 0
          ? Math.max(10, Math.round(score / 4))
          : 10
        return {
          lng,
          lat,
          count,
          height,
          glow,
          traded: c.company_traded === 1 ? 1 : 0,
        }
      })
      .filter((p): p is {
        lng: number
        lat: number
        count: number
        height: number
        glow: number
        traded: number
      } => Boolean(p))
  }

  /** 使用高德原生 2D 热力图（不依赖 Loca 的 3D 热力图/光柱） */
  function renderHeatmap(companies: CompanyRecord[]) {
    if (!map || !AMap) return
    clearHeatmap()

    const points = buildCompanyPoints(companies)
    if (!points.length) return

    const maxCount = points.reduce((m, p) => Math.max(m, p.count), 1)
    const HeatMapClass = (AMap as any).HeatMap || (AMap as any).Heatmap
    if (!HeatMapClass) {
      console.warn('AMap.HeatMap 插件不可用')
      return
    }

    try {
      heatmapLayer = new HeatMapClass(map, {
        radius: 16,
        opacity: [0, 0.5],
        gradient: {
          0.2: 'rgba(14, 120, 233, 0.35)',
          0.45: 'rgba(34, 211, 238, 0.65)',
          0.75: 'rgba(80, 220, 250, 0.88)',
          1.0: 'rgba(180, 245, 255, 0.95)',
        },
        zooms: [9, 20],
      })
      heatmapLayer.setDataSet({
        data: points.map(p => ({ lng: p.lng, lat: p.lat, count: p.count })),
        max: maxCount,
      })
      heatmapLayer.show?.()
      console.log('热力图已渲染', { points: points.length, max: maxCount })
    }
    catch (e) {
      console.warn('热力图初始化失败，尝试 {map} 形式', e)
      try {
        heatmapLayer = new HeatMapClass({
          map,
          radius: 18,
          opacity: [0, 0.6],
          gradient: {
            0.2: 'rgba(14, 120, 233, 0.35)',
            0.45: 'rgba(34, 211, 238, 0.65)',
            0.75: 'rgba(80, 220, 250, 0.88)',
            1.0: 'rgba(180, 245, 255, 0.95)',
          },
          zooms: [9, 20],
        })
        heatmapLayer.setDataSet({
          data: points.map(p => ({ lng: p.lng, lat: p.lat, count: p.count })),
          max: maxCount,
        })
        heatmapLayer.show?.()
      }
      catch (e2) {
        console.warn('热力图 {map} 形式也失败', e2)
      }
    }
  }

  function clearCompanyGlowLayer() {
    companyGlowLayers.forEach((layer) => {
      try {
        loca?.remove?.(layer)
        layer?.destroy?.()
      } catch {
        // ignore
      }
    })
    companyGlowLayers = []

    if (companyPrismLayer) {
      try {
        loca?.remove?.(companyPrismLayer)
        companyPrismLayer?.destroy?.()
      } catch {
        // ignore
      }
      companyPrismLayer = null
    }
  }

  function ensureLocaContainer() {
    if (!map || !window.Loca) return null
    if (!loca) {
      loca = new window.Loca.Container({ map })
    }
    return loca
  }

  function startLocaAnimate() {
    try {
      loca?.animate?.start?.()
    }
    catch {
      // ignore
    }
  }

  function clearZoneBoard() {
    if (zoneBoardLayer) {
      try {
        loca?.remove?.(zoneBoardLayer)
        zoneBoardLayer?.destroy?.()
      } catch {
        // ignore
      }
      zoneBoardLayer = null
    }
  }

  function clearParkPillars() {
    if (parkPillarLayer) {
      try {
        loca?.remove?.(parkPillarLayer)
        parkPillarLayer?.destroy?.()
      } catch {
        // ignore
      }
      parkPillarLayer = null
    }
    parkRingLayers.forEach((layer) => {
      try {
        loca?.remove?.(layer)
        layer?.destroy?.()
      } catch {
        // ignore
      }
    })
    parkRingLayers = []
  }

  function buildParkPillarGeoJSON(focusName?: string | null) {
    const features: any[] = []
    for (const [parkName, color] of parkColorMap.entries()) {
      const center = centroidForPark(parkName)
      const focused = focusName === parkName
      const dimmed = focusName != null && focusName !== parkName
      features.push({
        type: 'Feature',
        properties: {
          parkName,
          color,
          focused: focused ? 1 : 0,
          dimmed: dimmed ? 1 : 0,
        },
        geometry: {
          type: 'Point',
          coordinates: center,
        },
      })
    }
    return { type: 'FeatureCollection', features }
  }

  /** 园区定位光标：从天空向下照射的激光束 + 地面水波纹扩散 */
  function renderParkPillars(focusName?: string | null) {
    if (!map || !window.Loca || !window.Loca.LaserLayer || !window.Loca.ScatterLayer) {
      console.warn('Loca.LaserLayer/ScatterLayer 不可用', window.Loca)
      return
    }
    const container = ensureLocaContainer()
    if (!container) {
      console.warn('Loca Container 未创建')
      return
    }
    clearParkPillars()
    const geojson = buildParkPillarGeoJSON(focusName)
    if (!geojson.features.length) return

    // 1. 从天空垂直向下指向园区中心的激光束
    parkPillarLayer = new window.Loca.LaserLayer({
      loca: container,
      zIndex: 132,
      opacity: 0.92,
      visible: true,
      zooms: [9, 20],
      depth: true,
    })
    const laserSource = new window.Loca.GeoJSONSource({ data: geojson })
    parkPillarLayer.setSource(laserSource, {
      unit: 'meter',
      angle: 180,
      height: (_i: number, feature: any) => {
        const dimmed = Number(feature?.properties?.dimmed) === 1
        return dimmed ? 1400 : 6200
      },
      color: (_i: number, feature: any) => {
        const dimmed = Number(feature?.properties?.dimmed) === 1
        const color = feature?.properties?.color || '#38bdf8'
        return dimmed ? hexToRgba(color, 0.28) : hexToRgba(color, 0.9)
      },
      lineWidth: 12,
      trailLength: 600,
      duration: 1500,
      interval: 1000,
      repeat: Infinity,
      delay: () => Math.random() * 2000,
    })
    container.add(parkPillarLayer)
    console.log('园区激光定位层已添加', { count: geojson.features.length })

    // 2. 园区中心地面水波纹扩散
    const ringLayer = new window.Loca.ScatterLayer({
      loca: container,
      zIndex: 131,
      opacity: 0.6,
      visible: true,
      zooms: [9, 20],
    })
    ringLayer.setSource(new window.Loca.GeoJSONSource({ data: geojson }))
    ringLayer.setStyle({
      unit: 'meter',
      size: [1200, 1200],
      altitude: 0,
      borderWidth: 0,
      texture: BREATH_TEXTURE,
      duration: 2400,
      animate: true,
    })
    container.add(ringLayer)
    parkRingLayers.push(ringLayer)

    startLocaAnimate()
  }

  /** 高新区漂浮边界：仅抬升描边，无顶面填充色 */
  function renderZoneFloatingBoard(zoneData: GeoFeatureCollection) {
    if (!map || !window.Loca) return
    const container = ensureLocaContainer()
    if (!container) return
    const feature = zoneData.features?.[0]
    if (!feature?.geometry || !window.Loca.PolygonLayer) return

    clearZoneBoard()
    const geojson = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: feature.geometry }],
    }

    zoneBoardLayer = new window.Loca.PolygonLayer({
      loca: container,
      zIndex: 128,
      opacity: 1,
      visible: true,
      cullface: 'none',
      acceptLight: false,
      hasSide: true,
      hasBottom: false,
      shininess: 1,
    })
    zoneBoardLayer.setSource(new window.Loca.GeoJSONSource({ data: geojson }))
    zoneBoardLayer.setStyle({
      topColor: 'rgba(0, 0, 0, 0)',
      sideTopColor: 'rgba(165, 243, 252, 0.95)',
      sideBottomColor: 'rgba(56, 189, 248, 0.7)',
      altitude: 1800, // 漂浮高度
      height: 14,     // 极薄侧壁，视觉上只剩边界线
    })
    container.add(zoneBoardLayer)
  }

  function buildCompanyGlowGeoJSON(companies: CompanyRecord[]) {
    const points = buildCompanyPoints(companies)
    return {
      type: 'FeatureCollection',
      features: points.map((p, index) => ({
        type: 'Feature',
        properties: {
          id: index,
          glow: p.glow,
          height: p.height,
          traded: p.traded,
        },
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat],
        },
      })),
    }
  }

  function renderCompanyGlowLayer(companies: CompanyRecord[]) {
    if (!map || !window.Loca) return
    const container = ensureLocaContainer()
    if (!container) return

    clearCompanyGlowLayer()
    const geojson = buildCompanyGlowGeoJSON(companies)
    if (!geojson.features.length) return

    // 3D 光柱已移除，保持平面化；仅保留贴地城市亮点光晕
    const bloomLayer = new window.Loca.ScatterLayer({
      loca: container,
      zIndex: 125,
      opacity: 0.9,
      visible: true,
      zooms: [8, 20],
    })
    bloomLayer.setSource(new window.Loca.GeoJSONSource({ data: geojson }))
    bloomLayer.setStyle({
      unit: 'px',
      size: (_i: number, feature: any) => {
        const glow = Number(feature?.properties?.glow) || 10
        return [glow * 1.6, glow * 1.6]
      },
      borderWidth: 0,
      texture: BREATH_TEXTURE,
      duration: 0,
      animate: false,
    })
    container.add(bloomLayer)
    companyGlowLayers.push(bloomLayer)

    // 内核亮点
    const coreLayer = new window.Loca.ScatterLayer({
      loca: container,
      zIndex: 126,
      opacity: 1,
      visible: true,
      zooms: [8, 20],
    })
    coreLayer.setSource(new window.Loca.GeoJSONSource({ data: geojson }))
    coreLayer.setStyle({
      unit: 'px',
      size: (_i: number, feature: any) => {
        const glow = Number(feature?.properties?.glow) || 10
        const core = Math.max(4, Math.round(glow * 0.32))
        return [core, core]
      },
      borderWidth: 0,
      texture: BREATH_TEXTURE,
      duration: 0,
      animate: false,
    })
    container.add(coreLayer)
    companyGlowLayers.push(coreLayer)
    startLocaAnimate()
  }

  function refreshCompanyLayers() {
    // 企业密度热力图：使用高德原生 2D 热力图
    renderHeatmap(latestCompanies)
    renderCompanyGlowLayer(latestCompanies)
  }

  function addMapControls() {
    if (!map || !AMap) return
    clearMapControls()
    const amapAny = AMap as any
    try {
      if (amapAny.ControlBar) {
        const controlBar = new amapAny.ControlBar({
          // 放底部，避开右下「产业公司性质分布」浮层
          position: { right: '410px', bottom: '16px' },
          showZoomBar: true,
          showControlButton: true,
        })
        map.addControl(controlBar)
        mapControls.push(controlBar)
      }
      // 右下角 ToolBar 不展示，避免与「产业公司性质分布」重叠
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
      zooms: [8, 20],
    })
    parkLayer.setSource(new window.Loca.GeoJSONSource({
      data: buildBreathGeoJSON(points),
    }))
    parkLayer.setStyle({
      unit: 'meter',
      size: [4200, 4200],
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
      zooms: [9, 20],
    })
    sparkLayer.setSource(new window.Loca.GeoJSONSource({
      data: buildBreathGeoJSON(points),
    }))
    sparkLayer.setStyle({
      unit: 'meter',
      size: [2200, 2200],
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
    if (fitRegion && parkFeatures.length) {
      // 优先以八大园区边界自适应居中
      const parkPaths: number[][][] = []
      for (const f of parkFeatures) {
        if (f.geometry?.type === 'Polygon') {
          parkPaths.push((f.geometry.coordinates as number[][][])[0])
        } else if (f.geometry?.type === 'MultiPolygon') {
          for (const poly of (f.geometry.coordinates as number[][][][])) {
            parkPaths.push(poly[0])
          }
        }
      }
      if (parkPaths.length && AMap) {
        const fitPolygons = parkPaths.map(path => new AMap.Polygon({
          path,
          fillOpacity: 0,
          strokeOpacity: 0,
          bubble: true,
        }))
        map.setFitView(fitPolygons, true, MAP_ZONE_FIT_PADDING, MAP_ZONE_FIT_MAX_ZOOM)
        clearOverlays(fitPolygons)
      } else {
        map.setZoomAndCenter(MAP_ZOOM, targetCenter, true, 0)
      }
    } else if (fitRegion && zonePolygons.length) {
      map.setFitView(zonePolygons, true, MAP_ZONE_FIT_PADDING, MAP_ZONE_FIT_MAX_ZOOM)
    } else if (fitRegion && cityPolygons.length) {
      map.setFitView(cityPolygons, true, MAP_FIT_PADDING, MAP_FIT_MAX_ZOOM)
    } else if (fitRegion) {
      map.setZoomAndCenter(MAP_ZOOM, targetCenter, true, 0)
    } else {
      map.setZoomAndCenter(MAP_ZOOM, targetCenter, true, 0)
    }
    // setFitView 会清掉俯仰/旋转，随后强制恢复
    if (typeof map.setPitch === 'function') map.setPitch(MAP_PITCH)
    if (typeof map.setRotation === 'function') map.setRotation(MAP_ROTATION)
  }

  function applyParkFocusView(parkName?: string) {
    if (!map) return
    const targetLines = parkName
      ? parkLines.filter((line) => {
          const ext = line?.getExtData?.() || {}
          return ext.parkName === parkName
        })
      : parkLines
    if (!targetLines.length) return
    map.setFitView(targetLines, true, MAP_PARK_FIT_PADDING, MAP_PARK_FIT_MAX_ZOOM)
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

  function setParkLineActive(parkName: string | null) {
    parkLines.forEach((line) => {
      const ext = line.getExtData?.() || {}
      const name = ext.parkName
      const active = name === parkName || name === selectedParkName.value
      const color = ext.color
      line.setOptions({
        strokeWeight: active ? PARK_LINE_WIDTH_ACTIVE : PARK_LINE_WIDTH,
        strokeOpacity: active ? PARK_LINE_OPACITY_ACTIVE : PARK_LINE_OPACITY,
        zIndex: active ? PARK_LINE_Z_HOVER : PARK_LINE_Z_NORMAL,
        strokeColor: active ? brightenHex(color, 0.45) : color,
        strokeStyle: active ? 'solid' : 'dashed',
        strokeDasharray: active ? undefined : [6, 4],
        shadowColor: active ? color : 'transparent',
        shadowBlur: active ? 14 : 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      })
      if (ext) ext.active = active
    })
  }

  /** 悬停某个园区时隐藏其他园区的边界线、命中面和标签，但已选中的园区保持显示 */
  function hideOtherParkOverlays(parkName: string) {
    const keepVisible = (name: string) => name === parkName || name === selectedParkName.value
    parkLines.forEach((line) => {
      const ext = line.getExtData?.() || {}
      if (keepVisible(ext.parkName)) line.show?.()
      else line.hide?.()
    })
    parkHitPolygons.forEach((hit) => {
      const ext = hit.getExtData?.() || {}
      if (keepVisible(ext.parkName)) hit.show?.()
      else hit.hide?.()
    })
    parkLabels.forEach((label) => {
      const ext = label.getExtData?.() || {}
      if (keepVisible(ext.parkName)) label.show?.()
      else label.hide?.()
    })
  }

  function showAllParkOverlays() {
    parkLines.forEach((line) => line.show?.())
    parkHitPolygons.forEach((hit) => hit.show?.())
    parkLabels.forEach((label) => label.show?.())
  }

  function enterParkHover(parkName: string) {
    hoveredParkName.value = parkName
    hideOtherParkOverlays(parkName)
    setParkLineActive(parkName)
    showParkHoverPolygon(parkName)
  }

  function leaveParkHover(parkName: string) {
    if (hoveredParkName.value !== parkName) return
    hoveredParkName.value = null
    if (selectedParkName.value) {
      hideOtherParkOverlays(selectedParkName.value)
    } else {
      showAllParkOverlays()
    }
    setParkLineActive(null)
    clearParkHoverPolygons()
  }

  function clearParkHoverPolygons() {
    clearOverlays(parkHoverPolygons)
  }

  /** 园区悬停高亮：内部轻微填充，不显示射线 */
  function showParkHoverPolygon(parkName: string) {
    if (!map || !AMap) return
    clearParkHoverPolygons()
    const color = parkColorMap.get(parkName)
    if (!color) return
    const features = parkFeatures.filter(f => getParkName(f) === parkName)

    // 园区内部轻微填充色（位于边界线下方，不阻挡鼠标事件）
    features.forEach((feature) => {
      createPolygonsForFeature(feature, {
        fillColor: color,
        fillOpacity: 0.12,
        strokeColor: 'transparent',
        strokeWeight: 0,
        strokeOpacity: 0,
        zIndex: PARK_LINE_Z_NORMAL - 15,
        cursor: 'pointer',
        bubble: true,
        extData: { parkName, hover: true },
      }).forEach((polygon) => {
        polygon.setMap(map)
        parkHoverPolygons.push(polygon)
      })
    })
  }

  function hexToRgba(hex: string, alpha: number): string {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
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
        const size = company.company_traded === 1 ? 9 : 7
        const offset = Math.round(size / 2)
        marker = new Marker({
          position: [lng, lat],
          offset: (AMap as any).Pixel ? new (AMap as any).Pixel(-offset, -offset) : [-offset, -offset],
          content: `<div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:1px solid #fff;box-shadow:0 0 8px ${color};"><span style="position:absolute;inset:-6px;border-radius:50%;border:1px solid ${color};opacity:0.55;animation:es-marker-pulse 1.8s ease-out infinite;"></span></div>`,
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

  function linePathsFromFeature(feature: GeoFeature): number[][][] {
    if (!feature.geometry) return []
    const geometry = feature.geometry
    if (geometry.type === 'Polygon') {
      const coords = geometry.coordinates as number[][][]
      return [coords[0]].filter(Boolean)
    }
    if (geometry.type === 'MultiPolygon') {
      return (geometry.coordinates as number[][][][])
        .map(poly => poly[0])
        .filter(ring => Array.isArray(ring) && ring.length > 0)
    }
    return []
  }

  function createParkBoundaryLines(feature: GeoFeature, options: Record<string, unknown>) {
    if (!AMap || !feature.geometry) return []
    const active = !!(options as any).extData?.active
    return linePathsFromFeature(feature).map(path => new AMap.Polyline({
      path,
      showDir: false,
      isOutline: false,
      strokeStyle: active ? 'solid' : 'dashed',
      strokeDasharray: active ? undefined : [6, 4],
      lineJoin: 'round',
      lineCap: 'round',
      ...options,
    }))
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

  function selectParkData(parkName: string | null) {
    suppressMapClick = true
    setTimeout(() => { suppressMapClick = false }, 80)

    const isDeselect = !parkName || selectedParkName.value === parkName
    if (isDeselect) {
      selectedParkName.value = null
    } else {
      selectedParkName.value = parkName
    }
    onParkSelectHandler?.(selectedParkName.value)

    // 点击 overlay 后主动释放地图拖拽状态，避免地图误跟随鼠标
    releaseMapDrag()

    // 同步边界线高亮与定位光标聚焦，保证左侧点击和地图点击效果一致
    setParkLineActive(selectedParkName.value)
    renderParkPillars(selectedParkName.value)

    // 选中园区时只保留该园区的边界线/标签，取消选中时恢复全部显示
    if (selectedParkName.value) {
      hideOtherParkOverlays(selectedParkName.value)
    } else {
      showAllParkOverlays()
    }

    // 选中园区时放大定位到该园区，取消选中时回到全览视角
    requestAnimationFrame(() => {
      if (selectedParkName.value) {
        applyParkFocusView(selectedParkName.value)
      } else {
        restoreOverviewView()
      }
    })
  }

  function deferSelectPark(parkName: string | null) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        selectParkData(parkName)
      })
    })
  }

  function selectPark(parkName: string | null) {
    selectParkData(parkName)
  }

  function renderParks(companies: CompanyRecord[]) {
    if (!map || !AMap) return

    latestCompanies = companies
    clearOverlays(parkPolygons)
    clearOverlays(parkLines)
    clearParkHoverPolygons()
    clearOverlays(parkHitPolygons)
    clearOverlays(parkLabels)
    clearCompanyMarkers()

    const counts = countCompaniesByPark(companies)
    const legend: ParkLegendItem[] = []
    hoveredParkName.value = null
    for (const [parkName, color] of parkColorMap.entries()) {
      const count = counts.get(parkName) || 0
      const displayName = displayParkName(parkName)
      legend.push({ name: parkName, displayName, color, count })

      const features = parkFeatures.filter(f => getParkName(f) === parkName)
      for (const feature of features) {
        // 园区轮廓线：默认虚线，鼠标悬停时实线发光
        createParkBoundaryLines(feature, {
          strokeColor: color,
          strokeWeight: PARK_LINE_WIDTH,
          strokeOpacity: PARK_LINE_OPACITY,
          zIndex: PARK_LINE_Z_NORMAL,
          cursor: 'pointer',
          bubble: false,
          extData: { parkName, color, active: false },
        }).forEach((line) => {
          line.setMap(map)
          line.on('click', (e: any) => {
            e?.originEvent?.stopPropagation?.()
            e?.originEvent?.preventDefault?.()
            selectParkData(parkName)
          })
          line.on('mouseover', () => enterParkHover(parkName))
          line.on('mouseout', () => leaveParkHover(parkName))
          parkLines.push(line)
        })

        // 园区透明命中面：填充透明但可接收鼠标事件，鼠标在园区内部也能高亮
        createPolygonsForFeature(feature, {
          fillColor: 'transparent',
          fillOpacity: 0,
          strokeColor: 'transparent',
          strokeWeight: 0,
          strokeOpacity: 0,
          zIndex: PARK_LINE_Z_NORMAL - 5,
          cursor: 'pointer',
          bubble: false,
          extData: { parkName, color, hit: true },
        }).forEach((hit) => {
          hit.setMap(map)
          hit.on('click', (e: any) => {
            e?.originEvent?.stopPropagation?.()
            e?.originEvent?.preventDefault?.()
            selectParkData(parkName)
          })
          hit.on('mouseover', () => enterParkHover(parkName))
          hit.on('mouseout', () => leaveParkHover(parkName))
          parkHitPolygons.push(hit)
        })
      }

      createParkInlineLabel(parkName, displayName, color)
    }

    parkLegend.value = legend.sort((a, b) => b.count - a.count)
    refreshCompanyLayers()
    renderParkPillars(null)
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

      const [amapApi, citiesData, regionData, zoneData, parkAreas] = await Promise.all([
        loadAmap(amapKey, securityCode),
        fetch('/geo/hubei-cities_gcj02.json').then(r => r.json()) as Promise<GeoFeatureCollection>,
        fetch('/geo/region_gcj02.json').then(r => r.json()) as Promise<GeoFeatureCollection>,
        fetch('/geo/高新区范围_gcj02.json').then(r => r.json()) as Promise<GeoFeatureCollection>,
        fetch('/geo/park_areas_gcj02.json').then(r => r.json()) as Promise<GeoFeatureCollection>,
      ])

      AMap = amapApi
      await ensureMapPlugins(AMap)
      // Loca 城市亮光图层（避免 Vite 下 @antv/l7-maps 的 amap-jsapi-loader 默认导出错误）
      try {
        await loadLoca(amapKey)
      } catch (e) {
        console.warn('Loca 加载失败，企业亮光点将不可用', e)
      }
      destroyMap()

      parkFeatures = parkAreas.features ?? []
      parkColorMap = buildParkColorMap(parkFeatures)
      if (parkInfos?.length) {
        parkApiList = parkInfos
      }

      const wuhanFeature = (citiesData.features ?? []).find(
        f => String(f.properties?.name || '') === WUHAN_NAME,
      ) ?? null
      const zoneBounds = boundsFromZone(zoneData)
      const center = wuhanFeature?.properties?.centroid
        ? [Number((wuhanFeature.properties as any).centroid[0]), Number((wuhanFeature.properties as any).centroid[1])] as [number, number]
        : zoneBounds
          ? centerFromBounds(zoneBounds)
          : [114.3055, 30.5928] as [number, number]
      zoneCenter = center

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
        mapStyle: 'amap://styles/darkblue',
        // 平面化底图：不显示 3D 建筑楼块
        features: ['bg', 'road', 'point'],
        showLabel: true,
        showBuildingBlock: false,
        skyColor: '#0a2740',
        resizeEnable: true,
      })
      map.setFeatures?.(['bg', 'road', 'point'])
      map.setStatus?.({ showBuildingBlock: false })

      addMapControls()

      // 仅保留武汉市：外部全遮罩
      if (wuhanFeature?.geometry) {
        wuhanOuterRings = outerRingsFromGeometry(wuhanFeature.geometry)
        rebuildWuhanMask()

        // 湖北省外轮廓：省界实线 + 外发光，凸显省域范围
        const hubeiFeature = (regionData.features ?? []).find(
          f => String(f.properties?.name || '') === HUBEI_NAME,
        ) ?? null
        if (hubeiFeature?.geometry) {
          createPolygonsForFeature(hubeiFeature, {
            fillColor: 'transparent',
            fillOpacity: 0,
            strokeColor: '#38bdf8',
            strokeWeight: 5,
            strokeOpacity: 0.22,
            zIndex: 401,
            cursor: 'default',
            bubble: true,
          }).forEach((polygon) => {
            polygon.setMap(map)
            provinceOutline.push(polygon)
          })
          createPolygonsForFeature(hubeiFeature, {
            fillColor: 'transparent',
            fillOpacity: 0,
            strokeColor: '#60a5fa',
            strokeWeight: 2.2,
            strokeStyle: 'dashed',
            strokeOpacity: 0.88,
            zIndex: 402,
            cursor: 'default',
            bubble: true,
          }).forEach((polygon) => {
            polygon.setMap(map)
            provinceOutline.push(polygon)
          })
        }

        // 湖北省各地市：淡蓝虚线细分省内结构（不含武汉）
        for (const feature of (citiesData.features ?? [])) {
          if (String(feature.properties?.name || '') === WUHAN_NAME) continue
          createPolygonsForFeature(feature, {
            fillColor: 'transparent',
            fillOpacity: 0,
            strokeColor: '#3b82f6',
            strokeWeight: 1,
            strokeStyle: 'dashed',
            strokeOpacity: 0.35,
            zIndex: 403,
            cursor: 'default',
            bubble: true,
          }).forEach((polygon) => {
            polygon.setMap(map)
            provinceLines.push(polygon)
          })
        }

        // 武汉市边界高亮：外发光宽描边 + 亮青主描边，绘制于遮罩之上确保清晰醒目
        createPolygonsForFeature(wuhanFeature, {
          fillColor: 'transparent',
          fillOpacity: 0,
          strokeColor: '#22d3ee',
          strokeWeight: 10,
          strokeOpacity: 0.28,
          zIndex: 405,
          cursor: 'default',
          bubble: true,
        }).forEach((polygon) => {
          polygon.setMap(map)
          cityPolygons.push(polygon)
        })
        createPolygonsForFeature(wuhanFeature, {
          fillColor: '#0e5a8a',
          fillOpacity: 0.08,
          strokeColor: '#a5f3fc',
          strokeWeight: 3.5,
          strokeOpacity: 1,
          zIndex: 406,
          cursor: 'default',
          bubble: true,
        }).forEach((polygon) => {
          polygon.setMap(map)
          cityPolygons.push(polygon)
        })
      }

      // 高新区范围：仅边界线，无填充
      if (zoneData.features?.[0]) {
        createPolygonsForFeature(zoneData.features[0], {
          fillColor: 'transparent',
          fillOpacity: 0,
          strokeColor: '#7dd3fc',
          strokeWeight: 2.6,
          strokeOpacity: 0.95,
          zIndex: MAP_LAYER_Z.zone,
          cursor: 'default',
          bubble: true,
        }).forEach((polygon) => {
          polygon.setMap(map)
          zonePolygons.push(polygon)
        })

        // 高新区聚焦遮罩：世界矩形挖掉高新区做“洞”，区外整体压暗虚化，把园区从地图上“抠”出来
        const zoneFeat = zoneData.features[0]
        const zoneRings = zoneFeat.geometry ? outerRingsFromGeometry(zoneFeat.geometry) : []
        if (AMap && zoneRings.length) {
          const worldRing: [number, number][] = [
            [-180, -85], [180, -85], [180, 85], [-180, 85],
          ]
          try {
            const focus = new AMap.Polygon({
              path: [worldRing, ...zoneRings],
              fillColor: '#04162b',
              fillOpacity: 0.82,
              strokeColor: 'transparent',
              strokeWeight: 0,
              strokeOpacity: 0,
              zIndex: 407,
              bubble: false,
              cursor: 'default',
            })
            focus.setMap(map)
            zoneFocusMask.push(focus)
          } catch (e) {
            console.warn('高新区聚焦遮罩创建失败', e)
          }
        }

        // 区界清晰发光边：绘制在遮罩之上，保证“抠出”边缘干净醒目
        createPolygonsForFeature(zoneData.features[0], {
          fillColor: 'transparent',
          fillOpacity: 0,
          strokeColor: '#a5f3fc',
          strokeWeight: 3.2,
          strokeOpacity: 1,
          zIndex: 409,
          cursor: 'default',
          bubble: true,
        }).forEach((polygon) => {
          polygon.setMap(map)
          zoneFocusMask.push(polygon)
        })
      }

      renderParks(companies)
      refreshCompanyLayers()
      // 高新区漂浮立体板块已移除，保持平面化

      map.on('click', () => {
        if (suppressMapClick || !selectedParkName.value) return
        deferSelectPark(null)
      })
      map.on('zoomend', bringHeatmapToFront)
      map.on('moveend', bringHeatmapToFront)

      overviewViewSettled = false
      map.on('complete', () => {
        settleOverviewView(center)
        mapReady.value = true
      })

      setTimeout(() => {
        if (!mapReady.value && map) {
          settleOverviewView(center)
          mapReady.value = true
        }
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
    renderParks(companies)
    refreshCompanyLayers()
  }

  function destroyMap() {
    clearCompanyGlowLayer()
    clearHeatmap()
    clearZoneBoard()
    clearParkPillars()
    stopMapRipple()
    hideCompanyHoverLabel()
    companyHoverText = null
    clearOverlays(companyMarkers)
    clearOverlays(parkLabels)
    clearOverlays(parkHoverPolygons)
    clearOverlays(parkHitPolygons)
    clearOverlays(parkLines)
    clearOverlays(parkPolygons)
    clearOverlays(zoneLines)
    clearOverlays(provinceLines)
    clearOverlays(provinceOutline)
    clearOverlays(zonePolygons)
    clearOverlays(zoneFocusMask)
    clearOverlays(cityPolygons)
    clearOverlays(maskPolygons)
    clearMapControls()
    wuhanOuterRings = []
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

  // 对外暴露：容器/状态/园区图例与地图操作方法
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
