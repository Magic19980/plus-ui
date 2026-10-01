<template>
  <div class="ui-theme-preview" :class="`is-${theme}`">
    <div class="preview-toolbar">
      <span class="preview-brand">{{ theme === UiThemeEnum.ANIMAL ? 'island workspace' : 'TEI WORKSPACE' }}</span>
      <span class="preview-toolbar-dot" />
      <span class="preview-toolbar-line" />
    </div>

    <div class="preview-layout">
      <div class="preview-sidebar">
        <span class="preview-sidebar-brand" :class="{ 'island-mark': theme === UiThemeEnum.ANIMAL }">{{ theme === UiThemeEnum.ANIMAL ? '' : 'TEI' }}</span>
        <span v-for="item in 4" :key="item" class="preview-sidebar-item" :class="{ active: item === 1 }" />
      </div>

      <div class="preview-content">
        <div class="preview-heading">
          <span class="preview-heading-title">{{ theme === UiThemeEnum.ANIMAL ? '小岛工作台' : '我的工作台' }}</span>
          <span class="preview-heading-meta" />
        </div>

        <AnimalCard v-if="theme === UiThemeEnum.ANIMAL" color="app-teal" pattern="none" class="preview-card">
          <div class="preview-card-content">
            <span class="preview-card-title">今日工作概览</span>
            <span class="preview-card-value">24</span>
            <AnimalButton type="primary" size="small">进入工作台</AnimalButton>
          </div>
          <div class="preview-status-row"><span class="status-dot status-dot--success" />成员在线 <span class="status-dot status-dot--warning" />待处理 3</div>
        </AnimalCard>
        <el-card v-else class="preview-card" shadow="never">
          <div class="preview-card-content">
            <span class="preview-card-title">今日工作概览</span>
            <span class="preview-card-value">24</span>
            <el-button type="primary" size="small">进入工作台</el-button>
          </div>
          <div class="preview-status-row"><span class="status-dot status-dot--success" />成员在线 <span class="status-dot status-dot--warning" />待处理 3</div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { UiThemeEnum } from '@/enums/UiThemeEnum';

const AnimalButton = defineAsyncComponent(() => import('animal-island-vue').then(({ Button }) => Button));
const AnimalCard = defineAsyncComponent(() => import('animal-island-vue').then(({ Card }) => Card));

defineProps<{
  theme: UiThemeEnum;
}>();
</script>

<style lang="scss">
.ui-theme-preview {
  overflow: hidden;
  border: 1px solid var(--app-surface-border);
  border-radius: 14px;
  background: var(--app-surface-bg);
  box-shadow: var(--app-shadow-sm);
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;

  .preview-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 22px;
    padding: 0 8px;
    background: var(--app-navbar-bg);
    border-bottom: 1px solid var(--app-navbar-border);
  }

  .preview-brand {
    color: var(--app-text-muted);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .preview-toolbar-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--app-accent-strong);
  }

  .preview-toolbar-line,
  .preview-heading-meta {
    display: block;
    width: 30px;
    height: 4px;
    border-radius: 999px;
    background: var(--app-elevated-close-bg);
  }

  .preview-layout {
    display: flex;
    min-height: 118px;
  }

  .preview-sidebar {
    display: flex;
    width: 42px;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    padding: 8px 5px;
    background: var(--app-sidebar-bg);
    border-right: 1px solid var(--app-sidebar-border);
  }

  .preview-sidebar-brand {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 7px;
    background: var(--app-accent-soft);
    color: var(--app-accent-strong);
    font-size: 8px;
    font-weight: 800;
  }

  .preview-sidebar-brand.island-mark {
    position: relative;
    overflow: hidden;
    background: #8fc997;
  }

  .preview-sidebar-brand.island-mark::before {
    position: absolute;
    right: 3px;
    bottom: 4px;
    left: 3px;
    height: 7px;
    border-radius: 50%;
    background: #ffe6a3;
    content: '';
  }

  .preview-sidebar-brand.island-mark::after {
    position: absolute;
    bottom: 8px;
    left: 10px;
    width: 2px;
    height: 9px;
    background: #5e8066;
    content: '';
  }

  .preview-sidebar-item {
    display: block;
    width: 22px;
    height: 6px;
    border-radius: 3px;
    background: var(--app-elevated-close-bg);

    &.active {
      background: var(--app-accent-strong);
    }
  }

  .preview-content {
    min-width: 0;
    flex: 1;
    padding: 10px;
    background: var(--app-shell-bg);
  }

  .preview-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .preview-heading-title,
  .preview-card-title {
    color: var(--app-text-title);
    font-size: 9px;
    font-weight: 700;
  }

  .preview-card {
    min-height: 72px;
    padding: 10px;
  }

  .preview-card-content {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
  }

  .preview-status-row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 5px;
    color: var(--app-text-muted);
    font-size: 7px;
  }

  .status-dot { width: 5px; height: 5px; border-radius: 50%; }
  .status-dot--success { background: #61b877; }
  .status-dot--warning { margin-left: 5px; background: #d6a447; }

  .preview-card-value {
    margin-right: auto;
    color: var(--app-accent-strong);
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
  }

  .el-card.preview-card {
    border-color: var(--app-surface-border);
    background: var(--app-surface-bg);
  }

  .animal-card.preview-card {
    min-height: 72px;
    border: 0;
    box-shadow: none;
  }

  .animal-card.preview-card .preview-card-title,
  .animal-card.preview-card .preview-card-value {
    color: var(--animal-text-color, #794f27);
  }

  html[data-ui-theme='animal'][data-color-mode='dark'] & {
    .preview-content {
      background: #1f2c2d;
    }

    .animal-card.preview-card {
      background: #324543;
      border-color: #526b65;
    }

    .animal-card.preview-card .preview-card-title {
      color: #f5ead1;
    }

    .animal-card.preview-card .preview-card-value {
      color: #7fe4d3;
    }
  }
}
</style>
