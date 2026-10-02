<template>
  <div class="app-container ecology-business-config-page">
    <UiCard shadow="never" class="workspace-hero">
      <div class="workspace-hero__copy">
        <span class="workspace-eyebrow"><el-icon><SetUp /></el-icon> BUSINESS CONFIGURATION</span>
        <h2>业务配置</h2>
        <p>统一维护业务类型绑定、审批方案和导入模板，提交页面只呈现已发布的业务。</p>
      </div>
      <div class="workspace-hero__status">
        <span class="status-icon"><el-icon><Connection /></el-icon></span>
        <div><strong>配置状态</strong><span>{{ readyCount }} 个业务可直接提交</span></div>
        <UiButton plain @click="loadData" :loading="loading"><el-icon><Refresh /></el-icon>刷新</UiButton>
      </div>
    </UiCard>

    <DepartmentPageTabs v-model="activeTab" class="config-tabs">
      <el-tab-pane name="overview">
        <template #label><span class="tab-label"><el-icon><DataAnalysis /></el-icon>业务总览</span></template>
        <div class="overview-grid">
          <UiCard v-for="item in overviewItems" :key="item.label" shadow="never" class="overview-card" :class="`overview-card--${item.tone}`">
            <span class="overview-card__icon"><el-icon><component :is="item.icon" /></el-icon></span>
            <div><strong>{{ item.value }}</strong><span>{{ item.label }}</span></div>
            <small>{{ item.hint }}</small>
          </UiCard>
        </div>

        <UiCard shadow="never" class="workspace-card">
          <div class="card-heading">
            <div>
              <span class="section-kicker">BUSINESS CATALOG</span>
              <h3>业务配置目录</h3>
              <p>以业务为中心查看配置完整度，表单配置和审批方式请在“流程配置”菜单中维护。</p>
            </div>
            <UiButton v-hasPermi="['ecology:businessType:add']" type="primary" @click="goToBusinessType"><el-icon><Plus /></el-icon>新增业务类型</UiButton>
          </div>

          <el-alert v-if="!loading && !businessTypes.length" title="暂无业务类型，请先维护业务类型后再配置流程和审批方案。" type="warning" :closable="false" show-icon class="mb-3" />

          <DepartmentDataTable :loading="loading" :data="businessRows" border>
            <el-table-column label="业务名称" min-width="220">
              <template #default="scope"><div class="business-name"><span>{{ scope.row.businessName.slice(0, 1) }}</span><div><strong>{{ scope.row.businessName }}</strong><small>{{ scope.row.businessType }}</small></div></div></template>
            </el-table-column>
            <el-table-column label="审批方案" width="150" align="center"><template #default="scope"><span class="count-value">{{ scope.row.planCount }}</span><small> 个启用方案</small></template></el-table-column>
            <el-table-column label="导入模板" width="140" align="center"><template #default="scope"><span class="count-value">{{ scope.row.templateCount }}</span><small> 个模板</small></template></el-table-column>
            <el-table-column label="配置状态" min-width="190">
              <template #default="scope"><UiTag :type="scope.row.statusType" effect="plain">{{ scope.row.statusLabel }}</UiTag><span v-if="scope.row.statusHint" class="status-hint">{{ scope.row.statusHint }}</span></template>
            </el-table-column>
            <el-table-column label="操作" width="230" align="center">
              <template #default="scope">
                <div class="row-actions">
                  <UiButton v-hasPermi="['ecology:businessType:list']" link type="primary" @click="goToBusinessType">业务类型</UiButton>
                  <UiButton v-hasPermi="['ecology:departmentApproval:list']" link type="primary" @click="goToApprovalPlan(scope.row.businessType)">审批方案</UiButton>
                  <UiButton v-hasPermi="['ecology:importConfig:list']" link type="success" @click="goToImportConfig(scope.row.businessType)">导入模板</UiButton>
                </div>
              </template>
            </el-table-column>
          </DepartmentDataTable>
          <UiEmpty v-if="!loading && !businessRows.length" description="暂无业务配置" />
        </UiCard>

      </el-tab-pane>

      <el-tab-pane v-hasPermi="['ecology:businessType:list']" name="businessType" lazy>
        <template #label><span class="tab-label"><el-icon><CollectionTag /></el-icon>业务类型</span></template>
        <BusinessTypePanel />
      </el-tab-pane>
      <el-tab-pane v-hasPermi="['ecology:departmentApproval:list']" name="approval" lazy>
        <template #label><span class="tab-label"><el-icon><Finished /></el-icon>审批方案</span></template>
        <DepartmentApprovalPanel :initial-business-type="approvalBusinessType" />
      </el-tab-pane>
      <el-tab-pane v-hasPermi="['ecology:importConfig:list']" name="import" lazy>
        <template #label><span class="tab-label"><el-icon><DocumentCopy /></el-icon>导入模板</span></template>
        <EcologyImportConfig embedded :business-type="importBusinessType" />
      </el-tab-pane>
    </DepartmentPageTabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { CollectionTag, Connection, DataAnalysis, DocumentCopy, Finished, Plus, Refresh, SetUp } from '@element-plus/icons-vue';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentPageTabs from '@/components/Department/PageTabs.vue';
import BusinessTypePanel from '../center/BusinessTypePanel.vue';
import DepartmentApprovalPanel from '../center/DepartmentApprovalPanel.vue';
import EcologyImportConfig from '../importConfig/index.vue';
import { UiButton, UiCard, UiEmpty, UiTag } from '@/components/UiKit';
import { listOaBusinessTypes, listOaDepartmentApprovals, listOaFormWorkflows, listOaImportBusinessConfigs } from '@/api/ecology';
import type { OaBusinessTypeVO, OaDepartmentApprovalVO, OaFormWorkflowVO } from '@/api/ecology/types';
import type { OaImportBusinessConfigVO } from '@/api/ecology/importBusinessTypes';

const activeTab = ref('overview');
const approvalBusinessType = ref<string>();
const importBusinessType = ref<string>();
const loading = ref(false);
const businessTypes = ref<OaBusinessTypeVO[]>([]);
const workflowForms = ref<OaFormWorkflowVO[]>([]);
const approvalPlans = ref<OaDepartmentApprovalVO[]>([]);
const importConfigs = ref<OaImportBusinessConfigVO[]>([]);

const overviewItems = computed(() => [
  { label: '业务类型', value: businessTypes.value.length, hint: '统一维护', tone: 'blue', icon: CollectionTag },
  { label: '已配置表单', value: workflowForms.value.filter((item) => item.status === 'ENABLED').length, hint: '可复用', tone: 'cyan', icon: Connection },
  { label: '启用审批方案', value: approvalPlans.value.filter((item) => item.status === 'ENABLED').length, hint: '自动匹配', tone: 'green', icon: Finished },
  { label: '启用导入模板', value: importConfigs.value.filter((item) => item.status === 'ENABLED').length, hint: '批量导入', tone: 'orange', icon: DocumentCopy }
]);

const businessRows = computed(() => businessTypes.value.map((item) => {
  const planCount = approvalPlans.value.filter((plan) => plan.businessType === item.businessType && plan.status === 'ENABLED').length;
  const templateCount = importConfigs.value.filter((config) => config.businessType === item.businessType && config.status === 'ENABLED').length;
  if (item.status !== 'ENABLED') return { ...item, planCount, templateCount, statusLabel: '已停用', statusHint: '历史记录仍保留', statusType: 'info' as const };
  if (workflowForms.value.filter((workflow) => workflow.status === 'ENABLED').length === 0) return { ...item, planCount, templateCount, statusLabel: '待配置表单', statusHint: '先在流程配置中维护表单', statusType: 'warning' as const };
  if (planCount === 0) return { ...item, planCount, templateCount, statusLabel: '待配置审批方案', statusHint: '也可提交时临时指定', statusType: 'warning' as const };
  return { ...item, planCount, templateCount, statusLabel: '可提交', statusHint: templateCount ? '单项和批量均可配置' : '支持单项审批', statusType: 'success' as const };
}));

const readyCount = computed(() => businessRows.value.filter((item) => item.statusLabel === '可提交').length);

const loadData = async () => {
  loading.value = true;
  try {
    const results = await Promise.allSettled([
      listOaBusinessTypes(undefined, false),
      listOaFormWorkflows(false),
      listOaDepartmentApprovals({ enabledOnly: false }),
      listOaImportBusinessConfigs(undefined, false)
    ]);
    businessTypes.value = results[0].status === 'fulfilled' ? results[0].value.data || [] : [];
    workflowForms.value = results[1].status === 'fulfilled' ? results[1].value.data || [] : [];
    approvalPlans.value = results[2].status === 'fulfilled' ? results[2].value.data || [] : [];
    importConfigs.value = results[3].status === 'fulfilled' ? results[3].value.data || [] : [];
  } finally {
    loading.value = false;
  }
};

const goToBusinessType = () => { activeTab.value = 'businessType'; };
const goToApprovalPlan = (businessType?: string) => { approvalBusinessType.value = businessType; activeTab.value = 'approval'; };
const goToImportConfig = (businessType?: string) => { importBusinessType.value = businessType; activeTab.value = 'import'; };

onMounted(loadData);
</script>

<style scoped lang="scss">
.ecology-business-config-page { --config-blue: #4b9ee8; --config-cyan: #3ca6b8; --config-green: #71ad3d; --config-orange: #d58a32; --tableHeaderBg: #f8fafc; --tableHeaderTextColor: #475569; padding: 18px 20px 30px; background: var(--app-shell-bg); }
.workspace-hero, .workspace-card, .overview-card { border: 1px solid var(--app-surface-border); border-radius: 18px; background: var(--app-surface-bg); box-shadow: 0 12px 30px rgba(15, 23, 42, .05); }
.workspace-hero { display: flex; align-items: center; justify-content: space-between; gap: 30px; padding: 29px 34px; overflow: hidden; background: linear-gradient(120deg, var(--app-surface-bg), color-mix(in srgb, var(--el-color-primary) 8%, var(--app-surface-bg))); }
.workspace-hero :deep(.el-card__body), .workspace-hero :deep(.ui-animal-card__body), .workspace-card :deep(.el-card__body), .workspace-card :deep(.ui-animal-card__body), .overview-card :deep(.el-card__body), .overview-card :deep(.ui-animal-card__body) { padding: 0; }
.workspace-eyebrow, .section-kicker { display: inline-flex; align-items: center; gap: 7px; color: var(--el-color-primary); font-size: 11px; font-weight: 800; letter-spacing: .16em; }
.workspace-hero h2 { margin: 10px 0 7px; color: var(--app-text-title); font-size: 28px; line-height: 1.2; }
.workspace-hero p, .card-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }
.workspace-hero__status { display: flex; align-items: center; gap: 11px; min-width: 250px; padding: 14px 16px; border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--app-surface-border)); border-radius: 14px; background: color-mix(in srgb, var(--el-color-primary) 5%, var(--app-surface-bg)); }
.status-icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 12px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 19px; }
.workspace-hero__status strong, .workspace-hero__status span { display: block; }.workspace-hero__status strong { color: var(--app-text-title); font-size: 14px; }.workspace-hero__status div span { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }.workspace-hero__status .el-button { margin-left: auto; }
.overview-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 14px 0; }.overview-card { position: relative; min-height: 96px; padding: 16px 18px; overflow: hidden; }.overview-card::after { position: absolute; right: -25px; bottom: -35px; width: 100px; height: 100px; border-radius: 50%; background: currentColor; content: ''; opacity: .06; }.overview-card__icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; margin-bottom: 10px; border-radius: 11px; color: currentColor; background: color-mix(in srgb, currentColor 13%, var(--app-surface-bg)); font-size: 17px; }.overview-card > div { display: flex; align-items: baseline; gap: 7px; }.overview-card strong { color: currentColor; font-size: 24px; }.overview-card > div span { color: var(--app-text-title); font-size: 12px; }.overview-card small { color: var(--el-text-color-secondary); font-size: 11px; }.overview-card--blue { color: var(--config-blue); }.overview-card--cyan { color: var(--config-cyan); }.overview-card--green { color: var(--config-green); }.overview-card--orange { color: var(--config-orange); }
.workspace-card { margin-top: 14px; padding: 23px 22px 18px; }.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }.card-heading h3 { margin: 7px 0 4px; color: var(--app-text-title); font-size: 19px; }.business-name { display: flex; align-items: center; gap: 11px; }.business-name > span { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 10px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-weight: 700; }.business-name strong, .business-name small { display: block; }.business-name strong { color: var(--app-text-title); }.business-name small { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 11px; }.count-value { color: var(--el-color-primary); font-size: 18px; font-weight: 700; }.count-value + small, .status-hint { color: var(--el-text-color-secondary); font-size: 11px; }.status-hint { margin-left: 8px; }.row-actions { display: inline-flex; gap: 2px; }
@media (max-width: 900px) { .workspace-hero { align-items: flex-start; flex-direction: column; }.workspace-hero__status { width: 100%; }.overview-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .ecology-business-config-page { padding: 12px; }.overview-grid { grid-template-columns: 1fr; }.card-heading { align-items: stretch; flex-direction: column; } }

/* 操作列保持普通列布局；按钮组在单元格中居中排列，避免固定层形成突兀的侧边面板。 */
.ecology-business-config-page .row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

/* 页面层级微调：让页头内容真正横向布局，避免卡片被撑成大面积空白。 */
.workspace-hero {
  display: block;
  position: relative;
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 92% 18%, color-mix(in srgb, var(--el-color-primary) 14%, transparent), transparent 25%),
    linear-gradient(120deg, var(--app-surface-bg) 0%, color-mix(in srgb, var(--el-color-primary) 5%, var(--app-surface-bg)) 100%);
}

.workspace-hero::after {
  position: absolute;
  right: -70px;
  bottom: -120px;
  width: 260px;
  height: 260px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.workspace-hero :deep(.el-card__body) {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  min-height: 116px;
  width: 100%;
  box-sizing: border-box;
  padding: 24px 30px;
}

.workspace-hero__copy {
  min-width: 0;
  flex: 1;
}

.workspace-hero__status {
  width: 278px;
  min-width: 240px;
  box-sizing: border-box;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}

.workspace-hero__status .el-button {
  height: 32px;
  padding: 0 14px;
  border-radius: 9px;
}

.config-tabs {
  margin-top: 14px;
}

.config-tabs :deep(.el-tabs__header) {
  padding: 8px;
  border: 1px solid var(--app-surface-border);
  border-radius: 15px;
  background: var(--app-surface-bg);
  box-shadow: 0 8px 22px rgb(15 23 42 / 4%);
}

.config-tabs :deep(.el-tabs__nav-wrap) {
  border-color: var(--app-surface-border);
  background: var(--el-fill-color-lighter);
}

.config-tabs :deep(.el-tabs__item) {
  min-width: 128px;
  height: 40px;
}

.workspace-card {
  box-shadow: 0 10px 26px rgb(15 23 42 / 4%);
}

.workspace-card:hover,
.overview-card:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 28%, var(--app-surface-border));
  box-shadow: 0 14px 30px rgb(15 23 42 / 7%);
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.tab-label .el-icon {
  font-size: 16px;
}

html.dark .ecology-business-config-page {
  --tableHeaderBg: #18263a;
  --tableHeaderTextColor: #b9c8dd;
}

html.dark .config-tabs :deep(.el-tabs__nav-wrap) {
  border-color: rgba(71, 85, 105, 0.68);
  background: #0f1a2b;
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 22%);
}

html.dark .config-tabs :deep(.el-tabs__item:hover) {
  color: #a9d9ff;
  background: rgba(56, 168, 242, 0.12);
}

html.dark .config-tabs :deep(.el-tabs__item.is-active) {
  color: #b9e1ff;
  background: #1a2b43;
  box-shadow: 0 4px 12px rgb(0 0 0 / 22%), inset 0 0 0 1px rgba(56, 168, 242, 0.24);
}

@media (max-width: 900px) {
  .workspace-hero :deep(.el-card__body) {
    align-items: flex-start;
    flex-direction: column;
    gap: 18px;
  }

  .workspace-hero__status {
    width: 100%;
  }

  .config-tabs :deep(.el-tabs__item) {
    min-width: 0;
  }
}
</style>

<!-- 动森模式页面皮肤：业务配置页的原始样式包含办公蓝色，按主题语义统一为奶油绿配色。 -->
<style lang="scss">
html[data-ui-theme='animal'] .ecology-business-config-page {
  --config-blue: var(--animal-primary-color);
  --config-cyan: #3aa89d;
  --config-green: var(--animal-status-success);
  --config-orange: var(--animal-status-warning);
  --tableHeaderBg: #f7f3df;
  --tableHeaderTextColor: #6f5131;
  color: var(--animal-text-color);
  background: transparent;

  .workspace-hero,
  .workspace-card,
  .overview-card {
    border-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
    box-shadow: var(--app-shadow-md);
  }

  .workspace-hero {
    border-color: var(--animal-border-color);
    background:
      radial-gradient(circle at 92% 18%, rgb(25 200 185 / 14%), transparent 25%),
      linear-gradient(118deg, #fffdf5 0%, #f0f7e8 55%, #e4f2df 100%);
  }

  .workspace-hero::after {
    border-color: rgb(25 200 185 / 22%);
  }

  .workspace-eyebrow,
  .section-kicker {
    color: #3f8f83;
  }

  .workspace-hero h2,
  .card-heading h3,
  .overview-card > div span,
  .business-name strong,
  .workspace-hero__status strong {
    color: var(--animal-text-color);
  }

  .workspace-hero p,
  .card-heading p,
  .workspace-hero__status div span,
  .overview-card small,
  .business-name small,
  .count-value + small,
  .status-hint {
    color: var(--animal-text-color-secondary);
  }

  .workspace-hero__status {
    border-color: rgb(25 145 132 / 26%);
    background: linear-gradient(135deg, rgb(255 255 255 / 70%), rgb(232 249 239 / 70%));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 72%), var(--app-shadow-md);
  }

  .status-icon,
  .business-name > span {
    border: 1px solid rgb(25 200 185 / 25%);
    color: #168f84;
    background: linear-gradient(145deg, #e6f9f6, #d7f1e7);
  }

  .workspace-hero__status .el-button,
  .workspace-hero__status .ui-animal-button,
  .card-heading > .el-button,
  .card-heading > .ui-animal-button {
    border-color: var(--animal-border-color) !important;
    color: var(--animal-text-color) !important;
    background: var(--animal-bg-color-input) !important;
  }

  .workspace-hero__status .el-button:hover,
  .workspace-hero__status .ui-animal-button:hover,
  .card-heading > .el-button:hover,
  .card-heading > .ui-animal-button:hover {
    border-color: var(--animal-primary-color) !important;
    color: #168f84 !important;
    background: var(--animal-primary-color-bg) !important;
  }

  .overview-card {
    border-radius: var(--animal-radius-card);
    background: linear-gradient(145deg, var(--app-surface-bg), var(--animal-bg-color));
  }

  .overview-card__icon {
    background: color-mix(in srgb, currentColor 13%, var(--app-surface-bg));
  }

  .overview-card:hover,
  .workspace-card:hover {
    border-color: rgb(25 200 185 / 42%);
    box-shadow: var(--app-shadow-lg);
  }

  .config-tabs .el-tabs__header {
    border-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
    box-shadow: var(--app-shadow-sm);
  }

  .config-tabs .el-tabs__nav-wrap {
    border-color: var(--animal-border-color-light);
    background: var(--animal-bg-color-secondary);
  }

  .config-tabs .el-tabs__item {
    color: var(--animal-text-color-secondary);
  }

  .config-tabs .el-tabs__item:hover,
  .config-tabs .el-tabs__item.is-active {
    color: var(--animal-primary-color);
    background: var(--animal-bg-color-input);
  }

  .config-tabs .el-tabs__item.is-active {
    box-shadow: 0 4px 12px rgb(64 91 74 / 10%), inset 0 0 0 1px rgb(25 200 185 / 22%);
  }

  .workspace-card .el-alert {
    border-color: rgb(200 139 43 / 28%);
    background: linear-gradient(90deg, rgb(200 139 43 / 12%), var(--animal-bg-color-secondary));
  }

  .workspace-card .el-alert__title,
  .workspace-card .el-alert__icon {
    color: var(--animal-status-warning);
  }

  .department-data-table {
    --el-table-bg-color: var(--app-surface-bg);
    --el-table-tr-bg-color: var(--app-surface-bg);
    --el-table-header-bg-color: var(--tableHeaderBg);
    --el-table-row-hover-bg-color: color-mix(in srgb, var(--animal-primary-color) 12%, var(--app-surface-bg));
    --el-table-border-color: var(--animal-border-color-light);
    --el-table-text-color: var(--animal-text-color);
    border-color: var(--animal-border-color-light);
  }

  .department-data-table :is(.el-table__header-wrapper, .el-table__fixed-header-wrapper) th.el-table__cell {
    color: var(--tableHeaderTextColor) !important;
    background: var(--tableHeaderBg) !important;
    border-bottom-color: var(--animal-border-color-light);
  }

  .department-data-table :is(.el-table__body-wrapper, .el-table__fixed-body-wrapper) td.el-table__cell {
    color: var(--animal-text-color);
    border-bottom-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
  }

  .department-data-table :is(.el-table__body tr:hover > td.el-table__cell, .el-table__fixed-right tr:hover > td.el-table__cell) {
    background: var(--el-table-row-hover-bg-color) !important;
  }

  .department-data-table :is(.el-table__fixed, .el-table__fixed-right) {
    background: var(--app-surface-bg);
    box-shadow: -8px 0 16px rgb(64 91 74 / 9%);
  }

  .department-data-table :is(.el-table__fixed-right th.el-table__cell, .el-table__fixed-right td.el-table__cell, .el-table__fixed-right-patch) {
    background: var(--app-surface-bg) !important;
  }

  .department-data-table .el-table__empty-text,
  .workspace-card .el-empty__description p {
    color: var(--animal-text-color-secondary);
  }

  .count-value {
    color: var(--animal-primary-color);
  }

  .row-actions :is(.el-button--primary, .el-button--success, .ui-animal-button--primary, .ui-animal-button--success) {
    color: #168f84 !important;
  }

  .row-actions .el-button:hover,
  .row-actions .ui-animal-button:hover {
    color: var(--animal-primary-color) !important;
    background: var(--animal-primary-color-bg) !important;
  }
}

html[data-ui-theme='animal'][data-color-mode='dark'] .ecology-business-config-page {
  --tableHeaderBg: #405650;
  --tableHeaderTextColor: #fff6df;

  .workspace-hero,
  .workspace-card,
  .overview-card {
    border-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
    box-shadow: var(--app-shadow-md);
  }

  .workspace-hero {
    border-color: var(--animal-border-color);
    background:
      radial-gradient(circle at 88% 5%, rgb(127 228 211 / 18%), transparent 28%),
      linear-gradient(118deg, #29433f 0%, #345751 56%, #3f6b62 100%);
  }

  .workspace-hero::after {
    border-color: rgb(127 228 211 / 28%);
  }

  .workspace-eyebrow,
  .section-kicker {
    color: #8fe0d1;
  }

  .workspace-hero h2,
  .card-heading h3,
  .overview-card > div span,
  .business-name strong,
  .workspace-hero__status strong {
    color: var(--animal-text-color);
  }

  .workspace-hero p,
  .card-heading p,
  .workspace-hero__status div span,
  .overview-card small,
  .business-name small,
  .count-value + small,
  .status-hint {
    color: var(--animal-text-color-secondary);
  }

  .workspace-hero__status {
    border-color: rgb(127 228 211 / 28%);
    background: linear-gradient(135deg, rgb(64 86 80 / 88%), rgb(38 58 56 / 78%));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 8%), var(--app-shadow-md);
  }

  .status-icon,
  .business-name > span {
    border-color: rgb(127 228 211 / 24%);
    color: #9be9dc;
    background: linear-gradient(145deg, rgb(25 200 185 / 24%), rgb(25 200 185 / 9%));
  }

  .workspace-hero__status .el-button,
  .card-heading > .el-button {
    border-color: var(--animal-border-color) !important;
    color: var(--animal-text-color) !important;
    background: var(--animal-bg-color-input) !important;
  }

  .workspace-hero__status .el-button:hover,
  .card-heading > .el-button:hover {
    border-color: var(--animal-primary-color) !important;
    color: #a8f0e4 !important;
    background: rgb(25 200 185 / 16%) !important;
  }

  .overview-card {
    background: linear-gradient(145deg, #2f4542, #263937);
  }

  .overview-card__icon {
    background: color-mix(in srgb, currentColor 20%, var(--app-surface-bg));
  }

  .overview-card:hover,
  .workspace-card:hover {
    border-color: rgb(127 228 211 / 52%);
    box-shadow: var(--app-shadow-lg);
  }

  .config-tabs .el-tabs__header {
    border-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
    box-shadow: var(--app-shadow-sm);
  }

  .config-tabs .el-tabs__nav-wrap {
    border-color: var(--animal-border-color);
    background: var(--animal-bg-color-secondary);
    box-shadow: inset 0 1px 2px rgb(0 0 0 / 22%);
  }

  .config-tabs .el-tabs__item {
    color: var(--animal-text-color-secondary);
  }

  .config-tabs .el-tabs__item:hover,
  .config-tabs .el-tabs__item.is-active {
    color: #a8f0e4;
    background: var(--animal-bg-color-input);
  }

  .config-tabs .el-tabs__item.is-active {
    box-shadow: 0 4px 12px rgb(0 0 0 / 22%), inset 0 0 0 1px rgb(127 228 211 / 28%);
  }

  .workspace-card .el-alert {
    border-color: rgb(228 182 106 / 28%);
    background: linear-gradient(90deg, rgb(228 182 106 / 13%), var(--animal-bg-color-secondary));
  }

  .workspace-card .el-alert__title,
  .workspace-card .el-alert__icon {
    color: var(--animal-status-warning);
  }

  .department-data-table {
    --el-table-bg-color: var(--app-surface-bg);
    --el-table-tr-bg-color: var(--app-surface-bg);
    --el-table-header-bg-color: var(--tableHeaderBg);
    --el-table-row-hover-bg-color: rgb(25 200 185 / 14%);
    --el-table-border-color: var(--animal-border-color-light);
    --el-table-text-color: var(--animal-text-color);
    border-color: var(--animal-border-color-light);
  }

  .department-data-table :is(.el-table__header-wrapper, .el-table__fixed-header-wrapper) th.el-table__cell {
    color: var(--tableHeaderTextColor) !important;
    background: var(--tableHeaderBg) !important;
    border-bottom-color: var(--animal-border-color);
  }

  .department-data-table :is(.el-table__body-wrapper, .el-table__fixed-body-wrapper) td.el-table__cell {
    color: var(--animal-text-color);
    border-bottom-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
  }

  .department-data-table :is(.el-table__body tr:hover > td.el-table__cell, .el-table__fixed-right tr:hover > td.el-table__cell) {
    background: var(--el-table-row-hover-bg-color) !important;
  }

  .department-data-table :is(.el-table__fixed, .el-table__fixed-right) {
    background: var(--app-surface-bg);
    box-shadow: -8px 0 16px rgb(0 0 0 / 22%);
  }

  .department-data-table :is(.el-table__fixed-right th.el-table__cell, .el-table__fixed-right td.el-table__cell, .el-table__fixed-right-patch) {
    background: var(--app-surface-bg) !important;
  }

  .department-data-table .el-table__empty-text,
  .workspace-card .el-empty__description p {
    color: var(--animal-text-color-secondary);
  }

  .count-value {
    color: #8fe0d1;
  }

  .row-actions :is(.el-button--primary, .el-button--success) {
    color: #9be9dc !important;
  }

  .row-actions .el-button:hover {
    color: #a8f0e4 !important;
    background: rgb(25 200 185 / 16%) !important;
  }
}
</style>
