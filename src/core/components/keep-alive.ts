// 引入的一些工具类
import { isRegExp, isArray, remove } from 'shared/util'
import { getFirstComponentChild } from 'core/vdom/helpers/index'
import type VNode from 'core/vdom/vnode'
import type { VNodeComponentOptions } from 'types/vnode'
import type { Component } from 'types/component'
import { getComponentName } from '../vdom/create-component'

type CacheEntry = {
  name?: string
  tag?: string
  componentInstance?: Component
}

type CacheEntryMap = Record<string, CacheEntry | null>

/**
 * @description: 获取组件的name值
 * @param {VNodeComponentOptions} opts
 * @return {*}
 */
function _getComponentName(opts?: VNodeComponentOptions): string | null {
  return opts && (getComponentName(opts.Ctor.options as any) || opts.tag)
}

/**
 * @description: 判断对象中是否包含key值
 * @param {*} pattern
 * @param {*} name
 * @return {*}
 */
function matches(
  pattern: string | RegExp | Array<string>,
  name: string
): boolean {
  if (isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

/**
 * @description: 修改缓存的数据
 * @param {*} keepAliveInstance 组件实例
 * @param {*} filter 过滤的回调函数
 * @return {*}
 */
function pruneCache(
  keepAliveInstance: { cache: CacheEntryMap; keys: string[]; _vnode: VNode },
  filter: Function
) {
  // 获取当前实例的cache、keys、_vnode对象，此时_vnode对象是最新的dom对象
  const { cache, keys, _vnode } = keepAliveInstance
  // 遍历缓存对象，获取缓存中的组件虚拟dom
  for (const key in cache) {
    const entry = cache[key]
    // 如果缓存中有虚拟dom
    if (entry) {
      // 拿到组件的name值
      const name = entry.name
      if (name && !filter(name)) {
        // 对于includes来说，如果不包含当前组件的名字，则销毁缓存的组件
        // 对于excludes来说，如果 包含当前组件的名字，则销毁缓存的组件
        pruneCacheEntry(cache, key, keys, _vnode)
      }
    }
  }
}

/**
 * @description: 销毁缓存对象中key值对应的组件
 * @return {*}
 */
function pruneCacheEntry(
  cache: CacheEntryMap,
  key: string,
  keys: Array<string>,
  current?: VNode
) {
  const entry = cache[key]
  if (entry && (!current || entry.tag !== current.tag)) {
    // @ts-expect-error can be undefined
    entry.componentInstance.$destroy()
  }
  cache[key] = null
  remove(keys, key)
}

// 匹配的类型
const patternTypes: Array<Function> = [String, RegExp, Array]

// TODO defineComponent
export default {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  methods: {
    cacheVNode() {
      const { cache, keys, vnodeToCache, keyToCache } = this
      if (vnodeToCache) {
        const { tag, componentInstance, componentOptions } = vnodeToCache
        cache[keyToCache] = {
          name: _getComponentName(componentOptions),
          tag,
          componentInstance
        }
        keys.push(keyToCache)
        // 如果超过缓存的上限，则删除最早的缓存
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode)
        }
        this.vnodeToCache = null
      }
    }
  },

  created() {
    // 初始化keep-alive的缓存对象
    this.cache = Object.create(null)
    // 初始化key值
    this.keys = []
  },

  destroyed() {
    for (const key in this.cache) {
      pruneCacheEntry(this.cache, key, this.keys)
    }
  },

  mounted() {
    this.cacheVNode()
    // 监听值的变化，来实时修改缓存的数据
    this.$watch('include', val => {
      pruneCache(this, name => matches(val, name))
    })
    this.$watch('exclude', val => {
      pruneCache(this, name => !matches(val, name))
    })
  },

  updated() {
    this.cacheVNode()
  },

  render() {
    const slot = this.$slots.default
    const vnode = getFirstComponentChild(slot)
    const componentOptions = vnode && vnode.componentOptions
    if (componentOptions) {
      // check pattern
      const name = _getComponentName(componentOptions)
      const { include, exclude } = this
      /**
      * 如果配置了include则判断是否包含不该名字
      * 如果配了excluded则判断是否包含该名字
      * 返回的是最新的组件实例而不是缓存
      */
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      const { cache, keys } = this
      // 相同的构造函数可能会注册成不同的组件，所以单独使用cid来区分是不行的。
      const key =
        vnode.key == null
          ? componentOptions.Ctor.cid +
            (componentOptions.tag ? `::${componentOptions.tag}` : '')
          : vnode.key
      if (cache[key]) {
        // 直接拿到缓存的组件实例赋值给当前的组件实例
        vnode.componentInstance = cache[key].componentInstance
        // 把当前key删掉，然后重新添加到keys数组中，保证keys数组中的key值是最新的(下标越小代表使用时间最早)
        remove(keys, key)
        keys.push(key)
      } else {
        // 如果缓存不存在，则把当前组件的虚拟dom缓存起来
        this.vnodeToCache = vnode
        this.keyToCache = key
      }

      // @ts-expect-error can vnode.data can be undefined
      vnode.data.keepAlive = true
    }
    return vnode || (slot && slot[0])
  }
}
