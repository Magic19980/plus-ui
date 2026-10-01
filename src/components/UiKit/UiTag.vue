<template>
  <AnimalTag
    v-if="isAnimalMode"
    v-bind="animalAttrs"
    :size="animalSize"
    :variant="animalVariant"
    :color="animalColor"
  >
    <slot />
  </AnimalTag>
  <ElTag v-else v-bind="attrs" :type="type" :size="size" :effect="effect" :round="round">
    <slot />
  </ElTag>
</template>

<script setup lang="ts">
/**
 * 统一标签适配器。
 * 将 Element Plus 的 type/effect/size 映射为 Animal Island 的颜色、变体和尺寸，
 * 保证状态标签在两种工作模式下都保持相同的信息语义。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElTag } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info';
type TagSize = 'large' | 'default' | 'small';
type TagEffect = 'dark' | 'light' | 'plain';

const props = withDefaults(
  defineProps<{
    type?: TagType;
    size?: TagSize;
    effect?: TagEffect;
    round?: boolean;
  }>(),
  {
    size: 'default',
    effect: 'light',
    round: false
  }
);

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalTag = defineAsyncComponent(() => import('animal-island-vue').then(({ Tag }) => Tag));

const animalSize = computed<'small' | 'medium' | 'large'>(() => {
  if (props.size === 'small') return 'small';
  if (props.size === 'large') return 'large';
  return 'medium';
});
const animalVariant = computed<'solid' | 'outlined' | 'dashed' | 'soft'>(() => {
  if (props.effect === 'plain') return 'outlined';
  if (props.effect === 'dark') return 'solid';
  return 'soft';
});
const animalColor = computed<'default' | 'app-blue' | 'app-yellow' | 'app-red' | 'app-green'>(() => {
  if (props.type === 'success') return 'app-green';
  if (props.type === 'warning') return 'app-yellow';
  if (props.type === 'danger') return 'app-red';
  if (props.type === 'info') return 'app-blue';
  return 'default';
});
const animalAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  ['type', 'size', 'effect', 'round'].forEach(key => Reflect.deleteProperty(nextAttrs, key));
  return nextAttrs;
});
</script>

<style scoped>
:global(html[data-ui-theme='animal'][data-color-mode='dark'] .animal-tag) {
  filter: saturate(0.86) brightness(0.86);
}

</style>
