<template>
  <div v-bind="$attrs" class="department-table-toolbar">
    <div class="department-table-toolbar__leading">
      <slot />
    </div>
    <div v-if="$slots.actions" class="department-table-toolbar__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>

<style scoped lang="scss">
.department-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  margin-bottom: 16px;

  &__leading,
  &__actions {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  &__leading {
    flex: 1 1 auto;
  }

  &__actions {
    flex: 0 0 auto;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  :deep(.el-form) {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0 16px;
  }

  :deep(.el-form-item) {
    margin-right: 0;
    margin-bottom: 0;
  }

  :deep(.el-button),
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 9px;
  }

  @media (max-width: 900px) {
    align-items: flex-start;
    flex-direction: column;

    &__leading,
    &__actions {
      width: 100%;
    }

    &__actions {
      justify-content: flex-start;
    }
  }
}
</style>
