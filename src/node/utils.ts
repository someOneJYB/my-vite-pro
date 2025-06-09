import path from 'path'
import os from 'os'
import {
  HASH_REG,
  QEURY_REG,
  JS_TYPES_REG,
  CLIENT_PUBLIC_PATH,
} from './constants'

export function getShortName(file: string, root: string): string {
  return file.startsWith(root + '/') ? path.posix.relative(root, file) : file
}

const INTERNAL_LIST = [CLIENT_PUBLIC_PATH, '/@react-refresh']

// 纯粹化 URL 路径
export const cleanUrl = (url: string): string =>
  url.replace(HASH_REG, '').replace(QEURY_REG, '')

export const isCSSType = (id: string): boolean => cleanUrl(id).endsWith('.css')

export const isJSType = (id: string): boolean => {
  id = cleanUrl(id)
  if (JS_TYPES_REG.test(id)) {
    return true
  }
  if (!path.extname(id) && !id.endsWith('/')) {
    return true
  }
  return false
}

// 静态资源引入模式，import logo from './logo.svg?import'
export function isImportRequest(url: string): boolean {
  return url.endsWith('?import')
}
// 资源的引入中如果使用 ？raw 就不再处理包含 data: 协议资源也不再处理，这个放在 assets 插件中处理

export function removeImportQuery(url: string): string {
  return url.replace(/\?import$/, '')
}

export function isInternalRequest(url: string): boolean {
  return INTERNAL_LIST.includes(url)
}
