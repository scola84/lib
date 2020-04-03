import crypto from 'crypto'
import createQueue from 'async/queue.js'
import isError from 'lodash/isError.js'
import isNil from 'lodash/isNil.js'
import isObject from 'lodash/isObject.js'
import isPlainObject from 'lodash/isPlainObject.js'
import isString from 'lodash/isString.js'
import merge from 'lodash/merge.js'
import Redis from 'ioredis'
import { Worker } from './worker.js'

export class Queuer extends Worker {
  constructor (options = {}) {
    super(options)

    this._boxes = null
    this._client = null
    this._expire = null
    this._final = null
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
    this.setFinal(options.final)
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
      final: this._final,
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

  setClient (value = null) {
    if (this._client !== null) {
      this.log('info', 'Setting client to %o', [value])
      this._client.quit()
      this._client.sub.quit()
    }

    if (value === null) {
      this._client = null
      return this
    }

    this._client = this.newModule('Redis', value)
    this._client.sub = this.newModule('Redis', value)

    this.setHandler(this._handler)
    this.setPusher(this._pusher)
    this.setStreamer(this._streamer)

    return this
  }

  setCodec (value = 'application/json') {
    return super.setCodec(value)
  }

  getExpire () {
    return this._expire
  }

  setExpire (value = 5 * 60 * 1000) {
    this._expire = value
    return this
  }

  getFinal () {
    return this._final
  }

  setFinal (value = []) {
    this._final = isString(value)
      ? [value]
      : value

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

  setModules (value = { crypto, Redis }) {
    return super.setModules(value)
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

    this.pushTask(box, data, (error) => {
      if (isError(error) === true) {
        this.fail(box, data, error)
      } else if (data.result !== 'return') {
        this.callBypass(box, data)
      }
    })
  }

  actSimple (box, data) {
    this.log('info', 'Acting as simple queuer on %o', [data], box.rid)

    this._queue.push((callback) => {
      if (this.setUpBoxResolve(box, data, callback) === false) {
        callback()
        this.fail(box, data, new Error(`Could not set up resolve for '${this._name}'`))
        return
      }

      this
        .log('info', 'Handling task %o', [data], box.rid)
        .pass(box, data)
    })
  }

  actStreamer (box, data) {
    this.log('info', 'Acting as streamer on %o', [data], box.rid)

    if (this._bypass !== null) {
      this.callBypass(box, data)
      return
    }

    this.pass(box, data)
  }

  checkFinal (data) {
    if (isNil(data.id) === true) {
      return true
    }

    if (this._final.length === 0) {
      return true
    }

    for (let i = 0; i < this._final.length; i += 1) {
      if (this._final[i].indexOf(data.name) > -1) {
        this._cache.increment(data.id, 1)

        if (this._cache.get(data.id) === this._final.length) {
          this._cache.delete(data.id)
          return true
        }
      }
    }

    return false
  }

  createBoxPusher (box) {
    return {
      bid: box.bid,
      rid: box.rid,
      sid: box.sid
    }
  }

  handleResult (tid) {
    const [
      bid,
      index
    ] = tid.split(':')

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
        if (isError(execError) === true) {
          this.fail(box, null, merge(execError, index))
          return
        }

        const [getError, buffer] = getResult

        if (isError(getError) === true) {
          this.fail(box, null, merge(getError, index))
          return
        }

        this._codec.parse(buffer, {}, (parseError, object) => {
          if (isError(parseError) === true) {
            this.fail(box, null, merge(parseError, index))
            return
          }

          const {
            data
          } = object

          data.out.error = this.transformError(data.out.error)

          this
            .log('info', 'Handling result %o', [object], box.rid)
            .pass(box, data)
        })
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
      this._client.rpop(this._name, (popError, buffer) => {
        if (isError(popError) === true) {
          callback(popError)
          return
        }

        if (buffer === null) {
          this._unsaturated = () => {}
          callback(null, null)
          return
        }

        this._codec.parse(buffer, {}, (parseError, object) => {
          if (isError(parseError) === true) {
            callback(parseError)
            return
          }

          const {
            box,
            data
          } = object

          const cb = (error) => {
            this.pushResult(error, box, callback)
          }

          if (this.setUpBoxResolve(box, data, cb) === false) {
            this.fail(box, null, new Error(`Could not set up resolve for '${this._name}'`))
            return
          }

          this
            .log('info', 'Handling task %o', [object], box.rid)
            .pass(box, data)
        })
      })
    })
  }

  pushResult (error, box, callback) {
    if (box.task.result === 'none') {
      callback()
      return
    }

    box.task.out.error = this.transformError(error)
    box.task.out.final = this.checkFinal(box.task)

    const object = {
      data: {
        out: box.task.out,
        queue: box.task.queue,
        result: box.task.result
      }
    }

    const tid = box.task.result === 'stream'
      ? `${box.sid}:${box.task.index}`
      : `${box.bid}:${box.task.index}`

    this._codec.stringify(object, {}, (stringifyError, buffer) => {
      if (isError(stringifyError) === true) {
        callback(stringifyError)
        return
      }

      this.log('info', 'Pushing result %o', [object.data], box.rid)

      this._client
        .multi()
        .set(tid, buffer)
        .pexpire(tid, this._expire)
        .publish(box.task.result, tid)
        .exec(callback)
    })
  }

  pushTask (box, data, callback = () => {}) {
    if (isPlainObject(data) === false) {
      callback(new Error('400 [queuer] Task is not an object'))
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
      if (isError(pubsubError) === true) {
        callback(pubsubError)
        return
      }

      if (channels.length === 0) {
        callback(new Error(`404 [queuer] Queue '${data.queue}' is not found`))
        return
      }

      this._client.llen(data.queue, (lenError, length) => {
        if (isError(lenError) === true) {
          callback(lenError)
          return
        }

        if (isString(box.bid) === false) {
          merge(box, {
            bid: this
              .getModule('crypto')
              .randomBytes(32)
              .toString('hex'),
            origin: this
          })

          this._boxes.set(box.bid, box)
        }

        if (length >= this._highWaterMark) {
          this.throttlePause(box)
        }

        const object = {
          data,
          box: this.createBoxPusher(box)
        }

        this._codec.stringify(object, {}, (stringifyError, buffer) => {
          if (isError(stringifyError) === true) {
            callback(stringifyError)
            return
          }

          this.log('info', 'Pushing task %o', [object.data], box.rid)

          this._client
            .multi()
            .lpush(data.queue, buffer)
            .publish(data.queue, 1)
            .exec(callback)
        })
      })
    })
  }

  setUpBoxResolve (box, data, callback) {
    if (isObject(box[`resolve.${this._name}`]) === true) {
      return false
    }

    box[`resolve.${this._name}`] = {
      callback,
      data,
      total: 0
    }

    if (isNil(box.task) === true) {
      box.task = data
    }

    return true
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
