<template>
  <AnimalCard
    v-if="isAnimalMode"
    v-bind="animalAttrs"
    class="ui-animal-card"
    :type="type"
    :color="color"
    :pattern="pattern"
    :hoverable="hoverable || shadow === 'hover'"
  >
    <div v-if="$slots.header" class="ui-animal-card__header" :class="animalHeaderClass">
      <slot name="header" />
    </div>
    <div class="ui-animal-card__body" :style="animalBodyStyle">
      <slot />
    </div>
  </AnimalCard>
  <ElCard v-else v-bind="attrs" :shadow="shadow">
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
  </ElCard>
</template>

<script setup lang="ts">
/**
 * 统一卡片适配器。
 *
 * 办公模式保留 Element Plus 的卡片能力；动森模式切换到 Animal Island
 * 的圆角、纹理和交互卡片。页面只依赖这个适配器，避免两套组件结构泄漏到业务代码。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import type { StyleValue } from 'vue';
import { ElCard } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type CardType = 'default' | 'dashed';
type CardColor = 'default' | 'app-pink' | 'purple' | 'app-blue' | 'app-yellow' | 'app-orange' | 'app-teal' | 'app-green' | 'app-red' | 'lime-green' | 'yellow-green' | 'brown' | 'warm-peach-pink';
type CardPattern = 'none' | CardColor;

const props = withDefaults(
  defineProps<{
    shadow?: 'always' | 'hover' | 'never';
    type?: CardType;
    color?: CardColor;
    pattern?: CardPattern;
    hoverable?: boolean;
  }>(),
  {
    shadow: 'never',
    type: 'default',
    color: 'default',
    pattern: 'none',
    hoverable: false
  }
);

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalCard = defineAsyncComponent(() => import('animal-island-vue').then(({ Card }) => Card));

const animalAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  ['shadow', 'body-style', 'header-class'].forEach(key => Reflect.deleteProperty(nextAttrs, key));
  return nextAttrs;
});
const animalBodyStyle = computed<StyleValue>(() => attrs['body-style'] as StyleValue);
const animalHeaderClass = computed(() => attrs['header-class']);
</script>

<style scoped>
.ui-animal-card__header {
  margin: -4px -4px 16px;
  padding: 0 0 14px;
  border-bottom: 1px dashed color-mix(in srgb, var(--animal-border-color, #aaa69d) 68%, transparent);
}

.ui-animal-card__body {
  min-width: 0;
}

:global(html[data-ui-theme='animal'] .ui-animal-card) {
  min-width: 0;
  border: 2px solid var(--animal-border-color, #aaa69d);
  box-shadow: var(--app-shadow-sm, 0 2px 4px rgb(61 52 40 / 8%));
}

:global(html[data-ui-theme='animal'][data-color-mode='dark'] .ui-animal-card) {
  color: var(--animal-text-color, #f5ead1);
  border-color: var(--animal-border-color, #78918a);
  background: var(--app-surface-bg, #2b3a39);
  box-shadow: var(--app-shadow-sm);
}

:global(html[data-ui-theme='animal'][data-color-mode='dark'] .ui-animal-card__header) {
  border-bottom-color: var(--animal-border-color-light, #526b65);
}
</style>
