<template>
  <AnimalSwitch
    v-if="isAnimalMode"
    v-bind="attrs"
    :model-value="animalChecked"
    :size="animalSize"
    :disabled="disabled"
    :loading="loading"
    @update:model-value="handleAnimalUpdate"
    @change="handleAnimalChange"
  >
    <template v-if="inlinePrompt && activeText" #checked>{{ activeText }}</template>
    <template v-if="inlinePrompt && inactiveText" #unchecked>{{ inactiveText }}</template>
  </AnimalSwitch>
  <ElSwitch
    v-else
    v-bind="attrs"
    :model-value="modelValue"
    :size="size"
    :disabled="disabled"
    :loading="loading"
    :active-text="activeText"
    :inactive-text="inactiveText"
    :inline-prompt="inlinePrompt"
    :active-value="activeValue"
    :inactive-value="inactiveValue"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
/**
 * 统一开关适配器。
 *
 * Animal Island 的 Switch 只接受 boolean，因此这里把 Element Plus 的
 * active-value / inactive-value 语义收敛到 boolean，再还原为业务值向外抛出。
 * 页面无需为两套组件分别维护 v-model 和提示文案。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElSwitch } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type UiSwitchValue = boolean | string | number;

const props = withDefaults(
  defineProps<{
    modelValue?: UiSwitchValue;
    activeValue?: UiSwitchValue;
    inactiveValue?: UiSwitchValue;
    activeText?: string;
    inactiveText?: string;
    inlinePrompt?: boolean;
    size?: 'small' | 'default' | 'large';
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    modelValue: false,
    activeValue: true,
    inactiveValue: false,
    activeText: '',
    inactiveText: '',
    inlinePrompt: false,
    size: 'default',
    disabled: false,
    loading: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: UiSwitchValue];
  change: [value: UiSwitchValue];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalSwitch = defineAsyncComponent(() => import('animal-island-vue').then(({ Switch }) => Switch));

const animalChecked = computed(() => props.modelValue === props.activeValue);
const animalSize = computed(() => (props.size === 'small' ? 'small' : 'default'));

const toBusinessValue = (checked: boolean) => (checked ? props.activeValue : props.inactiveValue);
const handleAnimalUpdate = (checked: boolean) => {
  emit('update:modelValue', toBusinessValue(checked));
};
const handleAnimalChange = (checked: boolean) => emit('change', toBusinessValue(checked));
const handleUpdate = (value: UiSwitchValue) => emit('update:modelValue', value);
const handleChange = (value: UiSwitchValue) => emit('change', value);
</script>
