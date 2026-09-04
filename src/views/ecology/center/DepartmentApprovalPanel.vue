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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="780px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="审批方式" prop="workflowConfigId">
          <el-select v-model="form.workflowConfigId" filterable placeholder="选择已配置的审批方式" style="width: 100%" @change="workflowChanged">
            <el-option v-for="item in workflowConfigs" :key="item.id" :label="`${item.formName || '泛微表单'} · ${item.approvalName || item.workflowName}`" :value="item.id" />
          </el-select>
          <span class="form-tip">审批方式：{{ selectedApprovalName }}；节点和泛微字段由流程配置统一维护。</span>
        </el-form-item>
        <el-form-item label="业务类型" prop="businessType">
          <el-select v-model="form.businessType" filterable placeholder="选择已配置的业务类型" style="width: 100%">
            <el-option v-for="item in businessTypes" :key="item.id" :label="businessTypeLabel(item)" :value="item.businessType" :disabled="item.status !== 'ENABLED' && item.businessType !== form.businessType" />
          </el-select>
          <span class="form-tip">业务类型由统一配置维护，审批方案只选择，不手工填写。</span>
        </el-form-item>
        <el-form-item label="方案名称" prop="planName"><el-input v-model="form.planName" maxlength="100" placeholder="如 财务复核" /></el-form-item>
        <el-form-item label="来源模块"><el-input v-model="form.sourceModule" maxlength="64" placeholder="可选；留空表示该业务通用方案" /></el-form-item>
        <el-form-item label="业务归属组织">
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
            :remote-method="searchOrganizations"
            :loading="organizationSearching"
            :debounce="250"
            clearable
            placeholder="输入名称模糊搜索，或展开选择组织；留空表示全组织通用"
            style="width: 100%"
            @visible-change="handleOrganizationVisibleChange"
            @change="organizationChanged"
          />
          <span class="form-tip">请从下拉组织树中选择一个组织，组织本身和下级组织均可选择；不选择则可复用于整个业务。</span>
        </el-form-item>

        <el-alert v-if="!stageDefinitions.length" title="当前审批方式还没有配置审批节点，请先到“流程配置”中维护节点字段。" type="warning" :closable="false" class="mb-3" />
        <template v-for="stage in stageDefinitions" :key="stage.code">
          <el-form-item :label="stage.name" :required="stage.required">
            <div class="ordered-users">
              <div class="ordered-users__toolbar">
                <el-button type="primary" plain @click="openStageSelect(stage.code)">选择人员</el-button>
                <span>{{ stage.mode === 'COUNTERSIGN' ? '会签节点，可多选' : '按当前顺序依次审批' }}{{ stage.required ? ' · 必填' : ' · 可不配置' }}</span>
              </div>
              <stage-list
                :users="userListForStage(stage.code)"
                :sortable="stage.mode !== 'COUNTERSIGN'"
                @move="(index, offset) => move(userListForStage(stage.code), index, offset)"
                @remove="(id) => removeUser(userListForStage(stage.code), id)"
              />
            </div>
          </el-form-item>
        </template>
        <el-form-item label="抄送人员">
          <div class="ordered-users">
            <div class="ordered-users__toolbar"><el-button plain @click="openStageSelect('COPY')">选择人员</el-button><span>可不配置，不参与审批</span></div>
            <stage-list :users="copyUsers" :sortable="false" @remove="(id) => removeUser(copyUsers, id)" />
          </div>
        </el-form-item>

        <el-row :gutter="16"><el-col :span="8"><el-form-item label="自动匹配优先级"><el-input-number v-model="form.priority" :min="0" :max="999" /></el-form-item></el-col><el-col :span="8"><el-form-item label="状态"><el-switch v-model="form.status" active-value="ENABLED" inactive-value="DISABLED" /></el-form-item></el-col></el-row>
        <el-collapse v-model="advancedOpen"><el-collapse-item name="advanced" title="高级匹配条件（管理员）"><el-alert title="留空表示该业务下的通用方案；填写后仅当申请表单字段全部匹配时自动使用。" type="info" :closable="false" class="mb-2" /><el-input v-model="form.matchConditionJson" type="textarea" :rows="4" placeholder='例如：{"settlementType":"MONTHLY"}' /></el-collapse-item></el-collapse>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" maxlength="1000" /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="saving" @click="save">保存</el-button><el-button @click="dialog.visible = false">取消</el-button></template>
    </el-dialog>

    <UserSelect ref="activeStageSelectRef" multiple :data="activeStageUsers.map((item) => item.userId)" @confirm-call-back="setActiveStageUsers" />
  </div>
</template>

<script setup lang="ts">
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
      .sort((left, right) => left.sortNo - right.sortNo);
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
const resetForm = () => { Object.assign(form, { id: undefined, workflowConfigId: undefined, businessType: '', planName: '', sourceModule: '', businessDeptId: undefined, matchConditionJson: '', priority: 0, status: 'ENABLED', remark: '', users: [] }); resetUsers(); advancedOpen.value = []; organizationTree.value = []; organizationRootTree.value = []; organizationCache.value = []; organizationLoaded.value = false; organizationSearchMode.value = false; organizationSearching.value = false; organizationRequestId++; organizationSearchRequestId++; };
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
.ordered-users { width: 100%; border: 1px solid var(--el-border-color-light); border-radius: 4px; padding: 10px; }
.ordered-users__toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; color: var(--el-text-color-secondary); font-size: 12px; }
.ordered-users__list { display: flex; flex-direction: column; gap: 6px; }
.ordered-user { display: flex; align-items: center; min-height: 34px; padding: 4px 8px; background: var(--el-fill-color-light); border-radius: 4px; }
.ordered-user__index { width: 24px; color: var(--el-color-primary); }
.ordered-user__name { flex: 1; }
.ordered-user__name small { color: var(--el-text-color-secondary); }
.approval-plan-panel :deep(.el-empty) { padding: 10px 0; }
</style>
