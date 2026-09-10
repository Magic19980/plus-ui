<template>
  <div class="approval-plan-panel">
    <el-form :inline="true" @submit.prevent>
      <el-form-item label="审批方式">
        <el-select v-model="query.workflowConfigId" clearable filterable placeholder="全部审批方式" style="width: 250px">
          <el-option v-for="item in workflowConfigs" :key="item.id" :label="item.workflowName" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务类型">
        <el-select v-model="query.businessType" clearable filterable placeholder="全部业务类型" style="width: 220px">
          <el-option v-for="item in businessTypes" :key="item.id" :label="businessTypeLabel(item)" :value="item.businessType" />
        </el-select>
      </el-form-item>
      <el-form-item label="来源模块"><el-input v-model="query.sourceModule" clearable placeholder="可选" style="width: 160px" /></el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="loadList">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="toolbar">
      <div class="toolbar__hint">审批方案绑定一个表单下的审批方式，并复用该业务的审批人员；一次性差异可在发起申请时临时指定。</div>
      <el-button v-hasPermi="['ecology:departmentApproval:add']" type="primary" icon="Plus" @click="openAdd">新增审批方案</el-button>
    </div>

    <DepartmentDataTable v-loading="loading" :data="rows" border>
      <el-table-column label="方案名称" prop="planName" min-width="180" show-overflow-tooltip />
      <el-table-column label="业务类型" prop="businessType" width="190" show-overflow-tooltip>
        <template #default="scope">{{ businessTypeName(scope.row.businessType) }}</template>
      </el-table-column>
      <el-table-column label="来源模块" prop="sourceModule" width="150" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.sourceModule || '通用' }}</template>
      </el-table-column>
      <el-table-column label="业务归属组织" prop="businessDeptName" width="170" show-overflow-tooltip>
        <template #default="scope">{{ scope.row.businessDeptName || '全组织通用' }}</template>
      </el-table-column>
      <el-table-column label="泛微表单" prop="formName" min-width="180" show-overflow-tooltip />
      <el-table-column label="审批方式" width="180"><template #default="scope">{{ scope.row.approvalName || scope.row.approvalCode || scope.row.processType || '—' }}</template></el-table-column>
      <el-table-column label="审批人" min-width="240" show-overflow-tooltip>
        <template #default="scope">{{ names(scope.row, 'APPROVER') }}</template>
      </el-table-column>
      <el-table-column label="抄送人" min-width="180" show-overflow-tooltip>
        <template #default="scope">{{ names(scope.row, 'COPY') }}</template>
      </el-table-column>
      <el-table-column label="优先级" prop="priority" width="80" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope"><el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">{{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="170" align="center">
        <template #default="scope">
          <DepartmentTableActions>
            <el-button v-hasPermi="['ecology:departmentApproval:edit']" link type="primary" @click="openEdit(scope.row)">修改</el-button>
            <el-button v-hasPermi="['ecology:departmentApproval:remove']" link type="danger" @click="remove(scope.row)">删除</el-button>
          </DepartmentTableActions>
        </template>
      </el-table-column>
    </DepartmentDataTable>
    <el-empty v-if="!loading && rows.length === 0" description="暂无审批方案" />

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="880px" append-to-body destroy-on-close class="approval-plan-dialog">
      <div class="approval-plan-intro">
        <span class="approval-plan-intro__icon"><el-icon><Finished /></el-icon></span>
        <div>
          <strong>配置一套可复用的审批方案</strong>
          <p>先选择业务和审批方式，再配置审批人员；提交申请时可直接复用。</p>
        </div>
        <el-tag v-if="selectedWorkflowConfig" type="primary" effect="plain">{{ selectedApprovalName }}</el-tag>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="approval-plan-form">
        <section class="form-section">
          <div class="form-section__head">
            <div class="form-section__heading"><span class="form-section__index">01</span><div><h3>基础信息</h3><p>确定这套方案适用于哪类业务和组织。</p></div></div>
            <span class="form-section__hint">带 <i>*</i> 为必填</span>
          </div>
          <div class="form-section__body form-grid">
            <el-form-item label="审批方式" prop="workflowConfigId" class="form-grid__half">
              <el-select v-model="form.workflowConfigId" filterable popper-class="approval-plan-dialog-popper" placeholder="选择已配置的审批方式" style="width: 100%" @change="workflowChanged">
                <el-option v-for="item in workflowConfigs" :key="item.id" :label="`${item.formName || '泛微表单'} · ${item.approvalName || item.workflowName}`" :value="item.id" />
              </el-select>
              <span class="form-tip">节点和泛微字段由流程配置统一维护。</span>
            </el-form-item>
            <el-form-item label="业务类型" prop="businessType" class="form-grid__half">
              <el-select v-model="form.businessType" filterable popper-class="approval-plan-dialog-popper" placeholder="选择已配置的业务类型" style="width: 100%">
                <el-option v-for="item in businessTypes" :key="item.id" :label="businessTypeLabel(item)" :value="item.businessType" :disabled="item.status !== 'ENABLED' && item.businessType !== form.businessType" />
              </el-select>
              <span class="form-tip">业务类型由统一配置维护，方案只选择，不手工填写。</span>
            </el-form-item>
            <el-form-item label="方案名称" prop="planName" class="form-grid__half"><el-input v-model="form.planName" maxlength="100" placeholder="如：财务复核、部门负责人审批" /></el-form-item>
            <el-form-item label="来源模块" class="form-grid__half"><el-input v-model="form.sourceModule" maxlength="64" placeholder="可选；留空表示该业务通用方案" /></el-form-item>
            <el-form-item label="业务归属组织" class="form-grid__full">
              <el-tree-select
                v-model="form.businessDeptId"
                node-key="deptId"
                value-key="deptId"
                :data="organizationTree"
                :cache-data="organizationCache"
                :props="organizationTreeProps"
                :lazy="!organizationSearchMode"
                :load="loadOrganizationNode"
                check-strictly
                :expand-on-click-node="false"
                :default-expand-all="organizationSearchMode"
                :filter-node-method="filterOrganizationNode"
                :empty-text="organizationSearchMode ? '未找到匹配组织' : '暂无可用组织'"
                filterable
                remote
                popper-class="approval-plan-dialog-popper"
                :remote-method="searchOrganizations"
                :loading="organizationSearching"
                :debounce="250"
                clearable
                placeholder="输入名称模糊搜索，或展开选择组织；留空表示全组织通用"
                style="width: 100%"
                @visible-change="handleOrganizationVisibleChange"
                @change="organizationChanged"
              />
              <span v-if="selectedOrganizationName" class="organization-selected"><el-icon><OfficeBuilding /></el-icon>已选择：{{ selectedOrganizationName }}</span>
              <span class="form-tip">不选择组织时，这套方案可复用于整个业务；选择后仅对该组织及下级组织生效。</span>
            </el-form-item>
          </div>
        </section>

        <section class="form-section form-section--people">
          <div class="form-section__head">
            <div class="form-section__heading"><span class="form-section__index">02</span><div><h3>审批人员</h3><p>按流程节点配置审批人，人员顺序将直接影响审批顺序。</p></div></div>
            <el-tag v-if="stageDefinitions.length" type="success" effect="plain">{{ stageDefinitions.length }} 个节点</el-tag>
          </div>
          <el-alert v-if="!stageDefinitions.length" title="当前审批方式还没有配置审批节点，请先到“流程配置”中维护节点字段。" type="warning" :closable="false" show-icon class="section-alert" />
          <div v-else class="stage-grid">
            <div v-for="stage in stageDefinitions" :key="stage.code" class="stage-card">
              <div class="stage-card__head"><div><strong>{{ stage.name }}</strong><span>{{ stage.code }}</span></div><el-tag size="small" :type="stage.required ? 'warning' : 'info'" effect="plain">{{ stage.required ? '必填' : '可选' }}</el-tag></div>
              <div class="stage-card__meta">{{ stage.mode === 'COUNTERSIGN' ? '会签节点，可多选' : '按当前顺序依次审批' }}</div>
              <div class="ordered-users__toolbar"><el-button type="primary" plain size="small" @click="openStageSelect(stage.code)">选择人员</el-button><span>{{ userListForStage(stage.code).length ? `已选 ${userListForStage(stage.code).length} 人` : '暂未配置' }}</span></div>
              <stage-list
                :users="userListForStage(stage.code)"
                :sortable="stage.mode !== 'COUNTERSIGN'"
                @move="(index, offset) => move(userListForStage(stage.code), index, offset)"
                @remove="(id) => removeUser(userListForStage(stage.code), id)"
              />
            </div>
            <div class="stage-card stage-card--copy">
              <div class="stage-card__head"><div><strong>抄送人员</strong><span>COPY</span></div><el-tag size="small" type="info" effect="plain">可选</el-tag></div>
              <div class="stage-card__meta">仅接收结果通知，不参与审批。</div>
              <div class="ordered-users__toolbar"><el-button plain size="small" @click="openStageSelect('COPY')">选择人员</el-button><span>{{ copyUsers.length ? `已选 ${copyUsers.length} 人` : '暂未配置' }}</span></div>
              <stage-list :users="copyUsers" :sortable="false" @remove="(id) => removeUser(copyUsers, id)" />
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="form-section__head">
            <div class="form-section__heading"><span class="form-section__index">03</span><div><h3>策略设置</h3><p>控制多套方案同时可用时的选择优先级。</p></div></div>
          </div>
          <div class="policy-grid">
            <div class="policy-field"><div><strong>自动匹配优先级</strong><span>数值越大，匹配时越优先</span></div><el-input-number v-model="form.priority" :min="0" :max="999" controls-position="right" /></div>
            <div class="policy-field"><div><strong>方案状态</strong><span>停用后不会参与自动匹配</span></div><el-switch v-model="form.status" active-value="ENABLED" inactive-value="DISABLED" inline-prompt active-text="启用" inactive-text="停用" /></div>
          </div>
          <div class="advanced-section">
            <el-collapse v-model="advancedOpen" class="advanced-collapse">
              <el-collapse-item name="advanced">
                <template #title><div class="advanced-title"><span class="advanced-title__icon"><el-icon><Setting /></el-icon></span><div><strong>高级匹配条件</strong><span>可选 · 管理员配置</span></div></div></template>
                <div class="advanced-content">
                  <div class="advanced-content__tip"><el-icon><InfoFilled /></el-icon><span>普通场景无需填写。仅当同一业务需要根据申请表单字段区分多套审批方案时使用；留空表示该业务下的通用方案。</span></div>
                  <el-input v-model="form.matchConditionJson" type="textarea" :rows="4" placeholder='例如：{"settlementType":"MONTHLY"}' />
                  <span class="form-tip">填写 JSON 对象，只有申请表单字段全部匹配时才会使用本方案。</span>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </section>

        <section class="form-section form-section--remark">
          <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" maxlength="1000" show-word-limit placeholder="补充这套审批方案的使用说明（可选）" /></el-form-item>
        </section>
      </el-form>
      <template #footer><el-button type="primary" :loading="saving" @click="save">保存</el-button><el-button @click="dialog.visible = false">取消</el-button></template>
    </el-dialog>

    <UserSelect ref="activeStageSelectRef" multiple :data="activeStageUsers.map((item) => item.userId)" @confirm-call-back="setActiveStageUsers" />
  </div>
</template>

<script setup lang="ts">
import { Finished, InfoFilled, OfficeBuilding, Setting } from '@element-plus/icons-vue';
import { computed, h, nextTick, onMounted, reactive, ref, watch } from 'vue';
import modal from '@/plugins/modal';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import UserSelect from '@/components/UserSelect/index.vue';
import type { UserVO } from '@/api/system/user/types';
import { delOaDepartmentApproval, getOaDepartmentApproval, listOaApprovalOrganizations, listOaBusinessTypes, listOaDepartmentApprovals, listOaWorkflowConfigs, saveOaDepartmentApproval } from '@/api/ecology';
import type { DeptVO } from '@/api/system/dept/types';
import type { OaBusinessTypeVO, OaDepartmentApprovalForm, OaDepartmentApprovalVO, OaWorkflowConfigVO } from '@/api/ecology/types';

type StageDefinition = { code: string; name: string; mode: string; required: boolean; sortNo: number; fieldCode: string };

const props = defineProps<{ initialBusinessType?: string }>();

const rows = ref<OaDepartmentApprovalVO[]>([]);
const workflowConfigs = ref<OaWorkflowConfigVO[]>([]);
const businessTypes = ref<OaBusinessTypeVO[]>([]);
const loading = ref(false);
const saving = ref(false);
const formRef = ref<ElFormInstance>();
const activeStageSelectRef = ref<InstanceType<typeof UserSelect>>();
const activeStageCode = ref('');
const stageUsers = reactive<Record<string, UserVO[]>>({});
const copyUsers = ref<UserVO[]>([]);
const advancedOpen = ref<string[]>([]);
const organizationTree = ref<DeptVO[]>([]);
const organizationRootTree = ref<DeptVO[]>([]);
const organizationCache = ref<DeptVO[]>([]);
const organizationLabel = ref('');
const organizationLoaded = ref(false);
const organizationSearchMode = ref(false);
const organizationSearching = ref(false);
let organizationRequestId = 0;
let organizationSearchRequestId = 0;
const organizationTreeProps = { value: 'deptId', label: 'deptName', children: 'children', isLeaf: (data: DeptVO) => data.hasChildren === false };
const query = reactive<{ workflowConfigId?: string | number; businessType?: string; sourceModule?: string }>({ businessType: props.initialBusinessType });
const form = reactive<OaDepartmentApprovalForm>({ workflowConfigId: undefined, businessType: '', planName: '', sourceModule: '', businessDeptId: undefined, matchConditionJson: '', priority: 0, status: 'ENABLED', remark: '', users: [] });
const dialog = reactive({ visible: false, title: '' });
const rules = { workflowConfigId: [{ required: true, message: '请选择审批方式', trigger: 'change' }], businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }], planName: [{ required: true, message: '请输入方案名称', trigger: 'blur' }] };

const selectedWorkflowConfig = computed(() => workflowConfigs.value.find((item) => String(item.id) === String(form.workflowConfigId)));
const selectedApprovalName = computed(() => selectedWorkflowConfig.value?.approvalName || selectedWorkflowConfig.value?.workflowName || '未选择审批方式');
const stageDefinitions = computed<StageDefinition[]>(() => {
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
const businessTypeLabel = (item: OaBusinessTypeVO) => `${item.businessName}（${item.businessType}）`;
const businessTypeName = (value?: string) => businessTypes.value.find((item) => item.businessType === value)?.businessName || value || '—';
const names = (row: { users?: OaDepartmentApprovalVO['users'] }, role: string) => (row.users || []).filter((item) => item.participantRole === role).toSorted((a, b) => (a.sortNo || 0) - (b.sortNo || 0)).map((item) => item.nickName || item.userName || item.employeeNo || item.localUserId).join('、') || '—';
const loadConfigs = async () => { const res = await listOaWorkflowConfigs(undefined, true); workflowConfigs.value = res.data || []; };
const loadBusinessTypes = async () => { const res = await listOaBusinessTypes(undefined, false); businessTypes.value = res.data || []; };
const loadList = async () => { loading.value = true; try { const res = await listOaDepartmentApprovals({ ...query, enabledOnly: false }); rows.value = res.data || []; } finally { loading.value = false; } };
const resetQuery = () => { query.workflowConfigId = undefined; query.businessType = undefined; query.sourceModule = undefined; loadList(); };
watch(() => props.initialBusinessType, (businessType) => { query.businessType = businessType; void loadList(); });
const resetUsers = () => { Object.keys(stageUsers).forEach((key) => delete stageUsers[key]); copyUsers.value = []; activeStageCode.value = ''; };
const resetForm = () => { Object.assign(form, { id: undefined, workflowConfigId: undefined, businessType: '', planName: '', sourceModule: '', businessDeptId: undefined, matchConditionJson: '', priority: 0, status: 'ENABLED', remark: '', users: [] }); resetUsers(); advancedOpen.value = []; organizationTree.value = []; organizationRootTree.value = []; organizationCache.value = []; organizationLabel.value = ''; organizationLoaded.value = false; organizationSearchMode.value = false; organizationSearching.value = false; organizationRequestId++; organizationSearchRequestId++; };
const workflowChanged = () => { resetUsers(); };
const loadOrganizations = async (deptIds?: Array<string | number>) => {
  const requestId = ++organizationRequestId;

  // 下拉框关闭后不重复请求根节点，避免选中组织时出现闪烁。
  if (!deptIds?.length && organizationLoaded.value) {
    organizationTree.value = organizationRootTree.value;
    organizationLoaded.value = true;
    return;
  }

  try {
    const res = await listOaApprovalOrganizations({ deptIds, parentId: undefined });
    if (requestId !== organizationRequestId) return;
    if (deptIds?.length) {
      organizationCache.value = res.data || [];
    } else {
      const rootTree = res.data || [];
      organizationRootTree.value = rootTree;
      organizationTree.value = rootTree;
      organizationLoaded.value = true;
    }
  } catch {
    if (requestId === organizationRequestId) organizationTree.value = organizationRootTree.value;
  }
};
const toOrganizationTreeNode = (dept: DeptVO): DeptVO => ({ ...dept, children: [] });
const buildOrganizationSearchTree = (rows: DeptVO[]) => {
  const nodeMap = new Map<string, DeptVO>();
  rows.forEach((row) => nodeMap.set(String(row.deptId), toOrganizationTreeNode(row)));
  const roots: DeptVO[] = [];
  nodeMap.forEach((node) => {
    const parent = nodeMap.get(String(node.parentId));
    if (parent && String(parent.deptId) !== String(node.deptId)) parent.children.push(node);
    else roots.push(node);
  });
  const sortTree = (node: DeptVO) => {
    node.children.sort((left, right) => (left.orderNum || 0) - (right.orderNum || 0));
    node.hasChildren = node.children.length > 0;
    node.children.forEach(sortTree);
  };
  roots.sort((left, right) => (left.orderNum || 0) - (right.orderNum || 0));
  roots.forEach(sortTree);
  return roots;
};
// 组织名称由服务端模糊查询，前端只负责展示服务端返回的完整祖先路径。
// 关闭本地过滤可以避免搜索结果的祖先节点因不包含关键字而被隐藏。
const filterOrganizationNode = () => true;
const findOrganizationNode = (nodes: DeptVO[], deptId: string | number): DeptVO | undefined => {
  for (const node of nodes) {
    if (String(node.deptId) === String(deptId)) return node;
    const child = findOrganizationNode(node.children || [], deptId);
    if (child) return child;
  }
  return undefined;
};
const selectedOrganizationName = computed(() => {
  if (form.businessDeptId == null || form.businessDeptId === '') return '';
  const node = findOrganizationNode(organizationCache.value, form.businessDeptId)
    || findOrganizationNode(organizationTree.value, form.businessDeptId)
    || findOrganizationNode(organizationRootTree.value, form.businessDeptId);
  return node?.deptName || organizationLabel.value;
});
const organizationChanged = (deptId?: string | number) => {
  if (deptId == null) return;
  const selected = findOrganizationNode(organizationTree.value, deptId);
  if (selected && !organizationCache.value.some((item) => String(item.deptId) === String(deptId))) organizationCache.value.push(selected);
};
const searchOrganizations = async (keyword: string) => {
  const normalizedKeyword = String(keyword || '').trim();
  const requestId = ++organizationSearchRequestId;
  if (!normalizedKeyword) {
    organizationSearchMode.value = false;
    organizationSearching.value = false;
    organizationTree.value = organizationRootTree.value;
    return;
  }

  organizationSearchMode.value = true;
  organizationSearching.value = true;
  try {
    const res = await listOaApprovalOrganizations({ keyword: normalizedKeyword });
    if (requestId !== organizationSearchRequestId) return;
    organizationTree.value = buildOrganizationSearchTree((res.data || []) as DeptVO[]);
  } catch {
    if (requestId === organizationSearchRequestId) organizationTree.value = [];
  } finally {
    if (requestId === organizationSearchRequestId) organizationSearching.value = false;
  }
};
const loadOrganizationNode = async (node: any, resolve: (data: DeptVO[]) => void) => {
  if (node.level === 0) {
    // Element Plus 在 lazy 模式下会忽略 data 中的根节点，并主动调用一次 load。
    // 根节点已经由 approval-plan/organizations 接口加载完成，这里必须返回根组织，
    // 否则下拉树会被初始化为空并显示“无数据”。
    resolve(organizationRootTree.value);
    return;
  }
  try {
    const res = await listOaApprovalOrganizations({ parentId: node.data.deptId });
    resolve(res.data || []);
  } catch {
    resolve([]);
  }
};
const handleOrganizationVisibleChange = (visible: boolean) => { if (visible && !organizationLoaded.value) void loadOrganizations(); };
const openAdd = async () => { resetForm(); if (!workflowConfigs.value.length) await loadConfigs(); if (!businessTypes.value.length) await loadBusinessTypes(); await loadOrganizations(); dialog.title = '新增审批方案'; dialog.visible = true; };
const toUser = (item: { localUserId: string | number; nickName?: string; userName?: string; employeeNo?: string; deptName?: string }) => ({ userId: item.localUserId, nickName: item.nickName || item.userName || String(item.localUserId), userName: item.userName || '', employeeNo: item.employeeNo, deptName: item.deptName } as UserVO);
const openEdit = async (row: any) => {
  if (!workflowConfigs.value.length) await loadConfigs();
  const res = await getOaDepartmentApproval(row.id);
  Object.assign(form, res.data);
  organizationLabel.value = res.data?.businessDeptName || '';
  resetUsers();
  organizationTree.value = [];
  organizationRootTree.value = [];
  organizationCache.value = [];
  organizationLoaded.value = false;
  organizationSearchMode.value = false;
  organizationSearching.value = false;
  organizationRequestId++;
  organizationSearchRequestId++;
  await loadOrganizations();
  if (res.data?.businessDeptId) await loadOrganizations([res.data.businessDeptId]);
  if (res.data?.businessDeptId && res.data?.businessDeptName && !findOrganizationNode(organizationCache.value, res.data.businessDeptId)) {
    organizationCache.value.push({
      deptId: res.data.businessDeptId,
      deptName: res.data.businessDeptName,
      children: [],
      hasChildren: false
    } as DeptVO);
  }
  const users = res.data?.users || [];
  users.toSorted((a: any, b: any) => (a.sortNo || 0) - (b.sortNo || 0)).forEach((item: any) => {
    const user = toUser(item);
    const stageCode = String(item.stageCode || '').trim().toUpperCase();
    if (item.participantRole === 'COPY' || stageCode === 'COPY') copyUsers.value.push(user);
    else (stageUsers[stageCode] ||= []).push(user);
  });
  dialog.title = '修改审批方案';
  dialog.visible = true;
};
const toPlanUser = (user: UserVO, role: 'APPROVER' | 'COPY', stage: StageDefinition | undefined, index: number) => ({
  localUserId: user.userId,
  participantRole: role,
  stageCode: role === 'COPY' ? 'COPY' : stage?.code,
  stageName: role === 'COPY' ? '抄送人员' : stage?.name,
  stageMode: role === 'COPY' ? 'SEQUENTIAL' : stage?.mode,
  sortNo: index
});
const save = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (!stageDefinitions.value.length) return modal.msgWarning('请先在流程配置中维护审批节点');
  const missing = stageDefinitions.value.find((stage) => stage.required && !userListForStage(stage.code).length);
  if (missing) return modal.msgWarning(`请配置“${missing.name}”的审批人员`);
  form.users = [
    ...stageDefinitions.value.flatMap((stage) => userListForStage(stage.code).map((user, index) => toPlanUser(user, 'APPROVER', stage, index))),
    ...copyUsers.value.map((user, index) => toPlanUser(user, 'COPY', undefined, index))
  ] as any;
  saving.value = true;
  try { await saveOaDepartmentApproval(form); modal.msgSuccess('审批方案保存成功'); dialog.visible = false; await loadList(); } finally { saving.value = false; }
};
const remove = async (row: any) => { await modal.confirm(`确认删除“${row.planName}”审批方案吗？`); await delOaDepartmentApproval(row.id); modal.msgSuccess('删除成功'); await loadList(); };
const userListForStage = (code: string) => code === 'COPY' ? copyUsers.value : (stageUsers[code] || (stageUsers[code] = []));
const activeStageUsers = computed(() => userListForStage(activeStageCode.value || 'COPY'));
const openStageSelect = (code: string) => { activeStageCode.value = code; void nextTick(() => activeStageSelectRef.value?.open()); };
const setActiveStageUsers = (users: UserVO[]) => { if (activeStageCode.value === 'COPY') copyUsers.value = users; else stageUsers[activeStageCode.value] = users; };
const removeUser = (list: UserVO[], id: string | number) => { const index = list.findIndex((item) => String(item.userId) === String(id)); if (index >= 0) list.splice(index, 1); };
const move = (list: UserVO[], index: number, offset: number) => { const next = index + offset; if (next < 0 || next >= list.length) return; [list[index], list[next]] = [list[next], list[index]]; };
const StageList = (props: { users: UserVO[]; sortable?: boolean }, context: any) => h('div', { class: 'ordered-users__list' }, props.users.length ? props.users.map((user, index) => h('div', { key: user.userId, class: 'ordered-user' }, [h('span', { class: 'ordered-user__index' }, String(index + 1)), h('span', { class: 'ordered-user__name' }, [user.nickName || user.userName || String(user.userId), user.employeeNo ? h('small', `（${user.employeeNo}）`) : null]), props.sortable ? h('span', [h('button', { class: 'el-button is-link', disabled: index === 0, onClick: () => context.emit('move', index, -1) }, '上移'), h('button', { class: 'el-button is-link', disabled: index === props.users.length - 1, onClick: () => context.emit('move', index, 1) }, '下移')]) : null, h('button', { class: 'el-button is-link is-text', onClick: () => context.emit('remove', user.userId) }, '移除')])) : h('span', { class: 'form-tip' }, '可不配置'));
onMounted(async () => { await Promise.all([loadConfigs(), loadBusinessTypes(), loadList()]); });
</script>

<style scoped lang="scss">
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0 0 14px; }
.toolbar__hint, .form-tip { color: var(--el-text-color-secondary); font-size: 12px; }
.organization-selected { display: inline-flex; align-items: center; gap: 5px; margin-top: 7px; color: var(--el-color-primary); font-size: 12px; }
.approval-plan-dialog :deep(.el-dialog__body) { padding: 0 22px 8px; background: var(--el-bg-color-page); }
.approval-plan-dialog :deep(.el-dialog__footer) { padding: 14px 22px 18px; border-top: 1px solid var(--el-border-color-lighter); background: var(--el-bg-color); }
.approval-plan-intro { display: flex; align-items: center; gap: 12px; margin: 0 0 14px; padding: 14px 16px; border: 1px solid var(--el-color-primary-light-7); border-radius: 12px; background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-bg-color)); }
.approval-plan-intro__icon { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; color: var(--el-color-primary); background: var(--el-color-primary-light-8); font-size: 18px; }
.approval-plan-intro strong { display: block; color: var(--el-text-color-primary); font-size: 14px; }
.approval-plan-intro p { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
.approval-plan-intro .el-tag { margin-left: auto; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.approval-plan-form { padding: 2px 1px 0; }
.form-section { margin-bottom: 14px; padding: 18px 18px 4px; border: 1px solid var(--el-border-color-lighter); border-radius: 14px; background: var(--el-bg-color); box-shadow: 0 5px 18px rgba(31, 53, 82, .04); }
.form-section--people { padding-bottom: 18px; }
.form-section--remark { padding-bottom: 0; }
.form-section__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.form-section__heading { display: flex; align-items: flex-start; gap: 10px; }
.form-section__index { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; border-radius: 9px; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 11px; font-weight: 700; }
.form-section__heading h3 { margin: 0; color: var(--el-text-color-primary); font-size: 15px; line-height: 27px; }
.form-section__heading p { margin: 3px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
.form-section__hint { color: var(--el-text-color-secondary); font-size: 12px; }
.form-section__hint i { color: var(--el-color-danger); font-style: normal; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 18px; }
.form-grid__full { grid-column: 1 / -1; }
.form-section :deep(.el-form-item) { margin-bottom: 16px; }
.form-section :deep(.el-form-item__label) { height: 24px; padding: 0; color: var(--el-text-color-regular); font-size: 13px; font-weight: 600; line-height: 24px; }
.form-section :deep(.el-form-item__content) { display: block; line-height: normal; }
.form-tip { display: block; margin-top: 6px; line-height: 1.5; }
.section-alert { margin-bottom: 14px; }
.stage-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.stage-card { min-width: 0; padding: 14px; border: 1px solid var(--el-border-color-light); border-radius: 12px; background: var(--el-fill-color-lighter); }
.stage-card--copy { border-style: dashed; }
.stage-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.stage-card__head > div { min-width: 0; }
.stage-card__head strong { display: block; color: var(--el-text-color-primary); font-size: 13px; }
.stage-card__head > div > span { display: block; margin-top: 3px; color: var(--el-text-color-secondary); font-size: 11px; line-height: 1.3; letter-spacing: .04em; }
.stage-card__head > .el-tag { flex: 0 0 auto; margin-top: 0; align-self: flex-start; line-height: 20px; }
.stage-card__meta { min-height: 18px; margin: 10px 0; color: var(--el-text-color-secondary); font-size: 12px; }
.ordered-users { width: 100%; border: 1px solid var(--el-border-color-light); border-radius: 4px; padding: 10px; }
.ordered-users__toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; color: var(--el-text-color-secondary); font-size: 12px; }
.ordered-users__list { display: flex; flex-direction: column; gap: 6px; }
.ordered-user { display: flex; align-items: center; min-height: 34px; padding: 4px 8px; border: 1px solid var(--el-border-color-lighter); background: var(--el-bg-color); border-radius: 8px; }
.ordered-user__index { width: 24px; color: var(--el-color-primary); font-size: 12px; font-weight: 600; }
.ordered-user__name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ordered-user__name small { color: var(--el-text-color-secondary); }
.policy-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
.policy-field { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 62px; padding: 12px 14px; border: 1px solid var(--el-border-color-light); border-radius: 11px; background: var(--el-fill-color-lighter); }
.policy-field strong, .policy-field span { display: block; }
.policy-field strong { color: var(--el-text-color-primary); font-size: 13px; }
.policy-field span { margin-top: 5px; color: var(--el-text-color-secondary); font-size: 11px; }
.policy-field .el-input-number { width: 120px; }
.advanced-section { margin: 12px 0 0; border: 1px solid var(--el-border-color-light); border-radius: 12px; background: var(--el-fill-color-lighter); overflow: hidden; }
.advanced-collapse { border: 0; }
.advanced-collapse :deep(.el-collapse-item__header) { height: 62px; padding: 0 18px; border: 0; color: var(--el-text-color-primary); background: transparent; }
.advanced-collapse :deep(.el-collapse-item__wrap) { border: 0; background: transparent; }
.advanced-collapse :deep(.el-collapse-item__content) { padding: 0 18px 18px; }
.advanced-title { display: flex; align-items: center; gap: 10px; }
.advanced-title__icon { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; color: var(--el-color-warning); background: var(--el-color-warning-light-9); }
.advanced-title > div { display: flex; min-width: 0; flex-direction: column; justify-content: center; line-height: 1.3; }
.advanced-title > div > strong { display: block; font-size: 14px; line-height: 1.35; }
.advanced-title > div > span { display: block; margin-top: 3px; color: var(--el-text-color-secondary); font-size: 11px; font-weight: 400; line-height: 1.3; }
.advanced-content { padding: 14px; border: 1px solid var(--el-border-color-light); border-radius: 10px; background: var(--el-fill-color-lighter); }
.advanced-content__tip { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 10px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }
.advanced-content__tip .el-icon { flex: 0 0 auto; margin-top: 2px; color: var(--el-color-primary); }
.approval-plan-panel :deep(.el-empty) { padding: 10px 0; }
@media (max-width: 720px) {
  .approval-plan-dialog :deep(.el-dialog__body) { padding: 0 14px 6px; }
  .approval-plan-intro { align-items: flex-start; flex-wrap: wrap; }
  .approval-plan-intro .el-tag { width: 100%; margin-left: 48px; }
  .form-grid, .stage-grid, .policy-grid { grid-template-columns: 1fr; }
  .form-grid__full { grid-column: auto; }
}
</style>

<style lang="scss">
/*
 * el-dialog 使用 append-to-body 后会脱离审批中心页面根节点，页面级暗色覆盖无法命中。
 * 这里单独补充弹窗主题，避免深色模式下出现黑色输入框、白色内容区或对比度不足的问题。
 */
.approval-plan-dialog.el-dialog {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 40px);
  overflow: hidden;
}

.approval-plan-dialog .el-dialog__body {
  min-height: 0;
  overflow-y: auto;
}

html.dark .approval-plan-dialog.el-dialog {
  --approval-dialog-bg: #111b2d;
  --approval-dialog-panel: #162238;
  --approval-dialog-panel-soft: #1b2a40;
  --approval-dialog-input: #0f192b;
  --approval-dialog-line: rgba(100, 116, 139, .55);
  --approval-dialog-line-soft: rgba(100, 116, 139, .34);
  --approval-dialog-text: #e7eef9;
  --approval-dialog-muted: #91a4bf;
  border: 1px solid rgba(100, 116, 139, .58);
  background: var(--approval-dialog-bg);
  color: var(--approval-dialog-text);
  box-shadow: 0 24px 70px rgba(2, 6, 23, .62);
}

html.dark .approval-plan-dialog .el-dialog__header,
html.dark .approval-plan-dialog .el-dialog__footer {
  background: #182338;
  border-color: var(--approval-dialog-line-soft);
}

html.dark .approval-plan-dialog .el-dialog__header {
  margin-right: 0;
  padding: 18px 22px 16px;
}

html.dark .approval-plan-dialog .el-dialog__title,
html.dark .approval-plan-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--approval-dialog-text);
}

html.dark .approval-plan-dialog .el-dialog__headerbtn {
  top: 16px;
  right: 18px;
}

html.dark .approval-plan-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: #8cc8ff;
}

html.dark .approval-plan-dialog .el-dialog__body {
  background: var(--approval-dialog-bg);
  color: var(--approval-dialog-text);
  scrollbar-color: #405674 transparent;
}

html.dark .approval-plan-dialog .el-dialog__body::-webkit-scrollbar {
  width: 8px;
}

html.dark .approval-plan-dialog .el-dialog__body::-webkit-scrollbar-thumb {
  border: 2px solid var(--approval-dialog-bg);
  border-radius: 999px;
  background: #405674;
}

html.dark .approval-plan-dialog .approval-plan-intro {
  border-color: rgba(76, 168, 240, .34);
  background: linear-gradient(135deg, #18314f, #162238);
}

html.dark .approval-plan-dialog .approval-plan-intro__icon,
html.dark .approval-plan-dialog .form-section__index {
  background: rgba(76, 168, 240, .16);
  color: #8cc8ff;
}

html.dark .approval-plan-dialog .approval-plan-intro strong,
html.dark .approval-plan-dialog .form-section__heading h3,
html.dark .approval-plan-dialog .policy-field strong,
html.dark .approval-plan-dialog .stage-card__head strong,
html.dark .approval-plan-dialog .advanced-title strong {
  color: var(--approval-dialog-text);
}

html.dark .approval-plan-dialog .organization-selected {
  color: #8cc8ff;
}

html.dark .approval-plan-dialog .approval-plan-intro p,
html.dark .approval-plan-dialog .form-section__heading p,
html.dark .approval-plan-dialog .form-section__hint,
html.dark .approval-plan-dialog .form-tip,
html.dark .approval-plan-dialog .stage-card__head > div > span,
html.dark .approval-plan-dialog .stage-card__meta,
html.dark .approval-plan-dialog .ordered-users__toolbar,
html.dark .approval-plan-dialog .policy-field span,
html.dark .approval-plan-dialog .advanced-title > div > span,
html.dark .approval-plan-dialog .advanced-content__tip {
  color: var(--approval-dialog-muted);
}

html.dark .approval-plan-dialog .form-section {
  border-color: var(--approval-dialog-line-soft);
  background: var(--approval-dialog-panel);
  box-shadow: 0 8px 24px rgba(2, 6, 23, .18);
}

html.dark .approval-plan-dialog .stage-card,
html.dark .approval-plan-dialog .policy-field,
html.dark .approval-plan-dialog .advanced-content {
  border-color: var(--approval-dialog-line-soft);
  background: var(--approval-dialog-panel-soft);
}

html.dark .approval-plan-dialog .stage-card--copy {
  border-color: rgba(148, 163, 184, .42);
}

html.dark .approval-plan-dialog .ordered-user {
  border-color: var(--approval-dialog-line-soft);
  background: var(--approval-dialog-input);
  color: var(--approval-dialog-text);
}

html.dark .approval-plan-dialog .advanced-section {
  border-color: var(--approval-dialog-line);
  background: var(--approval-dialog-panel-soft);
}

html.dark .approval-plan-dialog .advanced-collapse .el-collapse-item__header,
html.dark .approval-plan-dialog .advanced-collapse .el-collapse-item__wrap {
  border-color: transparent;
  background: transparent;
  color: var(--approval-dialog-text);
}

html.dark .approval-plan-dialog .advanced-collapse .el-collapse-item__header:hover {
  background: rgba(76, 168, 240, .08);
}

html.dark .approval-plan-dialog .advanced-title__icon {
  background: rgba(230, 162, 60, .16);
  color: #f3c477;
}

html.dark .approval-plan-dialog .advanced-content__tip .el-icon {
  color: #8cc8ff;
}

html.dark .approval-plan-dialog .el-form-item__label {
  color: #cbd8ea;
}

html.dark .approval-plan-dialog .el-input__wrapper,
html.dark .approval-plan-dialog .el-select__wrapper,
html.dark .approval-plan-dialog .el-input-number,
html.dark .approval-plan-dialog .el-textarea__inner {
  border-color: var(--approval-dialog-line);
  background: var(--approval-dialog-input);
  box-shadow: 0 0 0 1px rgba(100, 116, 139, .18) inset;
}

html.dark .approval-plan-dialog .el-input__wrapper:hover,
html.dark .approval-plan-dialog .el-select__wrapper:hover,
html.dark .approval-plan-dialog .el-input-number:hover,
html.dark .approval-plan-dialog .el-textarea__inner:hover,
html.dark .approval-plan-dialog .el-input__wrapper.is-focus,
html.dark .approval-plan-dialog .el-select__wrapper.is-focused,
html.dark .approval-plan-dialog .el-textarea__inner:focus {
  border-color: rgba(76, 168, 240, .8);
  box-shadow: 0 0 0 1px rgba(76, 168, 240, .24) inset;
}

html.dark .approval-plan-dialog .el-input__inner,
html.dark .approval-plan-dialog .el-textarea__inner,
html.dark .approval-plan-dialog .el-select__selected-item,
html.dark .approval-plan-dialog .el-select__placeholder,
html.dark .approval-plan-dialog .el-input-number__decrease,
html.dark .approval-plan-dialog .el-input-number__increase {
  color: var(--approval-dialog-text);
}

html.dark .approval-plan-dialog .el-input__inner::placeholder,
html.dark .approval-plan-dialog .el-textarea__inner::placeholder,
html.dark .approval-plan-dialog .el-select__placeholder {
  color: #71839d;
}

html.dark .approval-plan-dialog .section-alert {
  border-color: rgba(230, 162, 60, .32);
  background: rgba(230, 162, 60, .12);
}

html.dark .approval-plan-dialog .section-alert .el-alert__title,
html.dark .approval-plan-dialog .section-alert .el-alert__icon {
  color: #f3c477;
}

html.dark .approval-plan-dialog .el-dialog__footer {
  padding: 14px 22px 18px;
}

html.dark .approval-plan-dialog-popper {
  border-color: rgba(100, 116, 139, .58);
  background: #162238;
  box-shadow: 0 12px 30px rgba(2, 6, 23, .48);
}

html.dark .approval-plan-dialog-popper .el-select-dropdown__item,
html.dark .approval-plan-dialog-popper .el-tree-node__content {
  color: #cbd8ea;
}

html.dark .approval-plan-dialog-popper .el-select-dropdown__item.hover,
html.dark .approval-plan-dialog-popper .el-select-dropdown__item:hover,
html.dark .approval-plan-dialog-popper .el-tree-node__content:hover,
html.dark .approval-plan-dialog-popper .el-tree-node.is-current > .el-tree-node__content {
  background: rgba(76, 168, 240, .14);
  color: #e7eef9;
}

html.dark .approval-plan-dialog-popper .el-select-dropdown__empty,
html.dark .approval-plan-dialog-popper .el-tree__empty-text {
  color: #91a4bf;
}

@media (max-width: 720px) {
  html.dark .approval-plan-dialog.el-dialog {
    width: calc(100vw - 24px) !important;
  }
}
</style>
