import { cli, client, rollup, server, worker } from './configs'
import fs from 'fs'

const exports = []

if (fs.existsSync('src/cli/index.ts')) {
  exports.push(cli())
}

if (fs.existsSync('src/client/index.ts')) {
  exports.push(client())
}

if (fs.existsSync('src/rollup/index.ts')) {
  exports.push(rollup())
}

if (fs.existsSync('src/server/index.ts')) {
  exports.push(server())
}

if (fs.existsSync('src/worker/index.ts')) {
  exports.push(worker())
}

export default exports
