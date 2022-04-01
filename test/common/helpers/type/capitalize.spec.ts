import { capitalize } from '../../../../src/common/helpers/capitalize'
import { expect } from 'chai'

describe('capitalize', () => {
  it('should capitalize with first character to lower case', () => {
    expect(capitalize('lowerCase', true)).eq('lowerCase')
    expect(capitalize('LowerCase', true)).eq('lowerCase')
    expect(capitalize('lower.case', true)).eq('lowerCase')
    expect(capitalize('lower-case', true)).eq('lowerCase')
  })

  it('should capitalize with first character to upper case', () => {
    expect(capitalize('upperCase')).eq('UpperCase')
    expect(capitalize('UpperCase')).eq('UpperCase')
    expect(capitalize('upper.case')).eq('UpperCase')
    expect(capitalize('upper-case')).eq('UpperCase')
  })
})
