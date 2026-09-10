<template>
  <el-drawer
    v-model="showSettings"
    class="settings-drawer"
    :with-header="false"
    direction="rtl"
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

    <h3 class="drawer-title">{{ t('common.settingThemeStyle') }}</h3>

    <div class="setting-drawer-block-checbox">
      <div
        class="setting-drawer-block-checbox-item"
        :style="{ '--theme': theme }"
        :class="{ activeItem: sideTheme === SideThemeEnum.DARK }"
        @click="handleTheme(SideThemeEnum.DARK)"
      >
        <span class="item-preview"><img src="@/assets/images/dark.svg" alt="dark" /></span>
        <span class="item-label">{{ t('common.settingDarkMode') }}</span>
        <span v-if="sideTheme === SideThemeEnum.DARK" class="check-badge">
          <el-icon><Check /></el-icon>
        </span>
      </div>

      <div
        class="setting-drawer-block-checbox-item"
        :style="{ '--theme': theme }"
        :class="{ activeItem: sideTheme === SideThemeEnum.LIGHT }"
        @click="handleTheme(SideThemeEnum.LIGHT)"
      >
        <span class="item-preview"><img src="@/assets/images/light.svg" alt="light" /></span>
        <span class="item-label">{{ t('common.settingLightMode') }}</span>
        <span v-if="sideTheme === SideThemeEnum.LIGHT" class="check-badge">
          <el-icon><Check /></el-icon>
        </span>
      </div>
    </div>
    <div class="drawer-item">
      <span>{{ t('common.settingThemeColor') }}</span>
      <span class="comp-style">
        <el-color-picker v-model="theme" :predefine="predefineColors" @change="themeChange" />
      </span>
    </div>
    <div class="drawer-item">
      <span>{{ t('common.settingDarkMode') }}</span>
      <span class="comp-style">
        <el-switch v-model="isDark" class="drawer-switch" />
      </span>
    </div>
    <div class="drawer-item">
      <span>{{ t('common.settingPageRadius') }}</span>
      <span class="comp-style">
        <el-slider v-model="radiusBase" :min="0" :max="32" :step="2" style="width: 120px" @change="radiusBaseChange" />
      </span>
    </div>

    <el-divider />

    <h3 class="drawer-title">{{ t('common.settingLayoutConfig') }}</h3>

    <div class="drawer-item">
      <span>{{ t('common.settingEnableTagsView') }}</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingPersistTagsView') }}</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsViewPersist" :disabled="!settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingShowTagsIcon') }}</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.tagsIcon" :disabled="!settingsStore.tagsView" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingFixedHeader') }}</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.fixedHeader" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingShowLogo') }}</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.sidebarLogo" class="drawer-switch" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingDynamicTitle') }}</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.dynamicTitle" class="drawer-switch" @change="dynamicTitleChange" />
      </span>
    </div>

    <div class="drawer-item">
      <span>{{ t('common.settingFullHeightTable') }}</span>
      <span class="comp-style">
        <el-switch v-model="settingsStore.fullHeightTable" class="drawer-switch" />
      </span>
    </div>

    <el-divider />

    <el-button type="primary" plain icon="DocumentAdd" @click="saveSetting">{{ t('common.settingSaveConfig') }}</el-button>
    <el-button plain icon="Refresh" @click="resetSetting">{{ t('common.settingResetConfig') }}</el-button>
  </el-drawer>
</template>

<script setup lang="ts">
import { Check } from '@element-plus/icons-vue';
import { NavTypeEnum } from '@/enums/NavTypeEnum';
import { SideThemeEnum } from '@/enums/SideThemeEnum';
import modal from '@/plugins/modal';
import defaultSettings from '@/settings';
import { useAppStore } from '@/store/modules/app';
import { usePermissionStore } from '@/store/modules/permission';
import { useSettingsStore } from '@/store/modules/settings';
import { useDynamicTitle } from '@/utils/dynamicTitle';
import { handleThemeStyle } from '@/utils/theme';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const appStore = useAppStore();
const settingsStore = useSettingsStore();
const permissionStore = usePermissionStore();

const showSettings = ref(false);
const theme = ref(settingsStore.theme);
const sideTheme = ref(settingsStore.sideTheme);
const storeSettings = computed(() => settingsStore);
const predefineColors = ref(['#0EA5E9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#84cc16']);
const navType = ref(settingsStore.navType);
const radiusBase = ref(settingsStore.radiusBase);
// 是否暗黑模式
const isDark = useDark({
  storageKey: 'useDarkKey',
  valueDark: 'dark',
  valueLight: 'light'
});
// 页面主题切换时同步布局状态，避免浅色页面残留暗色菜单导致文字与背景对比度不足。
watch(
  isDark,
  value => {
    settingsStore.dark = value;

    const html = document.documentElement;
    html.classList.add('dark-transitioning');
    setTimeout(() => html.classList.remove('dark-transitioning'), 400);

    // 暗色页面固定使用暗色菜单；关闭暗色模式后恢复为浅色菜单，保证整套导航视觉一致。
    const nextSideTheme = value ? SideThemeEnum.DARK : SideThemeEnum.LIGHT;
    sideTheme.value = nextSideTheme;
    settingsStore.sideTheme = nextSideTheme;
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
  handleThemeStyle(val);
};
const radiusBaseChange = (val: number) => {
  settingsStore.radiusBase = val;
  // 更新 CSS 变量
  document.documentElement.style.setProperty('--app-radius-base', `${val}px`);
};
const handleTheme = (val: string) => {
  if (isDark.value && val === SideThemeEnum.LIGHT) {
    // 暗黑模式颜色不变
    return;
  }
  sideTheme.value = val;
  settingsStore.sideTheme = val;
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
  :deep(.el-drawer__body) {
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
