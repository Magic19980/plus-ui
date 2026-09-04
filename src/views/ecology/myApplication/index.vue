<template>
  <div class="app-container ecology-my-application-page">
    <el-card shadow="never" class="history-hero">
      <div><span class="history-eyebrow"><el-icon><DocumentChecked /></el-icon> MY SUBMISSIONS</span><h2>我的申请</h2><p>统一查看单项审批和批量导入提交记录，失败或待处理的事项可以回到原页面继续处理。</p></div>
      <el-button plain icon="Refresh" :loading="loading" @click="refresh">刷新记录</el-button>
    </el-card>

    <div class="history-overview">
      <el-card v-for="item in overviewItems" :key="item.label" shadow="never" class="history-stat" :class="`history-stat--${item.tone}`"><span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.hint }}</small></el-card>
    </div>

    <el-card shadow="never" class="history-card">
      <DepartmentPageTabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane name="applications">
          <template #label><span class="tab-label"><el-icon><DocumentChecked /></el-icon>单项审批</span></template>
          <el-form :model="applicationQuery" :inline="true" @submit.prevent class="history-filter">
            <el-form-item label="标题"><el-input v-model="applicationQuery.title" clearable placeholder="申请标题" @keyup.enter="searchApplications" /></el-form-item>
            <el-form-item label="状态"><el-select v-model="applicationQuery.status" clearable placeholder="全部状态" style="width: 150px"><el-option v-for="item in applicationStatusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" icon="Search" @click="searchApplications">查询</el-button><el-button icon="Refresh" @click="resetApplications">重置</el-button></el-form-item>
          </el-form>
          <DepartmentDataTable v-loading="applicationLoading" :data="applications" border>
            <el-table-column label="申请编号" prop="applicationNo" width="175" show-overflow-tooltip />
            <el-table-column label="业务类型" min-width="160" show-overflow-tooltip><template #default="scope">{{ businessTypeName(scope.row.businessType) }}</template></el-table-column>
            <el-table-column label="申请标题" prop="title" min-width="220" show-overflow-tooltip />
            <el-table-column label="审批流程" prop="workflowName" min-width="160" show-overflow-tooltip />
            <el-table-column label="状态" width="110" align="center"><template #default="scope"><el-tag :type="applicationStatusType(scope.row.status)">{{ applicationStatusLabel(scope.row.status) }}</el-tag></template></el-table-column>
            <el-table-column label="提交时间" prop="submittedAt" width="170" />
            <el-table-column label="操作" fixed="right" width="220" align="center"><template #default="scope"><div class="history-actions"><el-button link type="primary" @click="openApplicationDetail(scope.row)">详情</el-button><el-button v-if="scope.row.oaLink" link type="success" @click="openOa(scope.row.oaLink)">打开泛微</el-button><el-button v-if="canHandleApplication(scope.row)" link type="warning" @click="handleApplication(scope.row)">去处理</el-button></div></template></el-table-column>
          </DepartmentDataTable>
          <pagination v-show="applicationTotal > 0" v-model:page="applicationQuery.pageNum" v-model:limit="applicationQuery.pageSize" :total="applicationTotal" @pagination="loadApplications" />
          <el-empty v-if="!applicationLoading && !applications.length" description="暂无单项审批记录" />
        </el-tab-pane>

        <el-tab-pane name="imports">
          <template #label><span class="tab-label"><el-icon><Upload /></el-icon>批量导入</span></template>
          <el-form :model="batchQuery" :inline="true" @submit.prevent class="history-filter">
            <el-form-item label="批次号"><el-input v-model="batchQuery.batchNo" clearable placeholder="批次号" @keyup.enter="searchBatches" /></el-form-item>
            <el-form-item label="状态"><el-select v-model="batchQuery.status" clearable placeholder="全部状态" style="width: 150px"><el-option v-for="item in batchStatusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" icon="Search" @click="searchBatches">查询</el-button><el-button icon="Refresh" @click="resetBatches">重置</el-button></el-form-item>
          </el-form>
          <DepartmentDataTable v-loading="batchLoading" :data="batches" border>
            <el-table-column label="批次号" prop="batchNo" width="190" show-overflow-tooltip />
            <el-table-column label="业务" min-width="170"><template #default="scope"><div class="business-cell"><strong>{{ scope.row.businessName || businessTypeName(scope.row.businessType) }}</strong><small>{{ scope.row.sourceFileName || '未记录文件名' }}</small></div></template></el-table-column>
            <el-table-column label="数据量" width="105" align="center"><template #default="scope">{{ scope.row.totalCount || 0 }} 条</template></el-table-column>
            <el-table-column label="泛微申请" width="110" align="center"><template #default="scope">{{ scope.row.applicationCount || 0 }} 份</template></el-table-column>
            <el-table-column label="状态" width="115" align="center"><template #default="scope"><el-tag :type="batchStatusType(scope.row.status)">{{ batchStatusLabel(scope.row.status) }}</el-tag></template></el-table-column>
            <el-table-column label="说明" min-width="220" show-overflow-tooltip><template #default="scope">{{ scope.row.message || '—' }}</template></el-table-column>
            <el-table-column label="操作" fixed="right" width="180" align="center"><template #default="scope"><div class="history-actions"><el-button link type="primary" @click="openBatchDetail(scope.row)">详情</el-button><el-button v-if="canHandleBatch(scope.row)" link type="warning" @click="handleBatch(scope.row)">去处理</el-button></div></template></el-table-column>
          </DepartmentDataTable>
          <pagination v-show="batchTotal > 0" v-model:page="batchQuery.pageNum" v-model:limit="batchQuery.pageSize" :total="batchTotal" @pagination="loadBatches" />
          <el-empty v-if="!batchLoading && !batches.length" description="暂无批量导入记录" />
        </el-tab-pane>
      </DepartmentPageTabs>
    </el-card>

    <el-drawer v-model="applicationDrawer.visible" title="申请详情" size="560px" append-to-body>
      <el-descriptions v-if="selectedApplication" :column="1" border>
        <el-descriptions-item label="申请编号">{{ selectedApplication.applicationNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ businessTypeName(selectedApplication.businessType) }}</el-descriptions-item>
        <el-descriptions-item label="审批流程">{{ selectedApplication.workflowName || selectedApplication.workflowId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="申请标题">{{ selectedApplication.title || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="applicationStatusType(selectedApplication.status)">{{ applicationStatusLabel(selectedApplication.status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="泛微 requestId">{{ selectedApplication.oaRequestId || '尚未生成' }}</el-descriptions-item>
        <el-descriptions-item label="失败原因"><el-text v-if="selectedApplication.failReason" type="danger">{{ selectedApplication.failReason }}</el-text><span v-else>—</span></el-descriptions-item>
        <el-descriptions-item label="申请内容"><div class="detail-content">{{ selectedApplication.content || '—' }}</div></el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button v-if="selectedApplication?.oaLink" type="primary" @click="openOa(selectedApplication.oaLink)">打开泛微</el-button><el-button v-if="selectedApplication && canHandleApplication(selectedApplication)" @click="handleApplication(selectedApplication)">去处理</el-button></template>
    </el-drawer>

    <el-drawer v-model="batchDrawer.visible" title="导入批次详情" size="560px" append-to-body>
      <el-descriptions v-if="selectedBatch" :column="1" border>
        <el-descriptions-item label="批次号">{{ selectedBatch.batchNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="业务">{{ selectedBatch.businessName || businessTypeName(selectedBatch.businessType) }}</el-descriptions-item>
        <el-descriptions-item label="来源文件">{{ selectedBatch.sourceFileName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="数据量">{{ selectedBatch.totalCount || 0 }} 条</el-descriptions-item>
        <el-descriptions-item label="分组数量">{{ selectedBatch.groupCount || 0 }} 组</el-descriptions-item>
        <el-descriptions-item label="泛微申请">{{ selectedBatch.applicationCount || 0 }} 份</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="batchStatusType(selectedBatch.status)">{{ batchStatusLabel(selectedBatch.status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="说明">{{ selectedBatch.message || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer><el-button v-if="selectedBatch && canHandleBatch(selectedBatch)" type="primary" @click="handleBatch(selectedBatch)">去处理</el-button></template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DocumentChecked, Upload } from '@element-plus/icons-vue';
import modal from '@/plugins/modal';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentPageTabs from '@/components/Department/PageTabs.vue';
import { getOaApplication, listOaApplications, listOaBusinessTypes } from '@/api/ecology';
import { getOaImportBatch, listOaImportBatches } from '@/api/ecology/importBusiness';
import type { OaApplicationQuery, OaApplicationVO, OaBusinessTypeVO } from '@/api/ecology/types';
import type { OaImportBatchQuery, OaImportBatchVO } from '@/api/ecology/importBusinessTypes';

const route = useRoute();
const router = useRouter();
const activeTab = ref(typeof route.query.tab === 'string' && route.query.tab === 'imports' ? 'imports' : 'applications');
const loading = ref(false);
const applicationLoading = ref(false);
const batchLoading = ref(false);
const businessTypes = ref<OaBusinessTypeVO[]>([]);
const applications = ref<OaApplicationVO[]>([]);
const batches = ref<OaImportBatchVO[]>([]);
const applicationTotal = ref(0);
const batchTotal = ref(0);
const selectedApplication = ref<OaApplicationVO>();
const selectedBatch = ref<OaImportBatchVO>();
const applicationDrawer = reactive({ visible: false });
const batchDrawer = reactive({ visible: false });
const applicationQuery = reactive<OaApplicationQuery>({ pageNum: 1, pageSize: 10, title: undefined, status: undefined, businessType: undefined, monitor: false });
const batchQuery = reactive<OaImportBatchQuery>({ pageNum: 1, pageSize: 10, batchNo: '', status: '' });
const applicationStatusOptions = [{ label: '草稿', value: 'DRAFT' }, { label: '提交中', value: 'SUBMITTING' }, { label: '审批中', value: 'IN_PROGRESS' }, { label: '已通过', value: 'APPROVED' }, { label: '已驳回', value: 'REJECTED' }, { label: '提交失败', value: 'FAILED' }, { label: '待核对', value: 'UNKNOWN' }];
const batchStatusOptions = [{ label: '待处理', value: 'NEED_MAPPING' }, { label: '待提交', value: 'READY' }, { label: '提交中', value: 'SUBMITTING' }, { label: '已提交', value: 'SUBMITTED' }, { label: '部分失败', value: 'PARTIAL_FAILED' }, { label: '提交失败', value: 'FAILED' }];

const overviewItems = computed(() => [
  { label: '单项审批', value: applicationTotal.value, hint: '本人提交', tone: 'blue' },
  { label: '批量导入', value: batchTotal.value, hint: '本人批次', tone: 'cyan' },
  { label: '待处理申请', value: applications.value.filter((item) => ['DRAFT', 'FAILED', 'UNKNOWN'].includes(item.status)).length, hint: '当前页', tone: 'orange' },
  { label: '待处理批次', value: batches.value.filter((item) => ['NEED_MAPPING', 'READY', 'PARTIAL_FAILED', 'FAILED'].includes(item.status || '')).length, hint: '当前页', tone: 'green' }
]);
const applicationStatusLabel = (status?: string) => applicationStatusOptions.find((item) => item.value === status)?.label || status || '未知';
const applicationStatusType = (status?: string) => ({ APPROVED: 'success', REJECTED: 'danger', FAILED: 'danger', UNKNOWN: 'danger', SUBMITTING: 'warning', IN_PROGRESS: 'warning' }[status || ''] || 'info') as 'success' | 'warning' | 'danger' | 'info';
const batchStatusLabel = (status?: string) => ({ NEED_MAPPING: '待处理组织', READY: '待提交', SUBMITTING: '提交中', SUBMITTED: '已提交', PARTIAL_FAILED: '部分失败', FAILED: '提交失败', SKIPPED: '已跳过' }[status || ''] || status || '未知');
const batchStatusType = (status?: string) => ({ SUBMITTED: 'success', PARTIAL_FAILED: 'warning', FAILED: 'danger', NEED_MAPPING: 'warning', READY: 'info', SUBMITTING: 'warning' }[status || ''] || 'info') as 'success' | 'warning' | 'danger' | 'info';
const businessTypeName = (value?: string) => businessTypes.value.find((item) => item.businessType === value)?.businessName || value || '—';
const canHandleApplication = (row: OaApplicationVO) => ['DRAFT', 'FAILED', 'UNKNOWN'].includes(row.status);
const canHandleBatch = (row: OaImportBatchVO) => ['NEED_MAPPING', 'READY', 'PARTIAL_FAILED', 'FAILED'].includes(row.status || '');

const loadApplications = async () => { applicationLoading.value = true; try { const res = await listOaApplications(applicationQuery); applications.value = res.data?.rows || []; applicationTotal.value = res.data?.total || 0; } finally { applicationLoading.value = false; } };
const loadBatches = async () => { batchLoading.value = true; try { const res = await listOaImportBatches(batchQuery); batches.value = res.data?.rows || []; batchTotal.value = res.data?.total || 0; } finally { batchLoading.value = false; } };
const refresh = async () => {
  loading.value = true;
  try {
    const results = await Promise.allSettled([
      listOaBusinessTypes(undefined, false).then((res) => { businessTypes.value = res.data || []; }),
      loadApplications(),
      loadBatches()
    ]);
    if (results.some((item) => item.status === 'rejected')) modal.msgWarning('部分申请数据加载失败，请稍后刷新重试');
  } finally {
    loading.value = false;
  }
};
const handleTabChange = (tab: string | number) => { activeTab.value = String(tab); if (activeTab.value === 'imports') void loadBatches(); else void loadApplications(); };
const searchApplications = () => { applicationQuery.pageNum = 1; void loadApplications(); };
const resetApplications = () => { applicationQuery.title = undefined; applicationQuery.status = undefined; searchApplications(); };
const searchBatches = () => { batchQuery.pageNum = 1; void loadBatches(); };
const resetBatches = () => { batchQuery.batchNo = ''; batchQuery.status = ''; searchBatches(); };
const openApplicationDetail = async (row: OaApplicationVO) => { applicationDrawer.visible = true; selectedApplication.value = undefined; try { selectedApplication.value = await getOaApplication(row.id).then((res) => res.data); } catch (error) { console.error('加载申请详情失败', error); applicationDrawer.visible = false; modal.msgError('申请详情加载失败，请刷新后重试'); } };
const openBatchDetail = async (row: OaImportBatchVO) => { batchDrawer.visible = true; selectedBatch.value = undefined; try { selectedBatch.value = await getOaImportBatch(row.id).then((res) => res.data); } catch (error) { console.error('加载批次详情失败', error); batchDrawer.visible = false; modal.msgError('批次详情加载失败，请刷新后重试'); } };
const handleApplication = (row: OaApplicationVO) => { applicationDrawer.visible = false; router.push({ path: '/department/ecology/application', query: { tab: 'application', mode: 'submit', focusId: String(row.id) } }); };
const handleBatch = (row: OaImportBatchVO) => { batchDrawer.visible = false; router.push({ path: '/department/importBusiness', query: { batchId: String(row.id) } }); };
const openOa = (url?: string) => { if (url) window.open(url, '_blank', 'noopener,noreferrer'); };

watch(() => route.query.tab, (tab) => { if (tab === 'imports' || tab === 'applications') activeTab.value = tab; });
onMounted(async () => { await refresh(); });
</script>

<style scoped lang="scss">
.ecology-my-application-page { padding: 18px 20px 30px; background: var(--app-page-bg); }.history-hero, .history-card, .history-stat { border: 1px solid var(--app-surface-border); border-radius: 18px; background: var(--app-surface-bg); box-shadow: 0 12px 30px rgba(15, 23, 42, .05); }.history-hero :deep(.el-card__body) { display: flex; align-items: center; justify-content: space-between; gap: 28px; padding: 28px 34px; background: linear-gradient(120deg, var(--app-surface-bg), color-mix(in srgb, var(--el-color-primary) 8%, var(--app-surface-bg))); }.history-eyebrow { display: inline-flex; align-items: center; gap: 7px; color: var(--el-color-primary); font-size: 11px; font-weight: 800; letter-spacing: .16em; }.history-hero h2 { margin: 10px 0 7px; color: var(--app-text-title); font-size: 28px; }.history-hero p { max-width: 780px; margin: 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; }.history-overview { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 14px 0; }.history-stat :deep(.el-card__body) { position: relative; min-height: 85px; padding: 14px 17px; overflow: hidden; }.history-stat :deep(.el-card__body)::after { position: absolute; right: -25px; bottom: -35px; width: 95px; height: 95px; border-radius: 50%; background: currentColor; content: ''; opacity: .06; }.history-stat span, .history-stat strong, .history-stat small { display: block; }.history-stat span, .history-stat small { color: var(--el-text-color-secondary); font-size: 11px; }.history-stat strong { margin: 5px 0; color: currentColor; font-size: 24px; }.history-stat--blue { color: #4b9ee8; }.history-stat--cyan { color: #3ca6b8; }.history-stat--orange { color: #d58a32; }.history-stat--green { color: #71ad3d; }.history-card { padding: 0 20px 18px; }.history-filter { padding: 4px 0 0; }.tab-label { display: inline-flex; align-items: center; gap: 6px; }.history-actions { display: inline-flex; gap: 2px; }.business-cell strong, .business-cell small { display: block; }.business-cell strong { color: var(--app-text-title); }.business-cell small { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 11px; }.detail-content { white-space: pre-wrap; line-height: 1.7; }
@media (max-width: 900px) { .history-hero :deep(.el-card__body) { align-items: flex-start; flex-direction: column; }.history-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .ecology-my-application-page { padding: 12px; }.history-overview { grid-template-columns: 1fr; }.history-card { padding: 0 10px 15px; } }
</style>
