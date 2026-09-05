<template>
  <div class="navbar" :class="'nav' + navType">
    <div class="navbar-left">
      <div v-if="navType !== NavTypeEnum.TOP" class="hamburger-shell">
        <hamburger
          id="hamburger-container"
          :is-active="appStore.sidebar.opened"
          class="hamburger-container"
          @toggle-click="toggleSideBar"
        />
      </div>
      <router-link v-else-if="showLogo" to="/" class="navtop-logo-shell">
        <img :src="appLogo" class="navtop-logo-icon" :class="{ 'dark-glow': isDarkTheme }" alt="TEI" />
      </router-link>

      <div class="nav-context">
        <breadcrumb v-if="navType == NavTypeEnum.LEFT" id="breadcrumb-container" class="breadcrumb-container" />
        <top-nav v-if="navType == NavTypeEnum.MIX" id="topmenu-container" class="topmenu-container" />

        <template v-if="navType == NavTypeEnum.TOP">
          <top-bar id="topbar-container" class="topbar-container" />
        </template>
      </div>
    </div>
    <div class="right-menu flex align-center">
      <template v-if="appStore.device !== 'mobile'">
        <search-menu ref="searchMenuRef" />
        <el-tooltip :content="$t('navbar.search')" effect="dark" placement="bottom">
          <div class="right-menu-item hover-effect" @click="openSearchMenu">
            <svg-icon class-name="search-icon" icon-class="search" />
          </div>
        </el-tooltip>
        <!-- 消息 -->
        <el-tooltip :content="$t('navbar.message')" effect="dark" placement="bottom">
          <div>
            <el-popover placement="bottom" trigger="click" transition="el-zoom-in-top" :width="300" :persistent="false">
              <template #reference>
                <el-badge :value="noticeStore.unreadCount.value > 0 ? noticeStore.unreadCount.value : ''" :max="99">
                  <div class="right-menu-item hover-effect message-trigger">
                    <svg-icon icon-class="message" />
                  </div>
                </el-badge>
              </template>
              <template #default>
                <notice></notice>
              </template>
            </el-popover>
          </div>
        </el-tooltip>
        <el-tooltip :content="$t('navbar.full')" effect="dark" placement="bottom">
          <screenfull id="screenfull" class="right-menu-item hover-effect" />
        </el-tooltip>

        <el-tooltip :content="$t('navbar.language')" effect="dark" placement="bottom">
          <lang-select id="lang-select" class="right-menu-item hover-effect" />
        </el-tooltip>

        <el-tooltip :content="$t('navbar.layoutSize')" effect="dark" placement="bottom">
          <size-select id="size-select" class="right-menu-item hover-effect" />
        </el-tooltip>
      </template>
      <div v-if="departmentContexts.length" class="department-context-container">
        <el-dropdown
          v-if="departmentContexts.length > 1"
          class="department-context-dropdown"
          trigger="click"
          placement="bottom-end"
          popper-class="department-context-popper"
          :teleported="true"
          @command="handleDepartmentCommand"
        >
          <div class="department-context-wrapper">
            <span class="department-context-label">当前科室</span>
            <span class="department-context-name">{{ currentDepartmentName }}</span>
            <el-icon class="department-context-arrow"><caret-bottom /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="department in departmentContexts"
                :key="department.deptId"
                :command="String(department.deptId)"
                :disabled="department.current"
              >
                <span class="department-context-option-name">{{ department.deptName }}</span>
                <el-tag v-if="department.memberType === 'TEMP'" size="small" type="warning" class="department-context-tag">
                  临时协作
                </el-tag>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <div v-else class="department-context-wrapper department-context-static">
          <span class="department-context-label">当前科室</span>
          <span class="department-context-name">{{ currentDepartmentName }}</span>
        </div>
      </div>
      <div class="avatar-container">
        <el-dropdown class="avatar-dropdown" trigger="click" @command="handleCommand">
          <div class="avatar-wrapper">
            <img :src="userStore.avatar" class="user-avatar" @error="handleAvatarError" />
            <div class="avatar-meta">
              <span class="avatar-name">{{ displayName }}</span>
              <span class="avatar-role">Workspace</span>
            </div>
            <el-icon class="avatar-arrow"><caret-bottom /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <router-link to="/user/profile">
                <el-dropdown-item>{{ $t('navbar.personalCenter') }}</el-dropdown-item>
              </router-link>
              <el-dropdown-item v-if="settingsStore.showSettings" command="setLayout">
                <span>{{ $t('navbar.layoutSetting') }}</span>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <span>{{ $t('navbar.logout') }}</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ElMessageBoxOptions } from 'element-plus';
import { CaretBottom } from '@element-plus/icons-vue';
import appLogo from '@/assets/logo/tei-logo.svg';
import defAva from '@/assets/images/profile.jpg';
import { NavTypeEnum } from '@/enums/NavTypeEnum';
import tab from '@/plugins/tab';
import router from '@/router';
import { useAppStore } from '@/store/modules/app';
import { useDepartmentStore } from '@/store/modules/department';
import { useNoticeStore } from '@/store/modules/notice';
import { useSettingsStore } from '@/store/modules/settings';
import { useUserStore } from '@/store/modules/user';
import notice from './notice/index.vue';
import TopBar from './TopBar/index.vue';
import SearchMenu from './TopBar/search.vue';

const appStore = useAppStore();
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const noticeStore = storeToRefs(useNoticeStore());
const departmentStore = useDepartmentStore();

const navType = computed(() => settingsStore.navType);
const showLogo = computed(() => settingsStore.sidebarLogo);
const isDarkTheme = computed(
  () => settingsStore.dark || (navType.value !== NavTypeEnum.TOP && settingsStore.sideTheme === 'theme-dark')
);
const displayName = computed(() => userStore.nickname || '管理员');
const departmentContexts = computed(() => departmentStore.contexts);
const currentDepartmentName = computed(() => departmentStore.currentDepartmentName);

const handleAvatarError = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  userStore.setAvatar(defAva);
};

const loadDepartmentContexts = async () => {
  try {
    await departmentStore.load();
  } catch {
    departmentStore.clear();
  }
};

const handleDepartmentCommand = async (command: string) => {
  const target = departmentContexts.value.find(item => String(item.deptId) === command);
  if (!target || target.current) return;
  await departmentStore.switchDepartment(target.deptId);
  ElMessage.success(`已切换到${target.deptName}`);
};

// 搜索菜单
const searchMenuRef = ref<InstanceType<typeof SearchMenu>>();

const openSearchMenu = () => {
  searchMenuRef.value?.openSearch();
};

const toggleSideBar = () => {
  appStore.toggleSideBar(false);
};

const logout = async () => {
  await ElMessageBox.confirm('确定注销并退出系统吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  } as ElMessageBoxOptions);
  departmentStore.clear();
  userStore.logout().then(() => {
    router.replace({
      path: '/login',
      query: {
        redirect: encodeURIComponent(router.currentRoute.value.fullPath || '/')
      }
    });
    tab.closeAllPage();
  });
};

const emits = defineEmits(['setLayout']);
const setLayout = () => {
  emits('setLayout');
};
// 定义Command方法对象 通过key直接调用方法
const commandMap: { [key: string]: any } = {
  setLayout,
  logout
};
const handleCommand = (command: string) => {
  // 判断是否存在该方法
  if (commandMap[command]) {
    commandMap[command]();
  }
};

onMounted(loadDepartmentContexts);
</script>

<style lang="scss" scoped>
.navbar.navtop {
  .nav-context {
    flex: 1;
  }

  .navtop-logo-shell {
    width: 48px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    flex-shrink: 0;
    border-radius: 14px;
    border: 1px solid var(--app-surface-border);
    background: var(--app-surface-bg);
    box-shadow: var(--app-shadow-sm);
    transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      border-color: rgba(14, 165, 233, 0.22);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.76),
        0 10px 22px rgba(15, 23, 42, 0.08);
    }
  }

  .navtop-logo-icon {
    width: 32px;
    height: 32px;
    display: block;
    border-radius: 11px;

    &.dark-glow {
      animation: tei-nav-logo-breathe 3.2s ease-in-out infinite;
    }
  }

  .topbar-container {
    flex: 1;
    min-width: 0;
    margin-left: 0;
    padding: 4px 8px;
    border-radius: var(--app-radius-base);
    background: var(--app-surface-bg);
    border: 1px solid var(--app-surface-border);
    box-shadow: var(--app-shadow-sm);
  }
}

@keyframes tei-nav-logo-breathe {
  0%,
  100% {
    filter: drop-shadow(0 0 1px rgba(45, 212, 191, 0.14)) drop-shadow(0 0 2px rgba(59, 130, 246, 0.08));
  }

  50% {
    filter: drop-shadow(0 0 5px rgba(45, 212, 191, 0.84)) drop-shadow(0 0 13px rgba(59, 130, 246, 0.52));
  }
}

@media (prefers-reduced-motion: reduce) {
  .navbar.navtop .navtop-logo-icon.dark-glow {
    animation: none;
    filter: drop-shadow(0 0 4px rgba(45, 212, 191, 0.48));
  }
}

:deep(.el-select .el-input__wrapper) {
  height: 30px;
}

:deep(.el-badge__content.is-fixed) {
  top: 8px;
  right: 6px;
}

:deep(.el-badge) {
  display: inline-flex;
  align-items: center;
}

:deep(.el-dropdown) {
  outline: none;
}

.flex {
  display: flex;
}

.align-center {
  align-items: center;
}

.navbar {
  min-height: 54px;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbfe 100%);
  border: 1px solid #e3ebf4;
  box-shadow: 0 8px 22px rgba(38, 71, 105, 0.075), inset 0 1px 0 rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 17px;
  padding: 7px 14px;
  box-sizing: border-box;

  &::before {
    position: absolute;
    top: 0;
    right: 18%;
    left: 18%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(83, 166, 228, 0.32), transparent);
    content: '';
    pointer-events: none;
  }

  .navbar-left {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 12px;
    flex: 1;
  }

  .hamburger-shell {
    width: 38px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    background: #f4f8fc;
    color: var(--app-accent-strong);
    flex-shrink: 0;
    border: 1px solid #e2ebf4;
    box-shadow: inset 0 1px 0 #fff;
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      background: #edf6ff;
      border-color: #cfe5f8;
      transform: translateY(-1px);
    }
  }

  .hamburger-container {
    line-height: 32px;
    height: 100%;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    justify-content: center;

    &:hover {
      background: transparent;
    }
  }

  .nav-context {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0;
  }

  .breadcrumb-container {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid #edf2f7;
    border-radius: 11px;
    background: #f7f9fc;
  }

  .topmenu-container {
    position: static;
    min-width: 0;
  }

  .topbar-container {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    margin-left: 8px;
  }

  .right-menu {
    height: 100%;
    line-height: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    flex-wrap: nowrap;

    &:focus {
      outline: none;
    }

    > * {
      flex-shrink: 0;
    }

    .right-menu-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      font-size: 16px;
      color: var(--app-text-muted);
      border-radius: 10px;
      vertical-align: text-bottom;
      background: #f7f9fc;
      border: 1px solid #edf2f7;
      flex-shrink: 0;

      :deep(.svg-icon),
      :deep(svg),
      :deep(.el-icon) {
        width: 16px;
        height: 16px;
        font-size: 16px;
        display: block;
      }

      &.hover-effect {
        cursor: pointer;
        transition:
          background 0.3s,
          color 0.3s;

        &:hover {
          background: #edf6ff;
          color: var(--app-accent-strong);
          border-color: #cfe5f8;
          box-shadow: 0 4px 10px rgba(49, 128, 190, 0.1);
          transform: translateY(-1px);
        }
      }
    }

    .message-trigger {
      display: inline-flex;
    }

    .avatar-container {
      margin-left: 8px;
      margin-right: 0;
      flex-shrink: 0;
      padding-left: 10px;
      border-left: 1px solid #e8eef5;

      .avatar-dropdown {
        display: block;
        width: auto;
        height: auto;
        border: none;
        background: transparent;
      }

      .avatar-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 10px 4px 5px;
        border-radius: 13px;
        background: #f8fafc;
        border: 1px solid #e7eef5;
        min-width: 0;
        cursor: pointer;
        transition:
          background 0.3s,
          border-color 0.3s;

        &:hover {
          background: #edf6ff;
          border-color: #cfe5f8;
          box-shadow: 0 4px 12px rgba(49, 128, 190, 0.08);
        }

        .user-avatar {
          cursor: pointer;
          width: 28px;
          height: 28px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: none;
        }

        .avatar-meta {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 2px;
        }

        .avatar-name {
          max-width: 88px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--app-text-title);
          font-size: 12px;
          font-weight: 600;
        }

        .avatar-role {
          color: var(--app-text-muted);
          font-size: 11px;
        }

        .avatar-arrow {
          color: var(--app-text-muted);
          font-size: 12px;
          flex-shrink: 0;
        }
      }
    }

    .department-context-container {
      margin-left: 4px;
      flex-shrink: 0;

      .department-context-dropdown {
        display: block;
      }

      .department-context-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
        max-width: 180px;
        min-height: 30px;
        padding: 3px 9px;
        border: 1px solid var(--app-surface-border);
        border-radius: 10px;
        background: var(--app-surface-bg);
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease;

        &:hover {
          background: var(--app-accent-soft);
          border-color: rgba(14, 165, 233, 0.18);
        }
      }

      .department-context-static {
        cursor: default;

        &:hover {
          background: var(--app-surface-bg);
          border-color: var(--app-surface-border);
        }
      }

      .department-context-label {
        color: var(--app-text-muted);
        font-size: 11px;
        white-space: nowrap;
      }

      .department-context-name {
        max-width: 92px;
        overflow: hidden;
        color: var(--app-text-title);
        font-size: 12px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .department-context-arrow {
        color: var(--app-text-muted);
        font-size: 11px;
      }

      .department-context-tag {
        margin-left: 8px;
      }
    }
  }
}

:global(.department-context-popper.el-dropdown__popper) {
  z-index: 3000 !important;
  min-width: 190px;
  max-width: 280px;
}

:global(.department-context-popper .el-dropdown-menu) {
  width: 100%;
  box-sizing: border-box;
}

:global(.department-context-popper .el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  white-space: nowrap;
}

:global(.department-context-option-name) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 深色主题覆盖放在非 scoped 样式中，确保 html.dark 能命中组件节点。 */
</style>

<style lang="scss">
html.dark {
  .navbar {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.92) 100%);
    border-color: rgba(71, 85, 105, 0.48);
    box-shadow:
      0 8px 22px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);

    &::before {
      background: linear-gradient(90deg, transparent, rgba(103, 190, 239, 0.46), transparent);
    }

    .hamburger-shell,
    .breadcrumb-container,
    .right-menu .right-menu-item,
    .avatar-wrapper {
      background: rgba(30, 41, 59, 0.76);
      border-color: rgba(71, 85, 105, 0.48);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .hamburger-shell:hover,
    .right-menu .right-menu-item:hover,
    .avatar-wrapper:hover {
      background: rgba(51, 65, 85, 0.9);
      border-color: rgba(103, 190, 239, 0.5);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    }

    .avatar-container {
      border-left-color: rgba(71, 85, 105, 0.48);
    }
  }

  .navbar.navtop .navtop-logo-shell {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.82));
    border-color: rgba(71, 85, 105, 0.42);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 8px 18px rgba(0, 0, 0, 0.24);
  }

  .navbar.navtop .topbar-container {
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.7));
    border-color: rgba(71, 85, 105, 0.34);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 8px 22px rgba(0, 0, 0, 0.2);
  }

  .navbar .right-menu .right-menu-item,
  .navbar .right-menu .avatar-wrapper {
    background: var(--app-navbar-bg);
    border-color: var(--app-navbar-border);
  }

  /* Navbar.vue 的基础头像样式为 scoped，使用更高优先级确保深色覆盖生效。 */
  #app .navbar .right-menu .avatar-container {
    border-left-color: var(--app-navbar-border) !important;
  }

  #app .navbar .right-menu .avatar-container .avatar-wrapper {
    background: var(--app-elevated-soft-bg) !important;
    border-color: var(--app-navbar-border) !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
  }

  #app .navbar .right-menu .avatar-container .avatar-wrapper:hover {
    background: var(--app-elevated-close-bg) !important;
    border-color: color-mix(in srgb, var(--el-color-primary) 55%, var(--app-navbar-border)) !important;
    box-shadow: var(--app-shadow-sm) !important;
  }

  #app .navbar .right-menu .avatar-container .avatar-name,
  #app .navbar .right-menu .avatar-container .avatar-role,
  #app .navbar .right-menu .avatar-container .avatar-arrow {
    color: var(--app-text-title) !important;
  }

  #app .navbar .right-menu .avatar-container .avatar-role,
  #app .navbar .right-menu .avatar-container .avatar-arrow {
    color: var(--app-text-muted) !important;
  }
}
</style>
