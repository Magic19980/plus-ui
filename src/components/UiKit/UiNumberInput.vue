<template>
  <ElInputNumber
    v-if="!isAnimalMode"
    v-bind="attrs"
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :controls-position="controlsPosition"
    @update:model-value="handleUpdate"
    @change="handleChange"
  />
  <div v-else v-bind="animalAttrs" class="ui-animal-number-input" :class="{ 'is-disabled': disabled }">
    <button type="button" aria-label="减少" :disabled="disabled || !canDecrease" @click="adjust(-step)">−</button>
    <input
      :value="displayValue"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @input="handleInput"
      @change="handleNativeChange"
      @blur="commit(modelValue)"
    />
    <button type="button" aria-label="增加" :disabled="disabled || !canIncrease" @click="adjust(step)">＋</button>
  </div>
</template>

<script setup lang="ts">
/**
 * 统一数字输入适配器。
 * Animal Island 没有 InputNumber，这里补充轻量步进控件，保持最小值、最大值和步长语义。
 */
import { computed, useAttrs } from 'vue';
import { ElInputNumber } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    controlsPosition?: 'right' | '';
    ariaLabel?: string;
  }>(),
  {
    modelValue: 0,
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    step: 1,
    disabled: false,
    controlsPosition: 'right',
    ariaLabel: '数字输入'
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const animalAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  ['controls-position', 'precision', 'step-strictly', 'formatter', 'parser'].forEach(key => Reflect.deleteProperty(nextAttrs, key));
  return nextAttrs;
});
const displayValue = computed(() => String(props.modelValue ?? props.min));
const canDecrease = computed(() => Number(props.modelValue ?? props.min) > props.min);
const canIncrease = computed(() => Number(props.modelValue ?? props.min) < props.max);

const clamp = (value: number) => Math.min(Math.max(value, props.min), props.max);
const commit = (value: number) => {
  const next = clamp(Number.isFinite(value) ? value : props.min);
  emit('update:modelValue', next);
  emit('change', next);
};
const adjust = (offset: number) => commit(Number(props.modelValue ?? props.min) + offset);
const handleUpdate = (value: number | undefined) => commit(value ?? props.min);
const handleChange = (value: number | undefined) => emit('change', clamp(value ?? props.min));
const handleInput = (event: Event) => {
  const value = Number((event.target as HTMLInputElement).value);
  if (Number.isFinite(value)) emit('update:modelValue', clamp(value));
};
const handleNativeChange = (event: Event) => commit(Number((event.target as HTMLInputElement).value));
</script>

<style scoped>
.ui-animal-number-input { display: inline-flex; align-items: center; width: 120px; height: 40px; overflow: hidden; border: 2px solid var(--animal-border-color, #aaa69d); border-radius: 18px; background: var(--animal-bg-color-input, #fffbe7); box-shadow: 0 2px 0 var(--animal-shadow-soft, #d4c9b4); transition: border-color .2s ease, box-shadow .2s ease; }
.ui-animal-number-input:focus-within { border-color: var(--animal-primary-color, #19c8b9); box-shadow: 0 0 0 2px color-mix(in srgb, var(--animal-primary-color, #19c8b9) 18%, transparent), 0 2px 0 var(--animal-shadow-soft, #d4c9b4); }
.ui-animal-number-input button { width: 32px; height: 100%; flex: 0 0 32px; border: 0; color: var(--animal-text-color, #794f27); background: transparent; font-size: 18px; line-height: 1; cursor: pointer; }
.ui-animal-number-input button:hover:not(:disabled) { color: var(--animal-primary-color, #19c8b9); background: var(--animal-primary-color-bg, #e6f9f6); }
.ui-animal-number-input button:disabled { color: var(--animal-text-color-disabled, #c4b89e); cursor: not-allowed; opacity: .55; }
.ui-animal-number-input input { width: 100%; min-width: 0; height: 100%; padding: 0 2px; border: 0; outline: 0; color: var(--animal-text-color, #794f27); background: transparent; text-align: center; font: inherit; font-weight: 700; }
.ui-animal-number-input input::-webkit-inner-spin-button, .ui-animal-number-input input::-webkit-outer-spin-button { margin: 0; appearance: none; }
.ui-animal-number-input.is-disabled { opacity: .6; }
</style>
