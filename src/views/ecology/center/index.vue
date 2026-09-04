<template>
  <div class="app-container ecology-center-page" :class="{ 'is-embedded': props.embedded }">
    <el-card v-if="!props.embedded" shadow="never" class="intro-card">
      <div class="intro-card__content">
        <div class="intro-card__copy">
          <span class="eyebrow"><el-icon><Stamp /></el-icon>ECOLOGY APPROVAL CENTER</span>
          <h2>单项审批申请</h2>
          <p>选择业务类型，填写申请表单并提交泛微审批。</p>
        </div>
        <div class="intro-card__status">
          <span class="intro-card__status-icon"><el-icon><Connection /></el-icon></span>
          <div>
            <strong>泛微 OA</strong>
            <span>外部系统负责流程执行</span>
          </div>
          <el-tag type="success" effect="plain">已接入</el-tag>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="main-card mt-2">
      <template #header>
        <div v-if="!props.embedded" class="main-card__header">
          <div class="section-heading">
            <span class="section-heading__icon"><el-icon><Promotion /></el-icon></span>
            <div>
              <h3>单项审批申请</h3>
              <p>提交后由泛微执行审批，本地保留申请状态和同步轨迹。</p>
            </div>
          </div>
          <el-tag type="info" effect="plain">提交入口</el-tag>
        </div>
      </template>
      <div class="application-panel">
          <el-form :model="applicationQuery" :inline="true" @submit.prevent>
            <el-form-item label="业务类型">
              <el-select v-model="applicationQuery.businessType" clearable filterable placeholder="全部业务类型" style="width: 220px">
                <el-option v-for="item in businessTypes" :key="item.id" :label="businessTypeLabel(item)" :value="item.businessType" />
              </el-select>
            </el-form-item>
            <el-form-item label="标题"><el-input v-model="applicationQuery.title" clearable placeholder="申请标题" @keyup.enter="loadApplications" /></el-form-item>
            <el-form-item label="状态">
              <el-select v-model="applicationQuery.status" clearable placeholder="全部状态" style="width: 140px">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item v-hasPermi="['ecology:application:monitor']" label="查看范围">
              <el-checkbox v-model="applicationQuery.monitor">审批监控</el-checkbox>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="searchApplications">查询</el-button>
              <el-button icon="Refresh" @click="resetApplicationQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <div class="toolbar">
            <div class="toolbar__hint">申请提交后由泛微执行审批，本地保存 requestId、状态和同步轨迹。</div>
            <div>
              <el-button v-hasPermi="['ecology:application:reconcile']" class="mr-2" plain icon="Refresh" @click="reconcileApplications">立即对账</el-button>
              <el-button v-hasPermi="['ecology:application:add']" type="primary" icon="Plus" @click="openApplicationAdd">发起申请</el-button>
            </div>
          </div>
          <DepartmentDataTable v-loading="applicationLoading" :data="applications" border>
            <el-table-column label="申请编号" prop="applicationNo" width="170" show-overflow-tooltip />
            <el-table-column label="业务类型" prop="businessType" min-width="170" show-overflow-tooltip>
              <template #default="scope">{{ businessTypeName(scope.row.businessType) }}</template>
            </el-table-column>
            <el-table-column label="申请标题" prop="title" min-width="220" show-overflow-tooltip />
            <el-table-column label="申请人" prop="applicantName" width="110" />
            <el-table-column label="流程" prop="workflowName" min-width="160" show-overflow-tooltip />
            <el-table-column label="状态" width="120" align="center">
              <template #default="scope"><el-tag :type="statusType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag></template>
            </el-table-column>
            <el-table-column label="泛微 requestId" prop="oaRequestId" width="150" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="createTime" width="170" />
            <el-table-column label="操作" fixed="right" width="260" align="center">
              <template #default="scope">
                <DepartmentTableActions>
                  <el-button link type="primary" @click="openApplicationDetail(scope.row)">详情</el-button>
                <el-button v-if="canEdit(scope.row)" v-hasPermi="['ecology:application:edit']" link type="primary" @click="openApplicationEdit(scope.row)">编辑</el-button>
                <el-button v-if="canSubmit(scope.row)" v-hasPermi="['ecology:application:submit']" link type="success" @click="submitApplication(scope.row)">提交</el-button>
                <el-button v-if="canEdit(scope.row)" v-hasPermi="['ecology:application:preview']" link type="warning" @click="previewApplication(scope.row)">审批链</el-button>
                <el-button v-if="scope.row.oaRequestId" v-hasPermi="['ecology:application:sync']" link type="warning" @click="syncApplication(scope.row)">同步</el-button>
                  <el-button v-if="scope.row.oaLink" link type="info" @click="openOa(scope.row)">打开泛微</el-button>
                </DepartmentTableActions>
              </template>
            </el-table-column>
          </DepartmentDataTable>
          <pagination v-show="applicationTotal > 0" v-model:page="applicationQuery.pageNum" v-model:limit="applicationQuery.pageSize" :total="applicationTotal" @pagination="loadApplications" />
          <el-empty v-if="!applicationLoading && applications.length === 0" description="暂无审批申请" />

      </div>
    </el-card>

    <el-dialog v-model="applicationDialog.visible" width="900px" append-to-body destroy-on-close class="application-dialog">
      <template #header>
        <div class="application-dialog__title">
          <span class="application-dialog__title-icon"><el-icon><Promotion /></el-icon></span>
          <div><strong>{{ applicationDialog.title }}</strong><small>选择流程、完善申请表单并提交审批</small></div>
        </div>
      </template>
      <el-form v-loading="applicationDialog.loading" ref="applicationFormRef" :model="applicationForm" :rules="applicationRules" label-position="top" class="application-form">
        <section class="application-section">
          <div class="application-section__heading"><span class="application-section__index">01</span><div><strong>基础信息</strong><span>选择本次申请使用的泛微表单、审批方式和业务类型</span></div></div>
          <div class="application-form-grid application-form-grid--two">
            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="applicationForm.businessType" filterable placeholder="选择已配置的业务类型" @change="handleApplicationBusinessTypeChange">
                <el-option v-for="item in businessTypes" :key="item.id" :label="businessTypeLabel(item)" :value="item.businessType" :disabled="item.status !== 'ENABLED' && item.businessType !== applicationForm.businessType" />
              </el-select>
              <div class="form-tip">选择业务后，只显示该业务已绑定的泛微表单审批方式。</div>
            </el-form-item>
            <el-form-item label="审批方式" prop="workflowConfigId"><el-select v-model="applicationForm.workflowConfigId" filterable :disabled="!applicationForm.businessType" placeholder="先选择业务类型" @change="handleApplicationWorkflowChange"><el-option v-for="item in enabledWorkflowConfigs" :key="item.id" :label="`${item.formName || '泛微表单'} · ${item.approvalName || item.workflowName}`" :value="item.id" /></el-select></el-form-item>
          </div>
        </section>

        <section class="application-section">
          <div class="application-section__heading"><span class="application-section__index">02</span><div><strong>审批策略</strong><span>确认审批方式，系统会据此生成本次审批链</span></div></div>
          <el-form-item label="审批方式" prop="approvalMode"><el-radio-group v-model="applicationForm.approvalMode" @change="handleApprovalModeChange"><el-radio label="AUTO_RULE">自动匹配</el-radio><el-radio label="PLAN">选择审批方案</el-radio><el-radio label="MANUAL">本次临时指定</el-radio></el-radio-group></el-form-item>
          <el-alert v-if="applicationForm.approvalMode === 'AUTO_RULE'" :title="applicationApprovalHint" type="info" :closable="false" class="application-alert" />
          <el-form-item v-if="applicationForm.approvalMode === 'PLAN'" label="审批方案" required><el-select v-model="applicationForm.approvalPlanId" filterable placeholder="选择当前业务的审批方案"><el-option v-for="item in applicationApprovalPlans" :key="item.id" :label="item.planName" :value="item.id" /></el-select></el-form-item>
            <el-alert v-if="applicationForm.approvalMode === 'PLAN'" title="选择方案只决定本次申请使用哪些审批人，不会创建新的泛微表单。" type="info" :closable="false" class="application-alert" />
          <el-alert v-if="applicationForm.approvalMode === 'MANUAL'" title="临时指定不会创建审批方案，只对当前申请生效。" type="info" :closable="false" class="application-alert" />
          <div class="application-flow-summary"><span>审批方式</span><el-tag type="info">{{ selectedApprovalName }}</el-tag><span class="form-tip">节点顺序和审批类型由该审批方式配置决定。</span></div>
          <div v-if="applicationForm.approvalMode === 'AUTO_RULE' && matchedApplicationApproval" class="application-people-preview">
            <div><span>审批人员：</span>{{ applicationPeopleNames('APPROVER') }}</div><div><span>抄送人员：</span>{{ applicationPeopleNames('COPY') || '—' }}</div>
          </div>
          <template v-if="applicationForm.approvalMode === 'MANUAL'">
            <el-alert v-if="!applicationStageDefinitions.length" title="当前审批方式还没有配置审批节点，请先联系管理员维护流程配置。" type="warning" :closable="false" class="application-alert" />
            <el-form-item v-for="stage in applicationStageDefinitions" :key="stage.code" :label="stage.name" :required="stage.required">
              <div class="application-people-picker application-stage-picker">
                <div class="application-stage-picker__toolbar"><el-button plain @click="openApplicationStageSelect(stage.code)">选择用户</el-button><span>{{ stage.mode === 'COUNTERSIGN' ? '会签节点，可多选' : '按当前顺序依次审批' }}{{ stage.required ? ' · 必填' : ' · 可不配置' }}</span></div>
                <div v-for="(user, index) in applicationUsersForStage(stage.code)" :key="user.userId" class="application-ordered-person"><span>{{ index + 1 }}. {{ user.nickName }}</span><el-button v-if="stage.mode !== 'COUNTERSIGN'" link :disabled="index === 0" @click="moveApplicationStage(stage.code, index, -1)">上移</el-button><el-button v-if="stage.mode !== 'COUNTERSIGN'" link :disabled="index === applicationUsersForStage(stage.code).length - 1" @click="moveApplicationStage(stage.code, index, 1)">下移</el-button><el-button link type="danger" @click="removeApplicationStageUser(stage.code, user.userId)">移除</el-button></div>
                <span v-if="!applicationUsersForStage(stage.code).length" class="form-tip">请选择该节点的审批人员</span>
              </div>
            </el-form-item>
            <el-form-item label="抄送人员"><div class="application-people-picker application-stage-picker"><div class="application-stage-picker__toolbar"><el-button plain @click="openApplicationStageSelect('COPY')">选择用户</el-button><span>可不配置，不参与审批</span></div><div v-for="(user, index) in applicationCopyUsers" :key="user.userId" class="application-ordered-person"><span>{{ index + 1 }}. {{ user.nickName }}</span><el-button link type="danger" @click="removeApplicationStageUser('COPY', user.userId)">移除</el-button></div><span v-if="!applicationCopyUsers.length" class="form-tip">可不配置</span></div></el-form-item>
          </template>
        </section>

        <section class="application-section application-section--form">
          <div class="application-section__heading"><span class="application-section__index">03</span><div><strong>申请表单</strong><span>根据当前业务配置展示需要填写的内容</span></div></div>
          <DynamicForm ref="dynamicFormRef" v-model="applicationData" :schema-json="selectedFormSchema" :attachments="applicationAttachments" @update:attachments="setApplicationAttachments" />
        </section>
      </el-form>
      <template #footer>
        <div class="application-dialog__footer"><span>保存后可在“我的申请”中继续提交</span><div><el-button @click="applicationDialog.visible = false">取消</el-button><el-button type="primary" :loading="buttonLoading" :disabled="applicationDialog.loading" @click="saveApplication">保存草稿</el-button></div></div>
      </template>
    </el-dialog>

    <UserSelect ref="applicationActiveStageSelectRef" multiple :data="applicationActiveStageUsers.map((item) => item.userId)" @confirm-call-back="setApplicationActiveStageUsers" />

    <el-dialog v-model="previewDialog.visible" title="审批链预览" width="760px" append-to-body>
      <el-alert title="以下人员为提交时按当前业务和流程规则解析的结果，正式提交时会保存为审批人快照。" type="info" :closable="false" class="mb-3" />
      <DepartmentDataTable v-loading="previewLoading" :data="previewRows" border>
        <el-table-column label="顺序" width="70" prop="sortNo" />
        <el-table-column label="审批节点" min-width="170"><template #default="scope"><div>{{ scope.row.stageName || '未命名节点' }}</div><small>第 {{ scope.row.stageOrder }} 节点</small></template></el-table-column>
        <el-table-column label="方式" width="90"><template #default="scope">{{ stageModeLabel(scope.row.stageMode) }}</template></el-table-column>
        <el-table-column label="类型" width="90"><template #default="scope">{{ participantRoleLabel(scope.row.participantRole) }}</template></el-table-column>
        <el-table-column label="人员" min-width="180"><template #default="scope">{{ scope.row.oaUserName || scope.row.oaUserId || scope.row.localUserId }}</template></el-table-column>
      </DepartmentDataTable>
      <el-empty v-if="!previewLoading && previewRows.length === 0" description="当前申请没有匹配到审批范围" />
    </el-dialog>

    <el-drawer v-model="detailDrawer.visible" title="审批申请详情" size="580px" append-to-body>
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="申请编号">{{ detail.applicationNo }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ businessTypeName(detail.businessType) }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.sourceModule || detail.businessId || detail.businessNo" label="来源业务">{{ detail.sourceModule || '—' }} / {{ detail.businessNo || detail.businessId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="泛微表单">{{ detail.formName || detail.workflowName || detail.workflowId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="审批方式">{{ detail.approvalName || detail.approvalCode || '—' }}</el-descriptions-item>
        <el-descriptions-item label="申请标题">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.applicantName || detail.applicantUserId }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="statusType(detail.status)">{{ statusLabel(detail.status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="泛微 requestId">{{ detail.oaRequestId || '尚未生成' }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.participants?.length" label="审批人快照"><div v-for="item in detail.participants" :key="item.id">{{ item.stageName || '未命名节点' }}：{{ item.oaUserName || item.oaUserId || item.localUserId }}</div></el-descriptions-item>
        <el-descriptions-item v-if="detail.attachments?.length" label="附件">
          <div v-for="item in detail.attachments" :key="item.id" class="attachment-item">
            <span>{{ item.fileName || `附件_${item.ossId}` }}（{{ item.uploadStatus || '待上传' }}）</span>
            <el-button v-if="item.ossId" link type="primary" @click="openAttachmentPreview(item)">预览</el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="申请内容"><div class="detail-content">{{ detail.content }}</div></el-descriptions-item>
        <el-descriptions-item v-if="detail.failReason" label="失败原因"><el-text type="danger">{{ detail.failReason }}</el-text></el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">状态轨迹</el-divider>
      <el-timeline v-loading="eventLoading">
        <el-timeline-item v-for="item in events" :key="item.id" :timestamp="item.createTime" placement="top">
          <div>{{ eventLabel(item.eventType) }}：{{ item.fromStatus || '—' }} → {{ item.toStatus || '—' }}</div>
          <small v-if="item.errorCode" class="event-error">{{ item.errorCode }}</small>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-if="!eventLoading && events.length === 0" description="暂无事件轨迹" />
      <template #footer><el-button v-if="detail?.oaLink" type="primary" @click="openOa(detail)">打开泛微流程</el-button></template>
    </el-drawer>

    <AttachmentPreviewDialog
      v-model="attachmentPreview.visible"
      :oss-id="attachmentPreview.ossId"
      :file-name="attachmentPreview.fileName"
    />
  </div>
</template>

<script setup name="EcologyCenter" lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import AttachmentPreviewDialog from '@/components/Ecology/AttachmentPreviewDialog.vue';
import DynamicForm from '@/components/Ecology/DynamicForm.vue';
import UserSelect from '@/components/UserSelect/index.vue';
import { optionSelect } from '@/api/system/user';
import type { UserVO } from '@/api/system/user/types';
import type { PageResult } from '@/api/types';
import { getOaApplication, listOaApplicationEvents, listOaApplications, listOaBusinessTypes, listOaDepartmentApprovals, listOaWorkflowConfigs, previewOaApplicationParticipants, reconcileOaApplications, saveOaApplication, submitOaApplication, syncOaApplication } from '@/api/ecology';
import type { OaApprovalRulePreviewVO, OaApplicationForm, OaApplicationQuery, OaApplicationVO, OaApprovalParticipantVO, OaAttachmentVO, OaBusinessTypeVO, OaDepartmentApprovalVO, OaProcessEventLogVO, OaWorkflowConfigVO } from '@/api/ecology/types';

const props = withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false });
const applicationLoading = ref(false);
const eventLoading = ref(false);
const previewLoading = ref(false);
const buttonLoading = ref(false);
const applications = ref<OaApplicationVO[]>([]);
const applicationTotal = ref(0);
const enabledWorkflowConfigs = ref<OaWorkflowConfigVO[]>([]);
const businessTypes = ref<OaBusinessTypeVO[]>([]);
const previewRows = ref<OaApprovalRulePreviewVO[]>([]);
const detail = ref<OaApplicationVO>();
const events = ref<OaProcessEventLogVO[]>([]);
const applicationFormRef = ref<ElFormInstance>();
const dynamicFormRef = ref<InstanceType<typeof DynamicForm>>();
const applicationActiveStageSelectRef = ref<InstanceType<typeof UserSelect>>();
const applicationQuery = reactive<OaApplicationQuery>({ pageNum: 1, pageSize: 10, businessType: undefined, title: undefined, status: undefined, monitor: false });
const applicationForm = reactive<OaApplicationForm>({ businessType: '', sourceModule: '', businessId: '', businessNo: '', title: '', content: '', urgency: 'NORMAL', formDataJson: '{}', workflowConfigId: undefined, companyId: undefined, deptId: undefined, deptIds: [], approvalMode: 'AUTO_RULE', approvalPlanId: undefined, processType: 'CUSTOM', participants: undefined });
const applicationDialog = reactive({ visible: false, loading: false, title: '' });
const detailDrawer = reactive({ visible: false });
const previewDialog = reactive({ visible: false });
const attachmentPreview = reactive<{ visible: boolean; ossId?: string | number; fileName?: string }>({ visible: false });
const matchedApplicationApprovals = ref<OaDepartmentApprovalVO[]>([]);
const matchedApplicationApproval = computed(() => matchedApplicationApprovals.value[0]);
const applicationApprovalPlans = ref<OaDepartmentApprovalVO[]>([]);
type ApplicationStageDefinition = { code: string; name: string; mode: string; required: boolean; sortNo: number; fieldCode: string };
const applicationStageUsers = reactive<Record<string, UserVO[]>>({});
const applicationCopyUsers = ref<UserVO[]>([]);
const applicationActiveStageCode = ref('');
const statusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '提交中', value: 'SUBMITTING' },
  { label: '审批中', value: 'IN_PROGRESS' },
  { label: '已通过', value: 'APPROVED' },
  { label: '已驳回', value: 'REJECTED' },
  { label: '提交失败', value: 'FAILED' },
  { label: '待核对', value: 'UNKNOWN' },
  { label: '已取消', value: 'CANCELLED' }
];
const applicationRules = { workflowConfigId: [{ required: true, message: '请选择泛微表单', trigger: 'change' }], businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }], approvalMode: [{ required: true, message: '请选择审批策略', trigger: 'change' }] };

const statusLabel = (status?: string) => statusOptions.find((item) => item.value === status)?.label || status || '未知';
const statusType = (status?: string) => ({ APPROVED: 'success', REJECTED: 'danger', FAILED: 'danger', UNKNOWN: 'danger', IN_PROGRESS: 'warning', SUBMITTING: 'warning', CANCELLED: 'info' }[status || ''] || 'info') as 'success' | 'warning' | 'danger' | 'info';
const eventLabel = (eventType?: string) => ({ SUBMIT_REQUEST: '提交请求', SUBMIT_SUCCESS: '提交成功', SUBMIT_FAILED: '提交失败', SUBMIT_UNKNOWN: '提交结果待核对', SYNC: '状态同步', SYNC_FAILED: '同步失败', CALLBACK: '泛微回调' }[eventType || ''] || eventType || '事件');
const stageModeLabel = (mode?: string) => mode === 'COUNTERSIGN' ? '会签' : '依次签';
const businessTypeLabel = (item: OaBusinessTypeVO) => `${item.businessName}（${item.businessType}）`;
const businessTypeName = (value?: string) => businessTypes.value.find((item) => item.businessType === value)?.businessName || value || '—';
const participantRoleLabel = (role?: string) => role === 'COPY' ? '抄送' : '审批';
const canEdit = (row: any) => row.status === 'DRAFT' || row.status === 'FAILED';
const canSubmit = (row: any) => canEdit(row);
const selectedWorkflowConfig = computed(() => enabledWorkflowConfigs.value.find((item) => String(item.id) === String(applicationForm.workflowConfigId)));
const selectedApprovalName = computed(() => selectedWorkflowConfig.value?.approvalName || selectedWorkflowConfig.value?.workflowName || '未选择审批方式');
const selectedFormSchema = computed(() => selectedWorkflowConfig.value?.fieldSchemaJson || '');
const selectedFormFields = computed<any[]>(() => {
  try {
    const schema = JSON.parse(selectedFormSchema.value || '{}');
    return Array.isArray(schema.fields) ? schema.fields : [];
  } catch {
    return [];
  }
});
const fieldKeyForSemantic = (semanticType: string) => selectedFormFields.value.find((field) => String(field.semanticType || '').toUpperCase() === semanticType)?.key;
const applicationData = computed<Record<string, any>>({
  get: () => {
    let value: Record<string, any> = {};
    try {
      const parsed = JSON.parse(applicationForm.formDataJson || '{}');
      value = parsed && typeof parsed === 'object' ? { ...parsed } : {};
    } catch {
      value = {};
    }
    const standardValues: Array<[string, 'title' | 'content' | 'urgency']> = [['TITLE', 'title'], ['CONTENT', 'content'], ['URGENCY', 'urgency']];
    standardValues.forEach(([semanticType, property]) => {
      const key = fieldKeyForSemantic(semanticType);
      if (key && value[key] === undefined) value[key] = applicationForm[property] || '';
    });
    return value;
  },
  set: (value) => {
    const next = { ...value };
    const standardValues: Array<[string, 'title' | 'content' | 'urgency']> = [['TITLE', 'title'], ['CONTENT', 'content'], ['URGENCY', 'urgency']];
    standardValues.forEach(([semanticType, property]) => {
      const key = fieldKeyForSemantic(semanticType);
      if (key) applicationForm[property] = next[key] || '';
    });
    applicationForm.formDataJson = JSON.stringify(next);
  }
});
const applicationAttachments = computed(() => (applicationForm.attachments || []) as Array<{ ossId: string | number; attachmentType?: string }>);
const setApplicationAttachments = (value: Array<{ ossId: string | number; attachmentType: string }>) => { applicationForm.attachments = value as any; };
const applicationStageDefinitions = computed<ApplicationStageDefinition[]>(() => {
  try {
    const mapping = JSON.parse(selectedWorkflowConfig.value?.participantMappingJson || '{}');
    return (Array.isArray(mapping.stages) ? mapping.stages : [])
      .map((item: any, index: number) => ({
        code: String(item.code || '').trim().toUpperCase(),
        name: String(item.name || item.code || `审批节点${index + 1}`).trim(),
        mode: String(item.mode || 'SEQUENTIAL').trim().toUpperCase(),
        required: item.required !== false,
        sortNo: Number(item.sortNo ?? index + 1),
        fieldCode: String(item.fieldCode || item.field || '').trim()
      }))
      .filter((item) => item.code && item.fieldCode)
      .toSorted((left, right) => left.sortNo - right.sortNo);
  } catch {
    return [];
  }
});

const loadApplications = async () => {
  applicationLoading.value = true;
  try {
    const res = await listOaApplications(applicationQuery);
    applications.value = res.data?.rows || [];
    applicationTotal.value = res.data?.total || 0;
  } finally {
    applicationLoading.value = false;
  }
};
const loadEnabledWorkflowConfigs = async (businessType?: string) => {
  if (!businessType) { enabledWorkflowConfigs.value = []; return; }
  const res = await listOaWorkflowConfigs(businessType, true);
  enabledWorkflowConfigs.value = res.data || [];
};
const loadBusinessTypes = async () => { const res = await listOaBusinessTypes(undefined, false); businessTypes.value = res.data || []; };
const searchApplications = () => { applicationQuery.pageNum = 1; loadApplications(); };
const resetApplicationQuery = () => { applicationQuery.businessType = undefined; applicationQuery.title = undefined; applicationQuery.status = undefined; applicationQuery.monitor = false; searchApplications(); };
const reconcileApplications = async () => { await reconcileOaApplications(); modal.msgSuccess('对账任务已执行'); await loadApplications(); };

const resetManualUsers = () => { Object.keys(applicationStageUsers).forEach((key) => delete applicationStageUsers[key]); applicationCopyUsers.value = []; applicationActiveStageCode.value = ''; };
const resetApplicationFieldValues = () => { applicationForm.title = ''; applicationForm.content = ''; applicationForm.urgency = 'NORMAL'; applicationForm.formDataJson = '{}'; applicationForm.attachments = undefined; };
const resetApplicationForm = () => { Object.assign(applicationForm, { id: undefined, businessType: '', sourceModule: '', businessId: '', businessNo: '', title: '', content: '', urgency: 'NORMAL', formDataJson: '{}', workflowConfigId: undefined, companyId: undefined, deptId: undefined, deptIds: [], approvalMode: 'AUTO_RULE', approvalPlanId: undefined, processType: 'CUSTOM', attachments: undefined, participants: undefined }); matchedApplicationApprovals.value = []; applicationApprovalPlans.value = []; resetManualUsers(); };
const prepareApplicationDialog = async () => {
  applicationDialog.loading = true;
  try {
    if (!businessTypes.value.length) await loadBusinessTypes();
  } catch (error) {
    console.error('加载审批配置失败', error);
    modal.msgError('审批配置加载失败，请刷新后重试');
  } finally {
    applicationDialog.loading = false;
  }
};
const openApplicationAdd = () => { if (applicationDialog.loading) return; resetApplicationForm(); applicationDialog.title = '发起通用审批申请'; applicationDialog.visible = true; void prepareApplicationDialog(); };
const openApplicationEdit = async (row: any) => { if (applicationDialog.loading) return; applicationDialog.title = '编辑审批申请'; applicationDialog.visible = true; applicationDialog.loading = true; try { const res = await getOaApplication(row.id); Object.assign(applicationForm, res.data); applicationForm.processType = applicationForm.processType || 'CUSTOM'; applicationForm.approvalMode = applicationForm.approvalMode || 'AUTO_RULE'; await loadBusinessTypes(); await loadEnabledWorkflowConfigs(applicationForm.businessType); await Promise.all([loadApplicationApprovalConfig(), loadDirectUsers(res.data?.participants || [])]); } catch (error) { console.error('加载审批申请失败', error); modal.msgError('审批申请加载失败，请刷新后重试'); } finally { applicationDialog.loading = false; } };
const handleApplicationWorkflowChange = (id: string | number) => { const config = enabledWorkflowConfigs.value.find((item) => String(item.id) === String(id)); applicationForm.processType = config?.approvalCode || 'CUSTOM'; resetApplicationFieldValues(); resetManualUsers(); loadApplicationApprovalConfig(); };
const handleApplicationBusinessTypeChange = async () => { applicationForm.workflowConfigId = undefined; applicationForm.processType = 'CUSTOM'; applicationForm.approvalPlanId = undefined; enabledWorkflowConfigs.value = []; matchedApplicationApprovals.value = []; resetApplicationFieldValues(); resetManualUsers(); await loadEnabledWorkflowConfigs(applicationForm.businessType); const defaultWorkflow = enabledWorkflowConfigs.value.find((item) => item.isDefault) || (enabledWorkflowConfigs.value.length === 1 ? enabledWorkflowConfigs.value[0] : undefined); if (defaultWorkflow) { applicationForm.workflowConfigId = defaultWorkflow.id; applicationForm.processType = defaultWorkflow.approvalCode || 'CUSTOM'; } await loadApplicationApprovalConfig(); };
const handleApprovalModeChange = () => { matchedApplicationApprovals.value = []; applicationForm.approvalPlanId = undefined; resetManualUsers(); applicationForm.participants = undefined; loadApplicationApprovalConfig(); };
const applicationApprovalHint = computed(() => {
  if (matchedApplicationApprovals.value.length === 1) {
    const item = matchedApplicationApprovals.value[0];
    return `已匹配审批方案：${item.planName}`;
  }
  if (matchedApplicationApprovals.value.length > 1) return '存在多个可用审批方案，请改为“选择审批方案”明确指定';
  return '系统会根据业务类型、来源模块和方案条件自动匹配审批人员；没有匹配时可改为指定方案或临时指定';
});
const loadApplicationApprovalConfig = async () => { matchedApplicationApprovals.value = []; applicationApprovalPlans.value = []; if (!applicationForm.workflowConfigId || !applicationForm.businessType) return; const res = await listOaDepartmentApprovals({ workflowConfigId: applicationForm.workflowConfigId, businessType: applicationForm.businessType, enabledOnly: true }); applicationApprovalPlans.value = res.data || []; matchedApplicationApprovals.value = applicationApprovalPlans.value; };
const applicationPeopleNames = (role: string) => (matchedApplicationApproval.value?.users || []).filter((item) => item.participantRole === role).toSorted((a, b) => (a.sortNo || 0) - (b.sortNo || 0)).map((item) => item.nickName || item.userName || item.employeeNo).join('、');
const applicationUsersForStage = (code: string) => code === 'COPY' ? applicationCopyUsers.value : (applicationStageUsers[code] || (applicationStageUsers[code] = []));
const applicationActiveStageUsers = computed(() => applicationUsersForStage(applicationActiveStageCode.value || 'COPY'));
const openApplicationStageSelect = (code: string) => { applicationActiveStageCode.value = code; void nextTick(() => applicationActiveStageSelectRef.value?.open()); };
const setApplicationActiveStageUsers = (users: UserVO[]) => { if (applicationActiveStageCode.value === 'COPY') applicationCopyUsers.value = users; else applicationStageUsers[applicationActiveStageCode.value] = users; };
const removeApplicationStageUser = (code: string, userId: string | number) => removeUser(applicationUsersForStage(code), userId);
const moveApplicationStage = (code: string, index: number, offset: number) => moveUsers(applicationUsersForStage(code), index, offset);
const removeUser = (users: UserVO[], userId: string | number) => { const index = users.findIndex((item) => String(item.userId) === String(userId)); if (index >= 0) users.splice(index, 1); };
const moveUsers = (users: UserVO[], index: number, offset: number) => { const next = index + offset; if (next < 0 || next >= users.length) return; [users[index], users[next]] = [users[next], users[index]]; };
const loadDirectUsers = async (participants: OaApprovalParticipantVO[]) => { resetManualUsers(); const ids = participants.map((item) => item.localUserId).filter((item): item is string | number => item !== undefined && item !== null); if (!ids.length) return; const res = await optionSelect([...new Set(ids.map(String))]); const byId = new Map((res.data || []).map((item) => [String(item.userId), item])); participants.toSorted((a, b) => (a.sortNo || 0) - (b.sortNo || 0)).forEach((item) => { const user = byId.get(String(item.localUserId)); if (!user) return; const code = String(item.stageCode || '').trim().toUpperCase(); if (item.participantRole === 'COPY' || code === 'COPY') applicationCopyUsers.value.push(user); else (applicationStageUsers[code] ||= []).push(user); }); };
const buildManualParticipants = () => [...applicationStageDefinitions.value.flatMap((stage) => applicationUsersForStage(stage.code).map((item, index) => ({ stageCode: stage.code, stageName: stage.name, stageOrder: stage.sortNo, stageMode: stage.mode, participantRole: 'APPROVER', participantType: 'USER', localUserId: item.userId, sortNo: index, required: stage.required }))), ...applicationCopyUsers.value.map((item, index) => ({ stageCode: 'COPY', stageName: '抄送人员', stageOrder: 99, stageMode: 'SEQUENTIAL', participantRole: 'COPY', participantType: 'USER', localUserId: item.userId, sortNo: index, required: false }))] as any;
const saveApplication = async () => {
  const valid = await applicationFormRef.value?.validate().catch(() => false);
  if (!valid) return;
  const dynamicValid = dynamicFormRef.value?.validate();
  if (dynamicValid && !dynamicValid.valid) { modal.msgWarning(dynamicValid.message); return; }
  if (applicationForm.approvalMode === 'AUTO_RULE') {
    applicationForm.approvalPlanId = undefined;
    applicationForm.participants = undefined;
  } else if (applicationForm.approvalMode === 'PLAN') {
    if (!applicationForm.approvalPlanId) { modal.msgWarning('请选择审批方案'); return; }
    applicationForm.participants = undefined;
  } else {
    const missing = applicationStageDefinitions.value.find((stage) => stage.required && !applicationUsersForStage(stage.code).length);
    if (missing) { modal.msgWarning(`临时指定时请配置“${missing.name}”的审批人员`); return; }
    applicationForm.participants = buildManualParticipants();
  }
  buttonLoading.value = true;
  try { await saveOaApplication(applicationForm); modal.msgSuccess('草稿保存成功'); applicationDialog.visible = false; await loadApplications(); } finally { buttonLoading.value = false; }
};
const submitApplication = async (row: any) => {
  await modal.confirm(`确认提交申请“${row.title}”吗？提交后将进入泛微审批。`);
  const res = await submitOaApplication(row.id);
  if (res.data?.status === 'FAILED') modal.msgError(res.data.failReason || '泛微提交失败'); else modal.msgSuccess('已提交泛微审批');
  await loadApplications();
};
const syncApplication = async (row: any) => { await syncOaApplication(row.id); modal.msgSuccess('同步完成'); await loadApplications(); if (detail.value?.id === row.id) openApplicationDetail(row); };
const previewApplication = async (row: any) => { previewDialog.visible = true; previewLoading.value = true; previewRows.value = []; try { const res = await previewOaApplicationParticipants(row.id); previewRows.value = res.data || []; } finally { previewLoading.value = false; } };
const openApplicationDetail = async (row: any) => { detailDrawer.visible = true; eventLoading.value = true; try { const [info, history] = await Promise.all([getOaApplication(row.id), listOaApplicationEvents(row.id)]); detail.value = info.data; events.value = history.data || []; } finally { eventLoading.value = false; } };
const openAttachmentPreview = (item: OaAttachmentVO) => { attachmentPreview.ossId = item.ossId; attachmentPreview.fileName = item.fileName; attachmentPreview.visible = true; };
const openOa = (row: any) => { if (row.oaLink) window.open(row.oaLink, '_blank', 'noopener,noreferrer'); else modal.msgWarning('尚未配置泛微流程链接模板'); };

onMounted(async () => { await Promise.all([loadApplications(), loadBusinessTypes()]); });
</script>

<style scoped lang="scss">
.ecology-center-page { --ecology-ink: #25384f; --ecology-muted: #8190a3; --ecology-line: #e8edf4; padding-bottom: 28px; }
:global(.ecology-center-page .el-card) { border: 1px solid var(--ecology-line); border-radius: 18px; box-shadow: 0 10px 28px rgb(46 73 105 / 6%); }
.intro-card { position: relative; overflow: hidden; border: 0 !important; background: linear-gradient(135deg, #273968 0%, #344b8b 56%, #4c63ac 100%); }
.intro-card::before, .intro-card::after { position: absolute; border: 1px solid rgb(255 255 255 / 12%); border-radius: 50%; content: ''; pointer-events: none; }
.intro-card::before { top: -180px; right: 13%; width: 430px; height: 430px; background: rgb(135 189 255 / 10%); }
.intro-card::after { right: -80px; bottom: -240px; width: 390px; height: 390px; }
.intro-card__content { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 116px; padding: 23px 26px; }
.intro-card__copy { min-width: 0; }
.intro-card h2 { margin: 9px 0 7px; color: #fff; font-size: 27px; line-height: 1.2; letter-spacing: 0.01em; }
.intro-card p { max-width: 700px; margin: 0; color: rgb(238 244 255 / 76%); font-size: 14px; line-height: 1.6; }
.eyebrow { display: inline-flex; align-items: center; gap: 7px; color: #b9dbff; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; }
.eyebrow .el-icon { font-size: 14px; }
.intro-card__status { display: flex; align-items: center; flex: 0 0 auto; gap: 11px; min-width: 225px; padding: 13px 15px; border: 1px solid rgb(255 255 255 / 18%); border-radius: 14px; background: rgb(255 255 255 / 10%); backdrop-filter: blur(8px); }
.intro-card__status-icon { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: 12px; color: #c7e8ff; background: rgb(126 203 255 / 15%); font-size: 20px; }
.intro-card__status strong, .intro-card__status div span { display: block; }
.intro-card__status strong { color: #fff; font-size: 13px; }
.intro-card__status div span { margin-top: 4px; color: rgb(231 242 253 / 65%); font-size: 12px; }
.intro-card__status .el-tag { margin-left: auto; border-color: rgb(160 241 192 / 50%); color: #b4f4c9; background: rgb(76 201 129 / 10%); }

:global(.ecology-center-page .main-card .el-card__header) { padding: 0; border-bottom: 1px solid var(--ecology-line); }
:global(.ecology-center-page .main-card .el-card__body) { padding: 0 22px 26px; }
.main-card__header { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 24px; background: linear-gradient(180deg, #fcfdff 0%, #f8faff 100%); }
.section-heading { display: flex; align-items: center; min-width: 0; gap: 12px; }
.section-heading__icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex: 0 0 40px; border: 1px solid #e0e4ff; border-radius: 13px; color: #6c70df; background: #f2f3ff; font-size: 19px; }
.section-heading h3 { margin: 0; color: var(--ecology-ink); font-size: 17px; line-height: 1.3; }
.section-heading p { margin: 4px 0 0; overflow: hidden; color: var(--ecology-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.main-card__header > .el-tag { border-radius: 8px; }

.tab-label { display: inline-flex; align-items: center; gap: 7px; }
.tab-label .el-icon { font-size: 16px; }

.ecology-center-page :deep(.toolbar) { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.ecology-center-page :deep(.toolbar__hint) { color: var(--ecology-muted); font-size: 12px; }
.ecology-center-page :deep(.toolbar .el-button), .ecology-center-page :deep(.toolbar .el-input__wrapper), .ecology-center-page :deep(.toolbar .el-select__wrapper) { border-radius: 9px; }
.detail-content { white-space: pre-wrap; line-height: 1.7; }
.attachment-item { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.event-error { color: var(--el-color-danger); }
.rule-user-picker { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.application-people-preview { padding: 10px 14px; margin-bottom: 16px; color: var(--el-text-color-regular); line-height: 1.9; background: var(--el-fill-color-light); border-radius: 4px; }
.application-people-preview span { color: var(--el-text-color-secondary); }
.application-flow-summary { display: flex; align-items: center; gap: 10px; padding: 0 0 16px 100px; color: var(--el-text-color-regular); }
.application-people-picker { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.application-stage-picker { display: block; }
.application-stage-picker__toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.application-stage-picker__toolbar > span { color: var(--el-text-color-secondary); font-size: 12px; }
.application-ordered-person { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px 2px 9px; background: var(--el-fill-color-light); border-radius: 4px; }
.form-tip { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }

@media (max-width: 900px) {
  .intro-card__content, .main-card__header { align-items: flex-start; flex-direction: column; }
  .intro-card__status { width: min(100%, 320px); }
  .main-card__header > .el-tag { align-self: flex-start; }
  .section-heading p { white-space: normal; }
}
</style>

<style lang="scss">
/*
 * 审批中心页面有一套独立的卡片、表格和页签视觉样式，不能只依赖
 * Element Plus 的全局暗色变量。这里用页面根节点限定范围，避免影响其他业务页面。
 */
html.dark .ecology-center-page {
  --ecology-ink: #e7eef9;
  --ecology-muted: #91a4bf;
  --ecology-line: rgba(71, 85, 105, 0.58);
  color: var(--app-text-title);
}

html.dark .ecology-center-page .main-card,
html.dark .ecology-center-page .main-card .el-card__body,
html.dark .ecology-center-page .main-card .el-card__header {
  background-color: var(--app-surface-bg);
}

html.dark .ecology-center-page .main-card {
  border-color: var(--app-surface-border);
  box-shadow: var(--app-shadow-md);
}

html.dark .ecology-center-page .main-card .el-card__header {
  border-bottom-color: var(--ecology-line);
}

html.dark .ecology-center-page .main-card__header {
  background: linear-gradient(180deg, #172235 0%, #111827 100%);
}

.ecology-center-page.is-embedded {
  padding: 0;
}

.ecology-center-page.is-embedded .main-card {
  margin-top: 0 !important;
  border: 0 !important;
  box-shadow: none !important;
}

.ecology-center-page.is-embedded .main-card .el-card__header {
  display: none;
}

.ecology-center-page.is-embedded .main-card .el-card__body {
  padding: 0 0 10px !important;
}

html.dark .ecology-center-page .section-heading__icon {
  border-color: rgba(129, 140, 248, 0.34);
  color: #b7c2ff;
  background: rgba(99, 102, 241, 0.16);
}

html.dark .ecology-center-page .section-heading h3,
html.dark .ecology-center-page .business-type-panel .panel-heading strong {
  color: var(--app-text-title);
}

html.dark .ecology-center-page .section-heading p,
html.dark .ecology-center-page .business-type-panel .panel-heading p,
html.dark .ecology-center-page .toolbar__hint,
html.dark .ecology-center-page .form-tip {
  color: var(--app-text-muted);
}

html.dark .ecology-center-page .el-form-item__label {
  color: #c6d2e4;
}

html.dark .ecology-center-page .el-input__wrapper,
html.dark .ecology-center-page .el-select__wrapper,
html.dark .ecology-center-page .el-textarea__inner,
html.dark .ecology-center-page .el-input-number,
html.dark .ecology-center-page .el-date-editor.el-input__wrapper {
  border-color: rgba(100, 116, 139, 0.55);
  background-color: rgba(15, 23, 42, 0.76);
  box-shadow: 0 0 0 1px rgba(100, 116, 139, 0.2) inset;
}

html.dark .ecology-center-page .el-input__wrapper:hover,
html.dark .ecology-center-page .el-select__wrapper:hover,
html.dark .ecology-center-page .el-textarea__inner:hover,
html.dark .ecology-center-page .el-input-number:hover,
html.dark .ecology-center-page .el-input__wrapper.is-focus,
html.dark .ecology-center-page .el-select__wrapper.is-focused,
html.dark .ecology-center-page .el-textarea__inner:focus {
  border-color: rgba(56, 168, 242, 0.82);
  box-shadow: 0 0 0 1px rgba(56, 168, 242, 0.26) inset;
}

html.dark .ecology-center-page .el-input__inner,
html.dark .ecology-center-page .el-textarea__inner,
html.dark .ecology-center-page .el-select__selected-item,
html.dark .ecology-center-page .el-select__placeholder,
html.dark .ecology-center-page .el-input__count,
html.dark .ecology-center-page .el-input-number__decrease,
html.dark .ecology-center-page .el-input-number__increase {
  color: #e5edf8;
}

html.dark .ecology-center-page .el-input__inner::placeholder,
html.dark .ecology-center-page .el-textarea__inner::placeholder,
html.dark .ecology-center-page .el-select__placeholder {
  color: #71839e;
}

html.dark .ecology-center-page .el-table {
  --el-table-bg-color: #0f172a;
  --el-table-tr-bg-color: #0f172a;
  --el-table-header-bg-color: #172235;
  --el-table-row-hover-bg-color: rgba(56, 168, 242, 0.12);
  --el-table-current-row-bg-color: rgba(56, 168, 242, 0.16);
  --el-table-border-color: rgba(71, 85, 105, 0.58);
  --el-table-text-color: #c6d2e4;
  overflow: hidden;
  border-color: var(--el-table-border-color);
  background-color: var(--el-table-bg-color);
}

html.dark .ecology-center-page .el-table th.el-table__cell,
html.dark .ecology-center-page .el-table thead,
html.dark .ecology-center-page .el-table__header-wrapper,
html.dark .ecology-center-page .el-table__fixed-header-wrapper {
  color: #c9d7ea;
  background-color: #172235;
}

html.dark .ecology-center-page .el-table td.el-table__cell {
  color: #c6d2e4;
  background-color: #0f172a;
  border-bottom-color: rgba(71, 85, 105, 0.42);
}

html.dark .ecology-center-page .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background-color: #121d30;
}

html.dark .ecology-center-page .el-table__body tr:hover > td.el-table__cell,
html.dark .ecology-center-page .el-table__body tr.current-row > td.el-table__cell {
  background-color: rgba(56, 168, 242, 0.12) !important;
}

html.dark .ecology-center-page .el-table__fixed,
html.dark .ecology-center-page .el-table__fixed-right {
  background-color: #0f172a;
  box-shadow: 0 0 10px rgba(2, 6, 23, 0.28);
}

html.dark .ecology-center-page .el-table__fixed-right::before,
html.dark .ecology-center-page .el-table__fixed::before {
  background-color: rgba(71, 85, 105, 0.58);
}

html.dark .ecology-center-page .el-alert--info {
  border-color: rgba(56, 168, 242, 0.26);
  background-color: rgba(37, 99, 235, 0.12);
}

html.dark .ecology-center-page .el-alert--info .el-alert__title,
html.dark .ecology-center-page .el-alert--info .el-alert__description,
html.dark .ecology-center-page .el-alert--info .el-alert__icon {
  color: #b9d7f8;
}

html.dark .ecology-center-page .el-empty__description {
  color: #8295b1;
}

html.dark .ecology-center-page .pagination-container {
  background: transparent;
}

/* 业务类型配置 */
html.dark .ecology-center-page .business-type-panel .panel-heading__icon {
  border-color: rgba(129, 140, 248, 0.34);
  color: #b7c2ff;
  background: rgba(99, 102, 241, 0.16);
}

html.dark .ecology-center-page .business-type-panel .panel-summary {
  border-color: rgba(71, 85, 105, 0.52);
  color: #91a4bf;
  background: rgba(30, 41, 59, 0.74);
}

html.dark .ecology-center-page .business-type-panel .panel-summary strong {
  color: #76c4ff;
}

html.dark .ecology-center-page .business-type-panel .panel-summary__dot {
  background: #63d39b;
  box-shadow: 0 0 0 4px rgba(99, 211, 155, 0.14);
}

html.dark .ecology-center-page .business-type-panel .business-code-tag {
  border-color: rgba(129, 140, 248, 0.48);
  color: #c7d2fe;
  background: rgba(99, 102, 241, 0.16);
}

/* 审批方案管理 */
html.dark .ecology-center-page .approval-plan-panel .ordered-users {
  border-color: rgba(71, 85, 105, 0.58);
  background: rgba(15, 23, 42, 0.58);
}

html.dark .ecology-center-page .approval-plan-panel .ordered-user {
  color: #d7e3f4;
  background: rgba(30, 41, 59, 0.76);
}

html.dark .ecology-center-page .approval-plan-panel .ordered-user__name small,
html.dark .ecology-center-page .approval-plan-panel .ordered-users__toolbar {
  color: #91a4bf;
}

html.dark .ecology-center-page .el-collapse,
html.dark .ecology-center-page .el-collapse-item__header,
html.dark .ecology-center-page .el-collapse-item__wrap {
  border-color: rgba(71, 85, 105, 0.58);
  color: #c6d2e4;
  background-color: transparent;
}

html.dark .ecology-center-page .el-collapse-item__content {
  color: #c6d2e4;
}
</style>

<style lang="scss">
.application-dialog.el-dialog {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  box-shadow: 0 24px 70px rgb(15 23 42 / 18%);
}

.application-dialog .el-dialog__header {
  margin-right: 0;
  padding: 18px 24px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.application-dialog .el-dialog__headerbtn {
  top: 18px;
  right: 20px;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.application-dialog .el-dialog__headerbtn:hover {
  background: var(--el-color-primary-light-9);
}

.application-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--el-text-color-secondary);
}

.application-dialog .el-dialog__body {
  max-height: calc(100vh - 232px);
  padding: 18px 24px 14px;
  overflow-y: auto;
  background: var(--el-fill-color-lighter);
  scrollbar-color: var(--el-border-color) transparent;
  scrollbar-width: thin;
}

.application-dialog .el-dialog__body::-webkit-scrollbar {
  width: 6px;
}

.application-dialog .el-dialog__body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: var(--el-border-color);
}

.application-dialog .el-dialog__body::-webkit-scrollbar-track {
  background: transparent;
}

.application-dialog .el-dialog__footer {
  padding: 14px 24px 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.application-dialog__title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
  padding-right: 44px;
}

.application-dialog__title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 19px;
}

.application-dialog__title > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.application-dialog__title strong {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 17px;
  line-height: 23px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-dialog__title small {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-form {
  min-width: 0;
}

.application-section {
  padding: 16px 18px 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: 0 5px 18px rgb(15 23 42 / 3%);
}

.application-section + .application-section {
  margin-top: 14px;
}

.application-section__heading {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
  margin-bottom: 14px;
}

.application-section__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: 9px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.application-section__heading > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.application-section__heading strong {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 20px;
}

.application-section__heading > div > span {
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-form-grid {
  display: grid;
  gap: 0 16px;
}

.application-form-grid--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.application-form .el-form-item {
  min-width: 0;
  margin-bottom: 14px;
}

.application-form .el-form-item__label {
  padding: 0 0 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 650;
  line-height: 18px;
}

.application-form .el-form-item__content,
.application-form .el-select,
.application-form .el-input {
  width: 100%;
  min-width: 0;
}

.application-form .el-input__wrapper,
.application-form .el-select__wrapper,
.application-form .el-textarea__inner {
  border-radius: 10px;
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.application-form .el-input__wrapper:hover,
.application-form .el-select__wrapper:hover,
.application-form .el-textarea__inner:hover {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
}

.application-form .el-input__wrapper.is-focus,
.application-form .el-select__wrapper.is-focused,
.application-form .el-textarea__inner:focus {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 3px var(--el-color-primary-light-9);
}

.application-form .el-input__wrapper,
.application-form .el-select__wrapper {
  min-height: 40px;
}

.application-form .el-radio-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  min-height: 40px;
  gap: 8px 18px;
}

.application-form .el-radio {
  margin-right: 0;
}

.application-form .el-radio__label {
  color: var(--el-text-color-regular);
}

.application-section--content .el-textarea__inner {
  min-height: 132px;
  padding: 11px 12px;
  line-height: 1.6;
  resize: vertical;
}

.application-alert {
  margin: -2px 0 14px;
  border-radius: 10px;
}

.application-flow-summary {
  display: flex;
  align-items: center;
  min-height: 40px;
  gap: 10px;
  padding: 8px 12px;
  margin: -2px 0 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-lighter);
}

.application-flow-summary > span:first-child {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
}

.application-flow-summary .form-tip {
  margin-top: 0;
}

.application-people-preview {
  padding: 10px 12px;
  margin: -2px 0 14px;
  border: 1px solid var(--el-color-success-light-7);
  border-left-width: 3px;
  border-radius: 10px;
  color: var(--el-text-color-regular);
  line-height: 1.9;
  background: var(--el-color-success-light-9);
}

.application-people-preview span {
  color: var(--el-text-color-secondary);
}

.application-people-picker {
  display: flex;
  align-items: stretch;
  width: 100%;
  flex-direction: column;
  gap: 7px;
}

.application-people-picker > .el-button {
  align-self: flex-start;
  border-radius: 9px;
}

.application-ordered-person {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  gap: 8px;
  padding: 6px 8px 6px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-lighter);
  box-sizing: border-box;
}

.application-ordered-person > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-ordered-person .el-button-group {
  display: inline-flex;
  flex: 0 0 auto;
}

.application-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.application-dialog__footer > span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.application-dialog__footer > div {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

.application-dialog__footer .el-button {
  min-width: 84px;
  border-radius: 10px;
}

html.dark .application-dialog.el-dialog {
  border-color: rgba(71, 85, 105, 0.72);
  background: #111c2d;
  box-shadow: 0 24px 70px rgb(0 0 0 / 38%);
}

html.dark .application-dialog .el-dialog__header,
html.dark .application-dialog .el-dialog__footer,
html.dark .application-dialog .application-section {
  border-color: rgba(71, 85, 105, 0.58);
  background: #111c2d;
}

html.dark .application-dialog .el-dialog__body {
  background: #0d1727;
}

html.dark .application-dialog .el-dialog__headerbtn {
  background: rgba(30, 41, 59, 0.9);
}

html.dark .application-dialog .el-dialog__headerbtn:hover {
  background: rgba(56, 168, 242, 0.16);
}

html.dark .application-dialog .application-dialog__title-icon,
html.dark .application-dialog .application-section__index {
  border-color: rgba(56, 168, 242, 0.35);
  color: #9bd5ff;
  background: rgba(56, 168, 242, 0.14);
}

html.dark .application-dialog .application-flow-summary,
html.dark .application-dialog .application-ordered-person {
  border-color: rgba(71, 85, 105, 0.62);
  background: rgba(15, 23, 42, 0.72);
}

html.dark .application-dialog .application-people-preview {
  border-color: rgba(74, 222, 128, 0.3);
  border-left-color: #63d39b;
  background: rgba(34, 122, 78, 0.14);
}

@media (max-width: 760px) {
  .application-dialog.el-dialog {
    width: calc(100vw - 24px) !important;
    margin-top: 6vh !important;
  }

  .application-dialog .el-dialog__header,
  .application-dialog .el-dialog__body,
  .application-dialog .el-dialog__footer {
    padding-right: 16px;
    padding-left: 16px;
  }

  .application-dialog .el-dialog__body {
    max-height: calc(100vh - 190px);
  }

  .application-form-grid--two {
    grid-template-columns: minmax(0, 1fr);
  }

  .application-dialog__footer {
    align-items: flex-end;
    flex-direction: column;
  }

  .application-dialog__footer > span {
    align-self: flex-start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .application-form .el-input__wrapper,
  .application-form .el-select__wrapper,
  .application-form .el-textarea__inner {
    transition: none;
  }
}
</style>
