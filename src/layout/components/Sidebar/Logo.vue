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
import { UiThemeEnum } from '@/enums/UiThemeEnum';
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
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const logoSurface = computed(() => {
  if (isAnimalMode.value) {
    return isDarkSide.value
      ? 'linear-gradient(145deg, rgba(82, 112, 103, 0.72), rgba(45, 64, 60, 0.48))'
      : 'linear-gradient(145deg, rgba(255, 253, 245, 0.78), rgba(241, 231, 207, 0.56))';
  }
  return isDarkSide.value
    ? 'linear-gradient(145deg, rgba(39, 57, 82, 0.72), rgba(21, 31, 49, 0.5))'
    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.78), rgba(237, 244, 250, 0.56))';
});
const logoBorder = computed(() => 'transparent');
const logoHoverBorder = computed(() => {
  if (isAnimalMode.value) return isDarkSide.value ? 'rgba(111, 225, 211, 0.48)' : 'rgba(25, 200, 185, 0.42)';
  return isDarkSide.value ? 'rgba(125, 211, 252, 0.38)' : 'rgba(14, 165, 233, 0.34)';
});
const logoTextColor = computed(() => {
  if (isAnimalMode.value) return isDarkSide.value ? '#f5ead1' : '#725d42';
  return isDarkSide.value ? '#f8fbff' : 'var(--app-text-title)';
});
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
  height: 58px;
  line-height: 58px;
  padding: 0;
  margin-top: 0;
  background: transparent;
  text-align: center;
  overflow: hidden;
  margin-bottom: 2px;

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex !important;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 0 7px;
    position: relative;
    border-radius: 14px;
    background: v-bind(logoSurface);
    border: 1px solid v-bind(logoBorder);
    box-shadow: 0 5px 14px rgba(2, 6, 23, 0.06);
    overflow: hidden;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    &:hover {
      border-color: v-bind(logoHoverBorder);
      background: v-bind(logoSurface);
      box-shadow: 0 7px 17px rgba(2, 6, 23, 0.09);
      transform: translateY(-1px);
    }

    &::after {
      position: absolute;
      top: -28px;
      right: -22px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--app-accent-strong) 15%, transparent);
      content: '';
      opacity: 0.5;
      pointer-events: none;
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
    height: 45px;
    line-height: 45px;

    .sidebar-logo-link {
      padding: 0;
      justify-content: center;

      &::before {
        display: none;
      }

      &::after {
        display: none;
      }

      .sidebar-logo {
        width: 36px;
        height: 36px;
        border-radius: 11px;
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
