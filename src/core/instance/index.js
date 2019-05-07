import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
//下面这几个方法是添加Vue的原型方法，（先初始化这里的原型方法）
initMixin(Vue)    //添加Vue.prototype._init()
stateMixin(Vue)     //_state()
eventsMixin(Vue)    //_event()
lifecycleMixin(Vue)   //_lifecycle()
renderMixin(Vue)    //_render()

export default Vue
