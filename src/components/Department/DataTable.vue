<template>
  <el-table v-bind="$attrs" class="department-data-table">
    <slot />
  </el-table>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>

<style scoped lang="scss">
.department-data-table {
  --el-table-bg-color: var(--app-surface-bg);
  --el-table-tr-bg-color: var(--app-surface-bg);
  --el-table-header-bg-color: var(--tableHeaderBg, #f8fafc);
  --el-table-border-color: var(--app-surface-border);
  --el-table-text-color: var(--app-text-title);

  width: 100%;
  overflow: hidden;
  border: 1px solid var(--app-surface-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface-bg);

  :deep(.el-table__inner-wrapper::before),
  :deep(.el-table__border-left-patch) {
    display: none;
  }

  :deep(.el-table__header-wrapper th.el-table__cell),
  :deep(.el-table__fixed-header-wrapper th.el-table__cell) {
    height: 46px;
    padding: 0 12px;
    color: var(--tableHeaderTextColor, #475569);
    background: var(--tableHeaderBg, #f8fafc) !important;
    font-size: 13px;
    font-weight: 600;
  }

  :deep(.el-table__body-wrapper td.el-table__cell),
  :deep(.el-table__fixed-body-wrapper td.el-table__cell) {
    min-height: 48px;
    padding: 11px 12px;
    color: var(--app-text-title);
    background: var(--app-surface-bg);
  }

  // 横向滚动时，固定列必须有独立的不透明层，避免底层单元格文字穿透。
  :deep(.el-table__fixed),
  :deep(.el-table__fixed-right) {
    z-index: 3;
    background: var(--el-table-bg-color, var(--app-surface-bg));
    box-shadow: -8px 0 16px rgba(15, 23, 42, 0.08);
  }

  :deep(.el-table__fixed-right::before),
  :deep(.el-table__fixed::before) {
    background-color: var(--app-surface-border);
  }

  :deep(.el-table__fixed-right th.el-table__cell),
  :deep(.el-table__fixed-right td.el-table__cell),
  :deep(.el-table__fixed-right-patch) {
    background: var(--el-table-bg-color, var(--app-surface-bg)) !important;
  }

  :deep(.el-table__fixed-right tr:hover > td.el-table__cell),
  :deep(.el-table__fixed-right tr.hover-row > td.el-table__cell) {
    background: var(--el-table-row-hover-bg-color) !important;
  }

  :deep(.department-table-actions) {
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  :deep(.el-table__body tr) {
    transition: background-color 0.18s ease;
  }

  :deep(.el-table__body tr:hover > td.el-table__cell),
  :deep(.el-table__body tr.hover-row > td.el-table__cell) {
    background: var(--el-table-row-hover-bg-color) !important;
  }

  :deep(.el-table__empty-block) {
    min-height: 120px;
  }

  :deep(.el-table__empty-text) {
    color: var(--app-text-muted);
    font-size: var(--app-text-sm, 13px);
  }

  :deep(.el-table__body tr.el-table__row--striped td.el-table__cell) {
    background: color-mix(in srgb, var(--app-surface-bg) 94%, var(--app-accent-soft));
  }
}
</style>
