export interface CompanyRecord {
  id: string
  company_name: string
  company_longitude: number
  company_latitude: number
  company_credit_code: string
  company_city: string
  conpany_district: string | null
  company_work_add: string | null
  info_type: number
  info_type_name: string
  company_legal_person: string
  company_registered_capital: string
  company_found_date: string
  company_business_status: string
  company_type: string
  company_industry: string
  company_business_scope: string
  company_phone: string
  company_website: string
  company_email: string
  company_traded: number
  product_type: string
  chain_name: string
  import_project: number
  company_source: number
  tag_name: string
  product: string
  honors: string
  contact_info: string
  honrs: string
  hornor_num: number
  val_org_type: string
  remark?: string | null
  above_scale?: number | null
  company_score: number
  latest_financing_date: string
  authorized_patents_count: number
  authorized_invention_patents_count: number
  national_standards_count: number
  participated_standards_count: number
  company_financing_round: string
  company_scale: string
  company_nature: string
}

export interface CompanyListResponse {
  code: number
  msg: string
  data: {
    total: number
    page: number
    page_size: number
    list: CompanyRecord[]
  }
}

import { request } from '~/utils/request'

export function isCreditCode(code: string) {
  return /^[0-9A-Z]{18}$/i.test(code)
}

/** 兼容地图页 name-lng 旧 id，从企业列表反查 */
export async function fetchCompanyByLegacyId(id: string): Promise<CompanyRecord | null> {
  const pageSize = 200
  for (let page = 1; page <= 10; page++) {
    const res = await fetchCompanies(page, pageSize)
    if (res.code !== 0 || !res.data?.list?.length) break
    const hit = res.data.list.find(
      c => c.company_credit_code === id || `${c.company_name}-${c.company_longitude}` === id,
    )
    if (hit) {
      return {
        ...hit,
        id: hit.company_credit_code || `${hit.company_name}-${hit.company_longitude}`,
      }
    }
    if (res.data.list.length < pageSize) break
  }
  return null
}

export async function fetchCompanies(page = 1, pageSize = 20): Promise<CompanyListResponse> {
  const res = await request.get<CompanyListResponse['data']>('/company', {
    params: { page, page_size: pageSize },
  })
  return res.data as unknown as CompanyListResponse
}

export async function fetchCompaniesByPark(parkId: number, page = 1, pageSize = 500): Promise<CompanyListResponse> {
  const res = await request.get<CompanyListResponse['data']>('/company', {
    params: { park_id: parkId, page, page_size: pageSize },
  })
  return res.data as unknown as CompanyListResponse
}

/** 按信用代码从 /company 接口查询单个企业（含新字段） */
export async function fetchCompanyByCode(code: string): Promise<CompanyRecord | null> {
  const res = await request.get<CompanyListResponse['data']>('/company', {
    params: { code },
  })
  const data = res.data as unknown as CompanyListResponse
  if (data.code !== 0 || !data.data?.list?.length) return null
  const hit = data.data.list[0]
  return { ...hit, id: hit.company_credit_code || `${hit.company_name}-${hit.company_longitude}` }
}

export function isListedCompany(company: CompanyRecord): boolean {
  return company.company_traded === 1
}

export function matchCompanySearch(company: CompanyRecord, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  return (
    company.company_name.toLowerCase().includes(q)
    || (company.company_credit_code || '').toLowerCase().includes(q)
    || (company.product_type || '').toLowerCase().includes(q)
    || (company.chain_name || '').toLowerCase().includes(q)
    || (company.product || '').toLowerCase().includes(q)
    || (company.conpany_district || '').toLowerCase().includes(q)
  )
}

export function filterCompaniesBySearch(
  companies: CompanyRecord[],
  query: string,
  limit = 8,
): CompanyRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const result: CompanyRecord[] = []
  for (const c of companies) {
    if (matchCompanySearch(c, q)) {
      result.push(c)
      if (result.length >= limit) break
    }
  }
  return result
}

export function getCompanyDisplayName(company: CompanyRecord): string {
  return company.company_name || '未知企业'
}

export function getCompanyIndustry(company: CompanyRecord): string {
  return company.product_type || company.company_industry || '未分类'
}

export function getCompanyChain(company: CompanyRecord): string {
  return company.chain_name || company.company_type || '未分类'
}
