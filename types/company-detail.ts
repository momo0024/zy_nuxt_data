import { request } from '~/utils/request'

/* ─────────────── 通用原始响应 ─────────────── */
interface RawDetailItem {
  company_credit_code: string
  info_type: number
  info_type_name: string
  info_txt: string | Record<string, unknown>
}

interface RawResponse {
  code: number
  msg: string
  data: RawDetailItem[]
}

function parseInfoTxt<T>(raw: unknown): T | null {
  if (raw == null) return null
  if (typeof raw === 'object') return raw as T
  if (typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function parseRaw<T>(res: RawResponse): T | null {
  if (res.code !== 0 || !res.data?.length) return null
  return parseInfoTxt<T>(res.data[0].info_txt)
}

/* ─────────────── 股东信息 ─────────────── */
export interface ShareholderTable {
  column: string[]
  data: string[][]
}

export interface ShareholderParsed {
  latest: ShareholderTable | null
  ic: ShareholderTable | null
  members: ShareholderTable | null
}

export async function fetchShareholders(code: string): Promise<ShareholderParsed> {
  const res = await request.get<RawResponse['data']>('/company/shareholder', {
    params: { code },
  })
  const raw = res.data as unknown as RawResponse
  const result: ShareholderParsed = { latest: null, ic: null, members: null }
  if (raw.code !== 0 || !raw.data?.length) return result

  for (const item of raw.data) {
    const parsed = parseInfoTxt<ShareholderTable>(item.info_txt)
    if (!parsed) continue
    if (item.info_type === 2) result.latest = parsed
    else if (item.info_type === 8) result.members = parsed
    // info_type 可能还有其他股东类型，这里统一处理
  }
  return result
}

/* ─────────────── 商标信息 ─────────────── */
export interface TrademarkTable {
  column: string[]
  data: string[][]
}

export async function fetchTrademarks(code: string): Promise<TrademarkTable | null> {
  const res = await request.get<RawResponse['data']>('/company/trademask', {
    params: { code },
  })
  return parseRaw<TrademarkTable>(res.data as unknown as RawResponse)
}

/* ─────────────── 变更记录 ─────────────── */
export interface ChangeRecordTable {
  column: string[]
  data: string[][]
  count: number
}

export async function fetchChangeRecords(code: string): Promise<ChangeRecordTable | null> {
  const res = await request.get<RawResponse['data']>('/company/vesion', {
    params: { code },
  })
  return parseRaw<ChangeRecordTable>(res.data as unknown as RawResponse)
}

/* ─────────────── 专利信息 ─────────────── */
export interface PatentTable {
  column: string[]
  data: string[][]
}

export async function fetchPatents(code: string): Promise<PatentTable | null> {
  const res = await request.get<RawResponse['data']>('/company/patent', {
    params: { code },
  })
  return parseRaw<PatentTable>(res.data as unknown as RawResponse)
}

/* ─────────────── 工商信息 ─────────────── */
export interface RegisterItem {
  key: string
  value: string
}

export async function fetchRegisterInfo(code: string): Promise<RegisterItem[] | null> {
  const res = await request.get<RawResponse['data']>('/company/register', {
    params: { code },
  })
  return parseRaw<RegisterItem[]>(res.data as unknown as RawResponse)
}

/* ─────────────── 企业基本信息 ─────────────── */
export interface BasicInfoItem {
  key: string
  value: string
}

export async function fetchBasicInfo(code: string): Promise<BasicInfoItem[] | null> {
  const res = await request.get<RawResponse['data']>('/company/basic', {
    params: { code },
  })
  return parseRaw<BasicInfoItem[]>(res.data as unknown as RawResponse)
}

/* ─────────────── 荣誉资质/上榜榜单/政府奖励 ─────────────── */
export interface HonorTable {
  column: string[]
  data: string[][]
}

export interface HonorsParsed {
  honor: HonorTable | null       // info_type 9 荣誉资质
  ranking: HonorTable | null     // info_type 11 上榜榜单
  govAward: HonorTable | null    // info_type 12 政府奖励项目
}

export async function fetchHonors(code: string): Promise<HonorsParsed> {
  const res = await request.get<RawResponse['data']>('/company/honors', {
    params: { code },
  })
  const raw = res.data as unknown as RawResponse
  const result: HonorsParsed = { honor: null, ranking: null, govAward: null }
  if (raw.code !== 0 || !raw.data?.length) return result

  for (const item of raw.data) {
    const parsed = parseInfoTxt<HonorTable>(item.info_txt)
    if (!parsed) continue
    if (item.info_type === 9) result.honor = parsed
    else if (item.info_type === 11) result.ranking = parsed
    else if (item.info_type === 12) result.govAward = parsed
  }
  return result
}

/* ─────────────── 集成电路布图 ─────────────── */
export interface LayoutTable {
  column: string[]
  data: string[][]
}

export async function fetchLayout(code: string): Promise<LayoutTable | null> {
  const res = await request.get<RawResponse['data']>('/company/layout', {
    params: { code },
  })
  const raw = res.data as unknown as RawResponse
  if (raw.code !== 0 || !raw.data?.length) return null
  return parseInfoTxt<LayoutTable>(raw.data[0].info_txt)
}

/* ─────────────── 对外投资 & 融资历程 ─────────────── */
export interface FinanceTable {
  column: string[]
  data: string[][]
}

export interface FinanceParsed {
  investment: FinanceTable | null // info_type 17 对外投资
  financing: FinanceTable | null  // info_type 18 融资历程
}

export async function fetchFinance(code: string): Promise<FinanceParsed> {
  const res = await request.get<RawResponse['data']>('/company/finace', {
    params: { code },
  })
  const raw = res.data as unknown as RawResponse
  const result: FinanceParsed = { investment: null, financing: null }
  if (raw.code !== 0 || !raw.data?.length) return result

  for (const item of raw.data) {
    const parsed = parseInfoTxt<FinanceTable>(item.info_txt)
    if (!parsed) continue
    if (item.info_type === 17) result.investment = parsed
    else if (item.info_type === 18) result.financing = parsed
  }
  return result
}

/* ─────────────── 实际控制企业 ─────────────── */
export interface ControlTable {
  column: string[]
  data: string[][]
}

export async function fetchControl(code: string): Promise<ControlTable | null> {
  const res = await request.get<RawResponse['data']>('/company/control', {
    params: { code },
  })
  return parseRaw<ControlTable>(res.data as unknown as RawResponse)
}

/* ─────────────── 主营产品 & 旗下品牌 ─────────────── */
export interface ProductTable {
  column: string[]
  data: string[][]
}

export interface ProductParsed {
  mainProducts: ProductTable | null // info_type 100 主营产品
  brands: ProductTable | null       // info_type 101 旗下品牌
}

export async function fetchProduct(code: string): Promise<ProductParsed> {
  const res = await request.get<RawResponse['data']>('/company/product', {
    params: { code },
  })
  const raw = res.data as unknown as RawResponse
  const result: ProductParsed = { mainProducts: null, brands: null }
  if (raw.code !== 0 || !raw.data?.length) return result

  for (const item of raw.data) {
    const parsed = parseInfoTxt<ProductTable>(item.info_txt)
    if (!parsed) continue
    if (item.info_type === 100) result.mainProducts = parsed
    else if (item.info_type === 101) result.brands = parsed
  }
  return result
}

/* ─────────────── 知识产权出质 ─────────────── */
export interface IntellectualTable {
  column: string[]
  data: string[][]
}

export async function fetchIntellectual(code: string): Promise<IntellectualTable | null> {
  const res = await request.get<RawResponse['data']>('/company/intellectual', {
    params: { code },
  })
  const raw = res.data as unknown as RawResponse
  if (raw.code !== 0 || !raw.data?.length) return null
  for (const item of raw.data) {
    if (item.info_type !== 19) continue
    const parsed = parseInfoTxt<IntellectualTable>(item.info_txt)
    if (parsed) return parsed
  }
  return null
}

/* ─────────────── 人员相关: 间接股东 / 社保人数 / 关联企业人员 ─────────────── */
export interface PeopleTable {
  column: string[]
  data: string[][]
}

export interface PeopleParsed {
  indirectShareholders: PeopleTable | null // info_type 92 间接股东
  socialSecurity: PeopleTable | null       // info_type 93 社保人数
  relatedEntities: PeopleTable | null      // info_type 94 关联企业/人员
}

export async function fetchPeople(code: string): Promise<PeopleParsed> {
  const res = await request.get<RawResponse['data']>('/company/people', {
    params: { code },
  })
  const raw = res.data as unknown as RawResponse
  const result: PeopleParsed = { indirectShareholders: null, socialSecurity: null, relatedEntities: null }
  if (raw.code !== 0 || !raw.data?.length) return result

  for (const item of raw.data) {
    const parsed = parseInfoTxt<PeopleTable>(item.info_txt)
    if (!parsed) continue
    if (item.info_type === 13 || item.info_type === 92) result.indirectShareholders = parsed
    else if (item.info_type === 14 || item.info_type === 93) result.socialSecurity = parsed
    else if (item.info_type === 15 || item.info_type === 94) result.relatedEntities = parsed
  }
  return result
}
