import { expect } from 'chai'
import { rejoin } from '../../../../src/common/helpers/rejoin'

describe('rejoin', () => {
  it('should discard all special characters', () => {
    expect(rejoin(' ==rejoin  dots ==', '.')).eq('rejoin.dots')
  })

  it('should rejoin with default', () => {
    expect(rejoin('rejoinDots')).eq('rejoindots')
    expect(rejoin('RejoinDots')).eq('rejoindots')
    expect(rejoin('rejoin.dots')).eq('rejoindots')
    expect(rejoin('rejoin-dots')).eq('rejoindots')
  })

  it('should rejoin with hyphens', () => {
    expect(rejoin('rejoinDots', '-')).eq('rejoin-dots')
    expect(rejoin('RejoinDots', '-')).eq('rejoin-dots')
    expect(rejoin('rejoin.dots', '-')).eq('rejoin-dots')
    expect(rejoin('rejoin-dots', '-')).eq('rejoin-dots')
  })

  it('should rejoin with dots', () => {
    expect(rejoin('rejoinDots', '.')).eq('rejoin.dots')
    expect(rejoin('RejoinDots', '.')).eq('rejoin.dots')
    expect(rejoin('rejoin.dots', '.')).eq('rejoin.dots')
    expect(rejoin('rejoin-dots', '.')).eq('rejoin.dots')
  })
})
