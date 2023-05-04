import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'
import type { Component } from 'types/component'
import type { InternalComponentOptions } from 'types/options'
import { EffectScope } from 'v3/reactivity/effectScope'

let uid = 0

export function initMixin(Vue: typeof Component) {
  Vue.prototype._init = function (options?: Record<string, any>) {
    const vm: Component = this
    // 唯一标识
    vm._uid = uid++
    debugger
    let startTag, endTag
    /* istanbul ignore if */
    if (__DEV__ && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      // 用于精准计算组件渲染所用时间
      mark(startTag)
    }

    // a flag to mark this as a Vue instance without having to do instanceof
    // check
    // 标记是vue实例，目的是处理响应式的时候不对vue实例进行处理
    vm._isVue = true
    vm.__v_skip = true
    // effect scope
    vm._scope = new EffectScope(true /* detached */)
    vm._scope._vm = true
    // merge options
    // 如果是组件的话特殊处理组件的options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options as any)
    } else {
      // 生成$options
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor as any),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (__DEV__) {
      initProxy(vm)
    } else {
      // 设置渲染时的代理对象
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    // 给vm实例绑定一些属性 $parent $root $children $refs 等
    initLifecycle(vm)
    // 更新父组件的事件
    initEvents(vm)
    // 给vm绑定部分属性 $slots $createElement $attrs $listeners等
    initRender(vm)
    // 执行 beforeCreate 生命周期
    callHook(vm, 'beforeCreate', undefined, false /* setContext */)
    // 加载inject数据
    initInjections(vm) // resolve injections before data/props
    // 将props data 用 Object.defineProperty处理一遍转成响应式，初始化computed watch等
    initState(vm)
    // 将 provide 也用 Object.defineProperty 处理一遍
    initProvide(vm) // resolve provide after data/props
    // 执行 created 生命周期
    callHook(vm, 'created')

    /* istanbul ignore if */
    // 开发环境下 计算 init 执行时间
    if (__DEV__ && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }
    // 挂载
    if (vm.$options.el) {
      debugger
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create((vm.constructor as any).options))
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions!
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions(Ctor: typeof Component) {
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions(
  Ctor: typeof Component
): Record<string, any> | null {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
