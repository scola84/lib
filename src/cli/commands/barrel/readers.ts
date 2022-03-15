import type { Struct } from '../../../common'
import { camelize } from './camelize'
import { readdirSync } from 'fs-extra'

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
          camelize(base)
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
          camelize(base)
        ]
      })
  }
}
