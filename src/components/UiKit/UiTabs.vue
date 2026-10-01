<template>
  <div
    v-if="isAnimalMode"
    v-bind="attrs"
    class="ui-animal-tabs"
    :class="{ 'ui-tabs-contentless': contentless, 'ui-tabs-shadow': shadow }"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="ui-animal-tabs__item"
      :class="{ 'is-active': item.key === modelValue }"
      role="tab"
      :aria-selected="item.key === modelValue"
      :tabindex="item.key === modelValue ? 0 : -1"
      @click="selectTab(item.key)"
    >
      <el-icon v-if="item.icon" class="ui-animal-tabs__icon"><component :is="item.icon" /></el-icon>
      <span>{{ item.label }}</span>
    </button>
  </div>
  <div v-if="isAnimalMode && !contentless" class="ui-animal-tabs__content">
    <div v-for="item in items" v-show="item.key === modelValue" :key="item.key" class="ui-animal-tabs__panel" role="tabpanel">
      <slot :name="item.key" />
    </div>
  </div>
  <ElTabs v-if="!isAnimalMode" v-bind="attrs" :model-value="modelValue" @update:model-value="handleUpdate" @tab-change="handleChange">
    <ElTabPane v-for="item in items" :key="item.key" :name="item.key" :label="item.label">
      <slot :name="item.key" />
    </ElTabPane>
  </ElTabs>
</template>

<script setup lang="ts">
/**
 * 页签适配器。
 * Animal 模式使用统一的分段页签，办公模式保留 Element Tabs，
 * 并统一对外暴露 update:modelValue/change 两个事件。
 */
import type { Component } from 'vue';
import { computed, useAttrs } from 'vue';
import { ElTabPane, ElTabs } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

interface TabItem {
  key: string;
  label: string;
  icon?: Component;
}

const props = withDefaults(
  defineProps<{
    items: readonly TabItem[];
    modelValue?: string;
    leafAnimation?: boolean;
    shadow?: boolean;
    ariaLabel?: string;
    /** 只有页签导航、不在组件内部承载面板内容时隐藏空面板。 */
    contentless?: boolean;
  }>(),
  {
    modelValue: '',
    leafAnimation: true,
    shadow: true,
    ariaLabel: '页面标签',
    contentless: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const settingsStore = useSettingsStore();
const attrs = useAttrs();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);

const handleUpdate = (value: string) => emit('update:modelValue', value);
const handleChange = (value: string) => emit('change', value);
const selectTab = (value: string) => {
  if (value === props.modelValue) return;
  handleUpdate(value);
  handleChange(value);
};
</script>

<style scoped>
.ui-animal-tabs {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 4px;
  padding: 4px;
  overflow-x: auto;
  border: 1px solid color-mix(in srgb, var(--animal-primary-color, #19c8b9) 13%, var(--animal-border-color-light, #e8e2d6));
  border-radius: 12px;
  background: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 5%, var(--animal-bg-color-secondary, #f0e8d8));
  box-sizing: border-box;
  scrollbar-width: none;
}

.ui-animal-tabs::-webkit-scrollbar { display: none; }

.ui-animal-tabs__item {
  display: inline-flex;
  min-width: 0;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 0 0 auto;
  padding: 8px 14px;
  border: 0;
  border-radius: 9px;
  color: var(--animal-text-color-secondary, #71809a);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  transition: color .2s, background-color .2s, box-shadow .2s, transform .2s;
}

.ui-animal-tabs__item:hover { color: var(--animal-primary-color, #19c8b9); background: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 12%, transparent); }
.ui-animal-tabs__item:focus-visible { outline: 2px solid color-mix(in srgb, var(--animal-primary-color, #19c8b9) 60%, transparent); outline-offset: 2px; }
.ui-animal-tabs__item.is-active { color: #fff; background: var(--animal-primary-color, #19c8b9); box-shadow: 0 5px 12px color-mix(in srgb, var(--animal-primary-color, #19c8b9) 22%, transparent); transform: translateY(-1px); }
.ui-animal-tabs__icon { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; font-size: 14px; }
.ui-animal-tabs__content { width: 100%; min-width: 0; margin-top: 12px; }
.ui-animal-tabs__panel { min-width: 0; }
.ui-tabs-shadow { box-shadow: 0 5px 14px color-mix(in srgb, var(--animal-shadow-soft, rgb(47 73 111 / 8%)) 60%, transparent); }

:global(html[data-ui-theme='animal'][data-color-mode='dark'] .ui-animal-tabs) {
  border-color: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 22%, var(--animal-border-color-light, #526b65));
  background: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 8%, var(--animal-bg-color-secondary, #344a46));
}

:global(html[data-ui-theme='animal'][data-color-mode='dark'] .ui-animal-tabs__item) { color: var(--animal-text-color-secondary, #c9d8d0); }
:global(html[data-ui-theme='animal'][data-color-mode='dark'] .ui-animal-tabs__item:hover) { color: var(--animal-text-color, #f5ead1); background: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 18%, transparent); }
:global(html[data-ui-theme='animal'][data-color-mode='dark'] .ui-animal-tabs__item.is-active) { color: #fff9e3; background: var(--animal-primary-color, #19c8b9); }

@media (max-width: 720px) {
  .ui-animal-tabs__item { padding-right: 10px; padding-left: 10px; }
}
</style>
