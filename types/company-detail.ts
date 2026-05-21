import { request } from '~/utils/request'

/* ─────────────── 通用原始响应 ─────────────── */
interface RawDetailItem {
  company_credit_code: string
  info_type: number
  info_type_name: string
  info_txt: string
}

interface RawResponse {
  code: number
  msg: string
  data: RawDetailItem[]
}

function parseRaw<T>(res: RawResponse): T | null {
  if (res.code !== 0 || !res.data?.length) return null
  try {
    return JSON.parse(res.data[0].info_txt) as T
  } catch {
    return null
  }
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
  const res = await request.get<RawResponse['data']>('/company/shareholder/', {
    params: { code },
  })
  const raw = res.data as unknown as RawResponse
  const result: ShareholderParsed = { latest: null, ic: null, members: null }
  if (raw.code !== 0 || !raw.data?.length) return result

  for (const item of raw.data) {
    try {
      const parsed = JSON.parse(item.info_txt) as ShareholderTable
      if (item.info_type === 2) result.latest = parsed
      else if (item.info_type === 8) result.members = parsed
      // info_type 可能还有其他股东类型，这里统一处理
    } catch { /* ignore */ }
  }
  return result
}

/* ─────────────── 商标信息 ─────────────── */
export interface TrademarkTable {
  column: string[]
  data: string[][]
}

export async function fetchTrademarks(code: string): Promise<TrademarkTable | null> {
  const res = await request.get<RawResponse['data']>('/company/trademask/', {
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
  const res = await request.get<RawResponse['data']>('/company/vesion/', {
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
  const res = await request.get<RawResponse['data']>('/company/patent/', {
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
  const res = await request.get<RawResponse['data']>('/company/register/', {
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
