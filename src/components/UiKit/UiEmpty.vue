<template>
  <div v-if="isAnimalMode" class="ui-empty" role="status" :aria-label="description">
    <div class="ui-empty__illustration" :style="{ '--ui-empty-size': `${imageSize}px` }" aria-hidden="true">
      <span class="ui-empty__cloud ui-empty__cloud--one" />
      <span class="ui-empty__cloud ui-empty__cloud--two" />
      <span class="ui-empty__island" />
      <span class="ui-empty__flag" />
    </div>
    <p class="ui-empty__description">{{ description }}</p>
    <slot />
  </div>
  <ElEmpty v-else :description="description" :image-size="imageSize"><slot /></ElEmpty>
</template>

<script setup lang="ts">
/** 动森模式通用空状态，办公模式也使用同一语义结构以保持业务提示一致。 */
import { computed } from 'vue';
import { ElEmpty } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

withDefaults(
  defineProps<{
    description?: string;
    imageSize?: number;
  }>(),
  {
    description: '暂无数据',
    imageSize: 72
  }
);

const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
</script>

<style scoped>
.ui-empty { display: flex; align-items: center; justify-content: center; min-height: 120px; flex-direction: column; gap: 10px; color: var(--app-text-muted, #8a9a9a); text-align: center; }
.ui-empty__illustration { position: relative; width: var(--ui-empty-size); height: calc(var(--ui-empty-size) * .7); overflow: hidden; border-radius: 46% 54% 42% 58%; background: linear-gradient(180deg, var(--animal-bg-color-secondary, #e9f3e4), var(--animal-primary-color-bg, #e6f9f6)); }
.ui-empty__island { position: absolute; right: 10%; bottom: 13%; left: 10%; height: 30%; border-radius: 50%; background: var(--animal-accent-color, #ffd76a); box-shadow: 0 5px 0 color-mix(in srgb, var(--animal-accent-color, #ffd76a) 58%, #9c7a43); }
.ui-empty__flag { position: absolute; bottom: 37%; left: 49%; width: 2px; height: 28%; background: var(--animal-text-color, #6f5131); }
.ui-empty__flag::after { position: absolute; top: 0; left: 2px; width: 14px; height: 8px; border-radius: 0 8px 8px 0; background: var(--animal-primary-color, #19c8b9); content: ''; }
.ui-empty__cloud { position: absolute; width: 28%; height: 18%; border-radius: 999px; background: rgb(255 255 255 / 72%); }
.ui-empty__cloud::before, .ui-empty__cloud::after { position: absolute; bottom: 0; border-radius: 50%; background: inherit; content: ''; }
.ui-empty__cloud::before { left: 18%; width: 48%; height: 120%; }
.ui-empty__cloud::after { right: 10%; width: 40%; height: 100%; }
.ui-empty__cloud--one { top: 22%; left: 13%; }.ui-empty__cloud--two { top: 36%; right: 9%; transform: scale(.72); }
.ui-empty__description { margin: 0; color: var(--app-text-muted, #8a9a9a); font-size: 13px; }
</style>
