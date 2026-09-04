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
          <span>科室来源于系统部门。泛微组织调整后，如原部门失效，可使用“迁移”将科室配置和业务数据转到新的有效部门。</span>
      </div>
    </el-card>

    <el-card shadow="never" class="filter-card mt-2">
      <el-form :model="queryParams" :inline="true" class="query-form" @submit.prevent>
        <el-form-item label="部门/科室名称">
          <el-input v-model="queryParams.deptName" clearable placeholder="请输入中文或印尼语名称" @keyup.enter="handleQuery" />
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

      <DepartmentDataTable v-loading="loading" class="config-table" :data="configList" row-key="deptId">
          <el-table-column label="系统部门" prop="deptName" min-width="280" show-overflow-tooltip>
            <template #default="scope">
              <div class="dept-name-cell">
                <span class="dept-name-cell__icon"><el-icon><OfficeBuilding /></el-icon></span>
                <span class="dept-name-cell__name" :title="scope.row.deptName || '原系统部门已失效'">{{ scope.row.deptName || '原系统部门已失效' }}</span>
                <el-tag v-if="scope.row.systemDeptAvailable === false" type="warning" effect="light">待迁移</el-tag>
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
        <el-table-column label="操作" fixed="right" width="220" align="center">
          <template #default="scope">
            <DepartmentTableActions>
              <el-button v-if="scope.row.systemDeptAvailable !== false" v-hasPermi="['department:department:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">编辑</el-button>
            <el-button
              v-if="scope.row.systemDeptAvailable === false"
              v-hasPermi="['department:department:edit']"
              link
              type="warning"
              icon="Right"
              @click="handleMigrate(scope.row)"
            >迁移</el-button>
            <el-button
              v-if="scope.row.status === 'ENABLED' && scope.row.systemDeptAvailable !== false"
              v-hasPermi="['department:department:remove']"
              link
              type="danger"
              icon="SwitchButton"
              @click="handleDisable(scope.row)"
              >停用</el-button>
            </DepartmentTableActions>
          </template>
        </el-table-column>
      </DepartmentDataTable>

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
          <DeptTreeSelect
            v-model="form.deptId"
            :data="deptOptions"
            :tree-props="deptTreeProps"
            :disabled="dialog.edit"
            filterable
            remote
            :remote-method="searchAvailableDepartments"
            :loading="deptSearchLoading"
            lazy
            :load="loadDepartmentChildren"
            no-data-text="暂无可选部门"
            no-match-text="未找到匹配的部门"
            check-strictly
            clearable
            :render-after-expand="false"
            :placeholder="dialog.edit ? '系统部门不可更换' : '选择组织部门或输入名称搜索'"
            @change="handleDeptSelectionChange"
          />
          <div v-if="selectedDeptPath" class="dept-selected-summary">
            <span class="dept-selected-summary__label">已选择</span>
            <span class="dept-selected-summary__path">{{ selectedDeptPath }}</span>
          </div>
          <div v-else-if="!dialog.edit" class="form-help">可直接点击输入框浏览组织树，也可输入名称搜索；已配置科室的部门不可重复选择。</div>
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

    <el-dialog v-model="migrationDialog.visible" title="迁移科室配置" width="620px" append-to-body class="department-config-dialog">
      <el-alert
        title="迁移前请确认目标部门"
        description="迁移会保留科室配置，并将人员服务关系、日报、休假、任务、资料、工单和其他业务数据统一转到目标部门。目标部门必须是泛微同步后的有效部门，已有科室配置或存在重复数据时不会执行。"
        type="warning"
        show-icon
        :closable="false"
        class="dialog-notice"
      />
      <div class="migration-path">
        <span class="migration-path__label">原科室</span>
        <span class="migration-path__value">{{ migrationSourceName || '原系统部门已失效' }}</span>
        <el-icon><ArrowRight /></el-icon>
        <span class="migration-path__label">目标部门</span>
      </div>
      <el-form label-width="92px" class="config-form">
        <el-form-item label="目标部门" required>
          <DeptTreeSelect
            v-model="migrationForm.targetDeptId"
            :data="deptOptions"
            :tree-props="deptTreeProps"
            filterable
            remote
            :remote-method="searchAvailableDepartments"
            :loading="deptSearchLoading"
            lazy
            :load="loadDepartmentChildren"
            no-data-text="暂无可选部门"
            no-match-text="未找到匹配的部门"
            check-strictly
            clearable
            :render-after-expand="false"
            placeholder="浏览组织树或输入名称搜索并选择目标部门"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :loading="migrationLoading" type="primary" @click="submitMigration">确认迁移</el-button>
        <el-button @click="migrationDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentConfig" lang="ts">
import { ArrowRight, InfoFilled, OfficeBuilding } from '@element-plus/icons-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { addDepartmentConfig, disableDepartmentConfig, getDepartmentConfig, listAvailableDepartments, listDepartmentConfig, listOrganizationDepartmentChildren, migrateDepartmentConfig, updateDepartmentConfig } from '@/api/department/config';
import type { DepartmentConfigForm, DepartmentConfigMigrationForm, DepartmentConfigQuery, DepartmentConfigVO } from '@/api/department/config/types';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import DeptTreeSelect from '@/components/DeptTreeSelect/index.vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';

interface DeptSearchOption {
  id: number | string;
  label: string;
  path: string;
  disabled?: boolean;
  hasChildren?: boolean;
  children: DeptSearchOption[];
}

const { loading, withLoading } = useLoading(true);
const configList = ref<DepartmentConfigVO[]>([]);
const deptOptions = ref<DeptSearchOption[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const deptSearchLoading = ref(false);
const deptSearchRequestId = ref(0);
const queryParams = reactive<DepartmentConfigQuery>({ pageNum: 1, pageSize: 10, deptName: undefined, status: undefined });
const form = reactive<DepartmentConfigForm>({ deptId: undefined, status: 'ENABLED', sortNum: 0, remark: undefined });
const dialog = reactive({ visible: false, title: '', edit: false });
const migrationDialog = reactive({ visible: false });
const migrationLoading = ref(false);
const migrationSourceName = ref('');
const migrationForm = reactive<DepartmentConfigMigrationForm>({ sourceDeptId: '', targetDeptId: '' });
const rules = { deptId: [{ required: true, message: '请选择系统部门', trigger: 'change' }] };
const deptTreeProps = { value: 'id', label: 'path', children: 'children', disabled: 'disabled' };

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
  formRef.value?.resetFields();
};

const selectedDeptPath = computed(() => {
  const selected = deptOptions.value.find(item => String(item.id) === String(form.deptId));
  return selected?.path || form.deptName || '';
});

const toDeptSearchOptions = (items: DepartmentConfigVO[]): DeptSearchOption[] =>
  items
    .filter(item => item.deptId !== undefined && item.deptId !== null && item.deptName)
    .map(item => ({
      id: item.deptId,
      label: item.deptName as string,
      path: item.deptName as string,
      disabled: item.selectable === false,
      hasChildren: item.hasChildren === true,
      children: []
    }));

const loadDepartmentRoots = async (requestId = deptSearchRequestId.value) => {
  deptSearchLoading.value = true;
  try {
    const res = await listOrganizationDepartmentChildren(0);
    if (requestId === deptSearchRequestId.value) {
      deptOptions.value = toDeptSearchOptions(res.data || []);
    }
  } finally {
    if (requestId === deptSearchRequestId.value) {
      deptSearchLoading.value = false;
    }
  }
};

const loadDepartmentChildren = async (node: { data?: DeptSearchOption }, resolve: (data: DeptSearchOption[]) => void) => {
  const parentId = node.data?.id;
  if (parentId === undefined || parentId === null || parentId === '') {
    resolve([]);
    return;
  }
  try {
    const res = await listOrganizationDepartmentChildren(parentId);
    resolve(toDeptSearchOptions(res.data || []));
  } catch {
    resolve([]);
  }
};

const searchAvailableDepartments = async (keyword: string) => {
  const normalizedKeyword = String(keyword || '').trim();
  const requestId = ++deptSearchRequestId.value;
  if (!normalizedKeyword) {
    await loadDepartmentRoots(requestId);
    return;
  }

  deptSearchLoading.value = true;
  try {
    const res = await listAvailableDepartments({ deptName: normalizedKeyword });
    if (requestId === deptSearchRequestId.value) {
      deptOptions.value = toDeptSearchOptions(res.data || []);
    }
  } finally {
    if (requestId === deptSearchRequestId.value) {
      deptSearchLoading.value = false;
    }
  }
};

const handleDeptSelectionChange = (value: number | string | undefined | null) => {
  const selected = deptOptions.value.find(item => String(item.id) === String(value));
  form.deptName = selected?.path || undefined;
};

const handleAdd = async () => {
  resetForm();
  deptSearchRequestId.value++;
  deptOptions.value = [];
  deptSearchLoading.value = false;
  dialog.title = '新增科室';
  dialog.edit = false;
  dialog.visible = true;
  void loadDepartmentRoots();
};

const handleUpdate = async (row: DepartmentConfigVO) => {
  resetForm();
  const res = await getDepartmentConfig(row.deptId);
  Object.assign(form, { ...res.data, id: res.data?.deptId });
  deptSearchLoading.value = false;
  deptOptions.value = res.data?.deptId && res.data?.deptName
    ? [{ id: res.data.deptId, label: res.data.deptName, path: res.data.deptName, children: [] }]
    : [];
  dialog.title = '编辑科室';
  dialog.edit = true;
  dialog.visible = true;
};

const handleMigrate = async (row: DepartmentConfigVO) => {
  deptSearchRequestId.value++;
  deptOptions.value = [];
  deptSearchLoading.value = false;
  migrationSourceName.value = row.deptName || '原系统部门已失效';
  migrationForm.sourceDeptId = row.deptId;
  migrationForm.targetDeptId = '';
  migrationDialog.visible = true;
  void loadDepartmentRoots();
};

const submitMigration = async () => {
  if (!migrationForm.targetDeptId) return modal.msgWarning('请选择目标部门');
  await modal.confirm(`确认将“${migrationSourceName.value}”的科室配置和业务数据迁移到所选部门吗？`);
  migrationLoading.value = true;
  try {
    await migrateDepartmentConfig(migrationForm);
    modal.msgSuccess('科室配置及业务数据迁移成功');
    migrationDialog.visible = false;
    await getList();
  } finally {
    migrationLoading.value = false;
  }
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

.dept-name-cell :deep(.el-tag) {
  flex: none;
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

.migration-path {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: -4px 0 22px;
  padding: 11px 13px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.migration-path .el-icon {
  color: var(--el-color-warning);
}

.migration-path__label {
  color: var(--el-text-color-secondary);
}

.migration-path__value {
  max-width: 220px;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
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
