import type { CompanyRecord } from '~/types/company'

/**
 * AntV L7 地图封装：企业大屏专用
 * 使用 GaodeMap 底图 + 高新区边界 + 企业点图层
 */
export function useEnterpriseL7Map() {
  const config = useRuntimeConfig()
  const mapContainerRef = ref<HTMLDivElement>()
  const mapReady = ref(false)
  const hoveredCompany = ref<CompanyRecord | null>(null)

  let scene: any = null
  let pointLayer: any = null
  let boundaryLayer: any = null
  let boundaryLineLayer: any = null
  let highlightLayer: any = null

  const ZONE_CENTER: [number, number] = [114.475, 30.50]
  const ZONE_ZOOM = 12.5

  async function initMap(companies: CompanyRecord[], onCompanyClick: (c: CompanyRecord) => void, onCompanyHover: (c: CompanyRecord | null) => void) {
    if (!mapContainerRef.value) return
    mapReady.value = false

    try {
      const [{ Scene }, { GaodeMap }] = await Promise.all([
        import('@antv/l7'),
        import('@antv/l7-maps'),
      ])

      const amapKey = config.public.amapKey as string
      const securityCode = config.public.amapSecurityCode as string

      const mapInstance = new GaodeMap({
        center: ZONE_CENTER,
        zoom: ZONE_ZOOM,
        pitch: 38,
        rotation: -15,
        style: 'dark',
        ...(amapKey ? { key: amapKey } : {}),
        ...(securityCode ? { securityJsCode: securityCode } : {}),
        viewMode: '3D',
      })

      scene = new Scene({
        id: mapContainerRef.value,
        map: mapInstance,
        logoVisible: false,
      })

      scene.on('loaded', async () => {
        await loadBoundary()
        renderCompanies(companies, onCompanyClick, onCompanyHover)
        mapReady.value = true
      })
    } catch (e) {
      console.error('L7 地图初始化失败', e)
      mapReady.value = true
    }
  }

  async function loadBoundary() {
    if (!scene) return
    try {
      const [{ PolygonLayer, LineLayer }, geoData] = await Promise.all([
        import('@antv/l7'),
        fetch('/geo/高新区范围_gcj02.json').then(r => r.json()),
      ])

      // 面图层：高新区范围填充
      boundaryLayer = new PolygonLayer({ zIndex: 1 })
        .source(geoData)
        .shape('fill')
        .color('rgba(99, 102, 241, 0.08)')
        .style({ opacity: 1 })

      // 线图层：高新区边界发光
      boundaryLineLayer = new LineLayer({ zIndex: 2 })
        .source(geoData)
        .shape('line')
        .size(1.5)
        .color('#6366f1')
        .style({
          opacity: 0.7,
          lineType: 'solid',
        })

      scene.addLayer(boundaryLayer)
      scene.addLayer(boundaryLineLayer)
    } catch (e) {
      console.warn('加载高新区边界失败', e)
    }
  }

  function renderCompanies(
    companies: CompanyRecord[],
    onCompanyClick: (c: CompanyRecord) => void,
    onCompanyHover: (c: CompanyRecord | null) => void,
  ) {
    if (!scene) return

    // 清除旧图层
    if (pointLayer) {
      scene.removeLayer(pointLayer)
      pointLayer = null
    }
    if (highlightLayer) {
      scene.removeLayer(highlightLayer)
      highlightLayer = null
    }

    if (!companies.length) return

    const data = companies.map(c => ({
      ...c,
      lng: Number(c.company_longitude) || 114.42,
      lat: Number(c.company_latitude) || 30.49,
      color: industryColor(c),
      size: 8 + Math.min(scoreOf(c), 100) / 12,
    }))

    import('@antv/l7').then(({ PointLayer }) => {
      pointLayer = new PointLayer({ zIndex: 10 })
        .source(data, {
          parser: { type: 'json', x: 'lng', y: 'lat' },
        })
        .shape('circle')
        .size('size', (s: number) => s)
        .color('color')
        .style({
          opacity: 0.85,
          stroke: '#fff',
          strokeWidth: 0.5,
          offsets: [0, 0],
        })
        .active({ color: '#fbbf24', style: { opacity: 1 } })

      pointLayer.on('click', (e: any) => {
        const c = e.feature as CompanyRecord
        if (c) onCompanyClick(c)
      })

      pointLayer.on('mouseenter', (e: any) => {
        const c = e.feature as CompanyRecord
        if (c) {
          hoveredCompany.value = c
          onCompanyHover(c)
        }
      })

      pointLayer.on('mouseout', () => {
        hoveredCompany.value = null
        onCompanyHover(null)
      })

      scene.addLayer(pointLayer)
    })
  }

  function highlightCompany(company: CompanyRecord | null) {
    if (!scene) return
    if (highlightLayer) {
      scene.removeLayer(highlightLayer)
      highlightLayer = null
    }
    if (!company) return

    const lng = Number(company.company_longitude) || 114.42
    const lat = Number(company.company_latitude) || 30.49

    import('@antv/l7').then(({ PointLayer }) => {
      highlightLayer = new PointLayer({ zIndex: 20 })
        .source([{ ...company, lng, lat }], {
          parser: { type: 'json', x: 'lng', y: 'lat' },
        })
        .shape('circle')
        .size(22)
        .color('#fbbf24')
        .style({
          opacity: 0.3,
          stroke: '#fbbf24',
          strokeWidth: 2,
        })
        .animate({
          enable: true,
          type: 'ripple',
          speed: 0.5,
        })

      scene.addLayer(highlightLayer)
    })
  }

  function flyToCompany(company: CompanyRecord) {
    if (!scene) return
    const lng = Number(company.company_longitude) || 114.42
    const lat = Number(company.company_latitude) || 30.49
    scene.setCenter([lng, lat])
    scene.setZoom(14)
  }

  function updateCompanies(
    companies: CompanyRecord[],
    onCompanyClick: (c: CompanyRecord) => void,
    onCompanyHover: (c: CompanyRecord | null) => void,
  ) {
    renderCompanies(companies, onCompanyClick, onCompanyHover)
  }

  function destroyMap() {
    if (scene) {
      scene.destroy()
      scene = null
    }
  }

  function industryColor(company: CompanyRecord): string {
    const name = clean(company.chain_name) || clean(company.product_type) || clean(company.company_industry) || '综合服务'
    return colorForName(name)
  }

  function colorForName(name: string): string {
    const palette = ['#68e8d2', '#7dd3fc', '#f2c46d', '#f48fb1', '#a7f070', '#89a7ff', '#ff9f68', '#b6f3ff']
    let hash = 0
    for (const char of name) hash = (hash + char.charCodeAt(0)) % palette.length
    return palette[hash]
  }

  function scoreOf(company: CompanyRecord): number {
    return Number(company.company_score) || 60 + (patentCount(company) % 25)
  }

  function patentCount(company: CompanyRecord): number {
    return Number(company.authorized_patents_count || 0) + Number(company.authorized_invention_patents_count || 0)
  }

  function clean(value?: string | null): string {
    const text = String(value || '').trim()
    return text && text !== '-' ? text : ''
  }

  return {
    mapContainerRef,
    mapReady,
    hoveredCompany,
    initMap,
    updateCompanies,
    highlightCompany,
    flyToCompany,
    destroyMap,
  }
}
