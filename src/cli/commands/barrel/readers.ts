import { toCaps, toJoint } from '../../../common'
import type { Struct } from '../../../common'
import { sync as glob } from 'glob'

export const readers: Struct<((targetDir: string) => string[][]) | undefined> = {
  html: (targetDir: string) => {
    return glob(`${targetDir}/**/*.html`)
      .filter((file) => {
        return !file.endsWith('index.ts')
      })
      .map((file) => {
        const path = file.replace(targetDir, '')

        const name = toJoint(path.split('.')[0], {
          lower: false,
          separator: '-'
        })

        return [
          path,
          name,
          toCaps(name, {
            lcfirst: true
          })
        ]
      })
  },
  ts: (targetDir: string) => {
    return glob(`${targetDir}/**/*.ts`)
      .filter((file) => {
        return !file.endsWith('index.ts')
      })
      .map((file) => {
        const path = file
          .replace(targetDir, '')
          .replace('.ts', '')

        const name = toJoint(path, {
          lower: false,
          separator: '-'
        })

        return [
          path,
          name,
          toCaps(name, {
            lcfirst: true
          })
        ]
      })
  }
}
