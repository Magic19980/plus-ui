<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition :enter-active-class="animate" mode="out-in">
        <keep-alive :include="tagsViewStore.cachedViews">
          <component :is="Component" v-if="!route.meta.link" :key="`${route.path}:${departmentStore.switchRevision}`" />
        </keep-alive>
      </transition>
    </router-view>
    <iframe-toggle />
  </section>
</template>

<script setup name="AppMain" lang="ts">
import animateConfig from '@/animate';
import { useFullHeightTable } from '@/hooks/table/useFullHeightTable';
import { useDepartmentStore } from '@/store/modules/department';
import { useSettingsStore } from '@/store/modules/settings';
import { useTagsViewStore } from '@/store/modules/tagsView';
import IframeToggle from './IframeToggle/index.vue';

const route = useRoute();
const tagsViewStore = useTagsViewStore();
const departmentStore = useDepartmentStore();
useFullHeightTable();

// 随机动画集合
const animate = ref<string>('');
watch(
  () => useSettingsStore().animationEnable,
  (val: boolean) => {
    if (val) {
      animate.value = animateConfig.animateList[Math.floor(Math.random() * animateConfig.animateList.length)] as string;
    } else {
      animate.value = animateConfig.defaultAnimate as string;
    }
  },
  { immediate: true }
);

watchEffect(() => {
  addIframe();
});

function addIframe() {
  if (route.meta.link) {
    useTagsViewStore().addIframeView(route);
  }
}
</script>

<style lang="scss" scoped>
.app-main {
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: 12px;
  // 页面内容不足一屏时，底部留白仍使用统一画布色，避免露出另一层背景。
  background: var(--app-shell-bg);

  &:fullscreen,
  &:-webkit-full-screen,
  &:-moz-full-screen,
  &:-ms-fullscreen {
    background: var(--el-bg-color);
    overflow-y: auto;
  }
}

.app-main:not(.with-fixed-header) {
  min-height: calc(100vh - 64px);
}

.app-main.with-tags-view:not(.with-fixed-header) {
  min-height: calc(100vh - 105px);
}

.app-main.with-fixed-header {
  padding-top: 76px;
  min-height: calc(100vh - 76px);
}

.app-main.with-fixed-header.with-tags-view {
  min-height: calc(100vh - 111px);
  padding-top: 111px;
}
</style>
<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 6px;
  }
}
</style>
