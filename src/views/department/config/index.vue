<template>
  <div class="p-2 app-container department-config-page">
    <el-card shadow="never" class="page-intro">
      <div class="page-intro__header">
        <div class="page-intro__title">
          <div class="page-intro__kicker">DEPARTMENT CONFIG</div>
          <h2>科室配置</h2>
          <p>将系统部门配置为业务科室，统一管理成员、任务、日报、工单和资料的数据范围。</p>
        </div>
        <el-button v-hasPermi="['department:department:add']" type="primary" icon="Plus" @click="handleAdd">新增科室</el-button>
      </div>
      <div class="page-intro__notice">
        <el-icon><InfoFilled /></el-icon>
        <span>科室来源于系统部门。启用后，部门用户会自动建立正式服务关系；临时协作人员仍需在人员档案中单独纳入。</span>
      </div>
    </el-card>

    <el-card shadow="never" class="filter-card mt-2">
      <el-form :model="queryParams" :inline="true" class="query-form" @submit.prevent>
        <el-form-item label="部门名称">
          <el-input v-model="queryParams.deptName" clearable placeholder="请输入部门名称" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option label="启用" value="ENABLED" />
            <el-option label="停用" value="DISABLED" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="list-card mt-2">
      <div class="list-card__header">
        <div>
          <div class="list-card__title">业务科室列表</div>
          <div class="list-card__description">仅展示当前权限范围内已配置的业务科室，停用不会删除历史数据。</div>
        </div>
        <div class="list-card__summary">
          <span>共 {{ total }} 个</span>
          <el-tag v-if="enabledCount > 0" type="success" effect="light">启用 {{ enabledCount }}</el-tag>
          <el-tag v-if="disabledCount > 0" type="info" effect="light">停用 {{ disabledCount }}</el-tag>
        </div>
      </div>

      <el-table v-loading="loading" class="config-table" :data="configList" row-key="deptId">
        <el-table-column label="系统部门" prop="deptName" min-width="240" show-overflow-tooltip>
          <template #default="scope">
            <div class="dept-name-cell">
              <span class="dept-name-cell__icon"><el-icon><OfficeBuilding /></el-icon></span>
              <span class="dept-name-cell__name" :title="scope.row.deptName">{{ scope.row.deptName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="服务成员" prop="memberCount" width="110" align="center">
          <template #default="scope">
            <span class="member-count">{{ scope.row.memberCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'" effect="light">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortNum" width="80" align="center" />
        <el-table-column label="备注" prop="remark" min-width="240" show-overflow-tooltip>
          <template #default="scope">
            <span class="muted-text">{{ scope.row.remark || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" prop="updateTime" width="180" />
        <el-table-column label="操作" fixed="right" width="150" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:department:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button
              v-if="scope.row.status === 'ENABLED'"
              v-hasPermi="['department:department:remove']"
              link
              type="danger"
              icon="SwitchButton"
              @click="handleDisable(scope.row)"
            >停用</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="620px" append-to-body class="department-config-dialog">
      <el-alert
        title="科室来源说明"
        description="请选择系统部门作为业务科室。用户管理中的主部门匹配后，会自动建立正式服务关系；临时协作人员仍需在人员档案中手动纳入。"
        type="info"
        show-icon
        :closable="false"
        class="dialog-notice"
      />
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px" class="config-form">
        <el-form-item label="系统部门" prop="deptId">
          <el-popover
            v-model:visible="deptPickerVisible"
            placement="bottom-start"
            :width="560"
            trigger="click"
            :persistent="false"
            popper-class="department-config-dept-popper"
            :disabled="dialog.edit"
            @show="handleDeptPickerShow"
          >
            <template #reference>
              <el-input
                :model-value="selectedDeptPath"
                :placeholder="dialog.edit ? '系统部门不可更换' : '请选择系统部门'"
                readonly
                :disabled="dialog.edit"
                class="dept-tree-input"
              >
                <template #suffix>
                  <el-icon><ArrowDown /></el-icon>
                </template>
              </el-input>
            </template>
            <div class="dept-picker-panel">
              <el-input v-model="deptSearchKeyword" placeholder="请输入部门名称" clearable class="dept-picker-search" />
              <el-tree-v2
                ref="deptTreeRef"
                :data="deptTreeVisibleOptions"
                :props="deptTreeProps"
                :height="340"
                :item-size="36"
                :default-expanded-keys="deptTreeExpandedKeys"
                :current-node-key="form.deptId"
                highlight-current
                :expand-on-click-node="false"
                empty-text="暂无可配置的系统部门"
                @node-click="handleDeptTreeNodeClick"
              >
                <template #default="{ data }">
                  <div class="dept-tree-node" :class="{ 'is-disabled': data.disabled }" :title="data.path">
                    <span class="dept-tree-node__label">{{ data.label }}</span>
                    <span v-if="data.disabled" class="dept-tree-node__hint">已配置</span>
                  </div>
                </template>
              </el-tree-v2>
            </div>
          </el-popover>
          <div v-if="selectedDeptPath" class="dept-selected-summary">
            <span class="dept-selected-summary__label">已选择</span>
            <span class="dept-selected-summary__path">{{ selectedDeptPath }}</span>
          </div>
          <div v-else-if="!dialog.edit && availableDeptTree.length === 0" class="form-help">当前没有可新增的系统部门，请先检查部门状态或已有科室配置。</div>
          <div v-else-if="dialog.edit" class="form-help">科室主键来源于系统部门，编辑时不能更换；如需变更，请停用旧科室后新增配置。</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="ENABLED">启用</el-radio>
            <el-radio label="DISABLED">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sortNum" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="补充科室用途或管理说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">保存</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentConfig" lang="ts">
import { ArrowDown, InfoFilled, OfficeBuilding } from '@element-plus/icons-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { addDepartmentConfig, disableDepartmentConfig, getDepartmentConfig, listAvailableDepartments, listDepartmentConfig, updateDepartmentConfig } from '@/api/department/config';
import type { DepartmentConfigForm, DepartmentConfigQuery, DepartmentConfigVO } from '@/api/department/config/types';
import { deptTreeSelect } from '@/api/system/user';
import type { DeptTreeVO } from '@/api/system/dept/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';

type DeptTreeOption = Omit<DeptTreeVO, 'children'> & {
  children: DeptTreeOption[];
  path: string;
};

const { loading, withLoading } = useLoading(true);
const configList = ref<DepartmentConfigVO[]>([]);
const deptOptions = ref<DeptTreeVO[]>([]);
const availableDeptTree = ref<DeptTreeOption[]>([]);
const availableDeptIds = ref<Set<string>>(new Set());
const total = ref(0);
const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const deptTreeRef = ref<{ setCurrentKey: (key: number | string | undefined) => void }>();
const deptPickerVisible = ref(false);
const deptSearchKeyword = ref('');
const queryParams = reactive<DepartmentConfigQuery>({ pageNum: 1, pageSize: 10, deptName: undefined, status: undefined });
const form = reactive<DepartmentConfigForm>({ deptId: undefined, status: 'ENABLED', sortNum: 0, remark: undefined });
const dialog = reactive({ visible: false, title: '', edit: false });
const rules = { deptId: [{ required: true, message: '请选择系统部门', trigger: 'change' }] };
const deptTreeProps = { value: 'id', label: 'label', children: 'children', disabled: 'disabled' };

const enabledCount = computed(() => configList.value.filter(item => item.status === 'ENABLED').length);
const disabledCount = computed(() => configList.value.filter(item => item.status === 'DISABLED').length);
const statusLabel = (status?: string) => (status === 'DISABLED' ? '停用' : '启用');

const getList = async () => {
  await withLoading(async () => {
    const res = await listDepartmentConfig(queryParams);
    configList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.deptName = undefined;
  queryParams.status = undefined;
  handleQuery();
};

const resetForm = () => {
  Object.assign(form, { id: undefined, deptId: undefined, deptName: undefined, status: 'ENABLED', sortNum: 0, remark: undefined });
  deptPickerVisible.value = false;
  deptSearchKeyword.value = '';
  formRef.value?.resetFields();
};

const filterAvailableDeptTree = (nodes: DeptTreeVO[], allowedIds: Set<string>, parentPath = ''): DeptTreeOption[] => {
  return nodes.reduce<DeptTreeOption[]>((result, dept) => {
    if (dept.disabled) return result;
    const path = parentPath ? `${parentPath} / ${dept.label}` : dept.label;
    const children = filterAvailableDeptTree(dept.children ?? [], allowedIds, path);
    const selectable = allowedIds.has(String(dept.id));
    if (selectable || children.length) {
      result.push({ ...dept, disabled: !selectable, path, children });
    }
    return result;
  }, []);
};

const findDeptPath = (nodes: DeptTreeVO[], deptId: number | string | null | undefined, parentPath: string[] = []): string[] => {
  if (deptId === undefined || deptId === null || deptId === '') return [];
  for (const dept of nodes) {
    const currentPath = [...parentPath, dept.label];
    if (String(dept.id) === String(deptId)) return currentPath;
    const childPath = findDeptPath(dept.children ?? [], deptId, currentPath);
    if (childPath.length) return childPath;
  }
  return [];
};

const selectedDeptPath = computed(() => findDeptPath(deptOptions.value, form.deptId).join(' / ') || form.deptName || '');
const deptTreeVisibleOptions = computed<DeptTreeOption[]>(() => {
  const keyword = deptSearchKeyword.value.trim().toLocaleLowerCase();
  if (!keyword) return availableDeptTree.value;

  const filterNodes = (nodes: DeptTreeOption[]): DeptTreeOption[] => nodes.reduce<DeptTreeOption[]>((result, node) => {
    const children = filterNodes(node.children);
    const matched = node.label.toLocaleLowerCase().includes(keyword) || node.path.toLocaleLowerCase().includes(keyword);
    if (matched || children.length) result.push({ ...node, children });
    return result;
  }, []);

  return filterNodes(availableDeptTree.value);
});
const deptTreeExpandedKeys = computed<(number | string)[]>(() => {
  const expandedKeys: (number | string)[] = [];
  const collectKeys = (nodes: DeptTreeOption[]) => nodes.forEach(node => {
    if (node.children.length) {
      expandedKeys.push(node.id);
      collectKeys(node.children);
    }
  });
  collectKeys(deptTreeVisibleOptions.value);
  return expandedKeys;
});

const loadDeptOptions = async () => {
  const [treeRes, availableRes] = await Promise.all([deptTreeSelect(), listAvailableDepartments()]);
  deptOptions.value = treeRes.data || [];
  availableDeptIds.value = new Set((availableRes.data || []).map(item => String(item.deptId)));
  availableDeptTree.value = filterAvailableDeptTree(deptOptions.value, availableDeptIds.value);
};

const handleDeptPickerShow = () => {
  deptSearchKeyword.value = '';
  deptTreeRef.value?.setCurrentKey(form.deptId);
};

const handleDeptTreeNodeClick = (data: DeptTreeOption) => {
  if (data.disabled || !availableDeptIds.value.has(String(data.id))) return;
  form.deptId = data.id;
  form.deptName = data.label;
  deptPickerVisible.value = false;
  deptSearchKeyword.value = '';
};

const handleAdd = async () => {
  resetForm();
  await loadDeptOptions();
  dialog.title = '新增科室';
  dialog.edit = false;
  dialog.visible = true;
};

const handleUpdate = async (row: DepartmentConfigVO) => {
  resetForm();
  await loadDeptOptions();
  const res = await getDepartmentConfig(row.deptId);
  Object.assign(form, { ...res.data, id: res.data?.deptId });
  dialog.title = '编辑科室';
  dialog.edit = true;
  dialog.visible = true;
};

const submitForm = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      if (dialog.edit) await updateDepartmentConfig(form);
      else await addDepartmentConfig(form);
      modal.msgSuccess('保存成功');
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleDisable = async (row: DepartmentConfigVO) => {
  await modal.confirm(`确认停用“${row.deptName}”吗？停用会结束自动纳入的正式服务关系，但不会删除历史数据。`);
  await disableDepartmentConfig(row.deptId);
  modal.msgSuccess('已停用');
  await getList();
};

onMounted(getList);
</script>

<style scoped lang="scss">
.department-config-page {
  --department-card-radius: 14px;
}

.page-intro,
.filter-card,
.list-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--department-card-radius);
}

.page-intro :deep(.el-card__body) {
  padding: 24px 26px 20px;
}

.page-intro__header,
.list-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.page-intro__title {
  min-width: 0;
}

.page-intro__kicker {
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  line-height: 1.4;
  text-transform: uppercase;
}

.page-intro h2 {
  margin: 5px 0 4px;
  color: var(--el-text-color-primary);
  font-size: 22px;
  line-height: 1.35;
}

.page-intro p,
.list-card__description {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.page-intro__notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 18px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.page-intro__notice .el-icon {
  flex: none;
  margin-top: 3px;
  color: var(--el-color-primary);
}

.filter-card :deep(.el-card__body) {
  padding: 18px 22px 2px;
}

.query-form :deep(.el-form-item) {
  margin-right: 24px;
  margin-bottom: 16px;
}

.query-form .query-actions {
  margin-right: 0;
}

.list-card :deep(.el-card__body) {
  padding: 0 22px 14px;
}

.list-card__header {
  min-height: 86px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.list-card__title {
  margin-bottom: 4px;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
}

.list-card__summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.config-table {
  margin-top: 16px;
}

.dept-name-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 9px;
}

.dept-name-cell__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.dept-name-cell__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-count {
  color: var(--el-color-primary);
  font-weight: 600;
}

.muted-text {
  color: var(--el-text-color-secondary);
}

.dialog-notice {
  margin-bottom: 22px;
}

.config-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.dept-tree-input {
  width: 100%;
}

.dept-selected-summary {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  margin-top: 8px;
  padding: 7px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 20px;
}

.dept-selected-summary__label {
  flex: none;
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.dept-selected-summary__path {
  min-width: 0;
  color: var(--el-color-primary);
  overflow-wrap: anywhere;
}

.form-help {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 7px;
}

:global(.department-config-dept-popper) {
  width: min(560px, calc(100vw - 24px));
  min-width: min(560px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  padding: 0;
}

:global(.department-config-dept-popper .dept-picker-panel) {
  padding: 12px;
}

:global(.department-config-dept-popper .dept-picker-search) {
  margin-bottom: 8px;
}

:global(.department-config-dept-popper .el-tree) {
  --el-tree-node-content-height: 36px;
  background: transparent;
}

:global(.department-config-dept-popper .el-tree-node__content) {
  box-sizing: border-box;
  height: 36px;
  border-radius: 6px;
  padding-right: 8px;
}

:global(.department-config-dept-popper .dept-tree-node) {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  height: 100%;
  gap: 8px;
}

:global(.department-config-dept-popper .dept-tree-node__label) {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.department-config-dept-popper .dept-tree-node__hint) {
  flex: none;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

:global(.department-config-dept-popper .dept-tree-node.is-disabled .dept-tree-node__label) {
  color: var(--el-text-color-placeholder);
}

@media (max-width: 700px) {
  .page-intro__header,
  .list-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-intro__header .el-button {
    align-self: stretch;
  }

  .list-card__summary {
    justify-content: flex-start;
    padding-bottom: 14px;
  }
}
</style>
