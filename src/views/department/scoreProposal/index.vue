<template>
  <div class="p-2 app-container department-analysis-page">
    <el-card shadow="hover">
      <el-form :model="queryParams" :inline="true" class="query-form">
        <el-form-item label="提议者"><el-input v-model="queryParams.proposerName" clearable placeholder="姓名" @keyup.enter="handleQuery" /></el-form-item>
        <el-form-item label="提案大类">
          <el-select v-model="queryParams.mainCategory" clearable filterable placeholder="全部大类" style="width: 180px" @change="handleQueryMainCategoryChange">
            <el-option v-for="item in categoryTree" :key="item.id" :label="item.categoryName" :value="item.categoryName" />
          </el-select>
        </el-form-item>
        <el-form-item label="提案小类">
          <el-select v-model="queryParams.subCategory" clearable filterable :disabled="!queryParams.mainCategory" placeholder="全部小类" style="width: 180px">
            <el-option v-for="item in querySubCategoryOptions" :key="item.id" :label="item.categoryName" :value="item.categoryName" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" clearable /></el-form-item>
        <el-form-item label="完成状态"><el-select v-model="queryParams.completionStatus" clearable placeholder="全部" style="width: 130px"><el-option label="进行中" value="进行中" /><el-option label="已完成" value="已完成" /><el-option label="未完成" value="未完成" /></el-select></el-form-item>
        <el-form-item label="审核状态"><el-select v-model="queryParams.reviewStatus" clearable placeholder="全部" style="width: 130px"><el-option label="待审核" value="PENDING" /><el-option label="已通过" value="APPROVED" /><el-option label="已驳回" value="REJECTED" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">查询</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="mt-2">
      <template #header>
        <div class="toolbar-shell"><div><span class="panel-kicker">SCORE PROPOSAL</span><h3>SCORE提案管理</h3><p>系统按现有 EIP 企业改进提案表模板填入并生成 XLSX，不采集签字、固化清单和推广清单。</p></div><el-button v-hasPermi="['department:scoreProposal:add']" type="primary" icon="Plus" @click="handleAdd">新增提案</el-button></div>
      </template>
      <el-table v-loading="loading" border :data="list">
        <el-table-column label="开始日期" prop="startDate" width="120" align="center" />
        <el-table-column label="提议者" prop="proposerName" width="120" />
        <el-table-column label="部门" prop="deptName" width="140" show-overflow-tooltip />
        <el-table-column label="提案大类/小类" min-width="210" show-overflow-tooltip><template #default="scope">{{ scope.row.mainCategory }} / {{ scope.row.subCategory }}</template></el-table-column>
        <el-table-column label="问题描述" prop="problemDescription" min-width="220" show-overflow-tooltip />
        <el-table-column label="完成状态" prop="completionStatus" width="100" align="center"><template #default="scope"><el-tag :type="scope.row.completionStatus === '已完成' ? 'success' : 'warning'">{{ scope.row.completionStatus || '进行中' }}</el-tag></template></el-table-column>
        <el-table-column label="审核状态" prop="reviewStatus" width="105" align="center"><template #default="scope"><el-tag :type="statusType(scope.row.reviewStatus)">{{ statusLabel(scope.row.reviewStatus) }}</el-tag></template></el-table-column>
        <el-table-column label="操作" fixed="right" width="280" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:scoreProposal:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-if="scope.row.reviewStatus === 'PENDING'" v-hasPermi="['department:scoreProposal:review']" link type="success" @click="openReview(scope.row)">审核</el-button>
            <el-button v-hasPermi="['department:scoreProposal:export']" link type="warning" icon="Download" @click="handleExport(scope.row)">生成XLSX</el-button>
            <el-button v-hasPermi="['department:scoreProposal:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="980px" top="5vh" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="125px">
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="企业名称"><el-input v-model="form.companyName" placeholder="模板表头企业名称" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="EIT小组成员"><el-input v-model="form.teamMembers" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="提议人工号"><el-input v-model="form.employeeNo" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="提议者姓名" prop="proposerName"><el-input v-model="form.proposerName" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="提议者岗位"><el-input v-model="form.proposerRole" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="职位层级"><el-select v-model="form.proposerLevel" clearable filterable placeholder="请选择职位层级" style="width: 100%"><el-option v-for="item in dm_score_job" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="车间/部门"><el-input v-model="form.deptName" /></el-form-item></el-col>
          <el-col :span="8">
            <el-form-item label="提案大类" prop="mainCategoryId">
              <el-select v-model="form.mainCategoryId" clearable filterable style="width: 100%" placeholder="请选择提案大类" @change="handleMainCategoryChange">
                <el-option v-for="item in categoryTree" :key="item.id" :label="item.categoryName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="提案小类" prop="subCategoryId">
              <el-select v-model="form.subCategoryId" clearable filterable :disabled="!form.mainCategoryId" style="width: 100%" placeholder="请先选择提案大类">
                <el-option v-for="item in subCategoryOptions" :key="item.id" :label="item.categoryName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert v-if="categoryTree.length === 0" title="当前还没有启用的SCORE分类，请先在“分类配置”中维护提案大类和小类。" type="warning" :closable="false" class="mb-4" />
        <el-form-item label="问题描述"><el-input v-model="form.problemDescription" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="改进措施"><el-input v-model="form.improvementMeasure" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="实施人/监督人"><el-input v-model="form.implementerSupervisor" /></el-form-item>
        <el-row :gutter="18">
          <el-col :span="8"><el-form-item label="开始日期"><el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="计划完成日期"><el-date-picker v-model="form.plannedCompletionDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="实际完成日期"><el-date-picker v-model="form.actualCompletionDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="完成状态"><el-select v-model="form.completionStatus" style="width: 100%"><el-option label="进行中" value="进行中" /><el-option label="已完成" value="已完成" /><el-option label="未完成" value="未完成" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="改进前图片"><ImageUpload v-model="form.beforeOssId" :limit="1" :is-show-tip="false" :oss-ext="imageExt('SCORE_BEFORE')" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="改进后图片"><ImageUpload v-model="form.afterOssId" :limit="1" :is-show-tip="false" :oss-ext="imageExt('SCORE_AFTER')" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" maxlength="1000" show-word-limit /></el-form-item>
        <el-alert title="模板中的固化清单、推广清单列按需求保持空白；审核仅记录通过/驳回和意见，不涉及签字。" type="info" :closable="false" />
      </el-form>
      <template #footer><el-button type="primary" :loading="buttonLoading" @click="submitForm">保存</el-button><el-button @click="dialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="reviewDialog.visible" title="审核SCORE提案" width="520px" append-to-body>
      <el-form label-width="90px"><el-form-item label="审核结果"><el-radio-group v-model="reviewDialog.status"><el-radio label="APPROVED">通过</el-radio><el-radio label="REJECTED">驳回</el-radio></el-radio-group></el-form-item><el-form-item label="审核意见"><el-input v-model="reviewDialog.comment" type="textarea" :rows="4" /></el-form-item></el-form>
      <template #footer><el-button type="primary" :loading="reviewDialog.loading" @click="submitReview">确定</el-button><el-button @click="reviewDialog.visible = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentScoreProposal" lang="ts">
import { computed, onMounted, reactive, ref, toRefs } from 'vue';
import ImageUpload from '@/components/ImageUpload/index.vue';
import { listScoreCategoryOptions } from '@/api/department/scoreCategory';
import type { ScoreCategoryVO } from '@/api/department/scoreCategory/types';
import { addScoreProposal, delScoreProposal, exportScoreProposal, listScoreProposal, reviewScoreProposal, updateScoreProposal } from '@/api/department/scoreProposal';
import type { ReviewForm, ScoreProposalForm, ScoreProposalQuery, ScoreProposalVO } from '@/api/department/scoreProposal/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { download as requestDownload } from '@/utils/request';
import { useDict } from '@/utils/dict';

const { loading, withLoading } = useLoading(true);
const list = ref<ScoreProposalVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const dateRange = ref<string[]>([]);
const categoryTree = ref<ScoreCategoryVO[]>([]);
const { dm_score_job } = toRefs<any>(useDict('dm_score_job'));
const queryParams = reactive<ScoreProposalQuery>({ pageNum: 1, pageSize: 10 });
const form = reactive<ScoreProposalForm>({ proposerName: '', proposerLevel: '', completionStatus: '进行中' });
const dialog = reactive({ visible: false, title: '' });
const reviewDialog = reactive({ visible: false, loading: false, id: undefined as string | number | undefined, status: 'APPROVED' as ReviewForm['reviewStatus'], comment: '' });
const rules = {
  proposerName: [{ required: true, message: '提议者姓名不能为空', trigger: 'blur' }],
  mainCategoryId: [{ required: true, message: '请选择提案大类', trigger: 'change' }],
  subCategoryId: [{ required: true, message: '请选择提案小类', trigger: 'change' }]
};

const subCategoryOptions = computed(() => categoryTree.value.find((item) => String(item.id) === String(form.mainCategoryId))?.children || []);
const querySubCategoryOptions = computed(() => categoryTree.value.find((item) => item.categoryName === queryParams.mainCategory)?.children || []);

const statusLabel = (value: any) => ({ PENDING: '待审核', APPROVED: '已通过', REJECTED: '已驳回' })[value] || value;
const statusType = (value: any) => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' } as Record<string, any>)[value] || 'info';
const imageExt = (refType: string) => ({ bizType: 'DEPARTMENT_SCORE', source: 'userUpload', refType });

const getList = async () => withLoading(async () => { const res = await listScoreProposal(queryParams); list.value = res.data?.rows || []; total.value = res.data?.total || 0; });
const handleQuery = () => { queryParams.beginDate = dateRange.value?.[0]; queryParams.endDate = dateRange.value?.[1]; queryParams.pageNum = 1; getList(); };
const handleQueryMainCategoryChange = () => { queryParams.subCategory = undefined; };
const resetQuery = () => { dateRange.value = []; queryParams.proposerName = undefined; queryParams.mainCategory = undefined; queryParams.subCategory = undefined; queryParams.completionStatus = undefined; queryParams.reviewStatus = undefined; queryParams.beginDate = undefined; queryParams.endDate = undefined; handleQuery(); };
const defaultProposerLevel = () => dm_score_job.value?.[0]?.value || '';
const normalizeProposerLevel = (value?: string) => {
  if (!value) return value || '';
  const options = dm_score_job.value || [];
  const exact = options.find((item: DictDataOption) => String(item.value) === String(value));
  if (exact) return exact.value;
  const legacy = options.find((item: DictDataOption) => String(item.label) === String(value) || String(item.label).includes(String(value)));
  return legacy?.value || value;
};
const resetForm = () => Object.assign(form, { id: undefined, companyName: '', teamMembers: '', employeeNo: '', proposerName: '', proposerRole: '', proposerLevel: defaultProposerLevel(), deptName: '', mainCategoryId: undefined, subCategoryId: undefined, mainCategory: '', subCategory: '', problemDescription: '', improvementMeasure: '', implementerSupervisor: '', beforeOssId: undefined, afterOssId: undefined, startDate: '', plannedCompletionDate: '', actualCompletionDate: '', completionStatus: '进行中', remark: '' });
const handleAdd = () => { resetForm(); dialog.title = '新增SCORE提案'; dialog.visible = true; };
const handleUpdate = (row: any) => {
  Object.assign(form, { ...row });
  form.proposerLevel = normalizeProposerLevel(form.proposerLevel);
  if (!form.mainCategoryId && form.mainCategory) {
    const main = categoryTree.value.find((item) => item.categoryName === form.mainCategory);
    form.mainCategoryId = main?.id;
    const sub = main?.children?.find((item) => item.categoryName === form.subCategory);
    form.subCategoryId = sub?.id;
  }
  dialog.title = '编辑SCORE提案';
  dialog.visible = true;
};
const handleMainCategoryChange = () => {
  form.subCategoryId = undefined;
  form.subCategory = '';
};
const syncCategoryNames = () => {
  const main = categoryTree.value.find((item) => String(item.id) === String(form.mainCategoryId));
  const sub = main?.children?.find((item) => String(item.id) === String(form.subCategoryId));
  form.mainCategory = main?.categoryName;
  form.subCategory = sub?.categoryName;
};
const getCategoryOptions = async () => {
  const res = await listScoreCategoryOptions();
  categoryTree.value = res.data || [];
};
const submitForm = async () => {
  await formRef.value?.validate();
  syncCategoryNames();
  buttonLoading.value = true;
  try {
    if (form.id) await updateScoreProposal(form as ScoreProposalForm & { id: string | number });
    else await addScoreProposal(form);
    modal.msgSuccess('保存成功，记录已进入待审核');
    dialog.visible = false;
    await getList();
  } finally {
    buttonLoading.value = false;
  }
};
const handleDelete = async (row: any) => { await modal.confirm(`确认删除“${row.proposerName}”的提案吗？`); await delScoreProposal(row.id); modal.msgSuccess('删除成功'); await getList(); };
const openReview = (row: any) => { reviewDialog.id = row.id; reviewDialog.status = 'APPROVED'; reviewDialog.comment = ''; reviewDialog.visible = true; };
const submitReview = async () => { if (!reviewDialog.id) return; reviewDialog.loading = true; try { await reviewScoreProposal({ id: reviewDialog.id, reviewStatus: reviewDialog.status, reviewComment: reviewDialog.comment }); modal.msgSuccess('审核完成'); reviewDialog.visible = false; await getList(); } finally { reviewDialog.loading = false; } };
const handleExport = (row: any) => requestDownload(exportScoreProposal(row.id), {}, `SCORE提案-${row.proposerName || row.id}.xlsx`);

onMounted(async () => {
  await Promise.all([getList(), getCategoryOptions()]);
});
</script>

<style scoped lang="scss">
.department-analysis-page { .toolbar-shell { display: flex; align-items: center; justify-content: space-between; gap: 16px; } h3 { margin: 4px 0; } p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; } }
</style>
