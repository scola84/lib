import { Writable } from 'stream'
import { expect } from 'chai'

describe('Writable', () => {
  it('should emit an error when _write is async and throws an error', (done) => {
    class Test extends Writable {
      public async _write (
        chunk: unknown,
        encoding: string,
        callback: (error?: Error) => void
      ): Promise<void> {
        try {
          await new Promise(() => {
            throw new Error('error message')
          })
        } catch (error: unknown) {
          callback(error as Error)
        }
      }
    }

    const test = new Test()

    test.on('error', (error) => {
      expect(error.message).equal('error message')
      done()
    })

    test.write('')
  })
})
