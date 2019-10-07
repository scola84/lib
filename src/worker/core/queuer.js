import createQueue from 'async/queue'
import { Worker } from './worker'

const queues = {}

export class Queuer extends Worker {
  static createQueue (concurrency, name = null) {
    if (queues[name] !== undefined) {
      return queues[name]
    }

    const queue = createQueue((fn, callback) => {
      fn(callback)
    }, concurrency)

    if (name !== null) {
      queues[name] = queue
    }

    return queue
  }

  constructor (options = {}) {
    super(options)

    this._concurrency = null
    this._handler = null
    this._pub = null
    this._queue = null
    this._queuer = null
    this._sub = null
    this._unsaturated = null

    this.setConcurrency(options.concurrency)
    this.setPub(options.pub)
    this.setQueue(options.queue)
    this.setSub(options.sub)
    this.setUnsaturated(options.unsaturated)

    if (options.handler !== undefined) {
      this.setHandler(options.handler)
      this.startHandler()
    }

    if (options.queuer !== undefined) {
      this.setQueuer(options.queuer)
      this.startQueuer()
    }
  }

  getOptions () {
    return {
      ...super.getOptions(),
      concurrency: this._concurrency,
      handler: this._handler,
      pub: this._pub,
      queue: this._queue,
      queuer: this._queuer,
      sub: this._sub,
      unsaturated: this._unsaturated
    }
  }

  getConcurrency () {
    return this._concurrency
  }

  setConcurrency (value = 1) {
    this._concurrency = value
    return this
  }

  getHandler () {
    return this._handler
  }

  setHandler (value = null) {
    this._handler = value
    return this
  }

  getPub () {
    return this._pub
  }

  setPub (value = null) {
    this._pub = value
    return this
  }

  getQueue () {
    return this._queue
  }

  setQueue (value = null) {
    this._queue = value
    return this
  }

  getQueuer () {
    return this._queuer
  }

  setQueuer (value = null) {
    this._queuer = value
    return this
  }

  getSub () {
    return this._sub
  }

  setSub (value = null) {
    this._sub = value
    return this
  }

  getUnsatured () {
    return this._unsaturated
  }

  setUnsaturated (value = () => {}) {
    this._unsaturated = value
    return this
  }

  act (box, data) {
    if (this._queuer !== null) {
      this.pushToRemote(box, data)
    } else if (this._handler === null) {
      this.pushToLocal(box, data)
    }
  }

  createQueue (box) {
    this._queue = Queuer.createQueue(this._concurrency, this._name)

    this._queue.unsaturated(() => {
      this._unsaturated(box)
    })
  }

  handleRemote (callback) {
    this._handler.rpop(this._name, (error, data) => {
      if (error !== null) {
        callback(error)
        return
      }

      if (data === null) {
        this._unsaturated = () => {}
        callback(null, data)
        return
      }

      try {
        this.pass(
          ...this.merge(null, JSON.parse(data), callback)
        )
      } catch (jsonError) {
        callback(jsonError)
      }
    })
  }

  merge (box, data, callback) {
    if (this._merge !== null) {
      return this._merge(box, data, callback)
    }

    const newBox = {
      resolve: {
        [this._name]: {
          callback
        }
      }
    }

    return [newBox, data]
  }

  pushFromRemote () {
    if (this._queue === null) {
      this.createQueue()
    }

    if (this._queue.length() === this._concurrency) {
      return
    }

    this._unsaturated = () => {
      this.pushFromRemote()
    }

    this._queue.push((callback) => {
      this.handleRemote(callback)
    })
  }

  pushToLocal (box, data) {
    if (this._queue === null) {
      this.createQueue(box)
    }

    this._queue.push((callback) => {
      this.pass(
        ...this.merge(box, data, callback)
      )
    })
  }

  pushToRemote (box, data) {
    let dataString = null

    try {
      dataString = JSON.stringify(data)
    } catch (error) {
      this.log('fail', box, error)
      return
    }

    this._queuer.lpush(this._name, dataString, (error) => {
      if (error !== null) {
        this.log('fail', box, error)
        return
      }

      this._pub.publish(this._name, 1)
    })
  }

  startHandler () {
    const sub = this._handler.duplicate()

    sub.on('error', (error) => {
      this.log('fail', null, error)
    })

    sub.on('message', () => {
      this.pushFromRemote()
    })

    sub.subscribe(this._name)

    this.setSub(sub)
  }

  startQueuer () {
    const pub = this._queuer.duplicate()

    pub.on('error', (error) => {
      this.log('fail', null, error)
    })

    this.setPub(pub)
  }
}
