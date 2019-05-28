/* @flow */

import { isDef, isUndef } from 'shared/util'
import { updateListeners } from 'core/vdom/helpers/index'
import { isIE, supportsPassive } from 'core/util/env'
import { RANGE_TOKEN } from 'web/compiler/directives/model'

// normalize v-model event tokens that can only be determined at runtime.
// it's important to place the event as the first in the array because
// the whole point is ensuring the v-model callback gets called before
// user-attached handlers.
function normalizeEvents (on) {
  /* istanbul ignore if */
  if (isDef(on[RANGE_TOKEN])) {
    // IE input[type=range] only supports `change` event
    const event = isIE ? 'change' : 'input'
    on[event] = [].concat(on[RANGE_TOKEN], on[event] || [])
    delete on[RANGE_TOKEN]
  }
}

let target: HTMLElement       //dom对象

function add (
  event: string,
  handler: Function,
  once: boolean,
  capture: boolean,
  passive: boolean
) {
  if (once) {
    const oldHandler = handler
    const _target = target // save current target element in closure
    handler = function (ev) {             //handler就是最后事件触发执行的回调函数
      const res = arguments.length === 1
        ? oldHandler(ev)
        : oldHandler.apply(null, arguments)
      if (res !== null) {     //res调用一次之后就remove掉，避免重复执行
        remove(event, handler, capture, _target)
      }
    }
  }
  target.addEventListener(     //给dom添加事件回调
    event,
    handler,
    supportsPassive
      ? { capture, passive }
      : capture
  )
}

function remove (
  event: string,
  handler: Function,
  capture: boolean,
  _target?: HTMLElement
) {
  (_target || target).removeEventListener(event, handler, capture)
}

function updateDOMListeners (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  const on = vnode.data.on || {}
  const oldOn = oldVnode.data.on || {}
  target = vnode.elm
  normalizeEvents(on)     //处理v-modal
  updateListeners(on, oldOn, add, remove, vnode.context)
}

export default {
  create: updateDOMListeners,
  update: updateDOMListeners
}
