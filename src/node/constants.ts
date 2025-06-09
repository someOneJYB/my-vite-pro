import path from 'path'
export const BARE_IMPORT_RE = /^[\w@][^:]/
export const EXTERNAL_TYPES = [
  'css',
  'less',
  'sass',
  'scss',
  'styl',
  'stylus',
  'pcss',
  'postcss',
  'vue',
  'svelte',
  'marko',
  'astro',
  'png',
  'jpe?g',
  'gif',
  'svg',
  'ico',
  'webp',
  'avif',
]
export const PRE_BUNDLE_DIR = path.join('node_modules', '.prebuild-vite')
// 是否是 js 类型
export const JS_TYPES_REG = /\.(?:j|t)sx?$|\.mjs$/
// 是否是 css 类型
export const CSS_TYPES_REG =
  /\.(?:css|less|sass|scss|styl|stylus|pcss|postcss)$/
// 处理倒入资源的路径
export const QEURY_REG = /\?.*$/s
export const HASH_REG = /#.*$/s
// 公共注入的 vite 客户端 js
export const CLIENT_PUBLIC_PATH = '/@vite/client'
export const HOTPORT = '37387'
// 处理的 js 文件类型
export const DEFAULT_EXTERSIONS = ['.tsx', '.ts', '.jsx', 'js']
