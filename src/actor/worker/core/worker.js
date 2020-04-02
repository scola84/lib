import isArray from 'lodash/isArray.js'
import isError from 'lodash/isError.js'
import isFunction from 'lodash/isFunction.js'
import isPlainObject from 'lodash/isPlainObject.js'
import luxon from 'luxon'
import { Loader } from '../../helper/loader.js'
import { Cache } from '../../helper/cache.js'
import { Codec } from '../../helper/codec.js'
import { Formatter } from '../../helper/formatter.js'
import { Logger } from '../../helper/logger.js'

export const workers = new Map()

export class Worker extends Loader {
  constructor (options = {}) {
    super(options)

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
      name: this._name
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
      this.log('info', 'Setting cache to %o', [value])
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
      this.log('info', 'Setting codec to %o', [value])
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

  setId (value = String(workers.size)) {
    if (this._id !== null) {
      this.log('info', 'Setting id to %o', [value])
      workers.delete(this._id)
    }

    if (workers.has(value) === true) {
      throw new Error(`Worker '${value}' is defined`)
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
      this.log('info', 'Setting logger to %o', [value])
    }

    this._logger = Logger.get(value)
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
      this.log('info', 'Setting name %o to %o', [this._name, value])
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
        if ((this._bypass instanceof Worker) === true) {
          this._bypass.callAct(box, data)
        }
      } else if (this._downstream !== null) {
        this._downstream.callAct(box, data)
      }
    } catch (tryError) {
      tryError.index = isPlainObject(data) ? data.index : undefined
      this.log('fail', '', [tryError], box.rid)
      this.callErr(box, tryError)
    }
  }

  callErr (box, error) {
    try {
      if (this.resolve('decide', box, error, ['err']) === true) {
        this.err(box, error)
      } else if (this._bypass !== null) {
        if ((this._bypass instanceof Worker) === true) {
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

    if (isArray(worker) === true) {
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
    try {
      return Formatter.format(string, args, locale)
    } catch (error) {
      return error.message
    }
  }

  log (type, message, args, rid) {
    this._logger.log(this._id, type, message, args, rid)
    return this
  }

  merge (box, data) {
    return data
  }

  pass (box, data, ...extra) {
    if (this._downstream === null) {
      return
    }

    let merged = null

    try {
      merged = this.resolve('merge', box, data, extra)
    } catch (tryError) {
      tryError.index = isPlainObject(data) ? data.index : undefined
      this.log('fail', '', [tryError], box.rid)
      this.callErr(box, tryError)
      return
    }

    if (isError(merged) === true) {
      this.fail(box, merged)
      return
    }

    this.log('pass', '%o', [merged], box.rid)
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
    } else if (isFunction(value) === true) {
      value = value.call(this, box, data, ...extra)
    }

    this.log(name, '%o', [value], box.rid)

    return value
  }

  transformDate (plus = 'P') {
    return luxon.DateTime
      .local()
      .plus(luxon.Duration.fromISO(plus))
      .toJSDate()
  }

  transformError (error) {
    if (error === null) {
      return null
    }

    if (isPlainObject(error) === true) {
      return Object.assign(new Error(error.message), error)
    }

    const [,
      code = '500', , ,
      type,
      message
    ] = error.message.match(/(\d{3})?(\s*(\[(.+)\]))?\s*(.*)/) || []

    return {
      code,
      type,
      data: error.data,
      message: code === '500' ? 'Internal Server Error' : message
    }
  }
}
