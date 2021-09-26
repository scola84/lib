import { cli, client, rollup, server, worker } from './configs'
import fs from 'fs'

const configs = []

if (fs.existsSync('src/cli/index.ts')) {
  configs.push(cli())
}

if (fs.existsSync('src/client/index.ts')) {
  configs.push(client())
}

if (fs.existsSync('src/rollup/index.ts')) {
  configs.push(rollup())
}

if (fs.existsSync('src/server/index.ts')) {
  configs.push(server())
}

if (fs.existsSync('src/worker/index.ts')) {
  configs.push(worker())
}

export default configs
