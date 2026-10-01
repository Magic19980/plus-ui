<template>
  <UiDrawer
    v-model="showSettings"
    class="settings-drawer"
    :with-header="false"
    placement="right"
    size="300px"
    close-on-click-modal
  >
    <h3 class="drawer-title">{{ t('common.settingMenuNavigation') }}</h3>
    <div class="nav-wrap">
      <div
        class="item left"
        @click="handleNavType(NavTypeEnum.LEFT)"
        :style="{ '--theme': theme }"
        :class="{ activeItem: navType == NavTypeEnum.LEFT }"
      >
        <span class="item-preview"><b></b><b></b></span>
        <span class="item-label">{{ t('common.settingLeftMenu') }}</span>
        <span v-if="navType == NavTypeEnum.LEFT" class="check-badge">
          <el-icon><Check /></el-icon>
        </span>
      </div>

      <div
        class="item mix"
        @click="handleNavType(NavTypeEnum.MIX)"
        :style="{ '--theme': theme }"
        :class="{ activeItem: navType == NavTypeEnum.MIX }"
      >
        <span class="item-preview"><b></b><b></b></span>
        <span class="item-label">{{ t('common.settingMixedMenu') }}</span>
        <span v-if="navType == NavTypeEnum.MIX" class="check-badge">
          <el-icon><Check /></el-icon>
        </span>
      </div>

      <div
        class="item top"
        @click="handleNavType(NavTypeEnum.TOP)"
        :style="{ '--theme': theme }"
        :class="{ activeItem: navType == NavTypeEnum.TOP }"
      >
        <span class="item-preview"><b></b><b></b></span>
        <span class="item-label">{{ t('common.settingTopMenu') }}</span>
        <span v-if="navType == NavTypeEnum.TOP" class="check-badge">
          <el-icon><Check /></el-icon>
        </span>
      </div>
    </div>

    <h3 class="drawer-title">{{ t('common.settingWorkMode') }}</h3>

    <div class="work-mode-grid">
      <button
        v-for="definition in UI_THEME_DEFINITIONS"
        :key="definition.id"
        type="button"
        class="work-mode-card"
        :class="[{ activeItem: uiTheme === definition.id }, `tone-${definition.tone}`]"
        @click="handleUiTheme(definition.id)"
      >
        <span class="work-mode-preview" aria-hidden="true">
          <span class="work-mode-preview-top" />
          <span class="work-mode-preview-side" />
          <span class="work-mode-preview-card" />
          <span class="work-mode-preview-button" />
        </span>
        <span class="work-mode-copy">
          <strong>{{ getUiThemeLabel(definition.id) }}</strong>
          <small>{{ getUiThemeDescription(definition.id) }}</small>
        </span>
        <span v-if="uiTheme === definition.id" class="check-badge">
          <el-icon><Check /></el-icon>
        </span>
      </button>
    </div>

    <UiThemePreview :theme="uiTheme" />

    <h3 class="drawer-title">{{ t('common.settingDisplayMode') }}</h3>

    <div class="display-mode-grid">
      <button type="button" class="display-mode-card" :class="{ activeItem: !isDark }" @click="handleColorMode(false)">
        <span class="item-preview"><img src="@/assets/images/light.svg" alt="light" /></span>
        <span class="item-label">{{ t('common.settingLightMode') }}</span>
        <span v-if="!isDark" class="check-badge">
          <el-icon><Check /></el-icon>
        </span>
      </button>

      <button type="button" class="display-mode-card" :class="{ activeItem: isDark }" @click="handleColorMode(true)">
        <span class="item-preview"><img src="@/assets/images/dark.svg" alt="dark" /></span>
        <span class="item-label">{{ t('common.settingDarkMode') }}</span>
        <span v-if="isDark" class="check-badge">
          <el-icon><Check /></el-icon>
        </span>
      </button>
    </div>
    <div class="drawer-item">
      <span>{{ t('common.settingThemeColor') }}</span>
      <span class="comp-style">
        <el-color-picker v-model="theme" :predefine="predefineColors" @change="themeChange" />
      </span>
    </div>
    <div class="drawer-item">
      <span>{{ t('common.settingPageRadius') }}</span>
      <span class="comp-style">
        <el-slider v-model="radiusBase" :min="0" :max="32" :step="2" style="width: 120px" @change="radiusBaseChange" />
      </span>
    </div>

    <UiDivider />

    <h3 class="drawer-title">{{ t('common.settingLayoutConfig') }}</h3>

    <div class="drawer-item">
      <span>{{ t('common.settingEnableTagsView') }}</span>
      <span class="comp-style">
        <UiSwitch v-model="settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingPersistTagsView') }}</span>
      <span class="comp-style">
        <UiSwitch v-model="settingsStore.tagsViewPersist" :disabled="!settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingShowTagsIcon') }}</span>
      <span class="comp-style">
        <UiSwitch v-model="settingsStore.tagsIcon" :disabled="!settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingFixedHeader') }}</span>
      <span class="comp-style">
        <UiSwitch v-model="settingsStore.fixedHeader" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingShowLogo') }}</span>
      <span class="comp-style">
        <UiSwitch v-model="settingsStore.sidebarLogo" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingDynamicTitle') }}</span>
      <span class="comp-style">
        <UiSwitch v-model="settingsStore.dynamicTitle" class="drawer-switch" @change="dynamicTitleChange" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingFullHeightTable') }}</span>
      <span class="comp-style">
        <UiSwitch v-model="settingsStore.fullHeightTable" class="drawer-switch" />
      </span>
    </div>

    <UiDivider />

    <div class="settings-actions">
      <UiButton type="primary" plain icon="DocumentAdd" @click="saveSetting">{{ t('common.settingSaveConfig') }}</UiButton>
      <UiButton plain icon="Refresh" @click="resetSetting">{{ t('common.settingResetConfig') }}</UiButton>
    </div>
  </UiDrawer>
</template>

<script setup lang="ts">
import { Check } from '@element-plus/icons-vue';
import UiThemePreview from '@/components/UiThemePreview/index.vue';
import { UiButton, UiDivider, UiDrawer, UiSwitch } from '@/components/UiKit';
import { NavTypeEnum } from '@/enums/NavTypeEnum';
import { SideThemeEnum } from '@/enums/SideThemeEnum';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import modal from '@/plugins/modal';
import defaultSettings from '@/settings';
import { useAppStore } from '@/store/modules/app';
import { usePermissionStore } from '@/store/modules/permission';
import { useSettingsStore } from '@/store/modules/settings';
import { UI_THEME_DEFINITIONS } from '@/themes';
import { useDynamicTitle } from '@/utils/dynamicTitle';
import { handleThemeStyle } from '@/utils/theme';
import { ANIMAL_PRIMARY_COLOR, applyUiTheme } from '@/utils/uiTheme';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const appStore = useAppStore();
const settingsStore = useSettingsStore();
const permissionStore = usePermissionStore();

const showSettings = ref(false);
const theme = ref(settingsStore.theme);
const sideTheme = ref(settingsStore.sideTheme);
const uiTheme = ref<UiThemeEnum>(settingsStore.uiTheme);
const storeSettings = computed(() => settingsStore);
const predefineColors = ref(['#0EA5E9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#84cc16']);
const navType = ref(settingsStore.navType);
const radiusBase = ref(settingsStore.radiusBase);
// 深色模式只使用 layout-setting.dark 作为唯一状态源。
// 旧实现同时使用 useDarkKey 和 layout-setting.dark，两个存储值不一致时，
// 会出现画布、菜单、VXE 表格分别处于不同主题的情况。
const isDark = computed({
  get: () => settingsStore.dark,
  set: value => {
    settingsStore.dark = value;
  }
});

// 页面主题切换时同步布局状态，避免浅色页面残留暗色菜单导致文字与背景对比度不足。
watch(
  () => settingsStore.dark,
  value => {
    const nextSideTheme = value ? SideThemeEnum.DARK : SideThemeEnum.LIGHT;
    sideTheme.value = nextSideTheme;
    settingsStore.sideTheme = nextSideTheme;
    applyUiTheme(uiTheme.value, value);
  },
  { immediate: true }
);

// 主题副作用集中在此处，避免切换页签或刷新页面时出现主题状态不一致。

/** 菜单导航设置 */
watch(
  navType,
  val => {
    if (val === NavTypeEnum.TOP) {
      appStore.toggleSideBarHide(true);
      permissionStore.setSidebarRouters(permissionStore.defaultRoutes as any);
    } else if (val === NavTypeEnum.LEFT) {
      appStore.toggleSideBarHide(false);
      permissionStore.setSidebarRouters(permissionStore.defaultRoutes as any);
    } else if (val === NavTypeEnum.MIX) {
      appStore.toggleSideBarHide(false);
    }
  },
  { immediate: true }
);

const handleNavType = (val: NavTypeEnum) => {
  settingsStore.navType = val;
  navType.value = val;
};

const dynamicTitleChange = () => {
  // 动态设置网页标题
  useDynamicTitle();
};

const themeChange = (val: string) => {
  settingsStore.theme = val;
  handleThemeStyle(uiTheme.value === UiThemeEnum.ANIMAL ? ANIMAL_PRIMARY_COLOR : val);
};
const getUiThemeLabel = (value: UiThemeEnum) =>
  value === UiThemeEnum.ANIMAL ? t('common.settingAnimalMode') : t('common.settingOfficeMode');
const getUiThemeDescription = (value: UiThemeEnum) =>
  value === UiThemeEnum.ANIMAL ? t('common.settingAnimalModeDescription') : t('common.settingOfficeModeDescription');
const handleUiTheme = (value: UiThemeEnum) => {
  uiTheme.value = value;
  settingsStore.uiTheme = value;
  handleThemeStyle(value === UiThemeEnum.ANIMAL ? ANIMAL_PRIMARY_COLOR : theme.value);
  applyUiTheme(value, isDark.value);
};
const handleColorMode = (value: boolean) => {
  const nextDark = Boolean(value);
  const nextSideTheme = nextDark ? SideThemeEnum.DARK : SideThemeEnum.LIGHT;

  // 立即写入并应用完整主题状态，避免设置抽屉关闭/切换页签前出现一帧旧主题。
  settingsStore.dark = nextDark;
  settingsStore.sideTheme = nextSideTheme;
  sideTheme.value = nextSideTheme;
  applyUiTheme(uiTheme.value, nextDark);
};
const radiusBaseChange = (val: number) => {
  settingsStore.radiusBase = val;
  // 更新 CSS 变量
  document.documentElement.style.setProperty('--app-radius-base', `${val}px`);
};
const saveSetting = () => {
  modal.loading(t('common.settingSaving'));
  const settings = useStorage<LayoutSetting>('layout-setting', defaultSettings);
  if (!storeSettings.value.tagsViewPersist) {
    localStorage.removeItem('tags-view-visited');
  }
  settings.value.tagsView = storeSettings.value.tagsView;
  settings.value.tagsViewPersist = storeSettings.value.tagsViewPersist;
  settings.value.tagsIcon = storeSettings.value.tagsIcon;
  settings.value.fixedHeader = storeSettings.value.fixedHeader;
  settings.value.sidebarLogo = storeSettings.value.sidebarLogo;
  settings.value.dynamicTitle = storeSettings.value.dynamicTitle;
  settings.value.sideTheme = storeSettings.value.sideTheme;
  settings.value.theme = storeSettings.value.theme;
  settings.value.dark = storeSettings.value.dark;
  settings.value.uiTheme = storeSettings.value.uiTheme;
  settings.value.navType = storeSettings.value.navType;
  settings.value.radiusBase = storeSettings.value.radiusBase;
  settings.value.fullHeightTable = storeSettings.value.fullHeightTable;
  setTimeout(() => {
    modal.closeLoading();
  }, 1000);
};
const resetSetting = () => {
  modal.loading(t('common.settingClearCacheAndRefresh'));
  localStorage.removeItem('tags-view-visited');
  useStorage<any>('layout-setting', null).value = null;
  setTimeout('window.location.reload()', 1000);
};
const openSetting = () => {
  showSettings.value = true;
};

onMounted(() => {
  radiusBaseChange(storeSettings.value.radiusBase);
});

defineExpose({
  openSetting
});
</script>

<style lang="scss" scoped>
.settings-drawer {
  :deep(.el-drawer__body),
  :deep(.animal-drawer__body) {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 18px 18px 20px;
  }
}

.setting-drawer-title {
  margin-bottom: 12px;
  color: var(--app-text-title);
  line-height: 22px;
  font-weight: bold;
  .drawer-title {
    font-size: 14px;
  }
}
// 统一的选中勾选徽章
.check-badge {
  position: absolute;
  top: -7px;
  right: -7px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--theme);
  color: #fff;
  font-size: 12px;
  box-shadow: 0 0 0 2px var(--el-bg-color);
}

// 主题风格设置
.setting-drawer-block-checbox {
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  gap: 12px;
  margin-top: 10px;
  margin-bottom: 20px;

  .setting-drawer-block-checbox-item {
    position: relative;
    flex: 1;
    max-width: 84px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px 4px;
    border-radius: var(--app-radius-md);
    cursor: pointer;
    background: var(--app-elevated-soft-bg);
    border: 2px solid transparent;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: rgba(14, 165, 233, 0.45);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.activeItem {
      border-color: var(--theme);
      box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
    }

    .item-preview {
      display: block;
      width: 100%;
      height: 36px;
      border-radius: calc(var(--app-radius-md) - 2px);
      overflow: hidden;

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .item-label {
      margin-top: 4px;
      font-size: 12px;
      line-height: 1.2;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }
  }
}

// 工作模式：选择的是组件体系，不是单纯的颜色皮肤。
.work-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 10px 0 12px;
}

.work-mode-card,
.display-mode-card {
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
  padding: 7px;
  border: 2px solid transparent;
  border-radius: var(--app-radius-md);
  background: var(--app-elevated-soft-bg);
  color: var(--app-text-title);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: rgba(14, 165, 233, 0.45);
    box-shadow: var(--app-shadow-sm);
    transform: translateY(-1px);
  }

  &.activeItem {
    border-color: var(--theme);
    box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
  }
}

:global(.settings-drawer .animal-drawer__body) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px 18px 20px;
}

.work-mode-preview {
  position: relative;
  display: block;
  height: 48px;
  overflow: hidden;
  border-radius: calc(var(--app-radius-md) - 2px);
  background: #f5f7fa;
}

.work-mode-preview-top,
.work-mode-preview-side,
.work-mode-preview-card,
.work-mode-preview-button {
  position: absolute;
  display: block;
}

.work-mode-preview-top {
  top: 6px;
  right: 6px;
  left: 6px;
  height: 5px;
  border-radius: 3px;
  background: #ffffff;
  box-shadow: 0 6px 0 #ffffff;
}

.work-mode-preview-side {
  top: 18px;
  bottom: 6px;
  left: 6px;
  width: 18px;
  border-radius: 4px;
  background: #1f2937;
}

.work-mode-preview-card {
  top: 20px;
  right: 6px;
  left: 30px;
  height: 18px;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 5px 0 rgba(255, 255, 255, 0.82);
}

.work-mode-preview-button {
  right: 10px;
  bottom: 9px;
  width: 18px;
  height: 4px;
  border-radius: 999px;
  background: var(--theme);
}

.work-mode-card.tone-island {
  .work-mode-preview {
    background: #bfe3bf;
  }

  .work-mode-preview-top {
    height: 7px;
    border-radius: 0 0 8px 8px;
    background: #fff8df;
    box-shadow: none;
  }

  .work-mode-preview-side {
    top: 21px;
    width: 22px;
    border-radius: 9px;
    background: #80cfc2;
  }

  .work-mode-preview-card {
    top: 22px;
    left: 34px;
    height: 20px;
    border-radius: 10px;
    background: #fff8df;
    box-shadow: 0 3px 0 #bdaea0;
  }

  .work-mode-preview-button {
    right: 11px;
    bottom: 10px;
    height: 6px;
    border-radius: 999px;
    background: #19c8b9;
  }
}

.work-mode-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  margin-top: 7px;

  strong {
    overflow: hidden;
    font-size: 12px;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    overflow: hidden;
    color: var(--app-text-muted);
    font-size: 10px;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.display-mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 10px 0 4px;

  .display-mode-card {
    align-items: center;
    padding: 6px 5px 5px;
    text-align: center;

    .item-preview {
      display: block;
      width: 100%;
      height: 36px;
      overflow: hidden;
      border-radius: calc(var(--app-radius-md) - 2px);

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .item-label {
      margin-top: 4px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 1.2;
      white-space: nowrap;
    }
  }
}

.drawer-item {
  padding: 12px 0;
  font-size: 14px;
  color: var(--app-text-title);
  border-bottom: 1px solid var(--app-surface-border);

  .comp-style {
    float: right;
    margin: -3px 8px 0px 0px;
  }
}

.settings-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 2px;

  > * {
    min-width: 0;
  }
}

// 导航模式
.nav-wrap {
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  gap: 12px;
  margin-top: 10px;
  margin-bottom: 20px;

  .item {
    position: relative;
    flex: 1;
    max-width: 84px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 4px 4px;
    border-radius: var(--app-radius-md);
    cursor: pointer;
    background: var(--app-elevated-soft-bg);
    border: 2px solid transparent;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      border-color: rgba(14, 165, 233, 0.45);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.activeItem {
      border-color: var(--theme);
      box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
    }

    .item-preview {
      position: relative;
      display: block;
      width: 100%;
      height: 36px;
      border-radius: calc(var(--app-radius-md) - 2px);
      background: var(--el-fill-color-blank);
      overflow: hidden;
    }

    .item-label {
      margin-top: 4px;
      font-size: 12px;
      line-height: 1.2;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }

    b {
      position: absolute;
      background: var(--el-text-color-primary);
    }
  }

  // 左侧菜单：顶部横条 + 左侧侧边栏
  .left .item-preview {
    b:first-child {
      top: 0;
      left: 0;
      right: 0;
      height: 22%;
      border-radius: 3px 3px 0 0;
    }

    b:last-child {
      top: 22%;
      left: 0;
      bottom: 0;
      width: 28%;
      border-radius: 0 0 0 3px;
    }
  }

  // 混合菜单：顶部横条 + 中部左侧侧边栏
  .mix .item-preview {
    b:first-child {
      top: 0;
      left: 0;
      right: 0;
      height: 22%;
      border-radius: 3px 3px 0 0;
    }

    b:last-child {
      top: 22%;
      left: 0;
      height: 55%;
      width: 28%;
      border-radius: 0 0 0 3px;
    }
  }

  // 顶部菜单：仅顶部横条
  .top .item-preview {
    b:first-child {
      top: 0;
      left: 0;
      right: 0;
      height: 22%;
      border-radius: 3px 3px 0 0;
    }

    b:last-child {
      display: none;
    }
  }
}
</style>

<!-- 动森模式设置抽屉：将第三方抽屉及其内部控件接入应用的浅色/深色令牌。 -->
<style lang="scss">
html[data-ui-theme='animal'] .settings-drawer,
html[data-ui-theme='animal'] [data-animal-drawer-portal] {
  --settings-drawer-bg: var(--animal-overlay-bg, #fffdf5);
  --settings-drawer-surface: var(--animal-overlay-surface, #f8f8f0);
  --settings-drawer-border: var(--animal-overlay-border, #e8dcc8);
  --settings-drawer-text: var(--animal-overlay-text, #6f5131);
  --settings-drawer-muted: var(--animal-overlay-muted, #9f927d);
  --settings-drawer-hover: var(--animal-overlay-hover, #e6f9f6);
  --settings-drawer-primary: var(--animal-primary-color, #19c8b9);
  --settings-drawer-primary-hover: var(--animal-primary-color-hover, #3dd4c6);

  color: var(--settings-drawer-text);
  font-family: var(--animal-font-family, 'Nunito', 'Noto Sans SC', sans-serif);

  .animal-drawer__panel,
  .animal-drawer__body {
    background: var(--settings-drawer-bg) !important;
    color: var(--settings-drawer-text) !important;
  }

  .animal-drawer__panel {
    border-left: 2px solid var(--settings-drawer-border);
    box-shadow: -12px 0 32px rgba(61, 52, 40, 0.16);
  }

  .animal-drawer__mask {
    background: var(--animal-overlay-mask, rgba(64, 91, 74, 0.34)) !important;
  }

  .animal-drawer__body {
    scrollbar-color: var(--app-scrollbar-thumb, rgba(76, 118, 93, 0.36)) transparent;
  }

  .drawer-title {
    margin: 4px 0 6px;
    color: var(--settings-drawer-text);
    font-size: 18px;
    font-weight: 800;
    line-height: 1.35;
    letter-spacing: 0.01em;
  }

  .nav-wrap .item,
  .work-mode-card,
  .display-mode-card {
    border-color: var(--settings-drawer-border);
    background: var(--settings-drawer-surface);
    color: var(--settings-drawer-text);
    box-shadow: 0 2px 0 rgba(61, 52, 40, 0.08);
  }

  .nav-wrap .item:hover,
  .work-mode-card:hover,
  .display-mode-card:hover {
    border-color: var(--settings-drawer-primary-hover);
    background: var(--settings-drawer-hover);
    box-shadow: 0 4px 10px rgba(61, 52, 40, 0.12);
  }

  .nav-wrap .item.activeItem,
  .work-mode-card.activeItem,
  .display-mode-card.activeItem {
    border-color: var(--settings-drawer-primary);
    background: var(--settings-drawer-hover);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--settings-drawer-primary) 22%, transparent);
  }

  .nav-wrap .item .item-preview,
  .display-mode-card .item-preview {
    background: var(--animal-bg-color-input, #fffbe7);
    border: 1px solid color-mix(in srgb, var(--settings-drawer-border) 72%, transparent);
  }

  .nav-wrap .item b {
    background: var(--settings-drawer-text);
  }

  .nav-wrap .item .item-label,
  .display-mode-card .item-label,
  .work-mode-copy strong {
    color: var(--settings-drawer-text);
  }

  .work-mode-copy small {
    color: var(--settings-drawer-muted);
  }

  .work-mode-preview {
    background: var(--animal-bg-color, #f8f8f0);
    border: 1px solid color-mix(in srgb, var(--settings-drawer-border) 72%, transparent);
  }

  .work-mode-card.tone-island .work-mode-preview {
    background: #bfe3bf;
  }

  .check-badge {
    background: var(--settings-drawer-primary);
    color: #fffdf5;
    box-shadow: 0 0 0 2px var(--settings-drawer-bg);
  }

  .drawer-item {
    color: var(--settings-drawer-text);
    border-bottom-color: var(--settings-drawer-border);
  }

  .settings-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 2px;

    > .animal-btn,
    > .ui-animal-button,
    > .el-button {
      width: 100%;
      min-width: 0;
    }
  }

  .drawer-switch {
    vertical-align: middle;
  }

  .drawer-switch.animal-switch {
    position: relative;
    min-width: 60px;
    height: 30px;
    border-color: var(--animal-border-color, #aaa69d);
    background: var(--animal-bg-color-secondary, #f0e8d8);
  }

  .drawer-switch.animal-switch::after {
    position: absolute;
    top: 50%;
    right: 8px;
    color: var(--settings-drawer-muted);
    content: '关';
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
    transform: translateY(-50%);
  }

  .drawer-switch.animal-switch--checked {
    background: var(--settings-drawer-primary);
    border-color: var(--settings-drawer-primary);
    box-shadow: inset 0 1px 3px rgba(61, 52, 40, 0.16);
  }

  .drawer-switch.animal-switch--checked::after {
    right: auto;
    left: 8px;
    color: #153b36;
    content: '开';
  }

  .drawer-switch .animal-switch__handle {
    background: var(--animal-bg-color-input, #fffbe7);
    border-color: var(--animal-border-color, #aaa69d);
    box-shadow: 0 1px 2px rgba(61, 52, 40, 0.18);
    z-index: 2;
  }

  .drawer-switch.animal-switch--checked .animal-switch__handle {
    border-color: var(--settings-drawer-primary);
  }

  .animal-btn {
    font-family: inherit;
  }

  .animal-btn--default,
  .animal-btn--dashed {
    color: var(--settings-drawer-text) !important;
    background: var(--animal-bg-color-input, #fffbe7) !important;
    border-color: var(--animal-border-color, #aaa69d) !important;
  }

  .animal-btn--default:hover:not(:disabled),
  .animal-btn--dashed:hover:not(:disabled) {
    color: var(--settings-drawer-primary) !important;
    background: var(--settings-drawer-hover) !important;
    border-color: var(--settings-drawer-primary) !important;
  }

  .animal-btn--primary {
    color: #153b36 !important;
    background: var(--settings-drawer-primary) !important;
    border-color: var(--settings-drawer-primary) !important;
  }

  .animal-btn--primary:hover:not(:disabled) {
    background: var(--settings-drawer-primary-hover) !important;
    border-color: var(--settings-drawer-primary-hover) !important;
  }

  .el-color-picker__trigger {
    border-color: var(--settings-drawer-border);
    background: var(--animal-bg-color-input, #fffbe7);
  }

  .el-slider__runway {
    background: var(--settings-drawer-border);
  }

  .el-slider__bar {
    background: var(--settings-drawer-primary);
  }

  .el-slider__button {
    border-color: var(--settings-drawer-primary);
    background: var(--settings-drawer-bg);
  }
}

html[data-ui-theme='animal'][data-color-mode='dark'] .settings-drawer,
html[data-ui-theme='animal'][data-color-mode='dark'] [data-animal-drawer-portal] {
  --settings-drawer-bg: #2b3a39;
  --settings-drawer-surface: #344a46;
  --settings-drawer-border: #526b65;
  --settings-drawer-text: #f5ead1;
  --settings-drawer-muted: #b9c9bd;
  --settings-drawer-hover: #405650;
  --settings-drawer-primary: #19c8b9;
  --settings-drawer-primary-hover: #3dd4c6;

  .animal-drawer__panel,
  .animal-drawer__body {
    background: var(--settings-drawer-bg) !important;
    color: var(--settings-drawer-text) !important;
  }

  .animal-drawer__panel {
    border-left-color: var(--settings-drawer-border);
    box-shadow: -12px 0 32px rgba(0, 0, 0, 0.38);
  }

  .drawer-title {
    color: var(--settings-drawer-text);
  }

  .nav-wrap .item,
  .work-mode-card,
  .display-mode-card {
    border-color: var(--settings-drawer-border);
    background: var(--settings-drawer-surface);
    color: var(--settings-drawer-text);
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.24);
  }

  .nav-wrap .item:hover,
  .work-mode-card:hover,
  .display-mode-card:hover {
    border-color: var(--settings-drawer-primary-hover);
    background: var(--settings-drawer-hover);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .nav-wrap .item.activeItem,
  .work-mode-card.activeItem,
  .display-mode-card.activeItem {
    border-color: var(--settings-drawer-primary);
    background: rgba(25, 200, 185, 0.16);
    box-shadow: 0 0 0 3px rgba(25, 200, 185, 0.24);
  }

  .nav-wrap .item .item-preview,
  .display-mode-card .item-preview,
  .work-mode-preview {
    background: #263a38;
    border-color: #78918a;
  }

  .nav-wrap .item b {
    background: #f5ead1;
  }

  .nav-wrap .item .item-label,
  .display-mode-card .item-label,
  .work-mode-copy strong {
    color: var(--settings-drawer-text);
  }

  .work-mode-copy small {
    color: var(--settings-drawer-muted);
  }

  .work-mode-preview-top {
    background: #f5ead1;
    box-shadow: 0 6px 0 #f5ead1;
  }

  .work-mode-preview-side {
    background: #1f2c2d;
  }

  .work-mode-preview-card {
    background: #405650;
    box-shadow: 0 5px 0 #526b65;
  }

  .work-mode-card.tone-island .work-mode-preview {
    background: #29433f;
  }

  .work-mode-card.tone-island .work-mode-preview-top {
    background: #f5ead1;
    box-shadow: none;
  }

  .work-mode-card.tone-island .work-mode-preview-side {
    background: #75c9bb;
  }

  .work-mode-card.tone-island .work-mode-preview-card {
    background: #405650;
    box-shadow: 0 3px 0 #78918a;
  }

  .check-badge {
    color: #153b36;
    background: var(--settings-drawer-primary);
    box-shadow: 0 0 0 2px var(--settings-drawer-bg);
  }

  .drawer-item {
    color: var(--settings-drawer-text);
    border-bottom-color: var(--settings-drawer-border);
  }

  .drawer-switch.animal-switch {
    border-color: #78918a;
    background: #263a38;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.28);
  }

  .drawer-switch.animal-switch--checked {
    background: var(--settings-drawer-primary);
    border-color: var(--settings-drawer-primary);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .drawer-switch .animal-switch__handle {
    background: #f5ead1;
    border-color: #78918a;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.34);
  }

  .animal-btn--default,
  .animal-btn--dashed {
    color: var(--settings-drawer-text) !important;
    background: #263a38 !important;
    border-color: #78918a !important;
  }

  .animal-btn--default:hover:not(:disabled),
  .animal-btn--dashed:hover:not(:disabled) {
    color: var(--settings-drawer-primary) !important;
    background: var(--settings-drawer-hover) !important;
    border-color: var(--settings-drawer-primary) !important;
  }

  .animal-btn--primary {
    color: #153b36 !important;
    background: var(--settings-drawer-primary) !important;
    border-color: var(--settings-drawer-primary) !important;
  }

  .el-color-picker__trigger {
    border-color: var(--settings-drawer-border);
    background: #263a38;
  }

  .el-slider__runway {
    background: var(--settings-drawer-border);
  }

  .el-slider__bar {
    background: var(--settings-drawer-primary);
  }

  .el-slider__button {
    border-color: var(--settings-drawer-primary);
    background: var(--settings-drawer-bg);
  }

  .ui-theme-preview {
    border-color: var(--settings-drawer-border);
    background: var(--settings-drawer-surface);
  }
}
</style>
