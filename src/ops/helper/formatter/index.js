import { date } from './date.js'
import { file } from './file.js'
import { marked } from './marked.js'
import { number } from './number.js'
import { string } from './string.js'

export const formatter = {
  d: date,
  f: file,
  m: marked,
  n: number,
  s: string
}
