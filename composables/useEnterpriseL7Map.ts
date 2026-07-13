import type { CompanyRecord } from '~/types/company'

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
  shortName: string
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
    _AMapSecurityConfig?: { securityJsCode: string }
    __enterpriseAmapPromise__?: Promise<AMapLike>
  }
}

const PARK_PALETTE = [
  '#38bdf8', // 天蓝
  '#34d399', // 翠绿
  '#fbbf24', // 琥珀
  '#f472b6', // 粉玫
  '#a78bfa', // 紫色
  '#fb923c', // 橙色
  '#22d3ee', // 青蓝
  '#4ade80', // 草绿
]

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
  let latestCompanies: CompanyRecord[] = []
  let zoneCenter: [number, number] = [114.475, 30.50]
  let mapControls: any[] = []
  let suppressMapClick = false

  type MapViewState = {
    center: [number, number]
    zoom: number
    pitch: number
    rotation: number
  }

  let overviewViewState: MapViewState | null = null

  /** 全览：轻微倾斜；选中园区：平面俯视 */
  const MAP_PITCH = 30
  const MAP_PITCH_FLAT = 0
  const MAP_ROTATION = 12
  const MAP_ROTATION_FLAT = 0
  const MAP_ZOOM = 12.8
  const MAP_FIT_MAX_ZOOM = 13.4
  const MAP_PARK_FIT_MAX_ZOOM = 15.2

  function getParkName(feature: GeoFeature): string {
    return String(feature.properties?.park_name || feature.properties?.Layer || '').trim()
  }

  function shortParkName(name: string): string {
    return name.replace(/^光谷/, '') || name
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

  function countCompaniesByPark(companies: CompanyRecord[]): Map<string, number> {
    const counts = new Map<string, number>()
    for (const name of parkColorMap.keys()) counts.set(name, 0)

    for (const company of companies) {
      const lng = Number(company.company_longitude)
      const lat = Number(company.company_latitude)
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue
      const parkName = findParkNameAt(lng, lat)
      if (!parkName) continue
      counts.set(parkName, (counts.get(parkName) || 0) + 1)
    }
    return counts
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
      map.set(name, PARK_PALETTE[index % PARK_PALETTE.length])
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
    map.setZoomAndCenter(zoom, center, false, 0)
    if (typeof map.setPitch === 'function') map.setPitch(pitch)
    if (typeof map.setRotation === 'function') map.setRotation(rotation)
  }

  function settleOverviewView(targetCenter: [number, number]) {
    applyMapView(targetCenter, true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => saveOverviewView())
    })
  }

  function applyMapView(targetCenter: [number, number], fitRegion = false) {
    if (!map) return
    if (fitRegion) {
      // 框住高新区后略再拉近一点
      const fitTargets = [...zonePolygons, ...zoneLines]
      if (fitTargets.length) {
        map.setFitView(fitTargets, false, [40, 40, 40, 40], MAP_FIT_MAX_ZOOM)
        const z = typeof map.getZoom === 'function' ? Number(map.getZoom()) : MAP_ZOOM
        map.setZoom(Math.min(z + 0.25, MAP_FIT_MAX_ZOOM))
      } else {
        map.setZoomAndCenter(MAP_ZOOM, targetCenter, false, 0)
      }
    } else {
      map.setZoomAndCenter(MAP_ZOOM, targetCenter, false, 0)
    }
    // setFitView 会清掉俯仰/旋转，随后强制恢复
    if (typeof map.setPitch === 'function') map.setPitch(MAP_PITCH)
    if (typeof map.setRotation === 'function') map.setRotation(MAP_ROTATION)
  }

  function applyParkFocusView() {
    if (!map || !parkPolygons.length) return
    map.setFitView(parkPolygons, false, [64, 64, 64, 64], MAP_PARK_FIT_MAX_ZOOM)
    if (typeof map.setPitch === 'function') map.setPitch(MAP_PITCH_FLAT)
    if (typeof map.setRotation === 'function') map.setRotation(MAP_ROTATION_FLAT)
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
    // 右侧（东）更高，左侧（西）更矮；企业数只做轻微加成
    const base = 1800 + t * 9000
    return Math.max(1800, Math.min(12000, base + count * 12))
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

    for (const [parkName, color] of parkColorMap.entries()) {
      const count = counts.get(parkName) || 0
      const shortName = shortParkName(parkName)
      legend.push({ name: parkName, shortName, color, count })

      if (focusName && focusName !== parkName) continue

      const features = parkFeatures.filter(f => getParkName(f) === parkName)
      for (const feature of features) {
        const extrusionHeight = focusName ? 0 : parkExtrusionHeight(parkName, count)
        createPolygonsForFeature(feature, {
          fillColor: color,
          fillOpacity: focusName ? 0.72 : 0.58,
          strokeColor: color,
          strokeWeight: focusName ? 2.2 : 1.4,
          strokeOpacity: 0.9,
          extrusionHeight,
          wallColor: '#062038',
          roofColor: `${color}dd`,
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

      const [lng, lat] = centroidForPark(parkName)
      const label = new AMap.Text({
        text: shortName,
        position: [lng, lat],
        anchor: 'center',
        zIndex: 200,
        style: {
          'background-color': 'rgba(10, 32, 64, 0.88)',
          'border': '1px solid rgba(56, 189, 248, 0.4)',
          'border-radius': '2px',
          'color': '#e8f4ff',
          'font-size': '10px',
          'font-weight': '500',
          'padding': '2px 6px',
          'text-align': 'center',
          'line-height': '1.3',
          'white-space': 'nowrap',
          'box-shadow': '0 2px 10px rgba(37, 99, 235, 0.25)',
          'cursor': 'pointer',
        },
      })
      label.setMap(map)
      label.on?.('click', (e: any) => {
        e?.originEvent?.stopPropagation?.()
        e?.originEvent?.preventDefault?.()
        deferSelectPark(parkName, true)
      })
      parkLabels.push(label)
    }

    parkLegend.value = legend.sort((a, b) => b.count - a.count)

    if (focusName) {
      renderCompanyMarkers(focusName, companies)
      if (fit) {
        requestAnimationFrame(() => {
          if (prevFocus === null) saveOverviewView()
          applyParkFocusView()
          releaseMapDrag()
        })
      } else {
        if (typeof map.setPitch === 'function') map.setPitch(MAP_PITCH_FLAT)
        if (typeof map.setRotation === 'function') map.setRotation(MAP_ROTATION_FLAT)
      }
    } else if (fit) {
      restoreOverviewView()
      releaseMapDrag()
    }
  }

  async function initMap(
    companies: CompanyRecord[],
    _onCompanyClick?: (c: CompanyRecord) => void,
    _onCompanyHover?: (c: CompanyRecord | null) => void,
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
      destroyMap()

      parkFeatures = parkAreas.features ?? []
      parkColorMap = buildParkColorMap(parkFeatures)

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
      addMapControls()

      map.on('click', () => {
        if (suppressMapClick || !selectedParkName.value) return
        deferSelectPark(null, true)
      })

      // 框住区域后恢复俯仰与旋转，并记录全览视角供返回时还原
      settleOverviewView(center)

      map.on('complete', () => {
        mapReady.value = true
        settleOverviewView(center)
        setTimeout(() => settleOverviewView(center), 200)
      })

      setTimeout(() => {
        if (!mapReady.value && map) {
          mapReady.value = true
          settleOverviewView(center)
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
    const focus = selectedParkName.value
    renderParks(companies, Boolean(focus), focus)
  }

  function destroyMap() {
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
    initMap,
    updateCompanies,
    highlightCompany,
    flyToCompany,
    destroyMap,
  }
}
