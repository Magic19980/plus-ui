<template>
  <div v-if="isAnimalMode" class="ui-animal-input-wrap" :class="animalClass" :style="animalStyle">
    <AnimalInput
      v-bind="animalAttrs"
      :model-value="String(modelValue ?? '')"
      :type="type"
      :size="animalSize"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :allow-clear="clearable"
      @update:model-value="handleUpdate"
      @change="handleChange"
      @clear="emit('clear')"
    >
      <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
      <template v-if="$slots.suffix" #suffix><slot name="suffix" /></template>
    </AnimalInput>
    <span v-if="showWordLimit && maxlength" class="ui-animal-input__count">{{ characterCount }} / {{ maxlength }}</span>
  </div>
  <ElInput
    v-else
    v-bind="attrs"
    :model-value="modelValue"
    :type="type"
    :size="size"
    :disabled="disabled"
    :readonly="readonly"
    :maxlength="maxlength"
    :placeholder="placeholder"
    :clearable="clearable"
    :show-word-limit="showWordLimit"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @clear="emit('clear')"
  >
    <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="$slots.suffix" #suffix><slot name="suffix" /></template>
  </ElInput>
</template>

<script setup lang="ts">
/**
 * 统一输入框适配器。
 * 业务页面只绑定标准的 modelValue 和常用属性，工作模式切换由适配器完成，
 * 这样可以避免在每个页面重复维护 Element Plus / Animal Island 两套模板。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElInput } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string | number;
    type?: string;
    size?: 'small' | 'default' | 'large';
    clearable?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    maxlength?: number;
    showWordLimit?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: '',
    type: 'text',
    size: 'default',
    clearable: false,
    disabled: false,
    readonly: false,
    maxlength: undefined,
    showWordLimit: false,
    placeholder: ''
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: string | number];
  clear: [];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalInput = defineAsyncComponent(() => import('animal-island-vue').then(({ Input }) => Input));
const characterCount = computed(() => String(props.modelValue ?? '').length);
const animalClass = computed(() => attrs.class);
const animalStyle = computed(() => attrs.style);
const animalAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  Reflect.deleteProperty(nextAttrs, 'class');
  Reflect.deleteProperty(nextAttrs, 'style');
  return nextAttrs;
});

const animalSize = computed<'small' | 'middle' | 'large'>(() => {
  if (props.size === 'small') return 'small';
  if (props.size === 'large') return 'large';
  return 'middle';
});

const handleUpdate = (value: string | number) => emit('update:modelValue', value);
const handleChange = (value: string | number) => emit('change', value);
</script>

<style scoped>
.ui-animal-input-wrap {
  position: relative;
  display: block;
  width: 100%;
}

.ui-animal-input__count {
  position: absolute;
  right: 14px;
  bottom: 6px;
  color: var(--animal-text-color-secondary, #a0936e);
  font-size: 11px;
  line-height: 1;
  pointer-events: none;
}
</style>
