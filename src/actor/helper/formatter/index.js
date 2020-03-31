import { DateFormatter } from './date.js'
import { FileFormatter } from './file.js'
import { MarkedFormatter } from './marked.js'
import { NumberFormatter } from './number.js'
import { StringFormatter } from './string.js'

export const formatter = {
  d: new DateFormatter(),
  f: new FileFormatter(),
  m: new MarkedFormatter(),
  n: new NumberFormatter(),
  s: new StringFormatter()
}
