/* @flow */

import config from 'core/config'
import { warn, cached } from 'core/util/index'
import { mark, measure } from 'core/util/perf'

import Vue from './runtime/index'
import { query } from './util/index'
import { shouldDecodeNewlines } from './util/compat'
import { compileToFunctions } from './compiler/index'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

const mount = Vue.prototype.$mount        
Vue.prototype.$mount = function (     /*runtime-only版本和compiler版本的mount方法实现不同，这里重新定义了一遍compiler版本的mount */
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)        /*获取或创建dom对象 */

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {     /*排除body和html标签 */
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {  /*如果没有render函数，就先解析template，然后编译成render */
    let template = options.template
    if (template) {
      if (typeof template === 'string') {     /*传入的是<div></div>或者id */
        if (template.charAt(0) === '#') {      /*如果传入的是模板的id */
          template = idToTemplate(template)       /*通过id获取dom节点或者新建dom节点 */
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {     /*template是个dom对象 */
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
    if (template) {         /*有了template，现在来实现render函数 */
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }

      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
  return mount.call(this, el, hydrating)     /*最后都是走到runtime-only版的基本的mount方法 */
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {     //返回的是dom结构字符串
  if (el.outerHTML) {
    return el.outerHTML
  } else {                  /*兼容IE没有outerHTML方法，先包一层，然后取innerHTML */
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}

Vue.compile = compileToFunctions

export default Vue
