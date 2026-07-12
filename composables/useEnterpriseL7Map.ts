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
}

declare global {
  interface Window {
    AMap?: AMapLike
    _AMapSecurityConfig?: { securityJsCode: string }
    __enterpriseAmapPromise__?: Promise<AMapLike>
  }
}

const PARK_PALETTE = [
  '#c6a464', '#8fa4c4', '#6e8bb0', '#b7935a', '#a86b56', '#7d92a8', '#c9b98a', '#e0c084',
]

/**
 * 企业大屏地图：高德 AMap 3D + 高新区园区边界 + 各园区企业数标注
 */
export function useEnterpriseL7Map() {
  const config = useRuntimeConfig()
  const mapContainerRef = ref<HTMLDivElement>()
  const mapReady = ref(false)
  const parkLegend = ref<ParkLegendItem[]>([])

  let AMap: AMapLike | null = null
  let map: any = null
  let zonePolygons: any[] = []
  let zoneLines: any[] = []
  let parkPolygons: any[] = []
  let parkLabels: any[] = []
  let parkFeatures: GeoFeature[] = []
  let parkColorMap = new Map<string, string>()

  const MAP_PITCH = 50
  const MAP_ROTATION = -14

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
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.Map3D&callback=${callbackName}`
      script.async = true
      script.onerror = () => {
        delete (window as any)[callbackName]
        reject(new Error('Failed to load AMap JS API'))
      }
      document.head.appendChild(script)
    })

    return window.__enterpriseAmapPromise__
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

  function renderParks(companies: CompanyRecord[]) {
    if (!map || !AMap) return

    clearOverlays(parkPolygons)
    clearOverlays(parkLabels)

    const counts = countCompaniesByPark(companies)
    const legend: ParkLegendItem[] = []

    for (const [parkName, color] of parkColorMap.entries()) {
      const count = counts.get(parkName) || 0
      const shortName = shortParkName(parkName)
      legend.push({ name: parkName, shortName, color, count })

      const features = parkFeatures.filter(f => getParkName(f) === parkName)
      for (const feature of features) {
        createPolygonsForFeature(feature, {
          fillColor: color,
          fillOpacity: 0.22,
          strokeColor: color,
          strokeWeight: 2.2,
          strokeOpacity: 0.95,
          zIndex: 30,
        }).forEach((polygon) => {
          polygon.setMap(map)
          parkPolygons.push(polygon)
        })
      }

      const [lng, lat] = centroidForPark(parkName)
      const label = new AMap.Text({
        text: `${shortName} ${count}家`,
        position: [lng, lat],
        anchor: 'center',
        zIndex: 200,
        style: {
          'background-color': 'rgba(6, 13, 28, 0.84)',
          'border': '1px solid rgba(198, 164, 100, 0.35)',
          'border-radius': '2px',
          'color': '#e8dcc0',
          'font-size': '10px',
          'font-weight': '500',
          'padding': '2px 6px',
          'text-align': 'center',
          'line-height': '1.3',
          'white-space': 'nowrap',
          'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.22)',
        },
      })
      label.setMap(map)
      parkLabels.push(label)
    }

    parkLegend.value = legend.sort((a, b) => b.count - a.count)
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

      const [amapApi, zoneData, borderData, parkAreas] = await Promise.all([
        loadAmap(amapKey, securityCode),
        fetch('/geo/高新区范围_gcj02.json').then(r => r.json()) as Promise<GeoFeatureCollection>,
        fetch('/geo/高新区边界_gcj02.json').then(r => r.json()).catch(() => null) as Promise<GeoFeatureCollection | null>,
        fetch('/geo/park_areas_gcj02.json').then(r => r.json()) as Promise<GeoFeatureCollection>,
      ])

      AMap = amapApi
      destroyMap()

      parkFeatures = parkAreas.features ?? []
      parkColorMap = buildParkColorMap(parkFeatures)

      const bounds = boundsFromZone(zoneData)
      const center = bounds ? centerFromBounds(bounds) : [114.475, 30.50] as [number, number]
      const ring = polygonRing(zoneData)

      map = new AMap.Map(container, {
        center,
        zoom: 11,
        pitch: MAP_PITCH,
        rotation: MAP_ROTATION,
        viewMode: '3D',
        mapStyle: 'amap://styles/dark',
        showLabel: false,
        resizeEnable: true,
      })

      if (ring.length) {
        const zonePolygon = new AMap.Polygon({
          path: ring,
          fillColor: 'rgba(198, 164, 100, 0.06)',
          fillOpacity: 0.5,
          strokeColor: '#c6a464',
          strokeWeight: 1.2,
          strokeOpacity: 0.45,
          zIndex: 8,
        })
        zonePolygon.setMap(map)
        zonePolygons.push(zonePolygon)
      }

      const borderPath = borderData ? linePath(borderData) : ring
      if (borderPath.length) {
        const glowLine = new AMap.Polyline({
          path: borderPath,
          strokeColor: '#e0c084',
          strokeWeight: 5,
          strokeOpacity: 0.22,
          lineJoin: 'round',
          zIndex: 18,
        })
        const mainLine = new AMap.Polyline({
          path: borderPath,
          strokeColor: '#c6a464',
          strokeWeight: 1.6,
          strokeOpacity: 0.75,
          lineJoin: 'round',
          zIndex: 19,
        })
        glowLine.setMap(map)
        mainLine.setMap(map)
        zoneLines.push(glowLine, mainLine)
      }

      renderParks(companies)

      const fitTargets = [...zonePolygons, ...zoneLines, ...parkPolygons]
      if (fitTargets.length) {
        map.setFitView(fitTargets, false, [56, 56, 56, 56], 13.5)
      }

      map.on('complete', () => {
        mapReady.value = true
      })

      setTimeout(() => {
        if (!mapReady.value && map) mapReady.value = true
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
    renderParks(companies)
  }

  function destroyMap() {
    clearOverlays(parkLabels)
    clearOverlays(parkPolygons)
    clearOverlays(zoneLines)
    clearOverlays(zonePolygons)
    parkFeatures = []
    parkColorMap = new Map()
    parkLegend.value = []
    if (map) {
      map.destroy()
      map = null
    }
  }

  return {
    mapContainerRef,
    mapReady,
    parkLegend,
    initMap,
    updateCompanies,
    highlightCompany,
    flyToCompany,
    destroyMap,
  }
}
