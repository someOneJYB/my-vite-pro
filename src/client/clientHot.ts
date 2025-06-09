// 定义 hot accept 方法注入到每段代码的内部头部，支持代码在内部使用 import.meta.hot 使用形式
// 考虑在 js 中使用 hot 方法， module.hot.accept(["./thisModule.js"], hotUpdate);所以需要接受对应模块的更新操作，或者只有一个函数
// 接收 socket 传递的消息，用于更新 css 或者 js 传递给对应的进行热更新
interface Update {
  type: 'connected' | 'js-update' | 'css-update' | 'full-reload'
  path: string
  acceptedPath: string
  timestamp: number
}
// 创建 WebSocket 连接
const socket = new WebSocket('ws://localhost:37387')
// 监听 socket 的消息类型
socket.addEventListener('message', async ({ data }) => {
  const payload = JSON.parse(data)
  switch (payload.type) {
    case 'connected':
      console.log('socket connected')
      setInterval(() => socket.send('ping'), 800)
      break
    case 'update':
      payload.updates.forEach((update: Update) => {
        if (update.type === 'js-update') {
          console.log('js-update', update)
          // 获取对应模块更新 js 处理
          fetchUpdate(update).then((res) => res && res())
        }
      })
      break
    case 'full-reload':
      location.reload()
      break
  }
})
// 对应的模块的和更新时候的 callbacks
interface HotModule {
  id: string
  callbacks: HotCallback[]
}
// 为回调函数传递的参数
interface HotCallback {
  deps: string[]
  fn: (modules: object[]) => void
}
const hotModulesMap = new Map<string, HotModule>()
const pruneMap = new Map<string, (data: any) => void | Promise<void>>()
// 获取最新的 js
export async function fetchUpdate(info: Update) {
  const { path, timestamp } = info
  const mod = hotModulesMap.get(path)
  if (!mod) {
    return
  }
  const moduleMap = new Map()
  const modulesToUpdate = new Set<string>()
  modulesToUpdate.add(path)
  // 获取所有的更新模块，同时和更新后的操作
  await Promise.all(
    Array.from(modulesToUpdate).map(async (dep) => {
      const [path, query] = dep.split(`?`)
      try {
        const newMod = await import(
          path + `?t=${timestamp}${query ? `&${query}` : ''}`
        )
        moduleMap.set(dep, newMod)
      } catch (e) {}
    })
  )
  return () => {
    for (const { deps, fn } of mod.callbacks) {
      console.log(mod, 'mode')
      fn && fn(deps?.map((dep: any) => moduleMap.get(dep)))
    }
    console.log(`[vite] hot updated: ${path}`)
  }
}
// 注入每段代码中的 hot accept 逻辑
export const createHotContext = (path: string) => {
  const mod = hotModulesMap.get(path)
  if (mod) {
    mod.callbacks = []
  }
  function acceptDeps(args: HotCallback) {
    const mod = hotModulesMap.get(path) || {
      id: path,
      callbacks: [],
    }
    args && mod.callbacks.push(args)
    hotModulesMap.set(path, mod)
  }
  return {
    accept: (arg: HotCallback) => {
      console.log('accept', arg)
      acceptDeps(arg)
    },
    prune(cb: (data: any) => void) {
      pruneMap.set(path, cb)
    },
  }
}
// 更新 css 逻辑在 css 插件中注入处理
const sheetsMap = new Map()

export function updateStyle(id: string, content: string) {
  let style = sheetsMap.get(id)
  if (!style) {
    style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.innerHTML = content
    document.head.appendChild(style)
  } else {
    style.innerHTML = content
  }
  sheetsMap.set(id, style)
}

export function removeStyle(id: string): void {
  const style = sheetsMap.get(id)
  if (style) {
    document.head.removeChild(style)
  }
  sheetsMap.delete(id)
}
