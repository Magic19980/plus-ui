<template>
  <ElInput
    v-if="!isAnimalMode"
    ref="officeInputRef"
    v-bind="attrs"
    :model-value="modelValue"
    type="textarea"
    :rows="rows"
    :maxlength="maxlength"
    :show-word-limit="showWordLimit"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
  <div v-else class="ui-animal-textarea-wrap" :class="animalClass" :style="animalStyle">
    <textarea
      v-bind="animalAttrs"
      class="ui-animal-textarea"
      :value="modelValue"
      :rows="rows"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      ref="animalTextareaRef"
      @input="handleInput"
      @change="handleChangeEvent"
    />
    <span v-if="showWordLimit && maxlength" class="ui-animal-textarea__count">{{ characterCount }} / {{ maxlength }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * 统一多行文本适配器。
 * Element Plus 原生提供带字数统计的 textarea，Animal Island 目前只有单行 Input，
 * 因此动森模式使用同一套主题变量绘制原生 textarea，同时保持双向绑定和字数提示语义。
 */
import { computed, ref, useAttrs } from 'vue';
import { ElInput, type InputInstance } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    rows?: number;
    maxlength?: number;
    showWordLimit?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: '',
    rows: 3,
    maxlength: undefined,
    showWordLimit: false,
    disabled: false,
    readonly: false,
    placeholder: ''
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const characterCount = computed(() => props.modelValue.length);
const officeInputRef = ref<InputInstance>();
const animalTextareaRef = ref<HTMLTextAreaElement>();

/** 外层承接布局 class/style，避免将宽度设置落到内部 textarea 后破坏计数提示的定位。 */
const animalClass = computed(() => attrs.class);
const animalStyle = computed(() => attrs.style);
const animalAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  Reflect.deleteProperty(nextAttrs, 'class');
  Reflect.deleteProperty(nextAttrs, 'style');
  return nextAttrs;
});

const handleUpdate = (value: string | number) => emit('update:modelValue', String(value));
const handleChange = (value: string | number) => emit('change', String(value));
const handleInput = (event: Event) => emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
const handleChangeEvent = (event: Event) => emit('change', (event.target as HTMLTextAreaElement).value);
const textarea = computed(() => (isAnimalMode.value ? animalTextareaRef.value : officeInputRef.value?.textarea));
const focus = () => {
  if (isAnimalMode.value) animalTextareaRef.value?.focus();
  else officeInputRef.value?.focus();
};

/** 暴露统一的聚焦能力，评论区的表情插入和回复动作无需感知底层组件库。 */
defineExpose({ focus, textarea });
</script>

<style>
.ui-animal-textarea-wrap {
  position: relative;
  display: block;
  width: 100%;
}

.ui-animal-textarea {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-height: 88px;
  padding: 12px 18px;
  border: 0;
  border-radius: 18px;
  outline: none;
  resize: vertical;
  color: var(--animal-text-color, #725d42);
  background: var(--animal-bg-color-input, #fffbe7);
  box-shadow: 0 3px 0 var(--animal-shadow-soft, #d4c9b4);
  font-family: var(--animal-font-family, 'Nunito', 'Noto Sans SC', sans-serif);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.65;
  letter-spacing: .01em;
  transition: box-shadow .2s ease, background .2s ease;
}

.ui-animal-textarea::placeholder {
  color: var(--animal-text-color-secondary, #c4b89e);
  font-weight: 400;
}

.ui-animal-textarea:focus {
  box-shadow: 0 0 0 2px var(--animal-primary-color, #19c8b9), 0 3px 0 var(--animal-shadow-soft, #d4c9b4);
}

.ui-animal-textarea:disabled {
  color: var(--animal-text-color-disabled, #c4b89e);
  background: var(--animal-bg-color-disabled, #ece8dc);
  cursor: not-allowed;
  opacity: .65;
}

.ui-animal-textarea__count {
  position: absolute;
  right: 14px;
  bottom: 8px;
  color: var(--animal-text-color-secondary, #a0936e);
  font-size: 11px;
  line-height: 1;
  pointer-events: none;
}
</style>
