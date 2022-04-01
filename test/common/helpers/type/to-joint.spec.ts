import { expect } from 'chai'
import { toJoint } from '../../../../src/common/helpers/to-joint'

describe('toJoint', () => {
  it('should discard all special characters', () => {
    expect(toJoint(' ==joined by  dots ==', '.')).eq('joined.by.dots')
  })

  it('should join with default (empty string)', () => {
    expect(toJoint('JoinedByEmptyString')).eq('joinedbyemptystring')
    expect(toJoint('joinedByEmptyString')).eq('joinedbyemptystring')
    expect(toJoint('joined.by.empty.string')).eq('joinedbyemptystring')
    expect(toJoint('joined-by-empty-string')).eq('joinedbyemptystring')
  })

  it('should join with hyphens', () => {
    expect(toJoint('JoinedByHyphens', '-')).eq('joined-by-hyphens')
    expect(toJoint('joinedByHyphens', '-')).eq('joined-by-hyphens')
    expect(toJoint('joined.by.hyphens', '-')).eq('joined-by-hyphens')
    expect(toJoint('joined-by-hyphens', '-')).eq('joined-by-hyphens')
  })

  it('should join with dots', () => {
    expect(toJoint('JoinedByDots', '.')).eq('joined.by.dots')
    expect(toJoint('joinedByDots', '.')).eq('joined.by.dots')
    expect(toJoint('joined-by-dots', '.')).eq('joined.by.dots')
    expect(toJoint('joined.by.dots', '.')).eq('joined.by.dots')
  })
})
