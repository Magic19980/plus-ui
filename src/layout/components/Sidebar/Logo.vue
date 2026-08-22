<template>
  <div class="sidebar-logo-container" :class="{ collapse: collapse }">
    <transition :enter-active-class="animateConfig.logoAnimate.enter" mode="out-in">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <img :src="logo" class="sidebar-logo" :class="{ 'dark-glow': isDarkTheme }" alt="TEI" />
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <img :src="logo" class="sidebar-logo" :class="{ 'dark-glow': isDarkTheme }" alt="TEI" />
        <h1 class="sidebar-title">{{ title }}</h1>
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
const logoSurface = computed(() => (isDarkSide.value ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'));
const logoBorder = computed(() => (isDarkSide.value ? 'rgba(148, 163, 184, 0.12)' : '#e5e7eb'));
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
  height: 50px;
  line-height: 50px;
  padding: 0 8px;
  margin-top: 8px;
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
    border-radius: 14px;
    background: v-bind(logoSurface);
    border: 1px solid v-bind(logoBorder);

    & .sidebar-logo {
      width: 30px;
      height: 30px;
      display: block;
      flex-shrink: 0;
      object-fit: contain;
      border-radius: 9px;
      box-shadow: none;
      transition: filter 0.3s ease;

      &.dark-glow {
        animation: tei-logo-breathe 3.2s ease-in-out infinite;
      }
    }

    & .sidebar-title {
      display: inline-block;
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
  }

  &.collapse {
    height: 46px;
    line-height: 46px;

    .sidebar-logo-link {
      padding: 0;
    }
  }
}

@keyframes tei-logo-breathe {
  0%,
  100% {
    filter: drop-shadow(0 0 1px rgba(45, 212, 191, 0.14)) drop-shadow(0 0 2px rgba(59, 130, 246, 0.08));
  }

  50% {
    filter: drop-shadow(0 0 5px rgba(45, 212, 191, 0.84)) drop-shadow(0 0 13px rgba(59, 130, 246, 0.52));
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-logo-container .sidebar-logo.dark-glow {
    animation: none;
    filter: drop-shadow(0 0 4px rgba(45, 212, 191, 0.48));
  }
}
</style>
