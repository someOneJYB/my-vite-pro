import type connect from 'connect'
import { red, blue, green } from 'picocolors'
import { WebSocketServer, WebSocket } from 'ws'
import path from 'path'
import { HOTPORT } from './constants'
import type { ServerContext } from './server/index'
import { getShortName } from './utils'

// 创建热更新通知接受服务器
export function createWebSocketServer(server: connect.Server): {
  send: (msg: string) => void
  close: () => void
} {
  let wss: WebSocketServer
  wss = new WebSocketServer({ port: +HOTPORT })
  wss.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'connected' }))
  })

  wss.on('error', (e: Error & { code: string }) => {
    if (e.code !== 'EADDRINUSE') {
      console.error(red(`WebSocket server error:\n${e.stack || e.message}`))
    }
  })

  return {
    send(payload: Object) {
      const stringified = JSON.stringify(payload)
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(stringified)
        }
      })
    },

    close() {
      wss.close()
    },
  }
}

// 当文件变动时更新通知
export function notifyHmrUpdate(serverContext: ServerContext): void {
  const { watcher, ws, root } = serverContext

  watcher.on('change', async (file) => {
    console.log(`✨${blue('[hmr]')} ${green(file)} changed`)
    const { moduleGraph } = serverContext
    await moduleGraph.invalidateModule(file)
    ws.send({
      type: 'update',
      updates: [
        {
          type: 'js-update',
          timestamp: Date.now(),
          path: '/' + getShortName(file, root),
          acceptedPath: '/' + getShortName(file, root),
        },
      ],
    })
    // 如果是配置更新或者 public 文件夹直接 full-reload
    console.log(file)
  })
}
