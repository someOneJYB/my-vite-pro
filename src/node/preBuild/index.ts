// 因为 vite 是使用 esbuild 处理 node_modules 下的依赖，会进行预编译，而 esbuild 是使用 C++ 实现的，比 Node.js 快
// 需要引入的依赖
import { build } from 'esbuild'
import { green } from 'picocolors'
import path from 'path'
import { scanPlugin } from './scanPlugin'
import { prebuildPlugin } from './prebuildPlugin'
import { PRE_BUNDLE_DIR } from '../constants'

export async function preBuild(root: string) {
  // 1. 确定入口
  const entry = path.resolve(root, 'src/main.tsx')

  // 2. 从入口处扫描依赖
  const deps = new Set<string>()
  await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    plugins: [scanPlugin(deps)],
  })
  console.log(
    `${green('需要预构建的依赖')}:\n${[...deps]
      .map(green)
      .map((item) => `  ${item}`)
      .join('\n')}\n`
  )

  // // 3. 预构建依赖到类似 .vite 下面的目录
  await build({
    entryPoints: [...deps],
    write: true,
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: path.resolve(root, PRE_BUNDLE_DIR),
    plugins: [prebuildPlugin(deps)],
  })
}
