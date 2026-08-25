<template>
  <div class="p-2 app-container department-analysis-page">
    <el-card shadow="hover">
      <el-form :model="queryParams" :inline="true" class="query-form">
        <el-form-item label="分析人"><el-input v-model="queryParams.analystName" clearable placeholder="姓名" @keyup.enter="handleQuery" /></el-form-item>
        <el-form-item label="问题名称"><el-input v-model="queryParams.problemName" clearable placeholder="问题名称" @keyup.enter="handleQuery" /></el-form-item>
        <el-form-item label="分析日期"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" clearable /></el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="queryParams.reviewStatus" clearable placeholder="全部" style="width: 130px">
            <el-option label="待审核" value="PENDING" /><el-option label="已通过" value="APPROVED" /><el-option label="已驳回" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">查询</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="mt-2">
      <template #header>
        <DepartmentPanelHeader kicker="5 WHY ANALYSIS" title="5WHY分析管理" description="填写分析内容后，系统按现有《5WHY分析表》模板生成 DOCX。">
          <el-button v-hasPermi="['department:fiveWhy:add']" type="primary" icon="Plus" @click="handleAdd">新增分析</el-button>
        </DepartmentPanelHeader>
      </template>
      <el-table v-loading="loading" border :data="list">
        <el-table-column label="分析日期" prop="analysisDate" width="120" align="center" />
        <el-table-column label="分析人" prop="analystName" width="120" />
        <el-table-column label="问题名称" prop="problemName" min-width="220" show-overflow-tooltip />
        <el-table-column label="公司/部门" prop="companyDept" min-width="180" show-overflow-tooltip />
        <el-table-column label="审核状态" prop="reviewStatus" width="105" align="center"><template #default="scope"><el-tag :type="statusType(scope.row.reviewStatus)">{{ statusLabel(scope.row.reviewStatus) }}</el-tag></template></el-table-column>
        <el-table-column label="审核意见" prop="reviewComment" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="260" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:fiveWhy:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-if="scope.row.reviewStatus === 'PENDING'" v-hasPermi="['department:fiveWhy:review']" link type="success" @click="openReview(scope.row)">审核</el-button>
            <el-button v-hasPermi="['department:fiveWhy:export']" link type="warning" icon="Download" @click="handleExport(scope.row)">生成DOCX</el-button>
            <el-button v-hasPermi="['department:fiveWhy:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="1050px" top="4vh" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="125px">
        <el-row :gutter="18">
          <el-col :span="8"><el-form-item label="公司/部门"><el-input v-model="form.companyDept" placeholder="模板第一行展示文本" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="分析人工号"><el-input v-model="form.employeeNo" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="分析人" prop="analystName"><el-input v-model="form.analystName" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="分析日期" prop="analysisDate"><el-date-picker v-model="form.analysisDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="16"><el-form-item label="问题名称" prop="problemName"><el-input v-model="form.problemName" maxlength="255" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="问题描述（5W2H）"><el-input v-model="form.problemDescription" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="影响范围"><el-input v-model="form.impactScope" type="textarea" :rows="2" /></el-form-item>
        <el-divider content-position="left">5WHY问题与原因（必须填写5层）</el-divider>
        <el-table :data="form.whys" border size="small">
          <el-table-column label="层级" width="80" align="center"><template #default="scope">{{ scope.row.level || scope.$index + 1 }}WHY</template></el-table-column>
          <el-table-column label="问题"><template #default="scope"><el-input v-model="scope.row.question" type="textarea" :rows="2" placeholder="为什么会发生这个问题？" /></template></el-table-column>
          <el-table-column label="原因"><template #default="scope"><el-input v-model="scope.row.cause" type="textarea" :rows="2" placeholder="本层原因" /></template></el-table-column>
        </el-table>
        <el-divider content-position="left">改善措施</el-divider>
        <el-table :data="form.improvements" border size="small">
          <el-table-column label="类型" width="120"><template #default="scope"><el-select v-model="scope.row.kind" clearable style="width: 100%"><el-option label="临时" value="临时" /><el-option label="永久" value="永久" /></el-select></template></el-table-column>
          <el-table-column label="改善措施"><template #default="scope"><el-input v-model="scope.row.measure" placeholder="改善措施" /></template></el-table-column>
          <el-table-column label="责任人" width="160"><template #default="scope"><el-input v-model="scope.row.responsible" /></template></el-table-column>
          <el-table-column label="预计完成时间" width="170"><template #default="scope"><el-date-picker v-model="scope.row.expectedDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></template></el-table-column>
        </el-table>
        <el-divider content-position="left">效果验证与标准化</el-divider>
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="改善前图片"><ImageUpload v-model="form.beforeOssId" :limit="1" :is-show-tip="false" :oss-ext="imageExt('FIVE_WHY_BEFORE')" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="改善后图片"><ImageUpload v-model="form.afterOssId" :limit="1" :is-show-tip="false" :oss-ext="imageExt('FIVE_WHY_AFTER')" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="效果验证"><el-input v-model="form.effectVerification" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="标准化长效方案"><el-input v-model="form.standardizationPlan" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="标准化执行说明"><el-input v-model="form.standardizationExecution" type="textarea" :rows="3" /></el-form-item>
        <el-alert title="系统不采集签字字段；保存后可提交审核，导出时自动套用模板。" type="info" :closable="false" />
      </el-form>
      <template #footer><el-button type="primary" :loading="buttonLoading" @click="submitForm">保存</el-button><el-button @click="dialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="reviewDialog.visible" title="审核5WHY分析" width="520px" append-to-body>
      <el-form label-width="90px"><el-form-item label="审核结果"><el-radio-group v-model="reviewDialog.status"><el-radio label="APPROVED">通过</el-radio><el-radio label="REJECTED">驳回</el-radio></el-radio-group></el-form-item><el-form-item label="审核意见"><el-input v-model="reviewDialog.comment" type="textarea" :rows="4" placeholder="可填写审核意见" /></el-form-item></el-form>
      <template #footer><el-button type="primary" :loading="reviewDialog.loading" @click="submitReview">确定</el-button><el-button @click="reviewDialog.visible = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentFiveWhy" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import ImageUpload from '@/components/ImageUpload/index.vue';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import { addFiveWhy, delFiveWhy, exportFiveWhy, listFiveWhy, reviewFiveWhy, updateFiveWhy } from '@/api/department/fiveWhy';
import type { FiveWhyForm, FiveWhyQuery, FiveWhyVO, ReviewForm } from '@/api/department/fiveWhy/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { download as requestDownload } from '@/utils/request';

const { loading, withLoading } = useLoading(true);
const list = ref<FiveWhyVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const dateRange = ref<string[]>([]);
const queryParams = reactive<FiveWhyQuery>({ pageNum: 1, pageSize: 10 });
const emptyWhys = () => Array.from({ length: 5 }, (_, index) => ({ level: index + 1, question: '', cause: '' }));
const emptyImprovements = () => Array.from({ length: 4 }, () => ({ kind: '', measure: '', responsible: '', expectedDate: '' }));
const form = reactive<FiveWhyForm>({ whys: emptyWhys(), improvements: emptyImprovements() });
const dialog = reactive({ visible: false, title: '' });
const reviewDialog = reactive({ visible: false, loading: false, id: undefined as string | number | undefined, status: 'APPROVED' as ReviewForm['reviewStatus'], comment: '' });
const rules = { analystName: [{ required: true, message: '分析人不能为空', trigger: 'blur' }], analysisDate: [{ required: true, message: '分析日期不能为空', trigger: 'change' }], problemName: [{ required: true, message: '问题名称不能为空', trigger: 'blur' }] };

const statusLabel = (value: any) => ({ PENDING: '待审核', APPROVED: '已通过', REJECTED: '已驳回' })[value] || value;
const statusType = (value: any) => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' } as Record<string, any>)[value] || 'info';
const imageExt = (refType: string) => ({ bizType: 'DEPARTMENT_FIVE_WHY', source: 'userUpload', refType });

const getList = async () => withLoading(async () => { const res = await listFiveWhy(queryParams); list.value = res.data?.rows || []; total.value = res.data?.total || 0; });
const handleQuery = () => { queryParams.beginDate = dateRange.value?.[0]; queryParams.endDate = dateRange.value?.[1]; queryParams.pageNum = 1; getList(); };
const resetQuery = () => { dateRange.value = []; queryParams.analystName = undefined; queryParams.problemName = undefined; queryParams.reviewStatus = undefined; queryParams.beginDate = undefined; queryParams.endDate = undefined; handleQuery(); };
const resetForm = () => Object.assign(form, { id: undefined, companyDept: '', employeeNo: '', analystName: '', analysisDate: '', problemName: '', problemDescription: '', impactScope: '', whys: emptyWhys(), improvements: emptyImprovements(), beforeOssId: undefined, afterOssId: undefined, effectVerification: '', standardizationPlan: '', standardizationExecution: '' });
const handleAdd = () => { resetForm(); dialog.title = '新增5WHY分析'; dialog.visible = true; };
const handleUpdate = (row: any) => { Object.assign(form, { ...row, whys: row.whys?.map((item: any) => ({ ...item })), improvements: row.improvements?.map((item: any) => ({ ...item })) }); dialog.title = '编辑5WHY分析'; dialog.visible = true; };
const submitForm = async () => { await formRef.value?.validate(); if (form.whys.length !== 5) return modal.msgWarning('请填写完整的5层WHY'); if (form.whys.some(item => !item.question?.trim() || !item.cause?.trim())) return modal.msgWarning('5层WHY的问题和原因都不能为空'); buttonLoading.value = true; try { if (form.id) await updateFiveWhy(form as FiveWhyForm & { id: string | number }); else await addFiveWhy(form); modal.msgSuccess('保存成功，记录已进入待审核'); dialog.visible = false; await getList(); } finally { buttonLoading.value = false; } };
const handleDelete = async (row: any) => { await modal.confirm(`确认删除“${row.problemName}”吗？`); await delFiveWhy(row.id); modal.msgSuccess('删除成功'); await getList(); };
const openReview = (row: any) => { reviewDialog.id = row.id; reviewDialog.status = 'APPROVED'; reviewDialog.comment = ''; reviewDialog.visible = true; };
const submitReview = async () => { if (!reviewDialog.id) return; reviewDialog.loading = true; try { await reviewFiveWhy({ id: reviewDialog.id, reviewStatus: reviewDialog.status, reviewComment: reviewDialog.comment }); modal.msgSuccess('审核完成'); reviewDialog.visible = false; await getList(); } finally { reviewDialog.loading = false; } };
const handleExport = (row: any) => requestDownload(exportFiveWhy(row.id), {}, `5WHY分析-${row.problemName || row.id}.docx`);

onMounted(getList);
</script>
