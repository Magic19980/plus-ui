<template>
  <div class="department-panel-header">
    <div class="department-panel-header__content">
      <span v-if="kicker" class="department-panel-header__kicker">{{ kicker }}</span>
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
      <slot name="meta" />
    </div>
    <div v-if="$slots.default" class="department-panel-header__actions">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    kicker?: string;
    description?: string;
  }>(),
  {
    kicker: '',
    description: '',
  },
);
</script>

<style scoped lang="scss">
.department-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;

  &__content {
    min-width: 0;
  }

  &__kicker {
    display: block;
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    line-height: 1.4;
    text-transform: uppercase;
  }

  h3 {
    margin: 4px 0;
    color: var(--el-text-color-primary);
    font-size: 18px;
    line-height: 1.35;
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  @media (max-width: 700px) {
    align-items: flex-start;
    flex-direction: column;

    &__actions {
      justify-content: flex-start;
      width: 100%;
    }
  }
}
</style>
