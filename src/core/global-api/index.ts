import config from '../config'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import { ASSET_TYPES } from 'shared/constants'
import builtInComponents from '../components/index'
import { observe } from 'core/observer/index'

import {
  warn,
  extend,
  nextTick,
  mergeOptions,
  defineReactive
} from '../util/index'
import type { GlobalAPI } from 'types/global-api'

export function initGlobalAPI(Vue: GlobalAPI) {
  // config
  const configDef: Record<string, any> = {}
  configDef.get = () => config
  if (__DEV__) {
    configDef.set = () => {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  // 给vue原型上定义 config 属性
  Object.defineProperty(Vue, 'config', configDef)

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  // 暴露工具方法
  Vue.util = {
    warn,
    extend,
    mergeOptions,
    defineReactive
  }

  Vue.set = set
  Vue.delete = del
  Vue.nextTick = nextTick

  // 2.6 explicit observable API
  // 响应式的api
  Vue.observable = <T>(obj: T): T => {
    observe(obj)
    return obj
  }

  // 创建一个不需要原型的对象，可以提高性能
  Vue.options = Object.create(null)
  // 给 options 上添加 components、directives、filters 属性
  ASSET_TYPES.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  // 绑定 keep-alive 组件
  extend(Vue.options.components, builtInComponents)

  // 给vue原型上挂载 use、mixin、extend 方法
  initUse(Vue)
  // 实现混入
  initMixin(Vue)
  // 组件的构造函数
  initExtend(Vue)
  // 给vue原型上挂载 components、directives、filters 方法
  initAssetRegisters(Vue)
}
