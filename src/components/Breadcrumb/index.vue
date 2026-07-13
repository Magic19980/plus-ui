<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in levelList" :key="item.path">
        <span v-if="item.redirect === 'noRedirect' || index == levelList.length - 1" class="no-redirect">
          {{ te(item.meta?.title) ? t(item.meta?.title) : item.meta?.title }}
        </span>
        <a v-else @click.prevent="handleLink(item)">{{ t(item.meta?.title) }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import type { RouteMeta, RouteRecordRaw } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { usePermissionStore } from '@/store/modules/permission';

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const permissionStore = usePermissionStore();
const levelList = ref<{ path: string; meta: RouteMeta; redirect?: string }[]>([]);

/**
 * 关键修复：从 defaultRoutes（响应式）取 meta.title，
 * 而不是从 route.matched（不可触发响应式更新）取。
 * 这样切换语言时，后端返回的英文 title 能立即反映到面包屑。
 */
const getBreadcrumb = () => {
  // 仅取 defaultRoutes 中第一个匹配项（顶级菜单）的子链作为面包屑
  const pathNum = findPathNum(route.path);
  let matched: { path: string; meta: RouteMeta; redirect?: string }[] = [];
  if (pathNum > 2) {
    const reg = /\/\w+/gi;
    const pathList = route.path.match(reg).map((item: string, index: number) => {
      if (index !== 0) item = item.slice(1);
      return item;
    });
    const found = getMatched(pathList, permissionStore.defaultRoutes);
    matched = found.map(item => ({ path: item.path, meta: { ...item.meta } as RouteMeta, redirect: item.redirect as string | undefined }));
  } else {
    matched = route.matched
      .filter(item => item.meta && item.meta.title)
      .map(item => ({ path: item.path, meta: { ...item.meta } as RouteMeta, redirect: item.redirect as string | undefined }));
  }
  // 判断是否为首页
  if (!isDashboard(matched[0])) {
    matched = [{ path: '/index', meta: { title: 'route.dashboard' } as RouteMeta }].concat(matched);
  }
  // 从响应式 defaultRoutes 中同步对应菜单项的最新 meta.title
  matched = matched.map(item => {
    const latest = findMetaByPath(item.path, permissionStore.defaultRoutes);
    if (latest) {
      return { ...item, meta: { ...item.meta, ...latest } as RouteMeta };
    }
    return item;
  });
  levelList.value = matched.filter(item => item.meta && item.meta.title && item.meta.breadcrumb !== false);
};

const findMetaByPath = (targetPath: string, list: RouteRecordRaw[]): RouteMeta | null => {
  for (const item of list) {
    if (item.path === targetPath) {
      const meta = item.meta;
      if (meta) {
        return meta as RouteMeta;
      }
    }
    const children = item.children as RouteRecordRaw[] | undefined;
    if (children && children.length) {
      const found = findMetaByPath(targetPath, children);
      if (found) return found;
    }
  }
  return null;
};
const findPathNum = (str: string, char = '/'): number => {
  if (typeof str !== 'string' || str.length === 0) return 0;
  return str.split(char).length - 1;
};
const getMatched = (pathList: string[], routeList: RouteRecordRaw[]): RouteRecordRaw[] => {
  const matched: RouteRecordRaw[] = [];
  const find = (list: RouteRecordRaw[], pl: string[]) => {
    const data = list.find(item => item.path == pl[0] || (item.name as string)?.toLowerCase() == pl[0]);
    if (data) {
      matched.push(data);
      if (data.children && pl.length) {
        pl.shift();
        find(data.children, pl);
      }
    }
  };
  find(routeList, pathList);
  return matched;
};
const isDashboard = (matchedRoute?: { name?: string | symbol }) => {
  const name = matchedRoute && (matchedRoute.name as string);
  if (!name) {
    return false;
  }
  return name.trim() === 'Index';
};
const handleLink = (item: { redirect?: string; path: string }) => {
  const { redirect, path } = item;
  redirect ? router.push(redirect) : router.push(path);
};

// watchEffect 在 setup 阶段即同步执行，响应 route.path 和 defaultRoutes 变化
watchEffect(() => {
  if (route.path.startsWith('/redirect/')) return;
  // 显式访问 defaultRoutes（ref）以建立响应式依赖（语言切换时菜单刷新触发更新）
  permissionStore.defaultRoutes;
  getBreadcrumb();
});
</script>

<style lang="scss" scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 13px;
  line-height: 1.2;
  margin-left: 4px;
  color: var(--app-text-muted);

  :deep(.el-breadcrumb__inner) {
    color: inherit;
    font-weight: 500;
  }

  :deep(.el-breadcrumb__inner a) {
    color: var(--app-text-muted);
    font-weight: 500;
    transition: color 0.2s ease;

    &:hover {
      color: var(--app-accent-strong);
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }

  .no-redirect {
    color: var(--app-text-title);
    cursor: text;
  }
}
</style>
