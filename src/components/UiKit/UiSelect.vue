<template>
  <div v-if="useAnimalSelect && isAnimalMultiple" ref="multiSelectRef" class="ui-animal-multi-select">
    <button
      type="button"
      class="ui-animal-multi-select__trigger"
      :class="{ 'is-open': multiSelectOpen, 'is-disabled': disabled }"
      :disabled="disabled"
      :aria-expanded="multiSelectOpen"
      :aria-label="triggerAriaLabel"
      aria-haspopup="listbox"
      @click.stop="toggleMultiSelect"
      @keydown="handleMultiKeydown"
    >
      <span class="ui-animal-multi-select__value" :class="{ 'is-placeholder': !selectedOptions.length }">{{ selectedText }}</span>
      <span v-if="clearable && selectedOptions.length" class="ui-animal-multi-select__clear" role="button" aria-label="清空" @click.stop="clearMultiSelect">×</span>
      <span v-else class="ui-animal-multi-select__arrow" :class="{ 'is-open': multiSelectOpen }" aria-hidden="true" />
    </button>
    <div
      v-if="multiSelectOpen"
      class="ui-animal-multi-select__dropdown"
      :class="{ 'is-drop-up': multiSelectPlacement === 'top' }"
      role="listbox"
      aria-multiselectable="true"
    >
      <input
        v-if="isFilterable"
        v-model="multiSelectKeyword"
        class="ui-animal-multi-select__search"
        type="search"
        placeholder="搜索选项"
        aria-label="搜索选项"
        @click.stop
      >
      <button
        v-for="(item, index) in filteredAnimalOptions"
        :key="String(item.value)"
        type="button"
        class="ui-animal-multi-select__option"
        :class="{ 'is-selected': selectedValues.some(value => String(value) === String(item.value)), 'is-disabled': item.disabled, 'is-active': multiActiveIndex === index }"
        :disabled="item.disabled"
        role="option"
        :aria-selected="selectedValues.some(value => String(value) === String(item.value))"
        @click.stop="toggleMultiOption(item.value)"
      >
        <span class="ui-animal-multi-select__check" aria-hidden="true">{{ selectedValues.some(value => String(value) === String(item.value)) ? '✓' : '' }}</span>
        <span>{{ item.label }}</span>
      </button>
      <span v-if="!filteredAnimalOptions.length" class="ui-animal-multi-select__empty">暂无选项</span>
    </div>
  </div>
  <div
    v-else-if="useAnimalSelect && isAnimalMode"
    ref="singleSelectRef"
    v-bind="animalSingleAttrs"
    class="ui-animal-select"
    :class="{ 'is-open': singleSelectOpen, 'is-disabled': disabled }"
  >
    <button
      type="button"
      class="ui-animal-select__trigger"
      :disabled="disabled"
      :aria-expanded="singleSelectOpen"
      :aria-label="triggerAriaLabel"
      aria-haspopup="listbox"
      @click.stop="toggleSingleSelect"
      @keydown="handleSingleKeydown"
    >
      <span class="ui-animal-select__value" :class="{ 'is-placeholder': !singleSelectedKey }">{{ singleSelectedText }}</span>
      <span class="ui-animal-select__arrow" :class="{ 'is-open': singleSelectOpen }" aria-hidden="true" />
    </button>
    <div
      v-if="singleSelectOpen"
      class="ui-animal-select__dropdown"
      :class="{ 'is-drop-up': singleSelectPlacement === 'top' }"
      role="listbox"
    >
      <input
        v-if="isFilterable"
        v-model="singleSelectKeyword"
        class="ui-animal-select__search"
        type="search"
        placeholder="搜索选项"
        aria-label="搜索选项"
        @click.stop
      >
      <button
        v-for="(item, index) in filteredSingleOptions"
        :key="item.key"
        type="button"
        class="ui-animal-select__option"
        :class="{ 'is-selected': singleSelectedKey === item.key, 'is-active': singleActiveIndex === index }"
        role="option"
        :aria-selected="singleSelectedKey === item.key"
        @click.stop="selectSingleOption(item.key)"
      >
        <span class="ui-animal-select__marker" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </button>
      <span v-if="!filteredSingleOptions.length" class="ui-animal-select__empty">暂无选项</span>
    </div>
  </div>
  <ElSelect
    v-else
    v-bind="attrs"
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    @update:model-value="handleUpdate"
    @change="handleChange"
  >
    <ElOption v-for="item in options" :key="String(item.value)" :label="item.label" :value="item.value" :disabled="item.disabled" />
  </ElSelect>
</template>

<script setup lang="ts">
/**
 * 统一下拉框适配器。
 * Animal Island 使用 key/label 选项结构，办公模式使用 Element Plus 的 Option，
 * 这里集中完成两种数据结构的转换，并保留清空筛选及不可用选项的语义。
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs } from 'vue';
import { ElOption, ElSelect } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type UiSelectValue = string | number;
type UiSelectModelValue = UiSelectValue | UiSelectValue[] | undefined;

const props = withDefaults(
  defineProps<{
    modelValue?: UiSelectModelValue;
    options?: ReadonlyArray<{ value: UiSelectValue; label: string; disabled?: boolean }>;
    placeholder?: string;
    clearable?: boolean;
    disabled?: boolean;
    multiple?: boolean;
  }>(),
  {
    modelValue: undefined,
    options: () => [],
    placeholder: '',
    clearable: false,
    disabled: false,
    multiple: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: UiSelectModelValue];
  change: [value: UiSelectModelValue];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const multiSelectRef = ref<HTMLElement>();
const singleSelectRef = ref<HTMLElement>();
const multiSelectOpen = ref(false);
const singleSelectOpen = ref(false);
const multiSelectKeyword = ref('');
const singleSelectKeyword = ref('');
const multiActiveIndex = ref(-1);
const singleActiveIndex = ref(-1);
type DropdownPlacement = 'bottom' | 'top';
const multiSelectPlacement = ref<DropdownPlacement>('bottom');
const singleSelectPlacement = ref<DropdownPlacement>('bottom');
/**
 * 远程搜索、创建选项和自定义筛选依赖 Element Select 的事件契约，
 * Animal Select 当前没有对应能力，遇到这些属性时保留 Element Plus，避免静默丢失业务行为。
 */
const useAnimalSelect = computed(() => isAnimalMode.value && !attrs.remote && !attrs['remote-method'] && !attrs['filter-method'] && !attrs['allow-create']);
const isAnimalMultiple = computed(() => useAnimalSelect.value && props.multiple);
const isFilterable = computed(() => Boolean(attrs.filterable));
const triggerAriaLabel = computed(() => String(attrs['aria-label'] || props.placeholder || '请选择'));

const selectedValues = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : []));
const selectedOptions = computed(() => props.options.filter(item => selectedValues.value.some(value => String(value) === String(item.value))));
const animalOptions = computed(() => {
  // Animal Island 当前不支持逐项 disabled；不可用项不参与候选，编辑已停用数据时保留当前值用于展示。
  const options = props.options
    .filter(item => !item.disabled || String(item.value) === String(props.modelValue))
    .map(item => ({ key: String(item.value), label: item.label }));
  if (props.clearable) options.unshift({ key: '', label: props.placeholder || '全部' });
  return options;
});
const filteredAnimalOptions = computed(() => {
  const keyword = multiSelectKeyword.value.trim().toLowerCase();
  return props.options.filter(item => !keyword || item.label.toLowerCase().includes(keyword));
});
const singleSelectedKey = computed(() => (props.modelValue === undefined || props.modelValue === null ? '' : String(props.modelValue)));
const singleSelectedText = computed(() => animalOptions.value.find(item => item.key === singleSelectedKey.value)?.label || props.placeholder || '请选择');
const filteredSingleOptions = computed(() => {
  const keyword = singleSelectKeyword.value.trim().toLowerCase();
  return animalOptions.value.filter(item => !keyword || item.label.toLowerCase().includes(keyword));
});
const selectedText = computed(() => {
  if (!selectedOptions.value.length) return props.placeholder || '请选择';
  if (selectedOptions.value.length <= 2) return selectedOptions.value.map(item => item.label).join('、');
  return `已选择 ${selectedOptions.value.length} 项`;
});

const getDropdownPlacement = (target: HTMLElement | undefined, optionCount: number, hasSearch: boolean): DropdownPlacement => {
  if (!target || typeof window === 'undefined') return 'bottom';
  const rect = target.getBoundingClientRect();
  const estimatedHeight = Math.min(320, 16 + (hasSearch ? 42 : 0) + Math.max(optionCount, 1) * 42);
  const belowSpace = window.innerHeight - rect.bottom - 12;
  const aboveSpace = rect.top - 12;
  return belowSpace < estimatedHeight && aboveSpace > belowSpace ? 'top' : 'bottom';
};

const updateDropdownPlacement = () => {
  if (multiSelectOpen.value) {
    multiSelectPlacement.value = getDropdownPlacement(multiSelectRef.value, filteredAnimalOptions.value.length, isFilterable.value);
  }
  if (singleSelectOpen.value) {
    singleSelectPlacement.value = getDropdownPlacement(singleSelectRef.value, filteredSingleOptions.value.length, isFilterable.value);
  }
};

const closeMultiSelect = (event: MouseEvent) => {
  if (multiSelectRef.value && !multiSelectRef.value.contains(event.target as Node)) multiSelectOpen.value = false;
  if (singleSelectRef.value && !singleSelectRef.value.contains(event.target as Node)) singleSelectOpen.value = false;
};
onMounted(() => {
  document.addEventListener('click', closeMultiSelect);
  window.addEventListener('resize', updateDropdownPlacement);
  window.addEventListener('scroll', updateDropdownPlacement, true);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', closeMultiSelect);
  window.removeEventListener('resize', updateDropdownPlacement);
  window.removeEventListener('scroll', updateDropdownPlacement, true);
});

const animalSingleAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  ['multiple', 'filterable', 'collapse-tags', 'collapse-tags-tooltip'].forEach(key => Reflect.deleteProperty(nextAttrs, key));
  return nextAttrs;
});

const normalizeValue = (value: string | number | undefined) => {
  if (isAnimalMode.value && value === '') return undefined;
  return value;
};

const handleUpdate = (value: string | number | undefined) => emit('update:modelValue', normalizeValue(value));
const handleChange = (value: string | number | undefined) => emit('change', normalizeValue(value));
const findNextEnabledIndex = (items: ReadonlyArray<unknown>, start: number, direction: 1 | -1) => {
  if (!items.length) return -1;
  let index = start;
  for (let count = 0; count < items.length; count += 1) {
    index = (index + direction + items.length) % items.length;
    if (!(items[index] as { disabled?: boolean } | undefined)?.disabled) return index;
  }
  return -1;
};
const toggleMultiSelect = () => {
  if (props.disabled) return;
  multiSelectOpen.value = !multiSelectOpen.value;
  if (multiSelectOpen.value) {
    multiSelectKeyword.value = '';
    multiActiveIndex.value = findNextEnabledIndex(filteredAnimalOptions.value, -1, 1);
    void nextTick(updateDropdownPlacement);
  }
};
const handleMultiKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return;
  if (event.key === 'Escape') {
    multiSelectOpen.value = false;
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (!multiSelectOpen.value) toggleMultiSelect();
    else if (multiActiveIndex.value >= 0) toggleMultiOption(filteredAnimalOptions.value[multiActiveIndex.value].value);
    return;
  }
  if (!multiSelectOpen.value || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  multiActiveIndex.value = findNextEnabledIndex(filteredAnimalOptions.value, multiActiveIndex.value, event.key === 'ArrowDown' ? 1 : -1);
};
const toggleMultiOption = (value: UiSelectValue) => {
  if (props.disabled) return;
  const values = [...selectedValues.value];
  const index = values.findIndex(item => String(item) === String(value));
  if (index >= 0) values.splice(index, 1);
  else values.push(value);
  emit('update:modelValue', values);
  emit('change', values);
};
const clearMultiSelect = () => {
  if (!selectedValues.value.length || props.disabled) return;
  emit('update:modelValue', []);
  emit('change', []);
};
const toggleSingleSelect = () => {
  if (props.disabled) return;
  singleSelectOpen.value = !singleSelectOpen.value;
  if (singleSelectOpen.value) {
    singleSelectKeyword.value = '';
    singleActiveIndex.value = Math.max(0, filteredSingleOptions.value.findIndex(item => item.key === singleSelectedKey.value));
    void nextTick(updateDropdownPlacement);
  }
};
const handleSingleKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return;
  if (event.key === 'Escape') {
    singleSelectOpen.value = false;
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (!singleSelectOpen.value) toggleSingleSelect();
    else if (singleActiveIndex.value >= 0) selectSingleOption(filteredSingleOptions.value[singleActiveIndex.value].key);
    return;
  }
  if (!singleSelectOpen.value || !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  singleActiveIndex.value = findNextEnabledIndex(filteredSingleOptions.value, singleActiveIndex.value, event.key === 'ArrowDown' ? 1 : -1);
};
const selectSingleOption = (value: string) => {
  singleSelectOpen.value = false;
  singleSelectKeyword.value = '';
  const normalizedValue = normalizeValue(value);
  emit('update:modelValue', normalizedValue);
  emit('change', normalizedValue);
};
</script>

<style scoped>
.ui-animal-multi-select,
.ui-animal-select { position: relative; display: block; width: 100%; min-width: 0; }

.ui-animal-multi-select__trigger,
.ui-animal-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 38px;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid color-mix(in srgb, var(--animal-border-color, #aaa69d) 84%, transparent);
  border-radius: 12px;
  background: var(--animal-bg-color-input, #fffbe7);
  box-shadow: 0 2px 0 color-mix(in srgb, var(--animal-shadow-soft, #d4c9b4) 70%, transparent);
  color: var(--animal-text-color, #794f27);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}

.ui-animal-multi-select__trigger:hover,
.ui-animal-multi-select__trigger.is-open,
.ui-animal-select__trigger:hover,
.ui-animal-select.is-open .ui-animal-select__trigger {
  border-color: var(--animal-primary-color, #19c8b9);
  background: color-mix(in srgb, var(--animal-primary-color-bg, #e6f9f6) 45%, var(--animal-bg-color-input, #fffbe7));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--animal-primary-color, #19c8b9) 14%, transparent), 0 2px 0 color-mix(in srgb, var(--animal-shadow-soft, #d4c9b4) 70%, transparent);
}

.ui-animal-multi-select__trigger.is-disabled,
.ui-animal-select.is-disabled { cursor: not-allowed; opacity: .6; }
.ui-animal-multi-select__trigger:disabled,
.ui-animal-select__trigger:disabled { cursor: not-allowed; }

.ui-animal-multi-select__value,
.ui-animal-select__value { min-width: 0; flex: 1; overflow: hidden; color: var(--animal-text-color, #794f27); font-size: 14px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.ui-animal-multi-select__value.is-placeholder,
.ui-animal-select__value.is-placeholder { color: var(--animal-text-color-secondary, #9f927d); font-weight: 500; }
.ui-animal-multi-select__arrow,
.ui-animal-select__arrow {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border: 1px solid color-mix(in srgb, var(--animal-border-color, #aaa69d) 72%, transparent);
  border-radius: 8px 8px 8px 4px;
  background: color-mix(in srgb, var(--animal-bg-color-secondary, #f0e8d8) 45%, transparent);
  color: var(--animal-text-color-secondary, #9f927d);
  transition: border-color .18s ease, background .18s ease, color .18s ease, box-shadow .18s ease;
}
.ui-animal-multi-select__arrow::before,
.ui-animal-select__arrow::before {
  width: 6px;
  height: 6px;
  border-right: 1.8px solid currentColor;
  border-bottom: 1.8px solid currentColor;
  content: '';
  transform: rotate(45deg) translate(-1px, -1px);
  transition: transform .22s cubic-bezier(.22, 1, .36, 1);
}
.ui-animal-multi-select__arrow.is-open,
.ui-animal-select__arrow.is-open {
  border-color: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 62%, var(--animal-border-color, #aaa69d));
  background: color-mix(in srgb, var(--animal-primary-color-bg, #e6f9f6) 72%, var(--animal-bg-color-input, #fffbe7));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--animal-primary-color, #19c8b9) 12%, transparent);
  color: var(--animal-primary-color, #19c8b9);
}
.ui-animal-multi-select__arrow.is-open::before,
.ui-animal-select__arrow.is-open::before { transform: rotate(225deg) translate(-1px, -1px); }
.ui-animal-multi-select__trigger:hover .ui-animal-multi-select__arrow,
.ui-animal-select__trigger:hover .ui-animal-select__arrow { border-color: var(--animal-primary-color, #19c8b9); color: var(--animal-primary-color, #19c8b9); }
.ui-animal-multi-select__clear { flex: 0 0 auto; color: var(--animal-text-color-secondary, #9f927d); font-size: 15px; font-weight: 800; line-height: 1; }
.ui-animal-multi-select__clear { width: 20px; height: 20px; border-radius: 50%; text-align: center; line-height: 18px; }
.ui-animal-multi-select__clear:hover { color: var(--animal-primary-color, #19c8b9); background: var(--animal-primary-color-bg, #e6f9f6); }

.ui-animal-multi-select__dropdown,
.ui-animal-select__dropdown {
  position: absolute;
  z-index: 100000;
  top: calc(100% + 10px);
  right: 0;
  left: 0;
  max-height: min(320px, 42vh);
  overflow-y: auto;
  padding: 6px;
  border: 1px solid color-mix(in srgb, var(--animal-border-color, #aaa69d) 88%, transparent);
  border-radius: 14px 14px 14px 8px;
  background: var(--animal-bg-color, #f8f8f0);
  box-shadow: 0 3px 0 color-mix(in srgb, var(--animal-shadow-soft, #d4c9b4) 72%, transparent), 0 10px 22px color-mix(in srgb, var(--animal-shadow-soft-strong, #a89878) 24%, transparent);
  animation: ui-animal-select-pop .14s ease-out both;
  scrollbar-color: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 48%, transparent) transparent;
  scrollbar-width: thin;
}

.ui-animal-multi-select__dropdown.is-drop-up,
.ui-animal-select__dropdown.is-drop-up { top: auto; bottom: calc(100% + 8px); border-radius: 14px 14px 8px 14px; animation-name: ui-animal-select-pop-up; }

.ui-animal-multi-select__dropdown::-webkit-scrollbar,
.ui-animal-select__dropdown::-webkit-scrollbar { width: 5px; }
.ui-animal-multi-select__dropdown::-webkit-scrollbar-thumb,
.ui-animal-select__dropdown::-webkit-scrollbar-thumb { border-radius: 999px; background: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 48%, transparent); }

.ui-animal-multi-select__search,
.ui-animal-select__search {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  margin: 0 2px 6px;
  padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--animal-border-color, #aaa69d) 82%, transparent);
  border-radius: 9px;
  outline: 0;
  background: var(--animal-bg-color-input, #fffbe7);
  color: var(--animal-text-color, #794f27);
  font: inherit;
  box-shadow: inset 0 1px 2px color-mix(in srgb, var(--animal-shadow-soft-strong, #a89878) 14%, transparent);
}
.ui-animal-multi-select__search:focus,
.ui-animal-select__search:focus { border-color: var(--animal-primary-color, #19c8b9); box-shadow: 0 0 0 3px color-mix(in srgb, var(--animal-primary-color, #19c8b9) 16%, transparent); }
.ui-animal-multi-select__search::placeholder,
.ui-animal-select__search::placeholder { color: var(--animal-text-color-secondary, #9f927d); }

.ui-animal-multi-select__option,
.ui-animal-select__option {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 36px;
  gap: 8px;
  padding: 7px 9px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--animal-text-color, #794f27);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background .14s ease, color .14s ease;
}

.ui-animal-multi-select__option:hover:not(:disabled),
.ui-animal-multi-select__option.is-selected,
.ui-animal-multi-select__option.is-active,
.ui-animal-select__option:hover,
.ui-animal-select__option.is-selected,
.ui-animal-select__option.is-active {
  background: var(--animal-primary-color-bg, #e6f9f6);
  color: var(--animal-primary-color, #19c8b9);
  box-shadow: none;
}

.ui-animal-select__option.is-selected::after { margin-left: auto; color: var(--animal-primary-color, #19c8b9); content: '✓'; font-size: 15px; font-weight: 900; }
.ui-animal-multi-select__option.is-disabled { color: var(--animal-text-color-disabled, #c4b89e); cursor: not-allowed; opacity: .6; }
.ui-animal-multi-select__check { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex: 0 0 16px; border: 1px solid var(--animal-border-color, #aaa69d); border-radius: 5px; background: var(--animal-bg-color-input, #fffbe7); color: #fff; font-size: 11px; font-weight: 900; }
.ui-animal-multi-select__option.is-selected .ui-animal-multi-select__check { border-color: var(--animal-primary-color, #19c8b9); background: var(--animal-primary-color, #19c8b9); }
.ui-animal-select__marker { width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; background: transparent; box-shadow: 0 0 0 3px transparent; transition: background .16s ease, box-shadow .16s ease; }
.ui-animal-select__option:hover .ui-animal-select__marker,
.ui-animal-select__option.is-selected .ui-animal-select__marker { background: var(--animal-accent-color, #ffd76a); box-shadow: 0 0 0 3px color-mix(in srgb, var(--animal-accent-color, #ffd76a) 25%, transparent); }
.ui-animal-multi-select__empty,
.ui-animal-select__empty { display: block; padding: 14px 10px; color: var(--animal-text-color-secondary, #9f927d); text-align: center; }

@keyframes ui-animal-select-pop { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ui-animal-select-pop-up { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
</style>
