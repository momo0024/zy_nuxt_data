import { onActivated, onMounted, onUnmounted } from 'vue'

/** 已初始化过的路由路径（标签未关闭前不重复请求） */
const initializedPaths = new Set<string>()

/** 关闭路由标签时调用，下次进入该页会重新请求 */
export function resetPageInit(path: string) {
  initializedPaths.delete(path)
}

/**
 * 页面数据初始化（所有 keepalive 页面统一使用）：
 * - 同布局标签间切换：keepalive 缓存，不重复请求
 * - 关闭标签后重新进入：会重新请求（default 布局 closeTab 会调用 resetPageInit）
 * - 切到 blank 布局等导致组件真正销毁时：onUnmounted 清除标记，浏览器后退会重新请求
 */
export function usePageInit(init: () => void | Promise<void>) {
  const route = useRoute()

  const runInit = async () => {
    const path = route.path
    if (initializedPaths.has(path)) return
    initializedPaths.add(path)
    await init()
  }

  onMounted(runInit)
  onActivated(runInit)
  onUnmounted(() => resetPageInit(route.path))

  return { reset: () => resetPageInit(route.path) }
}

/** 登出时调用，清除所有初始化标记 */
export function clearPageInit() {
  initializedPaths.clear()
}