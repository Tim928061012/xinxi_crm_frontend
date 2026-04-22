import type { InjectionKey } from 'vue'

/** 供 Comments 列表 / 右侧边栏调用，打开全局挂载的添加评论弹窗 */
export type ClientCommentDialogInject = {
  openNewComment: () => void
  openAddComment?: (options?: { moduleName?: string; presetTitle?: string; freeForm?: boolean }) => void
}

export const CLIENT_COMMENT_DIALOG_INJECT_KEY: InjectionKey<ClientCommentDialogInject> = Symbol('clientCommentDialog')
