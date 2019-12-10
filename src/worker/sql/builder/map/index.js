import camel from 'lodash-es/camelCase'
import { Snippet } from '../snippet/snippet'
import customBase from './custom'
import dialectBase from './dialect'
import funcBase from './func'
import infixBase from './infix'
import postfixBase from './postfix'
import prefixBase from './prefix'
import snippetBase from './snippet'

const custom = Object.keys(customBase).reduce((object, name) => {
  return {
    ...object,
    [camel(name)]: {
      object: Snippet,
      options: customBase[name]
    }
  }
}, {})

const dialect = Object.keys(dialectBase).reduce((master, group) => {
  return Object.keys(dialectBase[group]).reduce((object, name) => {
    return {
      ...object,
      [camel(name)]: {
        object: dialectBase[group][name]
      }
    }
  }, master)
}, {})

const func = funcBase.reduce((object, { name, token }) => {
  return {
    ...object,
    [camel(name)]: {
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
    [camel(name)]: {
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
    [camel(name)]: {
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
    [camel(name)]: {
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
      [camel(name)]: {
        object: snippetBase[group][name]
      }
    }
  }, master)
}, {})

export default {
  custom,
  dialect,
  snippet,
  infix,
  postfix,
  prefix,
  func
}
