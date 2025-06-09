// 转换资源并注入核心 middleware，此处是模拟 rollup 的生命周期触发逻辑
import type { ServerContext } from '../../server'
import type { NextHandleFunction } from 'connect'
import type { TransformResult } from 'rollup'
import { isCSSType, isJSType, isImportRequest, cleanUrl } from '../../utils'
import createDebug from 'debug'

const debug = createDebug('dev')

async function transformAsRollupCon(
  url: string,
  serverContext: ServerContext
): Promise<string | undefined | TransformResult> {
  const { pluginContainer, moduleGraph } = serverContext
  const cleaningUrl = cleanUrl(url)
  let mod = await moduleGraph.getUrltoModule(cleaningUrl)
  if (mod && mod.transformResult) {
    return mod.transformResult
  }
  let result
  // 在依赖图中获取模块。有的话就直接返回，否则的话就创建，走插件处理逻辑
  const resolveId = await pluginContainer.resolveId(cleaningUrl)
  if (resolveId?.id) {
    // 加载模块内容,顺序执行直到返回非 null 值
    const loadContent = (await pluginContainer.load(resolveId.id)) as any
    let code = ''
    if (loadContent && loadContent?.code) {
      code = loadContent?.code as string
      if (code.indexOf('.svg') > -1) {
        console.log(code)
        console.log('is svg transform', resolveId, 'svg')
      }
      // 插件转化函数，同时新的添加到 moduleGraph 中，后续会重新调用此函数
      mod = moduleGraph.ensureEntryFromUrl(resolveId.id) as any
      const transformContent = await pluginContainer.transform(
        code,
        resolveId.id
      )
      if (code.indexOf('.svg') > -1) {
        console.log('is svg transform *****************')
        console.log(transformContent)
      }
      if (typeof transformContent === 'object' && transformContent) {
        result = transformContent.code
      }
      if (mod) {
        mod.transformResult = result
      }
      return result
    }
    if (typeof loadContent === 'string') {
      code = loadContent
      mod = moduleGraph.ensureEntryFromUrl(resolveId.id) as any
      const transformContent = await pluginContainer.transform(
        code,
        resolveId.id
      )
      if (typeof transformContent === 'object' && transformContent) {
        result = transformContent.code
      }
    }
  }
  if (mod) {
    mod.transformResult = result
  }
  return result
}
// rollup 类似的管理插件核心函数在此
// @ts-ignore
export function transformMiddleware(
  serverConfig: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    // 判断当前请求的文件 js css svg 等资源类型，处理路径，调用对应生命周期
    if (req.method !== 'GET' || !req.url) {
      return next()
    }
    const url = req.url as string
    debug('transformMiddleware: %s', url)
    // 插件可以处理的资源按顺序解析调用生命周期
    if (isCSSType(url) || isJSType(url) || isImportRequest(url)) {
      console.log('use rollup', url)
      const dealRes = await transformAsRollupCon(url, serverConfig)
      if (dealRes) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/javascript')
        return res.end(dealRes)
      }
    } else {
      return next()
    }
    next()
  }
}
