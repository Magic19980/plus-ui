<template>
  <AnimalDatePicker
    v-if="isAnimalMode && (supportsAnimalPicker || supportsAnimalRange)"
    v-bind="animalAttrs"
    :model-value="animalPickerModelValue"
    :range="supportsAnimalRange"
    :picker="animalPicker"
    :format="animalFormat"
    :placeholder="placeholder"
    :disabled="disabled"
    :allow-clear="clearable"
    :disabled-date="disabledDate"
    :size="animalSize"
    @update:model-value="handleAnimalPickerUpdate"
    @change="handleAnimalPickerChange"
  />
  <div v-else-if="isAnimalMode && supportsAnimalDateTime" class="ui-animal-datetime-picker">
    <AnimalDatePicker
      v-bind="animalAttrs"
      :model-value="animalDateTimeDate"
      picker="date"
      :format="'YYYY-MM-DD'"
      :placeholder="placeholder"
      :disabled="disabled"
      :allow-clear="clearable"
      :disabled-date="disabledDate"
      :size="animalSize"
      @update:model-value="handleDateTimeDate"
      @change="handleDateTimeDate"
    />
    <AnimalTimePicker
      :model-value="animalDateTimeTime"
      :format="animalTimeFormat"
      placeholder="选择时间"
      :disabled="disabled"
      :allow-clear="clearable"
      :size="animalSize"
      @update:model-value="handleDateTimeTime"
      @change="handleDateTimeTime"
    />
  </div>
  <ElDatePicker
    v-else
    v-bind="attrs"
    :model-value="elementModelValue"
    :type="type"
    :value-format="valueFormat"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :disabled-date="disabledDate"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
/**
 * 统一日期选择器适配器。
 *
 * 动森模式覆盖 date、month、daterange、monthrange 和 datetime；
 * 其它 Element Plus 类型继续走原组件，保证暂未实现的复杂能力不会改变数据格式。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElDatePicker } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type UiDatePickerType =
  | 'year'
  | 'month'
  | 'date'
  | 'dates'
  | 'datetime'
  | 'week'
  | 'datetimerange'
  | 'daterange'
  | 'monthrange';
type UiDateValue = string | number | Date | Array<string | number | Date> | undefined | null;

const props = withDefaults(
  defineProps<{
    modelValue?: UiDateValue;
    type?: UiDatePickerType;
    valueFormat?: string;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    disabledDate?: (date: Date) => boolean;
    size?: 'small' | 'default' | 'large';
  }>(),
  {
    modelValue: undefined,
    type: 'date',
    valueFormat: undefined,
    placeholder: '请选择日期',
    clearable: true,
    disabled: false,
    disabledDate: undefined,
    size: 'default'
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: UiDateValue];
  change: [value: UiDateValue];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalDatePicker = defineAsyncComponent(() => import('animal-island-vue').then(({ DatePicker }) => DatePicker));
const AnimalTimePicker = defineAsyncComponent(() => import('animal-island-vue').then(({ TimePicker }) => TimePicker));

const supportsAnimalPicker = computed(() => props.type === 'date' || props.type === 'month');
const supportsAnimalRange = computed(() => props.type === 'daterange' || props.type === 'monthrange');
const supportsAnimalDateTime = computed(() => props.type === 'datetime');
const animalPicker = computed(() => (props.type === 'month' || props.type === 'monthrange' ? 'month' : 'date'));
const animalFormat = computed(() => props.valueFormat || (props.type === 'month' || props.type === 'monthrange' ? 'YYYY-MM' : 'YYYY-MM-DD'));
const animalModelValue = computed<string | null>(() => {
  if (props.modelValue instanceof Date) {
    const year = props.modelValue.getFullYear();
    const month = String(props.modelValue.getMonth() + 1).padStart(2, '0');
    const day = String(props.modelValue.getDate()).padStart(2, '0');
    return props.type === 'month' ? `${year}-${month}` : `${year}-${month}-${day}`;
  }
  return typeof props.modelValue === 'string' ? props.modelValue : null;
});
const animalPickerModelValue = computed<string | [string, string] | null>(() => {
  if (!supportsAnimalRange.value) return animalModelValue.value;
  if (!Array.isArray(props.modelValue) || props.modelValue.length < 2) return null;
  const values = props.modelValue.map(value => {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return props.type === 'monthrange' ? `${year}-${month}` : `${year}-${month}-${day}`;
    }
    return String(value);
  });
  return [values[0], values[1]];
});
type ElementDateValue = string | number | Date | string[] | number[] | Date[] | undefined;
const elementModelValue = computed<ElementDateValue>(() => {
  const value = props.modelValue;
  if (value === null || value === undefined) return undefined;
  if (!Array.isArray(value)) return value;
  if (value.every(item => typeof item === 'string')) return value as string[];
  if (value.every(item => typeof item === 'number')) return value as number[];
  if (value.every(item => item instanceof Date)) return value as Date[];
  return undefined;
});
const animalDateTimeParts = computed(() => {
  const value = props.modelValue instanceof Date
    ? `${props.modelValue.getFullYear()}-${String(props.modelValue.getMonth() + 1).padStart(2, '0')}-${String(props.modelValue.getDate()).padStart(2, '0')} ${String(props.modelValue.getHours()).padStart(2, '0')}:${String(props.modelValue.getMinutes()).padStart(2, '0')}:${String(props.modelValue.getSeconds()).padStart(2, '0')}`
    : String(props.modelValue || '');
  const [date = '', time = ''] = value.split(' ');
  return { date, time: time || '00:00:00' };
});
const animalDateTimeDate = computed(() => animalDateTimeParts.value.date || null);
const animalDateTimeTime = computed(() => animalDateTimeParts.value.time || null);
const animalTimeFormat = computed(() => (props.valueFormat?.includes('ss') ? 'HH:mm:ss' : 'HH:mm'));
const animalSize = computed(() => {
  if (props.size === 'small') return 'small';
  if (props.size === 'large') return 'large';
  return 'middle';
});

/** Element Plus 的 type/value-format 等属性不属于 Animal DatePicker，避免无效属性污染 DOM。 */
const animalAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  ['type', 'value-format', 'clearable', 'disabled-date', 'placeholder', 'size', 'range', 'picker', 'format', 'allow-clear', 'default-time'].forEach((key) => Reflect.deleteProperty(nextAttrs, key));
  return nextAttrs;
});

const handleUpdate = (value: UiDateValue) => emit('update:modelValue', value);
const handleChange = (value: UiDateValue) => emit('change', value);
const handleAnimalPickerUpdate = (value: string | [string, string] | null) => handleUpdate(value);
const handleAnimalPickerChange = (value: string | [string, string] | null) => handleChange(value);
const combineDateTime = (date: string | null, time: string | null) => {
  if (!date) return null;
  return `${date} ${time || '00:00:00'}`;
};
const handleDateTimeDate = (value: string | [string, string] | null) => {
  const date = typeof value === 'string' ? value : null;
  const next = combineDateTime(date, animalDateTimeTime.value);
  emit('update:modelValue', next);
  emit('change', next);
};
const handleDateTimeTime = (value: string | null) => {
  const next = combineDateTime(animalDateTimeDate.value, value);
  emit('update:modelValue', next);
  emit('change', next);
};
</script>

<style scoped>
.ui-animal-datetime-picker { display: flex; min-width: 0; align-items: center; gap: 8px; }
.ui-animal-datetime-picker > * { min-width: 0; flex: 1 1 0; }
/* 时间选择器同时包含值、清除按钮和时钟图标；在表单双列布局中收紧内边距，避免其固有宽度撑出父列。 */
.ui-animal-datetime-picker :deep(.animal-date-picker__trigger) { min-width: 0; padding-right: 6px; padding-left: 6px; }
.ui-animal-datetime-picker :deep(.animal-time-picker) { min-width: 0; overflow: hidden; }
.ui-animal-datetime-picker :deep(.animal-time-picker__trigger) { min-width: 0; padding-right: 10px; padding-left: 10px; }
.ui-animal-datetime-picker :deep(.animal-time-picker__clear) { padding-right: 2px; padding-left: 2px; }
</style>
