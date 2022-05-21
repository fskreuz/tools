import { module, deepEqual, equal, notEqual } from '../test/lib.js'
import { combineReducers, createApp } from './lib.js'

const { test } = module('state/state')

test('Order of effect, reduce, view, and render', () => {
  return new Promise((resolve, reject) => {
    const result = []
    let twice = false

    const effect = (state, { type, payload }, dispatch) => {
      switch (type) {
        case 'INIT':
          result.push('effect')
          dispatch('EFFECT_DISPATCH', null)
          break
        default:
          twice = true
          result.push('after-effect')
          break
      }
    }

    // Must return different state. Otherwise, render doesn't happen.
    const reduce = (s) => { result.push('reduce'); return {} }
    const view = () => { result.push('view') }
    const render = () => {
      result.push('render')

      // Render is the last call, so we test here.
      try {
        if (twice) {
          deepEqual(result, ['effect', 'reduce', 'view', 'render', 'after-effect', 'reduce', 'view', 'render'])
          resolve()
        }
      } catch (e) {
        reject(e)
      }
    }

    createApp({ effect, reduce, view, render })
  })
})

test('Reducer initial state', () => {
  return new Promise((resolve, reject) => {
    const initialState = { foo: 'bar' }

    const reduce = (state = initialState, action) => state
    const view = ({ state }) => {
      try {
        equal(state, initialState)
        deepEqual(state, { foo: 'bar' })
        resolve()
      } catch (e) {
        reject(e)
      }
    }

    createApp({ reduce, view })
  })
})

test('combineReducers, simple', () => {
  const reduce = combineReducers({
    a: (state, action) => ({ a1: action.payload }),
    b: (state, action) => ({ b1: action.payload })
  })

  deepEqual(reduce({}, { payload: 'Hello, World!' }), {
    a: { a1: 'Hello, World!' },
    b: { b1: 'Hello, World!' }
  })
})

test('combineReducers, nested', () => {
  const reduce = combineReducers({
    a: (state, action) => ({ a1: action.payload }),
    b: (state, action) => ({ b1: action.payload }),
    c: combineReducers({
      d: (state, action) => ({ d1: action.payload }),
      e: (state, action) => ({ e1: action.payload })
    })
  })

  deepEqual(reduce({}, { payload: 'Hello, World!' }), {
    a: { a1: 'Hello, World!' },
    b: { b1: 'Hello, World!' },
    c: {
      d: { d1: 'Hello, World!' },
      e: { e1: 'Hello, World!' }
    }
  })
})

test('combineReducers, deep', () => {
  const reducer = combineReducers({
    a: (state, action) => ({ a1: action.payload }),
    b: (state, action) => ({ b2: action.payload }),
    c: combineReducers({
      d: (state, action) => ({ d3: action.payload }),
      e: (state, action) => ({ e4: action.payload }),
      f: combineReducers({
        g: (state, action) => ({ g5: action.payload }),
        h: (state, action) => ({ h6: action.payload })
      })
    })
  })

  deepEqual(reducer({}, { payload: 'Hello, World!' }), {
    a: { a1: 'Hello, World!' },
    b: { b2: 'Hello, World!' },
    c: {
      d: { d3: 'Hello, World!' },
      e: { e4: 'Hello, World!' },
      f: {
        g: { g5: 'Hello, World!' },
        h: { h6: 'Hello, World!' }
      }
    }
  })
})

test('combineReducers initial state is an empty object', () => {
  const reduce = combineReducers({})

  deepEqual(reduce(), {})
})

test('combineReducers returns identical tree when no substate change', () => {
  const initialState1 = { foo: 'bar' }
  const initialState2 = { baz: 'qux' }

  const reduce = combineReducers({
    reducer1: (s = initialState1) => s,
    reducer2: (s = initialState2) => s
  })

  const initialReducerState = reduce(undefined, { type: 'INIT' })
  const reducedState = reduce(initialReducerState, { type: 'CHANGE' })

  deepEqual(initialReducerState, {
    reducer1: { foo: 'bar' },
    reducer2: { baz: 'qux' }
  })

  deepEqual(reducedState, {
    reducer1: { foo: 'bar' },
    reducer2: { baz: 'qux' }
  })

  equal(reducedState, initialReducerState)
  equal(initialReducerState.reducer1, initialState1)
  equal(initialReducerState.reducer2, initialState2)
  equal(reducedState.reducer1, initialReducerState.reducer1)
  equal(reducedState.reducer2, initialReducerState.reducer2)
})

test('combineReducers returns different tree when substate change', () => {
  const initialState1 = { foo: 'bar' }
  const initialState2 = { baz: 'qux' }

  const reduce = combineReducers({
    reducer1: (s = initialState1, { type }) => s,
    reducer2: (s = initialState2, { type }) => {
      switch (type) {
        case 'CHANGE':
          return { lorem: 'ipsum' }
        default:
          return s
      }
    }
  })

  const initialReducedState = reduce(undefined, { type: 'INIT' })
  const reducedState = reduce(initialReducedState, { type: 'CHANGE' })

  deepEqual(initialReducedState, {
    reducer1: { foo: 'bar' },
    reducer2: { baz: 'qux' }
  })

  deepEqual(reducedState, {
    reducer1: { foo: 'bar' },
    reducer2: { lorem: 'ipsum' }
  })

  notEqual(reducedState, initialReducedState)
  equal(initialReducedState.reducer1, initialState1)
  equal(reducedState.reducer1, initialReducedState.reducer1)
  equal(initialReducedState.reducer2, initialState2)
  notEqual(reducedState.reducer2, initialReducedState.reducer2)
})
