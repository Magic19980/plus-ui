<template>
  <CommunityTiptapEditor
    v-bind="$attrs"
    :model-value="modelValue"
    :min-height="minHeight"
    :max-length="maxLength"
    :read-only="readOnly"
    :placeholder="placeholder"
    :show-hint="preset === 'community'"
    :show-video="preset === 'notice'"
    :upload-image="resolvedUploadImage"
    :upload-video="resolvedUploadVideo"
    @update:model-value="emit('update:modelValue', $event)"
    @update:media-oss-ids="emit('update:mediaOssIds', $event)"
    @update:uploading="emit('update:uploading', $event)"
  />
</template>

<script setup lang="ts">
/**
 * 统一富文本入口：所有业务只依赖 TiptapEditor，差异通过 preset 和上传适配器配置。
 * 内容始终以 HTML 字符串交互，沿用历史 OSS 标记格式，避免已有数据迁移。
 */
import { computed } from 'vue';
import { uploadOss } from '@/api/system/oss';
import { getToken } from '@/utils/auth';
import CommunityTiptapEditor, { type TiptapUploadHandler } from '@/components/CommunityTiptapEditor/index.vue';

defineOptions({ inheritAttrs: false });

type TiptapPreset = 'community' | 'notice' | 'minimal';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    minHeight?: number;
    maxLength?: number;
    readOnly?: boolean;
    placeholder?: string;
    preset?: TiptapPreset;
    uploadImage?: TiptapUploadHandler;
    uploadVideo?: TiptapUploadHandler;
  }>(),
  {
    modelValue: '',
    minHeight: 300,
    maxLength: 10000,
    readOnly: false,
    placeholder: '请输入内容',
    preset: 'minimal'
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
  (event: 'update:mediaOssIds', value: string): void;
  (event: 'update:uploading', value: boolean): void;
}>();

const baseUrl = import.meta.env.VITE_APP_BASE_API;

const buildPreviewUrl = (ossId: string | number) => {
  const query = new URLSearchParams({
    Authorization: `Bearer ${getToken()}`,
    clientid: import.meta.env.VITE_APP_CLIENT_ID
  });
  return `${baseUrl}/resource/oss/preview/${ossId}?${query.toString()}`;
};

const uploadGenericOss: TiptapUploadHandler = async file => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await uploadOss(formData);
  const data = response.data;
  if (!data?.ossId) {
    throw new Error('上传响应不完整');
  }
  return {
    ossId: data.ossId,
    previewUrl: buildPreviewUrl(data.ossId),
    fileName: data.fileName || file.name
  };
};

/** 社区需要媒体关系；其他业务使用通用 OSS 上传。 */
const resolvedUploadImage = computed<TiptapUploadHandler | undefined>(() => {
  if (props.uploadImage) return props.uploadImage;
  return props.preset === 'community' ? undefined : uploadGenericOss;
});

const resolvedUploadVideo = computed<TiptapUploadHandler | undefined>(() => {
  if (props.uploadVideo) return props.uploadVideo;
  return props.preset === 'notice' ? uploadGenericOss : undefined;
});
</script>
