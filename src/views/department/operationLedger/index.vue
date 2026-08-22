<template>
  <div class="p-2 app-container department-operation-ledger-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form" @submit.prevent>
        <el-form-item label="请求日期">
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" clearable />
        </el-form-item>
        <el-form-item label="客户单位"><el-input v-model="queryParams.customerUnit" clearable placeholder="请输入客户单位" /></el-form-item>
        <el-form-item label="项目">
          <el-select v-model="queryParams.projectId" clearable filterable placeholder="全部项目" style="width: 170px">
            <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="系统/项目关键字"><el-input v-model="queryParams.systemName" clearable placeholder="兼容历史文本" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.processStatus" clearable placeholder="全部状态" style="width: 130px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">查询</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="summary-panel mt-2">
      <template #header>
        <div class="toolbar-shell">
          <div><span class="panel-kicker">Operation Ledger</span><h3>运维指标</h3></div>
          <span class="summary-tip">指标来自运维工作记录与系统在线率台账</span>
        </div>
      </template>
      <div class="metric-grid">
        <div class="metric-card blue"><strong>{{ summary.totalCount }}</strong><span>运维总量</span></div>
        <div class="metric-card green"><strong>{{ summary.resolvedCount }}</strong><span>已解决记录</span></div>
        <div class="metric-card teal"><strong>{{ summary.resolutionRate }}%</strong><span>运维解决率</span></div>
        <div class="metric-card orange"><strong>{{ summary.averageProcessingMinutes }}分钟</strong><span>平均处理时长</span></div>
        <div class="metric-card red"><strong>{{ summary.onlineRate }}%</strong><span>系统在线率</span></div>
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel mt-2">
      <template #header>
        <div class="toolbar-shell">
          <div><h3>运维台账</h3><p>工作记录来源于《物流系统科日常管理表》；系统在线率单独维护并参与周报/PPT统计。</p></div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['department:operationLedger:add']" type="primary" plain icon="Plus" @click="handleAddRecord">手动新增</el-button>
            <el-button v-hasPermi="['department:operationLedger:import']" type="info" plain icon="Upload" @click="openRecordUpload">导入工作记录</el-button>
            <el-button v-hasPermi="['department:operationLedger:export']" type="warning" plain icon="Download" @click="handleExportRecords">导出台账</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="工作记录" name="records">
          <el-table v-loading="recordLoading" border :data="recordList">
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
              <template #default="scope"><el-tag :type="statusType(scope.row.processStatus)">{{ statusLabel(scope.row.processStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="业务描述" prop="businessDescription" min-width="230" show-overflow-tooltip />
            <el-table-column label="来源" width="90" align="center">
              <template #default="scope">{{ scope.row.sourceType === 'EXCEL' ? 'Excel' : '手动' }}</template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="130" align="center">
              <template #default="scope">
                <el-button v-hasPermi="['department:operationLedger:edit']" link type="primary" icon="Edit" @click="handleUpdateRecord(scope.row)">编辑</el-button>
                <el-button v-hasPermi="['department:operationLedger:remove']" link type="danger" icon="Delete" @click="handleDeleteRecord(scope.row)" />
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="recordTotal > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="recordTotal" @pagination="getRecordList" />
        </el-tab-pane>

        <el-tab-pane label="系统在线率" name="systems">
          <div class="sub-toolbar">
            <span>在线率用于计算周报中的系统在线率，导入《系统运维报告》后默认归档到本周周一。</span>
            <div class="toolbar-actions">
              <el-button v-hasPermi="['department:operationLedger:add']" type="primary" plain icon="Plus" @click="handleAddSystem">新增系统指标</el-button>
              <el-button v-hasPermi="['department:operationLedger:import']" type="info" plain icon="Upload" @click="openSystemUpload">导入系统运维报告</el-button>
              <el-button v-hasPermi="['department:operationLedger:export']" type="warning" plain icon="Download" @click="handleExportSystems">导出在线率</el-button>
            </div>
          </div>
          <el-table v-loading="systemLoading" border :data="systemList">
            <el-table-column label="统计日期" prop="statDate" width="115" align="center" />
            <el-table-column label="项目" prop="projectName" min-width="160" show-overflow-tooltip />
            <el-table-column label="系统名称" prop="systemName" min-width="160" show-overflow-tooltip />
            <el-table-column label="负责人" prop="responsiblePerson" width="110" align="center" />
            <el-table-column label="在线时长(天)" prop="onlineDays" width="120" align="center" />
            <el-table-column label="停机时间(分钟)" prop="downtimeMinutes" width="130" align="center" />
            <el-table-column label="系统在线率" width="110" align="center"><template #default="scope">{{ scope.row.onlineRate == null ? '—' : `${scope.row.onlineRate}%` }}</template></el-table-column>
            <el-table-column label="操作" fixed="right" width="130" align="center">
              <template #default="scope">
                <el-button v-hasPermi="['department:operationLedger:edit']" link type="primary" icon="Edit" @click="handleUpdateSystem(scope.row)">编辑</el-button>
                <el-button v-hasPermi="['department:operationLedger:remove']" link type="danger" icon="Delete" @click="handleDeleteSystem(scope.row)" />
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="systemTotal > 0" v-model:page="systemParams.pageNum" v-model:limit="systemParams.pageSize" :total="systemTotal" @pagination="getSystemList" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="recordDialog.visible" :title="recordDialog.title" width="820px" append-to-body>
      <el-form ref="recordFormRef" :model="recordForm" label-width="110px">
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="请求人"><el-input v-model="recordForm.requestPerson" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="客户单位"><el-input v-model="recordForm.customerUnit" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="请求岗位类型"><el-input v-model="recordForm.requestRoleType" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理人"><el-input v-model="recordForm.handler" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="请求时间"><el-date-picker v-model="recordForm.requestTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理时间"><el-date-picker v-model="recordForm.processTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="完成时间"><el-date-picker v-model="recordForm.completionTime" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理状态"><el-select v-model="recordForm.processStatus" style="width: 100%"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理方式"><el-input v-model="recordForm.processMethod" /></el-form-item></el-col>
           <el-col :span="12">
             <el-form-item label="项目">
               <el-select v-model="recordForm.projectId" clearable filterable placeholder="请选择项目" style="width: 100%">
                 <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
               </el-select>
             </el-form-item>
           </el-col>
          <el-col :span="12">
            <el-form-item label="故障类型">
              <el-select v-model="recordForm.faultType" clearable filterable placeholder="请选择故障类型" style="width: 100%">
                <el-option v-for="item in dm_fault_type" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="提交人"><el-input v-model="recordForm.submitter" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="是否午休"><el-checkbox v-model="recordForm.lunchBreak" true-label="1" false-label="0">扣除午休2小时</el-checkbox></el-form-item></el-col>
        </el-row>
        <el-form-item label="业务描述"><el-input v-model="recordForm.businessDescription" type="textarea" :rows="3" maxlength="4000" show-word-limit /></el-form-item>
        <el-form-item label="解决方案"><el-input v-model="recordForm.solution" type="textarea" :rows="3" maxlength="4000" show-word-limit /></el-form-item>
        <el-form-item label="备注"><el-input v-model="recordForm.remark" type="textarea" :rows="2" maxlength="1000" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="buttonLoading" @click="submitRecord">保存</el-button><el-button @click="recordDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="systemDialog.visible" :title="systemDialog.title" width="700px" append-to-body>
      <el-form :model="systemForm" label-width="125px">
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="统计日期"><el-date-picker v-model="systemForm.statDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="项目">
              <el-select v-model="systemForm.projectId" clearable filterable placeholder="请选择项目" style="width: 100%">
                <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="系统名称"><el-input v-model="systemForm.systemName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="负责人"><el-input v-model="systemForm.responsiblePerson" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="服务器名称"><el-input v-model="systemForm.serverName" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="服务器IP"><el-input v-model="systemForm.serverIp" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="在线时长(天)"><el-input-number v-model="systemForm.onlineDays" :min="0" :precision="2" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="停机时间(分钟)"><el-input-number v-model="systemForm.downtimeMinutes" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="系统在线率(%)"><el-input-number v-model="systemForm.onlineRate" :min="0" :max="100" :precision="2" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="systemForm.remark" type="textarea" :rows="2" maxlength="1000" /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="buttonLoading" @click="submitSystem">保存</el-button><el-button @click="systemDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="recordUpload.open" title="导入工作记录" width="520px" append-to-body>
      <el-upload ref="recordUploadRef" drag :limit="1" accept=".xlsx,.xls" :headers="recordUpload.headers" :action="recordUpload.url" :auto-upload="false" :disabled="recordUpload.isUploading" :on-success="handleRecordUploadSuccess">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">上传《物流系统科日常管理表》或“工作记录”工作表</div>
        <template #tip><div class="el-upload__tip">系统会按工作记录表头读取数据，响应耗时和处理耗时优先按时间自动计算。</div></template>
      </el-upload>
      <template #footer><el-button type="primary" :loading="recordUpload.isUploading" @click="submitRecordUpload">开始导入</el-button><el-button @click="recordUpload.open = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="systemUpload.open" title="导入系统运维报告" width="520px" append-to-body>
      <el-upload ref="systemUploadRef" drag :limit="1" accept=".xlsx,.xls" :headers="systemUpload.headers" :action="systemUpload.url" :auto-upload="false" :disabled="systemUpload.isUploading" :on-success="handleSystemUploadSuccess">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">上传包含“系统运维报告”工作表的 Excel</div>
        <template #tip><div class="el-upload__tip">导入文件建议包含“项目”列；统计日期默认使用本周周一，可在系统在线率页编辑。</div></template>
      </el-upload>
      <template #footer><el-button type="primary" :loading="systemUpload.isUploading" @click="submitSystemUpload">开始导入</el-button><el-button @click="systemUpload.open = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentOperationLedger" lang="ts">
import { onMounted, reactive, ref } from 'vue';
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

const { dm_fault_type } = toRefs<any>(useDict('dm_fault_type'));

const { loading: recordLoading, withLoading: withRecordLoading } = useLoading(true);
const { loading: systemLoading, withLoading: withSystemLoading } = useLoading(true);
const dateRange = ref<string[]>([]);
const activeTab = ref('records');
const recordList = ref<OperationRecordVO[]>([]);
const systemList = ref<OperationSystemVO[]>([]);
const projectOptions = ref<DepartmentProjectVO[]>([]);
const recordTotal = ref(0);
const systemTotal = ref(0);
const buttonLoading = ref(false);
const recordUploadRef = ref<any>();
const systemUploadRef = ref<any>();
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
function statusType(status: string) { return ({ PROCESSING: 'warning', COMPLETED: 'success', CANCELLED: 'info' })[status] || 'info'; }

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

const resetSystemForm = () => Object.assign(systemForm, { id: undefined, projectId: undefined, statDate: getCurrentMonday(), systemName: undefined, responsiblePerson: undefined, serverName: undefined, serverIp: undefined, onlineDays: undefined, downtimeMinutes: undefined, onlineRate: undefined, remark: undefined });
const handleAddSystem = () => { resetSystemForm(); systemDialog.title = '新增系统在线率'; systemDialog.visible = true; };
const handleUpdateSystem = async (row: OperationSystemVO) => { const res = await getOperationSystem(row.id); Object.assign(systemForm, res.data); systemDialog.title = '编辑系统在线率'; systemDialog.visible = true; };
const submitSystem = async () => { if (!systemForm.statDate || !systemForm.projectId || !systemForm.systemName) return modal.msgWarning('统计日期、项目和系统名称不能为空'); buttonLoading.value = true; try { if (systemForm.id) await updateOperationSystem(systemForm); else await addOperationSystem(systemForm); modal.msgSuccess('系统在线率保存成功'); systemDialog.visible = false; await Promise.all([getSystemList(), getSummary()]); } finally { buttonLoading.value = false; } };
const handleDeleteSystem = async (row: OperationSystemVO) => { await modal.confirm(`确认删除 ${row.systemName} 的在线率记录吗？`); await delOperationSystem(row.id); modal.msgSuccess('删除成功'); await Promise.all([getSystemList(), getSummary()]); };

const openRecordUpload = () => { recordUpload.open = true; recordUpload.isUploading = false; };
const openSystemUpload = () => { systemUpload.open = true; systemUpload.isUploading = false; };
const submitRecordUpload = () => { recordUpload.isUploading = true; recordUploadRef.value?.submit(); };
const submitSystemUpload = () => { systemUpload.isUploading = true; systemUploadRef.value?.submit(); };
const handleRecordUploadSuccess = (response: any) => { recordUpload.isUploading = false; recordUpload.open = false; modal.msgSuccess(response?.msg || '工作记录导入完成'); getRecordList(); getSummary(); };
const handleSystemUploadSuccess = (response: any) => { systemUpload.isUploading = false; systemUpload.open = false; modal.msgSuccess(response?.msg || '系统运维报告导入完成'); getSystemList(); getSummary(); };
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
  .toolbar-shell, .sub-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .sub-toolbar { margin-bottom: 12px; color: var(--el-text-color-secondary); font-size: 13px; }
  h3 { margin: 4px 0; }
  p, .summary-tip { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
  .toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .metric-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
  .metric-card { padding: 16px 18px; border-left: 6px solid; border-radius: 6px; background: var(--el-fill-color-light); }
  .metric-card strong, .metric-card span { display: block; }
  .metric-card strong { font-size: 28px; line-height: 1.15; }
  .metric-card span { margin-top: 8px; color: var(--el-text-color-regular); }
  .blue { border-color: #2671c5; color: #2671c5; }
  .green { border-color: #2ea45f; color: #2ea45f; }
  .teal { border-color: #159a9c; color: #159a9c; }
  .orange { border-color: #ed8b20; color: #ed8b20; }
  .red { border-color: #da4154; color: #da4154; }
  @media (max-width: 1200px) { .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 700px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .toolbar-shell, .sub-toolbar { align-items: flex-start; flex-direction: column; } }
}
</style>
