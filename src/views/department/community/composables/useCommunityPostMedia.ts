import type { UploadRequestOptions } from 'element-plus';
import { ref } from 'vue';

import { uploadDepartmentCommunityMedia } from '@/api/department/community';
import type { DepartmentCommunityMediaVO } from '@/api/department/community/types';
import modal from '@/plugins/modal';
import { toCommunityUploadError } from '../utils';

/** 帖子附件在编辑器中的临时状态。 */
export type CommunityMediaDraft = DepartmentCommunityMediaVO & {
  key: string;
  localUrl?: string;
  uploadStatus: 'uploading' | 'done';
};

/**
 * 管理帖子独立附件的上传、排序和释放。
 *
 * <p>正文图片由富文本编辑器单独管理，本 composable 只处理不插入正文的图片和视频附件。</p>
 */
export function useCommunityPostMedia(maxCount = 9) {
  const mediaItems = ref<CommunityMediaDraft[]>([]);
  const mediaUploading = ref(false);
  const draggingMediaKey = ref<string>();
  const dragOverMediaKey = ref<string>();

  /** 清除拖拽中的临时状态。 */
  const clearMediaDrag = () => {
    draggingMediaKey.value = undefined;
    dragOverMediaKey.value = undefined;
  };

  /** 清空附件并释放本地预览 URL。 */
  const resetMedia = () => {
    clearMediaDrag();
    mediaItems.value.forEach(item => {
      if (item.localUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localUrl);
    });
    mediaItems.value = [];
    mediaUploading.value = false;
  };

  /** 删除附件并释放对应的本地预览 URL。 */
  const removeMedia = (item: CommunityMediaDraft) => {
    if (item.localUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localUrl);
    mediaItems.value = mediaItems.value.filter(media => media.key !== item.key);
    mediaUploading.value = mediaItems.value.some(media => media.uploadStatus === 'uploading');
  };

  /** 校验并上传帖子附件，成功后保留本地预览地址避免上传完成时缩略图闪烁。 */
  const handleMediaUpload = async (options: UploadRequestOptions) => {
    const file = options.file as File;
    if (mediaItems.value.length >= maxCount) {
      modal.msgWarning(`一条内容最多上传${maxCount}个媒体文件`);
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
      options.onError?.(toCommunityUploadError(error));
      modal.msgError('媒体上传失败，请稍后重试');
    } finally {
      mediaUploading.value = mediaItems.value.some(media => media.uploadStatus === 'uploading');
    }
  };

  /** 记录拖拽源，供附件排序使用。 */
  const handleMediaDragStart = (event: DragEvent, item: CommunityMediaDraft) => {
    draggingMediaKey.value = item.key;
    dragOverMediaKey.value = undefined;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', item.key);
    }
  };

  /** 更新拖拽目标样式。 */
  const handleMediaDragOver = (item: CommunityMediaDraft) => {
    if (draggingMediaKey.value && draggingMediaKey.value !== item.key) {
      dragOverMediaKey.value = item.key;
    }
  };

  /** 完成附件排序，并统一清理拖拽状态。 */
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

  return {
    maxMediaCount: maxCount,
    mediaItems,
    mediaUploading,
    resetMedia,
    handleMediaUpload,
    removeMedia,
    draggingMediaKey,
    dragOverMediaKey,
    clearMediaDrag,
    handleMediaDragStart,
    handleMediaDragOver,
    handleMediaDrop
  };
}
