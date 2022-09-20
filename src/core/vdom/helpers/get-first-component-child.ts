import { isDef, isArray } from 'shared/util'
import VNode from '../vnode'
import { isAsyncPlaceholder } from './is-async-placeholder'

export function getFirstComponentChild(
  children?: Array<VNode>
): VNode | undefined {
  if (isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      const c = children[i]
      // 如果组件不是undefined和null  且 组件的options存在   或者是注释节点则直接返回
      // 即找第一个符合条件的组件
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}
