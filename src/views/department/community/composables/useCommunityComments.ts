import { computed, ref } from 'vue';

import { listDepartmentCommunityComments } from '@/api/department/community';
import type { DepartmentCommunityCommentVO } from '@/api/department/community/types';

/**
 * 评论回复在页面上的展示模型。
 *
 * <p>接口返回的是扁平评论列表，这个模型只服务于展示层，不改变接口数据结构。</p>
 */
export type CommentReplyThread = DepartmentCommunityCommentVO & {
  depth: number;
  replyToName?: string;
};

/** 一条主评论及其回复列表。 */
export type CommentThread = {
  comment: DepartmentCommunityCommentVO;
  replies: CommentReplyThread[];
};

/**
 * 管理社区评论的分页数据和线程化展示结构。
 *
 * <p>评论列表可能同时被信息流评论区和内容详情区使用，因此将请求、分页和层级整理
 * 集中在这里，页面组件只负责触发动作和渲染结果。</p>
 */
export function useCommunityComments(pageSize = 5) {
  const comments = ref<DepartmentCommunityCommentVO[]>([]);
  const commentTotal = ref(0);
  const commentPage = ref(1);
  const commentLoadingMore = ref(false);
  let requestSequence = 0;

  /** 将评论分页状态恢复到未加载状态。 */
  const resetComments = () => {
    // 让尚未完成的旧请求失效，避免快速切换帖子后旧结果覆盖新列表。
    requestSequence += 1;
    comments.value = [];
    commentTotal.value = 0;
    commentPage.value = 1;
    commentLoadingMore.value = false;
  };

  /**
   * 将接口返回的扁平评论整理成主评论和回复线程。
   *
   * <p>当父评论不在当前分页中时，将该评论作为主评论展示，避免分页场景下内容
   * 被静默隐藏；同时限制关系判断只依赖当前已加载数据。</p>
   */
  const commentThreads = computed<CommentThread[]>(() => {
    const commentsById = new Map<string, DepartmentCommunityCommentVO>();
    const repliesByParentId = new Map<string, DepartmentCommunityCommentVO[]>();
    const roots: DepartmentCommunityCommentVO[] = [];

    comments.value.forEach(comment => commentsById.set(String(comment.id), comment));
    comments.value.forEach(comment => {
      const parentId = comment.parentId === undefined || comment.parentId === null ? '0' : String(comment.parentId);
      if (parentId === '0' || !commentsById.has(parentId)) {
        roots.push(comment);
        return;
      }
      const siblings = repliesByParentId.get(parentId) || [];
      siblings.push(comment);
      repliesByParentId.set(parentId, siblings);
    });

    return roots.map(comment => {
      const replies: CommentReplyThread[] = [];
      const appendReplies = (parent: DepartmentCommunityCommentVO, depth: number, visited: Set<string>) => {
        const parentId = String(parent.id);
        if (visited.has(parentId)) return;
        const nextVisited = new Set(visited).add(parentId);

        (repliesByParentId.get(parentId) || []).forEach(reply => {
          replies.push({
            ...reply,
            depth,
            // 第一层回复通过缩进表达关系，只有继续回复时才显示被回复人。
            replyToName: depth > 1 ? parent.authorName || '原评论' : undefined
          });
          appendReplies(reply, depth + 1, nextVisited);
        });
      };

      appendReplies(comment, 1, new Set());
      return { comment, replies };
    });
  });

  const commentHasMore = computed(() => commentTotal.value > comments.value.length);
  const remainingCommentCount = computed(() => Math.max(commentTotal.value - comments.value.length, 0));

  /** 加载指定帖子的评论，可选择覆盖当前列表或追加下一页。 */
  const loadComments = async (postId: string | number, pageNum = 1, append = false) => {
    const requestId = ++requestSequence;
    const res = await listDepartmentCommunityComments(postId, { pageNum, pageSize });
    if (requestId !== requestSequence) return false;

    const page = res.data;
    const rows = page?.rows || [];
    comments.value = append ? [...comments.value, ...rows] : rows;
    commentTotal.value = Number(page?.total || 0);
    commentPage.value = pageNum;
    return true;
  };

  /** 加载当前评论列表的下一页，并在请求期间锁定按钮避免重复请求。 */
  const loadMoreComments = async (postId?: string | number) => {
    if (!postId || commentLoadingMore.value || !commentHasMore.value) return;

    const requestId = requestSequence + 1;
    commentLoadingMore.value = true;
    try {
      await loadComments(postId, commentPage.value + 1, true);
    } finally {
      // 只有当前“加载更多”请求仍是最新请求时，才允许释放 loading 状态。
      if (requestSequence === requestId) commentLoadingMore.value = false;
    }
  };

  return {
    comments,
    commentTotal,
    commentPage,
    commentLoadingMore,
    commentThreads,
    commentHasMore,
    remainingCommentCount,
    resetComments,
    loadComments,
    loadMoreComments
  };
}
