/* eslint-disable no-sparse-arrays */
import { expect } from 'chai'
import { get } from '../../../../src/common/helpers/get'

describe('get', () => {
  describe('should get a value from', () => {
    it('a struct', aStruct)
    it('an array', anArray)
  })

  describe('should not get a value from', () => {
    it('a wrong path', aWrongPath)
  })
})

function aStruct (): void {
  const path = ['a', 0, 'b', 1, 'c']
  const expected = 'scola'

  const value = {
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

  expect(get(value, path)).eq(expected)
}

function aWrongPath (): void {
  const path = [1, 'a', 'b', 1, 'c']

  const value = {
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

  expect(get(value, path)).eq(undefined)
}

function anArray (): void {
  const path = [1, 'a', 'b', 1, 'c']
  const expected = 'scola'

  const value = [
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

  expect(get(value, path)).eq(expected)
}
