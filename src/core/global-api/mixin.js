/* @flow */

import { mergeOptions } from '../util/index'

export function initMixin (Vue: GlobalAPI) {      //合并配置到Vue.options
  Vue.mixin = function (mixin: Object) {        //Vue.mixin会在new Vue之前执行
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
