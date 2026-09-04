<template>
  <div class="sidebar-logo-container" :class="{ collapse: collapse }">
    <transition :enter-active-class="animateConfig.logoAnimate.enter" mode="out-in">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img :src="logo" class="sidebar-logo" :class="{ 'dark-glow': isDarkTheme }" alt="TEI" />
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img :src="logo" class="sidebar-logo" :class="{ 'dark-glow': isDarkTheme }" alt="TEI" />
        <div class="sidebar-brand-copy">
          <h1 class="sidebar-title">{{ title }}</h1>
          <span class="sidebar-brand-caption">DEPARTMENT WORKSPACE</span>
        </div>
      </router-link>
    </transition>
  </div>
</template>

<script setup lang="ts">
import animateConfig from '@/animate';
import logo from '@/assets/logo/tei-logo.svg';
import { NavTypeEnum } from '@/enums/NavTypeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
});

const title = import.meta.env.VITE_APP_LOGO_TITLE;
const settingsStore = useSettingsStore();
const sideTheme = computed(() => settingsStore.sideTheme);
const isTopNav = computed(() => settingsStore.navType === NavTypeEnum.TOP);
const isDarkSide = computed(() => !isTopNav.value && sideTheme.value === 'theme-dark');
const isDarkTheme = computed(() => settingsStore.dark || isDarkSide.value);
const logoSurface = computed(() =>
  isDarkSide.value
    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.025))'
    : 'linear-gradient(135deg, #ffffff, #f3f7fb)'
);
const logoBorder = computed(() => (isDarkSide.value ? 'rgba(148, 163, 184, 0.16)' : 'rgba(148, 163, 184, 0.2)'));
const logoTextColor = computed(() => (isDarkSide.value ? '#f8fbff' : 'var(--app-text-title)'));
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  flex-shrink: 0;
  height: 56px;
  line-height: 56px;
  padding: 0 2px;
  margin-top: 0;
  background: transparent;
  text-align: center;
  overflow: hidden;
  margin-bottom: 0;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex !important;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
    border-radius: 15px;
    background: v-bind(logoSurface);
    border: 1px solid v-bind(logoBorder);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 8px 18px rgba(2, 6, 23, 0.14);
    overflow: hidden;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    &:hover {
      border-color: rgba(56, 189, 248, 0.38);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 10px 22px rgba(2, 6, 23, 0.18);
      transform: translateY(-1px);
    }

    & .sidebar-logo {
      position: relative;
      z-index: 1;
      width: 31px;
      height: 31px;
      display: block;
      flex-shrink: 0;
      object-fit: contain;
      border-radius: 9px;
      box-shadow: none;
      transition: filter 0.3s ease;

      &.dark-glow {
        filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.22));
      }
    }

    & .sidebar-title {
      position: relative;
      z-index: 1;
      display: block;
      flex: 0 0 auto;
      margin: 0;
      color: v-bind(logoTextColor);
      font-weight: 600;
      line-height: 1;
      font-size: 15px;
      letter-spacing: 0.02em;
      font-family: 'MiSans', 'HarmonyOS Sans SC', 'PingFang SC', sans-serif;
      white-space: nowrap;
    }

    & .sidebar-brand-copy {
      position: relative;
      z-index: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 4px;
      overflow: hidden;
      text-align: left;
    }

    & .sidebar-brand-caption {
      display: block;
      overflow: hidden;
      max-width: 100%;
      color: rgba(148, 163, 184, 0.82);
      font-size: 8px;
      font-weight: 600;
      letter-spacing: 0.12em;
      line-height: 1;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &.collapse {
    height: 50px;
    line-height: 50px;

    .sidebar-logo-link {
      padding: 0;

      .sidebar-logo {
        width: 31px;
        height: 31px;
      }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-logo-container .sidebar-logo.dark-glow {
    filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.22));
  }
}
</style>
