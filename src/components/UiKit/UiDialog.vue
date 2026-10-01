<template>
  <AnimalModal
    v-if="useAnimalDialog"
    v-bind="animalAttrs"
    :open="modelValue"
    :title="title"
    :width="width"
    :mask-closable="closeOnClickModal"
    :show-footer="showAnimalFooter"
    :typewriter="false"
    @update:open="handleOpenUpdate"
    @close="handleClose"
    @ok="handleConfirm"
  >
    <template v-if="$slots.header" #title><slot name="header" /></template>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </AnimalModal>

  <ElDialog
    v-else
    v-bind="elementAttrs"
    :model-value="modelValue"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :destroy-on-close="destroyOnClose"
    @update:model-value="handleOpenUpdate"
    @close="handleClose"
    @closed="emit('closed')"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </ElDialog>
</template>

<script setup lang="ts">
/**
 * 对话框适配器。
 * 统一 v-model、关闭和确认事件，让业务页面不再直接依赖某个组件库的弹窗 API。
 */
import { computed, defineAsyncComponent, useAttrs, useSlots } from 'vue';
import { ElDialog } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    width?: string | number;
    showFooter?: boolean;
    closeOnClickModal?: boolean;
    closeOnPressEscape?: boolean;
    destroyOnClose?: boolean;
  }>(),
  {
    modelValue: false,
    title: '',
    width: '520px',
    showFooter: false,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    destroyOnClose: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
  closed: [];
  confirm: [];
}>();

const attrs = useAttrs();
const slots = useSlots();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalModal = defineAsyncComponent(() => import('animal-island-vue').then(({ Modal }) => Modal));
// Animal Modal 固定支持 ESC，但不支持 destroy-on-close 和关闭 ESC 的配置；
// 这两种场景回退到 Element Plus，避免静默丢失业务语义。
const useAnimalDialog = computed(() => isAnimalMode.value && !props.destroyOnClose && props.closeOnPressEscape);
const showAnimalFooter = computed(() => props.showFooter || Boolean(slots.footer));

const removeAdapterAttrs = (source: Record<string, unknown>) => {
  const next = { ...source };
  ['modelValue', 'title', 'width', 'showFooter', 'closeOnClickModal', 'closeOnPressEscape', 'destroyOnClose'].forEach(key => Reflect.deleteProperty(next, key));
  return next;
};
const animalAttrs = computed(() => {
  const next = removeAdapterAttrs(attrs);
  // AnimalModal 使用 Teleport/Fragment 渲染，无法继承 class 和 append-to-body；
  // 业务页面的动森样式使用插槽内语义类名承载，避免产生 Vue 属性警告。
  ['class', 'append-to-body'].forEach(key => Reflect.deleteProperty(next, key));
  return next;
});
const elementAttrs = computed(() => removeAdapterAttrs(attrs));

const handleOpenUpdate = (value: boolean) => emit('update:modelValue', value);
const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};
const handleConfirm = () => emit('confirm');
</script>
