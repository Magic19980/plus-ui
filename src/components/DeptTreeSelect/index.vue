<template>
  <el-tree-select
    v-bind="$attrs"
    :model-value="modelValue"
    :data="data"
    :props="resolvedTreeProps"
    :node-key="resolvedTreeProps.value"
    :value-key="resolvedTreeProps.value"
    :filterable="filterable"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type DeptTreeSelectValue = string | number | undefined | null;

export interface DeptTreeSelectNode {
  [key: string]: unknown;
  children?: DeptTreeSelectNode[];
}

export interface DeptTreeSelectProps {
  value?: string;
  label?: string;
  children?: string;
  disabled?: string;
}

interface Props {
  modelValue?: DeptTreeSelectValue;
  data?: DeptTreeSelectNode[];
  treeProps?: DeptTreeSelectProps;
  filterable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  data: () => [],
  treeProps: () => ({}),
  filterable: true
});

const emit = defineEmits<{
  (event: 'update:modelValue', value: DeptTreeSelectValue): void;
  (event: 'change', value: DeptTreeSelectValue): void;
}>();

const resolvedTreeProps = computed(() => ({
  value: 'id',
  label: 'label',
  children: 'children',
  ...props.treeProps
}));

const handleUpdate = (value: DeptTreeSelectValue) => emit('update:modelValue', value);
const handleChange = (value: DeptTreeSelectValue) => emit('change', value);
</script>
