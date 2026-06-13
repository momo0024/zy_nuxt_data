import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

export interface ApiResponse<T = any> {
  code: number
  msg?: string
  message?: string
  data: T
}

export interface ApiClientOptions {
  /** 是否自动追加尾部斜杠（8096 企业接口需要；zy-news FastAPI 不需要） */
  trailingSlash?: boolean
}

function withTrailingSlash(url: string): string {
  const qIndex = url.indexOf('?')
  const path = qIndex === -1 ? url : url.slice(0, qIndex)
  const query = qIndex === -1 ? '' : url.slice(qIndex)
  if (path.endsWith('/')) return url
  return `${path}/${query}`
}

class Request {
  private instance!: AxiosInstance
  private _baseURL = ''
  private readonly trailingSlash: boolean

  constructor(options: ApiClientOptions = {}) {
    this.trailingSlash = options.trailingSlash ?? true
    this._createInstance()
  }

  private _createInstance() {
    this.instance = axios.create({
      baseURL: this._baseURL || undefined,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.instance.interceptors.request.use(
      (config) => {
        if (config.url && this.trailingSlash) {
          config.url = withTrailingSlash(config.url)
        }
        return config
      },
      error => Promise.reject(error),
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const res = response.data
        if (res?.code !== undefined && res.code !== 0) {
          console.error(`[API Error] ${res.msg || res.message || '请求失败'}`)
        }
        return response
      },
      (error) => {
        const message = error.response?.data?.msg
          || error.response?.data?.message
          || error.message
          || '网络请求失败'
        console.error(`[Network Error] ${message}`)
        return Promise.reject(error)
      },
    )
  }

  setBaseURL(baseURL: string) {
    if (this._baseURL === baseURL) return
    this._baseURL = baseURL
    this._createInstance()
  }

  get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.get<ApiResponse<T>>(url, config)
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.post<ApiResponse<T>>(url, data, config)
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.put<ApiResponse<T>>(url, data, config)
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.delete<ApiResponse<T>>(url, config)
  }
}

/** 企业地图、产业图谱等主后端（8096） */
export const request = new Request({ trailingSlash: true })

/** 新闻中心 zy-news 后端 */
export const newsRequest = new Request({ trailingSlash: false })
