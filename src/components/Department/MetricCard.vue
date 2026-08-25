<template>
  <div class="department-metric-card" :class="`department-metric-card--${tone}`">
    <strong>{{ value }}</strong>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    value: string | number;
    label: string;
    tone?: 'blue' | 'green' | 'teal' | 'orange' | 'red';
  }>(),
  {
    tone: 'blue',
  },
);
</script>

<style scoped lang="scss">
.department-metric-card {
  padding: 16px 18px;
  border-left: 6px solid;
  border-radius: 6px;
  background: var(--el-fill-color-light);

  strong,
  span {
    display: block;
  }

  strong {
    font-size: 28px;
    line-height: 1.15;
  }

  span {
    margin-top: 8px;
    color: var(--el-text-color-regular);
  }

  &--blue {
    border-color: #2671c5;
    color: #2671c5;
  }

  &--green {
    border-color: #2ea45f;
    color: #2ea45f;
  }

  &--teal {
    border-color: #159a9c;
    color: #159a9c;
  }

  &--orange {
    border-color: #ed8b20;
    color: #ed8b20;
  }

  &--red {
    border-color: #da4154;
    color: #da4154;
  }
}
</style>
