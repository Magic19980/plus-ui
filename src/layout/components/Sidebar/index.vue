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
    ? 'linear-gradient(180deg, #111d31 0%, #0d1728 42%, #0b1423 100%)'
    : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 56%, #f2f6fa 100%)'
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
  gap: 10px;
  padding: 11px 9px 10px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  box-shadow:
    0 18px 42px rgba(2, 6, 23, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  background: var(--sidebar-bg) !important;
  overflow: hidden;

  &::before {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    height: 48%;
    background:
      radial-gradient(circle at 92% 0%, rgba(56, 189, 248, 0.14), transparent 36%),
      radial-gradient(circle at 3% 28%, rgba(99, 102, 241, 0.1), transparent 38%);
    content: '';
    opacity: 0.92;
    pointer-events: none;
  }

  &::after {
    position: absolute;
    top: 1px;
    right: 30px;
    left: 30px;
    height: 2px;
    border-radius: 0 0 4px 4px;
    background: linear-gradient(90deg, transparent, rgba(125, 211, 252, 0.55), transparent);
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.25);
    content: '';
    opacity: 0.72;
    pointer-events: none;
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
  margin: 0 3px;
  padding: 0 5px;
  border-top: 1px solid rgba(148, 163, 184, 0.13);
  background: transparent;
  color: rgba(148, 163, 184, 0.78);
  transition: color 0.2s ease;

  &:hover {
    color: rgba(226, 232, 240, 0.94);
  }

  &.collapse {
    justify-content: center;
    margin-right: 0;
    margin-left: 0;
    padding: 0;
    border-top-color: transparent;
    background: transparent;
  }
}

.sidebar-footer-status {
  width: 6px;
  height: 6px;
  flex: 0 0 6px;
  border-radius: 50%;
  background: #2dd4bf;
  box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.1);
}

.sidebar-footer-label {
  overflow: hidden;
  flex: 1;
  color: rgba(226, 232, 240, 0.72);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-footer-badge {
  padding: 3px 5px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 4px;
  color: #7dd3fc;
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

:deep(.el-scrollbar__thumb) {
  background-color: rgba(148, 163, 184, 0.32);
}
</style>
