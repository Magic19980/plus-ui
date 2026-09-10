<template>
  <div class="comment-thread">
    <CommunityCommentItem
      :comment="thread.comment"
      is-root
      :can-resolve="canResolve"
      :user-avatar="userAvatar"
      @preview-media="emit('preview-media', $event)"
      @reply-comment="emit('reply-comment', $event)"
      @delete-comment="emit('delete-comment', $event)"
      @resolve-comment="emit('resolve-comment', $event)"
    />

    <div v-if="thread.replies.length" class="comment-replies">
      <CommunityCommentItem
        v-for="reply in thread.replies"
        :key="reply.id"
        :comment="reply"
        :reply-depth="reply.depth"
        :reply-to-name="reply.replyToName"
        :can-resolve="canResolve"
        :user-avatar="userAvatar"
        @preview-media="emit('preview-media', $event)"
        @reply-comment="emit('reply-comment', $event)"
        @delete-comment="emit('delete-comment', $event)"
        @resolve-comment="emit('resolve-comment', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="CommunityCommentThread">
import { computed } from 'vue';

import type { DepartmentCommunityCommentVO, DepartmentCommunityMediaVO, DepartmentCommunityPostVO } from '@/api/department/community/types';
import CommunityCommentItem from './CommunityCommentItem.vue';
import type { CommentThread } from '../composables/useCommunityComments';

const props = defineProps<{
  thread: CommentThread;
  postType?: DepartmentCommunityPostVO['postType'];
  postStatus?: DepartmentCommunityPostVO['status'];
  userAvatar?: string;
}>();

const emit = defineEmits<{
  'preview-media': [media: DepartmentCommunityMediaVO];
  'reply-comment': [comment: DepartmentCommunityCommentVO];
  'delete-comment': [comment: DepartmentCommunityCommentVO];
  'resolve-comment': [comment: DepartmentCommunityCommentVO];
}>();

const canResolve = computed(() => props.postType === 'QUESTION' && props.postStatus !== 'RESOLVED');
</script>

<style scoped lang="scss">
.comment-replies { position: relative; margin: 0 0 3px 40px; padding: 0 0 0 12px; border-left: 1px solid #c7d8ee; }
.comment-thread + .comment-thread { margin-top: 5px; padding-top: 5px; border-top: 1px solid var(--community-line); }

/* 回复竖线归线程管理，评论项自身负责内容和操作样式。 */
:global(html.dark) .comment-replies,
:global(.dark) .comment-replies { border-left-color: #466b94; }

@media (max-width: 560px) {
  .comment-replies { margin-left: 39px; padding-right: 9px; padding-left: 11px; }
}
</style>
