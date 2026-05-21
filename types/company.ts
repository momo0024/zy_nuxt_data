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

export async function fetchCompanies(page = 1, pageSize = 20): Promise<CompanyListResponse> {
  const res = await request.get<CompanyListResponse['data']>('/company', {
    params: { page, page_size: pageSize },
  })
  return res.data as unknown as CompanyListResponse
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
