/* @flow */

import { warn } from 'core/util/index'
import { cached, isUndef } from 'shared/util'

const normalizeEvent = cached((name: string): {
  name: string,
  once: boolean,
  capture: boolean,
  passive: boolean
} => {
  const passive = name.charAt(0) === '&'     //生成code的时候给每个事件修饰符添加的标识符 
  name = passive ? name.slice(1) : name
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture,
    passive
  }
})

export function createFnInvoker (fns: Function | Array<Function>): Function {    //传入参数是单个事件回调/事件回调数组
  function invoker () {
    const fns = invoker.fns
    if (Array.isArray(fns)) {
      const cloned = fns.slice()
      for (let i = 0; i < cloned.length; i++) {
        cloned[i].apply(null, arguments)               //执行事件的回调函数
      }
    } else {
      // return handler return value for single handlers
      return fns.apply(null, arguments)
    }
  }
  invoker.fns = fns
  return invoker
}

export function updateListeners (     //自定义或者原生事件都会走这个方法添加事件。update钩子执行时也要走这里
  on: Object,
  oldOn: Object,
  add: Function,      //添加事件
  remove: Function,   //移除事件
  vm: Component
) {
  let name, cur, old, event
  for (name in on) {
    cur = on[name]
    old = oldOn[name]
    event = normalizeEvent(name)
    if (isUndef(cur)) {
      process.env.NODE_ENV !== 'production' && warn(
        `Invalid handler for event "${event.name}": got ` + String(cur),
        vm
      )
    } else if (isUndef(old)) {    //说明是create创建的事件
      if (isUndef(cur.fns)) {     //如果新的事件没有封装设置过fns
        cur = on[name] = createFnInvoker(cur)    //传入事件回调，然后重新封装事件名对应的回调函数，处理单个函数或者函数数组的执行
      }
      add(event.name, cur, event.once, event.capture, event.passive)    //设置事件监听
    } else if (cur !== old) {        //如果新旧绑定的事件不一样，
      old.fns = cur         //直接重置fns就可以了
      on[name] = old
    }
  }
  for (name in oldOn) {       //旧的回调函数移除掉
    if (isUndef(on[name])) {
      event = normalizeEvent(name)
      remove(event.name, oldOn[name], event.capture)
    }
  }
}
