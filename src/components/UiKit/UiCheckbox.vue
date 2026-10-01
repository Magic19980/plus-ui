<template>
  <AnimalCheckbox
    v-if="isAnimalMode"
    v-bind="animalAttrs"
    :model-value="animalModelValue"
    :options="animalOptions"
    :size="animalSize"
    :disabled="disabled"
    @update:model-value="handleAnimalUpdate"
    @change="handleAnimalChange"
  />
  <ElCheckbox
    v-else
    v-bind="attrs"
    :model-value="modelValue"
    :true-value="elementTrueValue"
    :false-value="elementFalseValue"
    :size="size"
    :disabled="disabled"
    :border="border"
    @update:model-value="handleUpdate"
    @change="handleChange"
  >
    <slot>{{ label }}</slot>
  </ElCheckbox>
</template>

<script setup lang="ts">
/**
 * 单项复选框适配器。
 *
 * Animal Island 的 Checkbox 以 options + 数组值工作，而历史业务字段大量
 * 使用 boolean 或 1/0 字符串。这里统一转换值契约，避免表格内的编辑复选框
 * 在动森模式下回退为 Element Plus，或者因为值类型不一致无法取消勾选。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElCheckbox } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type CheckboxValue = boolean | string | number;

const props = withDefaults(
  defineProps<{
    modelValue?: CheckboxValue;
    trueValue?: CheckboxValue;
    falseValue?: CheckboxValue;
    label?: string;
    size?: 'small' | 'default' | 'large';
    disabled?: boolean;
    border?: boolean;
  }>(),
  {
    modelValue: false,
    trueValue: true,
    falseValue: false,
    label: '',
    size: 'default',
    disabled: false,
    border: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: CheckboxValue];
  change: [value: CheckboxValue];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalCheckbox = defineAsyncComponent(() => import('animal-island-vue').then(({ Checkbox }) => Checkbox));
const checked = computed(() => props.modelValue === props.trueValue);
// Animal Checkbox 只接受 string/number 选项；布尔值在适配层映射为稳定的内部键，
// 对外仍然还原为调用方传入的 trueValue/falseValue。
const animalTrueValue = computed<string | number>(() => (typeof props.trueValue === 'boolean' ? `__ui-checkbox-${props.trueValue ? 'true' : 'false'}` : props.trueValue));
const animalModelValue = computed(() => (checked.value ? [animalTrueValue.value] : []));
const animalOptions = computed(() => [{ value: animalTrueValue.value, label: props.label }]);
const elementTrueValue = computed(() => props.trueValue as unknown as string | number);
const elementFalseValue = computed(() => props.falseValue as unknown as string | number);
const animalSize = computed<'small' | 'middle' | 'large'>(() => {
  if (props.size === 'small') return 'small';
  if (props.size === 'large') return 'large';
  return 'middle';
});
const animalAttrs = computed(() => {
  const next = { ...attrs };
  ['modelValue', 'trueValue', 'falseValue', 'label', 'size', 'disabled', 'border'].forEach(key => Reflect.deleteProperty(next, key));
  return next;
});

const valueFromChecked = (value: unknown) => (value === props.trueValue ? props.trueValue : props.falseValue);
const handleAnimalUpdate = (values: Array<string | number>) => emit('update:modelValue', values.includes(animalTrueValue.value) ? props.trueValue : props.falseValue);
const handleAnimalChange = (values: Array<string | number>) => emit('change', values.includes(animalTrueValue.value) ? props.trueValue : props.falseValue);
const handleUpdate = (value: unknown) => emit('update:modelValue', valueFromChecked(value));
const handleChange = (value: unknown) => emit('change', valueFromChecked(value));
</script>
