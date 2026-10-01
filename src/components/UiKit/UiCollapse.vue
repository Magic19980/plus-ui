<template>
  <ElCollapse v-if="!isAnimalMode" v-model="officeValue" class="ui-collapse" :class="{ 'is-disabled': disabled }">
    <ElCollapseItem name="default" :disabled="disabled">
      <template #title><slot name="title"><span>{{ title }}</span></slot></template>
      <slot />
    </ElCollapseItem>
  </ElCollapse>
  <details v-else class="ui-animal-collapse" :class="{ 'is-disabled': disabled }" :open="modelValue" @toggle="handleToggle">
    <summary><slot name="title"><span>{{ title }}</span></slot><span class="ui-animal-collapse__chevron">⌄</span></summary>
    <div class="ui-animal-collapse__content"><slot /></div>
  </details>
</template>

<script setup lang="ts">
/**
 * 统一折叠面板适配器。
 * 动森模式使用原生 details 保持可访问性；办公模式继续使用 Element Collapse 的键盘交互。
 */
import { computed } from 'vue';
import { ElCollapse, ElCollapseItem } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

const props = withDefaults(defineProps<{ modelValue?: boolean; title?: string; disabled?: boolean }>(), { modelValue: false, title: '', disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; change: [value: boolean] }>();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const officeValue = computed<string[]>({
  get: () => (props.modelValue ? ['default'] : []),
  set: value => { const expanded = value.includes('default'); emit('update:modelValue', expanded); emit('change', expanded); }
});
const handleToggle = (event: Event) => {
  if (props.disabled) return;
  const expanded = (event.target as HTMLDetailsElement).open;
  emit('update:modelValue', expanded);
  emit('change', expanded);
};
</script>

<style scoped>
.ui-collapse { border: 0; }
.ui-animal-collapse { border: 2px solid var(--animal-border-color-light, #e8e2d6); border-radius: 16px; background: var(--animal-bg-color, #f8f8f0); overflow: hidden; }
.ui-animal-collapse summary { display: flex; align-items: center; justify-content: space-between; min-height: 56px; padding: 0 16px; color: var(--animal-text-color, #794f27); font-weight: 700; cursor: pointer; list-style: none; }
.ui-animal-collapse summary::-webkit-details-marker { display: none; }
.ui-animal-collapse__chevron { transition: transform .2s ease; }
.ui-animal-collapse[open] .ui-animal-collapse__chevron { transform: rotate(180deg); }
.ui-animal-collapse__content { padding: 0 16px 16px; }
.ui-animal-collapse.is-disabled summary { cursor: not-allowed; opacity: .6; }
</style>
