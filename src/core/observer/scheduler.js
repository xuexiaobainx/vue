/* @flow */

import type Watcher from './watcher'
import config from '../config'
import { callHook, activateChildComponent } from '../instance/lifecycle'

import {
  warn,
  nextTick,
  devtools
} from '../util/index'

export const MAX_UPDATE_COUNT = 100

const queue: Array<Watcher> = []
const activatedChildren: Array<Component> = []
let has: { [key: number]: ?true } = {}
let circular: { [key: number]: number } = {}
let waiting = false
let flushing = false   //清空标志位
let index = 0

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {     //每次更新完一个watcher,都要初始化
  index = queue.length = activatedChildren.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false    //重置标志位
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {   //遍历watcher队列，run()更新视图。这个方法是要push到nextTick的回调队列中去执行的
  flushing = true
  let watcher, id

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child) 组件更新是从父到子
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)用户定义的user watcher是在渲染watcher之前的
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped. 组件在父组件的watcher回调中被销毁了的话就不用执行了
  queue.sort((a, b) => a.id - b.id)    //组件的watcher从小到大排

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {  //queue的length是会变的
    watcher = queue[index]
    id = watcher.id
    has[id] = null       //恢复初始化
    watcher.run()       //视图在这里更新
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {   //判断是否有无限循环更新的情况，
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {      //循环限制为100
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        )
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  const activatedQueue = activatedChildren.slice()
  const updatedQueue = queue.slice()    //取更新队列的一个副本

  resetSchedulerState()         //重置标志位的状态

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue)    //keepalive钩子？
  callUpdatedHooks(updatedQueue)    //遍历queue进行更新操作

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}

function callUpdatedHooks (queue) {
  let i = queue.length
  while (i--) {
    const watcher = queue[i]
    const vm = watcher.vm
    if (vm._watcher === watcher && vm._isMounted) {    //是一个渲染watcher并且已经mounted过了（也就是说不是第一次渲染）
      callHook(vm, 'updated')      //对vm实例执行update钩子
    }
  }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
export function queueActivatedComponent (vm: Component) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false
  activatedChildren.push(vm)
}

function callActivatedHooks (queue) {
  for (let i = 0; i < queue.length; i++) {
    queue[i]._inactive = true
    activateChildComponent(queue[i], true /* true */)
  }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id     
  if (has[id] == null) { //同一个组件的不同的数据更新会触发多次queueWatcher,但是更新是以一个渲染watcher为单位的，避免了多次走这个逻辑
    has[id] = true
    if (!flushing) {
      queue.push(watcher)    //queue是不断添加watcher的
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      // 在一次flushing中run()里面出发了数据变化
      // 例如user自己写了一个watcher不停触发数据的变化，此时flashing还是为true，走这个逻辑，会在queue里面重复插入同一个watcher
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {  //从后往前找，直到找到比watcher.id小的可以插入watcher的位置
        i--
      }
      queue.splice(i + 1, 0, watcher)     //把这个watcher插入到queue中i后面的位置
    }
    // queue the flush
    if (!waiting) {   //waiting也是保证这里的逻辑只执行一次
      waiting = true
      nextTick(flushSchedulerQueue)   //在(下一个tick)下次DOM更新循环结束之后执行延迟回调。在修改数据之后立即使用这个方法，获取更新后的DOM。
    }
  }
}
