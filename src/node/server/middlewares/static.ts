// 返回静态资源
import type { NextHandleFunction } from 'connect'
import sirv from 'sirv'
import { CLIENT_PUBLIC_PATH } from '../../constants'
import { isImportRequest } from '../../utils'

export function staticMiddleware(root: string): NextHandleFunction {
  const serveFromRoot = sirv(root, { dev: true })
  return async (req, res, next) => {
    if (!req.url) {
      return
    }
    if (isImportRequest(req.url) || req.url === CLIENT_PUBLIC_PATH) {
      return
    }
    // 否则为静态资源返回处理
    serveFromRoot(req, res, next)
  }
}
