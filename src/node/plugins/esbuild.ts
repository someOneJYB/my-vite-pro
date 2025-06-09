import { readFile } from 'fs-extra'
import type { Plugin } from '../pluginContainer'
import { isJSType } from '../utils'
import esbuild from 'esbuild'
import path from 'path'

export function esbuildPlugin(): Plugin {
  return {
    name: 'my-vite:esbuild',
    // 加载模块
    async load(id: string) {
      if (isJSType(id)) {
        try {
          const code = await readFile(id, 'utf-8')
          return code
        } catch (e) {
          return null
        }
      }
    },
    async transform(code: string, id: string) {
      if (isJSType(id)) {
        const extname = path.extname(id).slice(1)
        const { code: transformedCode, map } = await esbuild.transform(code, {
          target: 'esnext',
          format: 'esm',
          sourcemap: true,
          loader: extname as 'js' | 'ts' | 'jsx' | 'tsx',
        })
        return {
          code: transformedCode,
          map,
        }
      }
      return null
    },
  }
}
