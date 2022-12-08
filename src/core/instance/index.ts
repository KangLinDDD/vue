import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
import type { GlobalAPI } from 'types/global-api'

// 定义 vue 的构造函数
function Vue(options) {
  if (__DEV__ && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 首次new Vue，options为 {render: h => h(App)}
  this._init(options)
}

//@ts-expect-error Vue has function type
// 给vue实例绑定_init方法
initMixin(Vue)
//@ts-expect-error Vue has function type
// 给vue原型绑定 $set $delete $watch
stateMixin(Vue)
//@ts-expect-error Vue has function type
// 给vue原型绑定 $on $once $off $emit事件
eventsMixin(Vue)
//@ts-expect-error Vue has function type
// 给vue实例绑定一些方法 _update $forceUpdate $destroy
lifecycleMixin(Vue)
//@ts-expect-error Vue has function type
// 给vue原型混入render的一些相关api $nextTick 和 _render
renderMixin(Vue)
// 到这里 vue 的构造函数已经定义完毕
export default Vue as unknown as GlobalAPI
