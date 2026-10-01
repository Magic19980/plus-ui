<template>
  <div v-if="isAnimalMode && $slots.default" class="ui-animal-divider" :class="`ui-animal-divider--${animalType}`">
    <span class="ui-animal-divider__line" />
    <span class="ui-animal-divider__content"><slot /></span>
    <span class="ui-animal-divider__line" />
  </div>
  <AnimalDivider v-else-if="isAnimalMode" v-bind="animalAttrs" :type="animalType" />
  <ElDivider v-else v-bind="attrs"><slot /></ElDivider>
</template>

<script setup lang="ts">
/**
 * 统一分隔线适配器。
 * 设置面板等公共区域通过它切换办公模式与动森模式的分隔线视觉，
 * 避免动森页面继续出现 Element Plus 的默认分割线。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { ElDivider } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

type DividerType = 'dashed-brown' | 'dashed-teal' | 'dashed-white' | 'dashed-yellow';

const props = withDefaults(defineProps<{ type?: DividerType }>(), {
  type: 'dashed-teal'
});

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalDivider = defineAsyncComponent(() => import('animal-island-vue').then(({ Divider }) => Divider));
const animalType = computed(() => props.type);
const animalAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  Reflect.deleteProperty(nextAttrs, 'type');
  return nextAttrs;
});
</script>

<style scoped>
.ui-animal-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin: 16px 0;
  color: var(--animal-overlay-text, var(--animal-text-color, #725d42));
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .02em;
}

.ui-animal-divider__line {
  flex: 1 1 auto;
  min-width: 18px;
  border-top: 2px dashed var(--animal-primary-color, #19c8b9);
  opacity: .62;
}

.ui-animal-divider--dashed-brown .ui-animal-divider__line { border-color: var(--animal-text-color, #725d42); }
.ui-animal-divider--dashed-yellow .ui-animal-divider__line { border-color: var(--animal-status-warning, #f0b44d); }
.ui-animal-divider--dashed-white .ui-animal-divider__line { border-color: currentColor; }
</style>
