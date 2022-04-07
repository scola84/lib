import type { Struct } from '../../../common'
import { readdirSync } from 'fs-extra'
import { toCaps } from '../../../common'

export const readers: Struct<((targetDir: string) => string[][]) | undefined> = {
  html: (targetDir: string) => {
    return readdirSync(targetDir)
      .filter((file) => {
        return file !== 'index.ts'
      })
      .map((file) => {
        const [base] = file.split('.')
        return [
          file,
          base,
          toCaps(base, {
            lcfirst: true
          })
        ]
      })
  },
  ts: (targetDir: string) => {
    return readdirSync(targetDir)
      .filter((file) => {
        return file !== 'index.ts'
      })
      .map((file) => {
        const [base] = file.split('.')
        return [
          base,
          base,
          toCaps(base, {
            lcfirst: true
          })
        ]
      })
  }
}
