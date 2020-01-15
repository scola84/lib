import createQueue from 'async/queue.js'
import merge from 'lodash/merge.js'
import { randomBytes } from 'crypto'
import RedisClient from 'ioredis'
import { Worker } from './worker.js'

export class Queuer extends Worker {
  constructor (options = {}) {
    super(options)

    this._boxes = null
    this._client = null
    this._expire = null
    this._handler = null
    this._pusher = null
    this._queue = null
    this._streamer = null
    this._unsaturated = null

    this.setBoxes(options.boxes)
    this.setClient(options.client)
    this.setExpire(options.expire)
    this.setHandler(options.handler)
    this.setPusher(options.pusher)
    this.setQueue(options.queue)
    this.setStreamer(options.streamer)
    this.setUnsaturated(options.unsaturated)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      boxes: this._boxes,
      client: this._client,
      expire: this._expire,
      handler: this._handler,
      pusher: this._pusher,
      queue: this._queue,
      streamer: this._streamer,
      unsaturated: this._unsaturated
    }
  }

  getBoxes () {
    return this._boxes
  }

  setBoxes (value = new Map()) {
    this._boxes = value
    return this
  }

  getClient () {
    return this._client
  }

  setClient (value = 'redis://redis') {
    if (this._client !== null) {
      this.log('info', 'Changing client to "%s"', [value])
      this._client.quit()
      this._client.sub.quit()
    }

    if (value === null) {
      this._client = null
      return this
    }

    const client = new RedisClient(value)
    client.sub = new RedisClient(value)

    client.on('error', (error) => {
      this.log('fail', '', [error])
    })

    client.sub.on('error', (error) => {
      this.log('fail', '', [error])
    })

    this.setHandler(this._handler)
    this.setPusher(this._pusher)
    this.setStreamer(this._streamer)

    this._client = client
    return this
  }

  setCodec (value = 'application/json') {
    return super.setCodec(value)
  }

  getExpire () {
    return this._expire
  }

  setExpire (value = 60 * 60 * 1000) {
    this._expire = value
    return this
  }

  getHandler () {
    return this._handler
  }

  setHandler (value = null) {
    this._handler = value

    if (value !== true) {
      return this
    }

    this._client.sub.on('message', (name) => {
      if (this._name === name) {
        this.handleTask()
      }
    })

    this._client.sub.subscribe(this._name)
    return this
  }

  getPusher () {
    return this._pusher
  }

  setPusher (value = null) {
    this._pusher = value

    if (value !== true) {
      return this
    }

    this._client.sub.on('message', (channel, tid) => {
      if (channel === 'return') {
        this.handleResult(tid)
      }
    })

    this._client.sub.subscribe('return')
    return this
  }

  getQueue () {
    return this._queue
  }

  setQueue (value = 1) {
    if (this._queue !== null) {
      this._queue.kill()
    }

    if (value === null) {
      this._queue = null
      return this
    }

    const queue = createQueue((fn, callback) => {
      fn(callback)
    }, value)

    queue.error((error) => {
      this.log('fail', '', [error])
    })

    queue.unsaturated(() => {
      this._unsaturated()
    })

    this._queue = queue
    return this
  }

  getStreamer () {
    return this._streamer
  }

  setStreamer (value = null) {
    this._streamer = value

    if (value !== true) {
      return this
    }

    this._client.sub.on('message', (channel, tid) => {
      if (channel === 'stream') {
        this.handleResult(tid)
      }
    })

    this._client.sub.subscribe('stream')
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
    if (this._streamer === true) {
      this.actStreamer(box, data)
      return
    }

    if (this._pusher === true) {
      this.actPusher(box, data)
      return
    }

    if (this._handler === true) {
      return
    }

    this.actSimple(box, data)
  }

  actPusher (box, data) {
    this.log('info', 'Acting as pusher on %j', [data], box.rid)

    const index = typeof data === 'object' && data !== null
      ? data.index
      : 0

    this.pushTask(box, data, (error) => {
      if (error !== null) {
        this.pass(box, Object.assign(data, { error }))
      } else if (data.result !== 'return') {
        this.pass(box, this.defineIndex({}, index))
      }
    })
  }

  actSimple (box, data) {
    this.log('info', 'Acting as simple queuer on %j', [data], box.rid)

    this._queue.push((callback) => {
      this.log('info', 'Handling task %j', [data], box.rid)
      this.pass(this.prepareHandlerBox(box, callback), data)
    })
  }

  actStreamer (box, data) {
    this.log('info', 'Acting as streamer on %j', [data], box.rid)

    if (this._bypass !== null) {
      this._bypass.callAct(box, data)
      return
    }

    this.pass(box, data)
  }

  defineIndex (data, index = 0, enumerable = false) {
    return Object.defineProperty(data, 'index', {
      configurable: true,
      enumerable,
      value: Number(index)
    })
  }

  handleResult (tid) {
    this.log('info', 'Handling result "%s"', [tid])

    const [bid, index] = tid.split(':')

    if (this._boxes.has(bid) === false) {
      return
    }

    const box = this._boxes.get(bid)

    if (box.origin === this) {
      this._boxes.delete(bid)
    }

    this._client
      .multi()
      .get(tid)
      .del(tid)
      .exec((execError, [getResult]) => {
        if (execError !== null) {
          this.fail(box, this.defineIndex({ error: execError }, index))
          return
        }

        const [getError, string] = getResult

        if (getError !== null) {
          this.fail(box, this.defineIndex({ error: getError }, index))
          return
        }

        const data = this._codec.parse(string)

        this.log('info', 'Handling result %s', [string], box.rid)

        this.pass(box, this.defineIndex(data, data.index))
      })
  }

  handleTask () {
    if (this._queue.length() === this._concurrency) {
      return
    }

    this._unsaturated = () => {
      this.handleTask()
    }

    this._queue.push((callback) => {
      this._client.rpop(this._name, (popError, string) => {
        if (popError !== null) {
          callback(popError)
          return
        }

        if (string === null) {
          this._unsaturated = () => {}
          callback(null, null)
          return
        }

        const {
          box,
          data
        } = this._codec.parse(string)

        this.log('info', 'Handling task %s', [string], box.rid)

        const newBox = this.prepareHandlerBox(box, (error, result = data) => {
          this.pushResult(error, result, box, callback)
        })

        this.pass(newBox, data)
      })
    })
  }

  prepareHandlerBox (box, callback) {
    return merge(box, {
      resolve: {
        [this._name]: {
          callback,
          empty: true
        }
      }
    })
  }

  preparePusherBox (box) {
    let newBox = box

    if (typeof newBox.bid !== 'string') {
      newBox = {
        bid: randomBytes(32).toString('hex'),
        origin: this
      }

      this._boxes.set(newBox.bid, newBox)
    }

    return {
      bid: newBox.bid,
      rid: newBox.rid,
      sid: newBox.sid
    }
  }

  pushResult (error, data, box, callback) {
    if (data.result === 'none') {
      callback()
      return
    }

    data.error = error

    const tid = data.result === 'stream'
      ? `${box.sid}:${data.index}`
      : `${box.bid}:${data.index}`

    const string = this._codec.stringify(data)

    this.log('info', 'Pushing result %s', [string], box.rid)

    this._client
      .multi()
      .set(tid, string)
      .pexpire(tid, this._expire)
      .publish(data.result, tid)
      .exec(callback)
  }

  pushTask (box, data, callback = () => {}) {
    if (typeof data !== 'object' || data === null) {
      callback(new Error('400 [queuer] Data is not an object'))
      return
    }

    if (typeof data.queue !== 'string') {
      callback(new Error('400 [queuer] Queue name is not a string'))
      return
    }

    if (typeof data.data_in !== 'object' || data.data_in === null) {
      callback(new Error('400 [queuer] Task data is not an object'))
      return
    }

    if (['none', 'return', 'stream'].indexOf(data.result) === -1) {
      callback(new Error('400 [queuer] Task result type is invalid'))
      return
    }

    this._client.pubsub('channels', data.queue, (pubsubError, channels) => {
      if (pubsubError !== null) {
        callback(pubsubError)
        return
      }

      if (channels.length === 0) {
        callback(new Error(`404 [queuer] Queue "${data.queue}" is not found`))
        return
      }

      const string = this._codec.stringify({
        box: this.preparePusherBox(box),
        data: this.defineIndex(data, data.index, true)
      })

      this.log('info', 'Pushing task %s', [string], box.rid)

      this._client
        .multi()
        .lpush(data.queue, string)
        .publish(data.queue, 1)
        .exec(callback)
    })
  }
}
