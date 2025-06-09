// 初始化服务器
// 初始化 socket
// 预编译 node_modules 下的文件
// 监听文件变化
// 初始化 plugin 和 moduleGraph
// 引入中间件处理器
// 启动服务
// connect 是一个具有中间件机制的轻量级 Node.js 框架。
// 既可以单独作为服务器，也可以接入到任何具有中间件机制的框架中，如 Koa、Express
import connect from 'connect'
import type { FSWatcher } from 'chokidar'
import chokidar from 'chokidar'
import { blue, green } from 'picocolors'
import { preBuild } from '../preBuild'
import { resolvePlugins } from '../plugins'
import type { PluginContainer, Plugin } from '../pluginContainer'
import { createPluginContainer } from '../pluginContainer'
import { createWebSocketServer, notifyHmrUpdate } from '../ws'
import { ModuleGraph } from '../moduleGraph'
import { indexHtmlMiddleware } from './middlewares/indexHtml'
import { transformMiddleware } from './middlewares/transformRollupHtml'
import { staticMiddleware } from './middlewares/static'

export interface ServerContext {
  root: string
  pluginContainer: PluginContainer
  app: connect.Server
  plugins: Plugin[]
  moduleGraph: ModuleGraph
  ws: { send: (data: any) => void; close: () => void }
  watcher: FSWatcher
}
export async function createServer(): Promise<undefined> {
  const app = connect()
  const root = process.cwd()
  const startTime = Date.now()
  const ws = createWebSocketServer(app)
  const moduleGraph = new ModuleGraph((url) => pluginContainer.resolveId(url))
  // 获取 plugins 插件
  const plugins = resolvePlugins() as Plugin[]
  // 把所有的插件都放在容器中管理，使用这个触发插件的生命周期，并且注入和 rollup 实例上下文
  const pluginContainer = createPluginContainer(plugins)
  // 设置 server config
  const watcher = chokidar.watch(root, {
    ignored: ['**/node_modules/**', '**/.git/**'],
    ignoreInitial: true,
  })
  const serverConfig: ServerContext = {
    app,
    root,
    plugins,
    pluginContainer,
    watcher,
    ws,
    moduleGraph,
  }
  for (const plugin of serverConfig.plugins) {
    // @ts-ignore
    if (plugin.setServer) {
      // 设置上下文在插件中获取并通知保证文件的及时更新
      // @ts-ignore
      await plugin.setServer(serverConfig)
    }
  }
  // 文件修改
  // 通知依赖修改，热更新通知等
  notifyHmrUpdate(serverConfig)
  // // 添加文件
  watcher.on('add', async (file) => {
    // 触发解析文件 resolveId 钩子
    const content = await pluginContainer.resolveId(file)
    // 通知moduleGraph 添加
    moduleGraph.ensureEntryFromUrl(content?.id || file)
  })
  // // 删除文件
  watcher.on('unlink', async (file) => {
    // 通知moduleGraph 删除
    moduleGraph.invalidateModule(file)
  })
  // 核心处理中间件
  app.use(transformMiddleware(serverConfig))

  // 入口 HTML 资源
  app.use(indexHtmlMiddleware(serverConfig))

  // 静态资源
  app.use(staticMiddleware(serverConfig.root))
  app.listen(3010, async () => {
    // 预构建
    await preBuild(root)
    console.log(
      green('🚀 No-Bundle 服务已经成功启动!'),
      `耗时: ${Date.now() - startTime}ms`
    )
    console.log(`> 本地访问路径: ${blue('http://localhost:3010')}`)
  })
}
