import get from 'lodash-es/get'
import { log } from './worker/'

let id = 0
let config = {}

export class Worker {
  static getConfig () {
    return config
  }

  static setConfig (value) {
    config = value
    return config
  }

  static getId () {
    return id
  }

  static setId (value) {
    id = value === undefined ? id + 1 : value
    return id
  }

  static setup () {
    log(get(config, 'core.worker.log'))
  }

  constructor (options = {}) {
    this._act = null
    this._bypass = null
    this._config = null
    this._decide = null
    this._downstream = null
    this._err = null
    this._filter = null
    this._id = null
    this._log = null
    this._merge = null
    this._name = null
    this._upstream = null
    this._wrap = null

    this.setAct(options.act)
    this.setBypass(options.bypass)
    this.setConfig(options.config)
    this.setDecide(options.decide)
    this.setDownstream(options.downstream)
    this.setErr(options.err)
    this.setFilter(options.filter)
    this.setId(options.id)
    this.setLog(options.log)
    this.setMerge(options.merge)
    this.setName(options.name)
    this.setUpstream(options.upstream)
    this.setWrap(options.wrap)
  }

  getOptions () {
    return {
      act: this._act,
      config: this._config,
      decide: this._decide,
      err: this._err,
      filter: this._filter,
      log: this._log,
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

  getConfig (path = '') {
    return get(this._config, path)
  }

  setConfig (value = config) {
    this._config = value
    return this
  }

  getDecide () {
    return this._decide
  }

  setDecide (value = null) {
    this._decide = value
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

  setId (value = Worker.setId()) {
    this._id = value
    return this
  }

  getLog () {
    return this._log
  }

  setLog (value = console) {
    this._log = value
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

  decide () {
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
    this.log('fail', box, error)

    if (this._bypass !== null) {
      this._bypass.handleErr(box, error)
    } else if (this._downstream !== null) {
      this._downstream.handleErr(box, error)
    }
  }

  filter (box, data) {
    return data
  }

  find (compare) {
    if (compare(this) === true) {
      return this
    }

    if (this._downstream !== null) {
      return this._downstream.find(compare)
    }

    return null
  }

  handle (box, data) {
    this.handleAct(box, data)
  }

  handleAct (box, data) {
    try {
      if (this.handleDecide(box, data) === true) {
        this.act(box, this.handleFilter(box, data))
      } else if (this._downstream !== null) {
        this._downstream.handleAct(box, data)
      }
    } catch (error) {
      this.handleErr(box, error)
    }
  }

  handleDecide (box, data) {
    let decided = null

    if (this._decide !== null) {
      decided = this._decide(box, data)
    } else {
      decided = this.decide(box, data)
    }

    this.log('decide', box, data, decided)

    return decided
  }

  handleErr (box, error) {
    try {
      this.err(box, error)
    } catch (tryError) {
      this.log('fail', box, tryError)
    }
  }

  handleFilter (box, data) {
    let filtered = null

    if (this._filter !== null) {
      filtered = this._filter(box, data)
    } else {
      filtered = this.filter(box, data)
    }

    this.log('filter', box, data, filtered)

    return filtered
  }

  handleMerge (box, data, ...extra) {
    let merged = null

    if (this._merge !== null) {
      merged = this._merge(box, data, ...extra)
    } else {
      merged = this.merge(box, data, ...extra)
    }

    this.log('merge', box, data, merged)

    return merged
  }

  log (type, ...args) {
    if (this._log[type] !== undefined) {
      this._log[type](this._id, ...args)
    }
  }

  merge (box, data) {
    return data
  }

  pass (box, data, ...extra) {
    this.log('pass', box, data, ...extra)

    try {
      if (data instanceof Error) {
        this.fail(box, data)
      } else if (this._downstream !== null) {
        this._downstream.handleAct(box,
          this.handleMerge(box, data, ...extra))
      }
    } catch (error) {
      this.fail(box, error)
    }
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
}
