<template>
  <el-config-provider :locale="appStore.locale" :size="appStore.size" :table="tableConfig">
    <!--
      光标属于工作模式的全局视觉反馈，不应由某一个弹窗决定是否出现。
      动森模式挂载全局 Cursor 后，进入主题时立即生效；办公模式保持系统光标。
    -->
    <AnimalCursor :force-all="settingsStore.uiTheme === UiThemeEnum.ANIMAL">
      <router-view />
    </AnimalCursor>
  </el-config-provider>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { useAppStore } from '@/store/modules/app';
import { useSettingsStore } from '@/store/modules/settings';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { handleThemeStyle } from '@/utils/theme';
import { ANIMAL_PRIMARY_COLOR, applyUiTheme } from '@/utils/uiTheme';

const appStore = useAppStore();
const settingsStore = useSettingsStore();
const AnimalCursor = defineAsyncComponent(() => import('animal-island-vue').then(({ Cursor }) => Cursor));

// Element Plus 的 show-overflow-tooltip 由表格内部动态创建，无法复用页面里的
// UiTooltip。统一设置为下方弹出，空间不足时再由 Popper 自动翻转到可用方向。
const tableConfig = {
  tooltipOptions: {
    placement: 'bottom',
    offset: 8
  }
} as const;

/**
 * 统一应用工作模式与主题色。
 * 动森模式不继承办公模式的自定义主色，避免内联 CSS 变量覆盖主题组件配色。
 */
const syncUiTheme = (theme: string, dark: boolean) => {
  handleThemeStyle(theme === UiThemeEnum.ANIMAL ? ANIMAL_PRIMARY_COLOR : settingsStore.theme);
  applyUiTheme(theme, dark);
};

onMounted(() => {
  nextTick(() => {
    // 初始化主题样式
    syncUiTheme(settingsStore.uiTheme, settingsStore.dark);
  });
});

watch(
  () => [settingsStore.uiTheme, settingsStore.dark] as const,
  ([theme, dark]) => syncUiTheme(theme, dark),
  { immediate: true }
);
</script>
