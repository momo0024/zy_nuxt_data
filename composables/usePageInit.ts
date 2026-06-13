/** 已初始化过的路由路径（标签未关闭前不重复请求） */
const initializedPaths = new Set<string>()

/** 关闭路由标签时调用，下次进入该页会重新请求 */
export function resetPageInit(path: string) {
  initializedPaths.delete(path)
}

/**
 * 页面数据初始化（所有 keepalive 页面统一使用）：
 * - 标签仍打开、在页面间切换：不重复请求
 * - 关闭标签后重新进入：会重新请求（default 布局 closeTab 会调用 resetPageInit）
 * - blank 布局子页（如企业详情）：在 onDeactivated 中调用 resetPageInit
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

  return { reset: () => resetPageInit(route.path) }
}
