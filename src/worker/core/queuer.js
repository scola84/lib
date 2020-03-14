import createQueue from 'async/queue.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import { randomBytes } from 'crypto'
import RedisClient from 'ioredis'
import isObject from 'lodash/isObject'
import { Worker } from './worker.js'

export class Queuer extends Worker {
  constructor (options = {}) {
    super(options)

    this._boxes = null
    this._client = null
    this._expire = null
    this._handler = null
    this._highWaterMark = null
    this._pusher = null
    this._queue = null
    this._streamer = null
    this._throttle = null
    this._unsaturated = null

    this.setBoxes(options.boxes)
    this.setClient(options.client)
    this.setExpire(options.expire)
    this.setHandler(options.handler)
    this.setHighWaterMark(options.highWaterMark)
    this.setPusher(options.pusher)
    this.setQueue(options.queue)
    this.setStreamer(options.streamer)
    this.setThrottle(options.throttle)
    this.setUnsaturated(options.unsaturated)
  }

  getOptions () {
    return {
      ...super.getOptions(),
      boxes: this._boxes,
      client: this._client,
      expire: this._expire,
      handler: this._handler,
      highWaterMark: this._highWaterMark,
      pusher: this._pusher,
      queue: this._queue,
      streamer: this._streamer,
      throttle: this._throttle,
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
    this.log('info', 'Setting client to %o', [value])

    if (this._client !== null) {
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

  getHighWaterMark () {
    return this._highWaterMark
  }

  setHighWaterMark (value = Infinity) {
    this._highWaterMark = value
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
      this.throttleResume()

      if (channel === 'return') {
        this.handleResult(tid)
      }
    })

    this._client.sub.subscribe('return', 'stream')
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

  getThrottle () {
    return this._throttle
  }

  setThrottle (value = []) {
    this._throttle = value
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
      this.actHandler()
      return
    }

    this.actSimple(box, data)
  }

  actHandler () {
    this.handleTask()
  }

  actPusher (box, data) {
    this.log('info', 'Acting as pusher on %o', [data], box.rid)

    const index = isPlainObject(data) ? data.index : 0

    this.pushTask(box, data, (error) => {
      if (this.isInstance(error, Error) === true) {
        this.pass(box, Object.assign(data, { error }))
      } else if (data.result !== 'return') {
        this.pass(box, this.defineIndex({}, index))
      }
    })
  }

  actSimple (box, data) {
    this.log('info', 'Acting as simple queuer on %o', [data], box.rid)

    this._queue.push((callback) => {
      this.log('info', 'Handling task %o', [data], box.rid)
      this.pass(this.prepareBoxResolve(box, callback), data)
    })
  }

  actStreamer (box, data) {
    this.log('info', 'Acting as streamer on %o', [data], box.rid)

    if (this._bypass !== null) {
      this._bypass.callAct(box, data)
      return
    }

    this.pass(box, data)
  }

  createBoxPusher (box) {
    return {
      bid: box.bid,
      rid: box.rid,
      sid: box.sid
    }
  }

  defineIndex (data, index = 0, enumerable = false) {
    return Object.defineProperty(data, 'index', {
      configurable: true,
      enumerable,
      value: Number(index)
    })
  }

  handleResult (tid) {
    this.log('info', 'Handling result %o', [tid])

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
        if (this.isInstance(execError, Error) === true) {
          this.fail(box, this.defineIndex({ error: execError }, index))
          return
        }

        const [getError, string] = getResult

        if (this.isInstance(getError, Error) === true) {
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
        if (this.isInstance(popError, Error) === true) {
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

        this.prepareBoxResolve(box, (error, result = data) => {
          this.pushResult(error, result, box, callback)
        })

        this.pass(box, data)
      })
    })
  }

  prepareBoxResolve (box, callback) {
    if (isObject(box[`resolve.${this._name}`]) === true) {
      throw new Error(`Resolve for '${this._name}' is defined`)
    }

    box[`resolve.${this._name}`] = {
      callback,
      total: 0
    }

    return box
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
    if (isPlainObject(data) === false) {
      callback(new Error('400 [queuer] Data is not an object'))
      return
    }

    if (isString(data.queue) === false) {
      callback(new Error('400 [queuer] Queue name is not a string'))
      return
    }

    if (['none', 'return', 'stream'].indexOf(data.result) === -1) {
      callback(new Error('400 [queuer] Task result type is invalid'))
      return
    }

    this._client.pubsub('channels', data.queue, (pubsubError, channels) => {
      if (this.isInstance(pubsubError, Error) === true) {
        callback(pubsubError)
        return
      }

      if (channels.length === 0) {
        callback(new Error(`404 [queuer] Queue '${data.queue}' is not found`))
        return
      }

      this._client.llen(data.queue, (lenError, length) => {
        if (this.isInstance(lenError, Error) === true) {
          callback(lenError)
          return
        }

        if (isString(box.bid) === false) {
          box.bid = randomBytes(32).toString('hex')
          box.origin = this
          this._boxes.set(box.bid, box)
        }

        if (length >= this._highWaterMark) {
          this.throttlePause(box)
        }

        const string = this._codec.stringify({
          box: this.createBoxPusher(box),
          data: this.defineIndex(data, data.index, true)
        })

        this.log('info', 'Pushing task %s', [string], box.rid)

        this._client
          .multi()
          .lpush(data.queue, string)
          .publish(data.queue, 1)
          .exec(callback)
      })
    })
  }

  throttlePause (box) {
    if (isObject(box[`throttle.${this._name}`]) === false) {
      return
    }

    this.log('info', 'Pausing inflow for queue %o', [this._name], box.rid)
    box[`throttle.${this._name}`].pause()
    this._throttle.push(box)
  }

  throttleResume () {
    this._throttle = this._throttle.filter((box) => {
      this.log('info', 'Resuming inflow for queue %o', [this._name], box.rid)
      box[`throttle.${this._name}`].resume()
      return false
    })
  }
}
