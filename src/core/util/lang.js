/* @flow */

export const emptyObject = Object.freeze({})

/**
 * Check if a string starts with $ or _
 */
export function isReserved (str: string): boolean {
  const c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property.    封装Object.defineProperty
 */
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}

/**
 * Parse simple path.
 */
const bailRE = /[^\w.$]/
export function parsePath (path: string): any {
  if (bailRE.test(path)) {
    return
  }
  const segments = path.split('.')
  return function (obj) {       //这里返回的匿名函数赋值给getter，调用时传入的参数为vm
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return
      obj = obj[segments[i]]   //相当于获取挂在vm上的属性，一层一层往下寻找。如果监听的是计算属性，会触发computed的getter函数createComputedGetter
    }
    return obj
  }
}
