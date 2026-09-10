<template>
  <el-avatar v-bind="$attrs" :size="size" :src="avatarSrc || undefined">
    {{ avatarText(name) }}
  </el-avatar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { loadAvatarUrl } from '@/utils/avatar';

defineOptions({ inheritAttrs: false });

interface Props {
  name?: string;
  ossId?: string | number;
  size?: number | 'large' | 'default' | 'small';
  src?: string;
}

const props = withDefaults(defineProps<Props>(), {
  name: '匿名用户',
  size: 32,
  src: ''
});

const avatarSrc = ref(props.src);

function avatarText(value?: string) {
  return (value || '匿').slice(0, 1);
}

async function refreshAvatar() {
  avatarSrc.value = props.src || '';
  if (avatarSrc.value) return;

  const requestedOssId = props.ossId;
  const loadedUrl = await loadAvatarUrl(requestedOssId);
  if (!props.src && String(props.ossId ?? '') === String(requestedOssId ?? '')) avatarSrc.value = loadedUrl;
}

watch([() => props.src, () => props.ossId], () => void refreshAvatar(), { immediate: true });
</script>
