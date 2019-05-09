/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {     //建立数据和watcher之间的联系
  static target: ?Watcher;
  id: number;         //uid
  subs: Array<Watcher>;    //存放所有的watcher

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()  //创建副本，遍历
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()    //执行watcher的update方法
    }
  }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null    //全局变量
const targetStack = []    //存放target栈，方便取得上一个target

export function pushTarget (_target: Watcher) {
  if (Dep.target) targetStack.push(Dep.target)     //把上一个Dep.target存入targetStack
  Dep.target = _target      //Dep.target存放新的watcher
}

export function popTarget () {     //复原Dep.target
  Dep.target = targetStack.pop()
}
