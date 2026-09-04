<template>
  <div class="app-container workflow-config-page">
    <el-card shadow="never" class="workflow-hero">
      <div class="workflow-hero__icon"><el-icon><Connection /></el-icon></div>
      <div><div class="page-kicker">WEAVER WORKFLOW CONFIGURATION</div><h2>流程配置</h2><p>分别维护可复用的泛微表单和全局审批方式。</p></div>
    </el-card>
    <el-card shadow="never" class="workflow-card"><WorkflowConfigPanel /></el-card>
  </div>
</template>

<script setup lang="ts">
import { Connection } from '@element-plus/icons-vue';
import WorkflowConfigPanel from '../center/WorkflowConfigPanel.vue';
</script>

<style scoped lang="scss">
.workflow-config-page { min-height: 100%; padding: 18px 20px 30px; background: var(--app-page-bg); }.workflow-hero, .workflow-card { border: 1px solid var(--app-surface-border); border-radius: 17px; background: var(--app-surface-bg); box-shadow: 0 10px 28px rgb(15 23 42 / 5%); }.workflow-hero :deep(.el-card__body) { display: flex; align-items: center; gap: 15px; padding: 24px 28px; background: linear-gradient(120deg, var(--app-surface-bg), color-mix(in srgb, var(--el-color-primary) 8%, var(--app-surface-bg))); }.workflow-hero__icon { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 14px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 24px; }.page-kicker { color: var(--el-color-primary); font-size: 11px; font-weight: 800; letter-spacing: .14em; }.workflow-hero h2 { margin: 8px 0 4px; color: var(--app-text-title); font-size: 25px; }.workflow-hero p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }.workflow-card { margin-top: 14px; }.workflow-card :deep(.el-card__body) { padding: 22px; }
</style>
