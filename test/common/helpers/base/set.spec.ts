import { expect } from 'chai'
import { get } from '../../../../src/common/helpers/base/get'
import { set } from '../../../../src/common/helpers/base/set'

describe('set', () => {
  describe('should', () => {
    it('set a value', setAValue)
  })
})

const object = {
  ab: {}
}

function setAValue (): void {
  set(null, 'ab.cd.ef[0].gh[0].ij', 'ij')
  set(object, 'ab.cd.ef[0].gh[0].ij', 'ij')
  expect(get(object, 'ab.cd.ef[0].gh[0].ij')).equal('ij')
}
