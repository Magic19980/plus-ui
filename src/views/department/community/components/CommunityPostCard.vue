<template>
  <article class="post-card">
    <div class="post-author">
      <UserAvatar :size="42" :src="post.mine ? userAvatar || undefined : undefined" :oss-id="post.mine ? undefined : post.authorAvatar" :name="post.authorName" class="author-avatar" />
      <div class="author-info">
        <div class="author-line"><strong>{{ post.authorName || '匿名用户' }}</strong><span v-if="post.deptName" class="dept-name">{{ post.deptName }}</span></div>
        <span class="post-time">{{ post.createTime || '刚刚' }}</span>
      </div>
      <div class="post-header-actions" @click.stop>
        <el-button text class="post-detail-button" aria-label="查看内容详情" @click="emit('open-detail', post)"><el-icon><View /></el-icon>详情</el-button>
        <el-tag :type="postTypeTag(post.postType)" effect="light" round>{{ postTypeLabel(post.postType) }}</el-tag>
      </div>
    </div>

    <div class="post-main-grid" :class="{ 'has-media': postMedia.length }">
      <div v-if="postMedia.length" class="post-media-pane">
        <div v-if="postMedia.length > 4" class="post-media-carousel">
          <el-carousel height="360px" :autoplay="false" arrow="always" indicator-position="outside" trigger="click">
            <el-carousel-item v-for="(media, index) in postMedia" :key="media.ossId">
              <div class="post-carousel-slide">
                <button v-if="media.mediaType === 'IMAGE'" type="button" class="post-carousel-image" :aria-label="`查看第 ${index + 1} 张图片 ${media.fileName || ''}`" @click.stop="emit('preview-media', media)">
                  <img :src="media.previewUrl" alt="帖子图片，点击查看大图" loading="lazy" />
                </button>
                <div v-else class="post-carousel-video">
                  <video :src="media.previewUrl" controls playsinline preload="metadata" :aria-label="media.fileName || '社区视频'" :title="media.fileName || '社区视频'" @click.stop />
                </div>
                <span class="post-carousel-index">{{ index + 1 }} / {{ postMedia.length }}</span>
              </div>
            </el-carousel-item>
          </el-carousel>
        </div>
        <div v-else class="post-media-strip" :class="{ 'is-single-media': postMedia.length === 1 }">
          <div v-for="media in visiblePostMedia" :key="media.ossId" class="post-media-thumb">
            <button v-if="media.mediaType === 'IMAGE'" type="button" class="post-image-preview" :aria-label="`查看图片 ${media.fileName || ''}`" @click.stop="emit('preview-media', media)">
              <img :src="media.previewUrl" alt="帖子图片，点击查看大图" loading="lazy" />
            </button>
            <div v-else class="post-video-thumb">
              <video :src="media.previewUrl" controls playsinline preload="metadata" :aria-label="media.fileName || '社区视频'" :title="media.fileName || '社区视频'" @click.stop />
            </div>
          </div>
        </div>
      </div>

      <div class="post-content-pane">
        <h3>{{ post.title }}</h3>
        <p v-if="post.subtitle" class="post-subtitle">{{ post.subtitle }}</p>
        <div class="post-content-scroll">
          <CommunityTiptapEditor :model-value="post.content" read-only :min-height="0" :max-length="10000" />
          <div v-if="splitTags(post.tags).length" class="post-tags">
            <el-tag v-for="tag in splitTags(post.tags)" :key="tag" size="small" effect="plain"># {{ tag }}</el-tag>
          </div>
        </div>
      </div>
    </div>

    <div class="post-footer">
      <div class="post-state">
        <el-tag v-if="post.status === 'RESOLVED'" type="success" size="small" effect="plain"><el-icon><CircleCheck /></el-icon> 已解决</el-tag>
        <el-tag v-else-if="post.status === 'DRAFT'" type="info" size="small" effect="plain">草稿</el-tag>
        <span><el-icon><View /></el-icon>{{ post.viewCount || 0 }}</span>
      </div>
      <div class="post-actions" @click.stop>
        <el-button text :loading="isReactionLoading(post.id, 'LIKE')" :disabled="isReactionLoading(post.id, 'LIKE')" :class="{ reacted: post.liked }" @click="emit('toggle-reaction', post, 'LIKE')"><el-icon><Pointer /></el-icon>{{ post.likeCount || 0 }}</el-button>
        <el-button text :loading="isReactionLoading(post.id, 'FAVORITE')" :disabled="isReactionLoading(post.id, 'FAVORITE')" :class="{ reacted: post.favorited }" @click="emit('toggle-reaction', post, 'FAVORITE')"><el-icon><Star /></el-icon>{{ post.favoriteCount || 0 }}</el-button>
        <el-button text :class="{ reacted: isCommentsExpanded }" :aria-label="isCommentsExpanded ? '收起讨论' : '展开讨论'" @click="emit('toggle-comments', post)"><el-icon><ChatDotRound /></el-icon>{{ post.commentCount || 0 }}</el-button>
        <el-button v-if="post.mine" v-hasPermi="['department:community:edit']" text @click="emit('open-edit', post)"><el-icon><Edit /></el-icon>编辑</el-button>
        <el-button v-if="post.mine" v-hasPermi="['department:community:remove']" text type="danger" @click="emit('delete-post', post)"><el-icon><Delete /></el-icon></el-button>
      </div>
    </div>

    <section v-if="isCommentsExpanded" class="post-comments-panel" @click.stop>
      <div class="comments-panel-head">
        <div><strong>讨论</strong><span>{{ commentTotal }} 条评论</span><el-tag v-if="commentPost?.status === 'RESOLVED'" type="success" size="small" effect="plain" round>已解决</el-tag></div>
        <el-button text @click="emit('toggle-comments', post)">收起</el-button>
      </div>
      <div v-loading="commentPanelLoading" class="comments-panel-body">
        <template v-if="commentPost && String(commentPost.id) === String(post.id)">
          <div class="comment-editor">
            <UserAvatar :size="34" :src="userAvatar || undefined" :name="userNickname || '我'" class="author-avatar" />
            <div class="comment-input-wrap">
              <div v-if="replyingTo" class="reply-target">正在评论 {{ replyingTo.authorName || '这条评论' }}<el-button link type="primary" size="small" @click="emit('cancel-reply')">取消评论</el-button></div>
              <el-input ref="commentInputRef" v-model="commentForm.content" type="textarea" :rows="3" maxlength="2000" show-word-limit :placeholder="replyingTo ? '写下你的评论…' : '说说你的看法，或给出一个解决建议…'" />
              <div v-if="commentMediaItems.length" class="comment-media-draft-list">
                <div v-for="item in commentMediaItems" :key="item.key" class="comment-media-draft">
                  <img :src="item.localUrl || item.previewUrl" alt="评论图片" />
                  <div v-if="item.uploadStatus === 'uploading'" class="comment-media-uploading">上传中…</div>
                  <button type="button" class="comment-media-remove" aria-label="移除评论图片" @click="emit('remove-comment-media', item)">×</button>
                </div>
              </div>
              <div class="comment-composer-toolbar">
                <el-popover placement="bottom-start" trigger="click" width="292" :teleported="true">
                  <template #reference>
                    <el-button text class="comment-tool-button" aria-label="选择表情"><span class="comment-emoji-trigger">😊</span></el-button>
                  </template>
                  <div class="comment-emoji-picker" role="listbox" aria-label="选择表情">
                    <button v-for="emoji in emojiList" :key="emoji" type="button" class="comment-emoji" :aria-label="`插入表情 ${emoji}`" @click="insertEmoji(emoji)">{{ emoji }}</button>
                  </div>
                </el-popover>
                <el-upload
                  class="comment-image-uploader"
                  multiple
                  :show-file-list="false"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  :http-request="handleCommentMediaUpload"
                  :disabled="commentMediaUploading || commentMediaItems.length >= maxCommentMediaCount"
                >
                  <el-button text class="comment-tool-button" :disabled="commentMediaUploading || commentMediaItems.length >= maxCommentMediaCount" aria-label="添加图片"><el-icon><Picture /></el-icon></el-button>
                </el-upload>
                <span class="comment-composer-hint">图片 {{ commentMediaItems.length }}/{{ maxCommentMediaCount }}，支持 JPG、PNG、GIF、WEBP</span>
                <div class="comment-submit"><el-button v-hasPermi="['department:community:comment']" type="primary" size="small" :loading="commentLoading" @click="emit('submit-comment')">发表评论</el-button></div>
              </div>
            </div>
          </div>

          <div v-if="commentThreads.length" class="comment-list">
            <CommunityCommentThread
              v-for="thread in commentThreads"
              :key="thread.comment.id"
              :thread="thread"
              :post-type="commentPost?.postType"
              :post-status="commentPost?.status"
              :user-avatar="userAvatar || undefined"
              @preview-media="emit('preview-media', $event)"
              @reply-comment="replyComment"
              @delete-comment="emit('delete-comment', $event)"
              @resolve-comment="emit('resolve-comment', $event)"
            />
          </div>

          <div v-if="commentHasMore" class="comments-load-more">
            <el-button link type="primary" :loading="commentLoadingMore" @click="emit('load-more-comments')">查看剩余 {{ remainingCommentCount }} 条评论</el-button>
          </div>
          <el-empty v-if="!commentThreads.length" :image-size="60" description="还没有评论，欢迎参与讨论" />
        </template>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts" name="CommunityPostCard">
import type { InputInstance, UploadRequestOptions } from 'element-plus';
import { ChatDotRound, CircleCheck, Delete, Edit, Picture, Pointer, Star, View } from '@element-plus/icons-vue';
import { computed, nextTick, ref, toRefs } from 'vue';

import type { CommunityReactionType, DepartmentCommunityCommentForm, DepartmentCommunityCommentVO, DepartmentCommunityMediaVO, DepartmentCommunityPostVO } from '@/api/department/community/types';
import CommunityTiptapEditor from '@/components/CommunityTiptapEditor/index.vue';
import UserAvatar from '@/components/UserAvatar/index.vue';
import CommunityCommentThread from './CommunityCommentThread.vue';
import type { CommentThread } from '../composables/useCommunityComments';
import type { CommunityCommentMediaDraft } from '../composables/useCommunityCommentMedia';
import { mediaPreviewList, postAttachmentMedia, postTypeLabel, postTypeTag, splitTags } from '../utils';

const props = defineProps<{
  post: DepartmentCommunityPostVO;
  expanded: boolean;
  commentPost?: DepartmentCommunityPostVO;
  commentTotal: number;
  commentPanelLoading: boolean;
  commentThreads: CommentThread[];
  commentLoadingMore: boolean;
  commentHasMore: boolean;
  remainingCommentCount: number;
  commentForm: DepartmentCommunityCommentForm;
  commentMediaItems: CommunityCommentMediaDraft[];
  maxCommentMediaCount: number;
  commentMediaUploading: boolean;
  replyingTo?: DepartmentCommunityCommentVO;
  commentLoading: boolean;
  userAvatar?: string;
  userNickname?: string;
  emojiList: string[];
  isReactionLoading: (postId: string | number, type: CommunityReactionType) => boolean;
}>();

const emit = defineEmits<{
  'open-detail': [post: DepartmentCommunityPostVO];
  'preview-media': [media: DepartmentCommunityMediaVO];
  'toggle-reaction': [post: DepartmentCommunityPostVO, type: CommunityReactionType];
  'toggle-comments': [post: DepartmentCommunityPostVO];
  'open-edit': [post: DepartmentCommunityPostVO];
  'delete-post': [post: DepartmentCommunityPostVO];
  'handle-comment-media-upload': [options: UploadRequestOptions];
  'remove-comment-media': [item: CommunityCommentMediaDraft];
  'submit-comment': [];
  'cancel-reply': [];
  'reply-comment': [comment: DepartmentCommunityCommentVO];
  'delete-comment': [comment: DepartmentCommunityCommentVO];
  'resolve-comment': [comment: DepartmentCommunityCommentVO];
  'load-more-comments': [];
}>();

const {
  post,
  commentPost,
  commentTotal,
  commentPanelLoading,
  commentThreads,
  commentHasMore,
  remainingCommentCount,
  commentForm,
  commentMediaItems,
  maxCommentMediaCount,
  commentMediaUploading,
  replyingTo,
  commentLoading,
  userAvatar,
  userNickname,
  emojiList,
  isReactionLoading
} = toRefs(props);
const isCommentsExpanded = computed(() => props.expanded);
const postMedia = computed(() => postAttachmentMedia(post.value));
const visiblePostMedia = computed(() => mediaPreviewList(postMedia.value));
const commentInputRef = ref<InputInstance>();

/** 在当前评论输入框的光标处插入表情，避免事件回传后丢失输入焦点。 */
const insertEmoji = (emoji: string) => {
  const current = commentForm.value.content || '';
  const textarea = commentInputRef.value?.textarea as HTMLTextAreaElement | undefined;
  if (!textarea) {
    commentForm.value.content = current + emoji;
    return;
  }
  const start = textarea.selectionStart ?? current.length;
  const end = textarea.selectionEnd ?? start;
  commentForm.value.content = `${current.slice(0, start)}${emoji}${current.slice(end)}`;
  requestAnimationFrame(() => {
    textarea.focus();
    const cursor = start + emoji.length;
    textarea.setSelectionRange(cursor, cursor);
  });
};

/** 选择评论对象后聚焦输入框，让评论和回复保持同一条操作路径。 */
const replyComment = (comment: DepartmentCommunityCommentVO) => {
  emit('reply-comment', comment);
  nextTick(() => commentInputRef.value?.focus());
};

/** 将 Element Plus 上传回调转发给父页面，保持上传状态由页面统一提交。 */
const handleCommentMediaUpload = async (options: UploadRequestOptions) => {
  emit('handle-comment-media-upload', options);
};
</script>

<style scoped lang="scss">
.post-card { min-width: 0; padding: 0; border: 1px solid var(--community-line); border-radius: 18px; background: var(--community-surface); box-shadow: 0 10px 30px rgba(47, 73, 111, .055); cursor: pointer; overflow: hidden; transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
.post-card:hover { border-color: var(--community-line); box-shadow: 0 17px 38px rgba(47, 73, 111, .12); transform: translateY(-3px); }
.post-author, .post-footer, .author-line { display: flex; align-items: center; }
.post-author { gap: 11px; padding: 19px 20px 0; }
.author-avatar { flex: none; color: #fff; background: linear-gradient(135deg, #72aef0, #467cc7); font-weight: 700; }
.author-info { flex: 1; min-width: 0; }
.author-line { gap: 8px; }
.author-line strong { color: #243451; font-size: 14px; }
.dept-name { padding: 2px 7px; border-radius: 5px; color: #8090a9; background: #f2f5f9; font-size: 11px; }
.post-time { display: block; margin-top: 3px; color: #a2aec0; font-size: 12px; }
.post-header-actions { display: flex; align-items: center; gap: 8px; }
.post-detail-button { padding: 5px 7px; border-radius: 8px; color: #7a91ad; font-size: 12px; }
.post-detail-button:hover { color: var(--community-primary); background: #eef6ff; }
.post-main-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; padding: 17px 20px 8px; }
.post-main-grid.has-media { grid-template-columns: minmax(300px, 46%) minmax(0, 1fr); align-items: start; }
.post-media-pane { min-width: 0; align-self: start; }
.post-content-pane { display: flex; min-width: 0; min-height: 0; align-self: stretch; flex-direction: column; box-sizing: border-box; padding: 4px 14px 0 0; }
.post-content-pane h3 { flex: none; margin: 0 0 5px; color: #243451; font-size: 18px; font-weight: 700; line-height: 1.45; }
.post-subtitle { flex: none; margin: 0 0 11px; color: #596b86; font-size: 15px; font-weight: 500; line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
.post-content-scroll { flex: 1; min-height: 0; max-height: 294px; padding-right: 9px; overflow-y: auto; scrollbar-color: #b5c7df transparent; scrollbar-width: thin; }
.post-content-scroll::-webkit-scrollbar { width: 6px; }
.post-content-scroll::-webkit-scrollbar-track { background: transparent; }
.post-content-scroll::-webkit-scrollbar-thumb { border-radius: 8px; background: #b5c7df; }
.post-content-scroll :deep(.community-tiptap-editor) { width: 100%; overflow: visible; }
.post-content-scroll :deep(.tiptap) { padding: 0; color: #687792; }
.post-content-scroll :deep(.tiptap p) { white-space: pre-wrap; }
.post-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 11px; }
.post-media-strip { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.post-media-strip.is-single-media { grid-template-columns: minmax(0, 1fr); }
.post-media-thumb { position: relative; min-width: 0; aspect-ratio: 1.6; overflow: hidden; border-radius: 12px; background: #edf2f8; }
.post-media-thumb:only-child { width: 100%; aspect-ratio: 16 / 9; }
.post-image-preview { display: block; width: 100%; height: 100%; padding: 0; border: 0; cursor: zoom-in; background: transparent; }
.post-media-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.post-image-preview:hover img { filter: brightness(.94); }
.post-video-thumb { position: relative; width: 100%; height: 100%; overflow: hidden; background: #071222; }
.post-video-thumb > video { display: block; width: 100%; height: 100%; object-fit: cover; background: #071222; border: 0; outline: 0; transform: scale(1.01); transform-origin: center; }
.post-media-carousel { min-width: 0; }
.post-media-carousel :deep(.el-carousel__container) { height: clamp(300px, 29vw, 420px) !important; overflow: hidden; border-radius: 12px; }
.post-media-carousel :deep(.el-carousel__arrow) { color: #fff; background: rgba(13, 24, 42, .66); }
.post-media-carousel :deep(.el-carousel__indicators--outside) { margin-top: 2px; }
.post-media-carousel :deep(.el-carousel__button) { width: 18px; background: var(--community-primary); }
.post-carousel-slide { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: 12px; background: #edf2f8; }
.post-carousel-image, .post-carousel-video { display: block; width: 100%; height: 100%; padding: 0; border: 0; }
.post-carousel-image { cursor: zoom-in; background: transparent; }
.post-carousel-image img { display: block; width: 100%; height: 100%; object-fit: contain; }
.post-carousel-image:hover img { filter: brightness(.94); }
.post-carousel-video { background: #071222; }
.post-carousel-video > video { display: block; width: 100%; height: 100%; object-fit: cover; background: #071222; border: 0; outline: 0; transform: scale(1.01); transform-origin: center; }
.post-carousel-index { position: absolute; top: 12px; right: 12px; padding: 4px 9px; border: 1px solid rgba(255, 255, 255, .26); border-radius: 999px; color: #fff; background: rgba(13, 24, 42, .68); box-shadow: 0 2px 8px rgba(13, 24, 42, .16); font-size: 11px; line-height: 1.4; pointer-events: none; }
.post-footer { justify-content: space-between; margin-top: 8px; padding: 13px 20px 16px; border-top: 1px solid var(--community-line); }
.post-comments-panel { padding: 0 20px 18px; border-top: 1px solid var(--community-line); background: transparent; }
.comments-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 11px 0 9px; }
.comments-panel-head > div { display: flex; align-items: center; gap: 9px; }
.comments-panel-head strong { color: var(--community-ink); font-size: 14px; }
.comments-panel-head span { color: var(--community-muted); font-size: 12px; }
.comments-panel-head .el-button { color: var(--community-muted); }
.comments-panel-body { min-height: 48px; }
.post-state, .post-actions { display: flex; align-items: center; gap: 12px; color: #9aa7b9; font-size: 12px; }
.post-state span { display: inline-flex; align-items: center; gap: 4px; }
.post-actions { gap: 4px; }
.post-actions :deep(.el-button) { color: #9aa7b9; }
.post-actions :deep(.el-button:hover), .post-actions :deep(.el-button.reacted) { color: var(--community-primary); }
.comment-editor { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid var(--community-line); border-radius: 12px; background: transparent; }
.comment-input-wrap { flex: 1; }
.reply-target { display: flex; align-items: center; gap: 4px; margin-bottom: 7px; color: #7d8aa5; font-size: 12px; }
.comment-composer-toolbar { display: flex; align-items: center; gap: 4px; min-height: 31px; margin-top: 5px; }
.comment-tool-button { width: 30px; height: 30px; padding: 0; color: #7f91aa; }
.comment-tool-button:hover { color: var(--community-primary); background: #eaf3ff; }
.comment-emoji-trigger { font-size: 17px; line-height: 1; }
.comment-image-uploader { display: inline-flex; }
.comment-composer-hint { margin-left: 5px; color: #9aa8ba; font-size: 11px; }
.comment-media-draft-list { display: flex; flex-wrap: wrap; gap: 8px; }
.comment-media-draft-list { margin-top: 8px; }
.comment-media-draft { position: relative; width: 68px; height: 68px; overflow: hidden; border: 1px solid var(--community-line); border-radius: 8px; background: #edf2f8; }
.comment-media-draft > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.comment-media-uploading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; background: rgba(13, 33, 61, .56); font-size: 11px; }
.comment-media-remove { position: absolute; top: 3px; right: 3px; display: flex; width: 18px; height: 18px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #fff; background: rgba(13, 24, 42, .68); cursor: pointer; font-size: 14px; line-height: 1; }
.comment-submit { display: flex; justify-content: flex-end; margin-top: 0; margin-left: auto; }
.comment-list { margin-top: 12px; padding: 0 4px 2px; }

/* 只保留评论输入框的边界，正文、评论区和线程共享帖子底色，避免出现横向色块。 */
.post-content-scroll :deep(.community-tiptap-editor.is-readonly .tiptap) { background: transparent; }
.comments-load-more { display: flex; align-items: center; justify-content: center; min-height: 36px; margin-top: 8px; border-top: 1px solid var(--community-line); }
.comments-load-more :deep(.el-button) { margin: 0; color: var(--community-primary); font-size: 12px; }

/* 卡片已拆为独立组件，深色主题需要在组件自身作用域内覆盖固定色值。 */
:global(html.dark) .post-card,
:global(.dark) .post-card { border-color: var(--community-line); background: var(--community-surface); box-shadow: 0 18px 42px rgba(0, 0, 0, .22); }
:global(html.dark) .post-card:hover,
:global(.dark) .post-card:hover { border-color: var(--community-line); background: var(--community-surface-raised); }
:global(html.dark) .author-line strong,
:global(html.dark) .post-content-pane h3,
:global(.dark) .author-line strong,
:global(.dark) .post-content-pane h3 { color: #e1e9f5; }
:global(html.dark) .post-subtitle,
:global(.dark) .post-subtitle { color: #b4c3d7; }
:global(html.dark) .post-detail-button,
:global(.dark) .post-detail-button { color: #9aaac0; }
:global(html.dark) .post-detail-button:hover,
:global(.dark) .post-detail-button:hover { color: #86baff; background: #203d61; }
:global(html.dark) .dept-name,
:global(.dark) .dept-name { color: #a3b1c4; background: #253247; }
:global(html.dark) .post-content-scroll :deep(.tiptap),
:global(.dark) .post-content-scroll :deep(.tiptap) { color: #abb9cc; }
:global(html.dark) .post-content-scroll,
:global(.dark) .post-content-scroll { scrollbar-color: #526b8a transparent; }
:global(html.dark) .post-content-scroll::-webkit-scrollbar-thumb,
:global(.dark) .post-content-scroll::-webkit-scrollbar-thumb { background: #526b8a; }
:global(html.dark) .post-media-thumb,
:global(html.dark) .post-carousel-slide,
:global(.dark) .post-media-thumb,
:global(.dark) .post-carousel-slide { background: #243247; }
:global(html.dark) .comment-emoji:hover,
:global(.dark) .comment-emoji:hover { background: #203d61; }

@media (max-width: 560px) {
  .post-main-grid, .post-footer { padding-right: 16px; padding-left: 16px; }
  .post-main-grid.has-media { grid-template-columns: 1fr; }
  .post-content-pane { padding-right: 0; }
  .post-content-scroll { max-height: none; padding-right: 0; overflow: visible; }
  .post-media-carousel :deep(.el-carousel__container) { height: 220px !important; }
  .post-comments-panel { padding-right: 16px; padding-left: 16px; }
  .comment-composer-hint { display: none; }
  .post-actions { flex-wrap: wrap; justify-content: flex-end; }
}
</style>
