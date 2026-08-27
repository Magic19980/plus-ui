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
        <el-form-item label="提案状态"><el-select v-model="queryParams.reviewStatus" clearable placeholder="全部" style="width: 150px"><el-option label="暂存" value="DRAFT" /><el-option label="待审核" value="PENDING" /><el-option label="待现场确认" value="PENDING_CONFIRM" /><el-option label="已通过" value="APPROVED" /><el-option label="未通过" value="REJECTED" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">查询</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="mt-2 score-metric-panel">
      <template #header>
        <DepartmentPanelHeader kicker="LEAN METRIC" title="精益指标" description="目标 = 科室人数 × 10%；实际完成 = 所选月份现场确认已通过的提案数。">
          <el-date-picker v-model="metricMonth" type="month" value-format="YYYY-MM" :clearable="false" placeholder="统计月份" @change="loadScoreMetric" />
        </DepartmentPanelHeader>
      </template>
      <div v-loading="scoreMetricLoading" class="score-metric-content">
        <DepartmentMetricGrid :columns="5">
          <DepartmentMetricCard :value="formatMetricValue(scoreMetric?.memberCount, '人')" label="科室人数" tone="blue" />
          <DepartmentMetricCard :value="formatMetricValue(scoreMetric?.monthlyTarget, '条')" label="月度提案目标" tone="teal" />
          <DepartmentMetricCard :value="formatMetricValue(scoreMetric?.approvedCount, '条')" label="实际完成（已通过）" tone="green" />
          <DepartmentMetricCard :value="formatMetricValue(scoreMetric?.completionRate, '%')" label="完成率" tone="orange" />
          <DepartmentMetricCard :value="formatScoreValue(scoreMetric?.score)" label="精益评分" tone="red" />
        </DepartmentMetricGrid>
        <div class="score-metric-rule">评分规则：完成率 ≥120% 得 +2 分；100%～＜120% 得 +1 分；80%～＜100% 得 0 分；＜80% 得 -2 分。</div>
      </div>
    </el-card>

    <el-card shadow="hover" class="mt-2">
      <template #header>
        <DepartmentPanelHeader kicker="SCORE PROPOSAL" title="SCORE提案管理" description="系统按现有 EIP 企业改进提案表模板填入并生成 XLSX，不采集签字、固化清单和推广清单。">
          <el-button v-hasPermi="['department:scoreProposal:add']" type="primary" icon="Plus" @click="handleAdd">新增提案</el-button>
        </DepartmentPanelHeader>
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
            <el-button v-if="['DRAFT', 'REJECTED'].includes(scope.row.reviewStatus)" v-hasPermi="['department:scoreProposal:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button v-if="['PENDING', 'PENDING_CONFIRM'].includes(scope.row.reviewStatus)" v-hasPermi="['department:scoreProposal:review']" link type="success" @click="openReview(scope.row)">{{ scope.row.reviewStatus === 'PENDING_CONFIRM' ? '现场确认' : '审核' }}</el-button>
            <el-button v-if="scope.row.reviewFileOssId" v-hasPermi="['department:scoreProposal:query']" link type="success" icon="View" @click="handlePreview(scope.row)">预览</el-button>
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
          <el-col :span="12">
            <el-form-item label="部门">
              <el-tree-select
                v-model="proposalDepartmentId"
                :data="proposalDepartmentTree"
                :props="proposalDepartmentTreeProps"
                node-key="id"
                check-strictly
                filterable
                clearable
                style="width: 100%"
                placeholder="请选择部门"
                @change="handleProposalDepartmentChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企业参与人员">
              <div class="team-member-picker-trigger" role="button" tabindex="0" @click="openTeamMemberPicker" @keydown.enter.prevent="openTeamMemberPicker">
                <span v-if="selectedTeamMembers.length" class="team-member-picker-trigger-value">{{ selectedTeamMemberText }}</span>
                <span v-else class="team-member-picker-trigger-placeholder">请选择企业参与人员</span>
                <span class="team-member-picker-trigger-action">选择 <span class="team-member-picker-trigger-arrow">›</span></span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="提议人姓名" prop="proposerUserId">
              <el-select v-model="form.proposerUserId" clearable filterable style="width: 100%" placeholder="请选择提议人" @change="handleProposerChange">
                <el-option v-for="item in departmentMembers" :key="item.userId" :label="memberLabel(item)" :value="item.userId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8"><el-form-item label="提议人工号"><el-input v-model="form.employeeNo" readonly placeholder="选择提议人后自动带出" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="提议人岗位"><el-input v-model="form.proposerRole" readonly placeholder="选择提议人后自动带出" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="职位层级"><el-select v-model="form.proposerLevel" clearable filterable placeholder="请选择职位层级" style="width: 100%"><el-option v-for="item in dm_score_job" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="车间/部门"><el-input v-model="form.deptName" readonly placeholder="当前登录科室" /></el-form-item></el-col>
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
        <el-form-item label="实施人/监督人">
          <el-select
            v-model="form.implementerUserIds"
            multiple
            clearable
            filterable
            collapse-tags
            collapse-tags-tooltip
            style="width: 100%"
            placeholder="请选择实施人或监督人，可多选"
            no-data-text="当前科室暂无有效人员档案"
            @change="syncImplementerNames"
          >
            <el-option v-for="item in departmentMembers" :key="item.userId" :label="memberLabel(item)" :value="item.userId" />
          </el-select>
        </el-form-item>
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
      <template #footer>
        <el-button :loading="buttonLoading" @click="submitForm('DRAFT')">暂存</el-button>
        <el-button type="primary" :loading="buttonLoading" @click="submitForm('SUBMIT')">提交审核</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="teamMemberPicker.visible" title="选择企业参与人员" width="min(1080px, calc(100vw - 32px))" class="score-team-member-picker-dialog" append-to-body destroy-on-close>
      <div class="score-team-member-picker">
        <el-form :inline="true" class="team-member-picker-filters" @submit.prevent="handleTeamMemberPickerQuery">
          <el-form-item label="关键词">
            <el-input v-model="teamMemberPicker.keyword" clearable placeholder="姓名、账号或工号" style="width: 235px" @keyup.enter="handleTeamMemberPickerQuery" />
          </el-form-item>
          <el-form-item label="部门">
            <el-tree-select
              v-model="teamMemberPicker.deptId"
              :data="proposalDepartmentTree"
              :props="proposalDepartmentTreeProps"
              node-key="id"
              check-strictly
              filterable
              clearable
              placeholder="全部部门"
              style="width: 235px"
            />
          </el-form-item>
          <el-form-item label="岗位">
            <el-input v-model="teamMemberPicker.jobTitle" clearable placeholder="岗位名称" style="width: 175px" @keyup.enter="handleTeamMemberPickerQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleTeamMemberPickerQuery">查询</el-button>
            <el-button icon="Refresh" @click="resetTeamMemberPickerQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="team-member-picker-selection">
          <div class="team-member-picker-selection-heading">
            <span>已选人员</span>
            <el-tag type="primary" size="small">{{ teamMemberPickerSelection.length }} 人</el-tag>
            <el-button v-if="teamMemberPickerSelection.length" link type="primary" @click="clearTeamMemberSelection">清空</el-button>
          </div>
          <div v-if="teamMemberPickerSelection.length" class="team-member-picker-selection-tags">
            <el-tag v-for="item in teamMemberPickerSelection" :key="String(item.userId)" closable @close="removeTeamMember(item.userId)">
              {{ teamMemberLabel(item) }}
            </el-tag>
          </div>
          <span v-else class="team-member-picker-selection-empty">请从下方列表选择人员，可翻页或筛选后继续选择</span>
        </div>

        <el-table
          v-loading="teamMemberPicker.loading"
          :data="teamMemberOptions"
          row-key="userId"
          class="team-member-picker-table"
          @row-click="handleTeamMemberRowClick"
        >
          <template #empty><el-empty description="没有符合条件的人员" :image-size="72" /></template>
          <el-table-column width="58" align="center">
            <template #header>
              <el-checkbox
                :model-value="isTeamMemberPageAllSelected"
                :indeterminate="isTeamMemberPageIndeterminate"
                @change="toggleTeamMemberPage"
              />
            </template>
            <template #default="scope">
              <el-checkbox
                :model-value="isTeamMemberSelected(scope.row)"
                @click.stop
                @change="handleTeamMemberCheckboxChange(scope.row, $event)"
              />
            </template>
          </el-table-column>
          <el-table-column label="账号" prop="userName" min-width="160" show-overflow-tooltip />
          <el-table-column label="姓名" prop="nickName" min-width="140" show-overflow-tooltip />
          <el-table-column label="工号" prop="employeeNo" width="140" show-overflow-tooltip />
          <el-table-column label="岗位" prop="jobTitle" min-width="180" show-overflow-tooltip />
        </el-table>
        <pagination
          v-show="teamMemberPicker.total > 0"
          v-model:page="teamMemberPicker.pageNum"
          v-model:limit="teamMemberPicker.pageSize"
          :total="teamMemberPicker.total"
          @pagination="loadTeamMemberPicker"
        />
      </div>
      <template #footer>
        <div class="team-member-picker-footer-summary">已选择 {{ teamMemberPickerSelection.length }} 人，翻页或筛选不会清除已选项</div>
        <el-button type="primary" @click="confirmTeamMemberSelection">确定选择</el-button>
        <el-button @click="teamMemberPicker.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialog.visible" :title="reviewDialog.stage === 'CONFIRM' ? '现场确认SCORE提案' : '审核SCORE提案'" width="520px" append-to-body>
      <el-alert v-if="reviewDialog.stage === 'CONFIRM'" title="审核已通过，请在线下确认完成后再提交最终结果。" type="info" :closable="false" class="mb-4" />
      <el-form label-width="90px"><el-form-item :label="reviewDialog.stage === 'CONFIRM' ? '确认结果' : '审核结果'"><el-radio-group v-model="reviewDialog.status"><el-radio label="APPROVED">通过</el-radio><el-radio label="REJECTED">不通过</el-radio></el-radio-group></el-form-item><el-form-item :label="reviewDialog.stage === 'CONFIRM' ? '确认意见' : '审核意见'"><el-input v-model="reviewDialog.comment" type="textarea" :rows="4" /></el-form-item></el-form>
      <template #footer><el-button type="primary" :loading="reviewDialog.loading" @click="submitReview">确定</el-button><el-button @click="reviewDialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="previewDialog.visible" :title="previewDialog.title" width="92vw" top="3vh" append-to-body destroy-on-close>
      <div v-loading="previewDialog.loading" class="score-preview-container">
        <iframe v-if="previewDialog.url" :src="previewDialog.url" title="SCORE提案Excel预览" class="score-preview-frame" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentScoreProposal" lang="ts">
import { computed, onMounted, reactive, ref, toRefs } from 'vue';
import ImageUpload from '@/components/ImageUpload/index.vue';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import DepartmentMetricCard from '@/components/Department/MetricCard.vue';
import DepartmentMetricGrid from '@/components/Department/MetricGrid.vue';
import { listScoreCategoryOptions } from '@/api/department/scoreCategory';
import type { ScoreCategoryVO } from '@/api/department/scoreCategory/types';
import { addScoreProposal, delScoreProposal, exportScoreProposal, getScoreProposal, getScoreProposalMetric, listScoreProposal, listScoreProposalMemberOptions, listScoreProposalUserOptionsByIds, listScoreProposalUserOptionsPage, previewScoreProposal, reviewScoreProposal, updateScoreProposal } from '@/api/department/scoreProposal';
import type { ScoreProposalForm, ScoreProposalMemberOptionVO, ScoreProposalMetricVO, ScoreProposalPayload, ScoreProposalQuery, ScoreProposalUserOptionQuery, ScoreProposalVO } from '@/api/department/scoreProposal/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { download as requestDownload } from '@/utils/request';
import { useDepartmentStore } from '@/store/modules/department';
import { useUserStore } from '@/store/modules/user';
import { useDict } from '@/utils/dict';
import { useRoute } from 'vue-router';
import { deptTreeSelect } from '@/api/system/user';
import type { DeptTreeVO } from '@/api/system/dept/types';

const { loading, withLoading } = useLoading(true);
const list = ref<ScoreProposalVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const metricMonth = ref(formatCurrentMonth());
const scoreMetric = ref<ScoreProposalMetricVO>();
const scoreMetricLoading = ref(false);
const formRef = ref<ElFormInstance>();
const dateRange = ref<string[]>([]);
const categoryTree = ref<ScoreCategoryVO[]>([]);
const departmentMembers = ref<ScoreProposalMemberOptionVO[]>([]);
const teamMemberOptions = ref<ScoreProposalMemberOptionVO[]>([]);
const selectedTeamMembers = ref<ScoreProposalMemberOptionVO[]>([]);
const teamMemberPickerSelection = ref<ScoreProposalMemberOptionVO[]>([]);
const { dm_score_job } = toRefs<any>(useDict('dm_score_job'));
const queryParams = reactive<ScoreProposalQuery>({ pageNum: 1, pageSize: 10 });
const form = reactive<ScoreProposalForm>({ proposerUserId: undefined, proposerName: '', proposerLevel: '', teamMemberUserIds: [], completionStatus: '进行中' });
const proposalDepartmentTree = ref<DeptTreeVO[]>([]);
const proposalDepartmentId = ref<string | number>();
const proposalDepartmentTreeProps = { value: 'id', label: 'label', children: 'children' };
const dialog = reactive({ visible: false, title: '' });
const teamMemberPicker = reactive<ScoreProposalUserOptionQuery & { visible: boolean; loading: boolean; total: number }>({
  visible: false,
  loading: false,
  total: 0,
  pageNum: 1,
  pageSize: 8,
  keyword: undefined,
  deptId: undefined,
  jobTitle: undefined
});
const reviewDialog = reactive({ visible: false, loading: false, id: undefined as string | number | undefined, stage: 'REVIEW' as 'REVIEW' | 'CONFIRM', status: 'APPROVED' as 'APPROVED' | 'REJECTED', comment: '' });
const previewDialog = reactive({ visible: false, loading: false, title: '', url: '' });
const departmentStore = useDepartmentStore();
const userStore = useUserStore();
const route = useRoute();
const rules = {
  proposerUserId: [{ required: true, message: '请选择提议人', trigger: 'change' }],
  mainCategoryId: [{ required: true, message: '请选择提案大类', trigger: 'change' }],
  subCategoryId: [{ required: true, message: '请选择提案小类', trigger: 'change' }]
};

function formatCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const formatMetricValue = (value?: number | null, unit = '') => {
  if (value === undefined || value === null) return '—';
  return `${Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 1 })}${unit}`;
};
const formatScoreValue = (value?: number | null) => {
  if (value === undefined || value === null) return '—';
  return `${value > 0 ? '+' : ''}${value}分`;
};

const subCategoryOptions = computed(() => categoryTree.value.find((item) => String(item.id) === String(form.mainCategoryId))?.children || []);
const querySubCategoryOptions = computed(() => categoryTree.value.find((item) => item.categoryName === queryParams.mainCategory)?.children || []);

const statusLabel = (value: any) => ({ DRAFT: '暂存', PENDING: '待审核', PENDING_CONFIRM: '待现场确认', APPROVED: '已通过', REJECTED: '未通过' })[value] || value;
const statusType = (value: any) => ({ DRAFT: 'info', PENDING: 'warning', PENDING_CONFIRM: 'warning', APPROVED: 'success', REJECTED: 'danger' } as Record<string, any>)[value] || 'info';
const imageExt = (refType: string) => ({ bizType: 'DEPARTMENT_SCORE', source: 'userUpload', refType });
const memberLabel = (item: ScoreProposalMemberOptionVO) => item.nickName || item.userName;
const teamMemberLabel = (item: ScoreProposalMemberOptionVO) => {
  const name = memberLabel(item);
  const account = item.userName && item.userName !== name ? `（${item.userName}）` : '';
  return `${name}${account}`;
};
const selectedTeamMemberText = computed(() => {
  const names = selectedTeamMembers.value.slice(0, 2).map(teamMemberLabel);
  if (selectedTeamMembers.value.length > 2) names.push(`+${selectedTeamMembers.value.length - 2}人`);
  return names.join('、');
});
const loadDepartmentMembers = async () => {
  const res = await listScoreProposalMemberOptions();
  departmentMembers.value = res.data || [];
};
const syncCurrentDepartment = async () => {
  await departmentStore.load();
  const currentDepartment = departmentStore.contexts.find(item => item.current) || departmentStore.contexts[0];
  form.deptName = currentDepartment?.deptName || '';
};
const filterProposalDepartmentTree = (nodes: DeptTreeVO[]): DeptTreeVO[] => {
  return nodes.filter(node => !node.disabled).map(node => ({
    ...node,
    children: filterProposalDepartmentTree(node.children || [])
  }));
};
const loadProposalDepartmentOptions = async () => {
  if (proposalDepartmentTree.value.length) return;
  const res = await deptTreeSelect();
  proposalDepartmentTree.value = filterProposalDepartmentTree(res.data || []);
};
const findProposalDepartment = (nodes: DeptTreeVO[], value: string | number | undefined): DeptTreeVO | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  for (const node of nodes) {
    if (String(node.id) === String(value)) return node;
    const child = findProposalDepartment(node.children || [], value);
    if (child) return child;
  }
  return undefined;
};
const findProposalDepartmentIdByName = (nodes: DeptTreeVO[], name: string | undefined): string | number | undefined => {
  if (!name) return undefined;
  for (const node of nodes) {
    if (node.label === name) return node.id;
    const childId = findProposalDepartmentIdByName(node.children || [], name);
    if (childId !== undefined) return childId;
  }
  return undefined;
};
const handleProposalDepartmentChange = (deptId?: string | number) => {
  form.companyName = findProposalDepartment(proposalDepartmentTree.value, deptId)?.label || '';
};
const applyProposer = (userId?: string | number) => {
  const member = departmentMembers.value.find((item) => String(item.userId) === String(userId));
  form.proposerUserId = member?.userId;
  form.proposerName = member ? memberLabel(member) : '';
  form.employeeNo = member?.employeeNo || '';
  form.proposerRole = member?.jobTitle || '';
};
const handleProposerChange = (userId?: string | number) => applyProposer(userId);
const setDefaultProposer = () => applyProposer(userStore.userId);
const syncImplementerNames = () => {
  const selectedIds = form.implementerUserIds || [];
  form.implementerSupervisor = selectedIds
    .map((userId) => departmentMembers.value.find((item) => String(item.userId) === String(userId)))
    .filter((item): item is ScoreProposalMemberOptionVO => Boolean(item))
    .map(memberLabel)
    .join('、');
};

const isTeamMemberSelected = (row: ScoreProposalMemberOptionVO) => {
  return teamMemberPickerSelection.value.some(item => String(item.userId) === String(row.userId));
};
const isTeamMemberPageAllSelected = computed(() => {
  return teamMemberOptions.value.length > 0 && teamMemberOptions.value.every(isTeamMemberSelected);
});
const isTeamMemberPageIndeterminate = computed(() => {
  const selectedCount = teamMemberOptions.value.filter(isTeamMemberSelected).length;
  return selectedCount > 0 && selectedCount < teamMemberOptions.value.length;
});
const loadSelectedTeamMembers = async (ids?: Array<string | number>) => {
  const selectedIds = ids || [];
  if (!selectedIds.length) {
    selectedTeamMembers.value = [];
    return;
  }
  const res = await listScoreProposalUserOptionsByIds(selectedIds);
  const optionsById = new Map((res.data || []).map(item => [String(item.userId), item]));
  selectedTeamMembers.value = selectedIds
    .map(userId => optionsById.get(String(userId)))
    .filter((item): item is ScoreProposalMemberOptionVO => Boolean(item));
};
const loadTeamMemberPicker = async () => {
  teamMemberPicker.loading = true;
  try {
    const res = await listScoreProposalUserOptionsPage({
      pageNum: teamMemberPicker.pageNum,
      pageSize: teamMemberPicker.pageSize,
      keyword: teamMemberPicker.keyword,
      deptId: teamMemberPicker.deptId,
      jobTitle: teamMemberPicker.jobTitle
    });
    teamMemberOptions.value = res.data?.rows || [];
    teamMemberPicker.total = res.data?.total || 0;
  } finally {
    teamMemberPicker.loading = false;
  }
};
const openTeamMemberPicker = async () => {
  teamMemberPicker.visible = true;
  teamMemberPicker.pageNum = 1;
  teamMemberPicker.keyword = undefined;
  teamMemberPicker.deptId = undefined;
  teamMemberPicker.jobTitle = undefined;
  const selectedIds = form.teamMemberUserIds || [];
  const cachedIds = selectedTeamMembers.value.map(item => String(item.userId));
  if (cachedIds.length !== selectedIds.length || selectedIds.some(userId => !cachedIds.includes(String(userId)))) {
    await loadSelectedTeamMembers(selectedIds);
  }
  teamMemberPickerSelection.value = [...selectedTeamMembers.value];
  await loadTeamMemberPicker();
};
const handleTeamMemberPickerQuery = () => {
  teamMemberPicker.pageNum = 1;
  loadTeamMemberPicker();
};
const resetTeamMemberPickerQuery = () => {
  teamMemberPicker.keyword = undefined;
  teamMemberPicker.deptId = undefined;
  teamMemberPicker.jobTitle = undefined;
  teamMemberPicker.pageNum = 1;
  loadTeamMemberPicker();
};
const removeTeamMember = (userId: string | number) => {
  teamMemberPickerSelection.value = teamMemberPickerSelection.value.filter(item => String(item.userId) !== String(userId));
};
const clearTeamMemberSelection = () => {
  teamMemberPickerSelection.value = [];
};
const toggleTeamMember = (row: ScoreProposalMemberOptionVO, checked?: boolean) => {
  const exists = isTeamMemberSelected(row);
  const shouldSelect = checked === undefined ? !exists : checked;
  if (shouldSelect && !exists) {
    teamMemberPickerSelection.value = [...teamMemberPickerSelection.value, row];
  } else if (!shouldSelect && exists) {
    removeTeamMember(row.userId);
  }
};
const handleTeamMemberCheckboxChange = (row: ScoreProposalMemberOptionVO, checked: boolean | string | number) => {
  toggleTeamMember(row, Boolean(checked));
};
const handleTeamMemberRowClick = (row: ScoreProposalMemberOptionVO) => {
  toggleTeamMember(row);
};
const toggleTeamMemberPage = (checked: boolean | string | number) => {
  const shouldSelect = Boolean(checked);
  if (shouldSelect) {
    const selectedIds = new Set(teamMemberPickerSelection.value.map(item => String(item.userId)));
    teamMemberPickerSelection.value = [
      ...teamMemberPickerSelection.value,
      ...teamMemberOptions.value.filter(item => !selectedIds.has(String(item.userId)))
    ];
  } else {
    const pageIds = new Set(teamMemberOptions.value.map(item => String(item.userId)));
    teamMemberPickerSelection.value = teamMemberPickerSelection.value.filter(item => !pageIds.has(String(item.userId)));
  }
};
const confirmTeamMemberSelection = () => {
  selectedTeamMembers.value = [...teamMemberPickerSelection.value];
  form.teamMemberUserIds = teamMemberPickerSelection.value.map(item => item.userId);
  teamMemberPicker.visible = false;
};

const getList = async () => withLoading(async () => { const res = await listScoreProposal(queryParams); list.value = res.data?.rows || []; total.value = res.data?.total || 0; });
const loadScoreMetric = async () => {
  scoreMetricLoading.value = true;
  try {
    const res = await getScoreProposalMetric(metricMonth.value);
    scoreMetric.value = res.data;
  } finally {
    scoreMetricLoading.value = false;
  }
};
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
const resetForm = () => Object.assign(form, { id: undefined, proposerUserId: undefined, companyName: '', teamMemberUserIds: [], employeeNo: '', proposerName: '', proposerRole: '', proposerLevel: defaultProposerLevel(), deptName: '', mainCategoryId: undefined, subCategoryId: undefined, mainCategory: '', subCategory: '', problemDescription: '', improvementMeasure: '', implementerSupervisor: '', implementerUserIds: [], beforeOssId: undefined, afterOssId: undefined, startDate: '', plannedCompletionDate: '', actualCompletionDate: '', completionStatus: '进行中', remark: '' });
const handleAdd = async () => {
  resetForm();
  selectedTeamMembers.value = [];
  proposalDepartmentId.value = undefined;
  await Promise.all([loadDepartmentMembers(), syncCurrentDepartment(), loadProposalDepartmentOptions()]);
  setDefaultProposer();
  dialog.title = '新增SCORE提案';
  dialog.visible = true;
};
const handleUpdate = async (row: any) => {
  await Promise.all([loadDepartmentMembers(), syncCurrentDepartment(), loadProposalDepartmentOptions()]);
  Object.assign(form, { ...row });
  form.teamMemberUserIds = Array.isArray(form.teamMemberUserIds) ? form.teamMemberUserIds : [];
  await loadSelectedTeamMembers(form.teamMemberUserIds);
  proposalDepartmentId.value = findProposalDepartmentIdByName(proposalDepartmentTree.value, form.companyName);
  if (form.proposerUserId && !departmentMembers.value.some((item) => String(item.userId) === String(form.proposerUserId))) {
    departmentMembers.value.push({ userId: form.proposerUserId, userName: form.proposerName, nickName: form.proposerName, employeeNo: form.employeeNo });
  }
  const implementerNames = (form.implementerSupervisor || '').split(/[、,，]/).map((item) => item.trim()).filter(Boolean);
  form.implementerUserIds = (form.implementerUserIds || []).map((userId, index) => {
    if (!departmentMembers.value.some((item) => String(item.userId) === String(userId))) {
      const name = implementerNames[index] || `已离开成员（${userId}）`;
      departmentMembers.value.push({ userId, userName: name, nickName: name });
    }
    return userId;
  });
  if (form.proposerUserId) applyProposer(form.proposerUserId);
  syncImplementerNames();
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
const submitForm = async (saveMode: 'DRAFT' | 'SUBMIT') => {
  if (saveMode === 'SUBMIT') await formRef.value?.validate();
  else await formRef.value?.validateField('proposerUserId');
  syncCategoryNames();
  const { proposerRole: _proposerRole, ...payload } = form;
  payload.saveMode = saveMode;
  buttonLoading.value = true;
  try {
    if (form.id) await updateScoreProposal(payload as ScoreProposalPayload & { id: string | number });
    else await addScoreProposal(payload as ScoreProposalPayload);
    modal.msgSuccess(saveMode === 'SUBMIT' ? '已提交审核，审核人将收到提醒' : '已暂存');
    dialog.visible = false;
    await Promise.all([getList(), loadScoreMetric()]);
  } finally {
    buttonLoading.value = false;
  }
};
const handleDelete = async (row: any) => { await modal.confirm(`确认删除“${row.proposerName}”的提案吗？`); await delScoreProposal(row.id); modal.msgSuccess('删除成功'); await Promise.all([getList(), loadScoreMetric()]); };
const openReview = (row: any) => { reviewDialog.id = row.id; reviewDialog.stage = row.reviewStatus === 'PENDING_CONFIRM' ? 'CONFIRM' : 'REVIEW'; reviewDialog.status = 'APPROVED'; reviewDialog.comment = ''; reviewDialog.visible = true; };
const submitReview = async () => {
  if (!reviewDialog.id) return;
  if (reviewDialog.status === 'REJECTED' && !reviewDialog.comment.trim()) { modal.msgWarning(reviewDialog.stage === 'CONFIRM' ? '请填写现场确认意见' : '请填写审核意见'); return; }
  reviewDialog.loading = true;
  try {
    const action = reviewDialog.stage === 'CONFIRM'
      ? (reviewDialog.status === 'APPROVED' ? 'CONFIRM_APPROVE' : 'CONFIRM_REJECT')
      : (reviewDialog.status === 'APPROVED' ? 'REVIEW_APPROVE' : 'REVIEW_REJECT');
    await reviewScoreProposal({ id: reviewDialog.id, action, reviewComment: reviewDialog.comment });
    modal.msgSuccess(reviewDialog.stage === 'CONFIRM' ? '现场确认完成' : '审核完成');
    reviewDialog.visible = false;
    await Promise.all([getList(), loadScoreMetric()]);
  } finally { reviewDialog.loading = false; }
};
const handleExport = (row: any) => requestDownload(exportScoreProposal(row.id), {}, `SCORE提案-${row.proposerName || row.id}.xlsx`);
const clearPreview = () => {
  if (previewDialog.url) URL.revokeObjectURL(previewDialog.url);
  previewDialog.url = '';
  previewDialog.loading = false;
};
const handlePreview = async (row: any) => {
  clearPreview();
  previewDialog.title = `预览：${row.reviewFileName || `SCORE提案-${row.id}.xlsx`}`;
  previewDialog.visible = true;
  previewDialog.loading = true;
  try {
    const blob = await previewScoreProposal(row.id);
    // 网关可能会把 text/html 响应的 MIME 改成二进制或纯文本，强制指定类型，避免 iframe 把 HTML 源码当文本显示。
    const htmlBlob = new Blob([blob], { type: 'text/html;charset=UTF-8' });
    previewDialog.url = URL.createObjectURL(htmlBlob);
  } catch {
    previewDialog.visible = false;
    modal.msgError('Excel预览失败，请检查审核文件是否仍保存在 MinIO');
  } finally {
    previewDialog.loading = false;
  }
};

onMounted(async () => {
  await Promise.all([getList(), getCategoryOptions(), loadScoreMetric()]);
  const routeId = route.query.id;
  if (routeId && route.query.mode === 'review') {
    const res = await getScoreProposal(String(routeId));
    if (res.data) openReview(res.data);
  }
});
</script>

<style scoped lang="scss">
.score-preview-container { min-height: 70vh; background: #f5f7fa; }
.score-preview-frame { display: block; width: 100%; height: 70vh; border: 0; background: #f5f7fa; }
.score-metric-panel {
  :deep(.el-card__header) { padding: 16px 20px; }
}
.score-metric-content { min-height: 88px; }
.score-metric-rule {
  margin-top: 14px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
.team-member-picker-trigger {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  padding: 0 10px 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
  cursor: pointer;
  text-align: left;
  transition: border-color .2s, box-shadow .2s;
}
.team-member-picker-trigger:hover,
.team-member-picker-trigger:focus-visible {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
  outline: none;
}
.team-member-picker-trigger-value,
.team-member-picker-trigger-placeholder {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.team-member-picker-trigger-value { color: var(--el-text-color-primary); }
.team-member-picker-trigger-placeholder { color: var(--el-text-color-placeholder); }
.team-member-picker-trigger-action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
  color: var(--el-color-primary);
  font-size: 12px;
  white-space: nowrap;
}
.team-member-picker-trigger-arrow {
  font-size: 16px;
  line-height: 1;
}
</style>

<style lang="scss">
.score-team-member-picker-dialog {
  .el-dialog__body { padding: 16px 20px 10px; }

  .el-dialog__footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px 20px;
  }

  .team-member-picker-footer-summary {
    flex: 1;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-align: left;
  }

  .team-member-picker-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0 12px;
    margin-bottom: 14px;
    padding: 14px 16px 2px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
  }

  .team-member-picker-filters .el-form-item { margin-bottom: 12px; }

  .team-member-picker-selection {
    margin-bottom: 14px;
    padding: 11px 14px;
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 10px;
    background: var(--el-color-primary-light-9);
  }

  .team-member-picker-selection-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 600;
  }

  .team-member-picker-selection-heading .el-button { margin-left: auto; }

  .team-member-picker-selection-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 74px;
    margin-top: 10px;
    overflow-y: auto;
  }

  .team-member-picker-selection-empty {
    display: block;
    margin-top: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .team-member-picker-table {
    .el-table__row { cursor: pointer; }
    .el-table__header th { background: var(--el-fill-color-lighter); }
    .el-table__cell { padding: 10px 0; }
  }
}
</style>
