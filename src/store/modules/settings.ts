import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { NavTypeEnum } from '@/enums/NavTypeEnum';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import defaultSettings from '@/settings';
import { useDynamicTitle } from '@/utils/dynamicTitle';

/**
 * 将 localStorage 中可能遗留的字符串布尔值转换为真正的 boolean。
 * 旧版本曾由 useDark 写入独立的键，迁移期间不能让 "false" 被当成 true。
 */
const normalizeBoolean = (value: unknown, fallback: boolean) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
};

export const useSettingsStore = defineStore('setting', () => {
  const storageSetting = useStorage<LayoutSetting>('layout-setting', {
    tagsView: defaultSettings.tagsView,
    tagsViewPersist: defaultSettings.tagsViewPersist,
    tagsIcon: defaultSettings.tagsIcon,
    fixedHeader: defaultSettings.fixedHeader,
    sidebarLogo: defaultSettings.sidebarLogo,
    dynamicTitle: defaultSettings.dynamicTitle,
    sideTheme: defaultSettings.sideTheme,
    theme: defaultSettings.theme,
    dark: defaultSettings.dark,
    uiTheme: defaultSettings.uiTheme,
    navType: defaultSettings.navType,
    radiusBase: defaultSettings.radiusBase,
    fullHeightTable: defaultSettings.fullHeightTable
  });
  const title = ref<string>(defaultSettings.title);
  const theme = ref<string>(storageSetting.value.theme);
  const sideTheme = ref<string>(storageSetting.value.sideTheme);
  const uiTheme = ref<UiThemeEnum>(storageSetting.value.uiTheme || defaultSettings.uiTheme);
  const showSettings = ref<boolean>(defaultSettings.showSettings);
  const tagsView = ref<boolean>(storageSetting.value.tagsView);
  const tagsViewPersist = ref<boolean>(storageSetting.value.tagsViewPersist);
  const tagsIcon = ref<boolean>(storageSetting.value.tagsIcon);
  const fixedHeader = ref<boolean>(storageSetting.value.fixedHeader);
  const sidebarLogo = ref<boolean>(storageSetting.value.sidebarLogo);
  const dynamicTitle = ref<boolean>(storageSetting.value.dynamicTitle);
  const animationEnable = ref<boolean>(defaultSettings.animationEnable);
  const dark = ref<boolean>(normalizeBoolean(storageSetting.value.dark, defaultSettings.dark));
  const navType = ref<NavTypeEnum>(storageSetting.value.navType || NavTypeEnum.LEFT);
  const radiusBase = ref<number>(storageSetting.value.radiusBase ?? defaultSettings.radiusBase);
  const fullHeightTable = ref<boolean>(storageSetting.value.fullHeightTable ?? defaultSettings.fullHeightTable);

  /**
   * 运行时设置通过 Pinia 字段修改，初始化时的 useStorage 只负责读取并不会自动追踪这些独立 ref。
   * 这里集中回写布局配置，保证主题、深色模式和布局选项在刷新及路由重载后保持一致。
   */
  watch(
    [theme, sideTheme, uiTheme, tagsView, tagsViewPersist, tagsIcon, fixedHeader, sidebarLogo, dynamicTitle, dark, navType, radiusBase, fullHeightTable],
    ([nextTheme, nextSideTheme, nextUiTheme, nextTagsView, nextTagsViewPersist, nextTagsIcon, nextFixedHeader, nextSidebarLogo, nextDynamicTitle, nextDark, nextNavType, nextRadiusBase, nextFullHeightTable]) => {
      Object.assign(storageSetting.value, {
        theme: nextTheme,
        sideTheme: nextSideTheme,
        uiTheme: nextUiTheme,
        tagsView: nextTagsView,
        tagsViewPersist: nextTagsViewPersist,
        tagsIcon: nextTagsIcon,
        fixedHeader: nextFixedHeader,
        sidebarLogo: nextSidebarLogo,
        dynamicTitle: nextDynamicTitle,
        dark: nextDark,
        navType: nextNavType,
        radiusBase: nextRadiusBase,
        fullHeightTable: nextFullHeightTable
      });
    },
    { immediate: true }
  );

  const setTitle = (value: string) => {
    title.value = value;
    useDynamicTitle();
  };
  return {
    title,
    theme,
    sideTheme,
    uiTheme,
    showSettings,
    tagsView,
    tagsViewPersist,
    tagsIcon,
    fixedHeader,
    sidebarLogo,
    dynamicTitle,
    animationEnable,
    dark,
    navType,
    radiusBase,
    fullHeightTable,
    setTitle
  };
});
