<template>
  <div class="p-2 app-container department-community-page">
    <el-card shadow="never" class="community-hero">
      <div class="hero-main">
        <div>
          <span class="hero-kicker">COLLABORATION COMMUNITY</span>
          <h2>协作社区</h2>
          <p>把日常经验、问题求助和改进想法放到一起，让跨部门协作更顺畅。</p>
        </div>
        <div class="hero-actions">
          <el-button v-hasPermi="['department:community:moderate']" plain @click="openReportAdmin">举报处理</el-button>
        </div>
      </div>
      <div class="hero-summary">
        <div class="summary-item">
          <span class="summary-icon blue"><el-icon><ChatDotRound /></el-icon></span>
          <div><strong>{{ total }}</strong><span>可见内容</span></div>
        </div>
        <div class="summary-item">
          <span class="summary-icon green"><el-icon><Connection /></el-icon></span>
          <div><strong>开放</strong><span>跨部门交流</span></div>
        </div>
        <div class="summary-item">
          <span class="summary-icon orange"><el-icon><CircleCheck /></el-icon></span>
          <div><strong>沉淀</strong><span>问题可标记解决</span></div>
        </div>
        <div class="hero-tip"><el-icon><InfoFilled /></el-icon><span>社区用于讨论交流，正式制度和成果请归档到资料库或提交 SCORE 提案。</span></div>
      </div>
    </el-card>

    <div class="community-layout mt-2">
      <el-card shadow="never" class="community-card">
        <div class="community-toolbar">
          <div class="feed-tabs">
            <button v-for="item in feedOptions" :key="item.value" class="feed-tab" :class="{ active: queryParams.feed === item.value }" @click="changeFeed(item.value)">
              <el-icon><component :is="item.icon" /></el-icon>{{ item.label }}
            </button>
          </div>
          <div class="filter-actions">
            <el-input v-model="queryParams.keyword" clearable class="keyword-input" placeholder="搜索标题、副标题、内容或标签" @keyup.enter="handleQuery">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-select v-model="queryParams.postType" clearable class="type-select" placeholder="全部类型" @change="handleQuery">
              <el-option v-for="item in postTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          </div>
        </div>

        <div v-loading="loading" class="post-list">
          <article v-for="post in postList" :key="post.id" class="post-card">
            <div class="post-author">
              <el-avatar :size="42" :src="post.mine ? userStore.avatar || undefined : undefined" class="author-avatar">{{ avatarText(post.authorName) }}</el-avatar>
              <div class="author-info">
                <div class="author-line"><strong>{{ post.authorName || '匿名用户' }}</strong><span v-if="post.deptName" class="dept-name">{{ post.deptName }}</span></div>
                <span class="post-time">{{ post.createTime || '刚刚' }}</span>
              </div>
              <div class="post-header-actions" @click.stop>
                <el-button text class="post-detail-button" aria-label="查看内容详情" @click="openPostDetail(post)"><el-icon><View /></el-icon>详情</el-button>
                <el-tag :type="postTypeTag(post.postType)" effect="light" round>{{ postTypeLabel(post.postType) }}</el-tag>
              </div>
            </div>
            <div class="post-main-grid" :class="{ 'has-media': postAttachmentMedia(post).length }">
              <div v-if="postAttachmentMedia(post).length" class="post-media-pane">
                <div v-if="postAttachmentMedia(post).length > 4" class="post-media-carousel">
                  <el-carousel height="360px" :autoplay="false" arrow="always" indicator-position="outside" trigger="click">
                    <el-carousel-item v-for="(media, index) in postAttachmentMedia(post)" :key="media.ossId">
                      <div class="post-carousel-slide">
                        <button v-if="media.mediaType === 'IMAGE'" type="button" class="post-carousel-image" :aria-label="`查看第 ${index + 1} 张图片 ${media.fileName || ''}`" @click.stop="previewMedia(media)">
                          <img :src="media.previewUrl" alt="帖子图片，点击查看大图" loading="lazy" />
                        </button>
                        <div v-else class="post-carousel-video">
                          <video :src="media.previewUrl" controls playsinline preload="metadata" :aria-label="media.fileName || '社区视频'" :title="media.fileName || '社区视频'" @click.stop />
                        </div>
                        <span class="post-carousel-index">{{ index + 1 }} / {{ postAttachmentMedia(post).length }}</span>
                      </div>
                    </el-carousel-item>
                  </el-carousel>
                </div>
                <div v-else class="post-media-strip" :class="{ 'is-single-media': postAttachmentMedia(post).length === 1 }">
                  <div v-for="media in mediaPreviewList(postAttachmentMedia(post))" :key="media.ossId" class="post-media-thumb">
                    <button v-if="media.mediaType === 'IMAGE'" type="button" class="post-image-preview" :aria-label="`查看图片 ${media.fileName || ''}`" @click.stop="previewMedia(media)">
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
                  <CommunityTiptapEditor
                    :model-value="post.content"
                    read-only
                    :min-height="0"
                    :max-length="10000"
                  />
                  <div v-if="splitTags(post.tags).length" class="post-tags">
                    <el-tag v-for="tag in splitTags(post.tags)" :key="tag" size="small" effect="plain"># {{ tag }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
            <div class="post-footer">
              <div class="post-state"><el-tag v-if="post.status === 'RESOLVED'" type="success" size="small" effect="plain"><el-icon><CircleCheck /></el-icon> 已解决</el-tag><el-tag v-else-if="post.status === 'DRAFT'" type="info" size="small" effect="plain">草稿</el-tag><span><el-icon><View /></el-icon>{{ post.viewCount || 0 }}</span></div>
              <div class="post-actions" @click.stop>
                <el-button text :class="{ reacted: post.liked }" @click="toggleReaction(post, 'LIKE')"><el-icon><Pointer /></el-icon>{{ post.likeCount || 0 }}</el-button>
                <el-button text :class="{ reacted: post.favorited }" @click="toggleReaction(post, 'FAVORITE')"><el-icon><Star /></el-icon>{{ post.favoriteCount || 0 }}</el-button>
                <el-button text :class="{ reacted: expandedCommentPostId === post.id }" :aria-label="expandedCommentPostId === post.id ? '收起讨论' : '展开讨论'" @click="toggleComments(post)"><el-icon><ChatDotRound /></el-icon>{{ post.commentCount || 0 }}</el-button>
                <el-button v-if="post.mine" v-hasPermi="['department:community:edit']" text @click="openEdit(post)"><el-icon><Edit /></el-icon>编辑</el-button>
                <el-button v-if="post.mine" v-hasPermi="['department:community:remove']" text type="danger" @click="handleDelete(post)"><el-icon><Delete /></el-icon></el-button>
              </div>
            </div>
            <section v-if="expandedCommentPostId === post.id" class="post-comments-panel" @click.stop>
              <div class="comments-panel-head">
                <div><strong>讨论</strong><span>{{ commentTotal }} 条评论</span><el-tag v-if="commentPost?.status === 'RESOLVED'" type="success" size="small" effect="plain" round>已解决</el-tag></div>
                <el-button text @click="toggleComments(post)">收起</el-button>
              </div>
              <div v-loading="commentPanelLoading" class="comments-panel-body">
                <template v-if="commentPost && String(commentPost.id) === String(post.id)">
                  <div class="comment-editor">
                    <el-avatar :size="34" :src="userStore.avatar || undefined" class="author-avatar">{{ avatarText(userStore.nickname || '我') }}</el-avatar>
                    <div class="comment-input-wrap">
                      <div v-if="replyingTo" class="reply-target">正在评论 {{ replyingTo.authorName || '这条评论' }}<el-button link type="primary" size="small" @click="cancelReply">取消评论</el-button></div>
                      <el-input ref="commentInputRef" v-model="commentForm.content" type="textarea" :rows="3" maxlength="2000" show-word-limit :placeholder="replyingTo ? '写下你的评论…' : '说说你的看法，或给出一个解决建议…'" />
                      <div v-if="commentMediaItems.length" class="comment-media-draft-list">
                        <div v-for="item in commentMediaItems" :key="item.key" class="comment-media-draft">
                          <img :src="item.localUrl || item.previewUrl" alt="评论图片" />
                          <div v-if="item.uploadStatus === 'uploading'" class="comment-media-uploading">上传中…</div>
                          <button type="button" class="comment-media-remove" aria-label="移除评论图片" @click="removeCommentMedia(item)">×</button>
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
                        <div class="comment-submit"><el-button v-hasPermi="['department:community:comment']" type="primary" size="small" :loading="commentLoading" @click="submitComment">发表评论</el-button></div>
                      </div>
                    </div>
                  </div>
                  <div v-if="commentThreads.length" class="comment-list">
                    <div v-for="thread in commentThreads" :key="thread.comment.id" class="comment-thread">
                      <article class="comment-item comment-item--root">
                        <el-avatar :size="32" :src="thread.comment.mine ? userStore.avatar || undefined : undefined" class="author-avatar">{{ avatarText(thread.comment.authorName) }}</el-avatar>
                          <div class="comment-main">
                            <div class="comment-line"><strong>{{ thread.comment.authorName || '匿名用户' }}</strong><span class="comment-separator">：</span><span class="comment-content">{{ thread.comment.content }}</span></div>
                            <div v-if="thread.comment.mediaList?.length" class="comment-media-list">
                              <button v-for="media in thread.comment.mediaList" :key="media.ossId" type="button" class="comment-media-thumb" @click="previewMedia(media)"><img :src="media.previewUrl" alt="评论图片" loading="lazy" /></button>
                            </div>
                          <div class="comment-meta">
                            <span class="comment-time"><span v-if="thread.comment.deptName" class="comment-dept">{{ thread.comment.deptName }}</span><span v-if="thread.comment.deptName" class="comment-meta-divider">·</span>{{ thread.comment.createTime }}</span>
                            <div class="comment-actions">
                              <el-button v-if="thread.comment.mine" v-hasPermi="['department:community:comment']" link type="danger" size="small" @click="handleDeleteComment(thread.comment)">删除</el-button>
                              <el-button v-hasPermi="['department:community:comment']" link type="primary" size="small" @click="handleReply(thread.comment)">评论</el-button>
                              <el-button v-if="commentPost.postType === 'QUESTION' && commentPost.status !== 'RESOLVED'" v-hasPermi="['department:community:edit']" link type="success" size="small" @click="resolveComment(thread.comment)">采纳为解决方案</el-button>
                            </div>
                          </div>
                        </div>
                      </article>
                      <div v-if="thread.replies.length" class="comment-replies">
                        <article v-for="reply in thread.replies" :key="reply.id" class="comment-item comment-item--reply" :style="{ '--reply-depth': Math.min(reply.depth, 3) }">
                          <div class="comment-main">
                            <div class="comment-line"><strong>{{ reply.authorName || '匿名用户' }}</strong><span class="comment-separator">：</span><span v-if="reply.replyToName" class="reply-context">回复 @{{ reply.replyToName }}：</span><span class="comment-content">{{ reply.content }}</span></div>
                            <div v-if="reply.mediaList?.length" class="comment-media-list">
                              <button v-for="media in reply.mediaList" :key="media.ossId" type="button" class="comment-media-thumb" @click="previewMedia(media)"><img :src="media.previewUrl" alt="评论图片" loading="lazy" /></button>
                            </div>
                            <div class="comment-meta">
                              <span class="comment-time"><span v-if="reply.deptName" class="comment-dept">{{ reply.deptName }}</span><span v-if="reply.deptName" class="comment-meta-divider">·</span>{{ reply.createTime }}</span>
                              <div class="comment-actions">
                                <el-button v-if="reply.mine" v-hasPermi="['department:community:comment']" link type="danger" size="small" @click="handleDeleteComment(reply)">删除</el-button>
                                <el-button v-hasPermi="['department:community:comment']" link type="primary" size="small" @click="handleReply(reply)">评论</el-button>
                                <el-button v-if="commentPost.postType === 'QUESTION' && commentPost.status !== 'RESOLVED'" v-hasPermi="['department:community:edit']" link type="success" size="small" @click="resolveComment(reply)">采纳为解决方案</el-button>
                              </div>
                            </div>
                          </div>
                        </article>
                      </div>
                    </div>
                  </div>
                  <div v-if="commentHasMore" class="comments-load-more">
                    <el-button link type="primary" :loading="commentLoadingMore" @click="loadMoreComments">查看剩余 {{ remainingCommentCount }} 条评论</el-button>
                  </div>
                  <el-empty v-if="!commentThreads.length" :image-size="60" description="还没有评论，欢迎参与讨论" />
                </template>
              </div>
            </section>
          </article>
          <el-empty v-if="!loading && !postList.length" description="还没有内容，来发布第一条吧" />
        </div>
        <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
      </el-card>

      <aside class="community-aside">
        <section class="aside-card">
          <div class="aside-card-head">
            <span class="aside-card-icon blue"><el-icon><InfoFilled /></el-icon></span>
            <div><strong>社区小贴士</strong><small>让每次交流更有价值</small></div>
          </div>
          <div class="aside-rule"><span>01</span><div><strong>先说结论</strong><small>标题写清楚问题或经验，方便大家快速理解。</small></div></div>
          <div class="aside-rule"><span>02</span><div><strong>补充背景</strong><small>描述现象、影响和你已经尝试过的办法。</small></div></div>
          <div class="aside-rule"><span>03</span><div><strong>留下沉淀</strong><small>有价值的讨论可以标记解决，成果再归档到资料库。</small></div></div>
        </section>
        <section class="aside-card aside-cta">
          <span class="aside-cta-kicker">START A TOPIC</span>
          <strong>把经验分享出来</strong>
          <p>遇到问题、总结经验或提出改进想法，都可以在这里开启讨论。</p>
          <el-button v-hasPermi="['department:community:add']" type="primary" plain @click="openCreate">发布内容</el-button>
        </section>
      </aside>
    </div>

    <el-dialog v-model="postDialog.visible" :title="postDialog.title" width="min(960px, 92vw)" append-to-body destroy-on-close class="community-post-dialog">
      <el-form ref="postFormRef" :model="postForm" :rules="postRules" label-position="top">
        <el-form-item label="标题" prop="title"><el-input v-model="postForm.title" maxlength="200" show-word-limit placeholder="用一句话说清楚你想讨论什么" /></el-form-item>
        <el-form-item label="副标题（可选）"><el-input v-model="postForm.subtitle" maxlength="300" show-word-limit placeholder="补充说明主题，可不填写" /></el-form-item>
        <div class="form-grid">
          <el-form-item label="内容类型" prop="postType">
            <el-select v-model="postForm.postType" style="width: 100%">
              <el-option v-for="item in postTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="可见范围" prop="visibility">
            <el-select v-model="postForm.visibility" style="width: 100%">
              <el-option label="全员可见" value="ALL" />
              <el-option label="本部门可见" value="DEPT" />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="话题标签">
          <el-input v-model="postForm.tags" maxlength="500" placeholder="多个标签用逗号分隔，如：系统、效率、经验" />
        </el-form-item>
        <el-form-item class="community-content-item" label="正文" prop="content">
          <CommunityTiptapEditor v-model="postForm.content" v-model:media-oss-ids="inlineMediaOssIds" v-model:uploading="editorUploading" :min-height="390" :max-length="10000" />
        </el-form-item>
        <div class="media-field">
          <div class="media-field-head">
            <div><strong>附加图片与视频</strong><span>可选附件</span></div>
            <span class="media-count">{{ mediaItems.length }}/{{ maxMediaCount }}</span>
          </div>
          <div class="media-field-description">正文中的图片会按排版位置显示；这里用于添加不需要插入正文的独立附件。<span v-if="mediaItems.length" class="media-drag-tip">拖动缩略图可调整展示顺序</span></div>
          <div class="media-upload-row">
            <el-upload
              class="community-media-uploader"
              multiple
              :show-file-list="false"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg"
              :http-request="handleMediaUpload"
              :disabled="mediaItems.length >= maxMediaCount"
            >
              <div class="media-add-card" :class="{ disabled: mediaItems.length >= maxMediaCount }">
                <span class="media-add-icon"><el-icon><Picture /></el-icon></span>
                <span class="media-add-title">{{ mediaItems.length >= maxMediaCount ? '已达到附件上限' : '选择图片或视频' }}</span>
                <span class="media-add-subtitle">支持 Ctrl / Shift 多选</span>
              </div>
            </el-upload>
            <div class="media-upload-note">
              <span>图片 JPG、PNG、GIF、WEBP，单个不超过 10MB</span>
              <span>视频 MP4、WebM、Ogg，单个不超过 500MB</span>
              <span v-if="mediaUploading" class="is-uploading"><el-icon class="is-loading"><Loading /></el-icon> 正在上传附件…</span>
            </div>
          </div>
          <div v-if="mediaItems.length" class="compose-media-grid">
            <div
              v-for="(item, index) in mediaItems"
              :key="item.key"
              class="compose-media-item"
              :class="{ 'is-dragging': draggingMediaKey === item.key, 'is-drag-over': dragOverMediaKey === item.key }"
              draggable="true"
              @dragstart="handleMediaDragStart($event, item)"
              @dragover.prevent="handleMediaDragOver(item)"
              @drop.prevent="handleMediaDrop(item)"
              @dragend="clearMediaDrag"
            >
              <div class="compose-media-preview">
                <span class="compose-media-order">{{ index + 1 }}</span>
                <img v-if="item.mediaType === 'IMAGE'" :src="item.localUrl || item.previewUrl" alt="待发布图片" />
                <div v-else class="compose-video-tile"><el-icon><VideoCamera /></el-icon><span>视频附件</span></div>
                <div v-if="item.uploadStatus === 'uploading'" class="media-uploading"><el-icon class="is-loading"><Loading /></el-icon> 上传中…</div>
                <button type="button" class="compose-media-remove" aria-label="移除媒体" @click="removeMedia(item)">×</button>
              </div>
              <div class="compose-media-info">
                <span class="compose-media-type">{{ item.mediaType === 'IMAGE' ? '图片' : '视频' }}</span>
                <span class="compose-media-name" :title="item.fileName">{{ item.fileName || '未命名附件' }}</span>
              </div>
            </div>
          </div>
          <div v-else class="media-empty-state">
            <el-icon><Picture /></el-icon>
            <span>暂未添加图片或视频</span>
            <small>附件会显示在这里，发布前可随时移除</small>
          </div>
          <div class="media-field-hint">发布后，图片会以画廊形式展示，视频可在信息流内直接播放。</div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="postDialog.visible = false">取消</el-button>
        <el-button :loading="buttonLoading" @click="submitPost('DRAFT')">保存草稿</el-button>
        <el-button type="primary" :loading="buttonLoading" @click="submitPost('PUBLISHED')">{{ postForm.id ? '保存并发布' : '发布' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="postDetailDialog.visible" width="min(1080px, 92vw)" append-to-body destroy-on-close class="community-post-detail-dialog" :show-close="false">
      <template #header>
        <div class="post-detail-dialog-header">
          <div>
            <span class="post-detail-eyebrow">POST DETAIL</span>
            <strong>内容详情</strong>
          </div>
          <el-button circle text icon="Close" aria-label="关闭内容详情" @click="postDetailDialog.visible = false" />
        </div>
      </template>
      <div v-loading="postDetailDialog.loading" class="post-detail-body">
        <template v-if="detailPost">
          <main class="post-detail-main">
            <div class="post-detail-type-row">
              <el-tag :type="postTypeTag(detailPost.postType)" effect="light" round>{{ postTypeLabel(detailPost.postType) }}</el-tag>
              <el-tag v-if="detailPost.status === 'RESOLVED'" type="success" effect="plain" round><el-icon><CircleCheck /></el-icon> 已解决</el-tag>
              <el-tag v-else-if="detailPost.status === 'DRAFT'" type="info" effect="plain" round>草稿</el-tag>
            </div>
            <h2>{{ detailPost.title }}</h2>
            <p v-if="detailPost.subtitle" class="post-detail-subtitle">{{ detailPost.subtitle }}</p>
            <div class="post-detail-author">
              <el-avatar :size="38" :src="detailPost.mine ? userStore.avatar || undefined : undefined" class="author-avatar">{{ avatarText(detailPost.authorName) }}</el-avatar>
              <div>
                <div class="post-detail-author-line"><strong>{{ detailPost.authorName || '匿名用户' }}</strong><span v-if="detailPost.deptName" class="dept-name">{{ detailPost.deptName }}</span></div>
                <span>{{ detailPost.createTime || '刚刚' }}</span>
              </div>
            </div>
            <div class="post-detail-divider" />
            <article class="post-detail-copy"><CommunityTiptapEditor :model-value="detailPost.content" read-only :min-height="0" :max-length="10000" /></article>
            <div v-if="splitTags(detailPost.tags).length" class="post-detail-tags">
              <el-tag v-for="tag in splitTags(detailPost.tags)" :key="tag" size="small" effect="plain"># {{ tag }}</el-tag>
            </div>
            <section v-if="detailAttachmentMedia.length" class="post-detail-media-section">
              <div class="post-detail-section-head"><strong>附件</strong><span>{{ detailAttachmentMedia.length }} 个媒体文件</span></div>
              <div class="post-detail-media-grid" :class="{ 'is-single-media': detailAttachmentMedia.length === 1 }">
                <template v-for="media in detailAttachmentMedia" :key="media.ossId">
                  <button v-if="media.mediaType === 'IMAGE'" type="button" class="post-detail-media-image" :aria-label="`查看图片 ${media.fileName || ''}`" @click.stop="previewMedia(media)">
                    <img :src="media.previewUrl" alt="帖子图片，点击查看大图" loading="lazy" />
                  </button>
                  <div v-else class="post-detail-media-video">
                    <video :src="media.previewUrl" controls playsinline preload="metadata" :aria-label="media.fileName || '社区视频'" :title="media.fileName || '社区视频'" @click.stop />
                  </div>
                </template>
              </div>
            </section>
          </main>
          <aside class="post-detail-aside">
            <section class="post-detail-side-card">
              <div class="post-detail-side-heading"><span class="post-detail-side-icon"><el-icon><InfoFilled /></el-icon></span><div><strong>内容信息</strong><small>这条内容的发布详情</small></div></div>
              <div class="post-detail-info-list">
                <div><span>发布部门</span><strong>{{ detailPost.deptName || '未设置' }}</strong></div>
                <div><span>可见范围</span><strong>{{ detailPost.visibility === 'DEPT' ? '本部门可见' : '全员可见' }}</strong></div>
                <div><span>发布时间</span><strong>{{ detailPost.createTime || '—' }}</strong></div>
                <div><span>最近更新</span><strong>{{ detailPost.updateTime || detailPost.createTime || '—' }}</strong></div>
              </div>
            </section>
            <section class="post-detail-side-card post-detail-side-tip">
              <span class="post-detail-side-kicker">JOIN THE DISCUSSION</span>
              <strong>留下你的看法</strong>
              <p>补充经验、提出建议，或直接参与这条内容的讨论。</p>
              <el-button type="primary" plain @click="openDetailComments"><el-icon><ChatDotRound /></el-icon>查看讨论 {{ detailPost.commentCount || 0 }}</el-button>
            </section>
          </aside>
        </template>
        <el-empty v-else-if="!postDetailDialog.loading" description="暂时无法加载内容详情" />
      </div>
      <template #footer>
        <div v-if="detailPost" class="post-detail-footer">
          <div class="post-detail-stats"><span><el-icon><View /></el-icon>{{ detailPost.viewCount || 0 }} 次浏览</span><span><el-icon><ChatDotRound /></el-icon>{{ detailPost.commentCount || 0 }} 条讨论</span></div>
          <div class="post-detail-footer-actions">
            <el-button text :class="{ reacted: detailPost.liked }" @click="toggleDetailReaction('LIKE')"><el-icon><Pointer /></el-icon>{{ detailPost.likeCount || 0 }}</el-button>
            <el-button text :class="{ reacted: detailPost.favorited }" @click="toggleDetailReaction('FAVORITE')"><el-icon><Star /></el-icon>{{ detailPost.favoriteCount || 0 }}</el-button>
            <el-button type="primary" @click="openDetailComments"><el-icon><ChatDotRound /></el-icon>参与讨论</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="mediaViewer.visible" width="min(960px, 92vw)" append-to-body class="community-media-viewer" :show-close="false">
      <template #header>
        <div class="media-viewer-header">
          <div class="media-viewer-title">
            <span class="media-viewer-eyebrow">MEDIA VIEWER</span>
            <strong>{{ mediaViewer.media?.fileName || '媒体预览' }}</strong>
          </div>
          <div class="media-viewer-header-actions">
            <template v-if="mediaViewer.media?.mediaType === 'IMAGE'">
              <el-button circle text :disabled="mediaViewer.scale <= mediaViewer.minScale" aria-label="缩小图片" @click="zoomMedia(-0.2)"><el-icon><ZoomOut /></el-icon></el-button>
              <span class="media-viewer-zoom-label">{{ mediaZoomLabel }}</span>
              <el-button circle text :disabled="mediaViewer.scale >= mediaViewer.maxScale" aria-label="放大图片" @click="zoomMedia(0.2)"><el-icon><ZoomIn /></el-icon></el-button>
              <el-button text class="media-viewer-reset" @click="resetMediaZoom"><el-icon><RefreshRight /></el-icon>适应窗口</el-button>
            </template>
            <el-button circle text icon="Close" aria-label="关闭媒体预览" @click="mediaViewer.visible = false" />
          </div>
        </div>
      </template>
      <div v-if="mediaViewer.media" class="media-viewer-stage">
        <div
          v-if="mediaViewer.media.mediaType === 'IMAGE'"
          ref="mediaImageViewportRef"
          class="media-image-viewport"
          :class="{ 'is-zoomed': mediaViewer.scale > mediaViewer.minScale, 'is-dragging': mediaViewer.dragging }"
          @dblclick="toggleMediaZoom"
          @pointerdown="startMediaPan"
          @pointermove="moveMediaPan"
          @pointerup="endMediaPan"
          @pointercancel="endMediaPan"
          @wheel.prevent="handleMediaWheel"
        >
          <img ref="mediaImageRef" :src="mediaViewer.media.previewUrl" alt="媒体预览" :style="mediaImageStyle" draggable="false" />
          <span v-if="mediaViewer.scale > mediaViewer.minScale" class="media-viewer-hint">滚轮缩放 · 拖动查看</span>
        </div>
        <div v-else class="media-player-shell">
          <video
            :key="mediaViewer.media.previewUrl"
            :src="mediaViewer.media.previewUrl"
            controls
            autoplay
            playsinline
            preload="metadata"
            @loadedmetadata="mediaViewer.videoError = ''"
            @error="mediaViewer.videoError = '视频地址无效或视频编码不受当前浏览器支持'"
          />
          <div v-if="mediaViewer.videoError" class="media-viewer-error">
            <el-icon><Warning /></el-icon>{{ mediaViewer.videoError }}
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="reportDialog.visible" title="举报内容" width="520px" append-to-body destroy-on-close>
      <div class="report-tip">请描述你认为不合适的地方，管理员会根据内容处理。</div>
      <el-input v-model="reportForm.reason" type="textarea" :rows="5" maxlength="500" show-word-limit placeholder="请输入举报原因" />
      <template #footer>
        <el-button @click="reportDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="reportSubmitting" @click="submitReport">提交举报</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reportAdminDialog.visible" title="举报处理" width="980px" append-to-body destroy-on-close>
      <el-form inline class="report-filter">
        <el-form-item label="状态">
          <el-select v-model="reportQuery.status" clearable placeholder="全部状态" style="width: 150px">
            <el-option label="待处理" value="PENDING" />
            <el-option label="已驳回" value="REJECTED" />
            <el-option label="已下线" value="TAKEN_DOWN" />
          </el-select>
        </el-form-item>
        <el-button type="primary" @click="getReports">查询</el-button>
      </el-form>
      <el-table v-loading="reportLoading" :data="reportRows" stripe>
        <el-table-column prop="createTime" label="举报时间" width="160" />
        <el-table-column prop="postTitle" label="内容标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="reporterName" label="举报人" width="110" />
        <el-table-column prop="reason" label="举报原因" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="reportStatusTag(row.status)" effect="plain">{{ reportStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'PENDING'">
              <el-button link type="warning" @click="handleReportAction(row, 'REJECTED')">驳回举报</el-button>
              <el-button link type="danger" @click="handleReportAction(row, 'TAKEN_DOWN')">下线内容</el-button>
            </template>
            <span v-else class="handled-text">已处理</span>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="reportTotal > 0" v-model:page="reportQuery.pageNum" v-model:limit="reportQuery.pageSize" :total="reportTotal" @pagination="getReports" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DepartmentCommunity">
import type { FormInstance, UploadRequestOptions } from 'element-plus';
import { ChatDotRound, CircleCheck, Clock, Connection, Delete, Edit, InfoFilled, Loading, Picture, Pointer, RefreshRight, Search, Star, TrendCharts, UserFilled, View, VideoCamera, Warning, ZoomIn, ZoomOut } from '@element-plus/icons-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import {
  addDepartmentCommunity,
  addDepartmentCommunityComment,
  delDepartmentCommunity,
  delDepartmentCommunityComment,
  getDepartmentCommunity,
  listDepartmentCommunity,
  listDepartmentCommunityComments,
  listDepartmentCommunityReports,
  handleDepartmentCommunityReport,
  reportDepartmentCommunity,
  uploadDepartmentCommunityCommentMedia,
  uploadDepartmentCommunityMedia,
  resolveDepartmentCommunity,
  toggleDepartmentCommunityReaction,
  updateDepartmentCommunity
} from '@/api/department/community';
import type {
  DepartmentCommunityCommentForm,
  DepartmentCommunityCommentVO,
  DepartmentCommunityPostForm,
  DepartmentCommunityPostVO,
  DepartmentCommunityQuery,
  DepartmentCommunityMediaVO,
  DepartmentCommunityReportForm,
  DepartmentCommunityReportQuery,
  DepartmentCommunityReportVO
} from '@/api/department/community/types';
import CommunityTiptapEditor from '@/components/CommunityTiptapEditor/index.vue';
import modal from '@/plugins/modal';
import { useLoading } from '@/hooks/async/useLoading';
import { useUserStore } from '@/store/modules/user';

const { loading, withLoading } = useLoading(true);
const userStore = useUserStore();
const postList = ref<DepartmentCommunityPostVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const commentLoading = ref(false);
const commentPanelLoading = ref(false);
const postFormRef = ref<FormInstance>();
const queryParams = reactive<DepartmentCommunityQuery>({ pageNum: 1, pageSize: 10, keyword: undefined, postType: undefined, feed: 'HOT' });
const postForm = reactive<DepartmentCommunityPostForm>({ title: '', subtitle: '', content: '', postType: 'DISCUSSION', tags: '', visibility: 'ALL' });
const commentForm = reactive<DepartmentCommunityCommentForm>({ content: '', parentId: 0 });
const postDialog = reactive({ visible: false, title: '发布内容' });
const expandedCommentPostId = ref<string | number>();
const commentPost = ref<DepartmentCommunityPostVO>();
const comments = ref<DepartmentCommunityCommentVO[]>([]);
const commentTotal = ref(0);
const commentPage = ref(1);
const commentLoadingMore = ref(false);
const COMMENT_PAGE_SIZE = 5;
const replyingTo = ref<DepartmentCommunityCommentVO>();
const commentInputRef = ref<any>();
type CommentReplyThread = DepartmentCommunityCommentVO & {
  depth: number;
  replyToName?: string;
};
type CommentThread = {
  comment: DepartmentCommunityCommentVO;
  replies: CommentReplyThread[];
};
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
    const appendReplies = (parent: DepartmentCommunityCommentVO, depth: number) => {
      (repliesByParentId.get(String(parent.id)) || []).forEach(reply => {
        replies.push({
          ...reply,
          depth,
          // 直接回复第一层评论时已通过层级表达关系，只有回复已有回复时才显示 @ 对象。
          replyToName: depth > 1 ? parent.authorName || '原评论' : undefined
        });
        appendReplies(reply, depth + 1);
      });
    };
    appendReplies(comment, 1);
    return { comment, replies };
  });
});
const commentHasMore = computed(() => commentTotal.value > comments.value.length);
const remainingCommentCount = computed(() => Math.max(commentTotal.value - comments.value.length, 0));
const reportDialog = reactive({ visible: false });
const postDetailDialog = reactive({ visible: false, loading: false });
const detailPost = ref<DepartmentCommunityPostVO>();
const detailAttachmentMedia = computed(() => {
  if (!detailPost.value?.mediaList?.length) return [];
  const inlineIds = new Set(getContentOssIds(detailPost.value.content));
  return detailPost.value.mediaList.filter(media => !inlineIds.has(String(media.ossId)));
});
const reportSubmitting = ref(false);
const reportForm = reactive<DepartmentCommunityReportForm>({ reason: '' });
const reportAdminDialog = reactive({ visible: false });
const reportLoading = ref(false);
const reportRows = ref<DepartmentCommunityReportVO[]>([]);
const reportTotal = ref(0);
const reportQuery = reactive<DepartmentCommunityReportQuery>({ pageNum: 1, pageSize: 10, status: undefined });
type CommunityMediaDraft = DepartmentCommunityMediaVO & { key: string; localUrl?: string; uploadStatus: 'uploading' | 'done' };
const maxMediaCount = 9;
const mediaItems = ref<CommunityMediaDraft[]>([]);
const mediaUploading = ref(false);
const inlineMediaOssIds = ref('');
const editorUploading = ref(false);
const draggingMediaKey = ref<string>();
const dragOverMediaKey = ref<string>();
const maxCommentMediaCount = 3;
type CommentMediaDraft = DepartmentCommunityMediaVO & { key: string; localUrl?: string; uploadStatus: 'uploading' | 'done' };
const commentMediaItems = ref<CommentMediaDraft[]>([]);
const commentMediaUploading = ref(false);
const originalMediaOssIds = ref<string>();
const mediaViewer = reactive({
  visible: false,
  media: undefined as DepartmentCommunityMediaVO | undefined,
  videoError: '',
  scale: 1,
  minScale: 1,
  maxScale: 3,
  offsetX: 0,
  offsetY: 0,
  dragging: false,
  pointerId: undefined as number | undefined,
  dragStartX: 0,
  dragStartY: 0,
  originOffsetX: 0,
  originOffsetY: 0
});
const mediaImageViewportRef = ref<HTMLElement>();
const mediaImageRef = ref<HTMLImageElement>();
const mediaZoomLabel = computed(() => `${Math.round(mediaViewer.scale * 100)}%`);
const mediaImageStyle = computed(() => ({
  transform: `translate3d(${mediaViewer.offsetX}px, ${mediaViewer.offsetY}px, 0) scale(${mediaViewer.scale})`,
  transition: mediaViewer.dragging ? 'none' : 'transform .18s ease'
}));

const postTypeOptions = [
  { value: 'DISCUSSION', label: '讨论', type: 'primary' },
  { value: 'QUESTION', label: '问题求助', type: 'warning' },
  { value: 'EXPERIENCE', label: '经验分享', type: 'success' },
  { value: 'IMPROVEMENT', label: '改进想法', type: 'danger' }
];
const feedOptions = [
  { value: 'HOT', label: '推荐', icon: TrendCharts },
  { value: 'LATEST', label: '最新', icon: Clock },
  { value: 'MINE', label: '我的内容', icon: UserFilled }
];
const emojiList = [
  // 表情与人物
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😋', '😛', '😜', '🤪', '🤔', '🫡', '🤗', '🤭', '🤫', '🤐', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '😯', '😲', '🥱', '😴', '🤓', '😎', '🤯', '😢', '😭', '😤', '😠', '😡', '🤬', '🤢', '🤮', '🤧', '🥳', '🥺', '😱', '😨', '😰', '😳', '🫠',
  // 手势与动作
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🖐️', '✋', '🫶', '👏', '🙌', '🙏', '🤝', '💪', '👀', '💯', '✅', '❌', '❗', '❓',
  // 动物与自然
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🦄', '🐝', '🦋', '🌸', '🌻', '🌈', '☀️', '⭐', '🌙', '❄️',
  // 食物与活动
  '🍎', '🍉', '🍔', '🍕', '🍟', '🍜', '🍰', '🎂', '☕', '🍻', '⚽', '🏀', '🏆', '🎮', '🎨', '🎵', '🎉', '🎁', '🚀', '💡', '🔥', '❤️', '💚', '💙', '💜', '🧡', '💛', '💖', '✨', '💥'
];
const postRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  postType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  visibility: [{ required: true, message: '请选择可见范围', trigger: 'change' }],
  content: [{ required: true, message: '请输入正文', trigger: 'blur' }]
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listDepartmentCommunity(queryParams);
    postList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const changeFeed = (feed: string) => {
  queryParams.feed = feed;
  handleQuery();
};

const openCreate = () => {
  resetMedia();
  originalMediaOssIds.value = undefined;
  inlineMediaOssIds.value = '';
  editorUploading.value = false;
  Object.assign(postForm, { id: undefined, title: '', subtitle: '', content: '', postType: 'DISCUSSION', tags: '', visibility: 'ALL', status: 'PUBLISHED', mediaOssIds: undefined });
  postDialog.title = '发布内容';
  postDialog.visible = true;
};

const openEdit = (post: DepartmentCommunityPostVO) => {
  resetMedia();
  const contentOssIds = getContentOssIds(post.content);
  const contentOssIdSet = new Set(contentOssIds);
  inlineMediaOssIds.value = contentOssIds.join(',');
  editorUploading.value = false;
  mediaItems.value = (post.mediaList || [])
    .filter(media => !contentOssIdSet.has(String(media.ossId)))
    .map(media => ({ ...media, key: String(media.ossId), localUrl: media.previewUrl, uploadStatus: 'done' }));
  const mediaOssIds = (post.mediaList || []).map(media => media.ossId).join(',');
  originalMediaOssIds.value = mediaOssIds;
  Object.assign(postForm, {
    id: post.id,
    title: post.title,
    subtitle: post.subtitle || '',
    content: post.content,
    postType: post.postType,
    tags: post.tags || '',
    visibility: post.visibility || 'ALL',
    status: post.status || 'PUBLISHED',
    mediaOssIds
  });
  postDialog.title = '编辑内容';
  postDialog.visible = true;
};

const openPostDetail = async (post: DepartmentCommunityPostVO) => {
  detailPost.value = undefined;
  postDetailDialog.visible = true;
  postDetailDialog.loading = true;
  try {
    const res = await getDepartmentCommunity(post.id);
    detailPost.value = res.data || post;
  } catch {
    detailPost.value = post;
  } finally {
    postDetailDialog.loading = false;
  }
};

const submitPost = async (status: 'DRAFT' | 'PUBLISHED') => {
  if (mediaUploading.value || editorUploading.value) {
    modal.msgWarning('媒体仍在上传，请稍候');
    return;
  }
  if (!postForm.content || (!postContentPreview(postForm.content).trim() && !/<img\b/i.test(postForm.content))) {
    modal.msgWarning('请输入正文或插入正文图片');
    return;
  }
  const mediaOssIds = [...new Set([...splitOssIds(inlineMediaOssIds.value), ...mediaItems.value.map(item => String(item.ossId))])].join(',');
  if (splitOssIds(mediaOssIds).length > maxMediaCount) {
    modal.msgWarning('正文图片和附加媒体合计不能超过9个');
    return;
  }
  const valid = await postFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  postForm.status = status;
  const mediaChanged = !postForm.id || normalizeOssIds(mediaOssIds) !== normalizeOssIds(originalMediaOssIds.value);
  postForm.mediaOssIds = mediaChanged ? mediaOssIds : undefined;
  buttonLoading.value = true;
  try {
    if (postForm.id) {
      await updateDepartmentCommunity(postForm);
      modal.msgSuccess(status === 'DRAFT' ? '草稿已保存' : '内容已更新并发布');
    } else {
      await addDepartmentCommunity(postForm);
      modal.msgSuccess(status === 'DRAFT' ? '草稿已保存' : '发布成功');
    }
    postDialog.visible = false;
    originalMediaOssIds.value = undefined;
    inlineMediaOssIds.value = '';
    editorUploading.value = false;
    resetMedia();
    await getList();
  } finally {
    buttonLoading.value = false;
  }
};

const resetMedia = () => {
  clearMediaDrag();
  mediaItems.value.forEach(item => {
    if (item.localUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localUrl);
  });
  mediaItems.value = [];
  mediaUploading.value = false;
};

const resetCommentMedia = () => {
  commentMediaItems.value.forEach(item => {
    if (item.localUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localUrl);
  });
  commentMediaItems.value = [];
  commentMediaUploading.value = false;
};

const handleMediaUpload = async (options: UploadRequestOptions) => {
  const file = options.file as File;
  if (mediaItems.value.length >= maxMediaCount) {
    modal.msgWarning('一条内容最多上传9个媒体文件');
    return;
  }
  const suffix = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  const isVideo = file.type.startsWith('video/') || ['.mp4', '.webm', '.ogg'].includes(suffix);
  const validType = isVideo ? ['.mp4', '.webm', '.ogg'].includes(suffix) : ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(suffix);
  if (!validType) {
    modal.msgError('仅支持 JPG、PNG、GIF、WEBP 图片和 MP4、WebM、Ogg 视频');
    return;
  }
  const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) {
    modal.msgError(isVideo ? '视频不能超过500MB' : '图片不能超过10MB');
    return;
  }
  const localUrl = URL.createObjectURL(file);
  const item: CommunityMediaDraft = {
    key: `${Date.now()}-${file.name}`,
    ossId: '',
    mediaType: isVideo ? 'VIDEO' : 'IMAGE',
    fileName: file.name,
    fileSuffix: suffix,
    contentType: file.type,
    fileSize: file.size,
    localUrl,
    uploadStatus: 'uploading'
  };
  mediaItems.value.push(item);
  mediaUploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadDepartmentCommunityMedia(formData);
    Object.assign(item, res.data, { localUrl, uploadStatus: 'done' });
    options.onSuccess?.(res.data);
  } catch (error) {
    removeMedia(item);
    options.onError?.(error as any);
    modal.msgError('媒体上传失败，请稍后重试');
  } finally {
    mediaUploading.value = mediaItems.value.some(media => media.uploadStatus === 'uploading');
  }
};

const removeMedia = (item: CommunityMediaDraft) => {
  if (item.localUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localUrl);
  mediaItems.value = mediaItems.value.filter(media => media.key !== item.key);
  mediaUploading.value = mediaItems.value.some(media => media.uploadStatus === 'uploading');
};

const handleMediaDragStart = (event: DragEvent, item: CommunityMediaDraft) => {
  draggingMediaKey.value = item.key;
  dragOverMediaKey.value = undefined;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.key);
  }
};

const handleMediaDragOver = (item: CommunityMediaDraft) => {
  if (draggingMediaKey.value && draggingMediaKey.value !== item.key) {
    dragOverMediaKey.value = item.key;
  }
};

const handleMediaDrop = (targetItem: CommunityMediaDraft) => {
  const sourceKey = draggingMediaKey.value;
  if (!sourceKey || sourceKey === targetItem.key) {
    clearMediaDrag();
    return;
  }
  const items = [...mediaItems.value];
  const sourceIndex = items.findIndex(item => item.key === sourceKey);
  const targetIndex = items.findIndex(item => item.key === targetItem.key);
  if (sourceIndex < 0 || targetIndex < 0) {
    clearMediaDrag();
    return;
  }
  const [movedItem] = items.splice(sourceIndex, 1);
  items.splice(targetIndex, 0, movedItem);
  mediaItems.value = items;
  clearMediaDrag();
};

const clearMediaDrag = () => {
  draggingMediaKey.value = undefined;
  dragOverMediaKey.value = undefined;
};

const handleCommentMediaUpload = async (options: UploadRequestOptions) => {
  const file = options.file as File;
  if (commentMediaItems.value.length >= maxCommentMediaCount) {
    modal.msgWarning('一条评论最多上传3张图片');
    return;
  }
  const suffix = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
  if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(suffix)) {
    modal.msgError('评论仅支持 JPG、PNG、GIF、WEBP 图片');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    modal.msgError('评论图片不能超过10MB');
    return;
  }
  const localUrl = URL.createObjectURL(file);
  const item: CommentMediaDraft = {
    key: `${Date.now()}-${file.name}`,
    ossId: '',
    mediaType: 'IMAGE',
    fileName: file.name,
    fileSuffix: suffix,
    contentType: file.type,
    fileSize: file.size,
    localUrl,
    uploadStatus: 'uploading'
  };
  commentMediaItems.value.push(item);
  commentMediaUploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadDepartmentCommunityCommentMedia(formData);
    Object.assign(item, res.data, { localUrl, uploadStatus: 'done' });
    options.onSuccess?.(res.data);
  } catch (error) {
    removeCommentMedia(item);
    options.onError?.(error as any);
    modal.msgError('评论图片上传失败，请稍后重试');
  } finally {
    commentMediaUploading.value = commentMediaItems.value.some(media => media.uploadStatus === 'uploading');
  }
};

const removeCommentMedia = (item: CommentMediaDraft) => {
  if (item.localUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localUrl);
  commentMediaItems.value = commentMediaItems.value.filter(media => media.key !== item.key);
  commentMediaUploading.value = commentMediaItems.value.some(media => media.uploadStatus === 'uploading');
};

const handleDelete = async (post: DepartmentCommunityPostVO) => {
  await modal.confirm('确认删除这条内容吗？删除后将不再出现在社区中。');
  await delDepartmentCommunity(post.id);
  modal.msgSuccess('内容已删除');
  await getList();
};

const previewMedia = (media: DepartmentCommunityMediaVO) => {
  mediaViewer.media = media;
  mediaViewer.videoError = '';
  resetMediaZoom();
  mediaViewer.visible = true;
};

const resetMediaZoom = () => {
  mediaViewer.scale = mediaViewer.minScale;
  mediaViewer.offsetX = 0;
  mediaViewer.offsetY = 0;
  mediaViewer.dragging = false;
  mediaViewer.pointerId = undefined;
};

const zoomMedia = (delta: number) => {
  if (mediaViewer.media?.mediaType !== 'IMAGE') return;
  const nextScale = Math.min(mediaViewer.maxScale, Math.max(mediaViewer.minScale, Number((mediaViewer.scale + delta).toFixed(2))));
  mediaViewer.scale = nextScale;
  if (nextScale === mediaViewer.minScale) {
    mediaViewer.offsetX = 0;
    mediaViewer.offsetY = 0;
  }
};

const toggleMediaZoom = () => {
  if (mediaViewer.media?.mediaType !== 'IMAGE') return;
  if (mediaViewer.scale > mediaViewer.minScale) {
    resetMediaZoom();
  } else {
    mediaViewer.scale = 2;
  }
};

const handleMediaWheel = (event: WheelEvent) => {
  if (mediaViewer.media?.mediaType !== 'IMAGE') return;
  zoomMedia(event.deltaY < 0 ? 0.2 : -0.2);
};

const getMediaPanLimits = () => {
  const viewport = mediaImageViewportRef.value;
  const image = mediaImageRef.value;
  if (!viewport || !image) return { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
  return {
    x: Math.max(0, (image.offsetWidth * mediaViewer.scale - viewport.clientWidth) / 2 + 24),
    y: Math.max(0, (image.offsetHeight * mediaViewer.scale - viewport.clientHeight) / 2 + 24)
  };
};

const clampMediaOffset = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

const startMediaPan = (event: PointerEvent) => {
  if (mediaViewer.media?.mediaType !== 'IMAGE' || mediaViewer.scale <= mediaViewer.minScale) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const viewport = event.currentTarget as HTMLElement;
  viewport.setPointerCapture?.(event.pointerId);
  mediaViewer.pointerId = event.pointerId;
  mediaViewer.dragging = true;
  mediaViewer.dragStartX = event.clientX;
  mediaViewer.dragStartY = event.clientY;
  mediaViewer.originOffsetX = mediaViewer.offsetX;
  mediaViewer.originOffsetY = mediaViewer.offsetY;
};

const moveMediaPan = (event: PointerEvent) => {
  if (!mediaViewer.dragging || mediaViewer.pointerId !== event.pointerId) return;
  const limits = getMediaPanLimits();
  mediaViewer.offsetX = clampMediaOffset(mediaViewer.originOffsetX + event.clientX - mediaViewer.dragStartX, limits.x);
  mediaViewer.offsetY = clampMediaOffset(mediaViewer.originOffsetY + event.clientY - mediaViewer.dragStartY, limits.y);
};

const endMediaPan = (event?: PointerEvent) => {
  if (!mediaViewer.dragging || (event && mediaViewer.pointerId !== event.pointerId)) return;
  if (event) {
    const viewport = event.currentTarget as HTMLElement;
    if (viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  }
  mediaViewer.dragging = false;
  mediaViewer.pointerId = undefined;
};

const toggleComments = async (post: DepartmentCommunityPostVO) => {
  if (expandedCommentPostId.value === post.id) {
    expandedCommentPostId.value = undefined;
    commentPost.value = undefined;
    comments.value = [];
    commentTotal.value = 0;
    commentPage.value = 1;
    commentLoadingMore.value = false;
    cancelReply();
    commentForm.content = '';
    resetCommentMedia();
    return;
  }
  expandedCommentPostId.value = post.id;
  commentPanelLoading.value = true;
  commentPost.value = undefined;
  comments.value = [];
  commentTotal.value = 0;
  commentPage.value = 1;
  commentLoadingMore.value = false;
  replyingTo.value = undefined;
  commentForm.content = '';
  commentForm.parentId = 0;
  resetCommentMedia();
  try {
    const res = await getDepartmentCommunity(post.id);
    commentPost.value = res.data;
    await loadComments(post.id);
  } finally {
    commentPanelLoading.value = false;
  }
};

const loadComments = async (postId: string | number, pageNum = 1, append = false) => {
  const res = await listDepartmentCommunityComments(postId, { pageNum, pageSize: COMMENT_PAGE_SIZE });
  const page = res.data;
  const rows = page?.rows || [];
  comments.value = append ? [...comments.value, ...rows] : rows;
  commentTotal.value = Number(page?.total || 0);
  commentPage.value = pageNum;
};

const loadMoreComments = async () => {
  if (!commentPost.value || commentLoadingMore.value || !commentHasMore.value) return;
  commentLoadingMore.value = true;
  try {
    await loadComments(commentPost.value.id, commentPage.value + 1, true);
  } finally {
    commentLoadingMore.value = false;
  }
};

const submitComment = async () => {
  const content = (commentForm.content || '').trim();
  if (!commentPost.value || (!content && !commentMediaItems.value.length)) {
    modal.msgWarning('请输入评论内容或添加图片');
    return;
  }
  if (commentMediaUploading.value) {
    modal.msgWarning('图片仍在上传，请稍候');
    return;
  }
  commentLoading.value = true;
  try {
    await addDepartmentCommunityComment(commentPost.value.id, {
      content,
      parentId: commentForm.parentId || 0,
      mediaOssIds: commentMediaItems.value.map(item => item.ossId).join(',') || undefined
    });
    commentForm.content = '';
    commentForm.parentId = 0;
    replyingTo.value = undefined;
    resetCommentMedia();
    await loadComments(commentPost.value.id);
    commentPost.value.commentCount = commentTotal.value;
    await getList();
    modal.msgSuccess('评论已发表');
  } finally {
    commentLoading.value = false;
  }
};

const handleReply = (comment: DepartmentCommunityCommentVO) => {
  replyingTo.value = comment;
  commentForm.parentId = comment.id;
};

const cancelReply = () => {
  replyingTo.value = undefined;
  commentForm.parentId = 0;
};

const insertEmoji = (emoji: string) => {
  const current = commentForm.content || '';
  const textarea = commentInputRef.value?.textarea as HTMLTextAreaElement | undefined;
  if (!textarea) {
    commentForm.content = current + emoji;
    return;
  }
  const start = textarea.selectionStart ?? current.length;
  const end = textarea.selectionEnd ?? start;
  commentForm.content = `${current.slice(0, start)}${emoji}${current.slice(end)}`;
  requestAnimationFrame(() => {
    textarea.focus();
    const cursor = start + emoji.length;
    textarea.setSelectionRange(cursor, cursor);
  });
};

const handleDeleteComment = async (comment: DepartmentCommunityCommentVO) => {
  await modal.confirm('确认删除这条评论吗？');
  await delDepartmentCommunityComment(comment.id);
  if (commentPost.value) {
    await loadComments(commentPost.value.id);
    commentPost.value.commentCount = commentTotal.value;
  }
  if (replyingTo.value?.id === comment.id) cancelReply();
  await getList();
  modal.msgSuccess('评论已删除');
};

const openReport = () => {
  if (!commentPost.value) return;
  reportForm.reason = '';
  reportDialog.visible = true;
};

const submitReport = async () => {
  if (!commentPost.value || !reportForm.reason?.trim()) {
    modal.msgWarning('请先填写举报原因');
    return;
  }
  reportSubmitting.value = true;
  try {
    await reportDepartmentCommunity(commentPost.value.id, { reason: reportForm.reason.trim() });
    reportDialog.visible = false;
    modal.msgSuccess('举报已提交，感谢你的反馈');
  } finally {
    reportSubmitting.value = false;
  }
};

const openReportAdmin = () => {
  reportQuery.pageNum = 1;
  reportAdminDialog.visible = true;
  getReports();
};

const getReports = async () => {
  reportLoading.value = true;
  try {
    const res = await listDepartmentCommunityReports(reportQuery);
    reportRows.value = res.data?.rows || [];
    reportTotal.value = res.data?.total || 0;
  } finally {
    reportLoading.value = false;
  }
};

const handleReportAction = async (row: DepartmentCommunityReportVO, status: 'REJECTED' | 'TAKEN_DOWN') => {
  const message = status === 'TAKEN_DOWN' ? '确认下线被举报的内容吗？下线后作者和其他用户将无法继续访问。' : '确认驳回这条举报吗？';
  await modal.confirm(message);
  await handleDepartmentCommunityReport({ id: row.id, status, handleNote: status === 'TAKEN_DOWN' ? '内容已下线' : '举报不成立' });
  modal.msgSuccess(status === 'TAKEN_DOWN' ? '内容已下线' : '举报已驳回');
  await getReports();
};

const toggleReaction = async (post: DepartmentCommunityPostVO, type: 'LIKE' | 'FAVORITE') => {
  const res = await toggleDepartmentCommunityReaction(post.id, type);
  if (!res.data) return;
  post.liked = res.data.liked;
  post.favorited = res.data.favorited;
  post.likeCount = res.data.likeCount;
  post.favoriteCount = res.data.favoriteCount;
  if (commentPost.value?.id === post.id) Object.assign(commentPost.value, res.data);
};

const toggleDetailReaction = async (type: 'LIKE' | 'FAVORITE') => {
  if (!detailPost.value) return;
  await toggleReaction(detailPost.value, type);
  const listPost = postList.value.find(post => String(post.id) === String(detailPost.value?.id));
  if (listPost && listPost !== detailPost.value) {
    Object.assign(listPost, {
      liked: detailPost.value.liked,
      favorited: detailPost.value.favorited,
      likeCount: detailPost.value.likeCount,
      favoriteCount: detailPost.value.favoriteCount
    });
  }
};

const openDetailComments = async () => {
  const post = detailPost.value;
  if (!post) return;
  postDetailDialog.visible = false;
  if (expandedCommentPostId.value !== post.id) {
    await toggleComments(post);
  }
};

const resolveComment = async (comment: DepartmentCommunityCommentVO) => {
  if (!commentPost.value) return;
  await modal.confirm('确认将这条评论采纳为解决方案吗？帖子会标记为“已解决”。');
  await resolveDepartmentCommunity(commentPost.value.id, comment.id);
  commentPost.value.status = 'RESOLVED';
  commentPost.value.acceptedCommentId = comment.id;
  await getList();
  modal.msgSuccess('已标记为已解决');
};

const postTypeLabel = (value?: string) => postTypeOptions.find(item => item.value === value)?.label || '讨论';
const postTypeTag = (value?: string) => (postTypeOptions.find(item => item.value === value)?.type || 'info') as any;
const splitTags = (value?: string) => (value || '').split(/[，,]/).map(item => item.trim()).filter(Boolean);
const avatarText = (value?: string) => (value || '匿').slice(0, 1);
const splitOssIds = (value?: string) => (value || '').split(',').map(item => item.trim()).filter(Boolean);
const normalizeOssIds = (value?: string) => [...new Set(splitOssIds(value))].toSorted().join(',');
const getContentOssIds = (value?: string) => Array.from(new Set(Array.from((value || '').matchAll(/oss:\/\/([\w-]+)/g), match => match[1])));
const postAttachmentMedia = (post: DepartmentCommunityPostVO) => {
  const inlineIds = new Set(getContentOssIds(post.content));
  return (post.mediaList || []).filter(media => !inlineIds.has(String(media.ossId)));
};
const postContentPreview = (value?: string) =>
  (value || '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
const mediaPreviewList = (mediaList?: DepartmentCommunityMediaVO[]) => (mediaList || []).slice(0, 4);
const reportStatusLabel = (value?: string) => ({ PENDING: '待处理', REJECTED: '已驳回', TAKEN_DOWN: '已下线' })[value || ''] || '未知';
const reportStatusTag = (value?: string) => ({ PENDING: 'warning', REJECTED: 'info', TAKEN_DOWN: 'danger' })[value || ''] || 'info';

onMounted(async () => {
  await getList();
});
</script>

<style scoped lang="scss">
.department-community-page {
  --community-ink: #18243b;
  --community-muted: #71809a;
  --community-line: #e6ecf5;
  --community-primary: #3f8eea;
  --community-surface: #ffffff;
  --community-soft: #f5f8fc;
  --community-shadow: 0 16px 42px rgba(47, 73, 111, .08);

  .community-hero {
    position: relative;
    border: 1px solid rgba(181, 207, 239, .65);
    border-radius: 22px;
    overflow: hidden;
    background:
      radial-gradient(circle at 85% 12%, rgba(89, 157, 238, .22), transparent 28%),
      linear-gradient(118deg, #f8fbff 0%, #edf6ff 58%, #f8fbff 100%);
    box-shadow: var(--community-shadow);
    :deep(.el-card__body) { padding: 30px 34px 24px; }
  }
  .hero-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
  .hero-actions { display: flex; align-items: center; gap: 10px; padding-top: 5px; }
  .hero-actions :deep(.el-button) { border-radius: 11px; }
  .hero-kicker { display: block; color: #6a9bdf; font-size: 11px; font-weight: 800; letter-spacing: 1.8px; }
  h2 { margin: 9px 0 7px; color: var(--community-ink); font-size: 30px; font-weight: 750; letter-spacing: .2px; }
  .hero-main p { max-width: 620px; margin: 0; color: var(--community-muted); font-size: 14px; line-height: 1.7; }
  .hero-summary { display: flex; align-items: stretch; gap: 11px; margin-top: 27px; padding-top: 19px; border-top: 1px solid rgba(122, 157, 201, .2); }
  .summary-item { display: flex; align-items: center; gap: 10px; min-width: 142px; padding: 10px 13px; border: 1px solid rgba(181, 207, 239, .52); border-radius: 14px; background: rgba(255, 255, 255, .56); }
  .summary-icon { display: inline-flex; width: 36px; height: 36px; align-items: center; justify-content: center; border-radius: 12px; font-size: 18px; }
  .summary-icon.blue { color: #4d91e8; background: #deedff; }
  .summary-icon.green { color: #54af8b; background: #ddf5eb; }
  .summary-icon.orange { color: #e39b40; background: #fff0da; }
  .summary-item strong, .summary-item span { display: block; }
  .summary-item strong { color: var(--community-ink); font-size: 17px; }
  .summary-item div span { margin-top: 2px; color: var(--community-muted); font-size: 12px; }
  .hero-tip { display: flex; align-items: center; gap: 7px; max-width: 390px; margin: auto 0 auto auto; color: #8190a9; font-size: 12px; line-height: 1.5; }
  .hero-tip .el-icon { color: #74a6e7; }
  .community-layout { display: grid; grid-template-columns: minmax(0, 1fr) 294px; gap: 18px; align-items: start; }
  .community-card { border: 0; background: transparent; }
  .community-card :deep(.el-card__body) { padding: 0; }
  .community-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 13px 15px; border: 1px solid var(--community-line); border-radius: 16px; background: var(--community-surface); box-shadow: 0 9px 28px rgba(47, 73, 111, .05); }
  .feed-tabs { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--community-soft); }
  .feed-tab { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 0; border-radius: 9px; color: #8090a9; background: transparent; cursor: pointer; transition: all .2s; }
  .feed-tab:hover { color: var(--community-primary); background: #f3f7fd; }
  .feed-tab.active { color: #fff; background: var(--community-primary); box-shadow: 0 5px 12px rgba(77, 145, 232, .2); }
  .filter-actions { display: flex; align-items: center; gap: 8px; }
  .keyword-input { width: 270px; }
  .type-select { width: 130px; }
  .filter-actions :deep(.el-input__wrapper), .filter-actions :deep(.el-select__wrapper) { border-radius: 10px; box-shadow: 0 0 0 1px var(--community-line) inset; }
  .filter-actions :deep(.el-button) { border-radius: 10px; }
  .post-list { display: grid; grid-template-columns: 1fr; gap: 16px; min-height: 260px; padding-top: 18px; }
  .post-list :deep(.el-empty) { grid-column: 1 / -1; min-height: 260px; border: 1px dashed var(--community-line); border-radius: 18px; background: var(--community-surface); }
  .post-card { min-width: 0; padding: 0; border: 1px solid var(--community-line); border-radius: 18px; background: var(--community-surface); box-shadow: 0 10px 30px rgba(47, 73, 111, .055); cursor: pointer; overflow: hidden; transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
  .post-card:hover { border-color: #b8d4f4; box-shadow: 0 17px 38px rgba(47, 73, 111, .12); transform: translateY(-3px); }
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
  /*
   * 卡片预览只限制可视高度，不再覆盖富文本自身的排版参数。
   * 编辑器、卡片和详情必须使用同一套段落/图片间距，否则浮动图片
   * 下方的段落会因为行高不同，在不同容器中出现不同的环绕结果。
   */
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
  /* 部分上传视频的编码画面自带 1~2px 黑边，轻微放大裁掉边缘，避免信息流中出现明显黑线。 */
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
  .post-comments-panel { padding: 0 20px 18px; border-top: 1px solid var(--community-line); }
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
  .community-aside { display: grid; gap: 16px; }
  .aside-card { padding: 19px; border: 1px solid var(--community-line); border-radius: 17px; background: var(--community-surface); box-shadow: 0 10px 30px rgba(47, 73, 111, .055); }
  .aside-card-head { display: flex; align-items: center; gap: 10px; padding-bottom: 15px; border-bottom: 1px solid var(--community-line); }
  .aside-card-head > div { min-width: 0; }
  .aside-card-head strong, .aside-card-head small { display: block; }
  .aside-card-head strong { color: var(--community-ink); font-size: 15px; }
  .aside-card-head small { margin-top: 4px; color: var(--community-muted); font-size: 11px; }
  .aside-card-icon { display: inline-flex; width: 35px; height: 35px; align-items: center; justify-content: center; border-radius: 11px; font-size: 17px; }
  .aside-card-icon.blue { color: #4d91e8; background: #e4f0ff; }
  .aside-rule { display: flex; gap: 11px; padding-top: 15px; }
  .aside-rule > span { flex: none; color: #76a7e4; font-size: 11px; font-weight: 800; letter-spacing: .6px; }
  .aside-rule strong, .aside-rule small { display: block; }
  .aside-rule strong { color: var(--community-ink); font-size: 13px; }
  .aside-rule small { margin-top: 4px; color: var(--community-muted); font-size: 12px; line-height: 1.55; }
  .aside-cta { padding: 21px; background: linear-gradient(145deg, #eef7ff, #f8fbff); }
  .aside-cta-kicker { display: block; color: #6a9bdf; font-size: 10px; font-weight: 800; letter-spacing: 1.6px; }
  .aside-cta > strong { display: block; margin-top: 8px; color: #203858; font-size: 18px; }
  .aside-cta p { margin: 8px 0 16px; color: #71809a; font-size: 12px; line-height: 1.65; }
  .aside-cta :deep(.el-button) { width: 100%; border-radius: 10px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .comment-heading { color: #32435f; font-weight: 650; }
  .comment-editor { display: flex; gap: 10px; padding: 10px 12px; border: 1px solid var(--community-line); border-radius: 12px; background: var(--community-soft); }
  .comment-input-wrap { flex: 1; }
  .reply-target { display: flex; align-items: center; gap: 4px; margin-bottom: 7px; color: #7d8aa5; font-size: 12px; }
  .comment-composer-toolbar { display: flex; align-items: center; gap: 4px; min-height: 31px; margin-top: 5px; }
  .comment-tool-button { width: 30px; height: 30px; padding: 0; color: #7f91aa; }
  .comment-tool-button:hover { color: var(--community-primary); background: #eaf3ff; }
  .comment-emoji-trigger { font-size: 17px; line-height: 1; }
  .comment-image-uploader { display: inline-flex; }
  .comment-composer-hint { margin-left: 5px; color: #9aa8ba; font-size: 11px; }
  .comment-media-draft-list, .comment-media-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .comment-media-draft-list { margin-top: 8px; }
  .comment-media-draft { position: relative; width: 68px; height: 68px; overflow: hidden; border: 1px solid var(--community-line); border-radius: 8px; background: #edf2f8; }
  .comment-media-draft > img, .comment-media-thumb > img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .comment-media-uploading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; background: rgba(13, 33, 61, .56); font-size: 11px; }
  .comment-media-remove { position: absolute; top: 3px; right: 3px; display: flex; width: 18px; height: 18px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #fff; background: rgba(13, 24, 42, .68); cursor: pointer; font-size: 14px; line-height: 1; }
  .comment-media-list { margin-top: 7px; }
  .comment-media-thumb { width: 72px; height: 72px; padding: 0; overflow: hidden; border: 1px solid var(--community-line); border-radius: 8px; background: #edf2f8; cursor: zoom-in; }
  .comment-media-thumb:hover { border-color: var(--community-primary); box-shadow: 0 3px 12px rgba(63, 142, 234, .18); }
  .media-field { margin-top: 6px; padding: 16px; border: 1px solid var(--community-line); border-radius: 14px; background: #fbfcfe; }
  .media-field-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .media-field-head > div { display: flex; align-items: center; gap: 8px; }
  .media-field-head strong { color: #354661; font-size: 14px; }
  .media-field-head span, .media-field-head small, .media-field-hint { color: #98a5b8; font-size: 12px; }
  .media-field-head > div span { color: #98a5b8; }
  .media-count { padding: 3px 9px; border: 1px solid #cfe0f4; border-radius: 999px; color: #5689c4 !important; background: #f1f7ff; font-size: 11px !important; font-weight: 700; }
  .media-field-description { color: #8492a7; font-size: 12px; line-height: 1.5; }
  .media-upload-row { display: flex; align-items: stretch; gap: 12px; margin-top: 12px; }
  .community-media-uploader { display: block; flex: 0 0 184px; }
  .community-media-uploader :deep(.el-upload), .community-media-uploader :deep(.el-upload-dragger) { display: block; width: 100%; }
  .media-add-card { display: flex; min-height: 86px; align-items: center; justify-content: center; flex-direction: column; gap: 4px; box-sizing: border-box; padding: 10px 12px; border: 1px dashed #a9c9ea; border-radius: 10px; color: #4e91d9; background: #f4f9ff; cursor: pointer; transition: border-color .2s, background .2s, transform .2s; }
  .media-add-card:hover { border-color: #5ca3e8; background: #edf6ff; transform: translateY(-1px); }
  .media-add-card.disabled { color: #a8b5c5; border-color: #d6dee8; background: #f5f7fa; cursor: not-allowed; transform: none; }
  .media-add-icon { display: flex; width: 26px; height: 26px; align-items: center; justify-content: center; border-radius: 8px; color: #fff; background: #5da5e8; font-size: 16px; }
  .media-add-card.disabled .media-add-icon { background: #aab7c7; }
  .media-add-title { color: inherit; font-size: 12px; font-weight: 700; }
  .media-add-subtitle { color: #92a1b5; font-size: 10px; }
  .media-upload-note { display: flex; min-width: 0; justify-content: center; flex-direction: column; gap: 5px; color: #8d9aae; font-size: 11px; line-height: 1.45; }
  .media-upload-note .is-uploading { display: inline-flex; align-items: center; gap: 4px; color: #4e91d9; font-weight: 600; }
  .compose-media-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
  .compose-media-item { min-width: 0; }
  .compose-media-preview { position: relative; aspect-ratio: 1.35; overflow: hidden; border: 1px solid var(--community-line); border-radius: 10px; background: #eaf0f7; }
  .compose-media-preview > img, .compose-video-tile { display: block; width: 100%; height: 100%; object-fit: cover; }
  .compose-video-tile { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3px; color: #dce9ff; background: linear-gradient(135deg, #1c3558, #397fc4); font-size: 11px; }
  .compose-video-tile .el-icon { font-size: 24px; }
  .compose-media-info { display: flex; align-items: center; gap: 5px; min-width: 0; margin-top: 6px; }
  .compose-media-type { flex: none; padding: 2px 5px; border-radius: 4px; color: #5689c4; background: #eaf4ff; font-size: 10px; }
  .compose-media-name { min-width: 0; overflow: hidden; color: #71809a; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .media-empty-state { display: flex; min-height: 78px; align-items: center; justify-content: center; flex-direction: column; gap: 3px; margin-top: 12px; border: 1px dashed #d6e0ec; border-radius: 10px; color: #9aa8ba; background: #f8fafc; }
  .media-empty-state .el-icon { color: #a9bdd6; font-size: 22px; }
  .media-empty-state span { font-size: 12px; }
  .media-empty-state small { color: #adb8c6; font-size: 10px; }
  .compose-media-remove { position: absolute; top: 5px; right: 5px; display: flex; width: 20px; height: 20px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #fff; background: rgba(13, 24, 42, .65); cursor: pointer; font-size: 16px; line-height: 1; }
  .media-uploading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 5px; color: #fff; background: rgba(13, 33, 61, .56); font-size: 12px; }
  .media-field-hint { margin-top: 9px; }
  .community-media-viewer :deep(.el-dialog) { overflow: hidden; border: 1px solid rgba(126, 157, 202, .28); border-radius: 20px; background: #101828; box-shadow: 0 24px 70px rgba(5, 12, 27, .45); }
  .community-media-viewer :deep(.el-dialog__header) { margin-right: 0; padding: 0; border-bottom: 1px solid rgba(142, 170, 211, .14); }
  .community-media-viewer :deep(.el-dialog__body) { padding: 0; }
  .media-viewer-header { display: flex; align-items: center; justify-content: space-between; padding: 17px 20px; }
  .media-viewer-header-actions { display: flex; align-items: center; gap: 4px; }
  .media-viewer-title strong { display: block; max-width: 650px; overflow: hidden; margin-top: 4px; color: #f2f6fd; font-size: 15px; text-overflow: ellipsis; white-space: nowrap; }
  .media-viewer-eyebrow { display: block; color: #7eaee9; font-size: 10px; font-weight: 800; letter-spacing: 1.7px; }
  .media-viewer-header :deep(.el-button) { color: #a9b8cd; background: rgba(255, 255, 255, .08); }
  .media-viewer-header :deep(.el-button:hover) { color: #fff; background: rgba(255, 255, 255, .16); }
  .media-viewer-zoom-label { min-width: 42px; color: #dce8f7; font-size: 12px; text-align: center; }
  .media-viewer-reset { padding-right: 8px; padding-left: 8px; font-size: 12px; }
  .media-viewer-stage { display: flex; width: 100%; min-height: min(560px, 68vh); align-items: center; justify-content: center; padding: 22px; box-sizing: border-box; background: radial-gradient(circle at 50% 20%, #213554 0%, #101827 62%, #0b111d 100%); overflow: hidden; }
  .media-image-viewport { position: relative; display: flex; width: 100%; height: min(68vh, 620px); min-height: 260px; align-items: center; justify-content: center; overflow: hidden; cursor: default; touch-action: none; }
  .media-image-viewport.is-zoomed { cursor: grab; }
  .media-image-viewport.is-dragging { cursor: grabbing; }
  .media-image-viewport > img { display: block; width: auto; height: auto; max-width: 100%; max-height: 100%; border-radius: 12px; object-fit: contain; user-select: none; -webkit-user-drag: none; transform-origin: center; will-change: transform; }
  .media-viewer-hint { position: absolute; bottom: 12px; left: 50%; padding: 4px 9px; border: 1px solid rgba(255, 255, 255, .16); border-radius: 999px; color: #dce8f7; background: rgba(13, 24, 42, .62); box-shadow: 0 4px 12px rgba(5, 12, 27, .18); font-size: 11px; line-height: 1.4; pointer-events: none; transform: translateX(-50%); }
  .media-player-shell { display: flex; width: 100%; align-items: center; justify-content: center; position: relative; }
  .media-player-shell video { display: block; width: min(100%, 880px); height: auto; max-height: min(68vh, 620px); border-radius: 12px; background: #050a12; object-fit: contain; }
  .media-viewer-error { position: absolute; right: 24px; bottom: 26px; left: 24px; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px 13px; border: 1px solid rgba(255, 142, 142, .34); border-radius: 10px; color: #ffd3d3; background: rgba(89, 25, 34, .85); font-size: 12px; }
  .report-tip { margin-bottom: 14px; padding: 11px 13px; border-radius: 8px; color: #7d8aa5; background: #f7f9fc; font-size: 13px; line-height: 1.6; }
  .report-filter { margin-bottom: 12px; }
  .handled-text { color: #a2aec0; font-size: 12px; }
  .comment-submit { display: flex; justify-content: flex-end; margin-top: 0; margin-left: auto; }
  .comment-list { margin-top: 12px; padding: 3px 14px 5px; border: 1px solid var(--community-line); border-radius: 13px; background: var(--community-soft); }
  .comments-load-more { display: flex; align-items: center; justify-content: center; min-height: 36px; margin-top: 8px; border-top: 1px solid var(--community-line); }
  .comments-load-more :deep(.el-button) { margin: 0; color: var(--community-primary); font-size: 12px; }
  .comment-thread + .comment-thread { margin-top: 3px; }
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
  .comment-replies { position: relative; margin: 0 0 3px 40px; padding: 0 0 0 12px; border-left: 1px solid #c7d8ee; }
  .comment-item--reply { display: block; position: relative; margin-left: calc((var(--reply-depth, 1) - 1) * 22px); padding: 6px 0; border-top-color: #e8eef6; }
  .comment-item--reply:first-of-type { border-top: 0; }
  .comment-item--reply .comment-main { width: 100%; }
  .reply-context { margin-right: 4px; color: #6a85a7; font-size: 12px; font-weight: 650; }
  @media (max-width: 900px) {
    .community-layout { grid-template-columns: 1fr; }
    .community-aside { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .hero-summary { flex-wrap: wrap; gap: 18px; }
    .hero-tip { flex-basis: 100%; margin-left: 0; }
    .community-toolbar { align-items: stretch; flex-direction: column; }
    .filter-actions { flex-wrap: wrap; }
    .keyword-input { flex: 1; width: auto; min-width: 220px; }
  }
  @media (max-width: 560px) {
    .community-hero :deep(.el-card__body), .community-card :deep(.el-card__body) { padding-right: 16px; padding-left: 16px; }
    .hero-main { align-items: flex-start; flex-direction: column; }
    .hero-actions { width: 100%; }
    .hero-actions .el-button { flex: 1; }
    .community-aside { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; gap: 0; }
    .media-upload-row { flex-direction: column; }
    .community-media-uploader { flex-basis: auto; }
    .compose-media-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .post-main-grid, .post-footer { padding-right: 16px; padding-left: 16px; }
    .post-main-grid.has-media { grid-template-columns: 1fr; }
    .post-content-pane { padding-right: 0; }
    .post-content-scroll { max-height: none; padding-right: 0; overflow: visible; }
    .post-media-carousel :deep(.el-carousel__container) { height: 220px !important; }
    .post-comments-panel { padding-right: 16px; padding-left: 16px; }
    .comment-replies { margin-left: 39px; padding-right: 9px; padding-left: 11px; }
    .comment-composer-hint { display: none; }
    .comment-item--reply { margin-left: calc((var(--reply-depth, 1) - 1) * 18px); }
    .comment-meta { align-items: flex-start; gap: 6px; }
    .comment-actions { flex-wrap: wrap; justify-content: flex-end; }
    .filter-actions > * { width: 100% !important; }
    .post-actions { flex-wrap: wrap; justify-content: flex-end; }
  }
}
</style>

<style lang="scss">
/* el-dialog 默认 teleport 到 body，媒体播放器样式需要使用非 scoped 规则才能覆盖弹窗内部布局。 */
.community-post-dialog {
  max-width: calc(100vw - 32px);
  overflow: hidden;
  border: 1px solid #e3eaf3;
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(30, 54, 89, .18);

  .el-dialog__header {
    margin-right: 0;
    padding: 18px 22px;
    border-bottom: 1px solid #edf1f6;
  }

  .el-dialog__title { color: #203454; font-size: 17px; font-weight: 750; }
  .el-dialog__body { max-height: min(78vh, 860px); padding: 24px 28px 28px; overflow-y: auto; }
  .el-dialog__footer { padding: 14px 22px; border-top: 1px solid #edf1f6; }
  .el-form-item { margin-bottom: 19px; }
  .community-content-item,
  .community-content-item .el-form-item__content,
  .community-content-item .community-tiptap-editor { width: 100%; min-width: 0; }
  .community-content-item .community-tiptap-editor { --community-editor-sticky-top: -24px; }
  .community-content-item .el-form-item__content { display: block; }
  .el-form-item__label { height: auto; margin-bottom: 6px; padding: 0; color: #51627d; font-size: 12px; font-weight: 700; line-height: 1.4; }
  .el-input__wrapper, .el-textarea__inner, .el-select__wrapper { border-radius: 9px; }
  .el-textarea__inner { line-height: 1.65; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .media-field { margin-top: 6px; padding: 16px; border: 1px solid #e3eaf3; border-radius: 14px; background: #fbfcfe; }
  .media-field-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  .media-field-head > div { display: flex; align-items: center; gap: 8px; }
  .media-field-head strong { color: #354661; font-size: 14px; }
  .media-field-head > div span { color: #98a5b8; font-size: 12px; }
  .media-count { padding: 3px 9px; border: 1px solid #cfe0f4; border-radius: 999px; color: #5689c4; background: #f1f7ff; font-size: 11px; font-weight: 700; }
  .media-field-description { color: #8492a7; font-size: 12px; line-height: 1.5; }
  .media-drag-tip { margin-left: 8px; color: #5689c4; font-weight: 650; }
  .media-upload-row { display: flex; align-items: stretch; gap: 12px; margin-top: 12px; }
  .community-media-uploader { display: block; flex: 0 0 184px; }
  .community-media-uploader .el-upload { display: block; width: 100%; }
  .media-add-card { display: flex; min-height: 86px; align-items: center; justify-content: center; flex-direction: column; gap: 4px; box-sizing: border-box; padding: 10px 12px; border: 1px dashed #a9c9ea; border-radius: 10px; color: #4e91d9; background: #f4f9ff; cursor: pointer; transition: border-color .2s, background .2s, transform .2s; }
  .media-add-card:hover { border-color: #5ca3e8; background: #edf6ff; transform: translateY(-1px); }
  .media-add-card.disabled { color: #a8b5c5; border-color: #d6dee8; background: #f5f7fa; cursor: not-allowed; transform: none; }
  .media-add-icon { display: flex; width: 26px; height: 26px; align-items: center; justify-content: center; border-radius: 8px; color: #fff; background: #5da5e8; font-size: 16px; }
  .media-add-card.disabled .media-add-icon { background: #aab7c7; }
  .media-add-title { color: inherit; font-size: 12px; font-weight: 700; }
  .media-add-subtitle { color: #92a1b5; font-size: 10px; }
  .media-upload-note { display: flex; min-width: 0; justify-content: center; flex-direction: column; gap: 5px; color: #8d9aae; font-size: 11px; line-height: 1.45; }
  .media-upload-note .is-uploading { display: inline-flex; align-items: center; gap: 4px; color: #4e91d9; font-weight: 600; }
  .compose-media-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
  .compose-media-item { min-width: 0; cursor: grab; transition: opacity .2s, transform .2s; }
  .compose-media-item:active { cursor: grabbing; }
  .compose-media-item.is-dragging { opacity: .45; transform: scale(.98); }
  .compose-media-item.is-drag-over .compose-media-preview { border-color: #5da5e8; box-shadow: 0 0 0 2px rgba(93, 165, 232, .22); }
  .compose-media-preview { position: relative; aspect-ratio: 1.35; overflow: hidden; border: 1px solid #e3eaf3; border-radius: 10px; background: #eaf0f7; }
  .compose-media-preview > img, .compose-video-tile { display: block; width: 100%; height: 100%; object-fit: cover; }
  .compose-video-tile { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3px; color: #dce9ff; background: linear-gradient(135deg, #1c3558, #397fc4); font-size: 11px; }
  .compose-video-tile .el-icon { font-size: 24px; }
  .compose-media-info { display: flex; align-items: center; gap: 5px; min-width: 0; margin-top: 6px; }
  .compose-media-order { position: absolute; top: 5px; left: 5px; z-index: 1; display: flex; width: 20px; height: 20px; align-items: center; justify-content: center; border-radius: 6px; color: #fff; background: rgba(20, 43, 73, .72); font-size: 11px; font-weight: 700; }
  .compose-media-type { flex: none; padding: 2px 5px; border-radius: 4px; color: #5689c4; background: #eaf4ff; font-size: 10px; }
  .compose-media-name { min-width: 0; overflow: hidden; color: #71809a; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .media-empty-state { display: flex; min-height: 78px; align-items: center; justify-content: center; flex-direction: column; gap: 3px; margin-top: 12px; border: 1px dashed #d6e0ec; border-radius: 10px; color: #9aa8ba; background: #f8fafc; }
  .media-empty-state .el-icon { color: #a9bdd6; font-size: 22px; }
  .media-empty-state span { font-size: 12px; }
  .media-empty-state small { color: #adb8c6; font-size: 10px; }
  .compose-media-remove { position: absolute; top: 5px; right: 5px; display: flex; width: 20px; height: 20px; align-items: center; justify-content: center; border: 0; border-radius: 50%; color: #fff; background: rgba(13, 24, 42, .65); cursor: pointer; font-size: 16px; line-height: 1; }
  .media-uploading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 5px; color: #fff; background: rgba(13, 33, 61, .56); font-size: 12px; }
  .media-field-hint { margin-top: 9px; color: #98a5b8; font-size: 12px; }
}

.community-post-detail-dialog {
  max-width: calc(100vw - 32px);
  overflow: hidden;
  border: 1px solid #dfe8f3;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 26px 80px rgba(30, 54, 89, .2);

  .el-dialog__header {
    margin-right: 0;
    padding: 0;
    border-bottom: 1px solid #edf1f6;
  }

  .el-dialog__body { padding: 0; }
  .el-dialog__footer { padding: 0; border-top: 1px solid #edf1f6; }

  .post-detail-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 17px 22px;
  }

  .post-detail-dialog-header strong,
  .post-detail-dialog-header span { display: block; }
  .post-detail-dialog-header strong { margin-top: 4px; color: #203454; font-size: 17px; font-weight: 750; }
  .post-detail-eyebrow { color: #6a9bdf; font-size: 10px; font-weight: 800; letter-spacing: 1.7px; }
  .post-detail-dialog-header .el-button { color: #8090a9; background: #f3f6fa; }
  .post-detail-dialog-header .el-button:hover { color: #3f8eea; background: #eaf3ff; }

  .post-detail-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 252px;
    gap: 24px;
    max-height: min(70vh, 720px);
    padding: 25px 26px 28px;
    overflow-y: auto;
  }

  .post-detail-main { min-width: 0; }
  .post-detail-type-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .post-detail-main h2 { margin: 13px 0 5px; color: #1e2f4a; font-size: 25px; font-weight: 750; line-height: 1.4; }
  .post-detail-subtitle { margin: 0; color: #5e7190; font-size: 15px; line-height: 1.6; }
  .post-detail-author { display: flex; align-items: center; gap: 10px; margin-top: 18px; }
  .post-detail-author-line { display: flex; align-items: center; gap: 8px; }
  .post-detail-author-line strong { color: #2b3b58; font-size: 13px; }
  .post-detail-author > div > span { display: block; margin-top: 3px; color: #9aa8ba; font-size: 11px; }
  .post-detail-divider { height: 1px; margin: 20px 0; background: #edf1f6; }
  /* 正文排版继承 CommunityTiptapEditor，确保详情与编辑器保持一致。 */
  .post-detail-copy p { color: #526681; white-space: pre-wrap; overflow-wrap: anywhere; }
  .post-detail-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 18px; }
  .post-detail-media-section { margin-top: 24px; padding-top: 18px; border-top: 1px solid #edf1f6; }
  .post-detail-section-head { display: flex; align-items: baseline; gap: 9px; margin-bottom: 12px; }
  .post-detail-section-head strong { color: #30435f; font-size: 14px; }
  .post-detail-section-head span { color: #9aa8ba; font-size: 11px; }
  .post-detail-media-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .post-detail-media-grid.is-single-media { grid-template-columns: minmax(0, 1fr); }
  .post-detail-media-image, .post-detail-media-video { position: relative; display: block; width: 100%; aspect-ratio: 1.45; overflow: hidden; border: 1px solid #e4ebf4; border-radius: 12px; background: #f4f7fb; }
  .post-detail-media-grid.is-single-media .post-detail-media-image, .post-detail-media-grid.is-single-media .post-detail-media-video { aspect-ratio: 16 / 9; }
  .post-detail-media-image { padding: 0; cursor: zoom-in; }
  .post-detail-media-image img { display: block; width: 100%; height: 100%; object-fit: contain; transition: transform .2s ease, filter .2s ease; }
  .post-detail-media-image:hover img { filter: brightness(.96); transform: scale(1.02); }
  .post-detail-media-video { background: #071222; }
  .post-detail-media-video video { display: block; width: 100%; height: 100%; object-fit: contain; background: #071222; }

  .post-detail-aside { display: grid; align-content: start; gap: 14px; min-width: 0; }
  .post-detail-side-card { padding: 17px; border: 1px solid #e4ebf4; border-radius: 14px; background: #f9fbfe; }
  .post-detail-side-heading { display: flex; align-items: center; gap: 9px; padding-bottom: 14px; border-bottom: 1px solid #e8eef5; }
  .post-detail-side-heading > div { min-width: 0; }
  .post-detail-side-heading strong, .post-detail-side-heading small { display: block; }
  .post-detail-side-heading strong { color: #30435f; font-size: 14px; }
  .post-detail-side-heading small { margin-top: 3px; color: #9aa8ba; font-size: 11px; }
  .post-detail-side-icon { display: inline-flex; width: 32px; height: 32px; align-items: center; justify-content: center; border-radius: 10px; color: #4d91e8; background: #e4f0ff; font-size: 16px; }
  .post-detail-info-list { display: grid; gap: 13px; padding-top: 15px; }
  .post-detail-info-list > div { display: grid; grid-template-columns: 65px minmax(0, 1fr); gap: 10px; align-items: start; }
  .post-detail-info-list span { color: #8b9bb1; font-size: 11px; }
  .post-detail-info-list strong { color: #526681; font-size: 12px; font-weight: 600; line-height: 1.45; text-align: right; overflow-wrap: anywhere; }
  .post-detail-side-tip { background: linear-gradient(145deg, #eef7ff, #f9fcff); }
  .post-detail-side-kicker { display: block; color: #6a9bdf; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; }
  .post-detail-side-tip > strong { display: block; margin-top: 8px; color: #203858; font-size: 16px; }
  .post-detail-side-tip p { margin: 7px 0 14px; color: #71809a; font-size: 12px; line-height: 1.6; }
  .post-detail-side-tip .el-button { width: 100%; border-radius: 9px; }

  .post-detail-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 13px 22px; }
  .post-detail-stats, .post-detail-footer-actions { display: flex; align-items: center; gap: 8px; }
  .post-detail-stats { gap: 14px; color: #97a5b7; font-size: 11px; }
  .post-detail-stats span { display: inline-flex; align-items: center; gap: 4px; }
  .post-detail-footer-actions .el-button { color: #8798ae; }
  .post-detail-footer-actions .el-button:hover, .post-detail-footer-actions .el-button.reacted { color: #3f8eea; }
  .post-detail-footer-actions .el-button--primary { color: #fff; }
}

html.dark .community-post-dialog,
.dark .community-post-dialog {
  border-color: #2a3850;
  background: #141e30;
  box-shadow: 0 24px 70px rgba(0, 0, 0, .45);

  .el-dialog__header, .el-dialog__footer { border-color: #2a3850; }
  .el-dialog__title, .el-form-item__label { color: #e1e9f5; }
  .media-field { border-color: #2a3850; background: #182337; }
  .media-field-description, .media-upload-note { color: #91a3bc; }
  .media-drag-tip { color: #a9c9ed; }
  .media-count { border-color: #365579; color: #a9c9ed !important; background: #203d61; }
  .media-add-card { border-color: #4778a8; color: #a9d3ff; background: #1b3049; }
  .media-add-card:hover { border-color: #75b7f3; background: #203d61; }
  .media-add-card.disabled { color: #8292a8; border-color: #33445c; background: #1b2638; }
  .media-add-subtitle, .media-empty-state small { color: #8193ac; }
  .media-empty-state { border-color: #33445c; color: #91a3bc; background: #182437; }
  .media-empty-state .el-icon { color: #7099c5; }
  .compose-media-type { color: #a9c9ed; background: #203d61; }
  .compose-media-name { color: #91a3bc; }
  .compose-media-preview { border-color: #33445c; background: #243247; }
}

html.dark .community-post-detail-dialog,
.dark .community-post-detail-dialog {
  border-color: #2a3850;
  background: #141e30;
  box-shadow: 0 26px 80px rgba(0, 0, 0, .46);

  .el-dialog__header, .el-dialog__footer { border-color: #2a3850; }
  .post-detail-dialog-header strong { color: #e7eef9; }
  .post-detail-dialog-header .el-button { color: #a9b8cd; background: #1f2d43; }
  .post-detail-dialog-header .el-button:hover { color: #a9d3ff; background: #203d61; }
  .post-detail-main h2 { color: #e7eef9; }
  .post-detail-subtitle { color: #b4c3d7; }
  .post-detail-author-line strong { color: #e1e9f5; }
  .post-detail-author > div > span { color: #8fa3bd; }
  .post-detail-divider, .post-detail-media-section, .post-detail-side-heading { border-color: #2a3850; }
  .post-detail-copy p { color: #b2c0d2; }
  .post-detail-section-head strong { color: #dbe6f5; }
  .post-detail-section-head span { color: #8fa3bd; }
  .post-detail-media-image, .post-detail-media-video { border-color: #33445c; background: #243247; }
  .post-detail-media-video { background: #071222; }
  .post-detail-side-card { border-color: #2a3850; background: #182337; }
  .post-detail-side-heading strong { color: #e1e9f5; }
  .post-detail-side-heading small, .post-detail-info-list span { color: #8fa3bd; }
  .post-detail-side-icon { color: #a9c9ed; background: #203d61; }
  .post-detail-info-list strong { color: #b4c3d7; }
  .post-detail-side-tip { background: linear-gradient(145deg, #1a304a, #17263c); }
  .post-detail-side-tip > strong { color: #e8f2ff; }
  .post-detail-side-tip p { color: #9aaac0; }
  .post-detail-stats { color: #8fa3bd; }
  .post-detail-footer-actions .el-button { color: #9aaac0; }
  .post-detail-footer-actions .el-button:hover, .post-detail-footer-actions .el-button.reacted { color: #86baff; }
}

@media (max-width: 760px) {
  .community-post-detail-dialog {
    .post-detail-body { grid-template-columns: 1fr; }
    .post-detail-aside { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
}

@media (max-width: 560px) {
  .community-post-detail-dialog {
    width: calc(100vw - 24px) !important;

    .post-detail-body { display: block; max-height: 72vh; padding: 18px 16px 20px; }
    .post-detail-aside { grid-template-columns: 1fr; margin-top: 18px; }
    .post-detail-main h2 { font-size: 21px; }
    .post-detail-copy p { font-size: 14px; }
    .post-detail-media-grid { grid-template-columns: 1fr; }
    .post-detail-footer { align-items: stretch; flex-direction: column; padding: 12px 16px; }
    .post-detail-footer-actions { justify-content: flex-end; }
  }

  .community-post-dialog {
    width: calc(100vw - 24px) !important;

    .el-dialog__body { padding: 16px; }
    .community-content-item .community-tiptap-editor { --community-editor-sticky-top: -16px; }
    .form-grid { grid-template-columns: 1fr; gap: 0; }
    .media-upload-row { flex-direction: column; }
    .community-media-uploader { flex-basis: auto; }
    .compose-media-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  }
}

.community-media-viewer {
  overflow: hidden;
  border: 1px solid rgba(126, 157, 202, .28);
  border-radius: 20px;
  background: #101828;
  box-shadow: 0 24px 70px rgba(5, 12, 27, .45);

  .el-dialog__header {
    margin-right: 0;
    padding: 0;
    border-bottom: 1px solid rgba(142, 170, 211, .14);
  }

  .el-dialog__body { padding: 0; }

  .media-viewer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 17px 20px;
  }

  .media-viewer-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .media-viewer-title strong {
    display: block;
    max-width: 650px;
    overflow: hidden;
    margin-top: 4px;
    color: #f2f6fd;
    font-size: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .media-viewer-eyebrow {
    display: block;
    color: #7eaee9;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.7px;
  }

  .media-viewer-header .el-button {
    color: #a9b8cd;
    background: rgba(255, 255, 255, .08);
  }

  .media-viewer-header .el-button:hover {
    color: #fff;
    background: rgba(255, 255, 255, .16);
  }

  .media-viewer-zoom-label {
    min-width: 42px;
    color: #dce8f7;
    font-size: 12px;
    text-align: center;
  }

  .media-viewer-reset {
    padding-right: 8px;
    padding-left: 8px;
    font-size: 12px;
  }

  .media-viewer-stage {
    display: flex;
    width: 100%;
    min-height: min(560px, 68vh);
    align-items: center;
    justify-content: center;
    padding: 22px;
    box-sizing: border-box;
    background: radial-gradient(circle at 50% 20%, #213554 0%, #101827 62%, #0b111d 100%);
    overflow: hidden;
  }

  .media-image-viewport {
    position: relative;
    display: flex;
    width: 100%;
    height: min(68vh, 620px);
    min-height: 260px;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: default;
    touch-action: none;
  }

  .media-image-viewport.is-zoomed { cursor: grab; }
  .media-image-viewport.is-dragging { cursor: grabbing; }

  .media-image-viewport > img {
    display: block;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    border-radius: 12px;
    object-fit: contain;
    user-select: none;
    -webkit-user-drag: none;
    transform-origin: center;
    will-change: transform;
  }

  .media-viewer-hint {
    position: absolute;
    bottom: 12px;
    left: 50%;
    padding: 4px 9px;
    border: 1px solid rgba(255, 255, 255, .16);
    border-radius: 999px;
    color: #dce8f7;
    background: rgba(13, 24, 42, .62);
    box-shadow: 0 4px 12px rgba(5, 12, 27, .18);
    font-size: 11px;
    line-height: 1.4;
    pointer-events: none;
    transform: translateX(-50%);
  }

  .media-player-shell {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .media-player-shell video {
    display: block;
    width: min(100%, 880px);
    height: auto;
    max-height: min(68vh, 620px);
    border-radius: 12px;
    background: #050a12;
    object-fit: contain;
  }

  .media-viewer-error {
    position: absolute;
    right: 24px;
    bottom: 26px;
    left: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 10px 13px;
    border: 1px solid rgba(255, 142, 142, .34);
    border-radius: 10px;
    color: #ffd3d3;
    background: rgba(89, 25, 34, .85);
    font-size: 12px;
  }
}

/* 详情内容在信息流内展开，媒体预览仍通过 teleport 到 body，需要非 scoped 规则。 */
.comment-emoji-picker {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  max-height: 184px;
  overflow-y: auto;
  padding: 3px;
}

.comment-emoji {
  display: flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
  font-size: 20px;
}

.comment-emoji:hover {
  background: #edf5ff;
}

html.dark .department-community-page,
.dark .department-community-page {
  --community-ink: #e7eef9;
  --community-muted: #9aaac0;
  --community-line: #2a3850;
  --community-primary: #6daaf5;
  --community-surface: #141e30;
  --community-soft: #1a263a;
  --community-shadow: 0 18px 42px rgba(0, 0, 0, .22);

  .community-hero {
    border-color: rgba(101, 150, 209, .3);
    background: radial-gradient(circle at 85% 12%, rgba(58, 129, 203, .24), transparent 28%), linear-gradient(118deg, #17263c 0%, #1a304a 58%, #17253b 100%);
  }

  .hero-kicker { color: #84b7f4; }
  .hero-main p, .hero-tip, .summary-item div span { color: #9aaac0; }
  .hero-summary { border-top-color: rgba(151, 188, 230, .16); }
  .summary-item { border-color: rgba(101, 150, 209, .28); background: rgba(20, 32, 51, .68); }
  .summary-icon.blue { color: #86baff; background: #203d61; }
  .summary-icon.green { color: #78d1ad; background: #1d433e; }
  .summary-icon.orange { color: #f2b769; background: #4b3822; }
  .community-toolbar, .post-card, .post-list .el-empty, .aside-card { background: #131c2c; }
  .community-card { background: transparent; }
  .feed-tab { color: #9aaac0; }
  .feed-tab:hover { background: #1b2b42; }
  .post-card:hover { border-color: #3b6590; background: #17253a; }
  .author-line strong, .post-content-pane h3, .comment-heading, .comment-line strong { color: #e1e9f5; }
  .post-subtitle { color: #b4c3d7; }
  .post-detail-button { color: #9aaac0; }
  .post-detail-button:hover { color: #86baff; background: #203d61; }
  .dept-name { color: #a3b1c4; background: #253247; }
  .post-content-scroll p, .comment-line, .comment-content { color: #abb9cc; }
  .post-content-scroll { scrollbar-color: #526b8a transparent; }
  .post-content-scroll::-webkit-scrollbar-thumb { background: #526b8a; }
  .post-media-thumb, .compose-media-item { background: #243247; }
  .post-carousel-slide { background: #243247; }
  .media-field { border-color: #2a3850; }
  .media-field-head span, .media-field-head small, .media-field-hint { color: #91a3bc; }
  .media-field { background: #182337; }
  .report-tip { color: #a1b0c5; background: #1b293e; }
  .comment-item { border-top-color: #26354b; }
  .comments-load-more { border-top-color: #2a3850; }
  .comment-replies { border-left-color: #466b94; }
  .comment-item--reply { border-top-color: #2a3850; }
  .comment-time { color: #8fa3bd; }
  .comment-dept { color: #a6b7ca; }
  .comment-meta-divider { color: #5c718d; }
  .reply-context { color: #a9c9ed; }
  .comment-separator { color: #8da0b8; }
  .comment-tool-button:hover, .comment-emoji:hover { background: #203d61; }
  .aside-card-head { border-bottom-color: #2a3850; }
  .aside-card-icon.blue { color: #86baff; background: #203d61; }
  .aside-card-head strong, .aside-rule strong { color: #e1e9f5; }
  .aside-cta { background: linear-gradient(145deg, #1a304a, #17263c); }
  .aside-cta > strong { color: #e8f2ff; }
  .aside-cta p { color: #9aaac0; }
}
</style>
