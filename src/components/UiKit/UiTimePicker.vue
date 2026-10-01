<template>
  <AnimalTimePicker
    v-if="isAnimalMode"
    v-bind="animalAttrs"
    :model-value="animalModelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :allow-clear="clearable"
    :size="animalSize"
    :format="animalFormat"
    :aria-label="ariaLabel"
    @update:model-value="handleAnimalUpdate"
    @change="handleAnimalChange"
  />
  <ElTimePicker
    v-else
    v-bind="elementAttrs"
    :model-value="modelValue"
    :value-format="valueFormat"
    :format="format"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
/**
 * 统一时间选择器适配器。
 *
 * Animal Island 提供了轻量时间选择器，但其显示格式和 Element Plus 的
 * value-format 语义不同。本适配器统一保留字符串值、清空、禁用和 change
 * 事件，让任务、日报和筛选表单不需要编写主题分支。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElTimePicker } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type UiTimeValue = string | Date | undefined | null;

const props = withDefaults(
  defineProps<{
    modelValue?: UiTimeValue;
    valueFormat?: string;
    format?: string;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    size?: 'small' | 'default' | 'large';
    ariaLabel?: string;
  }>(),
  {
    modelValue: undefined,
    valueFormat: 'HH:mm:ss',
    format: undefined,
    placeholder: '请选择时间',
    clearable: true,
    disabled: false,
    size: 'default',
    ariaLabel: undefined
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: UiTimeValue];
  change: [value: UiTimeValue];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalTimePicker = defineAsyncComponent(() => import('animal-island-vue').then(({ TimePicker }) => TimePicker));

const animalModelValue = computed<string | null>(() => {
  if (props.modelValue instanceof Date) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(props.modelValue.getHours())}:${pad(props.modelValue.getMinutes())}:${pad(props.modelValue.getSeconds())}`;
  }
  return typeof props.modelValue === 'string' ? props.modelValue : null;
});

const animalFormat = computed(() => props.format || props.valueFormat || 'HH:mm:ss');
const animalSize = computed<'small' | 'middle' | 'large'>(() => {
  if (props.size === 'small') return 'small';
  if (props.size === 'large') return 'large';
  return 'middle';
});

const removeAdapterAttrs = (source: Record<string, unknown>) => {
  const next = { ...source };
  ['modelValue', 'value-format', 'format', 'placeholder', 'clearable', 'disabled', 'size', 'default-value', 'aria-label'].forEach(key => Reflect.deleteProperty(next, key));
  return next;
};
const animalAttrs = computed(() => removeAdapterAttrs(attrs));
const elementAttrs = computed(() => removeAdapterAttrs(attrs));

const handleUpdate = (value: UiTimeValue) => emit('update:modelValue', value);
const handleChange = (value: UiTimeValue) => emit('change', value);
const handleAnimalUpdate = (value: string | null) => handleUpdate(value);
const handleAnimalChange = (value: string | null) => handleChange(value);
</script>

<style scoped>
.animal-time-picker { min-width: 0; width: 100%; }
:deep(.animal-time-picker__trigger) { min-width: 0; }
:deep(.animal-time-picker__value) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.animal-time-picker__panel) { z-index: 2100; }
</style>
