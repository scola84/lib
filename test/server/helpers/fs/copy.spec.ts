import { Copy } from '../../../../src/server/helpers/fs'
import { expect } from 'chai'
import { stub } from 'sinon'

describe('Copy', () => {
  describe('should', () => {
    it('createRandomTarget', createRandomTarget)
    it('unlinkTarget', unlinkTarget)
    it('writeTarget', writeTarget)
  })
})

function createRandomTarget (): void {
  const copy = new Copy('source')
  expect(copy.target).match(/\/tmp\/copy-/u)
}

async function unlinkTarget (): Promise<void> {
  const sourceName = 'source'
  const targetName = 'target'

  const copy = new Copy(sourceName, targetName)
  const unlinkStub = stub(copy.fs, 'unlink').resolves()

  await copy.unlinkTarget()
  expect(unlinkStub.getCall(0).args[0]).equal(targetName)
}

async function writeTarget (): Promise<void> {
  const copyContent = Buffer.from('test')
  const sourceName = 'source'
  const targetName = 'target'

  const copy = new Copy(sourceName, targetName)
  copy.content = copyContent
  const writeFileStub = stub(copy.fs, 'writeFile').resolves()

  await copy.writeTarget()
  expect(writeFileStub.getCall(0).args[0]).equal(targetName)
  expect(writeFileStub.getCall(0).args[1]).equal(copyContent)
}
