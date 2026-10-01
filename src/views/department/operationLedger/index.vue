<template>
  <div class="p-2 app-container department-operation-ledger-page">
    <UiCard shadow="hover" class="summary-panel mt-2">
      <template #header>
        <DepartmentPanelHeader kicker="Operation Ledger" title="运维指标" description="指标来自运维工作记录与系统在线率台账" />
      </template>
      <DepartmentMetricGrid :columns="5">
        <DepartmentMetricCard :value="summary.totalCount" label="运维总量" tone="blue" />
        <DepartmentMetricCard :value="summary.resolvedCount" label="已解决记录" tone="green" />
        <DepartmentMetricCard :value="`${summary.resolutionRate}%`" label="运维解决率" tone="teal" />
        <DepartmentMetricCard :value="`${summary.averageProcessingMinutes}分钟`" label="平均处理时长" tone="orange" />
        <DepartmentMetricCard :value="`${summary.onlineRate}%`" label="系统在线率" tone="red" />
      </DepartmentMetricGrid>
    </UiCard>

    <UiCard shadow="hover" class="table-panel mt-2">
      <template #header>
        <DepartmentPanelHeader title="运维台账" description="工作记录与系统在线率分开维护，并参与周报/PPT统计。" />
      </template>

      <DepartmentPageTabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="工作记录" name="records">
          <div class="sub-toolbar record-toolbar">
            <span>维护日常运维处理记录，支持手动新增或 Excel 批量导入。</span>
            <div class="toolbar-actions">
              <UiButton v-hasPermi="['department:operationLedger:add']" type="primary" plain icon="Plus" @click="handleAddRecord">手动新增</UiButton>
              <UiButton v-hasPermi="['department:operationLedger:import']" type="info" plain icon="Upload" @click="openRecordUpload">导入工作记录</UiButton>
              <UiButton v-hasPermi="['department:operationLedger:export']" type="warning" plain icon="Download" @click="handleExportRecords">导出工作记录</UiButton>
            </div>
          </div>
          <UiCard shadow="never" class="search-panel ledger-search-panel record-search-panel">
            <el-form :inline="true" label-position="top" class="query-form" @submit.prevent>
              <div class="query-form__fields">
                <el-form-item label="请求日期" class="query-item query-item--date">
                  <UiDatePicker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" clearable />
                </el-form-item>
                <el-form-item label="客户单位" class="query-item query-item--customer"><UiInput v-model="queryParams.customerUnit" clearable placeholder="请输入客户单位" /></el-form-item>
                <el-form-item label="项目" class="query-item query-item--project">
                  <UiSelect v-model="queryParams.projectId" :options="projectSelectOptions" clearable filterable placeholder="全部项目" />
                </el-form-item>
                <el-form-item label="系统 / 项目关键字" class="query-item query-item--keyword"><UiInput v-model="queryParams.systemName" clearable placeholder="兼容历史文本" /></el-form-item>
                <el-form-item label="处理状态" class="query-item query-item--status">
                  <UiSelect v-model="queryParams.processStatus" :options="statusOptions" clearable placeholder="全部状态" />
                </el-form-item>
              </div>
              <div class="query-form__actions">
                <UiButton type="primary" class="query-primary-button" icon="Search" @click="handleQuery">查询</UiButton>
                <UiButton class="query-reset-button" icon="Refresh" @click="resetQuery">重置</UiButton>
              </div>
            </el-form>
          </UiCard>
          <DepartmentDataTable :loading="recordLoading" border :data="recordList">
            <el-table-column label="请求时间" prop="requestTime" width="165" align="center" />
            <el-table-column label="客户单位" prop="customerUnit" min-width="150" show-overflow-tooltip />
            <el-table-column label="项目" min-width="150" show-overflow-tooltip>
              <template #default="scope">{{ scope.row.projectName || scope.row.systemName || '未绑定项目' }}</template>
            </el-table-column>
            <el-table-column label="请求人/岗位" min-width="150" show-overflow-tooltip>
              <template #default="scope">{{ scope.row.requestPerson || '—' }} / {{ scope.row.requestRoleType || '—' }}</template>
            </el-table-column>
            <el-table-column label="处理人" prop="handler" width="110" align="center" />
            <el-table-column label="处理方式" prop="processMethod" min-width="130" show-overflow-tooltip />
            <el-table-column label="处理耗时" width="100" align="center">
              <template #default="scope">{{ scope.row.processingMinutes == null ? '—' : `${scope.row.processingMinutes}分钟` }}</template>
            </el-table-column>
            <el-table-column label="状态" prop="processStatus" width="100" align="center">
              <template #default="scope"><UiTag :type="statusType(scope.row.processStatus)">{{ statusLabel(scope.row.processStatus) }}</UiTag></template>
            </el-table-column>
            <el-table-column label="业务描述" prop="businessDescription" min-width="230" show-overflow-tooltip />
            <el-table-column label="来源" width="90" align="center">
              <template #default="scope">{{ scope.row.sourceType === 'EXCEL' ? 'Excel' : '手动' }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="130" align="center">
              <template #default="scope">
                <DepartmentTableActions>
                  <UiButton v-hasPermi="['department:operationLedger:edit']" link type="primary" icon="Edit" @click="handleUpdateRecord(asOperationRecordRow(scope.row))">编辑</UiButton>
                  <UiButton v-hasPermi="['department:operationLedger:remove']" link type="danger" icon="Delete" @click="handleDeleteRecord(asOperationRecordRow(scope.row))" />
                </DepartmentTableActions>
              </template>
            </el-table-column>
          </DepartmentDataTable>
          <UiPagination v-show="recordTotal > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="recordTotal" @pagination="getRecordList" />
        </el-tab-pane>

        <el-tab-pane label="系统在线率" name="systems">
          <div class="sub-toolbar">
            <span>在线率用于计算周报中的系统在线率，导入《系统运维报告》后默认归档到本周周一。</span>
            <div class="toolbar-actions">
              <UiButton v-hasPermi="['department:operationLedger:add']" type="primary" plain icon="Plus" @click="handleAddSystem">新增系统指标</UiButton>
              <UiButton v-hasPermi="['department:operationLedger:import']" type="info" plain icon="Upload" @click="openSystemUpload">导入系统运维报告</UiButton>
              <UiButton v-hasPermi="['department:operationLedger:export']" type="warning" plain icon="Download" @click="handleExportSystems">导出在线率</UiButton>
            </div>
          </div>
          <DepartmentDataTable :loading="systemLoading" border :data="systemList">
            <el-table-column label="统计日期" prop="statDate" width="115" align="center" />
            <el-table-column label="项目" prop="projectName" min-width="160" show-overflow-tooltip />
            <el-table-column label="系统名称" prop="systemName" min-width="160" show-overflow-tooltip />
            <el-table-column label="负责人" prop="responsiblePerson" width="110" align="center" />
            <el-table-column label="在线时长(天)" prop="onlineDays" width="120" align="center" />
            <el-table-column label="停机时间(分钟)" prop="downtimeMinutes" width="130" align="center" />
            <el-table-column label="系统在线率" width="110" align="center"><template #default="scope">{{ scope.row.onlineRate == null ? '—' : `${scope.row.onlineRate}%` }}</template></el-table-column>
            <el-table-column label="操作" fixed="right" width="130" align="center">
              <template #default="scope">
                <DepartmentTableActions>
                  <UiButton v-hasPermi="['department:operationLedger:edit']" link type="primary" icon="Edit" @click="handleUpdateSystem(asOperationSystemRow(scope.row))">编辑</UiButton>
                  <UiButton v-hasPermi="['department:operationLedger:remove']" link type="danger" icon="Delete" @click="handleDeleteSystem(asOperationSystemRow(scope.row))" />
                </DepartmentTableActions>
              </template>
            </el-table-column>
          </DepartmentDataTable>
          <UiPagination v-show="systemTotal > 0" v-model:page="systemParams.pageNum" v-model:limit="systemParams.pageSize" :total="systemTotal" @pagination="getSystemList" />
        </el-tab-pane>
      </DepartmentPageTabs>
    </UiCard>

    <UiDialog v-model="recordDialog.visible" :title="recordDialog.title" width="820px" append-to-body>
      <el-form ref="recordFormRef" class="operation-record-form" :model="recordForm" label-width="110px">
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="请求人"><UiInput v-model="recordForm.requestPerson" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="客户单位"><UiInput v-model="recordForm.customerUnit" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="请求岗位类型"><UiInput v-model="recordForm.requestRoleType" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理人"><UiInput v-model="recordForm.handler" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="请求时间"><UiDatePicker v-model="recordForm.requestTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理时间"><UiDatePicker v-model="recordForm.processTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="完成时间"><UiDatePicker v-model="recordForm.completionTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理状态"><UiSelect v-model="recordForm.processStatus" :options="statusOptions" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理方式"><UiInput v-model="recordForm.processMethod" /></el-form-item></el-col>
           <el-col :span="12">
             <el-form-item label="项目">
               <UiSelect v-model="recordForm.projectId" :options="projectSelectOptions" clearable filterable placeholder="请选择项目" style="width: 100%" />
             </el-form-item>
           </el-col>
          <el-col :span="12">
            <el-form-item label="故障类型">
              <UiSelect v-model="recordForm.faultType" :options="faultTypeSelectOptions" clearable filterable placeholder="请选择故障类型" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="提交人"><UiInput v-model="recordForm.submitter" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="是否午休"><el-checkbox v-model="recordForm.lunchBreak" true-label="1" false-label="0">扣除午休2小时</el-checkbox></el-form-item></el-col>
        </el-row>
        <el-form-item label="业务描述"><UiTextarea v-model="recordForm.businessDescription" :rows="3" :maxlength="4000" show-word-limit /></el-form-item>
        <el-form-item label="解决方案"><UiTextarea v-model="recordForm.solution" :rows="3" :maxlength="4000" show-word-limit /></el-form-item>
        <el-form-item label="备注"><UiTextarea v-model="recordForm.remark" :rows="2" :maxlength="1000" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><UiButton type="primary" :loading="buttonLoading" @click="submitRecord">保存</UiButton><UiButton @click="recordDialog.visible = false">取消</UiButton></template>
    </UiDialog>

    <UiDialog v-model="systemDialog.visible" :title="systemDialog.title" width="700px" append-to-body>
      <el-form class="operation-system-form" :model="systemForm" label-width="125px">
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="统计日期"><UiDatePicker v-model="systemForm.statDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="项目">
            <UiSelect v-model="systemForm.projectId" :options="projectSelectOptions" clearable filterable placeholder="请选择项目" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="系统名称"><UiInput v-model="systemForm.systemName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="负责人"><UiInput v-model="systemForm.responsiblePerson" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="在线时长(天)"><UiNumberInput v-model="systemForm.onlineDays" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="停机时间(分钟)"><UiNumberInput v-model="systemForm.downtimeMinutes" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="系统在线率(%)"><UiNumberInput v-model="systemForm.onlineRate" :min="0" :max="100" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><UiTextarea v-model="systemForm.remark" :rows="2" :maxlength="1000" /></el-form-item>
      </el-form>
      <template #footer><UiButton type="primary" :loading="buttonLoading" @click="submitSystem">保存</UiButton><UiButton @click="systemDialog.visible = false">取消</UiButton></template>
    </UiDialog>

    <UiDialog v-model="recordUpload.open" title="导入工作记录" width="520px" append-to-body @close="resetRecordUpload">
      <UiUpload ref="recordUploadRef" drag :limit="1" accept=".xlsx,.xls" :headers="recordUpload.headers" :action="recordUpload.url" :auto-upload="false" :disabled="recordUpload.isUploading" :on-change="handleRecordUploadChange" :on-remove="handleRecordUploadRemove" :on-success="handleRecordUploadSuccess" :on-error="handleRecordUploadError">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">上传《物流系统科日常管理表》或“工作记录”工作表</div>
        <template #tip><div class="el-upload__tip">系统会按工作记录表头读取数据，响应耗时和处理耗时优先按时间自动计算。</div></template>
      </UiUpload>
      <template #footer><UiButton type="primary" :loading="recordUpload.isUploading" @click="submitRecordUpload">开始导入</UiButton><UiButton @click="recordUpload.open = false">取消</UiButton></template>
    </UiDialog>

    <UiDialog v-model="systemUpload.open" title="导入系统运维报告" width="520px" append-to-body @close="resetSystemUpload">
      <UiUpload ref="systemUploadRef" drag :limit="1" accept=".xlsx,.xls" :headers="systemUpload.headers" :action="systemUpload.url" :auto-upload="false" :disabled="systemUpload.isUploading" :on-change="handleSystemUploadChange" :on-remove="handleSystemUploadRemove" :on-success="handleSystemUploadSuccess" :on-error="handleSystemUploadError">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">上传包含“系统运维报告”工作表的 Excel</div>
        <template #tip><div class="el-upload__tip">导入文件建议包含“项目”列；统计日期默认使用本周周一，可在系统在线率页编辑。</div></template>
      </UiUpload>
      <template #footer><UiButton type="primary" :loading="systemUpload.isUploading" @click="submitSystemUpload">开始导入</UiButton><UiButton @click="systemUpload.open = false">取消</UiButton></template>
    </UiDialog>
  </div>
</template>

<script setup name="DepartmentOperationLedger" lang="ts">
import type { TagProps } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import DepartmentPageTabs from '@/components/Department/PageTabs.vue';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentMetricCard from '@/components/Department/MetricCard.vue';
import DepartmentMetricGrid from '@/components/Department/MetricGrid.vue';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { download as requestDownload, globalHeaders } from '@/utils/request';
import {
  addOperationRecord,
  addOperationSystem,
  delOperationRecord,
  delOperationSystem,
  getOperationRecord,
  getOperationSummary,
  getOperationSystem,
  listOperationRecord,
  listOperationSystem,
  updateOperationRecord,
  updateOperationSystem
} from '@/api/department/operationLedger';
import { listDepartmentProjectOptions } from '@/api/department/project';
import type { OperationRecordForm, OperationRecordQuery, OperationRecordVO, OperationSummaryVO, OperationSystemForm, OperationSystemQuery, OperationSystemVO } from '@/api/department/operationLedger/types';
import type { DepartmentProjectVO } from '@/api/department/project/types';
import { useDict } from '@/utils/dict';
import { UiButton, UiCard, UiDatePicker, UiDialog, UiInput, UiNumberInput, UiPagination, UiSelect, UiTag, UiTextarea, UiUpload } from '@/components/UiKit';

const { dm_fault_type } = toRefs<any>(useDict('dm_fault_type'));

const { loading: recordLoading, withLoading: withRecordLoading } = useLoading(true);
const { loading: systemLoading, withLoading: withSystemLoading } = useLoading(true);
const dateRange = ref<string[]>([]);
const activeTab = ref('records');
const recordList = ref<OperationRecordVO[]>([]);
const systemList = ref<OperationSystemVO[]>([]);
const projectOptions = ref<DepartmentProjectVO[]>([]);
const projectSelectOptions = computed(() => projectOptions.value.map(item => ({ value: item.id, label: item.projectName })));
const recordTotal = ref(0);
const systemTotal = ref(0);
const buttonLoading = ref(false);
const recordUploadRef = ref<any>();
const systemUploadRef = ref<any>();
const recordUploadFile = ref<any>();
const systemUploadFile = ref<any>();
const summary = reactive<OperationSummaryVO>({ totalCount: 0, resolvedCount: 0, resolutionRate: 0, averageProcessingMinutes: 0, onlineRate: 0, unattributedCount: 0, bySystem: [], byFaultType: [], byProcessMethod: [] });
const queryParams = reactive<OperationRecordQuery>({ pageNum: 1, pageSize: 10, beginDate: undefined, endDate: undefined, customerUnit: undefined, projectId: undefined, systemName: undefined, processStatus: undefined, processMethod: undefined, keyword: undefined });
const systemParams = reactive<OperationSystemQuery>({ pageNum: 1, pageSize: 10, beginDate: undefined, endDate: undefined, systemName: undefined });
const recordForm = reactive<OperationRecordForm>({ processStatus: 'PROCESSING', lunchBreak: '0' });
const systemForm = reactive<OperationSystemForm>({ statDate: getCurrentMonday(), onlineRate: undefined, projectId: undefined });
const recordDialog = reactive({ visible: false, title: '' });
const systemDialog = reactive({ visible: false, title: '' });
const recordUpload = reactive({ open: false, isUploading: false, headers: globalHeaders(), url: import.meta.env.VITE_APP_BASE_API + '/department/operationLedger/importData' });
const systemUpload = reactive({ open: false, isUploading: false, headers: globalHeaders(), url: import.meta.env.VITE_APP_BASE_API + '/department/operationLedger/importSystemData' });
const statusOptions = [{ label: '处理中', value: 'PROCESSING' }, { label: '已完成', value: 'COMPLETED' }, { label: '已取消', value: 'CANCELLED' }];
const faultTypeSelectOptions = computed(() => (dm_fault_type.value || []).map((item: any) => ({ value: item.value, label: item.label })));
function getCurrentMonday() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return formatDate(date);
}

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function statusLabel(status: string) { return statusOptions.find(item => item.value === status)?.label || status; }
function statusType(status: string): TagProps['type'] {
  return ({ PROCESSING: 'warning', COMPLETED: 'success', CANCELLED: 'info' } satisfies Record<string, TagProps['type']>)[status] || 'info';
}
/** 表格插槽默认使用 Element Plus 的通用行类型，在业务动作边界恢复具体类型。 */
const asOperationRecordRow = (row: unknown): OperationRecordVO => row as OperationRecordVO;
const asOperationSystemRow = (row: unknown): OperationSystemVO => row as OperationSystemVO;

const syncDateParams = () => {
  queryParams.beginDate = dateRange.value?.[0];
  queryParams.endDate = dateRange.value?.[1];
  systemParams.beginDate = dateRange.value?.[0];
  systemParams.endDate = dateRange.value?.[1];
};

const getSummary = async () => {
  if (!queryParams.beginDate || !queryParams.endDate) return;
  const res = await getOperationSummary(queryParams.beginDate, queryParams.endDate);
  Object.assign(summary, res.data);
};

const getRecordList = async () => {
  await withRecordLoading(async () => {
    const res = await listOperationRecord(queryParams);
    recordList.value = res.data?.rows || [];
    recordTotal.value = res.data?.total || 0;
  });
};

const getSystemList = async () => {
  await withSystemLoading(async () => {
    const res = await listOperationSystem(systemParams);
    systemList.value = res.data?.rows || [];
    systemTotal.value = res.data?.total || 0;
  });
};

const getProjectOptions = async () => {
  const res = await listDepartmentProjectOptions();
  projectOptions.value = res.data || [];
};

const handleQuery = () => { queryParams.pageNum = 1; systemParams.pageNum = 1; syncDateParams(); getSummary(); getRecordList(); getSystemList(); };
const resetQuery = () => { dateRange.value = []; queryParams.customerUnit = undefined; queryParams.projectId = undefined; queryParams.systemName = undefined; queryParams.processStatus = undefined; queryParams.processMethod = undefined; queryParams.keyword = undefined; handleQuery(); };
const handleTabChange = (name: string) => { if (name === 'systems' && !systemList.value.length) getSystemList(); };

const resetRecordForm = () => Object.assign(recordForm, { id: undefined, requestPerson: undefined, customerUnit: undefined, requestRoleType: undefined, requestTime: undefined, handler: undefined, processTime: undefined, completionTime: undefined, responseMinutes: undefined, processingMinutes: undefined, lunchBreak: '0', processStatus: 'PROCESSING', processMethod: undefined, submitter: undefined, projectId: undefined, systemName: undefined, faultType: undefined, businessDescription: undefined, solution: undefined, remark: undefined });
const handleAddRecord = () => { resetRecordForm(); recordDialog.title = '新增运维工作记录'; recordDialog.visible = true; };
const handleUpdateRecord = async (row: OperationRecordVO) => { const res = await getOperationRecord(row.id); Object.assign(recordForm, res.data); recordDialog.title = '编辑运维工作记录'; recordDialog.visible = true; };
const submitRecord = async () => { if (!recordForm.projectId) return modal.msgWarning('请选择项目'); buttonLoading.value = true; try { if (recordForm.id) await updateOperationRecord(recordForm); else await addOperationRecord(recordForm); modal.msgSuccess('运维记录保存成功'); recordDialog.visible = false; await Promise.all([getRecordList(), getSummary()]); } finally { buttonLoading.value = false; } };
const handleDeleteRecord = async (row: OperationRecordVO) => { await modal.confirm(`确认删除 ${row.requestTime || row.businessDescription || '该运维记录'} 吗？`); await delOperationRecord(row.id); modal.msgSuccess('删除成功'); await Promise.all([getRecordList(), getSummary()]); };

const resetSystemForm = () => Object.assign(systemForm, { id: undefined, projectId: undefined, statDate: getCurrentMonday(), systemName: undefined, responsiblePerson: undefined, onlineDays: undefined, downtimeMinutes: undefined, onlineRate: undefined, remark: undefined });
const handleAddSystem = () => { resetSystemForm(); systemDialog.title = '新增系统在线率'; systemDialog.visible = true; };
const handleUpdateSystem = async (row: OperationSystemVO) => { const res = await getOperationSystem(row.id); Object.assign(systemForm, res.data); systemDialog.title = '编辑系统在线率'; systemDialog.visible = true; };
const submitSystem = async () => { if (!systemForm.statDate || !systemForm.projectId || !systemForm.systemName) return modal.msgWarning('统计日期、项目和系统名称不能为空'); buttonLoading.value = true; try { if (systemForm.id) await updateOperationSystem(systemForm); else await addOperationSystem(systemForm); modal.msgSuccess('系统在线率保存成功'); systemDialog.visible = false; await Promise.all([getSystemList(), getSummary()]); } finally { buttonLoading.value = false; } };
const handleDeleteSystem = async (row: OperationSystemVO) => { await modal.confirm(`确认删除 ${row.systemName} 的在线率记录吗？`); await delOperationSystem(row.id); modal.msgSuccess('删除成功'); await Promise.all([getSystemList(), getSummary()]); };

const resetRecordUpload = () => { recordUpload.isUploading = false; recordUploadFile.value = undefined; recordUploadRef.value?.clearFiles(); };
const resetSystemUpload = () => { systemUpload.isUploading = false; systemUploadFile.value = undefined; systemUploadRef.value?.clearFiles(); };
const openRecordUpload = () => { resetRecordUpload(); recordUpload.open = true; };
const openSystemUpload = () => { resetSystemUpload(); systemUpload.open = true; };
const handleRecordUploadChange = (uploadFile: any, uploadFiles: any[]) => { recordUploadFile.value = uploadFiles.find(file => file.raw) || uploadFile; };
const handleSystemUploadChange = (uploadFile: any, uploadFiles: any[]) => { systemUploadFile.value = uploadFiles.find(file => file.raw) || uploadFile; };
const handleRecordUploadRemove = () => { recordUploadFile.value = undefined; recordUpload.isUploading = false; };
const handleSystemUploadRemove = () => { systemUploadFile.value = undefined; systemUpload.isUploading = false; };
const submitRecordUpload = () => {
  const file = recordUploadFile.value;
  if (!file?.raw) {
    recordUpload.isUploading = false;
    modal.msgWarning('请先选择要导入的 Excel 文件');
    return;
  }
  recordUpload.isUploading = true;
  recordUploadRef.value?.submit();
};
const submitSystemUpload = () => {
  const file = systemUploadFile.value;
  if (!file?.raw) {
    systemUpload.isUploading = false;
    modal.msgWarning('请先选择要导入的 Excel 文件');
    return;
  }
  systemUpload.isUploading = true;
  systemUploadRef.value?.submit();
};
const handleRecordUploadSuccess = (response: any) => {
  recordUpload.isUploading = false;
  if (response?.code !== undefined && response.code !== 200) {
    recordUploadFile.value = undefined;
    recordUploadRef.value?.clearFiles();
    modal.msgError(response?.msg || '工作记录导入失败');
    return;
  }
  recordUpload.open = false;
  modal.msgSuccess(response?.msg || '工作记录导入完成');
  getRecordList();
  getSummary();
};
const handleSystemUploadSuccess = (response: any) => {
  systemUpload.isUploading = false;
  if (response?.code !== undefined && response.code !== 200) {
    systemUploadFile.value = undefined;
    systemUploadRef.value?.clearFiles();
    modal.msgError(response?.msg || '系统运维报告导入失败');
    return;
  }
  systemUpload.open = false;
  modal.msgSuccess(response?.msg || '系统运维报告导入完成');
  getSystemList();
  getSummary();
};
const handleRecordUploadError = (error: Error) => {
  recordUpload.isUploading = false;
  recordUploadFile.value = undefined;
  recordUploadRef.value?.clearFiles();
  modal.msgError(error?.message || '工作记录导入失败');
};
const handleSystemUploadError = (error: Error) => {
  systemUpload.isUploading = false;
  systemUploadFile.value = undefined;
  systemUploadRef.value?.clearFiles();
  modal.msgError(error?.message || '系统运维报告导入失败');
};
const handleExportRecords = () => requestDownload('department/operationLedger/export', queryParams, `operation_ledger_${Date.now()}.xlsx`);
const handleExportSystems = () => requestDownload('department/operationLedger/exportSystems', { beginDate: systemParams.beginDate, endDate: systemParams.endDate, systemName: systemParams.systemName }, `operation_system_${Date.now()}.xlsx`);

onMounted(() => {
  const monday = getCurrentMonday();
  const sunday = new Date(`${monday}T00:00:00`);
  sunday.setDate(sunday.getDate() + 6);
  dateRange.value = [monday, formatDate(sunday)];
  syncDateParams();
  getSummary();
  getRecordList();
  getSystemList();
  getProjectOptions();
});
</script>

<style scoped lang="scss">
.department-operation-ledger-page {
  .ledger-search-panel,
  .summary-panel,
  .table-panel {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 18px;
    box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
  }

  .ledger-search-panel {
    overflow: hidden;
    background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-lighter) 100%);

    :deep(.el-card__body),
    :deep(.ui-animal-card__body) {
      padding: 0 !important;
    }
  }

  .record-search-panel {
    margin: 0 0 18px;
    box-shadow: 0 5px 16px rgb(15 23 42 / 4%);
  }

  .query-form {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    padding: 16px 22px 18px;
  }

  .query-form__fields {
    display: grid;
    flex: 1 1 auto;
    grid-template-columns: minmax(250px, 1.35fr) minmax(180px, 1fr) minmax(145px, .76fr) minmax(210px, 1.15fr) minmax(140px, .8fr);
    gap: 12px 14px;
    min-width: 0;
  }

  .query-item {
    min-width: 0;
    margin: 0;
  }

  :deep(.query-item .el-form-item__label) {
    height: auto;
    padding: 0 0 7px;
    color: var(--el-text-color-regular);
    font-size: 12px;
    font-weight: 700;
    line-height: 17px;
  }

  :deep(.query-item .el-form-item__content),
  :deep(.query-item .el-date-editor),
  :deep(.query-item .el-input),
  :deep(.query-item .el-select),
  :deep(.query-item .ui-animal-input-wrap),
  :deep(.query-item .ui-animal-select),
  :deep(.query-item .ui-animal-multi-select) {
    width: 100% !important;
    min-width: 0;
  }

  :deep(.query-item .el-input__wrapper),
  :deep(.query-item .el-select__wrapper) {
    min-height: 40px;
    border-radius: 11px;
    background: var(--el-bg-color);
    box-shadow: 0 0 0 1px var(--el-border-color) inset, 0 2px 5px rgb(15 23 42 / 3%);
    transition: box-shadow .2s ease, background-color .2s ease, transform .2s ease;
  }

  :deep(.query-item .el-date-editor) {
    min-height: 40px;
    padding: 0 11px;
    border-radius: 11px;
    background: var(--el-bg-color);
    box-shadow: 0 0 0 1px var(--el-border-color) inset, 0 2px 5px rgb(15 23 42 / 3%);
    transition: box-shadow .2s ease, background-color .2s ease, transform .2s ease;
  }

  :deep(.query-item .el-input__wrapper:hover),
  :deep(.query-item .el-select__wrapper:hover),
  :deep(.query-item .el-date-editor:hover) {
    box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset, 0 4px 10px rgb(64 158 255 / 10%);
  }

  :deep(.query-item .el-input__wrapper.is-focus),
  :deep(.query-item .el-select__wrapper.is-focused),
  :deep(.query-item .el-date-editor.is-active) {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 3px var(--el-color-primary-light-9);
  }

  .query-form__actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
    padding-bottom: 0;
  }

  .query-form__actions :deep(.el-button),
  .query-form__actions :deep(.ui-animal-button) {
    min-width: 78px;
    height: 40px;
    margin: 0;
    border-radius: 11px;
    font-weight: 600;
  }

  .query-primary-button {
    box-shadow: 0 5px 12px rgb(64 158 255 / 20%);
  }

  .query-reset-button {
    border-color: var(--el-border-color);
    background: var(--el-bg-color);
  }

  .sub-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .toolbar-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  :deep(.summary-panel .el-card__header),
  :deep(.table-panel .el-card__header),
  :deep(.summary-panel .ui-animal-card__header),
  :deep(.table-panel .ui-animal-card__header) {
    border-bottom-color: var(--el-border-color-extra-light);
  }

  :deep(.table-panel .el-card__body),
  :deep(.table-panel .ui-animal-card__body) {
    padding-top: 18px;
  }

  @media (max-width: 1500px) {
    .query-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: end;
    }

    .query-form__actions {
      justify-content: flex-end;
      align-self: end;
    }
  }

  @media (max-width: 1100px) {
    .query-form__fields {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .query-form {
      display: flex;
      align-items: stretch;
      flex-direction: column;
    }
  }

  @media (max-width: 700px) {
    .query-form {
      padding: 14px 16px 16px;
    }

    .query-form__fields {
      grid-template-columns: 1fr;
    }

    .query-form__actions {
      justify-content: stretch;
      width: 100%;

      :deep(.el-button),
      :deep(.ui-animal-button) {
        flex: 1;
      }
    }

    .sub-toolbar {
      align-items: flex-start;
      flex-direction: column;
    }
  }
}
</style>

<style lang="scss">
/* UiDialog 在动森模式下使用 Teleport，表单布局用语义类承接，避免 Element 的 50% 列宽和固定 label-width 造成挤压。 */
.animal-modal:has(.operation-record-form) .operation-record-form,
.animal-modal:has(.operation-system-form) .operation-system-form {
  min-width: 0;
}

.animal-modal:has(.operation-record-form) .operation-record-form .el-row,
.animal-modal:has(.operation-system-form) .operation-system-form .el-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
  margin: 0 !important;
}

.animal-modal:has(.operation-record-form) .operation-record-form .el-col,
.animal-modal:has(.operation-system-form) .operation-system-form .el-col {
  width: auto !important;
  max-width: none !important;
  flex: none !important;
  min-width: 0;
  padding: 0 !important;
}

.animal-modal:has(.operation-record-form) .operation-record-form .el-form-item,
.animal-modal:has(.operation-system-form) .operation-system-form .el-form-item {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  align-items: start;
  min-width: 0;
  margin-bottom: 14px;
}

.animal-modal:has(.operation-system-form) .operation-system-form .el-form-item {
  grid-template-columns: 125px minmax(0, 1fr);
}

.animal-modal:has(.operation-record-form) .operation-record-form .el-form-item__label,
.animal-modal:has(.operation-system-form) .operation-system-form .el-form-item__label {
  width: auto !important;
  padding: 8px 12px 0 0;
  color: var(--animal-text-color, #725d42);
  line-height: 20px;
  white-space: normal;
}

.animal-modal:has(.operation-record-form) .operation-record-form .el-form-item__content,
.animal-modal:has(.operation-system-form) .operation-system-form .el-form-item__content {
  min-width: 0;
  margin-left: 0 !important;
}

.animal-modal:has(.operation-record-form) .operation-record-form .el-form-item__content > *,
.animal-modal:has(.operation-system-form) .operation-system-form .el-form-item__content > * {
  min-width: 0;
  max-width: 100%;
}

.animal-modal:has(.operation-record-form) .operation-record-form > .el-form-item,
.animal-modal:has(.operation-system-form) .operation-system-form > .el-form-item {
  grid-template-columns: 110px minmax(0, 1fr);
}

.animal-modal:has(.operation-system-form) .operation-system-form > .el-form-item {
  grid-template-columns: 125px minmax(0, 1fr);
}

.animal-modal:has(.operation-record-form) .operation-record-form .ui-animal-textarea-wrap,
.animal-modal:has(.operation-system-form) .operation-system-form .ui-animal-textarea-wrap {
  width: 100%;
}

html[data-color-mode='dark'] .animal-modal:has(.operation-record-form) .operation-record-form .el-form-item__label,
html[data-color-mode='dark'] .animal-modal:has(.operation-system-form) .operation-system-form .el-form-item__label {
  color: var(--animal-text-color, #f5ead1);
}

@media (max-width: 720px) {
  .animal-modal:has(.operation-record-form) .operation-record-form .el-row,
  .animal-modal:has(.operation-system-form) .operation-system-form .el-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
