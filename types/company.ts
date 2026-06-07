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
  product: string
  honors: string
  contact_info: string
  honrs: string
  hornor_num: number
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

/** 按信用代码从 /company 列表接口查询单个企业（含新字段） */
export async function fetchCompanyByCode(code: string): Promise<CompanyRecord | null> {
  const pageSize = 200
  for (let page = 1; page <= 10; page++) {
    const res = await fetchCompanies(page, pageSize)
    if (res.code !== 0 || !res.data?.list?.length) break
    const hit = res.data.list.find(c => c.company_credit_code === code)
    if (hit) {
      return { ...hit, id: hit.company_credit_code || `${hit.company_name}-${hit.company_longitude}` }
    }
    if (res.data.list.length < pageSize) break
  }
  return null
}

export function isListedCompany(company: CompanyRecord): boolean {
  return company.company_traded === 1
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
