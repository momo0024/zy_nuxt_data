import type { CompanyRecord } from '~/types/company'

export const HIGHLIGHT_PROVINCE = '湖北省'
export const HIGHLIGHT_CITY = '武汉市'
export const ZONE_LABEL = '高新区'

export type RegionSelectPayload =
  | { type: 'zone', name: string }
  | { type: 'city', name: string, adcode: number }

const WUHAN_CENTER: [number, number] = [30.5928, 114.3055]
const WUHAN_ZOOM = 12
const WUHAN_FIT_MAX_ZOOM = 13

/** 模糊蒙版镂空范围：省外 / 市外 / 高新区外 */
type BlurFocusMode = 'hubei' | 'wuhan' | 'zone' | 'city'

const HOVER_OUTLINE = {
  color: '#ea580c',
  weight: 4,
  opacity: 1,
  fillOpacity: 0,
  fill: false,
  dashArray: undefined as string | undefined,
}

  function getCityStyle(
    feature: GeoJSON.Feature | undefined,
    hovered = false,
    focusMode: BlurFocusMode = 'wuhan',
  ) {
    if (hovered) return { ...HOVER_OUTLINE }
    if (focusMode === 'zone') {
      return {
        color: 'transparent',
        weight: 0,
        opacity: 0,
        fillOpacity: 0,
        fill: false,
        dashArray: undefined as string | undefined,
      }
    }
    const isWuhan = feature?.properties?.name === HIGHLIGHT_CITY
    if (!isWuhan) {
      return {
        color: 'transparent',
        weight: 0,
        opacity: 0,
        fillOpacity: 0,
        fill: false,
      }
    }
    return {
      color: '#0891b2',
      weight: 2.5,
      fillOpacity: 0,
      fill: false,
    }
  }

  function getProvinceStyle(
    _feature: GeoJSON.Feature | undefined,
    hovered = false,
    focusMode: BlurFocusMode = 'wuhan',
  ) {
    if (hovered) return { ...HOVER_OUTLINE }
    if (focusMode === 'zone') {
      return {
        color: '#cbd5e1',
        weight: 1,
        opacity: 0.35,
        fillOpacity: 0,
        fill: false,
        dashArray: '4 3',
      }
    }
    return {
      color: '#94a3b8',
      weight: 1.2,
      opacity: 0.85,
      fillOpacity: 0,
      fill: false,
      dashArray: '4 3',
    }
  }

function getZoneStyle(hovered = false, focusMode: BlurFocusMode = 'wuhan') {
  if (hovered) {
    return {
      color: '#7c3aed',
      weight: 5,
      opacity: 1,
      fillOpacity: 0,
      fill: false,
      dashArray: '10 6',
    }
  }
  if (focusMode === 'zone') {
    return {
      color: '#7c3aed',
      weight: 5,
      opacity: 1,
      fillOpacity: 0,
      fill: false,
      dashArray: '10 6',
    }
  }
  return {
    color: '#7c3aed',
    weight: 4.5,
    opacity: 1,
    fillOpacity: 0,
    fill: false,
    dashArray: '10 6',
  }
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

/** 点在多边形内（GeoJSON 坐标为 [lng, lat]） */
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
): GeoJSON.Feature | null {
  const hits = features.filter((f) => {
    if (!f.geometry) return false
    return pointInGeoJSON(latlng.lng, latlng.lat, f.geometry)
  })
  if (!hits.length) return null
  if (hits.length === 1) return hits[0]
  return hits.reduce((best, f) => (featureHitArea(f) < featureHitArea(best) ? f : best))
}

function collectPathsFromLayer(layer: import('leaflet').Layer): import('leaflet').Path[] {
  if ('getLayers' in layer && typeof (layer as import('leaflet').LayerGroup).getLayers === 'function') {
    return (layer as import('leaflet').LayerGroup)
      .getLayers()
      .flatMap(child => collectPathsFromLayer(child))
  }
  if ('setStyle' in layer) return [layer as import('leaflet').Path]
  return []
}

function filterCompaniesInZone(companies: CompanyRecord[], zone: GeoJSON.FeatureCollection): CompanyRecord[] {
  const polys = zone.features.filter(f => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon')
  if (!polys.length) return companies
  return companies.filter(c => polys.some(f => pointInGeoJSON(c.company_longitude, c.company_latitude, f.geometry!)))
}

const INDUSTRY_COLORS: Record<string, string> = {
  '信息技术': '#6366f1', '人工智能': '#8b5cf6', '云计算': '#3b82f6',
  '半导体': '#0ea5e9', '网络安全': '#06b6d4', '金融科技': '#10b981',
  '新能源': '#22c55e', '新能源汽车': '#84cc16', '汽车制造': '#eab308',
  '医疗健康': '#f59e0b', '生物医药': '#f97316', '工程机械': '#ef4444',
  '激光光电': '#14b8a6', '通信设备': '#a855f7', '医药制造': '#f97316',
  '直播平台': '#ec4899',
}

export function getIndustryColor(industry: string): string {
  return INDUSTRY_COLORS[industry] || '#6366f1'
}

function makeCompanyIcon(L: typeof import('leaflet'), color: string) {
  return L.divIcon({
    className: 'gs-company-icon',
    html: `<span class="gs-company-dot" style="background:${color}"></span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function makeClusterIcon(L: typeof import('leaflet'), count: number) {
  return L.divIcon({
    className: 'gs-cluster-icon',
    html: `<div class="gs-cluster-bubble">${count}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

export function useGeoLeafletMap() {
  const mapContainerRef = ref<HTMLDivElement>()
  const mapReady = ref(false)
  const quickView = ref<'zone' | 'wuhan' | null>(null)

  let L: typeof import('leaflet') | null = null
  let map: import('leaflet').Map | null = null
  let markerLayer: import('leaflet').LayerGroup | null = null
  let clusterLayer: import('leaflet').LayerGroup | null = null
  let blurOverlayEl: HTMLDivElement | null = null
  let chinaProvincesLayer: import('leaflet').GeoJSON | null = null
  let hubeiCitiesLayer: import('leaflet').GeoJSON | null = null
  let zoneLayer: import('leaflet').GeoJSON | null = null
  let zoneBounds: import('leaflet').LatLngBounds | null = null
  let wuhanBounds: import('leaflet').LatLngBounds | null = null

  let cityFeatures: GeoJSON.Feature[] = []
  let zoneFeatures: GeoJSON.Feature[] = []
  let otherProvinceFeatures: GeoJSON.Feature[] = []
  const cityPathsByAdcode = new Map<number, import('leaflet').Path[]>()
  const cityFeatureByAdcode = new Map<number, GeoJSON.Feature>()
  const provincePathsByName = new Map<string, import('leaflet').Path[]>()
  const provinceFeatureByName = new Map<string, GeoJSON.Feature>()
  const zonePaths: import('leaflet').Path[] = []
  /** 'zone' | `city-${adcode}` | `province-${name}` */
  let hoveredRegion: string | null = null
  let regionHoverTooltip: import('leaflet').Tooltip | null = null
  let syncBlurOverlay: (() => void) | null = null
  let blurResizeObserver: ResizeObserver | null = null
  let hubeiFeatureStored: GeoJSON.Feature | null = null
  let wuhanFeatureStored: GeoJSON.Feature | null = null
  let focusedCityFeature: GeoJSON.Feature | null = null
  let blurFocusMode: BlurFocusMode = 'wuhan'

  let onCompanyClick: ((c: CompanyRecord) => void) | undefined
  let onRegionSelect: ((payload: RegionSelectPayload) => void) | undefined

  type HoverTarget =
    | { kind: 'zone' }
    | { kind: 'city', feature: GeoJSON.Feature }
    | { kind: 'province', feature: GeoJSON.Feature }

  function isInZone(latlng: { lat: number, lng: number }) {
    return zoneFeatures.some(
      f => f.geometry && pointInGeoJSON(latlng.lng, latlng.lat, f.geometry),
    )
  }

  function isInWuhan(latlng: { lat: number, lng: number }) {
    return !!(
      wuhanFeatureStored?.geometry
      && pointInGeoJSON(latlng.lng, latlng.lat, wuhanFeatureStored.geometry)
    )
  }

  function findHoverTarget(latlng: { lat: number, lng: number }): HoverTarget | null {
    if (blurFocusMode === 'zone') {
      if (isInZone(latlng)) return { kind: 'zone' }
      const provinceHit = findFeatureAt(latlng, otherProvinceFeatures)
      if (provinceHit) return { kind: 'province', feature: provinceHit }
      return null
    }

    if (isInZone(latlng)) return { kind: 'zone' }

    if (isInWuhan(latlng) && wuhanFeatureStored) {
      return { kind: 'city', feature: wuhanFeatureStored }
    }

    if (
      hubeiFeatureStored?.geometry
      && pointInGeoJSON(latlng.lng, latlng.lat, hubeiFeatureStored.geometry)
    ) {
      return { kind: 'province', feature: hubeiFeatureStored }
    }

    const provinceHit = findFeatureAt(latlng, otherProvinceFeatures)
    if (provinceHit) return { kind: 'province', feature: provinceHit }

    return null
  }

  function applyFocusVisuals() {
    const isZoneFocus = blurFocusMode === 'zone'

    // Hide entire cities and province layers in zone mode for cleaner rendering
    if (isZoneFocus) {
      hubeiCitiesLayer?.eachLayer((layer) => {
        if ('setOpacity' in layer) (layer as import('leaflet').Path).setOpacity(0)
      })
      chinaProvincesLayer?.eachLayer((layer) => {
        if ('setOpacity' in layer) (layer as import('leaflet').Path).setOpacity(0.15)
      })
    }
    else {
      hubeiCitiesLayer?.eachLayer((layer) => {
        if ('setOpacity' in layer) (layer as import('leaflet').Path).setOpacity(1)
      })
      chinaProvincesLayer?.eachLayer((layer) => {
        if ('setOpacity' in layer) (layer as import('leaflet').Path).setOpacity(0.85)
      })

      cityPathsByAdcode.forEach((paths, adcode) => {
        const feat = cityFeatureByAdcode.get(adcode)
        if (!feat) return
        const style = getCityStyle(feat, false, blurFocusMode)
        paths.forEach(p => p.setStyle(style))
      })
      provincePathsByName.forEach((paths, name) => {
        const feat = provinceFeatureByName.get(name)
        if (!feat) return
        const style = getProvinceStyle(feat, false, blurFocusMode)
        paths.forEach(p => p.setStyle(style))
      })
    }

    const zoneStyle = getZoneStyle(false, blurFocusMode)
    zonePaths.forEach(p => p.setStyle(zoneStyle))
    zoneLayer?.bringToFront()
  }

  function boundsForFeature(feature: GeoJSON.Feature): import('leaflet').LatLngBounds | null {
    if (!L) return null
    const tmp = L.geoJSON(feature)
    const bounds = tmp.getBounds()
    tmp.remove()
    return bounds.isValid() ? bounds : null
  }

  function scheduleBlurSync() {
    if (!map) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => syncBlurOverlay?.())
    })
  }

  function flyToFeatureBounds(
    bounds: import('leaflet').LatLngBounds | null,
    maxZoom: number,
    duration = 0.6,
    padding: [number, number] = [48, 48],
  ) {
    if (!map || !bounds?.isValid()) return
    if (duration > 0) map.once('moveend', () => scheduleBlurSync())
    else requestAnimationFrame(() => syncBlurOverlay?.())
    map.fitBounds(bounds, { padding, maxZoom, duration })
  }

  function flyToCity(feature: GeoJSON.Feature) {
    const name = feature.properties?.name as string
    const maxZoom = name === HIGHLIGHT_CITY ? WUHAN_FIT_MAX_ZOOM : 9
    flyToFeatureBounds(boundsForFeature(feature), maxZoom)
  }

  function flyToZone() {
    quickView.value = 'zone'
    setBlurFocus('zone')
    flyToFeatureBounds(zoneBounds, 13)
  }

  function getBlurHoleRings(): number[][][] {
    // zone 模式：只保留高新区高亮，其他全部模糊
    if (blurFocusMode === 'zone') {
      return zoneFeatures
        .filter(f => f.geometry)
        .flatMap(f => outerRingsFromGeometry(f.geometry!))
    }
    // 其他模式：保留武汉市高亮，武汉市外全部模糊
    return wuhanFeatureStored?.geometry
      ? outerRingsFromGeometry(wuhanFeatureStored.geometry)
      : []
  }

  function setBlurFocus(mode: BlurFocusMode, cityFeature?: GeoJSON.Feature) {
    blurFocusMode = mode
    if (mode === 'city' && cityFeature) focusedCityFeature = cityFeature
    else if (mode !== 'city') focusedCityFeature = null
    clearRegionHover()
    applyFocusVisuals()
    scheduleBlurSync()
  }

  function clearRegionHover() {
    if (hoveredRegion === 'zone') {
      zonePaths.forEach(p => p.setStyle(getZoneStyle(false, blurFocusMode)))
    }
    else if (hoveredRegion?.startsWith('city-')) {
      const adcode = Number(hoveredRegion.slice(5))
      const paths = cityPathsByAdcode.get(adcode) ?? []
      const feat = cityFeatureByAdcode.get(adcode)
      if (feat) paths.forEach(p => p.setStyle(getCityStyle(feat, false, blurFocusMode)))
    }
    else if (hoveredRegion?.startsWith('province-')) {
      const name = hoveredRegion.slice(9)
      const paths = provincePathsByName.get(name) ?? []
      const feat = provinceFeatureByName.get(name)
      if (feat) paths.forEach(p => p.setStyle(getProvinceStyle(feat, false, blurFocusMode)))
    }
    hoveredRegion = null
    if (map) map.getContainer().style.cursor = ''
    if (regionHoverTooltip && map) {
      map.removeLayer(regionHoverTooltip)
      regionHoverTooltip = null
    }
  }

  function showRegionTooltip(label: string, latlng: import('leaflet').LatLng) {
    if (!map || !L) return
    if (regionHoverTooltip) {
      regionHoverTooltip.setLatLng(latlng).setContent(label)
      return
    }
    regionHoverTooltip = L.tooltip({
      direction: 'top',
      offset: [0, -8],
      className: 'gs-city-tooltip',
      sticky: true,
      permanent: false,
    })
      .setLatLng(latlng)
      .setContent(label)
      .addTo(map)
  }

  function setZoneHover(latlng: import('leaflet').LatLng) {
    if (hoveredRegion === 'zone') {
      regionHoverTooltip?.setLatLng(latlng)
      return
    }
    clearRegionHover()
    hoveredRegion = 'zone'
    const hoverStyle = getZoneStyle(true, blurFocusMode)
    zonePaths.forEach((p) => {
      p.setStyle(hoverStyle)
      p.bringToFront()
    })
    zoneLayer?.bringToFront()
    if (map) map.getContainer().style.cursor = 'pointer'
    showRegionTooltip(ZONE_LABEL, latlng)
  }

  function setCityHover(feature: GeoJSON.Feature, latlng: import('leaflet').LatLng) {
    if (blurFocusMode === 'zone' || isInZone(latlng)) return
    const adcode = feature.properties?.adcode as number
    const regionKey = `city-${adcode}`
    if (!adcode) return
    if (hoveredRegion === regionKey) {
      regionHoverTooltip?.setLatLng(latlng)
      return
    }
    clearRegionHover()
    hoveredRegion = regionKey
    const paths = cityPathsByAdcode.get(adcode) ?? []
    const hoverStyle = getCityStyle(feature, true, blurFocusMode)
    paths.forEach((p) => {
      p.setStyle(hoverStyle)
      p.bringToFront()
    })
    hubeiCitiesLayer?.bringToFront()
    zoneLayer?.bringToFront()
    if (map) map.getContainer().style.cursor = 'pointer'
    const name = feature.properties?.name as string
    if (name) showRegionTooltip(name, latlng)
  }

  function setProvinceHover(feature: GeoJSON.Feature, latlng: import('leaflet').LatLng) {
    const name = feature.properties?.name as string
    if (!name) return
    const regionKey = `province-${name}`
    if (hoveredRegion === regionKey) {
      regionHoverTooltip?.setLatLng(latlng)
      return
    }
    clearRegionHover()
    hoveredRegion = regionKey
    const paths = provincePathsByName.get(name) ?? []
    const hoverStyle = getProvinceStyle(feature, true, blurFocusMode)
    paths.forEach((p) => {
      p.setStyle(hoverStyle)
      p.bringToFront()
    })
    chinaProvincesLayer?.bringToFront()
    if (map) map.getContainer().style.cursor = 'pointer'
    showRegionTooltip(name, latlng)
  }

  function focusZone() {
    flyToZone()
    onRegionSelect?.({ type: 'zone', name: ZONE_LABEL })
  }

  function handleRegionClick(latlng: import('leaflet').LatLng) {
    const target = findHoverTarget(latlng)
    if (target?.kind === 'zone') {
      focusZone()
      return
    }
    if (target?.kind === 'city') {
      const cityHit = target.feature
      const adcode = cityHit.properties?.adcode as number
      const name = cityHit.properties?.name as string
      if (!adcode || !name) return
      if (name === HIGHLIGHT_CITY) {
        quickView.value = 'wuhan'
        setBlurFocus('wuhan')
      }
      else {
        quickView.value = null
        setBlurFocus('city', cityHit)
      }
      flyToCity(cityHit)
      onRegionSelect?.({ type: 'city', name, adcode })
    }
  }

  function setupRegionHover(mapInstance: import('leaflet').Map) {
    mapInstance.on('mousemove', (e) => {
      const target = findHoverTarget(e.latlng)
      if (target?.kind === 'zone') setZoneHover(e.latlng)
      else if (target?.kind === 'city') setCityHover(target.feature, e.latlng)
      else if (target?.kind === 'province') setProvinceHover(target.feature, e.latlng)
      else clearRegionHover()
    })
    mapInstance.on('mouseout', clearRegionHover)
    mapInstance.on('click', (e) => {
      handleRegionClick(e.latlng)
    })
    mapInstance.on('dblclick', (e) => {
      if (!isInZone(e.latlng)) return
      L!.DomEvent.stopPropagation(e)
      focusZone()
    })
  }

  function setupBlurOverlay(mapInstance: import('leaflet').Map) {
    const mapEl = mapInstance.getContainer()
    const wrap = mapEl.parentElement
    if (!wrap) return

    blurOverlayEl = document.createElement('div')
    blurOverlayEl.className = 'gs-outside-blur'
    blurOverlayEl.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
    wrap.appendChild(blurOverlayEl)

    syncBlurOverlay = () => {
      if (!blurOverlayEl || !map) return
      const size = map.getSize()
      if (!size.x || !size.y) return

      const holeRings = getBlurHoleRings()
      if (!holeRings.length) {
        blurOverlayEl.style.maskImage = 'none'
        blurOverlayEl.style.webkitMaskImage = 'none'
        return
      }

      const outer = `M 0 0 H ${size.x} V ${size.y} H 0 Z`
      const holes = holeRings.map((ring) => {
        const pts = ring.map(([lng, lat]) => {
          const p = map!.latLngToContainerPoint([lat, lng])
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
        })
        return `M ${pts.join(' L ')} Z`
      }).join(' ')

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.x}" height="${size.y}"><path fill="white" fill-rule="evenodd" d="${outer} ${holes}"/></svg>`
      const maskUrl = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
      blurOverlayEl.style.maskImage = maskUrl
      blurOverlayEl.style.webkitMaskImage = maskUrl
      blurOverlayEl.style.maskSize = '100% 100%'
    }

    syncBlurOverlay()
    const onMapViewChange = () => scheduleBlurSync()
    mapInstance.on('move zoom zoomend resize viewreset moveend', onMapViewChange)

    blurResizeObserver = new ResizeObserver(() => {
      mapInstance.invalidateSize({ animate: false })
      scheduleBlurSync()
    })
    blurResizeObserver.observe(mapEl)
    blurResizeObserver.observe(wrap)

    const teardownMapListeners = () => {
      mapInstance.off('move zoom zoomend resize viewreset moveend', onMapViewChange)
    }
    ;(mapInstance as any)._gsBlurTeardown = teardownMapListeners
  }

  function teardownOutsideBlur() {
    if (map && (map as any)._gsBlurTeardown) {
      ;(map as any)._gsBlurTeardown()
      delete (map as any)._gsBlurTeardown
    }
    blurResizeObserver?.disconnect()
    blurResizeObserver = null
    blurOverlayEl?.remove()
    blurOverlayEl = null
    syncBlurOverlay = null
  }

  function refreshMarkers(companies: CompanyRecord[]) {
    if (!map || !markerLayer || !L || !clusterLayer) return
    markerLayer.clearLayers()
    clusterLayer.clearLayers()

    const zoom = map.getZoom()
    const clusterThreshold = 11

    if (zoom < clusterThreshold) {
      // 缩小模式：按网格聚合显示气泡
      const gridSize = 0.02 // 约2km网格
      const grid = new Map<string, { lat: number, lng: number, count: number }>()

      companies.forEach((c) => {
        const gridX = Math.floor(c.company_longitude / gridSize)
        const gridY = Math.floor(c.company_latitude / gridSize)
        const key = `${gridX},${gridY}`
        const existing = grid.get(key)
        if (existing) {
          existing.count++
          existing.lat = (existing.lat * (existing.count - 1) + c.company_latitude) / existing.count
          existing.lng = (existing.lng * (existing.count - 1) + c.company_longitude) / existing.count
        } else {
          grid.set(key, { lat: c.company_latitude, lng: c.company_longitude, count: 1 })
        }
      })

      grid.forEach((cell) => {
        if (cell.count >= 1) {
          const marker = L.marker([cell.lat, cell.lng], {
            icon: makeClusterIcon(L, cell.count),
          })
          marker.bindTooltip(`${cell.count} 家企业`, { direction: 'top' })
          clusterLayer!.addLayer(marker)
        }
      })
    } else {
      // 正常模式：显示单个企业点
      companies.forEach((c) => {
        const color = c.company_traded === 1 ? '#ef4444' : '#10b981'
        const marker = L.marker([c.company_latitude, c.company_longitude], {
          icon: makeCompanyIcon(L, color),
        })
        marker.bindTooltip(c.company_name, { direction: 'top' })
        marker.on('click', (e) => {
          L!.DomEvent.stopPropagation(e)
          onCompanyClick?.(c)
        })
        markerLayer!.addLayer(marker)
      })
    }
  }

  async function initMap(
    companies: CompanyRecord[],
    handlers?: {
      onCompany?: (c: CompanyRecord) => void
      onRegion?: (payload: RegionSelectPayload) => void
    },
  ): Promise<CompanyRecord[]> {
    onCompanyClick = handlers?.onCompany
    onRegionSelect = handlers?.onRegion

    const [leaflet, region, zone, hubeiCities] = await Promise.all([
      import('leaflet'),
      $fetch<any>('/geo/region.json'),
      $fetch<GeoJSON.FeatureCollection>('/geo/高新区范围_wgs84.json'),
      $fetch<any>('/geo/hubei-cities.json'),
    ])

    await import('leaflet/dist/leaflet.css')

    L = leaflet
    const zoneCompanies = filterCompaniesInZone(companies, zone)

    if (!mapContainerRef.value) return []

    map = L.map(mapContainerRef.value, {
      center: [WUHAN_CENTER[0], WUHAN_CENTER[1]],
      zoom: WUHAN_ZOOM,
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: false,
    })

    L.tileLayer(
      'https://webrd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8',
      {
        subdomains: ['1', '2', '3', '4'],
        maxZoom: 18,
      },
    ).addTo(map)

    map.createPane('boundaryPane')
    const boundaryPane = map.getPane('boundaryPane')
    if (boundaryPane) boundaryPane.style.zIndex = '450'

    const hubeiFeature = region.features.find(
      (f: any) => f.properties?.name === HIGHLIGHT_PROVINCE,
    ) as GeoJSON.Feature | undefined

    const allCityFeatures = (hubeiCities as GeoJSON.FeatureCollection).features ?? []
    cityFeatures = allCityFeatures.filter(f => f.properties?.name === HIGHLIGHT_CITY)
    cityPathsByAdcode.clear()
    cityFeatureByAdcode.clear()

    hubeiFeatureStored = hubeiFeature ?? null

    const allProvinceFeatures = region.features as GeoJSON.Feature[]
    otherProvinceFeatures = allProvinceFeatures.filter(
      f => f.properties?.name !== HIGHLIGHT_PROVINCE,
    )
    provincePathsByName.clear()
    provinceFeatureByName.clear()

    setupBlurOverlay(map)

    chinaProvincesLayer = L.geoJSON(
      { type: 'FeatureCollection', features: allProvinceFeatures } as GeoJSON.FeatureCollection,
      {
        pane: 'boundaryPane',
        interactive: false,
        style: feature => getProvinceStyle(feature as GeoJSON.Feature, false, blurFocusMode),
        onEachFeature: (feature, layer) => {
          const feat = feature as GeoJSON.Feature
          const name = feat.properties?.name as string
          if (name) {
            provincePathsByName.set(name, collectPathsFromLayer(layer))
            provinceFeatureByName.set(name, feat)
          }
        },
      },
    ).addTo(map)

    hubeiCitiesLayer = L.geoJSON(
      { type: 'FeatureCollection', features: cityFeatures } as GeoJSON.FeatureCollection,
      {
        pane: 'boundaryPane',
        interactive: false,
        style: feature => getCityStyle(feature as GeoJSON.Feature, false, blurFocusMode),
        onEachFeature: (feature, layer) => {
          const feat = feature as GeoJSON.Feature
          const adcode = feat.properties?.adcode as number
          if (adcode) {
            cityPathsByAdcode.set(adcode, collectPathsFromLayer(layer))
            cityFeatureByAdcode.set(adcode, feat)
          }
        },
      },
    ).addTo(map)

    zoneFeatures = (zone as GeoJSON.FeatureCollection).features ?? []
    zonePaths.length = 0

    wuhanFeatureStored = cityFeatures.find(f => f.properties?.name === HIGHLIGHT_CITY) ?? null
    if (wuhanFeatureStored && L) {
      const tmp = L.geoJSON(wuhanFeatureStored)
      wuhanBounds = tmp.getBounds()
      tmp.remove()
    }

    zoneLayer = L.geoJSON(zone as any, {
      pane: 'boundaryPane',
      interactive: false,
      style: () => getZoneStyle(false, blurFocusMode),
      onEachFeature: (_feature, layer) => {
        zonePaths.push(...collectPathsFromLayer(layer))
      },
    }).addTo(map)

    zoneBounds = zoneLayer.getBounds()
    zoneLayer.bringToFront()
    hubeiCitiesLayer.bringToFront()

    setupRegionHover(map)

    markerLayer = L.layerGroup().addTo(map)
    clusterLayer = L.layerGroup().addTo(map)

    // 监听缩放事件，切换聚合/单点模式
    map.on('zoomend', () => {
      refreshMarkers(zoneCompanies)
    })

    refreshMarkers(zoneCompanies)

    setBlurFocus('wuhan')
    flyToWuhan(0)
    quickView.value = 'wuhan'

    mapReady.value = true
    setTimeout(() => {
      map?.invalidateSize({ animate: false })
    }, 100)
    requestAnimationFrame(() => scheduleBlurSync())

    return zoneCompanies
  }

  function destroyMap() {
    clearRegionHover()
    teardownOutsideBlur()
    map?.remove()
    map = null
    markerLayer = null
    clusterLayer = null
    chinaProvincesLayer = null
    hubeiCitiesLayer = null
    zoneLayer = null
    zoneBounds = null
    wuhanBounds = null
    cityFeatures = []
    zoneFeatures = []
    otherProvinceFeatures = []
    zonePaths.length = 0
    cityPathsByAdcode.clear()
    cityFeatureByAdcode.clear()
    provincePathsByName.clear()
    provinceFeatureByName.clear()
    hubeiFeatureStored = null
    wuhanFeatureStored = null
    focusedCityFeature = null
    blurFocusMode = 'wuhan'
    mapReady.value = false
  }

  function zoomIn() { map?.zoomIn() }
  function zoomOut() { map?.zoomOut() }

  function flyToWuhan(duration = 0.6) {
    if (wuhanBounds?.isValid()) {
      flyToFeatureBounds(wuhanBounds, WUHAN_FIT_MAX_ZOOM, duration, [28, 28])
    }
    else {
      if (map && duration > 0) map.once('moveend', () => scheduleBlurSync())
      map?.flyTo(WUHAN_CENTER, WUHAN_ZOOM, { duration })
    }
  }

  function resetView() {
    quickView.value = 'wuhan'
    setBlurFocus('wuhan')
    flyToWuhan()
  }

  function setQuickView(view: 'zone' | 'wuhan') {
    if (quickView.value === view) {
      quickView.value = 'wuhan'
      setBlurFocus('wuhan')
      flyToWuhan()
      return
    }
    if (view === 'zone') {
      focusZone()
    }
    else {
      quickView.value = 'wuhan'
      setBlurFocus('wuhan')
      flyToWuhan()
    }
  }

  function invalidateSize() {
    if (!map) return
    map.invalidateSize({ animate: false })
    scheduleBlurSync()
  }

  return {
    mapContainerRef,
    mapReady,
    quickView,
    initMap,
    destroyMap,
    zoomIn,
    zoomOut,
    resetView,
    setQuickView,
    invalidateSize,
  }
}
