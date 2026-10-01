<template>
  <el-tabs
    v-bind="$attrs"
    :model-value="modelValue"
    class="department-page-tabs"
    @update:model-value="handleUpdate"
    @tab-change="handleTabChange"
  >
    <slot />
  </el-tabs>
</template>

<script setup lang="ts">
import type { TabPaneName } from 'element-plus';

defineOptions({ inheritAttrs: false });

defineProps<{
  modelValue: TabPaneName;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: TabPaneName): void;
  (event: 'tabChange', value: TabPaneName): void;
}>();

const handleUpdate = (value: TabPaneName) => emit('update:modelValue', value);
const handleTabChange = (value: TabPaneName) => emit('tabChange', value);
</script>

<style scoped lang="scss">
.department-page-tabs {
  :deep(.el-tabs__header) {
    margin: 0;
    padding: 12px 14px;
    border-bottom: 1px solid var(--app-surface-border);
    background: var(--app-surface-bg);
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 4px;
    overflow: visible;
    border: 1px solid var(--el-border-color);
    border-radius: 13px;
    background: var(--el-fill-color-light);
    box-shadow: inset 0 1px 2px rgb(15 23 42 / 4%);
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__nav) {
    display: flex;
    align-items: stretch;
    gap: 3px;
  }

  :deep(.el-tabs__item) {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 116px;
    height: 38px;
    padding: 0 16px;
    border-radius: 9px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    font-weight: 650;
    line-height: 1;
    transition: color 0.2s, background-color 0.2s, box-shadow 0.2s, transform 0.2s;
  }

  // Element Plus 默认会移除首个页签左侧、末个页签右侧的内边距，
  // 这里需要恢复对称间距，避免图标和文字看起来没有居中。
  :deep(.el-tabs__header .el-tabs__item:nth-child(2)),
  :deep(.el-tabs__header .el-tabs__item:last-child) {
    padding-right: 16px;
    padding-left: 16px;
  }

  :deep(.el-tabs__item > span) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    line-height: 1;
    white-space: nowrap;
  }

  :deep(.el-tabs__item .el-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    line-height: 1;
  }

  :deep(.el-tabs__item:hover) {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-fill-color-blank) 72%, transparent);
  }

  :deep(.el-tabs__item.is-active) {
    color: var(--el-color-primary);
    background: var(--el-fill-color-blank);
    box-shadow: 0 4px 11px rgb(15 23 42 / 10%), inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    transform: translateY(-1px);
  }

  :deep(.el-tabs__active-bar) {
    display: none;
  }

  :deep(.el-tab-pane) {
    padding-top: 22px;
  }

  @media (max-width: 720px) {
    :deep(.el-tabs__header) {
      padding: 10px 8px;
    }

    :deep(.el-tabs__nav) {
      display: flex;
      width: 100%;
    }

    :deep(.el-tabs__item) {
      min-width: 0;
      flex: 1 1 0;
      padding: 0 8px;
    }
  }
}

/* Animal 模式统一使用协作社区的分段页签外观；办公模式继续沿用上面的 Element Tabs 样式。 */
:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__header) {
  width: fit-content;
  max-width: 100%;
  margin: 0;
  padding: 4px;
  overflow: visible;
  border: 1px solid color-mix(in srgb, var(--animal-primary-color, #19c8b9) 13%, var(--animal-border-color-light, #e8e2d6));
  border-radius: 12px;
  background: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 5%, var(--animal-bg-color-secondary, #f0e8d8));
}

:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__nav-wrap) {
  padding: 0;
  overflow: visible;
  border: 0;
  background: transparent;
  box-shadow: none;
}

:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__nav-wrap::after) { display: none; }
:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__nav) { display: flex; align-items: stretch; gap: 4px; border: 0; }

:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__item) {
  display: inline-flex;
  min-width: 0;
  height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: 0;
  border-radius: 9px;
  color: var(--animal-text-color-secondary, #71809a);
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  transition: color .2s, background-color .2s, box-shadow .2s, transform .2s;
}

:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__item:hover) {
  color: var(--animal-primary-color, #19c8b9);
  background: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 12%, transparent);
}

:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__item.is-active),
:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__item.is-active:hover) {
  color: #fff;
  background: var(--animal-primary-color, #19c8b9);
  box-shadow: 0 5px 12px color-mix(in srgb, var(--animal-primary-color, #19c8b9) 22%, transparent);
  transform: translateY(-1px);
}

:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__active-bar) { display: none; }
:global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__content) { padding-top: 12px; }
:global(html[data-ui-theme='animal'] .department-page-tabs .el-tab-pane) { padding-top: 0; }

@media (max-width: 720px) {
  :global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__header) { width: 100%; }
  :global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__nav) { width: 100%; }
  :global(html[data-ui-theme='animal'] .department-page-tabs .el-tabs__item) { flex: 1 1 0; padding-right: 8px; padding-left: 8px; }
}
</style>
