<template>
  <div v-bind="$attrs" class="department-table-actions">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>

<style scoped lang="scss">
.department-table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: max-content;
  max-width: none;
  flex-wrap: nowrap;
  gap: 5px;
  white-space: nowrap;

  :deep(.el-button) {
    min-height: 28px;
    padding: 5px 8px;
    margin: 0 !important;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.25;
    white-space: nowrap;
  }

  :deep(.el-button.is-link) {
    border-color: transparent;
    background: transparent;
  }

  :deep(.el-button + .el-button) {
    margin-left: 0 !important;
  }

  :deep(.el-button-group) {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    .el-button + .el-button {
      margin-left: 0;
    }
  }

  // 动森按钮默认有较大的文字按钮内边距；放进操作列后统一收紧，避免
  // 多个图标按钮被单元格挤成多行。
  :deep(.ui-animal-button) {
    position: relative;
    flex: 0 0 auto;
    min-width: 32px;
    height: 32px !important;
    min-height: 32px !important;
    padding: 0 11px !important;
    border-width: 1.5px !important;
    border-radius: 14px 10px 14px 10px !important;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.01em;
    box-shadow:
      0 2px 0 var(--animal-shadow-soft),
      inset 0 1px 0 rgb(255 255 255 / 34%) !important;
    transition:
      transform 0.18s ease,
      color 0.18s ease,
      background 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease;
  }

  // 表格操作使用动森式“叶片徽章”按钮：轻微不对称圆角、柔和纸张渐变，
  // 让操作仍然紧凑，但不再像办公系统里的普通矩形按钮。
  :deep(.ui-animal-button.animal-btn--link) {
    opacity: 1;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--animal-bg-color-input) 88%, var(--animal-primary-color) 12%),
        color-mix(in srgb, var(--animal-bg-color-secondary) 92%, var(--animal-primary-color) 8%)
      ) !important;
    border-color: color-mix(in srgb, var(--animal-border-color-light) 70%, var(--animal-primary-color) 30%) !important;
  }

  :deep(.ui-animal-button.animal-btn--link.ui-animal-button--primary) {
    color: var(--animal-primary-color) !important;
    border-color: color-mix(in srgb, var(--animal-primary-color) 48%, var(--animal-border-color-light)) !important;
  }

  :deep(.ui-animal-button.animal-btn--danger.animal-btn--link) {
    color: var(--animal-status-danger) !important;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--animal-bg-color-input) 84%, var(--animal-status-danger) 16%),
        color-mix(in srgb, var(--animal-bg-color-secondary) 90%, var(--animal-status-danger) 10%)
      ) !important;
    border-color: color-mix(in srgb, var(--animal-status-danger) 54%, var(--animal-border-color-light)) !important;
  }

  :deep(.ui-animal-button.animal-btn--link:hover:not(:disabled)) {
    opacity: 1;
    transform: translateY(-2px) rotate(-0.5deg);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--animal-primary-color-bg) 80%, var(--animal-bg-color-input)),
        color-mix(in srgb, var(--animal-primary-color-bg) 90%, var(--animal-bg-color-secondary))
      ) !important;
    border-color: var(--animal-primary-color) !important;
    box-shadow:
      0 4px 0 var(--animal-shadow-soft),
      inset 0 1px 0 rgb(255 255 255 / 42%) !important;
  }

  :deep(.ui-animal-button.animal-btn--danger.animal-btn--link:hover:not(:disabled)) {
    color: var(--animal-status-danger) !important;
    transform: translateY(-2px) rotate(0.5deg);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--animal-status-danger) 18%, var(--animal-bg-color-input)),
        color-mix(in srgb, var(--animal-status-danger) 12%, var(--animal-bg-color-secondary))
      ) !important;
    border-color: var(--animal-status-danger) !important;
  }

  :deep(.ui-animal-button.animal-btn--link:active:not(:disabled)) {
    transform: translateY(0) !important;
    box-shadow:
      0 1px 0 var(--animal-shadow-soft),
      inset 0 1px 0 rgb(255 255 255 / 24%) !important;
  }

  // 动森表格的图标操作统一收成紧凑方形热区；纯图标按钮不再各自带凸起底板，
  // 避免一排按钮像独立卡片一样挤满操作列。
  :deep(.ui-animal-button:has(> .animal-btn__icon):not(:has(> span:not(.animal-btn__icon)))) {
    box-sizing: border-box;
    width: 34px !important;
    min-width: 34px !important;
    max-width: 34px;
    height: 32px !important;
    min-height: 32px !important;
    padding: 0 !important;
    gap: 0;
    border: 1px solid transparent !important;
    border-radius: 10px !important;
    background: transparent !important;
    box-shadow: none !important;
    transform: none;
  }

  :deep(.ui-animal-button.animal-btn--link:has(> .animal-btn__icon):not(:has(> span:not(.animal-btn__icon))):hover:not(:disabled)) {
    transform: none !important;
    border-color: color-mix(in srgb, var(--animal-primary-color) 22%, transparent) !important;
    background: color-mix(in srgb, var(--animal-primary-color-bg) 76%, transparent) !important;
    box-shadow: none !important;
  }

  :deep(.ui-animal-button.animal-btn--danger.animal-btn--link:has(> .animal-btn__icon):not(:has(> span:not(.animal-btn__icon))):hover:not(:disabled)) {
    border-color: color-mix(in srgb, var(--animal-status-danger) 24%, transparent) !important;
    background: color-mix(in srgb, var(--animal-status-danger) 12%, transparent) !important;
  }

  // 图标变成小徽章，帮助用户快速区分“编辑”和“结束服务”。
  :deep(.ui-animal-button .animal-btn__icon) {
    width: 19px;
    height: 19px;
    border-radius: 7px 5px 7px 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    background: color-mix(in srgb, var(--animal-primary-color) 15%, transparent);
  }

  :deep(.ui-animal-button.animal-btn--danger .animal-btn__icon) {
    background: color-mix(in srgb, var(--animal-status-danger) 16%, transparent);
  }

  :deep(.ui-animal-button .animal-btn__icon svg) {
    width: 13px;
    height: 13px;
  }

  :deep(.ui-animal-button:has(> .animal-btn__icon):not(:has(> span:not(.animal-btn__icon))) .animal-btn__icon) {
    width: 16px;
    height: 16px;
    border-radius: 5px;
    background: transparent;
  }

  :deep(.ui-animal-button:has(> .animal-btn__icon):not(:has(> span:not(.animal-btn__icon))) .animal-btn__icon svg) {
    width: 14px;
    height: 14px;
  }

  :deep(.text-secondary) {
    color: var(--animal-text-color-secondary) !important;
    font-size: 12px;
    font-weight: 600;
  }
}

:global(html[data-ui-theme='animal'] .department-table-actions) {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  gap: 5px;
}
</style>
