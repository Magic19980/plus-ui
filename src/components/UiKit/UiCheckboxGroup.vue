<template>
  <AnimalCheckbox
    v-if="isAnimalMode"
    v-bind="attrs"
    :model-value="animalModelValue"
    :options="animalOptions"
    :size="animalSize"
    :direction="direction"
    :disabled="disabled"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
  <ElCheckboxGroup
    v-else
    v-bind="attrs"
    class="ui-checkbox-group"
    :class="`is-${direction}`"
    :model-value="modelValue"
    @update:model-value="handleUpdate"
    @change="handleChange"
  >
    <ElCheckbox v-for="item in options" :key="String(item.value)" :label="item.value" :disabled="disabled || item.disabled">{{ item.label }}</ElCheckbox>
  </ElCheckboxGroup>
</template>

<script setup lang="ts">
/**
 * 统一多选适配器。
 * 业务字段仍然使用 string/number 数组，办公模式映射到 Element CheckboxGroup，
 * 动森模式映射到 Animal Island Checkbox，避免用下拉多选承载一组低数量配置项。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElCheckbox, ElCheckboxGroup } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type UiCheckboxValue = string | number;
const props = withDefaults(
  defineProps<{
    modelValue?: UiCheckboxValue[];
    options?: ReadonlyArray<{ value: UiCheckboxValue; label: string; disabled?: boolean }>;
    size?: 'small' | 'default' | 'large';
    direction?: 'horizontal' | 'vertical';
    disabled?: boolean;
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    size: 'default',
    direction: 'horizontal',
    disabled: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: UiCheckboxValue[]];
  change: [value: UiCheckboxValue[]];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalCheckbox = defineAsyncComponent(() => import('animal-island-vue').then(({ Checkbox }) => Checkbox));
const animalOptions = computed(() => props.options.filter(item => !item.disabled).map(item => ({ value: item.value, label: item.label })));
const animalModelValue = computed(() => props.modelValue.filter(value => animalOptions.value.some(item => String(item.value) === String(value))));
const animalSize = computed<'small' | 'middle' | 'large'>(() => (props.size === 'small' ? 'small' : props.size === 'large' ? 'large' : 'middle'));
const normalize = (value: Array<UiCheckboxValue | string | number>) => value.map(item => {
  const source = props.options.find(option => String(option.value) === String(item));
  return source?.value ?? item;
});
const handleUpdate = (value: Array<UiCheckboxValue | string | number>) => emit('update:modelValue', normalize(value));
const handleChange = (value: Array<UiCheckboxValue | string | number>) => emit('change', normalize(value));
</script>

<style scoped>
:deep(.el-checkbox-group) { display: flex; flex-wrap: wrap; gap: 10px 16px; }
:deep(.el-checkbox-group.is-vertical) { max-height: 190px; overflow-y: auto; flex-direction: column; align-items: flex-start; flex-wrap: nowrap; padding-right: 6px; }
:deep(.el-checkbox) { margin-right: 0; }
:deep(.animal-checkbox-group--vertical) { max-height: 190px; overflow-y: auto; padding-right: 6px; }
</style>
