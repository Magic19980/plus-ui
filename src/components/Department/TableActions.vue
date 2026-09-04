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
  flex-wrap: nowrap;
  gap: 4px;

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
}
</style>
