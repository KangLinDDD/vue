import Vue from './instance/index'
import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'
import { FunctionalRenderContext } from 'core/vdom/create-functional-component'
import { version } from 'v3'

// 给vue原型上绑定方法 components、filters、directives、set、delete、nextTick等
initGlobalAPI(Vue)

// 是否是服务端渲染
Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

// 服务端渲染的时候，会给Vue原型上绑定一个属性ssrContext
Object.defineProperty(Vue.prototype, '$ssrContext', {
  get() {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
})

// expose FunctionalRenderContext for ssr runtime helper installation
// 服务端渲染的时候，会给Vue原型上绑定一个属性FunctionalRenderContext
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
})

// vue的版本号
Vue.version = version

export default Vue
