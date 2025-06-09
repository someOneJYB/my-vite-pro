import type { Loader, Plugin } from 'esbuild'
import { init, parse } from 'es-module-lexer'
import fs from 'fs-extra'
import path from 'path'
import resolve from 'resolve'
import { BARE_IMPORT_RE } from '../constants'

export function prebuildPlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:prebuild',
    setup(build) {
      build.onResolve(
        {
          filter: BARE_IMPORT_RE,
        },
        (resolveInfo) => {
          const { path: id, importer } = resolveInfo
          const isEntry = !importer
          // entry-points 类型的文件就是引入其他依赖的文件，比如这里依赖的 react 就是一个 entry-points 类型的文件，是其他依赖的入口文件，打印之后 scheduler 这个包就是被 react 引用，所以这里处理的是所有依赖文件的入口文件
          // 这里我们只处理 entry-points 类型的文件，其他类型的文件我们不处理
          if (deps.has(id)) {
            // 依赖入口文件放在 namespace dep 下面
            return isEntry
              ? {
                  path: id,
                  namespace: 'dep',
                }
              : {
                  // 其他的依赖拼接 node_modules 路径，用于后续处理
                  path: resolve.sync(id, { basedir: process.cwd() }),
                }
          }
        }
      )

      build.onLoad(
        {
          filter: /.*/,
          namespace: 'dep',
        },
        async (args) => {
          await init
          // 获取要编译的文件，cjs 处理成 esm，如果是 esm 就直接导出，打包到 node_modules 下面的预编译目录
          const root = process.cwd()
          const dependencyEntryPath = resolve.sync(args.path, {
            basedir: root,
          })
          const code = await fs.readFile(dependencyEntryPath, 'utf-8')
          // 解析出依赖
          const [imports, exports] = await parse(code)
          const codeToEsm = []
          // cjs 处理成 esm
          if (!imports.length && !exports.length) {
            // {
            //   CAC: [class CAC extends EventEmitter],
            //   Command: [class Command],
            //   cac: [Function: cac],
            //   default: [Function: cac]
            // } require 出来的是一个对象，这里我们把对象的 key 作为导出的变量，value 作为导出的值，这样就可以在其他文件中 import { cac } from 'cac' 了
            const code = require(dependencyEntryPath)
            const specifiers = Object.keys(code)
            codeToEsm.push(
              `export { ${specifiers.join(',')} } from "${dependencyEntryPath}"`,
              `export default require("${dependencyEntryPath}")`
            )
          } else {
            if (exports.includes('default')) {
              codeToEsm.push(
                `import d from "${dependencyEntryPath}"`,
                `export default d`
              )
            }
            codeToEsm.push(`export * from "${dependencyEntryPath}"`)
          }
          const loader = path.extname(dependencyEntryPath).slice(1)
          // 因为在 esbuild 中当执行 esbuild.build 或 esbuild.transform 时：

          // esbuild 遍历入口文件及其依赖。
          // 对每个文件路径，执行所有插件的 onLoad 钩子（按注册顺序）。
          // 如果某个 onLoad 返回非 null，esbuild 使用其返回的内容，跳过默认的文件加载。
          // 如果没有插件处理，esbuild 读取磁盘文件。
          return {
            loader: loader as Loader,
            // 这个文件路径是十分关键的，build的时候 esbuild 要使用
            contents: codeToEsm.join('\n'),
            resolveDir: root,
          }
        }
      )
    },
  }
}
