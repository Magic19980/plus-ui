<template>
  <DepartmentPageTabs v-model="activeTab" class="workflow-config-tabs">
    <el-tab-pane name="form">
      <template #label><span class="tab-label"><el-icon><Document /></el-icon>表单配置</span></template>
      <FormWorkflowPanel />
    </el-tab-pane>
    <el-tab-pane name="option" lazy>
      <template #label><span class="tab-label"><el-icon><Finished /></el-icon>审批方式配置</span></template>
      <WorkflowOptionPanel />
    </el-tab-pane>
  </DepartmentPageTabs>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Document, Finished } from '@element-plus/icons-vue';
import DepartmentPageTabs from '@/components/Department/PageTabs.vue';
import FormWorkflowPanel from './FormWorkflowPanel.vue';
import WorkflowOptionPanel from './WorkflowOptionPanel.vue';

const activeTab = ref('form');
</script>

<style scoped lang="scss">
.workflow-config-tabs {
  :deep(.el-tabs__header) { margin-bottom: 0; border-bottom: 0; }
  :deep(.el-tab-pane) { padding-top: 22px; }
}

.tab-label { display: inline-flex; align-items: center; gap: 7px; }
</style>
