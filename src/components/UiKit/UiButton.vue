<template>
  <AnimalButton
    v-if="isAnimalMode"
    v-bind="animalAttrs"
    :class="animalClass"
    :type="animalType"
    :size="animalSize"
    :loading="loading"
    :disabled="disabled"
    :danger="danger || type === 'danger'"
    :ghost="plain"
    :block="block"
    :icon="animalIconName"
    @click="handleClick"
  >
    <template v-if="animalIconComponent" #icon>
      <component :is="animalIconComponent" />
    </template>
    <slot />
  </AnimalButton>
  <ElButton
    v-else
    v-bind="attrs"
    :type="type"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :plain="plain"
    :round="round"
    :text="text"
    :link="link"
    :circle="circle"
    @click="handleClick"
  >
    <slot />
  </ElButton>
</template>

<script setup lang="ts">
/**
 * 业务按钮适配器。
 * 页面只依赖这一层，不直接感知当前使用的是 Element Plus 还是 Animal Island，
 * 避免主题切换时在每个页面重复编写组件分支。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CircleCheck,
  CircleClose,
  CirclePlus,
  Close,
  CopyDocument,
  Delete,
  Document,
  DocumentAdd,
  DocumentCopy,
  Download,
  Edit,
  InfoFilled,
  Key,
  Menu,
  Minus,
  More,
  Notification,
  Operation,
  Plus,
  Pointer,
  QuestionFilled,
  Refresh,
  RefreshLeft,
  RefreshRight,
  Search,
  Setting,
  Sort,
  SwitchButton,
  Top,
  Unlock,
  Upload,
  UploadFilled,
  User,
  View,
  WarnTriangleFilled,
  Warning
} from '@element-plus/icons-vue';
import { ElButton } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type UiButtonSize = 'small' | 'default' | 'large';
type UiButtonType = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const props = withDefaults(
  defineProps<{
    type?: UiButtonType;
    size?: UiButtonSize;
    loading?: boolean;
    disabled?: boolean;
    plain?: boolean;
    round?: boolean;
    text?: boolean;
    link?: boolean;
    circle?: boolean;
    danger?: boolean;
    block?: boolean;
  }>(),
  {
    type: 'default',
    size: 'default',
    loading: false,
    disabled: false,
    plain: false,
    round: false,
    text: false,
    link: false,
    circle: false,
    danger: false,
    block: false
  }
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalButton = defineAsyncComponent(() => import('animal-island-vue').then(({ Button }) => Button));

const animalType = computed<'text' | 'link' | 'primary' | 'default' | 'dashed'>(() => {
  if (props.text) return 'text';
  if (props.link) return 'link';
  if (props.type === 'primary') return 'primary';
  if (props.type === 'info') return 'dashed';
  return 'default';
});

const animalSize = computed<'small' | 'middle' | 'large'>(() => {
  if (props.size === 'small') return 'small';
  if (props.size === 'large') return 'large';
  return 'middle';
});

/**
 * 兼容 Element Plus 的 icon 属性。
 * 字符串交给 Animal Button 直接渲染，组件对象通过 icon 插槽渲染，避免出现 [object Object]。
 */
const animalIcon = computed(() => attrs.icon);
const animalIconMap = {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CircleCheck,
  CircleClose,
  CirclePlus,
  Close,
  CopyDocument,
  Delete,
  Document,
  DocumentAdd,
  DocumentCopy,
  Download,
  Edit,
  InfoFilled,
  Key,
  Menu,
  Minus,
  More,
  Notification,
  Operation,
  Plus,
  Pointer,
  QuestionFilled,
  Refresh,
  RefreshLeft,
  RefreshRight,
  Search,
  Setting,
  Sort,
  SwitchButton,
  Top,
  Unlock,
  Upload,
  UploadFilled,
  User,
  View,
  WarnTriangleFilled,
  Warning
} as Record<string, unknown>;
const animalIconName = computed(() => undefined);
const animalIconComponent = computed(() => (typeof animalIcon.value === 'string' ? animalIconMap[animalIcon.value] : animalIcon.value));
const animalClass = computed(() => [
  'ui-animal-button',
  `ui-animal-button--${props.type}`,
  { 'ui-animal-button--circle': props.circle, 'ui-animal-button--round': props.round }
]);

const animalAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  Reflect.deleteProperty(nextAttrs, 'icon');
  Reflect.deleteProperty(nextAttrs, 'type');
  Reflect.deleteProperty(nextAttrs, 'size');
  Reflect.deleteProperty(nextAttrs, 'loading');
  Reflect.deleteProperty(nextAttrs, 'disabled');
  return nextAttrs;
});

const handleClick = (event: MouseEvent) => emit('click', event);
</script>

<style scoped>
/* Element Plus 的语义类型在 Animal Button 中没有一一对应的 type，使用类名补上状态色。 */
:global(html[data-ui-theme='animal'] .ui-animal-button--success) {
  --animal-button-semantic-color: var(--animal-status-success, #55a86b);
}

:global(html[data-ui-theme='animal'] .ui-animal-button--warning) {
  --animal-button-semantic-color: var(--animal-status-warning, #c88b2b);
}

:global(html[data-ui-theme='animal'] .ui-animal-button--info) {
  --animal-button-semantic-color: var(--animal-status-info, #5c91c9);
}

:global(html[data-ui-theme='animal'] .ui-animal-button--circle) {
  width: 40px;
  min-width: 40px;
  padding: 0;
  aspect-ratio: 1;
  border-radius: 50%;
}

/*
 * Element Plus 图标组件渲染为无内置尺寸的 SVG；Animal Button 的图标插槽
 * 不会自动继承按钮字号，因此需要显式设置尺寸，避免图标塌缩为 0×0。
 */
:global(html[data-ui-theme='animal'] .ui-animal-button .animal-btn__icon svg) {
  display: block;
  flex: 0 0 auto;
  width: 1em;
  height: 1em;
}

:global(html[data-ui-theme='animal'] .ui-animal-button--success:not(.animal-btn--primary)),
:global(html[data-ui-theme='animal'] .ui-animal-button--warning:not(.animal-btn--primary)),
:global(html[data-ui-theme='animal'] .ui-animal-button--info:not(.animal-btn--primary)) {
  color: var(--animal-button-semantic-color);
  border-color: color-mix(in srgb, var(--animal-button-semantic-color) 70%, var(--animal-border-color));
}

@media (prefers-reduced-motion: reduce) {
  :global(html[data-ui-theme='animal'] .ui-animal-button) {
    transition: none !important;
  }
}
</style>
