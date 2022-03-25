/* eslint-disable no-sparse-arrays */
import { expect } from 'chai'
import { set } from '../../../../src/common/helpers/set'

describe('set', () => {
  describe('should set a value on', () => {
    it('a struct', aStruct)
    it('an array', anArray)
  })

  describe('should not set a value on', () => {
    it('a wrong path', aWrongPath)
  })
})

function aStruct (): void {
  const actual = {}
  const path = ['a', 0, 'b', 1, 'c']
  const value = 'scola'

  const expected = {
    a: [
      {
        b: [
          ,
          {
            c: 'scola'
          }
        ]
      }
    ]
  }

  set(actual, path, value)
  expect(actual).eql(expected)
}

function aWrongPath (): void {
  const path = ['a', 0, 'b', 1, 'c']
  const value = 'scola'

  const actual = {
    a: [
      {
        b: {
          c: 'c'
        }
      }
    ]
  }

  const expected = {
    a: [
      {
        b: {
          c: 'c'
        }
      }
    ]
  }

  set(actual, path, value)
  expect(actual).eql(expected)
}

function anArray (): void {
  const actual: unknown[] = []
  const path = [1, 'a', 'b', 1, 'c']
  const value = 'scola'

  const expected = [
    ,
    {
      a: {
        b: [
          ,
          {
            c: 'scola'
          }
        ]
      }
    }
  ]

  set(actual, path, value)
  expect(actual).eql(expected)
}
