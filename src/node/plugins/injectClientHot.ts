import { CLIENT_PUBLIC_PATH, HOTPORT } from '../constants'
import type { Plugin } from '../pluginContainer'
import fs from 'fs-extra'
import path from 'path'
import type { ServerContext } from '../server/index'

export function clientInjectPlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'my-vite:client-inject',
    setServer(s) {
      serverContext = s
    },
    resolveId(id) {
      if (id === CLIENT_PUBLIC_PATH) {
        return { id }
      }
      return null
    },
    async load(id) {
      if (id === CLIENT_PUBLIC_PATH) {
        const realPath = path.join(
          serverContext.root,
          'node_modules',
          'my-vite',
          'dist',
          'client.mjs'
        )
        const code = await fs.readFile(realPath, 'utf-8')
        return {
          code: code.replace('__HMR_PORT__', JSON.stringify(HOTPORT)),
        }
      }
    },
    transformIndexHtml(raw) {
      return raw.replace(
        /(<head[^>]*>)/i,
        `$1<script type="module" src="${CLIENT_PUBLIC_PATH}"></script>`
      )
    },
  }
}
