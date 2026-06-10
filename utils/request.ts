import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

const BACKEND_BASE = process.env.NUXT_PUBLIC_API_BASE || 'http://119.96.30.33:8096'

/** 客户端开发走 /api 代理；服务端 axios 必须用绝对地址 */
function resolveDefaultBase(): string {
  if (import.meta.server) return BACKEND_BASE
  return import.meta.dev ? '/api' : BACKEND_BASE
}

const DEFAULT_BASE = resolveDefaultBase()

/** 后端要求路径以 / 结尾，否则返回 301，浏览器会多记一条重定向请求 */
function withTrailingSlash(url: string): string {
  const qIndex = url.indexOf('?')
  const path = qIndex === -1 ? url : url.slice(0, qIndex)
  const query = qIndex === -1 ? '' : url.slice(qIndex)
  if (path.endsWith('/')) return url
  return `${path}/${query}`
}

interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

class Request {
  private instance!: AxiosInstance
  private _baseURL: string = DEFAULT_BASE
  private _initialized = false

  constructor() {
    this._createInstance()
  }

  private _createInstance() {
    this.instance = axios.create({
      baseURL: this._baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.instance.interceptors.request.use(
      (config) => {
        if (config.url) {
          config.url = withTrailingSlash(config.url)
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const res = response.data
        if (res.code !== 0) {
          console.error(`[API Error] ${res.msg || '请求失败'}`)
        }
        return response
      },
      (error) => {
        const message = error.response?.data?.msg || error.message || '网络请求失败'
        console.error(`[Network Error] ${message}`)
        return Promise.reject(error)
      },
    )
  }

  /**
   * 由 Nuxt 插件在客户端初始化时调用，传入 runtimeConfig 中的 apiBase
   */
  setBaseURL(baseURL: string) {
    if (this._initialized && this._baseURL === baseURL) return
    this._baseURL = baseURL
    this._createInstance()
    this._initialized = true
  }

  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.instance.get(url, config)
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.instance.post(url, data, config)
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.instance.put(url, data, config)
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.instance.delete(url, config)
  }
}

export const request = new Request()