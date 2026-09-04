<template>
  <div>
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="min(1180px, 94vw)"
      append-to-body
      class="user-select-dialog"
    >
      <div class="p-2 user-select-shell">
        <el-row :gutter="12" class="selector-layout">
          <!-- 泛微同步组织树 -->
          <el-col
            v-if="!prop.hideDeptTree"
            :lg="5"
            :xs="24"
            class="tree-panel-col"
          >
            <el-card
              shadow="hover"
              class="side-panel tree-panel-shell selector-card selector-side-card"
            >
              <template #header>
                <div class="panel-heading tree-panel-header">
                  <div class="table-heading tree-panel-title">
                    <span class="tree-panel-title-icon"><el-icon><OfficeBuilding /></el-icon></span>
                    <div>
                      <h3>组织结构</h3>
                      <span class="selector-heading-caption">按组织筛选人员</span>
                    </div>
                  </div>
                  <el-tag size="small" effect="plain" type="info">组织</el-tag>
                </div>
              </template>
              <div class="tree-panel-body">
                <div class="selector-side-hint">选择组织后显示该组织及下级人员</div>
                <el-input
                  v-model="deptName"
                  class="selector-dept-input"
                  placeholder="搜索组织名称"
                  prefix-icon="Search"
                  clearable
                  @keyup.enter="searchDepartments"
                  @clear="resetDepartmentSearch"
                />
                <div class="tree-panel-meta">
                  <span>组织架构</span>
                  <span v-if="deptSearchMode">搜索结果</span>
                  <span v-else>可展开查看下级</span>
                </div>
                <el-tree
                  ref="deptTreeRef"
                  class="selector-tree"
                  node-key="id"
                  :data="deptOptions"
                  v-loading="deptLoading"
                  :props="deptTreeProps"
                  lazy
                  :load="loadDeptNode"
                  :render-after-expand="true"
                  :expand-on-click-node="false"
                  highlight-current
                  @node-click="handleNodeClick"
                />
              </div>
            </el-card>
          </el-col>
          <el-col
            :lg="prop.hideDeptTree ? 24 : 19"
            :xs="24"
            class="tree-content-col"
          >
            <div class="p-2 user-select-main">
              <transition
                :enter-active-class="animateConfig.searchAnimate.enter"
                :leave-active-class="animateConfig.searchAnimate.leave"
              >
                <div v-show="showSearch">
                  <el-card shadow="hover" class="search-panel selector-card">
                    <div class="selector-filter-heading">
                      <div class="table-heading">
                        <h3>筛选人员</h3>
                        <span class="selector-heading-caption">按筛选条件检索本地用户</span>
                      </div>
                      <el-tag size="small" effect="plain" type="info">本地用户</el-tag>
                    </div>
                    <el-form ref="queryFormRef" :model="queryParams" class="query-form">
                      <el-form-item v-for="field in userFilterFields" :key="field.key" :label="field.label" :prop="field.key">
                        <el-select v-if="field.key === 'status'" v-model="queryParams[field.key]" clearable :placeholder="field.placeholder">
                          <el-option v-for="item in sys_normal_disable" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                        <el-input
                          v-else
                          v-model="queryParams[field.key]"
                          :placeholder="field.placeholder"
                          clearable
                          @keyup.enter="handleQuery"
                        />
                      </el-form-item>
                      <el-form-item class="query-actions">
                        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
                        <el-button icon="Refresh" @click="() => resetQuery()">重置</el-button>
                      </el-form-item>
                    </el-form>
                  </el-card>
                </div>
              </transition>

              <el-card shadow="hover" class="table-panel selector-card">
                <template #header>
                  <div class="toolbar-shell selector-header">
                    <div class="table-heading selector-list-heading">
                      <span class="table-heading-icon"><el-icon><User /></el-icon></span>
                      <h3>用户列表</h3>
                      <span class="selector-heading-caption">仅显示已同步到本系统的泛微用户</span>
                    </div>
                    <div v-if="prop.multiple && selectUserList.length" class="selector-selection-count">
                      已选 {{ selectUserList.length }} 人
                    </div>
                  </div>
                </template>

                <div v-if="prop.multiple && selectUserList.length" class="selector-selected-bar">
                  <span class="selector-selected-label">已选人员</span>
                  <div class="selector-tags">
                    <el-tag v-for="user in selectUserList" :key="user.userId" closable @close="handleCloseTag(user)">
                      {{ user.nickName }}<span v-if="user.employeeNo"> · {{ user.employeeNo }}</span>
                    </el-tag>
                  </div>
                </div>

                <vxe-table
                  ref="tableRef"
                  class="selector-table"
                  :height="tableHeight"
                  border
                  show-overflow
                  auto-resize
                  :data="userList"
                  :loading="loading"
                  :row-config="{ keyField: 'userId', isHover: true }"
                  :checkbox-config="{
                    reserve: true,
                    trigger: 'row',
                    highlight: true,
                    showHeader: prop.multiple
                  }"
                  @checkbox-all="handleCheckboxAll"
                  @checkbox-change="handleCheckboxChange"
                >
                  <vxe-column type="checkbox" width="50" align="center" />
                  <vxe-column key="employeeNo" title="工号" align="center" field="employeeNo" width="140" />
                  <vxe-column key="nickName" title="姓名" align="center" field="nickName" min-width="140" />
                  <vxe-column key="deptName" title="所属组织" align="center" field="deptName" min-width="190" show-overflow />
                  <vxe-column key="phoneNumber" title="手机号码" align="center" field="phoneNumber" width="140" />
                  <vxe-column key="status" title="状态" align="center" width="88">
                    <template #default="scope">
                      <dict-tag :options="sys_normal_disable" :value="scope.row.status"></dict-tag>
                    </template>
                  </vxe-column>
                </vxe-table>

                <el-alert
                  v-if="!hasSearched && !loading && selectUserList.length === 0"
                  title="请先选择组织，或输入筛选条件后搜索"
                  type="info"
                  :closable="false"
                  class="selector-empty-hint"
                />

                <pagination
                  v-show="total > 0"
                  v-model:page="queryParams.pageNum"
                  v-model:limit="queryParams.pageSize"
                  :total="total"
                  @pagination="pageList"
                />
              </el-card>
            </div>
          </el-col>
        </el-row>
      </div>

      <template #footer>
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="confirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { VxeTableInstance } from 'vxe-table';
import animateConfig from '@/animate';
import type { PageResult } from '@/api/types';
import type { DeptTreeVO, DeptVO } from '@/api/system/dept/types';
import api from '@/api/system/user';
import type { UserQuery, UserVO } from '@/api/system/user/types';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useDict } from '@/utils/dict';
import type { AxiosPromise } from '@/utils/api-types';

type UserFilterKey = 'userName' | 'nickName' | 'employeeNo' | 'email' | 'phoneNumber' | 'status';
type UserListLoader = (query: UserQuery) => AxiosPromise<PageResult<UserVO>>;

interface PropType {
  modelValue?: UserVO[] | UserVO | undefined;
  multiple?: boolean;
  data?: string | number | (string | number)[] | undefined;
  userIds?: string | number | (string | number)[] | undefined;
  /** 自定义用户数据源，角色授权等场景可在此注入带业务范围的分页接口。 */
  loadUsers?: UserListLoader;
  /** 筛选字段，默认保留通用人员选择器的姓名、工号、手机号。 */
  filterKeys?: UserFilterKey[];
  /** 限制为指定组织及其全部下级组织的人员；未隐藏组织树时可继续选择下级组织筛选。 */
  deptId?: string | number;
  /** 隐藏人员选择器中的组织树，避免与外部已选择的适用组织重复筛选。 */
  hideDeptTree?: boolean;
}
const prop = withDefaults(defineProps<PropType>(), {
  multiple: true,
  modelValue: undefined,
  data: undefined,
  userIds: undefined,
  filterKeys: () => ['nickName', 'employeeNo', 'phoneNumber'],
  deptId: undefined,
  hideDeptTree: false
});
const emit = defineEmits(['update:modelValue', 'confirmCallBack']);

const { sys_normal_disable } = toRefs<any>(useDict('sys_normal_disable'));

const userList = ref<UserVO[]>([]);
const loading = ref(false);
const showSearch = ref(true);
const total = ref(0);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();
const deptName = ref('');
const deptLoading = ref(false);
const deptSearchMode = ref(false);
const hasSearched = ref(false);
const deptOptions = ref<DeptTreeVO[]>([]);
const selectUserList = ref<UserVO[]>([]);
const tableHeight = computed(() => (hasSearched.value || selectUserList.value.length > 0 ? '520px' : '180px'));
const deptTreeProps = { label: 'label', children: 'children', isLeaf: 'isLeaf' };

const deptTreeRef = ref<ElTreeInstance>();
const queryFormRef = ref<ElFormInstance>();
const tableRef = ref<VxeTableInstance<UserVO>>();

const { dialog, openDialog, closeDialog } = useDialogState('选择人员');

const queryParams = ref<UserQuery>({
  pageNum: 1,
  pageSize: 10,
  userName: '',
  nickName: '',
  employeeNo: '',
  email: '',
  phoneNumber: '',
  status: '',
  deptId: '',
  roleId: '',
  userIds: ''
});

const defaultSelectUserIds = computed(() => computedIds(prop.data));
const filterDefinitions: Record<UserFilterKey, { label: string; placeholder: string }> = {
  userName: { label: '登录账号', placeholder: '请输入登录账号' },
  nickName: { label: '姓名', placeholder: '请输入姓名' },
  employeeNo: { label: '工号', placeholder: '请输入工号' },
  email: { label: '邮箱', placeholder: '请输入邮箱' },
  phoneNumber: { label: '手机号', placeholder: '请输入手机号' },
  status: { label: '状态', placeholder: '全部状态' }
};
const userFilterFields = computed(() => prop.filterKeys.map(key => ({ key, ...filterDefinitions[key] })));
const hasQueryCriteria = computed(() => {
  if (queryParams.value.deptId) return true;
  return prop.filterKeys.some(key => {
    const value = queryParams.value[key];
    return typeof value === 'string' ? Boolean(value.trim()) : value !== undefined && value !== null && value !== '';
  });
});

const confirm = () => {
  emit('update:modelValue', selectUserList.value);
  emit('confirmCallBack', selectUserList.value);
  closeDialog();
};

const computedIds = data => {
  if (data === '' || data === null || data === undefined) {
    return [];
  }
  if (data instanceof Array) {
    return data.map(item => String(item));
  } else if (typeof data === 'string') {
    return data.split(',');
  } else if (typeof data === 'number') {
    return [String(data)];
  } else {
    console.warn('<UserSelect> The data type of data should be array or string or number, but I received other');
    return [];
  }
};

const toDeptTreeNode = (item: DeptVO): DeptTreeVO => ({
  id: item.deptId ?? item.id,
  label: item.deptName,
  parentId: item.parentId,
  weight: item.orderNum,
  children: [],
  disabled: false,
  isLeaf: item.hasChildren === false
});

const buildDeptTree = (rows: DeptVO[]) => {
  const nodes = rows.map(toDeptTreeNode);
  const byId = new Map(nodes.map((item) => [String(item.id), item]));
  const roots: DeptTreeVO[] = [];
  nodes.forEach((node) => {
    const parent = byId.get(String(node.parentId));
    if (parent && String(parent.id) !== String(node.id)) parent.children.push(node);
    else roots.push(node);
  });
  const updateLeafState = (node: DeptTreeVO) => {
    node.isLeaf = node.children.length === 0;
    node.children.forEach(updateLeafState);
  };
  roots.forEach(updateLeafState);
  return roots;
};

/** 只加载根组织；下级节点由 el-tree 展开时按需获取。 */
const loadRootDepartments = async () => {
  deptLoading.value = true;
  try {
    const res = await api.deptChildren(0);
    deptOptions.value = (res.data || []).map(toDeptTreeNode);
  } finally {
    deptLoading.value = false;
  }
};

/** 懒加载直属下级组织，避免一次性渲染数万节点。 */
const loadDeptNode = async (node: any, resolve: (data: DeptTreeVO[]) => void) => {
  // Element Plus 的 lazy tree 会先为虚拟根节点调用 load。
  // 根节点需要返回已经加载的顶级组织，否则树折叠后重新挂载会显示“暂无数据”。
  if (node.level === 0) {
    resolve(deptOptions.value);
    return;
  }
  if (deptSearchMode.value) {
    resolve([]);
    return;
  }
  deptLoading.value = true;
  try {
    const res = await api.deptChildren(node.data.id);
    resolve((res.data || []).map(toDeptTreeNode));
  } finally {
    deptLoading.value = false;
  }
};

/** 远程搜索组织，只返回命中节点及其上级路径。 */
const searchDepartments = async () => {
  const keyword = deptName.value.trim();
  if (!keyword) {
    resetDepartmentSearch();
    return;
  }
  deptLoading.value = true;
  try {
    const res = await api.searchDept(keyword);
    deptSearchMode.value = true;
    deptOptions.value = buildDeptTree(res.data || []);
  } finally {
    deptLoading.value = false;
  }
};

const resetDepartmentSearch = async () => {
  deptName.value = '';
  deptSearchMode.value = false;
  await loadRootDepartments();
};

/** 查询用户列表 */
const getList = async () => {
  if (!hasQueryCriteria.value) {
    userList.value = selectUserList.value.length ? [...selectUserList.value] : [];
    total.value = 0;
    hasSearched.value = false;
    return;
  }
  loading.value = true;
  queryParams.value.userIds = prop.userIds;
  try {
    const loadUsers = prop.loadUsers || api.listUser;
    const res = await loadUsers(applyDateRange(queryParams.value));
    userList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
    await restoreSelectedRows();
  } finally {
    loading.value = false;
  }
};

const restoreSelectedRows = async () => {
  const users = userList.value.filter(item => selectUserList.value.some(user => user.userId === item.userId));
  await nextTick(() => tableRef.value?.setCheckboxRow(users, true));
};

const pageList = async () => {
  if (!hasSearched.value) return;
  await getList();
};

/** 节点单击事件 */
const handleNodeClick = (data: DeptTreeVO) => {
  queryParams.value.deptId = data.id;
  handleQuery();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  if (!hasQueryCriteria.value) {
    userList.value = selectUserList.value.length ? [...selectUserList.value] : [];
    total.value = 0;
    hasSearched.value = false;
    return;
  }
  hasSearched.value = true;
  void getList();
};
/** 重置按钮操作 */
const resetQuery = (refresh = true) => {
  resetDateRange();
  queryFormRef.value?.resetFields();
  queryParams.value.pageNum = 1;
  queryParams.value.deptId = undefined;
  deptTreeRef.value?.setCurrentKey(undefined);
  if (refresh) handleQuery();
};

const handleCheckboxChange = checked => {
  if (!prop.multiple && checked.checked) {
    tableRef.value?.setCheckboxRow(selectUserList.value, false);
    selectUserList.value = [];
  }
  const row = checked.row;
  if (checked.checked) {
    if (!selectUserList.value.some(item => String(item.userId) === String(row.userId))) {
      selectUserList.value.push(row);
    }
  } else {
    selectUserList.value = selectUserList.value.filter(item => {
      return item.userId !== row.userId;
    });
  }
};
const handleCheckboxAll = checked => {
  const rows = userList.value || [];
  if (checked.checked) {
    rows.forEach(row => {
      if (!selectUserList.value.some(item => item.userId === row.userId)) {
        selectUserList.value.push(row);
      }
    });
  } else {
    selectUserList.value = selectUserList.value.filter(item => {
      return !rows.some(row => row.userId === item.userId);
    });
  }
};

const handleCloseTag = (user: UserVO) => {
  const userId = user.userId;
  const index = selectUserList.value.findIndex(item => item.userId === userId);
  if (index < 0) return;
  const rows = selectUserList.value[index];
  tableRef.value?.setCheckboxRow(rows, false);
  selectUserList.value.splice(index, 1);
};

const initSelectUser = async () => {
  if (defaultSelectUserIds.value.length > 0) {
    const { data } = await api.optionSelect(defaultSelectUserIds.value);
    selectUserList.value = data || [];
    if (!hasSearched.value) userList.value = [...selectUserList.value];
    const users = (userList.value || []).filter(item => {
      return defaultSelectUserIds.value.includes(String(item.userId));
    });
    await nextTick(() => {
      tableRef.value?.setCheckboxRow(users, true);
    });
  }
};
const close = () => {
  closeDialog();
};

watch(
  () => dialog.visible,
  async (newValue: boolean) => {
    if (newValue) {
      selectUserList.value = [];
      userList.value = [];
      total.value = 0;
      hasSearched.value = false;
      deptSearchMode.value = false;
      deptName.value = '';
      queryParams.value.deptId = prop.deptId;
      if (!prop.hideDeptTree) await loadRootDepartments();
      await initSelectUser();
      if (prop.deptId) {
        hasSearched.value = true;
        await getList();
      }
    } else {
      tableRef.value?.clearCheckboxReserve();
      tableRef.value?.clearCheckboxRow();
      resetQuery(false);
      selectUserList.value = [];
      userList.value = [];
      total.value = 0;
      hasSearched.value = false;
    }
  }
);

defineExpose({
  open: openDialog,
  close: closeDialog
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;
@use '@/assets/styles/components/selector-dialog' as selectorDialog;

@include pageShell.collapsible-tree-layout(992px);
@include selectorDialog.shell-gap('.user-select-shell', '.user-select-main');
@include selectorDialog.card-shell;
@include selectorDialog.selector-header-tags(992px);
@include selectorDialog.dialog-body-padding('user-select-dialog');
@include selectorDialog.selector-table;

.selector-layout {
  height: 100%;
  min-height: 0;
  align-items: stretch;
}

.user-select-shell,
.user-select-main {
  min-height: 0;
}

.user-select-shell {
  height: 100%;
}

.user-select-main {
  height: 100%;
}

.selector-side-card {
  min-height: 100%;
}

.table-panel {
  min-height: 0;
}

.user-select-dialog :deep(.el-dialog__body) {
  box-sizing: border-box;
  height: calc(100vh - 200px);
  max-height: none !important;
  overflow: hidden;
}

.user-select-main .search-panel,
.user-select-main .table-panel {
  height: auto !important;
}

.table-panel :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.selector-dept-input {
  margin-bottom: 12px;
}

.selector-side-hint,
.selector-heading-caption {
  color: var(--app-text-muted, var(--el-text-color-secondary));
  font-size: 12px;
}

.selector-side-hint {
  margin: -2px 0 10px;
  line-height: 1.5;
}

.tree-panel-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.tree-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: default;
}

.tree-panel-header .table-heading {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tree-panel-header::after {
  display: none !important;
}

.tree-panel-title-icon,
.table-heading-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 10px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 17px;
}

.tree-panel-title h3,
.selector-filter-heading h3,
.selector-header h3 {
  margin: 0;
  line-height: 1.35;
}

.selector-list-heading {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.selector-list-heading h3 {
  flex: 0 0 auto;
}

.selector-list-heading .selector-heading-caption {
  display: inline;
  min-width: 0;
  margin-top: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-panel-title .selector-heading-caption,
.selector-filter-heading .selector-heading-caption,
.selector-header .selector-heading-caption {
  display: block;
  margin-top: 3px;
}

.tree-panel-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--app-text-muted, var(--el-text-color-secondary));
  font-size: 12px;
}

.selector-filter-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-surface-border, var(--el-border-color-lighter));
}

.query-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  align-items: end;
  gap: 12px;
}

.query-form :deep(.el-form-item) {
  min-width: 0;
  margin: 0;
}

.query-form :deep(.el-form-item__label) {
  flex: 0 0 auto;
  padding-right: 8px;
  color: var(--app-text-muted, var(--el-text-color-secondary));
  line-height: 32px;
  white-space: nowrap;
}

.query-form :deep(.el-form-item__content),
.query-form :deep(.el-input),
.query-form :deep(.el-select) {
  min-width: 0;
  width: 100%;
}

.query-actions :deep(.el-form-item__content) {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.selector-selection-count {
  flex: 0 0 auto;
  padding: 4px 10px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 999px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 12px;
}

.selector-selected-bar {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid var(--app-surface-border, var(--el-border-color-lighter));
  border-radius: 10px;
  background: var(--el-fill-color-light);
}

.selector-selected-label {
  flex: 0 0 auto;
  color: var(--app-text-muted, var(--el-text-color-secondary));
  font-size: 12px;
  line-height: 24px;
}

.selector-tags :deep(.el-tag) {
  max-width: 240px;
  margin: 0;
}

.selector-tags :deep(.el-tag span) {
  color: var(--el-text-color-secondary);
}

.selector-selected-bar .selector-tags {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 6px;
  max-height: 72px;
  overflow-y: auto;
}

.selector-empty-hint {
  margin-top: 10px;
  border-radius: 10px;
}

.selector-tree {
  min-height: 400px;
}

.tree-panel-shell {
  --tree-panel-max-height: min(620px, calc(100vh - 300px));
}

@media (max-width: 992px) {
  .user-select-dialog :deep(.el-dialog__body) {
    height: auto;
    max-height: calc(100vh - 200px) !important;
    overflow-y: auto;
  }

  .query-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .query-actions {
    grid-column: 1 / -1;
  }

  .selector-tree {
    min-height: 220px;
  }
}

@media (max-width: 600px) {
  .query-form {
    grid-template-columns: 1fr;
  }

  .query-actions {
    grid-column: auto;
  }

  .selector-filter-heading,
  .selector-selected-bar {
    align-items: flex-start;
  }

  .selector-selected-bar {
    flex-direction: column;
  }
}
</style>

<!-- el-dialog 使用 append-to-body 后会被 Teleport 到 body，必须用非 scoped 选择器覆盖全局弹窗滚动规则。 -->
<style lang="scss">
.user-select-dialog.el-dialog {
  max-height: calc(100vh - 40px);
  margin-top: 20px !important;
  margin-bottom: 20px !important;
  overflow: hidden;
}

.user-select-dialog.el-dialog .el-dialog__body {
  box-sizing: border-box;
  height: calc(100vh - 190px);
  max-height: none !important;
  overflow: hidden !important;
}
</style>
