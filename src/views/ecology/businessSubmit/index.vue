<template>
  <div class="app-container ecology-business-submit-page">
    <el-card shadow="never" class="submit-hero">
      <div>
        <span class="submit-eyebrow"><el-icon><Promotion /></el-icon> SUBMIT TO ECOLOGY</span>
        <h2>业务提交</h2>
        <p>选择已发布的业务，完成单项审批或批量导入，系统会在提交前自动核对流程、组织、审批人和附件。</p>
      </div>
      <div class="submit-hero__meta"><span>当前可提交</span><strong>{{ availableBusinessCount }} 个业务</strong><small>{{ importTemplateCount }} 个批量导入模板</small></div>
    </el-card>

    <el-card shadow="never" class="submit-card">
      <div class="submit-card__heading"><div><span class="section-kicker">SUBMISSION WORKSPACE</span><h3>提交工作区</h3><p>在同一页面切换单项审批和批量导入，提交记录统一进入“我的申请”。</p></div><el-button plain icon="Refresh" :loading="loading" @click="loadSummary">刷新状态</el-button></div>
      <DepartmentPageTabs v-model="activeTab" class="submit-tabs">
        <el-tab-pane name="single">
          <template #label><span class="tab-label"><el-icon><DocumentChecked /></el-icon>单项审批</span></template>
          <EcologyCenter embedded />
        </el-tab-pane>
        <el-tab-pane name="batch" lazy>
          <template #label><span class="tab-label"><el-icon><Upload /></el-icon>批量导入</span></template>
          <EcologyImportBusiness embedded />
        </el-tab-pane>
      </DepartmentPageTabs>
    </el-card>

    <div class="submission-note-grid">
      <el-card shadow="never" class="note-card"><span class="note-card__icon"><el-icon><Finished /></el-icon></span><div><strong>提交前自动检查</strong><p>业务配置、组织映射、审批方案和附件模板在提交前统一校验。</p></div></el-card>
      <el-card shadow="never" class="note-card"><span class="note-card__icon note-card__icon--green"><el-icon><Connection /></el-icon></span><div><strong>审批人员自动匹配</strong><p>根据业务类型、组织范围、条件和优先级选择审批方案。</p></div></el-card>
      <el-card shadow="never" class="note-card"><span class="note-card__icon note-card__icon--orange"><el-icon><Document /></el-icon></span><div><strong>附件按模板生成</strong><p>需要附件的业务按已配置模板生成，公式和样式由模板负责。</p></div></el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Connection, Document, DocumentChecked, Finished, Promotion, Upload } from '@element-plus/icons-vue';
import DepartmentPageTabs from '@/components/Department/PageTabs.vue';
import EcologyCenter from '../center/index.vue';
import EcologyImportBusiness from '../importBusiness/index.vue';
import { listOaBusinessTypes, listAvailableOaImportBusinessConfigs } from '@/api/ecology';

const activeTab = ref('single');
const loading = ref(false);
const businessTypeCount = ref(0);
const importTemplateCount = ref(0);
const availableBusinessCount = computed(() => businessTypeCount.value);

const loadSummary = async () => {
  loading.value = true;
  try {
    const [businessResult, importResult] = await Promise.allSettled([listOaBusinessTypes(undefined, true), listAvailableOaImportBusinessConfigs()]);
    businessTypeCount.value = businessResult.status === 'fulfilled' ? (businessResult.value.data || []).length : 0;
    importTemplateCount.value = importResult.status === 'fulfilled' ? (importResult.value.data || []).length : 0;
  } finally {
    loading.value = false;
  }
};

onMounted(loadSummary);
</script>

<style scoped lang="scss">
.ecology-business-submit-page {
  padding: 18px 20px 30px;
  background: var(--app-page-bg);
}

.submit-hero,
.submit-card,
.note-card {
  border: 1px solid var(--app-surface-border);
  border-radius: 18px;
  background: var(--app-surface-bg);
  box-shadow: 0 12px 30px rgba(15, 23, 42, .05);
}

.submit-hero :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 30px 34px;
  background: linear-gradient(120deg, var(--app-surface-bg), color-mix(in srgb, var(--el-color-primary) 8%, var(--app-surface-bg)));
}

.submit-eyebrow,
.section-kicker {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .16em;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.tab-label .el-icon {
  font-size: 16px;
}

.submit-hero h2 {
  margin: 10px 0 7px;
  color: var(--app-text-title);
  font-size: 28px;
}

.submit-hero p,
.submit-card__heading p {
  max-width: 770px;
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.submit-hero__meta {
  min-width: 210px;
  padding: 15px 18px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--app-surface-border));
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-color-primary) 5%, var(--app-surface-bg));
}

.submit-hero__meta span,
.submit-hero__meta strong,
.submit-hero__meta small {
  display: block;
}

.submit-hero__meta span,
.submit-hero__meta small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.submit-hero__meta strong {
  margin: 5px 0;
  color: var(--el-color-primary);
  font-size: 22px;
}

.submit-card {
  margin-top: 14px;
  padding: 25px 24px 28px;
}

.submit-card__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;
}

.submit-card__heading h3 {
  margin: 7px 0 4px;
  color: var(--app-text-title);
  font-size: 19px;
}

.submission-note-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.note-card :deep(.el-card__body) {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 17px 18px;
}

.note-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.note-card__icon--green {
  color: #71ad3d;
  background: color-mix(in srgb, #71ad3d 13%, var(--app-surface-bg));
}

.note-card__icon--orange {
  color: #d58a32;
  background: color-mix(in srgb, #d58a32 13%, var(--app-surface-bg));
}

.note-card strong {
  display: block;
  color: var(--app-text-title);
  font-size: 13px;
}

.note-card p {
  margin: 5px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .submit-hero :deep(.el-card__body) {
    align-items: flex-start;
    flex-direction: column;
  }

  .submit-hero__meta {
    width: 100%;
  }

  .submission-note-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .ecology-business-submit-page {
    padding: 12px;
  }

  .submit-card__heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
