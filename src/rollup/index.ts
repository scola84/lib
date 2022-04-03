import { cli, client, rollup, server, worker } from './configs'
import { existsSync } from 'fs-extra'

const configs = []

if (existsSync('src/client/index.ts')) {
  configs.push(client())
}

if (existsSync('src/server/index.ts')) {
  configs.push(server())
}

if (existsSync('src/worker/index.ts')) {
  configs.push(worker())
}

if (existsSync('src/cli/index.ts')) {
  configs.push(cli())
}

if (existsSync('src/rollup/index.ts')) {
  configs.push(rollup())
}

export default configs
