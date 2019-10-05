export class Worker {
  constructor (options = {}) {
    this._act = null
    this._bypass = null
    this._decide = null
    this._delay = null
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
    this.setDecide(options.decide)
    this.setDelay(options.delay)
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
      decide: this._decide,
      delay: this._delay,
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

  getDecide () {
    return this._decide
  }

  setDecide (value = null) {
    this._decide = value
    return this
  }

  getDelay () {
    return this._delay
  }

  setDelay (value = null) {
    this._delay = value
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

  setId (value = null) {
    this._id = value
    return this
  }

  getLog () {
    return this._log
  }

  setLog (value = null) {
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
    if (this._act) {
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

    if (Array.isArray(worker)) {
      this.connect(worker[0])
      return worker[1]
    }

    this._downstream = worker.setUpstream(this)
    return worker
  }

  decide (box, data) {
    if (this._decide) {
      return this._decide(box, data)
    }

    return true
  }

  err (box, error) {
    if (this._err) {
      this._err(box, error)
      return
    }

    this.fail(box, error)
  }

  fail (box, error) {
    this.log('fail', box, error)
    this.handleFail(box, error)
  }

  filter (box, data, ...extra) {
    if (this._filter) {
      return this._filter(box, data, ...extra)
    }

    return data
  }

  find (compare) {
    if (compare(this) === true) {
      return this
    }

    if (this._downstream) {
      return this._downstream.find(compare)
    }

    return null
  }

  handle (box, data) {
    const decision = this.decide(box, data)

    if (decision === true) {
      this.act(box, data)
    } else if (decision === false) {
      this.skip(box, data)
    } else if (this._bypass) {
      this._bypass.handle(box, data)
    }
  }

  handleFail (box, error) {
    try {
      if (this._bypass) {
        this._bypass.err(box, error)
      } else if (this._downstream) {
        this._downstream.err(box, error)
      }
    } catch (tryError) {
      console.error(tryError)
    }
  }

  handlePass (box, data) {
    try {
      if (this._downstream) {
        this._downstream.handle(box, data)
      }
    } catch (tryError) {
      this.fail(box, tryError)
    }
  }

  log (type, ...args) {
    (this._log || console.out || (() => {}))(type, ...args)
  }

  merge (box, data, ...extra) {
    if (this._merge) {
      return this._merge(box, data, ...extra)
    }

    return data
  }

  pass (box, data) {
    if (this._delay === null) {
      return this.handlePass(box, data)
    }

    setTimeout(() => {
      this.handlePass(box, data)
    }, this._delay)
  }

  prepend (worker) {
    return this._upstream
      .connect(worker)
      .connect(this)
  }

  skip (box, data) {
    if (this._downstream) {
      this._downstream.handle(box, data)
    }
  }
}
