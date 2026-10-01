<template>
  <AnimalRadio
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
  <ElRadioGroup
    v-else
    v-bind="attrs"
    class="ui-radio-group"
    :class="`is-${direction}`"
    :model-value="modelValue"
    @update:model-value="handleUpdate"
    @change="handleChange"
  >
    <ElRadio v-for="item in options" :key="String(item.value)" :label="item.value" :disabled="disabled || item.disabled">
      {{ item.label }}
    </ElRadio>
  </ElRadioGroup>
</template>

<script setup lang="ts">
/**
 * 统一单选适配器。
 * 业务层只维护 value/label 选项，办公模式使用 Element Radio，
 * 动森模式使用 Animal Radio，避免主题切换时重复编写表单分支。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElRadio, ElRadioGroup } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type UiRadioValue = string | number;
const props = withDefaults(
  defineProps<{
    modelValue?: UiRadioValue;
    options?: ReadonlyArray<{ value: UiRadioValue; label: string; disabled?: boolean }>;
    size?: 'small' | 'default' | 'large';
    direction?: 'horizontal' | 'vertical';
    disabled?: boolean;
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    size: 'default',
    direction: 'horizontal',
    disabled: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: UiRadioValue];
  change: [value: UiRadioValue];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalRadio = defineAsyncComponent(() => import('animal-island-vue').then(({ Radio }) => Radio));
const animalOptions = computed(() => props.options.map(item => ({ value: item.value, label: item.label, disabled: item.disabled })));
const animalModelValue = computed(() => props.modelValue);
const animalSize = computed<'small' | 'middle' | 'large'>(() => (props.size === 'small' ? 'small' : props.size === 'large' ? 'large' : 'middle'));
const handleUpdate = (value: UiRadioValue) => emit('update:modelValue', value);
const handleChange = (value: UiRadioValue) => emit('change', value);
</script>

<style scoped>
:deep(.el-radio-group) { display: flex; flex-wrap: wrap; gap: 10px 16px; }
:deep(.el-radio-group.is-vertical) { flex-direction: column; align-items: flex-start; }
:deep(.el-radio) { margin-right: 0; }
</style>
