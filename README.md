
### my-vite

- server + socker 支持 hmr，chokidar 检测文件变动
  - client 文件注入客户端 socket + accept ｜ prune
- 支持预编译 node_modules 下的文件到 .prebuild-vite
- 支持继承 rollup 插件系统的插件管理系统， pluginContainer + 核心中间 transformRollupCon 模拟 rollup 行为
- 支持模块依赖关系处理 moduleGraph
- 插件系统支持
