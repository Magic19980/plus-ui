<template>
  <slot v-if="isDisabled" />
  <AnimalTooltip
    v-else-if="isAnimalMode && !teleported"
    v-bind="animalAttrs"
    :title="tooltipText"
    :placement="placement"
    :trigger="trigger"
    :variant="variant"
    :bordered="bordered"
  >
    <slot />
  </AnimalTooltip>
  <ElementTooltip
    v-else
    v-bind="attrs"
    :content="tooltipText"
    :placement="placement"
    :trigger="trigger"
    :teleported="isAnimalMode ? teleported : true"
    :show-after="120"
    :hide-after="0"
    :popper-options="{ strategy: 'fixed' }"
    :popper-class="tooltipPopperClass"
  >
    <slot />
  </ElementTooltip>
</template>

<script setup lang="ts">
/** 统一提示气泡适配器：动森模式使用 Animal Tooltip，办公模式保留 Element Plus。 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElTooltip as ElementTooltip } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type TooltipPlacement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end';
type TooltipTrigger = 'hover' | 'focus' | 'click';

const props = withDefaults(
  defineProps<{
    title?: string;
    /** Element Plus 原生属性名，便于旧页面直接迁移到统一适配器。 */
    content?: string;
    disabled?: boolean;
    placement?: TooltipPlacement;
    trigger?: TooltipTrigger;
    /** 保留主题适配接口，由统一 popper 样式处理外观。 */
    variant?: 'default' | 'island';
    bordered?: boolean;
    /** 动森模式下是否将气泡传送到 body，避免被表格、固定列或导航容器裁剪。 */
    teleported?: boolean;
  }>(),
  { title: '', content: '', disabled: false, placement: 'bottom', trigger: 'hover', variant: 'island', bordered: true, teleported: true }
);

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const tooltipText = computed(() => props.title || props.content || '');
const isDisabled = computed(() => props.disabled || !tooltipText.value);
const teleported = computed(() => props.teleported);
const AnimalTooltip = defineAsyncComponent(() => import('animal-island-vue').then(({ Tooltip }) => Tooltip));
const animalAttrs = computed(() => {
  const next = { ...attrs };
  // 这些属性属于 Element Plus 兼容层，不应透传给 Animal Tooltip。
  ['content', 'placement', 'trigger', 'disabled', 'effect', 'showAfter', 'hideAfter', 'teleported', 'popperClass'].forEach((key) => {
    Reflect.deleteProperty(next, key);
  });
  return next;
});
const tooltipPopperClass = computed(() => {
  const extraClass = attrs['popper-class'];
  if (!extraClass) return 'ui-tooltip-popper';
  const extraClasses = Array.isArray(extraClass) ? extraClass.join(' ') : String(extraClass);
  return `ui-tooltip-popper ${extraClasses}`;
});
</script>

<style scoped>
/* Element Plus 分支及动森模式的表格/导航气泡 teleport 到 body，脱离滚动容器和固定列的裁剪区域。 */
:global(.ui-tooltip-popper) {
  z-index: 100000 !important;
  max-width: 280px;
  padding: 7px 11px;
  border: 1px solid var(--app-surface-border) !important;
  border-radius: 10px !important;
  color: var(--app-text-title) !important;
  background: var(--app-surface-bg) !important;
  box-shadow: var(--app-shadow-md) !important;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-line;
  word-break: break-word;
}

:global(.ui-tooltip-popper .el-popper__arrow::before) {
  border-color: var(--app-surface-border) !important;
  background: var(--app-surface-bg) !important;
}

:global(html.dark .ui-tooltip-popper),
:global(html[data-color-mode='dark'] .ui-tooltip-popper) {
  border-color: rgba(125, 211, 252, 0.22) !important;
  color: #e5edf8 !important;
  background: #1e293b !important;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.32) !important;
}

:global(html.dark .ui-tooltip-popper .el-popper__arrow::before),
:global(html[data-color-mode='dark'] .ui-tooltip-popper .el-popper__arrow::before) {
  border-color: rgba(125, 211, 252, 0.22) !important;
  background: #1e293b !important;
}

:global(html[data-ui-theme='animal'] .ui-tooltip-popper) {
  border: 2px solid var(--animal-border-color-light, #c4b89e) !important;
  border-radius: 14px !important;
  color: var(--animal-overlay-text, #725d42) !important;
  background: var(--animal-overlay-bg, #f7f3df) !important;
  box-shadow: 0 8px 22px rgba(61, 52, 40, .2) !important;
  font-family: var(--animal-font-family, 'Nunito', 'Noto Sans SC', sans-serif);
  font-weight: 650;
}

:global(html[data-ui-theme='animal'] .ui-tooltip-popper .el-popper__arrow::before) {
  border-color: var(--animal-border-color-light, #c4b89e) !important;
  background: var(--animal-overlay-bg, #f7f3df) !important;
}
</style>
