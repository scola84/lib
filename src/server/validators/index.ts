import { array } from './array'
import { boolean } from './boolean'
import { checkbox } from './checkbox'
import { color } from './color'
import { date } from './date'
import { datetimeLocal } from './datetime-local'
import { email } from './email'
import { fieldset } from './fieldset'
import { file } from './file'
import { identity } from './identity'
import { max } from './max'
import { maxLength } from './max-length'
import { min } from './min'
import { minLength } from './min-length'
import { number } from './number'
import { operator } from './operator'
import { order } from './order'
import { password } from './password'
import { pattern } from './pattern'
import { radio } from './radio'
import { range } from './range'
import { required } from './required'
import { select } from './select'
import { selectMultiple } from './select-multiple'
import { step } from './step'
import { tel } from './tel'
import { text } from './text'
import { textarea } from './textarea'
import { time } from './time'
import { url } from './url'

export const validators = {
  'array': array,
  'boolean': boolean,
  'checkbox': checkbox,
  'color': color,
  'date': date,
  'datetime-local': datetimeLocal,
  'email': email,
  'fieldset': fieldset,
  'file': file,
  'identity': identity,
  'max': max,
  'max-length': maxLength,
  'min': min,
  'min-length': minLength,
  'number': number,
  'operator': operator,
  'order': order,
  'password': password,
  'pattern': pattern,
  'radio': radio,
  'range': range,
  'required': required,
  'select': select,
  'select-multiple': selectMultiple,
  'step': step,
  'tel': tel,
  'text': text,
  'textarea': textarea,
  'time': time,
  'url': url
}
