// 返回 index.html
import type { NextHandleFunction } from 'connect'
import type { ServerContext } from '../index'
import path from 'path'
import { pathExists, readFile } from 'fs-extra'

export function indexHtmlMiddleware(
  serverConfig: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    const { root, pluginContainer, plugins } = serverConfig
    console.log(req, 'in index html')
    if (req.url === '/') {
      const filePath = path.resolve(root, 'index.html')
      if (await pathExists(filePath)) {
        let content = await readFile(filePath, 'utf-8')
        // 插件处理返回的 html
        for (let plugin of plugins) {
          // @ts-ignore
          if (plugin.transformIndexHtml) {
            // @ts-ignore 用于注入 hmr 在 html 中
            content = await plugin.transformIndexHtml(content)
          }
        }
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html')
        function addPublicToIconPath(html: string) {
          return html.replace(
            /(<link\s+rel="(?:icon|shortcut icon)"[^>]*href=")(?!\/public)(\/[^"]*\.(?:svg|ico|png))("[^>]*>)/gi,
            '$1/public$2$3'
          )
        }
        return res.end(addPublicToIconPath(content))
      }
    }
    return next()
  }
}
