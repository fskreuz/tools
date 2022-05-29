const defaultEffect = () => { }
const defaultReduce = s => s
const defaultView = () => null
const defaultRender = () => { }

export const Action = {
  Init: 'ACTION_INIT',
  UncaughtError: 'ACTION_UNCAUGHT_ERROR'
}

export const createApp = ({ effect = defaultEffect, reduce = defaultReduce, view = defaultView, render = defaultRender }) => {
  let root, state

  const dispatch = (type, payload = null) => {
    const action = { type, payload }

    try {
      effect(state, action, (...args) => setTimeout(() => dispatch(...args)))
      const newState = reduce(state, action)

      if (state === newState) return

      state = newState
      root = render(view({ state, dispatch }), root)
    } catch (error) {
      setTimeout(() => dispatch(Action.UncaughtError, error))
    }
  }

  setTimeout(() => dispatch(Action.Init, Date.now()))

  return dispatch
}

export const combineReducers = reducerMap => (state = {}, action) => {
  return Object.entries(reducerMap).reduce((c, [key, reducer]) => {
    const result = reducer(c[key], action)

    return state[key] === result ? c : { ...c, [key]: result }
  }, state)
}

export const combineEffects = effects => (...args) => {
  effects.forEach(e => e(...args))
}

export const combineRenderers = renderers => (...args) => {
  renderers.forEach(r => r(...args))
}
