<template>
  <div class="p-2 app-container department-task-page">
    <el-card shadow="never" class="task-intro">
      <DepartmentPanelHeader kicker="DEPARTMENT TASK CENTER" title="任务管理" description="按成员分配 SCORE、5WHY 等周期任务，以及按个人工作日执行的日报任务；未分配任务的成员不产生完成要求。">
        <el-tag type="info" effect="plain">当前周期自动统计</el-tag>
      </DepartmentPanelHeader>
    </el-card>

    <el-card shadow="never" class="task-card mt-2">
      <el-tabs v-model="activeTab" class="task-tabs">
        <el-tab-pane label="我的任务" name="my">
          <div class="tab-heading">
            <div class="tab-heading__content">
               <h4>我的任务</h4>
               <p>只显示分配给当前登录人的任务；日报按今天的个人工作日判断，未分配任务不计入提醒和缺报。</p>
            </div>
            <div class="tab-heading__actions">
              <el-button icon="Refresh" @click="refreshMyTasks">刷新</el-button>
            </div>
          </div>
          <section v-if="reviewTasks.length" class="review-tasks" aria-label="待处理的 SCORE 提案">
            <div class="review-tasks__header">
              <div class="review-tasks__heading">
                <span class="review-tasks__eyebrow">待处理事项</span>
                <h4>SCORE 提案审核</h4>
                <p>需要你处理的提案会集中显示在这里，完成后任务将自动更新。</p>
              </div>
              <el-tag type="warning" effect="plain" round>{{ reviewTasks.length }} 项待处理</el-tag>
            </div>
            <div v-loading="reviewTaskLoading" class="review-tasks__list">
              <div v-for="task in reviewTasks" :key="task.id" class="review-task-item">
                <div class="review-task-item__icon"><el-icon><DocumentChecked /></el-icon></div>
                <div class="review-task-item__content">
                  <div class="review-task-item__title">{{ task.proposerName || task.taskTitle || '未命名提案' }}</div>
                  <div class="review-task-item__meta">
                    <el-tag size="small" :type="task.stage === 'CONFIRM' ? 'success' : 'warning'" effect="light">{{ task.stageLabel }}</el-tag>
                    <span>版本 V{{ task.revisionNo }}</span>
                    <span>{{ task.mainCategory || '未分类' }}</span>
                    <span>{{ formatReviewTaskTime(task.createTime) }}</span>
                  </div>
                </div>
                <el-button type="primary" plain @click="openScoreReviewTask(task)">处理</el-button>
              </div>
            </div>
          </section>
          <el-table v-loading="myLoading" :data="myTasks" border>
            <el-table-column label="任务名称" prop="taskName" min-width="180" show-overflow-tooltip />
            <el-table-column label="任务类型" width="130" align="center"><template #default="scope">{{ taskTypeLabel(scope.row.taskType) }}</template></el-table-column>
            <el-table-column label="执行方式" width="120" align="center"><template #default="scope">{{ cycleLabel(scope.row.cycleType, scope.row.taskType) }}</template></el-table-column>
            <el-table-column label="日期/周期" min-width="210" align="center"><template #default="scope">{{ scope.row.periodStart }} 至 {{ scope.row.periodEnd }}</template></el-table-column>
            <el-table-column label="完成情况" width="120" align="center"><template #default="scope">{{ scope.row.completedCount }}/{{ scope.row.requiredCount }}</template></el-table-column>
            <el-table-column label="截止时间" width="180" align="center" prop="deadline" />
            <el-table-column label="状态" width="110" align="center"><template #default="scope"><el-tag :type="taskStatusType(scope.row.status)">{{ scope.row.statusLabel || taskStatusLabel(scope.row.status) }}</el-tag></template></el-table-column>
            <el-table-column label="提醒" min-width="160" show-overflow-tooltip><template #default="scope">{{ scope.row.reminderText || '—' }}</template></el-table-column>
          </el-table>
          <el-empty v-if="!myLoading && myTasks.length === 0" description="当前没有分配给你的周期任务" />
        </el-tab-pane>

        <el-tab-pane label="任务规则" name="rules" lazy>
          <div class="tab-heading">
            <div class="tab-heading__content">
              <h4>任务规则与成员分配</h4>
               <p>先定义周期任务或日报任务，再通过“成员”按钮明确分配；日报按成员个人工作日逐日检查。</p>
            </div>
            <div class="tab-heading__actions">
              <el-button v-hasPermi="['department:task:add']" type="primary" icon="Plus" @click="openRuleAdd">新增任务规则</el-button>
            </div>
          </div>
          <el-table v-loading="ruleLoading" :data="taskRules" border>
            <el-table-column label="任务名称" prop="taskName" min-width="180" show-overflow-tooltip />
            <el-table-column label="任务类型" width="125" align="center"><template #default="scope">{{ taskTypeLabel(scope.row.taskType) }}</template></el-table-column>
            <el-table-column label="执行方式" width="150" align="center"><template #default="scope">{{ ruleExecutionLabel(scope.row) }}</template></el-table-column>
            <el-table-column label="截止规则" min-width="190"><template #default="scope">{{ deadlineLabel(scope.row) }}</template></el-table-column>
            <el-table-column label="统计口径" width="115" align="center"><template #default="scope">{{ countModeLabel(scope.row) }}</template></el-table-column>
            <el-table-column label="已分配" width="90" align="center"><template #default="scope"><el-tag type="info">{{ scope.row.assignmentCount || 0 }} 人</el-tag></template></el-table-column>
            <el-table-column label="状态" width="90" align="center"><template #default="scope"><el-tag :type="scope.row.status === 'DISABLED' ? 'info' : 'success'">{{ scope.row.status === 'DISABLED' ? '停用' : '启用' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" fixed="right" width="220" align="center">
              <template #default="scope">
                <el-button v-hasPermi="['department:task:edit']" link type="success" icon="User" @click="openAssignmentDialog(scope.row)">成员</el-button>
                <el-button v-hasPermi="['department:task:edit']" link type="primary" icon="Edit" @click="openRuleEdit(scope.row)">编辑</el-button>
                <el-button v-hasPermi="['department:task:remove']" link type="danger" icon="Delete" @click="removeRule(scope.row)" />
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!ruleLoading && taskRules.length === 0" description="暂无任务规则" />
        </el-tab-pane>

        <el-tab-pane label="审核人配置" name="review" lazy>
          <div class="tab-heading">
            <div class="tab-heading__content">
              <h4>业务审核人</h4>
              <p>SCORE 和 5WHY 使用独立审核人配置；未配置时，业务审核接口会拒绝审核。</p>
            </div>
            <div class="tab-heading__actions">
              <el-button v-hasPermi="['department:task:reviewConfig']" type="primary" icon="Plus" @click="openReviewAdd">新增审核配置</el-button>
            </div>
          </div>
          <el-table v-loading="reviewLoading" :data="reviewRules" border>
            <el-table-column label="业务" width="150" align="center"><template #default="scope">{{ taskTypeLabel(scope.row.taskType) }}</template></el-table-column>
            <el-table-column label="主审核人" prop="reviewerName" min-width="160" />
            <el-table-column label="备用审核人" prop="backupReviewerName" min-width="160"><template #default="scope">{{ scope.row.backupReviewerName || '—' }}</template></el-table-column>
            <el-table-column label="生效时间" min-width="210" align="center"><template #default="scope">{{ scope.row.effectiveStart || '立即' }} 至 {{ scope.row.effectiveEnd || '长期' }}</template></el-table-column>
            <el-table-column label="状态" width="90" align="center"><template #default="scope"><el-tag :type="scope.row.status === 'DISABLED' ? 'info' : 'success'">{{ scope.row.status === 'DISABLED' ? '停用' : '启用' }}</el-tag></template></el-table-column>
            <el-table-column label="备注" min-width="180" show-overflow-tooltip />
            <el-table-column label="操作" fixed="right" width="150" align="center">
              <template #default="scope">
                <el-button v-hasPermi="['department:task:reviewConfig']" link type="primary" icon="Edit" @click="openReviewEdit(scope.row)">编辑</el-button>
                <el-button v-hasPermi="['department:task:reviewConfig']" link type="danger" icon="Delete" @click="removeReview(scope.row)" />
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!reviewLoading && reviewRules.length === 0" description="暂无审核人配置" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <TaskRuleDialog
      v-model="ruleDialog.visible"
      :title="ruleDialog.title"
      :form="ruleForm"
      :loading="buttonLoading"
      @task-type-change="onTaskTypeChange"
      @save="saveRule"
    />

    <TaskAssignmentDialog
      v-model="assignmentDialog.visible"
      :selected-rule="selectedRule"
      :user-options="userOptions"
      :assignments="assignments"
      :loading="assignmentLoading"
      :form="assignmentForm"
      :work-days="assignmentWorkDays"
      :week-options="weekOptions"
      :work-day-label="workDayLabel"
      @update:work-days="updateAssignmentWorkDays"
      @save="saveAssignment"
      @cancel-edit="cancelAssignmentEdit"
      @edit="editAssignment"
      @remove="removeAssignment"
    />

    <el-dialog v-model="reviewDialog.visible" :title="reviewDialog.title" width="560px" append-to-body>
      <el-form ref="reviewFormRef" :model="reviewForm" :rules="reviewRulesForm" label-width="110px">
        <el-form-item label="业务类型" prop="taskType"><el-select v-model="reviewForm.taskType" style="width: 100%"><el-option label="SCORE提案" value="SCORE_PROPOSAL" /><el-option label="5WHY分析" value="FIVE_WHY" /></el-select></el-form-item>
        <el-form-item label="主审核人" prop="reviewerUserId"><el-select v-model="reviewForm.reviewerUserId" filterable placeholder="选择主审核人" style="width: 100%"><el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName || item.userName}（${item.userName}）`" :value="item.userId" /></el-select></el-form-item>
        <el-form-item label="备用审核人"><el-select v-model="reviewForm.backupReviewerUserId" filterable clearable placeholder="可选" style="width: 100%"><el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName || item.userName}（${item.userName}）`" :value="item.userId" /></el-select></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="生效开始"><el-date-picker v-model="reviewForm.effectiveStart" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="生效结束"><el-date-picker v-model="reviewForm.effectiveEnd" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="状态"><el-radio-group v-model="reviewForm.status"><el-radio label="ENABLED">启用</el-radio><el-radio label="DISABLED">停用</el-radio></el-radio-group></el-form-item>
        <el-form-item label="备注"><el-input v-model="reviewForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="buttonLoading" @click="saveReview">保存</el-button><el-button @click="reviewDialog.visible = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentTask" lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { DocumentChecked } from '@element-plus/icons-vue';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import TaskAssignmentDialog from './components/TaskAssignmentDialog.vue';
import TaskRuleDialog from './components/TaskRuleDialog.vue';
import { addDepartmentReviewRule, addDepartmentTaskAssignment, addDepartmentTaskRule, delDepartmentReviewRule, delDepartmentTaskAssignment, delDepartmentTaskRule, listDepartmentReviewRules, listDepartmentTaskAssignments, listDepartmentTaskRules, listMyDepartmentTasks, listMyScoreProposalReviewTasks, updateDepartmentReviewRule, updateDepartmentTaskAssignment, updateDepartmentTaskRule } from '@/api/department/task';
import type { DepartmentReviewRuleForm, DepartmentReviewRuleVO, DepartmentTaskAssignmentForm, DepartmentTaskAssignmentVO, DepartmentTaskProgressVO, DepartmentTaskRuleForm, DepartmentTaskRuleVO, ScoreProposalReviewTaskVO } from '@/api/department/task/types';
import { listPersonMemberOptions } from '@/api/department/person';
import type { PersonUserOptionVO } from '@/api/department/person/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';

const activeTab = ref('my');
const myTasks = ref<DepartmentTaskProgressVO[]>([]);
const reviewTasks = ref<ScoreProposalReviewTaskVO[]>([]);
const taskRules = ref<DepartmentTaskRuleVO[]>([]);
const reviewRules = ref<DepartmentReviewRuleVO[]>([]);
const userOptions = ref<PersonUserOptionVO[]>([]);
const userOptionsLoaded = ref(false);
let userOptionsPromise: Promise<void> | undefined;
const assignments = ref<DepartmentTaskAssignmentVO[]>([]);
const selectedRule = ref<DepartmentTaskRuleVO>();
const buttonLoading = ref(false);
const assignmentLoading = ref(false);
const { loading: myLoading, withLoading: withMyLoading } = useLoading(true);
const reviewTaskLoading = ref(false);
const { loading: ruleLoading, withLoading: withRuleLoading } = useLoading(true);
const { loading: reviewLoading, withLoading: withReviewLoading } = useLoading(true);
const reviewFormRef = ref<ElFormInstance>();
const ruleDialog = reactive({ visible: false, title: '' });
const assignmentDialog = reactive({ visible: false });
const reviewDialog = reactive({ visible: false, title: '' });
const rulesLoaded = ref(false);
const reviewsLoaded = ref(false);
const ruleForm = reactive<DepartmentTaskRuleForm>({ taskName: '', taskType: 'SCORE_PROPOSAL', cycleType: 'MONTH', requiredCount: 1, deadlineDay: 0, deadlineTime: '18:00:00', countMode: 'SUBMITTED', remindHours: 24, status: 'ENABLED' });
const assignmentForm = reactive<DepartmentTaskAssignmentForm>({ userId: undefined, effectiveStart: undefined, status: 'ENABLED' });
const assignmentWorkDays = ref<string[]>(['1', '2', '3', '4', '5']);
const weekOptions = [{ value: '1', label: '周一' }, { value: '2', label: '周二' }, { value: '3', label: '周三' }, { value: '4', label: '周四' }, { value: '5', label: '周五' }, { value: '6', label: '周六' }, { value: '7', label: '周日' }];
const reviewForm = reactive<DepartmentReviewRuleForm>({ taskType: 'SCORE_PROPOSAL', reviewerUserId: undefined, backupReviewerUserId: undefined, status: 'ENABLED' });
const reviewRulesForm = { taskType: [{ required: true, message: '请选择业务类型', trigger: 'change' }], reviewerUserId: [{ required: true, message: '请选择主审核人', trigger: 'change' }] };

const taskTypeLabel = (value?: string) => ({ SCORE_PROPOSAL: 'SCORE提案', FIVE_WHY: '5WHY分析', DAILY_REPORT: '日报' })[value || ''] || value || '—';
const cycleLabel = (value?: string, taskType?: string) => taskType === 'DAILY_REPORT' || value === 'DAY'
  ? '按工作日逐日'
  : ({ WEEK: '每周', MONTH: '每月', QUARTER: '每季度' })[value || ''] || value || '—';
const taskStatusLabel = (value?: string) => ({ COMPLETED: '已完成', OVERDUE: '已逾期', IN_PROGRESS: '进行中', NOT_STARTED: '未开始' })[value || ''] || value || '—';
const taskStatusType = (value?: string): 'primary' | 'success' | 'info' | 'warning' | 'danger' => ({ COMPLETED: 'success', OVERDUE: 'danger', IN_PROGRESS: 'warning', NOT_STARTED: 'info' } as Record<string, 'primary' | 'success' | 'info' | 'warning' | 'danger'>)[value || ''] || 'info';
const ruleExecutionLabel = (row: any) => { const rule = row as DepartmentTaskRuleVO; return rule.taskType === 'DAILY_REPORT' ? '按工作日逐日' : `${cycleLabel(rule.cycleType)} ${rule.requiredCount} 次`; };
const deadlineLabel = (row: any) => { const rule = row as DepartmentTaskRuleVO; return rule.taskType === 'DAILY_REPORT' ? '成员每日提醒时间' : `${rule.deadlineDay ? `每周期第${rule.deadlineDay}日` : '周期最后一天'} ${rule.deadlineTime || '18:00:00'}`; };
const countModeLabel = (row: any) => { const rule = row as DepartmentTaskRuleVO; return rule.taskType === 'DAILY_REPORT' ? '每日有无日报' : rule.countMode === 'APPROVED' ? '审核通过' : '已提交'; };
const workDayLabel = (value?: string) => (value || '1,2,3,4,5').split(',').map(item => weekOptions.find(day => day.value === item)?.label || item).join('、');
const updateAssignmentWorkDays = (value: string[]) => { assignmentWorkDays.value = value; };

const loadMyTasks = async () => {
  await withMyLoading(async () => {
    const res = await listMyDepartmentTasks();
    myTasks.value = res.data || [];
  });
};
const loadReviewTasks = async () => {
  reviewTaskLoading.value = true;
  try {
    const res = await listMyScoreProposalReviewTasks();
    reviewTasks.value = res.data || [];
  } finally {
    reviewTaskLoading.value = false;
  }
};
const refreshMyTasks = async () => {
  await Promise.all([loadMyTasks(), loadReviewTasks()]);
};
const formatReviewTaskTime = (value?: string) => value ? value.replace('T', ' ').slice(0, 16) : '刚刚创建';
const loadRules = async () => {
  await withRuleLoading(async () => {
    const res = await listDepartmentTaskRules();
    taskRules.value = res.data || [];
    rulesLoaded.value = true;
  });
};
const loadReviews = async () => {
  await withReviewLoading(async () => {
    const res = await listDepartmentReviewRules();
    reviewRules.value = res.data || [];
    reviewsLoaded.value = true;
  });
};
const loadUsers = async () => {
  if (userOptionsLoaded.value) return;
  if (userOptionsPromise) return userOptionsPromise;
  userOptionsPromise = (async () => {
    const res = await listPersonMemberOptions();
    userOptions.value = res.data || [];
    userOptionsLoaded.value = true;
  })();
  try {
    await userOptionsPromise;
  } finally {
    userOptionsPromise = undefined;
  }
};

const resetRuleForm = () => { Object.assign(ruleForm, { id: undefined, taskName: '', taskType: 'SCORE_PROPOSAL', cycleType: 'MONTH', requiredCount: 1, deadlineDay: 0, deadlineTime: '18:00:00', countMode: 'SUBMITTED', remindHours: 24, effectiveStart: undefined, effectiveEnd: undefined, status: 'ENABLED', remark: undefined }); };
const openRuleAdd = () => { resetRuleForm(); ruleDialog.title = '新增任务规则'; ruleDialog.visible = true; };
const onTaskTypeChange = () => {
  if (ruleForm.taskType === 'DAILY_REPORT') {
    Object.assign(ruleForm, { cycleType: 'DAY', requiredCount: 1, deadlineDay: 0, deadlineTime: '18:00:00', countMode: 'SUBMITTED', remindHours: 0 });
  } else if (ruleForm.cycleType === 'DAY') {
    Object.assign(ruleForm, { cycleType: 'MONTH', requiredCount: 1, deadlineDay: 0, deadlineTime: '18:00:00', countMode: 'SUBMITTED', remindHours: 24 });
  }
};
const openRuleEdit = (row: any) => { const rule = row as DepartmentTaskRuleVO; resetRuleForm(); Object.assign(ruleForm, rule); onTaskTypeChange(); ruleDialog.title = '编辑任务规则'; ruleDialog.visible = true; };
const saveRule = async () => { onTaskTypeChange(); buttonLoading.value = true; try { if (ruleForm.id) await updateDepartmentTaskRule(ruleForm); else await addDepartmentTaskRule(ruleForm); modal.msgSuccess('保存成功'); ruleDialog.visible = false; await loadRules(); } finally { buttonLoading.value = false; } };
const removeRule = async (row: any) => { const rule = row as DepartmentTaskRuleVO; await modal.confirm(`确认删除任务规则“${rule.taskName}”吗？`); await delDepartmentTaskRule(rule.id); modal.msgSuccess('删除成功'); await loadRules(); };

const resetAssignmentForm = (rule = selectedRule.value) => {
  assignmentWorkDays.value = ['1', '2', '3', '4', '5'];
  Object.assign(assignmentForm, {
    id: undefined,
    ruleId: rule?.id,
    userId: undefined,
    effectiveStart: undefined,
    effectiveEnd: undefined,
    workDays: undefined,
    reminderTime: rule?.taskType === 'DAILY_REPORT' ? '18:00:00' : undefined,
    status: 'ENABLED',
    remark: undefined
  });
};
const openAssignmentDialog = async (row: any) => {
  const rule = row as DepartmentTaskRuleVO;
  selectedRule.value = rule;
  resetAssignmentForm(rule);
  assignmentDialog.visible = true;
  await Promise.all([loadUsers(), loadAssignments()]);
};
const loadAssignments = async () => { if (!selectedRule.value) return; assignmentLoading.value = true; try { const res = await listDepartmentTaskAssignments(selectedRule.value.id); assignments.value = res.data || []; } finally { assignmentLoading.value = false; } };
const editAssignment = (row: any) => {
  const assignment = row as DepartmentTaskAssignmentVO;
  Object.assign(assignmentForm, {
    id: assignment.id,
    ruleId: assignment.ruleId,
    userId: assignment.userId,
    effectiveStart: assignment.effectiveStart,
    effectiveEnd: assignment.effectiveEnd,
    workDays: assignment.workDays,
    reminderTime: assignment.reminderTime || '18:00:00',
    status: assignment.status || 'ENABLED',
    remark: assignment.remark
  });
  assignmentWorkDays.value = assignment.workDays?.split(',').filter(Boolean) || ['1', '2', '3', '4', '5'];
};
const cancelAssignmentEdit = () => resetAssignmentForm();
const saveAssignment = async () => {
  if (!assignmentForm.userId || !assignmentForm.ruleId) return modal.msgWarning('请选择要分配的成员');
  const isDailyReport = selectedRule.value?.taskType === 'DAILY_REPORT';
  if (isDailyReport) {
    if (!assignmentWorkDays.value.length) return modal.msgWarning('至少选择一个工作日');
    assignmentForm.workDays = assignmentWorkDays.value.toSorted((left, right) => Number(left) - Number(right)).join(',');
  } else {
    assignmentForm.workDays = undefined;
    assignmentForm.reminderTime = undefined;
  }
  const isEditing = Boolean(assignmentForm.id);
  if (isEditing) {
    await updateDepartmentTaskAssignment(assignmentForm);
  } else {
    await addDepartmentTaskAssignment(assignmentForm);
  }
  modal.msgSuccess(isEditing ? '修改成功' : '分配成功');
  resetAssignmentForm();
  await loadAssignments();
  await loadRules();
};
const removeAssignment = async (row: any) => {
  const assignment = row as DepartmentTaskAssignmentVO;
  await modal.confirm(`确认取消成员“${assignment.nickName || assignment.userName}”的任务分配吗？`);
  await delDepartmentTaskAssignment(assignment.id);
  if (assignmentForm.id === assignment.id) resetAssignmentForm();
  modal.msgSuccess('已取消分配');
  await loadAssignments();
  await loadRules();
};

const resetReviewForm = () => { Object.assign(reviewForm, { id: undefined, taskType: 'SCORE_PROPOSAL', reviewerUserId: undefined, backupReviewerUserId: undefined, effectiveStart: undefined, effectiveEnd: undefined, status: 'ENABLED', remark: undefined }); reviewFormRef.value?.resetFields(); };
const openReviewAdd = () => { resetReviewForm(); reviewDialog.title = '新增审核人配置'; reviewDialog.visible = true; };
const openReviewEdit = (row: any) => { const review = row as DepartmentReviewRuleVO; resetReviewForm(); Object.assign(reviewForm, review); reviewDialog.title = '编辑审核人配置'; reviewDialog.visible = true; };
const saveReview = () => { reviewFormRef.value?.validate(async (valid) => { if (!valid) return; buttonLoading.value = true; try { if (reviewForm.id) await updateDepartmentReviewRule(reviewForm); else await addDepartmentReviewRule(reviewForm); modal.msgSuccess('保存成功'); reviewDialog.visible = false; await loadReviews(); } finally { buttonLoading.value = false; } }); };
const removeReview = async (row: any) => { const review = row as DepartmentReviewRuleVO; await modal.confirm(`确认删除“${taskTypeLabel(review.taskType)}”审核人配置吗？`); await delDepartmentReviewRule(review.id); modal.msgSuccess('删除成功'); await loadReviews(); };

const router = useRouter();
const openScoreReviewTask = (task: ScoreProposalReviewTaskVO) => {
  // SCORE 提案页面的实际菜单地址包含 department 前缀。
  const proposalRoute = router.getRoutes().find((route) => route.path === '/department/scoreProposal/proposal');
  if (!proposalRoute) {
    modal.msgError('提案页面路由未加载，请刷新页面后重试');
    return;
  }
  router.push({ name: proposalRoute.name as string, query: { id: String(task.proposalId), mode: 'review', stage: task.stage } });
};

watch(activeTab, async (tab) => {
  if (tab === 'rules' && !rulesLoaded.value) {
    await Promise.all([loadRules(), loadUsers()]);
  } else if (tab === 'review' && !reviewsLoaded.value) {
    await Promise.all([loadReviews(), loadUsers()]);
  }
});

onMounted(async () => { await Promise.all([loadMyTasks(), loadReviewTasks()]); });
</script>

<style scoped lang="scss">
.department-task-page {
  .task-intro, .task-card { border-radius: 14px; }
  .tab-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    min-height: 42px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--app-surface-border);
  }
  .tab-heading__content { min-width: 0; }
  .tab-heading__actions {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
  }
  .tab-heading h4 { margin: 0 0 4px; color: var(--el-text-color-primary); font-size: 15px; line-height: 1.4; }
  .tab-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.5; }
  .review-tasks {
    margin: 0 0 20px;
    padding: 18px;
    border: 1px solid var(--el-color-warning-light-7);
    border-radius: 14px;
    background: linear-gradient(135deg, var(--el-color-warning-light-9), var(--el-fill-color-blank) 72%);
  }
  .review-tasks__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .review-tasks__heading { min-width: 0; }
  .review-tasks__eyebrow { display: block; margin-bottom: 4px; color: var(--el-color-warning-dark-2); font-size: 12px; font-weight: 700; letter-spacing: 0.04em; }
  .review-tasks__heading h4 { margin: 0 0 4px; color: var(--el-text-color-primary); font-size: 15px; line-height: 1.4; }
  .review-tasks__heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
  .review-tasks__list { display: grid; gap: 10px; margin-top: 14px; }
  .review-task-item { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 12px 14px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-fill-color-blank); transition: border-color 0.2s, box-shadow 0.2s; }
  .review-task-item:hover { border-color: var(--el-color-primary-light-5); box-shadow: 0 4px 12px rgb(30 80 120 / 7%); }
  .review-task-item__icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: 10px; color: var(--el-color-warning-dark-2); background: var(--el-color-warning-light-8); font-size: 17px; }
  .review-task-item__content { min-width: 0; flex: 1; }
  .review-task-item__title { overflow: hidden; color: var(--el-text-color-primary); font-size: 14px; font-weight: 600; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
  .review-task-item__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-top: 6px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.4; }
  .review-task-item__meta span { white-space: nowrap; }
  .form-help { color: var(--el-text-color-secondary); font-size: 12px; line-height: 18px; }
  .rule-form { padding: 4px 4px 0; }
  .rule-form__section { margin-bottom: 24px; }
  .rule-form__section--last { margin-bottom: 0; }
  .rule-form__section-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 16px;
  }
  .rule-form__section-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    border-radius: 9px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .rule-form__section-heading h4 { margin: 0 0 2px; color: var(--el-text-color-primary); font-size: 14px; line-height: 1.4; }
  .rule-form__section-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.4; }
  .daily-rule-panel {
    margin: 0 0 24px;
    padding: 18px;
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 14px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-blank) 72%);
  }
  .daily-rule-panel__heading { display: flex; align-items: center; gap: 11px; }
  .daily-rule-panel__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border-radius: 11px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
    font-size: 18px;
  }
  .daily-rule-panel__title-wrap { min-width: 0; flex: 1; }
  .daily-rule-panel__title { color: var(--el-text-color-primary); font-size: 14px; font-weight: 700; line-height: 1.4; }
  .daily-rule-panel__subtitle { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.4; }
  .daily-rule-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: 18px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    overflow: hidden;
    background: var(--el-fill-color-blank);
  }
  .daily-rule-grid > div { min-width: 0; padding: 12px 13px; border-right: 1px solid var(--el-border-color-lighter); }
  .daily-rule-grid > div:last-child { border-right: 0; }
  .daily-rule-grid span { display: block; margin-bottom: 5px; color: var(--el-text-color-secondary); font-size: 12px; }
  .daily-rule-grid strong { display: block; overflow: hidden; color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
  .daily-rule-panel__note { display: flex; align-items: flex-start; gap: 6px; margin-top: 13px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 18px; }
  .daily-rule-panel__note .el-icon { margin-top: 2px; color: var(--el-color-primary); }
  .rule-dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
  :deep(.rule-form .el-form-item) { margin-bottom: 18px; }
  :deep(.rule-form .el-form-item__label) { color: var(--el-text-color-primary); font-weight: 600; }
  :deep(.rule-form .rule-status-item) { margin-bottom: 18px; }
  .assignment-tip { margin-bottom: 16px; padding: 10px 14px; border-radius: 8px; color: var(--el-color-warning); background: var(--el-color-warning-light-9); font-size: 13px; }
  .assignment-form { margin-bottom: 2px; }
  :deep(.el-tabs__header) { margin-bottom: 16px; }
  :deep(.el-table .cell) { line-height: 22px; }
  @media (max-width: 760px) {
    .tab-heading { align-items: flex-start; flex-direction: column; gap: 12px; }
    .tab-heading__actions { width: 100%; }
    .tab-heading__actions .el-button { width: 100%; }
    .daily-rule-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .daily-rule-grid > div:nth-child(2) { border-right: 0; }
    .daily-rule-grid > div:nth-child(-n + 2) { border-bottom: 1px solid var(--el-border-color-lighter); }
    .review-task-item { align-items: flex-start; flex-wrap: wrap; }
    .review-task-item > .el-button { margin-left: 46px; }
  }
  @media (max-width: 520px) {
    .rule-form { padding: 0; }
    .daily-rule-panel { padding: 14px; }
    .daily-rule-panel__heading { align-items: flex-start; flex-wrap: wrap; }
    .daily-rule-panel__heading .el-tag { margin-left: 47px; }
    .daily-rule-grid { grid-template-columns: 1fr; }
    .daily-rule-grid > div,
    .daily-rule-grid > div:nth-child(2) { border-right: 0; border-bottom: 1px solid var(--el-border-color-lighter); }
    .daily-rule-grid > div:last-child { border-bottom: 0; }
  }
}
</style>

<style lang="scss">
/* el-dialog 默认 Teleport 到 body，任务规则弹窗的布局样式不能依赖页面容器的 scoped 选择器。 */
.task-rule-dialog {
  max-width: calc(100vw - 32px);

  .el-dialog__header {
    margin-right: 0;
    padding: 22px 28px 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__title {
    color: var(--el-text-color-primary);
    font-size: 17px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .el-dialog__headerbtn {
    top: 17px;
    right: 22px;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--el-fill-color-light);
  }

  .el-dialog__body {
    max-height: min(68vh, 620px);
    padding: 22px 28px 8px;
    overflow-y: auto;
  }

  .el-dialog__footer {
    padding: 16px 28px 22px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.rule-form {
  padding: 0;

  &__section {
    margin-bottom: 22px;

    &--last { margin-bottom: 0; }
  }

  &__section-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 14px;
  }

  &__section-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 8px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  &__section-heading h4 {
    margin: 0 0 2px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
  }

  &__section-heading p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.4;
  }

  .el-form-item { margin-bottom: 16px; }
  .el-form-item__label { color: var(--el-text-color-primary); font-weight: 600; }
  .rule-status-item { margin-bottom: 16px; }
}

.daily-rule-panel {
  margin: 0 0 22px;
  padding: 16px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-blank) 76%);

  &__heading {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border-radius: 10px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
    font-size: 17px;
  }

  &__title-wrap { min-width: 0; flex: 1; }
  &__title { color: var(--el-text-color-primary); font-size: 14px; font-weight: 700; line-height: 1.4; }
  &__subtitle { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.4; }

  &__note {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 12px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  &__note .el-icon { margin-top: 2px; color: var(--el-color-primary); }
}

.daily-rule-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 15px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 9px;
  overflow: hidden;
  background: var(--el-fill-color-blank);

  > div {
    min-width: 0;
    padding: 10px 11px;
    border-right: 1px solid var(--el-border-color-lighter);
  }

  > div:last-child { border-right: 0; }
  span { display: block; margin-bottom: 4px; color: var(--el-text-color-secondary); font-size: 11px; }
  strong { display: block; overflow: hidden; color: var(--el-text-color-primary); font-size: 12px; font-weight: 600; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }
}

.rule-dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }

.task-assignment-dialog {
  max-width: calc(100vw - 32px);

  .el-dialog__header {
    margin-right: 0;
    padding: 22px 28px 18px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__title { color: var(--el-text-color-primary); font-size: 17px; font-weight: 700; }
  .el-dialog__headerbtn { top: 17px; right: 22px; width: 32px; height: 32px; border-radius: 10px; background: var(--el-fill-color-light); }
  .el-dialog__body { max-height: min(70vh, 640px); padding: 20px 28px 8px; overflow-y: auto; }
  .el-dialog__footer { padding: 16px 28px 22px; border-top: 1px solid var(--el-border-color-lighter); }
}

.assignment-dialog {
  color: var(--el-text-color-primary);

  &__intro {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 15px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: linear-gradient(135deg, var(--el-fill-color-light), var(--el-fill-color-blank));
  }

  &__intro-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    flex: 0 0 34px;
    border-radius: 10px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    font-size: 17px;
  }

  &__intro-content { min-width: 0; flex: 1; }
  &__intro-content strong { display: block; margin-bottom: 3px; font-size: 13px; line-height: 1.4; }
  &__intro-content p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
}

.assignment-form-card {
  margin-top: 18px;
  padding: 17px 17px 4px;
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
}

.assignment-block-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.assignment-block-heading h4 { margin: 0 0 3px; color: var(--el-text-color-primary); font-size: 14px; line-height: 1.4; }
.assignment-block-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.assignment-block-heading__step { flex: 0 0 auto; color: var(--el-color-primary); font-size: 10px; font-weight: 700; letter-spacing: 0.08em; line-height: 1.4; }
.assignment-form { margin-top: 15px; }
.assignment-form__grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(210px, 0.75fr); gap: 4px 16px; align-items: start; }
.assignment-field { min-width: 0; margin-bottom: 12px; }
.assignment-field--member { grid-column: 1; }
.assignment-field--start { grid-column: 2; }
.assignment-field--days { grid-column: 1 / -1; }
.assignment-field--time { grid-column: 1; }
.assignment-field .el-form-item__label { color: var(--el-text-color-primary); font-weight: 600; }
.assignment-workdays { display: flex; flex-wrap: wrap; gap: 6px 14px; min-height: 32px; align-items: center; }
.assignment-workdays .el-checkbox { margin-right: 0; }
.assignment-form__action { display: flex; grid-column: 2; align-items: flex-end; justify-content: flex-end; min-height: 32px; padding-bottom: 12px; }
.assignment-form__action .el-button { min-width: 108px; }
.assignment-list { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--el-border-color-lighter); }
.assignment-list__heading { margin-bottom: 12px; }
.assignment-table { border-radius: 11px; overflow: hidden; }
.assignment-table .assignment-member-name { color: var(--el-text-color-primary); font-weight: 600; }

@media (max-width: 760px) {
  .task-assignment-dialog .el-dialog__body { padding-right: 20px; padding-left: 20px; }
  .task-assignment-dialog .el-dialog__footer { padding-right: 20px; padding-left: 20px; }
  .assignment-form__grid { grid-template-columns: minmax(0, 1fr); }
  .assignment-field--member,
  .assignment-field--start,
  .assignment-field--days,
  .assignment-field--time,
  .assignment-form__action { grid-column: 1; }
  .assignment-form__action { justify-content: flex-start; padding-bottom: 12px; }
}

@media (max-width: 520px) {
  .task-assignment-dialog .el-dialog__header { padding-right: 20px; padding-left: 20px; }
  .assignment-dialog__intro { align-items: flex-start; flex-wrap: wrap; }
  .assignment-dialog__intro > .el-tag { margin-left: 46px; }
  .assignment-form-card { padding-right: 13px; padding-left: 13px; }
  .assignment-block-heading { gap: 8px; }
}

@media (max-width: 760px) {
  .task-rule-dialog .el-dialog__body { padding-right: 20px; padding-left: 20px; }
  .task-rule-dialog .el-dialog__footer { padding-right: 20px; padding-left: 20px; }
  .daily-rule-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .daily-rule-grid > div:nth-child(2) { border-right: 0; }
  .daily-rule-grid > div:nth-child(-n + 2) { border-bottom: 1px solid var(--el-border-color-lighter); }
}

@media (max-width: 520px) {
  .task-rule-dialog .el-dialog__header { padding-right: 20px; padding-left: 20px; }
  .daily-rule-panel { padding: 13px; }
  .daily-rule-panel__heading { align-items: flex-start; flex-wrap: wrap; }
  .daily-rule-panel__heading .el-tag { margin-left: 44px; }
  .daily-rule-grid { grid-template-columns: 1fr; }
  .daily-rule-grid > div,
  .daily-rule-grid > div:nth-child(2) { border-right: 0; border-bottom: 1px solid var(--el-border-color-lighter); }
  .daily-rule-grid > div:last-child { border-bottom: 0; }
}
</style>
