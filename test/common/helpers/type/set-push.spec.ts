import { expect } from 'chai'
import { setPush } from '../../../../src/common/helpers/set-push'

describe('setPush', () => {
  describe('should', () => {
    it('set an array when a name contains brackets', setAnArrayWhenANameContainsBrackets)
    it('transform a primitive to an array', transformAPrimitiveToAnArray)
  })
})

function setAnArrayWhenANameContainsBrackets (): void {
  const actual = {}

  setPush(actual, 'a.b[]', 'c')

  expect(actual).eql({
    a: {
      b: ['c']
    }
  })
}

function transformAPrimitiveToAnArray (): void {
  const actual = {}

  setPush(actual, 'a.b', 'c')

  expect(actual).eql({
    a: {
      b: 'c'
    }
  })

  setPush(actual, 'a.b', 'd')

  expect(actual).eql({
    a: {
      b: [
        'c',
        'd'
      ]
    }
  })
}
