<template>
  <div v-if="!showSearch && activeFilters.length" class="search-panel-summary">
    <span class="summary-label">已筛选:</span>
    <el-tag
      v-for="(f, i) in activeFilters"
      :key="i"
      size="small"
      closable
      :hit="true"
      @close="f.onRemove"
    >
      {{ f.label }}: {{ f.value }}
    </el-tag>
    <el-button text size="small" type="primary" @click="onClearAll">
      清除全部
    </el-button>
  </div>
</template>

<script setup lang="ts">
export interface FilterItem {
  label: string;
  value: string;
  onRemove: () => void;
}

interface Props {
  showSearch: boolean;
  activeFilters: FilterItem[];
}

interface Emits {
  (e: 'clearAll'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const onClearAll = () => {
  emit('clearAll');
};
</script>
