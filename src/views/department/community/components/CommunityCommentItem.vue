<template>
  <article class="comment-item" :class="{ 'comment-item--root': isRoot, 'comment-item--reply': !isRoot }" :style="replyStyle">
    <UserAvatar
      :size="isRoot ? 32 : 28"
      :src="comment.mine ? userAvatar || undefined : undefined"
      :oss-id="comment.mine ? undefined : comment.authorAvatar"
      :name="comment.authorName"
      class="author-avatar"
    />
    <div class="comment-main">
      <div class="comment-line">
        <strong>{{ comment.authorName || '匿名用户' }}</strong><span class="comment-separator">：</span><span v-if="replyToName" class="reply-context">回复 @{{ replyToName }}：</span><span class="comment-content">{{ comment.content }}</span>
      </div>
      <div v-if="comment.mediaList?.length" class="comment-media-list">
        <button v-for="media in comment.mediaList" :key="media.ossId" type="button" class="comment-media-thumb" @click="emit('preview-media', media)">
          <img :src="media.previewUrl" alt="评论图片" loading="lazy" />
        </button>
      </div>
      <div class="comment-meta">
        <span class="comment-time"><span v-if="comment.deptName" class="comment-dept">{{ comment.deptName }}</span><span v-if="comment.deptName" class="comment-meta-divider">·</span>{{ comment.createTime }}</span>
        <div class="comment-actions">
          <el-button v-if="comment.mine" v-hasPermi="['department:community:comment']" link type="danger" size="small" @click="emit('delete-comment', comment)">删除</el-button>
          <el-button v-hasPermi="['department:community:comment']" link type="primary" size="small" @click="emit('reply-comment', comment)">评论</el-button>
          <el-button v-if="canResolve" v-hasPermi="['department:community:edit']" link type="success" size="small" @click="emit('resolve-comment', comment)">采纳为解决方案</el-button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts" name="CommunityCommentItem">
import { computed } from 'vue';

import type { DepartmentCommunityCommentVO, DepartmentCommunityMediaVO } from '@/api/department/community/types';
import UserAvatar from '@/components/UserAvatar/index.vue';

const props = withDefaults(
  defineProps<{
    comment: DepartmentCommunityCommentVO;
    isRoot?: boolean;
    replyDepth?: number;
    replyToName?: string;
    canResolve?: boolean;
    userAvatar?: string;
  }>(),
  {
    isRoot: false,
    replyDepth: 1,
    replyToName: '',
    canResolve: false,
    userAvatar: ''
  }
);

const emit = defineEmits<{
  'preview-media': [media: DepartmentCommunityMediaVO];
  'reply-comment': [comment: DepartmentCommunityCommentVO];
  'delete-comment': [comment: DepartmentCommunityCommentVO];
  'resolve-comment': [comment: DepartmentCommunityCommentVO];
}>();

/** 将回复层级限制在视觉可读范围内，避免深层嵌套把内容挤出卡片。 */
const replyStyle = computed(() => (props.isRoot ? undefined : { '--reply-depth': Math.min(Math.max(props.replyDepth, 1), 3) }));
</script>

<style scoped lang="scss">
.comment-item { display: flex; gap: 10px; padding: 8px 0; border-top: 1px solid #f0f3f7; }
.comment-item--root { padding-top: 6px; padding-bottom: 6px; border-top: 0; }
.comment-main { flex: 1; min-width: 0; }
.comment-line { color: #5b6b84; font-size: 13px; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.comment-line strong { color: #2b3b58; font-size: 13px; font-weight: 700; }
.comment-separator { color: #7b899e; }
.comment-content { color: #5b6b84; }
.comment-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 17px; margin-top: 3px; }
.comment-time { display: inline-flex; align-items: center; gap: 5px; color: #9ca9ba; font-size: 11px; line-height: 1.3; }
.comment-dept { color: #8492a6; }
.comment-meta-divider { color: #bdc7d4; }
.comment-actions { display: flex; align-items: center; gap: 8px; }
.comment-actions :deep(.el-button) { margin: 0; padding: 0; color: #94a3b8; font-size: 11px; }
.comment-item--reply { position: relative; margin-left: calc((var(--reply-depth, 1) - 1) * 22px); padding: 6px 0; border-top-color: #e8eef6; }
.comment-item--reply:first-of-type { border-top: 0; }
.comment-item--reply .comment-main { width: 100%; }
.reply-context { margin-right: 4px; color: #6a85a7; font-size: 12px; font-weight: 650; }
.comment-media-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 7px; }
.comment-media-thumb { width: 72px; height: 72px; padding: 0; overflow: hidden; border: 1px solid var(--community-line); border-radius: 8px; background: #edf2f8; cursor: zoom-in; }
.comment-media-thumb > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.comment-media-thumb:hover { border-color: var(--community-primary); box-shadow: 0 3px 12px rgba(63, 142, 234, .18); }

/* 评论项独立维护深色主题，避免它被放入不同容器后继承到浅色文字。 */
:global(html.dark) .comment-item,
:global(.dark) .comment-item { border-top-color: #26354b; }
:global(html.dark) .comment-item--reply,
:global(.dark) .comment-item--reply { border-top-color: #2a3850; }
:global(html.dark) .comment-line,
:global(html.dark) .comment-content,
:global(.dark) .comment-line,
:global(.dark) .comment-content { color: #abb9cc; }
:global(html.dark) .comment-line strong,
:global(.dark) .comment-line strong { color: #e1e9f5; }
:global(html.dark) .comment-time,
:global(.dark) .comment-time { color: #8fa3bd; }
:global(html.dark) .comment-dept,
:global(.dark) .comment-dept { color: #a6b7ca; }
:global(html.dark) .comment-meta-divider,
:global(.dark) .comment-meta-divider { color: #5c718d; }
:global(html.dark) .comment-separator,
:global(.dark) .comment-separator { color: #8da0b8; }
:global(html.dark) .reply-context,
:global(.dark) .reply-context { color: #a9c9ed; }
:global(html.dark) .comment-media-thumb,
:global(.dark) .comment-media-thumb { background: #243247; }

@media (max-width: 560px) {
  .comment-item--reply { margin-left: calc((var(--reply-depth, 1) - 1) * 18px); }
  .comment-meta { align-items: flex-start; gap: 6px; }
  .comment-actions { flex-wrap: wrap; justify-content: flex-end; }
}
</style>
