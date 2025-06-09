import { pathExists, readFile } from 'fs-extra'
import type { Plugin } from '../pluginContainer'
import type { ServerContext } from '../server'
import { cleanUrl, getShortName, removeImportQuery } from '../utils'

export function assetPlugin(): Plugin {
  let serverContext: ServerContext

  return {
    name: 'my-vite:asset',
    setServer(s: ServerContext) {
      serverContext = s
    },
    async load(id: string) {
      const cleanedId = removeImportQuery(cleanUrl(id))
      const resolvedId = `/${getShortName(id, serverContext.root)}`
      console.log('assets', resolvedId, cleanedId)

      // 这里仅处理 svg
      if (cleanedId.endsWith('.svg')) {
        return {
          code: `export default "${resolvedId}"`,
        }
      }
    },
  }
}
