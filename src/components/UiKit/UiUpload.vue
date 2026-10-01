<template>
  <!--
    Animal Island 暂无文件上传组件，上传能力暂由 Element Plus 承载。
    统一入口和样式类名后，后续替换底层实现不会影响业务页面。
  -->
  <ElUpload ref="uploadRef" v-bind="uploadAttrs" :class="uploadClass">
    <slot />
    <template v-if="$slots.tip" #tip><slot name="tip" /></template>
    <template v-if="$slots.file" #file="slotProps"><slot name="file" v-bind="slotProps" /></template>
  </ElUpload>
</template>

<script setup lang="ts">
/**
 * 文件上传适配器。
 *
 * Animal Island 当前没有与 Element Upload 对等的组件，因此这里保留
 * Element Plus 的上传行为，同时提供动森主题语义类名和统一的插槽入口。
 * 业务组件只依赖 UiUpload，后续补充原生动森上传组件时无需改动页面。
 */
import { computed, ref, useAttrs } from 'vue';
import { ElUpload } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const uploadRef = ref<{ handleRemove?: (file: unknown) => void; submit?: () => void; clearFiles?: () => void }>();

const uploadAttrs = computed(() => {
  const next = { ...attrs };
  Reflect.deleteProperty(next, 'class');
  return next;
});

const uploadClass = computed(() => [
  'ui-upload',
  { 'ui-upload--animal': isAnimalMode.value },
  attrs.class
]);

// 保留共享上传组件依赖的 Element Upload 实例方法。
defineExpose({
  handleRemove: (file: unknown) => uploadRef.value?.handleRemove?.(file),
  submit: () => uploadRef.value?.submit?.(),
  clearFiles: () => uploadRef.value?.clearFiles?.()
});
</script>

<style scoped>
:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload-dragger) {
  border: 2px dashed var(--animal-border-color, #a9b9ad);
  border-radius: 16px;
  background: var(--animal-bg-color-input, #fffbe7);
  color: var(--animal-text-color, #435846);
  transition: border-color .2s ease, background-color .2s ease, box-shadow .2s ease;
}

:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload-dragger:hover) {
  border-color: var(--animal-primary-color, #19c8b9);
  background: var(--animal-bg-color-secondary, #fffdf7);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--animal-primary-color, #19c8b9) 14%, transparent);
}

:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload--picture-card) {
  border: 2px dashed var(--animal-border-color, #a9b9ad);
  border-radius: 14px;
  background: var(--animal-bg-color-input, #fffbe7);
  color: var(--animal-primary-color, #19c8b9);
}

:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload--picture-card:hover) {
  border-color: var(--animal-primary-color, #19c8b9);
  background: var(--animal-bg-color-secondary, #fffdf7);
}

:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload-list__item) {
  border-radius: 10px;
  border-color: var(--animal-border-color-light, #d7e2d8);
  background: var(--animal-bg-color-secondary, #fffdf7);
  color: var(--animal-text-color, #435846);
}

:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload-list__item-name) {
  color: var(--animal-primary-color, #178f87);
}

:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload__tip) {
  color: var(--animal-text-color-secondary, #708273);
}

:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload-list__item.is-success .el-upload-list__item-status-label) {
  color: var(--animal-status-success, #4d9c69);
}

:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload-list__item .el-icon--close-tip),
:global(html[data-ui-theme='animal'] .ui-upload--animal .el-upload-list__item .el-icon--close) {
  color: var(--animal-status-danger, #c96767);
}

@media (prefers-reduced-motion: reduce) {
  :global(html[data-ui-theme='animal'] .ui-upload--animal *) {
    transition: none !important;
  }
}
</style>
