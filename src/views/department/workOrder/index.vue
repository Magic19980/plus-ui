<template>
  <div class="p-2 app-container department-work-order-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :model="queryParams" :inline="true" class="query-form">
        <el-form-item label="发生年月">
          <el-date-picker v-model="dateRange" type="monthrange" value-format="YYYY-MM" range-separator="至" start-placeholder="开始月份" end-placeholder="结束月份" clearable />
        </el-form-item>
        <el-form-item label="项目名称"><el-input v-model="queryParams.systemName" clearable placeholder="请输入项目名称" /></el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="summary-panel mt-2">
      <template #header>
        <DepartmentPanelHeader kicker="Manual Order Ledger" title="人工单指标">
          <template #meta><span class="summary-tip">按人工统计明细汇总：人工投入=中国人工+印尼人工</span></template>
        </DepartmentPanelHeader>
      </template>
      <DepartmentMetricGrid :columns="6">
        <DepartmentMetricCard :value="formatQuantity(laborQuantity(summary))" label="人工投入合计（人天）" tone="blue" />
        <DepartmentMetricCard :value="formatQuantity(summary.totalChineseLabor)" label="中国人工（人天）" tone="teal" />
        <DepartmentMetricCard :value="formatQuantity(summary.totalIndonesiaLabor)" label="印尼人工（人天）" tone="green" />
        <DepartmentMetricCard :value="formatQuantity(summary.totalEngineeringQuantity)" label="工程量合计" tone="orange" />
        <DepartmentMetricCard :value="summary.totalCount" label="人工单据数" tone="blue" />
        <DepartmentMetricCard :value="summary.detailCount" label="统计明细数" tone="red" />
      </DepartmentMetricGrid>
      <el-alert v-if="summary.unattributedCount" class="mt-3" type="warning" :closable="false">
        有 {{ summary.unattributedCount }} 条已确认记录没有发生年月，未进入日期范围统计。
      </el-alert>
    </el-card>

    <el-card shadow="hover" class="table-panel mt-2">
      <template #header>
        <DepartmentPanelHeader title="人工单台账" description="每个 PDF 生成 1 条主记录，原始表格行保存在“人工统计明细”中，明细可继续维护并参与周报。">
            <el-button v-hasPermi="['department:workOrder:add']" type="primary" plain icon="Plus" @click="handleAdd">手动新增</el-button>
            <el-button v-hasPermi="['department:workOrder:import']" type="info" plain icon="Upload" @click="upload.open = true">导入人工单 PDF</el-button>
            <el-button v-hasPermi="['department:workOrder:export']" type="warning" plain icon="Download" @click="handleExport">导出人工单台账</el-button>
        </DepartmentPanelHeader>
      </template>
      <el-table v-loading="loading" border :data="orderList">
        <el-table-column label="发生年月" prop="occurDate" width="115" align="center">
          <template #default="scope">{{ formatMonth(scope.row.occurDate) }}</template>
        </el-table-column>
        <el-table-column label="人工单编号" prop="ticketNo" width="180" show-overflow-tooltip />
        <el-table-column label="项目名称" prop="systemName" width="180" show-overflow-tooltip />
        <el-table-column label="项目特征" prop="title" min-width="260" show-overflow-tooltip />
        <el-table-column label="安装车间" prop="installDepartment" width="140" show-overflow-tooltip />
        <el-table-column label="安装班组" prop="installTeam" width="140" show-overflow-tooltip />
        <el-table-column label="申请部门" prop="requestDept" width="140" show-overflow-tooltip />
        <el-table-column label="结算单位" prop="settlementUnit" width="140" show-overflow-tooltip />
        <el-table-column label="项目负责人" prop="projectOwner" width="120" show-overflow-tooltip />
        <el-table-column label="来源" width="100" align="center">
          <template #default="scope">{{ scope.row.sourceType === 'PDF' ? 'PDF导入' : '手动' }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280" align="center">
          <template #default="scope">
            <el-button v-if="scope.row.detailCount" link type="primary" @click="handleDetails(scope.row)">人工统计明细({{ scope.row.detailCount }})</el-button>
            <el-button v-hasPermi="['department:workOrder:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['department:workOrder:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="760px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="125px">
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="发生年月" prop="occurDate"><el-date-picker v-model="form.occurDate" type="month" value-format="YYYY-MM" placeholder="选择发生年月" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="人工单编号"><el-input v-model="form.ticketNo" placeholder="PDF导入自动生成" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="项目名称" prop="systemName"><el-input v-model="form.systemName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="安装车间"><el-input v-model="form.installDepartment" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="安装班组"><el-input v-model="form.installTeam" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="工作类别"><el-input v-model="form.workCategory" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="故障类型"><el-input v-model="form.faultType" placeholder="如系统维护/问题咨询" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理时长(分钟)"><el-input-number v-model="form.resolutionMinutes" :min="0" :step="1" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="人工单量"><el-input-number v-model="form.quantity" :min="0.01" :step="0.5" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="申请部门"><el-input v-model="form.requestDept" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="结算单位"><el-input v-model="form.settlementUnit" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="责任人"><el-input v-model="form.responsiblePerson" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="处理人"><el-input v-model="form.handler" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="项目负责人"><el-input v-model="form.projectOwner" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="反馈渠道"><el-input v-model="form.feedbackChannel" placeholder="如微信/电话/现场" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="项目特征"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="工作内容"><el-input v-model="form.workContent" type="textarea" :rows="4" maxlength="4000" show-word-limit /></el-form-item>
        <el-form-item v-if="form.parseMessage" label="解析提示"><el-alert type="warning" :closable="false" :title="form.parseMessage" /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="buttonLoading" @click="submitForm">保存</el-button><el-button @click="dialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailDialog.visible" :title="detailDialog.title" width="1400px" append-to-body>
      <el-table v-loading="detailLoading" border :data="detailList" max-height="620px">
        <el-table-column label="序号" prop="sequenceNo" width="70" align="center" fixed="left" />
        <el-table-column label="申请部门" prop="requestDept" width="140" show-overflow-tooltip />
        <el-table-column label="结算单位" prop="settlementUnit" width="160" show-overflow-tooltip />
        <el-table-column label="项目负责人" prop="projectOwner" width="120" show-overflow-tooltip />
        <el-table-column label="项目名称（单价表对应名称）" prop="projectName" width="220" show-overflow-tooltip />
        <el-table-column label="项目特征（实用物资）" prop="projectFeature" width="220" show-overflow-tooltip />
        <el-table-column label="计量单位" prop="unit" width="90" align="center" />
        <el-table-column label="工程量" prop="engineeringQuantity" width="90" align="center" />
        <el-table-column label="中国人工" prop="chineseLabor" width="100" align="center" />
        <el-table-column label="印尼人工" prop="indonesiaLabor" width="100" align="center" />
        <el-table-column label="安装车间" prop="installDepartment" width="140" show-overflow-tooltip />
        <el-table-column label="安装班组" prop="installTeam" width="140" show-overflow-tooltip />
        <el-table-column label="工作内容" prop="workContent" min-width="360" show-overflow-tooltip />
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:workOrder:edit']" link type="primary" @click="handleDetailEdit(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['department:workOrder:remove']" link type="danger" @click="handleDetailDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="detailEditDialog.visible" :title="detailEditDialog.title" width="900px" append-to-body>
      <el-form ref="detailFormRef" :model="detailForm" :rules="detailRules" label-width="155px">
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="申请部门"><el-input v-model="detailForm.requestDept" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="结算单位"><el-input v-model="detailForm.settlementUnit" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="项目负责人"><el-input v-model="detailForm.projectOwner" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="项目名称" prop="projectName"><el-input v-model="detailForm.projectName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="项目特征"><el-input v-model="detailForm.projectFeature" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="计量单位"><el-input v-model="detailForm.unit" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="工程量"><el-input v-model="detailForm.engineeringQuantity" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="中国人工"><el-input v-model="detailForm.chineseLabor" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="印尼人工"><el-input v-model="detailForm.indonesiaLabor" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="安装车间"><el-input v-model="detailForm.installDepartment" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="安装班组"><el-input v-model="detailForm.installTeam" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="工作内容"><el-input v-model="detailForm.workContent" type="textarea" :rows="6" maxlength="4000" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="detailButtonLoading" @click="submitDetailForm">保存</el-button><el-button @click="detailEditDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="upload.open" title="导入人工单 PDF" width="520px" append-to-body>
      <el-upload ref="uploadRef" drag :limit="1" accept=".pdf" :headers="globalHeaders()" :action="upload.url" :auto-upload="false" :disabled="upload.isUploading" :on-success="handleUploadSuccess" :on-error="handleUploadError">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽 PDF 到此处，或点击选择</div>
        <template #tip><div class="el-upload__tip">支持当前“工程量统计明细/人工单”文字版 PDF；扫描件需后续接入 OCR。</div></template>
      </el-upload>
      <template #footer><el-button type="primary" :loading="upload.isUploading" @click="submitUpload">开始解析</el-button><el-button @click="upload.open = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentWorkOrder" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import DepartmentMetricCard from '@/components/Department/MetricCard.vue';
import DepartmentMetricGrid from '@/components/Department/MetricGrid.vue';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import { addWorkOrder, delWorkOrder, delWorkOrderDetail, getWorkOrderDetails, listWorkOrder, updateWorkOrder, updateWorkOrderDetail, getWorkOrderSummary } from '@/api/department/workOrder';
import type { WorkOrderDetailForm, WorkOrderDetailVO, WorkOrderForm, WorkOrderQuery, WorkOrderSummaryVO, WorkOrderVO } from '@/api/department/workOrder/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { download as requestDownload, globalHeaders } from '@/utils/request';

const { loading, withLoading } = useLoading(true);
const orderList = ref<WorkOrderVO[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const buttonLoading = ref(false);
const detailLoading = ref(false);
const detailButtonLoading = ref(false);
const detailList = ref<WorkOrderDetailVO[]>([]);
const formRef = ref<ElFormInstance>();
const detailFormRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const summary = reactive<WorkOrderSummaryVO>({ totalCount: 0, totalQuantity: 0, totalEngineeringQuantity: 0, totalChineseLabor: 0, totalIndonesiaLabor: 0, totalLaborQuantity: 0, detailCount: 0, resolvedCount: 0, resolutionRate: 0, averageResolutionMinutes: 0, unattributedCount: 0, bySystem: [], byFaultType: [] });
const queryParams = reactive<WorkOrderQuery>({ pageNum: 1, pageSize: 10, beginDate: undefined, endDate: undefined, systemName: undefined });
const form = reactive<WorkOrderForm & { parseMessage?: string }>({ quantity: 1 });
const dialog = reactive({ visible: false, title: '' });
const detailDialog = reactive({ visible: false, title: '' });
const detailEditDialog = reactive({ visible: false, title: '编辑人工统计明细' });
const detailParentId = ref<string | number>();
const detailForm = reactive<WorkOrderDetailForm>({});
const upload = reactive({ open: false, isUploading: false, url: import.meta.env.VITE_APP_BASE_API + '/department/workOrder/importPdf' });
const rules = { systemName: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }] };
const detailRules = { projectName: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }] };

const formatQuantity = (value?: number) => Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const laborQuantity = (value: WorkOrderSummaryVO) => value.detailCount > 0 ? value.totalLaborQuantity : value.totalQuantity;

const getList = async () => {
  await withLoading(async () => {
    const res = await listWorkOrder(queryParams);
    orderList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const loadSummary = async () => {
  if (!queryParams.beginDate || !queryParams.endDate) return;
  const res = await getWorkOrderSummary(queryParams.beginDate, queryParams.endDate);
  Object.assign(summary, res.data);
};

const handleQuery = () => {
  queryParams.beginDate = monthStart(dateRange.value?.[0]);
  queryParams.endDate = monthEnd(dateRange.value?.[1]);
  queryParams.pageNum = 1;
  getList();
  loadSummary();
};

const resetQuery = () => { dateRange.value = []; queryParams.beginDate = undefined; queryParams.endDate = undefined; queryParams.systemName = undefined; handleQuery(); };

const resetForm = () => Object.assign(form, { id: undefined, ticketNo: undefined, occurDate: undefined, sourcePeriodStart: undefined, sourcePeriodEnd: undefined, requestDept: undefined, settlementUnit: undefined, projectOwner: undefined, systemName: undefined, installDepartment: undefined, installTeam: undefined, workCategory: undefined, faultType: undefined, title: undefined, workContent: undefined, unit: undefined, quantity: 1, responsiblePerson: undefined, handler: undefined, resolutionMinutes: undefined, feedbackChannel: undefined, remark: undefined, parseMessage: undefined });
const handleAdd = () => { resetForm(); dialog.title = '手动新增人工单'; dialog.visible = true; };
const handleUpdate = (row: WorkOrderVO) => { Object.assign(form, row, { occurDate: row.occurDate?.slice(0, 7) }); dialog.title = '编辑人工单'; dialog.visible = true; };
const loadDetails = async (workOrderId: string | number) => {
  detailLoading.value = true;
  try {
    const res = await getWorkOrderDetails(workOrderId);
    detailList.value = res.data || [];
  } finally {
    detailLoading.value = false;
  }
};

const handleDetails = async (row: WorkOrderVO) => {
  detailParentId.value = row.id;
  detailDialog.title = `${row.ticketNo || '人工单'} - 人工统计明细`;
  detailDialog.visible = true;
  await loadDetails(row.id);
};

const resetDetailForm = () => Object.assign(detailForm, { id: undefined, workOrderId: detailParentId.value, requestDept: undefined, settlementUnit: undefined, projectOwner: undefined, projectName: undefined, projectFeature: undefined, unit: undefined, engineeringQuantity: undefined, chineseLabor: undefined, indonesiaLabor: undefined, installDepartment: undefined, installTeam: undefined, workContent: undefined });
const handleDetailEdit = (row: WorkOrderDetailVO) => {
  Object.assign(detailForm, { id: row.id, workOrderId: row.workOrderId || detailParentId.value, requestDept: row.requestDept, settlementUnit: row.settlementUnit, projectOwner: row.projectOwner, projectName: row.projectName, projectFeature: row.projectFeature, unit: row.unit, engineeringQuantity: row.engineeringQuantity, chineseLabor: row.chineseLabor, indonesiaLabor: row.indonesiaLabor, installDepartment: row.installDepartment, installTeam: row.installTeam, workContent: row.workContent });
  detailEditDialog.visible = true;
};
const handleDetailDelete = async (row: WorkOrderDetailVO) => {
  if (!row.id) return;
  await modal.confirm(`确认删除第 ${row.sequenceNo} 条人工统计明细吗？删除后主记录会重新汇总。`);
  await delWorkOrderDetail(row.id);
  modal.msgSuccess('明细删除成功');
  if (detailParentId.value) await Promise.all([getList(), loadSummary(), loadDetails(detailParentId.value)]);
};
const submitDetailForm = async () => {
  await detailFormRef.value?.validate();
  if (!detailForm.id || !detailForm.workOrderId) return modal.msgWarning('明细主键或人工单主记录不能为空');
  detailButtonLoading.value = true;
  try {
    await updateWorkOrderDetail(detailForm);
    modal.msgSuccess('明细修改成功');
    detailEditDialog.visible = false;
    if (detailParentId.value) await Promise.all([getList(), loadSummary(), loadDetails(detailParentId.value)]);
  } finally {
    detailButtonLoading.value = false;
  }
};

const submitForm = async () => {
  await formRef.value?.validate();
  buttonLoading.value = true;
  const payload = { ...form, occurDate: monthStart(form.occurDate) };
  try { if (form.id) await updateWorkOrder(payload); else await addWorkOrder(payload); modal.msgSuccess('保存成功'); dialog.visible = false; await Promise.all([getList(), loadSummary()]); } finally { buttonLoading.value = false; }
};

const handleDelete = async (row: WorkOrderVO) => { await modal.confirm(`确认删除人工单 ${row.ticketNo || row.title || row.id} 吗？`); await delWorkOrder(row.id); modal.msgSuccess('删除成功'); await Promise.all([getList(), loadSummary()]); };
const handleExport = () => requestDownload('department/workOrder/export', queryParams, '人工单台账.xlsx');
const submitUpload = () => { upload.isUploading = true; uploadRef.value?.submit(); };
const handleUploadSuccess = (response: any) => { upload.isUploading = false; upload.open = false; modal.msgSuccess(response?.data?.message || response?.msg || 'PDF解析完成'); getList(); loadSummary(); };
const handleUploadError = () => { upload.isUploading = false; modal.msgError('PDF导入失败，请确认文件是文字版人工单'); };

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatMonth(date?: string) {
  return date ? date.slice(0, 7) : '-';
}

function monthStart(month?: string) {
  return month ? `${month}-01` : undefined;
}

function monthEnd(month?: string) {
  if (!month) return undefined;
  const [year, monthNumber] = month.split('-').map(Number);
  return formatDate(new Date(year, monthNumber, 0));
}

onMounted(() => {
  const currentMonth = formatMonth(formatDate(new Date()));
  dateRange.value = [currentMonth, currentMonth];
  queryParams.beginDate = monthStart(currentMonth);
  queryParams.endDate = monthEnd(currentMonth);
  getList();
  loadSummary();
});
</script>

<style scoped lang="scss">
.department-work-order-page {
  h3 { margin: 4px 0; }
  p, .summary-tip { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
}
</style>
