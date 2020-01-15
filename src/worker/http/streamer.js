import { HttpResponder } from './responder.js'

export class HttpStreamer extends HttpResponder {
  err (box, error) {
    this.act(box, error)
  }

  filter (box, data) {
    if (data === null) {
      return this.filterHeaders(box)
    }

    return this.filterEvent(box, data)
  }

  filterEvent (box, data) {
    return {
      body: data,
      end: false
    }
  }

  filterHeaders (box) {
    const cookie = [
      `stream-id=${box.bid}`,
      'HttpOnly',
      'Path=/q',
      'SameSite=Strict'
    ].join(';')

    const headers = {
      'Content-Length': null,
      'Content-Type': 'text/event-stream',
      'Set-Cookie': cookie
    }

    return {
      headers,
      body: {},
      end: false
    }
  }
}
