import camelCase from 'lodash/camelCase.js'
import { Snippet } from '../snippet/snippet.js'
import clientBase from './client.js'
import customBase from './custom.js'
import funcBase from './func.js'
import infixBase from './infix.js'
import postfixBase from './postfix.js'
import prefixBase from './prefix.js'
import snippetBase from './snippet.js'

const custom = Object.keys(customBase).reduce((object, name) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: Snippet,
      options: customBase[name]
    }
  }
}, {})

const client = Object.keys(clientBase).reduce((master, group) => {
  return Object.keys(clientBase[group]).reduce((object, name) => {
    return {
      ...object,
      [camelCase(name)]: {
        object: clientBase[group][name]
      }
    }
  }, master)
}, {})

const func = funcBase.reduce((object, { name, token }) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: Snippet,
      options: {
        name,
        parens: true,
        prefix: token
      }
    }
  }
}, {})

const infix = infixBase.reduce((object, { name, token }) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: Snippet,
      options: {
        infix: token,
        name
      }
    }
  }
}, {})

const postfix = postfixBase.reduce((object, { name, token }) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: Snippet,
      options: {
        name,
        postfix: token
      }
    }
  }
}, {})

const prefix = prefixBase.reduce((object, { name, token }) => {
  return {
    ...object,
    [camelCase(name)]: {
      object: Snippet,
      options: {
        name,
        prefix: token
      }
    }
  }
}, {})

const snippet = Object.keys(snippetBase).reduce((master, group) => {
  return Object.keys(snippetBase[group]).reduce((object, name) => {
    return {
      ...object,
      [camelCase(name)]: {
        object: snippetBase[group][name]
      }
    }
  }, master)
}, {})

export default {
  client,
  custom,
  snippet,
  infix,
  postfix,
  prefix,
  func
}
