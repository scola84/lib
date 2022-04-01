import { expect } from 'chai'
import { toCaps } from '../../../../src/common/helpers/to-caps'

describe('capitalize', () => {
  it('should capitalize with first character to lower case', () => {
    expect(toCaps('lowerCase', true)).eq('lowerCase')
    expect(toCaps('LowerCase', true)).eq('lowerCase')
    expect(toCaps('lower.case', true)).eq('lowerCase')
    expect(toCaps('lower-case', true)).eq('lowerCase')
  })

  it('should capitalize with first character to upper case', () => {
    expect(toCaps('upperCase')).eq('UpperCase')
    expect(toCaps('UpperCase')).eq('UpperCase')
    expect(toCaps('upper.case')).eq('UpperCase')
    expect(toCaps('upper-case')).eq('UpperCase')
  })
})
