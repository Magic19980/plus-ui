<template>
  <div class="department-metric-grid" :style="{ '--department-metric-columns': columns }">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    columns?: number;
  }>(),
  {
    columns: 4,
  },
);
</script>

<style scoped lang="scss">
.department-metric-grid {
  display: grid;
  grid-template-columns: repeat(var(--department-metric-columns), minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
