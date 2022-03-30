import { expect } from 'chai'
import { merge } from '../../../../src/common/helpers/merge'

describe('merge', () => {
  describe('should merge', () => {
    it('structs', structs)
  })
})

function structs (): void {
  const expected = {
    a: {
      b: {
        c: 'c',
        d: 'd'
      }
    }
  }

  const actual = {}

  const first = {
    a: {
      b: {
        c: 'c'
      }
    }
  }

  const second = {
    a: {
      b: {
        d: 'd'
      }
    }
  }

  expect(merge(actual, first, second)).eql(expected)
}
