<template>
  <AnimalDrawer
    v-if="useAnimalDrawer"
    v-bind="animalAttrs"
    :open="modelValue"
    :title="title"
    :placement="placement"
    :width="drawerWidth"
    :height="drawerHeight"
    :mask-closable="closeOnClickModal"
    @close="handleClose"
  >
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </AnimalDrawer>

  <ElDrawer
    v-else
    v-bind="elementAttrs"
    :model-value="modelValue"
    :title="title"
    :direction="elementDirection"
    :size="size"
    :with-header="withHeader"
    :close-on-click-modal="closeOnClickModal"
    :destroy-on-close="destroyOnClose"
    @update:model-value="handleOpenUpdate"
    @close="handleClose"
  >
    <slot />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </ElDrawer>
</template>

<script setup lang="ts">
/**
 * 抽屉适配器。右侧抽屉在两套主题下保持同一套 v-model 与关闭语义，
 * Animal 模式额外使用其原生的焦点管理和背景下沉效果。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElDrawer } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    title?: string;
    placement?: DrawerPlacement;
    size?: string | number;
    withHeader?: boolean;
    closeOnClickModal?: boolean;
    destroyOnClose?: boolean;
  }>(),
  {
    modelValue: false,
    title: '',
    placement: 'right',
    size: '378px',
    withHeader: true,
    closeOnClickModal: true,
    destroyOnClose: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalDrawer = defineAsyncComponent(() => import('animal-island-vue').then(({ Drawer }) => Drawer));
// Animal Drawer 不支持 with-header 和 destroy-on-close；出现这些属性时回退，
// 保证业务页面不会因为切换主题而改变标题或销毁策略。
const useAnimalDrawer = computed(() => isAnimalMode.value && props.withHeader && !props.destroyOnClose);
const drawerWidth = computed(() => (props.placement === 'left' || props.placement === 'right' ? props.size : undefined));
const drawerHeight = computed(() => (props.placement === 'top' || props.placement === 'bottom' ? props.size : undefined));
const elementDirection = computed<'rtl' | 'ltr' | 'ttb' | 'btt'>(() => {
  if (props.placement === 'right') return 'rtl';
  if (props.placement === 'left') return 'ltr';
  if (props.placement === 'top') return 'ttb';
  return 'btt';
});

const removeAdapterAttrs = (source: Record<string, unknown>) => {
  const next = { ...source };
  ['modelValue', 'title', 'placement', 'size', 'withHeader', 'closeOnClickModal', 'destroyOnClose'].forEach(key => Reflect.deleteProperty(next, key));
  return next;
};
const animalAttrs = computed(() => {
  const next = removeAdapterAttrs(attrs);
  // Animal Drawer 固定 Teleport 到 body，避免把 Element 专属属性透传到 DOM。
  Reflect.deleteProperty(next, 'append-to-body');
  return next;
});
const elementAttrs = computed(() => removeAdapterAttrs(attrs));

const handleOpenUpdate = (value: boolean) => emit('update:modelValue', value);
const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};
</script>
