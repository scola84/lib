import { Primitive, isPrimitive } from './helpers/is-primitive'
import { Struct, isStruct } from './helpers/is-struct'
import { ScolaIntl } from './helpers/intl'
import { absorb } from './helpers/absorb'
import { cast } from './helpers/cast'
import { en } from './strings/en'
import { hyphenize } from './helpers/hyphenize'
import { isArray } from './helpers/is-array'
import { isDate } from './helpers/is-date'
import { isNil } from './helpers/is-nil'
import { isObject } from './helpers/is-object'
import { isSame } from './helpers/is-same'
import { nl } from './strings/nl'

export {
  Primitive,
  ScolaIntl,
  Struct,
  absorb,
  cast,
  hyphenize,
  isArray,
  isDate,
  isNil,
  isObject,
  isPrimitive,
  isSame,
  isStruct
}

export const strings = {
  en,
  nl
}
