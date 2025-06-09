import cac from 'cac'
import { createServer } from './server'

const cli = cac()

// 初始化脚手架命令 dev ｜ serve 命令
cli
  .command('[root]', '执行项目的开发命令')
  .alias('serve')
  .alias('dev')
  .action(async () => {
    // 执行 server 并进行中间处理文件信息
    console.log('cli启动~')
    await createServer()
  })

cli.help()

cli.parse()
