import { Struct, isStruct } from '../../../../src/common/helpers/is-struct'
import { expect } from 'chai'

describe('isStruct', () => {
  describe('should return', () => {
    it('false for non-structs', falseForNonStructs)
    it('true for structs', trueForStructs)
    it('a struct from a query', aStructFromAQuery)
    it('a struct from json', aStructFromJson)
  })
})

class Foo {
  public bar: string
}

function falseForNonStructs (): void {
  expect(isStruct(undefined)).eq(false)
  expect(isStruct(null)).eq(false)
  expect(isStruct(BigInt(0))).eq(false)
  expect(isStruct(true)).eq(false)
  expect(isStruct(0)).eq(false)
  expect(isStruct('')).eq(false)
  expect(isStruct(Symbol(''))).eq(false)
  expect(isStruct([1, 2, 3])).eq(false)
  expect(isStruct(() => {})).eq(false)
  expect(isStruct(Math)).eq(false)
  expect(isStruct(new Foo())).eq(false)
  expect(Struct.isStruct({})).eq(false)
}

function trueForStructs (): void {
  expect(isStruct({})).eq(true)
  expect(isStruct({ 'constructor': {} })).eq(true)
  expect(isStruct({ 'foo': 'bar' })).eq(true)
  expect(isStruct(Object.create(null))).eq(true)
  expect(isStruct(Object.prototype)).eq(true)
  expect(Struct.isStruct(Struct.create())).eq(true)
}

function aStructFromAQuery (): void {
  const expectedNotNull = {
    a: {
      b: {
        c: 'c'
      }
    }
  }

  const expectedNull = {
    a: {
      b: {
        c: 'c'
      }
    },
    d: {
      e: {
        f: null
      }
    }
  }

  const string = 'a.b.c=c&d.e.f='
  const actualNotNull = Struct.fromQuery(string)
  const actualNull = Struct.fromQuery(string, true)

  expect(Struct.isStruct(actualNotNull)).eq(true)
  expect(actualNotNull).eql(expectedNotNull)
  expect(Struct.isStruct(actualNull)).eq(true)
  expect(actualNull).eql(expectedNull)
}

function aStructFromJson (): void {
  const expected = Struct.create({
    a: {
      b: {
        c: 'c'
      }
    }
  })

  const string = '{"a":{"b":{"c":"c"}}}'
  const actual = Struct.fromJson(string)

  expect(Struct.isStruct(actual)).eq(true)
  expect(actual).eql(expected)
}
