import { esbuildPlugin } from './esbuild'
import { resolvePlugin } from './resolve'
import { importAnalysisPlugin } from './import'
import type { Plugin } from '../pluginContainer'
import { cssPlugin } from './css'
import { assetPlugin } from './assets'
import { clientInjectPlugin } from './injectClientHot'
import { reactRefreshPlugin } from './reactRefresh'

export function resolvePlugins(): Plugin[] {
  return [
    clientInjectPlugin(),
    resolvePlugin(),
    esbuildPlugin(),
    reactRefreshPlugin(),
    importAnalysisPlugin(),
    cssPlugin(),
    assetPlugin(),
  ]
}
