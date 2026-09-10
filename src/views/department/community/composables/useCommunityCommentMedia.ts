import type { UploadRequestOptions } from 'element-plus';
import { ref } from 'vue';

import { uploadDepartmentCommunityCommentMedia } from '@/api/department/community';
import type { DepartmentCommunityMediaVO } from '@/api/department/community/types';
import modal from '@/plugins/modal';
import { toCommunityUploadError } from '../utils';

/** 评论编辑器中的临时图片状态。 */
export type CommunityCommentMediaDraft = DepartmentCommunityMediaVO & {
  key: string;
  localUrl?: string;
  uploadStatus: 'uploading' | 'done';
};

/** 管理评论图片的上传、删除和本地预览资源释放。 */
export function useCommunityCommentMedia(maxCount = 3) {
  const commentMediaItems = ref<CommunityCommentMediaDraft[]>([]);
  const commentMediaUploading = ref(false);

  /** 清空评论图片并释放本地预览 URL。 */
  const resetCommentMedia = () => {
    commentMediaItems.value.forEach(item => {
      if (item.localUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localUrl);
    });
    commentMediaItems.value = [];
    commentMediaUploading.value = false;
  };

  /** 校验并上传评论图片，上传成功后保留本地预览地址。 */
  const handleCommentMediaUpload = async (options: UploadRequestOptions) => {
    const file = options.file as File;
    if (commentMediaItems.value.length >= maxCount) {
      modal.msgWarning(`一条评论最多上传${maxCount}张图片`);
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
    const item: CommunityCommentMediaDraft = {
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
      options.onError?.(toCommunityUploadError(error));
      modal.msgError('评论图片上传失败，请稍后重试');
    } finally {
      commentMediaUploading.value = commentMediaItems.value.some(media => media.uploadStatus === 'uploading');
    }
  };

  /** 删除评论图片并释放对应的本地预览 URL。 */
  const removeCommentMedia = (item: CommunityCommentMediaDraft) => {
    if (item.localUrl?.startsWith('blob:')) URL.revokeObjectURL(item.localUrl);
    commentMediaItems.value = commentMediaItems.value.filter(media => media.key !== item.key);
    commentMediaUploading.value = commentMediaItems.value.some(media => media.uploadStatus === 'uploading');
  };

  return {
    maxCommentMediaCount: maxCount,
    commentMediaItems,
    commentMediaUploading,
    resetCommentMedia,
    handleCommentMediaUpload,
    removeCommentMedia
  };
}
