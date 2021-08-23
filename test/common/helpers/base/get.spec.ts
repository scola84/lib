import { expect } from 'chai'
import { get } from '../../../../src/common/helpers/base/get'

describe('get', () => {
  describe('should return a value when', () => {
    it('the path exists', thePathExists)
  })

  describe('should return undefined when', () => {
    it('a leaf is undefined', aLeafIsUndefined)
    it('a node is undefined', aNodeIsUndefined)
    it('the object is not an object', theObjectIsNotAnObject)
  })
})

const object = {
  ab: {
    cd: {
      ef: [{
        gh: [{
          ij: 'ij'
        }]
      }]
    }
  }
}

function aLeafIsUndefined (): void {
  expect(get(object, 'ab.cd.ef[0].gh[0].kl')).equal(undefined)
}

function aNodeIsUndefined (): void {
  expect(get(object, 'ab.cd.ef[1].gh[0].ij')).equal(undefined)
}

function theObjectIsNotAnObject (): void {
  expect(get(null, 'ab.cd.ef[0].gh[0].ij')).equal(undefined)
}

function thePathExists (): void {
  expect(get(object, 'ab.cd.ef[0].gh[0].ij')).equal('ij')
}
