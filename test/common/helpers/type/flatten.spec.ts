import { expect } from 'chai'
import { flatten } from '../../../../src/common/helpers/flatten'

describe('flatten', () => {
  describe('should flatten', () => {
    it('a struct', aStruct)
  })
})

function aStruct (): void {
  const actual = {
    a: {
      b: {
        c: 'c'
      }
    },
    x: {
      y: {
        z: 'z'
      }
    }
  }

  const expected = {
    'a.b.c': 'c',
    'x.y.z': 'z'
  }

  expect(flatten(actual)).eql(expected)
}
