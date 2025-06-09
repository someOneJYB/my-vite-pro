// 注入 react-refresh 的运行时文件，放在 html 头部，支持 react 组件的热更新，检验注入的 refresh 文件，关联 react 更新和 accept 方法的注入，不需要手动写 accept 和 hot 等方法,把 react-refresh 的执行函数导出，并且
import path from 'path'
import fs from 'fs'
import { transformAsync } from '@babel/core'
import type { Plugin } from '../pluginContainer'
import { ServerContext } from '../server'
import { isJSType } from '../utils'

const runtimePublicPath = '/@react-refresh'
const refreshRuntimePath = path.resolve(
  __dirname,
  '..',
  'node_modules',
  'react-refresh/cjs/react-refresh-runtime.development.js'
)
const loadPath = path.resolve(
  __dirname,
  '..',
  'node_modules',
  'react-refresh/babel.js'
)

// 注入到头文件中 window 的变量
const headRefreshScript = `
import RefreshRuntime from "/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
`
// 真正执行 refresh 通知代码的逻辑
export const runtimeCode = `
const exports = {}
${fs.readFileSync(refreshRuntimePath, 'utf-8')}
function debounce(fn, delay) {
  let handle
  return () => {
    clearTimeout(handle)
    handle = setTimeout(fn, delay)
  }
}
exports.performReactRefresh = debounce(exports.performReactRefresh, 16)
export default exports
`
const registerCode = `
import RefreshRuntime from "${runtimePublicPath}";

let prevRefreshReg;
let prevRefreshSig;

if (import.meta.hot) {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    RefreshRuntime.register(type, __SOURCE__ + " " + id)
  };
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}`.replace(/[\n]+/gm, '')
const runtimeExcuteCode = `
if (import.meta.hot) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
  import.meta.hot.accept((mod) => console.log(mod, 'update'));
  if (!window.__vite_plugin_react_timeout) {
    window.__vite_plugin_react_timeout = setTimeout(() => {
      window.__vite_plugin_react_timeout = 0;
      RefreshRuntime.performReactRefresh();
    }, 30);
  }
}`

// 需要把 runtime 中的代码放到 exports 中，保证文件内容可以

export function reactRefreshPlugin(): Plugin {
  return {
    name: 'my-vite:react-refresh',
    resolveId(id) {
      if (id === runtimePublicPath) {
        return id
      }
      return null
    },
    async load(id) {
      if (id === runtimePublicPath) {
        return runtimeCode.replace(
          'process.env.NODE_ENV',
          JSON.stringify('development')
        )
      }
    },
    // tsx|jsx 注入 runtime 代码
    async transform(code, id) {
      // react-refresh 代码需要内置的 react-refresh 的 babel 处理
      if (isJSType(id) && !id.includes('node_modules')) {
        let plugin = (await import(loadPath)) as { default?: object }
        plugin = plugin?.default || plugin
        const transformedCode = await transformAsync(code, {
          plugins: [plugin],
        })
        // RefreshRuntime.register(type, __SOURCE__ + " " + id) 要去掉
        return {
          code:
            registerCode.replace('__SOURCE__', JSON.stringify(id)) +
            (transformedCode?.code || '') +
            runtimeExcuteCode,
        }
      }
    },
    transformIndexHtml(raw) {
      return raw.replace(
        /(<head[^>]*>)/i,
        `$1<script type="module">${headRefreshScript}</script>`
      )
    },
  }
}
