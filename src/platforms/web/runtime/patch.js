/* @flow */

import * as nodeOps from 'web/runtime/node-ops'
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)

/*返回一个函数，
参数nodeOps是web下实际操作dom的方法
参数modules是个合集，定义了很多node的属性，class，属性等等的钩子函数
这两个参数都是跟平台相关的方法合集，但是现在把所有的方法一次性传入，避免了平台差异化造成的各种判断，这是函数柯里化的思想
*/
export const patch: Function = createPatchFunction({ nodeOps, modules })

