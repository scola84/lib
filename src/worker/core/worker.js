import { Cache } from './worker/cache.js'
import { Codec } from './worker/codec.js'
import { Formatter } from './worker/formatter.js'
import { Listener } from './worker/listener.js'
import { Logger } from './worker/logger.js'

const workers = new Map()

export class Worker {
  static singleton (options = {}) {
    if (workers.has(options.id) === true) {
      return workers.get(options.id)
    }

    return new this(options)
  }

  constructor (options = {}) {
    this._act = null
    this._bypass = null
    this._cache = null
    this._codec = null
    this._decide = null
    this._description = null
    this._downstream = null
    this._err = null
    this._filter = null
    this._id = null
    this._logger = null
    this._merge = null
    this._name = null
    this._upstream = null
    this._wrap = null

    this.setAct(options.act)
    this.setBypass(options.bypass)
    this.setCache(options.cache)
    this.setCodec(options.codec)
    this.setDecide(options.decide)
    this.setDescription(options.description)
    this.setDownstream(options.downstream)
    this.setErr(options.err)
    this.setFilter(options.filter)
    this.setId(options.id)
    this.setLogger(options.logger)
    this.setMerge(options.merge)
    this.setName(options.name)
    this.setUpstream(options.upstream)
    this.setWrap(options.wrap)
  }

  getOptions () {
    return {
      act: this._act,
      cache: this._cache,
      codec: this._codec,
      decide: this._decide,
      description: this._description,
      err: this._err,
      filter: this._filter,
      logger: this._logger,
      merge: this._merge,
      name: this._name,
      wrap: this._wrap
    }
  }

  getAct () {
    return this._act
  }

  setAct (value = null) {
    this._act = value
    return this
  }

  getBypass () {
    return this._bypass
  }

  setBypass (value = null) {
    this._bypass = value
    return this
  }

  getCache (value = null) {
    return value === null
      ? this._cache
      : Cache.get(value)
  }

  setCache (value = 'default') {
    if (this._cache !== null) {
      this.log('info', 'Changing cache to "%s"', [value])
    }

    this._cache = Cache.get(value)
    return this
  }

  getCodec (value = null) {
    return value === null
      ? this._codec
      : Codec.get(value)
  }

  setCodec (value = 'default') {
    if (this._codec !== null) {
      this.log('info', 'Changing codec to "%s"', [value])
    }

    this._codec = Codec.get(value)
    return this
  }

  getDecide () {
    return this._decide
  }

  setDecide (value = null) {
    this._decide = value
    return this
  }

  getDescription () {
    return this._description
  }

  setDescription (value = null) {
    this._description = value
    return this
  }

  getDownstream () {
    return this._downstream
  }

  setDownstream (value = null) {
    this._downstream = value
    return this
  }

  getErr () {
    return this._err
  }

  setErr (value = null) {
    this._err = value
    return this
  }

  getFilter () {
    return this._filter
  }

  setFilter (value = null) {
    this._filter = value
    return this
  }

  getId () {
    return this._id
  }

  setId (value = workers.size) {
    if (this._id !== null) {
      this.log('info', 'Changing id to "%s"', [value])
      workers.delete(this._id)
    }

    if (workers.has(value) === true) {
      throw new Error(`Worker "${value}" exists`)
    }

    workers.set(value, this)

    this._id = value
    return this
  }

  getLogger (value = null) {
    return value === null
      ? this._logger
      : Logger.get(value)
  }

  setLogger (value = 'default') {
    if (this._logger !== null) {
      this.log('info', 'Changing logger to "%s"', [value])
    }

    this._logger = Logger.get(value)
    return this
  }

  callLoggerId (name, id) {
    this.log('info', 'Changing logger id (%s)', [name])
    this._logger.callId(name, id)
    return this
  }

  getMerge () {
    return this._merge
  }

  setMerge (value = null) {
    this._merge = value
    return this
  }

  getName () {
    return this._name
  }

  setName (value = 'default') {
    if (this._name !== null) {
      this.log('info', 'Changing name "%s" to "%s"', [this._name, value])
    }

    this._name = value
    return this
  }

  getUpstream () {
    return this._upstream
  }

  setUpstream (value = null) {
    this._upstream = value
    return this
  }

  getWrap () {
    return this._wrap
  }

  setWrap (value = false) {
    this._wrap = value
    return this
  }

  act (box, data) {
    if (this._act !== null) {
      this._act(box, data)
      return
    }

    this.pass(box, data)
  }

  bypass (worker = null) {
    if (worker === null) {
      return this
    }

    this._bypass = worker
    return this
  }

  call (box = { origin: this }, data = null) {
    this.callAct(box, data)
  }

  callAct (box, data) {
    try {
      if (this.resolve('decide', box, data, ['act']) === true) {
        this.act(box, this.resolve('filter', box, data))
      } else if (this._bypass !== null) {
        if (this._bypass instanceof Worker) {
          this._bypass.callAct(box, data)
        }
      } else if (this._downstream !== null) {
        this._downstream.callAct(box, data)
      }
    } catch (tryError) {
      this.log('fail', '', [tryError], box.rid)
      this.callErr(box, tryError)
    }
  }

  callErr (box, error) {
    try {
      if (this.resolve('decide', box, error, ['err']) === true) {
        this.err(box, error)
      } else if (this._bypass !== null) {
        if (this._bypass instanceof Worker) {
          this._bypass.callErr(box, error)
        }
      } else if (this._downstream !== null) {
        this._downstream.callErr(box, error)
      }
    } catch (tryError) {
      this.log('fail', '', [tryError], box.rid)
    }
  }

  connect (worker = null) {
    if (worker === null) {
      return this
    }

    if (Array.isArray(worker) === true) {
      this.connect(worker[0])
      return worker[1]
    }

    this._downstream = worker.setUpstream(this)
    return worker
  }

  decide (box, data, context) {
    if (context === 'err') {
      return false
    }

    return true
  }

  err (box, error) {
    if (this._err !== null) {
      this._err(box, error)
      return
    }

    this.fail(box, error)
  }

  fail (box, error) {
    if (this._downstream === null) {
      return
    }

    this.log('fail', '', [error], box.rid)
    this._downstream.callErr(box, error)
  }

  filter (box, data) {
    return data
  }

  format (string, args, locale) {
    return Formatter.format(string, args, locale)
  }

  log (type, message, args, rid) {
    this._logger.log(this._id, type, message, args, rid)
    return this
  }

  merge (box, data) {
    return data
  }

  pass (box, data, ...extra) {
    if (data instanceof Error) {
      this.fail(box, data)
      return
    }

    if (this._downstream === null) {
      return
    }

    let merged = null

    try {
      merged = this.resolve('merge', box, data, extra)
    } catch (tryError) {
      this.log('fail', '', [tryError], box.rid)
      this.callErr(box, tryError)
      return
    }

    this.log('pass', '%j', [data], box.rid)
    this._downstream.callAct(box, merged)
  }

  prepend (worker = null) {
    if (worker === null) {
      return this
    }

    this._upstream
      .connect(worker)
      .connect(this)

    return this
  }

  resolve (name, box, data, extra = []) {
    let value = this[`_${name}`]

    if (value === null) {
      value = this[name](box, data, ...extra)
    } else if (typeof value === 'function') {
      value = value(box, data, ...extra)
    }

    this.log(name, '%j', [value], box.rid)

    return value
  }
}

Worker.Cache = Cache
Worker.Codec = Codec
Worker.Listener = Listener
Worker.Logger = Logger
Worker.workers = workers
