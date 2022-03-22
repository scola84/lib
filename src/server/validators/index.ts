import { array } from './array'
import { checkbox } from './checkbox'
import { color } from './color'
import { date } from './date'
import { datetimeLocal } from './datetime-local'
import { email } from './email'
import { file } from './file'
import { max } from './max'
import { maxLength } from './max-length'
import { min } from './min'
import { minLength } from './min-length'
import { number } from './number'
import { pattern } from './pattern'
import { radio } from './radio'
import { range } from './range'
import { required } from './required'
import { select } from './select'
import { selectMultiple } from './select-multiple'
import { step } from './step'
import { struct } from './struct'
import { text } from './text'
import { textarea } from './textarea'
import { time } from './time'
import { url } from './url'

export const validators = {
  'array': array,
  'checkbox': checkbox,
  'color': color,
  'date': date,
  'datetime-local': datetimeLocal,
  'email': email,
  'file': file,
  'max': max,
  'max-length': maxLength,
  'min': min,
  'min-length': minLength,
  'number': number,
  'pattern': pattern,
  'radio': radio,
  'range': range,
  'required': required,
  'select': select,
  'select-multiple': selectMultiple,
  'step': step,
  'struct': struct,
  'text': text,
  'textarea': textarea,
  'time': time,
  'url': url
}
