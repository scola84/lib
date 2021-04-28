import { File } from '../../../../src/server/helpers/fs'
import { expect } from 'chai'
import { stub } from 'sinon'

describe('File', () => {
  describe('should', () => {
    it('read', read)
    it('replace', replace)
    it('unlink', unlink)
    it('write', write)
  })
})

async function read (): Promise<void> {
  const fileContent = Buffer.from('test')
  const sourceName = 'source'

  const file = new File(sourceName)
  stub(file.fs, 'readFile').resolves(fileContent)

  await file.read()
  expect(file.content).equal(fileContent)
}

function replace (): void {
  const fileContent = Buffer.from('test')
  const sourceName = 'test'
  const replacedContent = 'replacement'

  const file = new File(sourceName)
  file.content = fileContent

  file.replace('test', replacedContent)
  expect(file.content).equal(replacedContent)
}

async function unlink (): Promise<void> {
  const sourceName = 'test'

  const file = new File(sourceName)
  const unlinkStub = stub(file.fs, 'unlink').resolves()

  await file.unlink()
  expect(unlinkStub.getCall(0).args[0]).equal(sourceName)
}

async function write (): Promise<void> {
  const fileContent = Buffer.from('test')
  const sourceName = 'test'

  const file = new File(sourceName)
  file.content = fileContent
  const writeFileStub = stub(file.fs, 'writeFile').resolves()

  await file.write()
  expect(writeFileStub.getCall(0).args[0]).equal(sourceName)
  expect(writeFileStub.getCall(0).args[1]).equal(fileContent)
}
