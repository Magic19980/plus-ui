<template>
  <div class="sidebar-shell" :class="{ 'has-logo': showLogo }" :style="menuStyle">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar :class="sideTheme" wrap-class="scrollbar-wrapper">
      <transition :enter-active-class="animateConfig.menuSearchAnimate.enter" mode="out-in">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :unique-opened="true"
          :collapse-transition="true"
          :popper-offset="12"
          mode="vertical"
          class="sidebar-menu"
        >
          <sidebar-item
            v-for="(r, index) in sidebarRouters"
            :key="r.path + index"
            :item="r"
            :base-path="r.path"
            :badge-map="menuBadges"
          />
        </el-menu>
      </transition>
    </el-scrollbar>
    <div class="sidebar-footer" :class="{ collapse: isCollapse }">
      <span class="sidebar-footer-status" />
      <span v-if="!isCollapse" class="sidebar-footer-label">TEI WORKSPACE</span>
      <span v-if="!isCollapse" class="sidebar-footer-badge">BETA</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouteRecordRaw } from 'vue-router';
import animateConfig from '@/animate';
import { listMyDepartmentTasks, listMyScoreProposalReviewTasks } from '@/api/department/task';
import { useAppStore } from '@/store/modules/app';
import { usePermissionStore } from '@/store/modules/permission';
import { useSettingsStore } from '@/store/modules/settings';
import Logo from './Logo.vue';
import SidebarItem from './SidebarItem.vue';

const route = useRoute();
const appStore = useAppStore();
const settingsStore = useSettingsStore();
const permissionStore = usePermissionStore();
const sidebarRouters = computed<RouteRecordRaw[]>(() => permissionStore.getSidebarRoutes());
const showLogo = computed(() => settingsStore.sidebarLogo);
const sideTheme = computed(() => settingsStore.sideTheme);
const theme = computed(() => settingsStore.theme);
const isCollapse = computed(() => !appStore.sidebar.opened);
const menuBadges = ref<Record<string, number>>({});

const terminalTaskStatuses = new Set(['COMPLETED', 'DONE', 'FINISHED', 'CANCELLED', 'REJECTED', 'APPROVED']);
const isPendingTask = (status?: string) => !terminalTaskStatuses.has(String(status || '').toUpperCase());

const loadMenuBadges = async () => {
  try {
    const [taskResult, reviewResult] = await Promise.all([listMyDepartmentTasks(), listMyScoreProposalReviewTasks()]);
    const tasks = taskResult.data || [];
    const reviewTasks = reviewResult.data || [];
    const pendingTaskCount = tasks.filter(item => isPendingTask(item.status)).length;
    const pendingReviewCount = reviewTasks.filter(item => isPendingTask(item.status)).length;
    menuBadges.value = {
      '/department/task': pendingTaskCount + pendingReviewCount,
      '/department/scoreProposal': pendingReviewCount
    };
  } catch {
    // 导航不应因为任务接口暂时不可用而影响页面加载。
    menuBadges.value = {};
  }
};

const activeMenu = computed(() => {
  const { meta, path } = route;
  // if set path, the sidebar will highlight the path you set
  if (meta.activeMenu) {
    return meta.activeMenu;
  }
  return path;
});

const bgColor = computed(() => (sideTheme.value === 'theme-dark' ? '#111827' : '#ffffff'));
const textColor = computed(() => (sideTheme.value === 'theme-dark' ? '#e5edf8' : '#1f2937'));
const sidebarBackground = computed(() =>
  sideTheme.value === 'theme-dark'
    // 侧栏主题必须使用自身的背景 token，不能复用页面的 app-sidebar-bg。
    // 否则浅色页面 + 暗色菜单时会出现浅色背景配浅色文字的低对比度问题。
    ? 'linear-gradient(160deg, var(--app-sidebar-dark-bg) 0%, color-mix(in srgb, var(--app-sidebar-dark-bg) 82%, #030712) 62%, var(--app-shell-bg) 100%)'
    : 'linear-gradient(160deg, var(--app-sidebar-light-bg) 0%, color-mix(in srgb, var(--app-sidebar-light-bg) 70%, #ffffff) 58%, var(--app-shell-bg) 100%)'
);
const menuStyle = computed(() => ({
  backgroundColor: bgColor.value,
  '--el-menu-bg-color': bgColor.value,
  '--el-menu-text-color': textColor.value,
  '--el-menu-active-color': theme.value,
  '--sidebar-bg': sidebarBackground.value,
  '--sidebar-muted': sideTheme.value === 'theme-dark' ? '#94a3b8' : '#64748b'
}));

onMounted(loadMenuBadges);
</script>

<style lang="scss" scoped>
.sidebar-shell {
  position: relative;
  isolation: isolate;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 8px 9px;
  border: 1px solid var(--app-sidebar-border);
  border-radius: 20px;
  box-shadow:
    0 14px 34px rgba(2, 6, 23, 0.14),
    0 3px 8px rgba(2, 6, 23, 0.06);
  background: var(--sidebar-bg) !important;
  overflow: hidden;

  &::before {
    position: absolute;
    top: -80px;
    right: -70px;
    width: 190px;
    height: 190px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--app-accent-strong) 12%, transparent);
    content: '';
    opacity: 0.42;
    pointer-events: none;
  }

  &::after {
    display: none;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  margin: 2px 2px 0;
  padding: 0 9px;
  border: 1px solid var(--sidebar-footer-border, rgba(148, 163, 184, 0.2));
  border-radius: 12px;
  background: var(--sidebar-footer-bg, rgba(255, 255, 255, 0.72));
  color: var(--sidebar-footer-text, #64748b);
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: var(--sidebar-footer-hover-border, rgba(14, 165, 233, 0.34));
    background: var(--sidebar-footer-hover-bg, rgba(255, 255, 255, 0.92));
    color: var(--sidebar-footer-hover-text, #334155);
    transform: translateY(-1px);
  }

  &.collapse {
    justify-content: center;
    margin-right: 0;
    margin-left: 0;
    padding: 0;
    border-color: transparent;
    background: transparent;
  }
}

.sidebar-footer-status {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: var(--sidebar-footer-status, #14b8a6);
  box-shadow: 0 0 0 3px var(--sidebar-footer-status-ring, rgba(20, 184, 166, 0.12));
}

.sidebar-footer-label {
  overflow: hidden;
  flex: 1;
  color: currentColor;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-footer-badge {
  padding: 3px 5px;
  border: 1px solid var(--sidebar-footer-badge-border, rgba(14, 165, 233, 0.2));
  border-radius: 4px;
  color: var(--sidebar-footer-badge-text, #0ea5e9);
  background: var(--sidebar-footer-badge-bg, rgba(14, 165, 233, 0.08));
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
}

:deep(.el-scrollbar__view) {
  min-height: 0;
  padding: 0 0 16px;
}

:deep(.el-scrollbar) {
  flex: 1;
  min-height: 0;
  height: auto !important;
}

:deep(.el-scrollbar__wrap) {
  height: 100%;
  overflow-x: hidden;
}

:deep(.el-scrollbar__bar.is-vertical) {
  right: -2px;
  width: 4px;
}

:deep(.el-scrollbar__bar.is-horizontal) {
  // 侧栏只允许纵向滚动，禁止横向滚动条在底部生成一条异常色带。
  display: none;
}

:deep(.el-scrollbar__thumb) {
  background-color: rgba(148, 163, 184, 0.32);
}
</style>
