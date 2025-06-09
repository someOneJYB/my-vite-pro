// 进行依赖的记录，当文件变动时，通知对应的模块进行更新
// 使用两个 set 结构记录使用的文件依赖
import type { PartialResolvedId, TransformResult } from 'rollup'
import { cleanUrl } from './utils'

export class ModuleNode {
  // 资源访问 url
  url: string
  // 资源绝对路径
  id: string | null = null
  // 导入此模块的所有父模块主要是在 importAnalize 进行传入 importers 初始化模块
  importers = new Set<ModuleNode>()
  // 此模块导入的所有子模块主要是在 importAnalize 进行传入 importedModule 初始化模块
  importedModules = new Set<ModuleNode>()
  // 使用了 transform 钩子转换后的 code 内容
  transformResult: TransformResult | null = null
  lastHMRTimestamp = 0
  constructor(url: string) {
    this.url = url
  }
}
export class ModuleGraph {
  // 映射字段
  urlToModuleMap = new Map<string, ModuleNode>()
  idToModuleMap = new Map<string, ModuleNode>()

  // 通过传递的 id 进行映射
  constructor(
    private resolveId: (url: string) => Promise<PartialResolvedId | null>
  ) {}
  getModuleById(id: string): ModuleNode | undefined {
    return this.idToModuleMap.get(id)
  }
  async getUrltoModule(rawUrl: string): Promise<ModuleNode | undefined> {
    // 注入文件的 rosolveId 的实例，里面可以获得模块内容
    const content = await this.getResolveIdInfo(rawUrl)
    if (typeof content === 'object' && content?.id) {
      // 如果有真实的 id 就进行处理
      const { id } = content
      return this.getModuleById(id)
    }
  }
  async ensureEntryFromUrl(url: string): Promise<ModuleNode | undefined> {
    // 确保入口文件存在
    let mod = await this.getUrltoModule(url)
    if (!mod) {
      const content = await this.getResolveIdInfo(url)
      // 不存在就创建
      mod = new ModuleNode(url)
      mod.id = url
      this.urlToModuleMap.set(url, mod)
      this.idToModuleMap.set(content?.id || url, mod)
    }
    return mod as ModuleNode
  }
  async getResolveIdInfo(url: string): Promise<PartialResolvedId | null> {
    // 利用插件钩子处理 import 的引入文件
    return this.resolveId(url)
  }
  // 更新模块主要是在 analize 插件中增加了 importers 和 importedModules 的链接关联，包括二者的联系
  async updateModule(
    mod: ModuleNode,
    // mod 引入的模块
    importedModules: Set<string | ModuleNode>
  ) {
    const preDeps = mod.importedModules
    for (const curImports of importedModules) {
      const dep =
        typeof curImports === 'string'
          ? await this.ensureEntryFromUrl(cleanUrl(curImports))
          : curImports
      if (dep) {
        // mod 依赖的模块
        mod.importedModules.add(dep)
        // 依赖的父亲模块
        dep.importers.add(mod)
      }
    }
    // 引用 mod 的模块
    for (const preDepModule of preDeps) {
      const url = preDepModule.url
      // mod 不依赖的就要去掉
      if (!importedModules.has(url)) {
        // 因为 mod 不再依赖这个模块所以我的父模块中不再包含 mod
        preDepModule.importers.delete(mod)
      }
    }
  }
  // 模块失效处理
  invalidateModule(id: string) {
    const mod = this.idToModuleMap.get(id)
    if (mod) {
      mod.lastHMRTimestamp = Date.now()
      mod.transformResult = null
      // 父亲模块中不需要引入这个了，把父亲模块也处理成失效重新初始化
      mod.importers.forEach((importer) => {
        // ！非空断言操作符
        this.invalidateModule(importer.id!)
      })
    }
  }
}
