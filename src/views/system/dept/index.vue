<template>
  <div class="p-2 app-container system-dept-page">
    <div class="search-wrap">
      <UiCard shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div>
              <span class="panel-kicker">Search Filters</span>
              <h3>{{ $t('common.sectionSearchCondition') }}</h3>
            </div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item :label="$t('common.deptName')" prop="deptName">
            <UiInput
              v-model="queryParams.deptName"
              :placeholder="$t('common.placeholderInputDeptName')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.deptCategoryCode')" prop="deptCategory">
            <UiInput
              v-model="queryParams.deptCategory"
              :placeholder="$t('common.placeholderInputPostCategory')"
              clearable
              style="width: 240px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.status')" prop="status">
            <UiSelect
              v-model="queryParams.status"
              :options="normalDisableOptions"
              :placeholder="$t('common.deptStatus')"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <UiButton type="primary" icon="Search" @click="handleQuery">{{ $t('common.btnSearch') }}</UiButton>
            <UiButton icon="Refresh" @click="resetQuery">{{ $t('common.btnReset') }}</UiButton>
          </el-form-item>
        </el-form>
      </UiCard>
    </div>

    <UiCard shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Department Dataset</span>
            <h3>{{ $t('common.sectionDeptList') }}</h3>
            <p>{{ $t('common.descDeptList') }}</p>
          </div>
          <div class="toolbar-actions">
            <UiButton v-hasPermi="['system:dept:add']" type="primary" plain icon="Plus" @click="handleAdd()">
              {{ $t('common.btnAdd') }}
            </UiButton>
            <UiButton type="info" plain icon="Sort" @click="handleToggleExpandAll">{{ $t('common.checkboxExpandCollapse') }}</UiButton>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <DepartmentDataTable
        ref="deptTableRef"
        class="data-table"
        :data="deptList"
        row-key="deptId"
        border
        :lazy="!isSearchActive"
        :load="loadDeptChildren"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="isExpandAll || isSearchActive"
        @expand-change="expandDeptHandle"
      >
        <el-table-column prop="deptName" :label="$t('common.deptName')" width="260" />
        <el-table-column prop="indonesianName" :label="$t('common.deptIndonesianName')" min-width="220" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ scope.row.indonesianName || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deptCategory" align="center" :label="$t('common.deptCategoryCode')" width="200" />
        <el-table-column prop="orderNum" align="center" :label="$t('common.sort')" width="200" />
        <el-table-column prop="status" align="center" :label="$t('common.status')" width="100">
          <template #default="scope">
            <UiTag :type="scope.row.status === '0' ? 'success' : 'danger'">
              {{ sys_normal_disable.find((item: any) => String(item.value) === String(scope.row.status))?.label || scope.row.status }}
            </UiTag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.createTime')" align="center" prop="createTime" width="200">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" :label="$t('common.operation')" width="216" class-name="small-padding fixed-width">
          <template #default="scope">
            <DepartmentTableActions>
              <UiTooltip :content="$t('common.tooltipModify')" placement="bottom">
                <UiButton
                  v-hasPermi="['system:dept:edit']"
                  link
                  type="primary"
                  icon="Edit"
                  @click="handleUpdate(scope.row)"
                />
              </UiTooltip>
              <UiTooltip :content="$t('common.tooltipAdd')" placement="bottom">
                <UiButton
                  v-hasPermi="['system:dept:add']"
                  link
                  type="primary"
                  icon="Plus"
                  @click="handleAdd(scope.row)"
                />
              </UiTooltip>
              <UiTooltip :content="$t('common.tooltipDelete')" placement="bottom">
                <UiButton
                  v-hasPermi="['system:dept:remove']"
                  link
                  type="primary"
                  icon="Delete"
                  @click="handleDelete(scope.row)"
                />
              </UiTooltip>
            </DepartmentTableActions>
          </template>
        </el-table-column>
      </DepartmentDataTable>
    </UiCard>

    <UiDialog
      v-model="dialog.visible"
      :title="dialog.title"
      append-to-body
      width="min(820px, calc(100vw - 32px))"
      class="dept-form-dialog"
    >
      <el-form ref="deptFormRef" :model="form" :rules="rules" label-width="112px" class="dept-form">
        <el-row :gutter="20">
          <el-col v-if="form.parentId !== 0" :span="24">
            <el-form-item :label="$t('common.parentDept')" prop="parentId">
              <DeptTreeSelect
                id="parentId"
                v-model="form.parentId"
                :data="deptOptions"
                :tree-props="{ value: 'deptId', label: 'deptName', children: 'children' }"
                :placeholder="$t('common.placeholderSelectParentDept')"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.deptName')" prop="deptName">
              <UiInput v-model="form.deptName" :placeholder="$t('common.placeholderInputDeptName')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.deptIndonesianName')" prop="indonesianName">
              <UiInput
                v-model="form.indonesianName"
                :placeholder="$t('common.placeholderInputDeptIndonesianName')"
                :maxlength="100"
                show-word-limit
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.deptCategoryCode')" prop="deptCategory">
              <UiInput v-model="form.deptCategory" :placeholder="$t('common.placeholderInputPostCategory')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.sort')" prop="orderNum">
              <UiNumberInput v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.leader')" prop="leader">
              <UiSelect
                id="leader"
                v-model="form.leader"
                :options="deptUserOptions"
                :placeholder="$t('common.placeholderSelectLeader')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.phone')" prop="phone">
              <UiInput v-model="form.phone" :placeholder="$t('common.placeholderInputPhone')" :maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.email')" prop="email">
              <UiInput v-model="form.email" :placeholder="$t('common.placeholderInputEmail')" :maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.deptStatus')" prop="status">
              <UiRadioGroup v-model="form.status" :options="normalDisableOptions" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <UiButton type="primary" @click="submitForm">{{ $t('common.btnConfirm') }}</UiButton>
          <UiButton @click="cancel">{{ $t('common.btnCancel') }}</UiButton>
        </div>
      </template>
    </UiDialog>
  </div>
</template>

<script setup name="Dept" lang="ts">
import { listDept, listDeptChildren, searchDept, getDept, delDept, addDept, updateDept, listDeptExcludeChild } from '@/api/system/dept';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { DeptForm, DeptQuery, DeptVO } from '@/api/system/dept/types';
import { listUserByDeptId } from '@/api/system/user';
import { UserVO } from '@/api/system/user/types';
import DeptTreeSelect from '@/components/DeptTreeSelect/index.vue';
import { useLoading } from '@/hooks/async/useLoading';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTreeTableExpand } from '@/hooks/tree/useTreeTableExpand';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { handleTree, parseTime } from '@/utils/ruoyi';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import {
  UiButton,
  UiCard,
  UiDialog,
  UiInput,
  UiNumberInput,
  UiRadioGroup,
  UiSelect,
  UiTag,
  UiTooltip
} from '@/components/UiKit';

interface DeptOptionsType {
  deptId: number | string;
  deptName: string;
  children: DeptOptionsType[];
}

const { sys_normal_disable } = toRefs<any>(useDict('sys_normal_disable'));
const normalDisableOptions = computed(() =>
  (sys_normal_disable.value || []).map((item: any) => ({
    value: item.value,
    label: item.label
  }))
);

// 部门数据量较大，避免 Vue 首次递归代理整棵部门树。
const deptList = shallowRef<DeptVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const deptOptions = ref<DeptOptionsType[]>([]);
const deptUserList = ref<UserVO[]>([]);
const deptUserOptions = computed(() =>
  deptUserList.value.map((item) => ({
    value: item.userId,
    label: item.userName
  }))
);

type DeptTableMethods = {
  toggleRowExpansion?: (row: DeptVO, expanded?: boolean) => void;
};
const deptTableRef = ref<DeptTableMethods>();
const queryFormRef = ref<ElFormInstance>();
const deptFormRef = ref<ElFormInstance>();
const { isExpandAll, handleToggleExpandAll } = useTreeTableExpand<DeptVO>({
  tableRef: deptTableRef,
  data: deptList,
  initialExpandAll: false
});

const initFormData: DeptForm = {
  deptId: undefined,
  parentId: undefined,
  deptName: undefined,
  indonesianName: undefined,
  deptCategory: undefined,
  orderNum: 0,
  leader: undefined,
  phone: undefined,
  email: undefined,
  status: '0'
};
const initData: PageData<DeptForm, DeptQuery> = {
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptName: undefined,
    deptCategory: undefined,
    status: undefined
  },
  rules: {
    parentId: [{ required: true, message: t('common.validationDeptRequired'), trigger: 'blur' }],
    deptName: [{ required: true, message: t('common.validationPleaseInput', { field: t('common.deptName') }), trigger: 'blur' }],
    orderNum: [{ required: true, message: t('common.validationOrderNumRequired'), trigger: 'blur' }],
    email: [
      {
        type: 'email',
        message: t('common.validationInvalidEmail'),
        trigger: ['blur', 'change']
      }
    ],
    phone: [
      {
        pattern: /^1[3456789][0-9]\d{8}$/,
        message: t('common.validationInvalidPhone'),
        trigger: 'blur'
      }
    ]
  }
};
const data = reactive<PageData<DeptForm, DeptQuery>>(initData);

const { queryParams, form, rules } = toRefs<PageData<DeptForm, DeptQuery>>(data);
const { dialog, openDialog, closeDialog, setTitle } = useDialogState();
const isSearchActive = computed(
  () => {
    const status = queryParams.value.status as number | string | undefined;
    return Boolean(queryParams.value.deptName || queryParams.value.deptCategory) || (status !== undefined && status !== null && status !== '');
  }
);

/**
 * 将后端返回的命中节点及其上级路径组装为小型结果树。
 * 搜索接口已经限制命中节点数量，不能在前端再次遍历完整组织树。
 */
const buildSearchTree = (rows: DeptVO[]): DeptVO[] => {
  return handleTree<DeptVO>(
    rows.map((row) => ({ ...row, children: [] })),
    'deptId'
  );
};

/** 查询菜单列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = isSearchActive.value ? await searchDept(queryParams.value) : await listDeptChildren(0);
    deptList.value = isSearchActive.value ? buildSearchTree(res.data || []) : res.data;
  });
};

/** 懒加载部门直属子节点 */
const loadDeptChildren = async (row: any, _treeNode: unknown, resolve: (data: any[]) => void) => {
  try {
    const res = await listDeptChildren(row.deptId);
    resolve(res.data || []);
  } catch {
    resolve([]);
  }
};

/** Animal Table 与 Element Plus 统一使用 expand-change 事件；部门页无需额外同步展开状态。 */
const expandDeptHandle = (_row: DeptVO, _expandedRows: unknown) => undefined;

/** 查询当前部门的所有用户 */
async function getDeptAllUser(deptId: any) {
  if (deptId !== null && deptId !== '' && deptId !== undefined) {
    const res = await listUserByDeptId(deptId);
    deptUserList.value = res.data;
  }
}

/** 取消按钮 */
const cancel = () => {
  reset();
  closeDialog();
};
/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  deptFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
};
const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  afterReset: () => {
    handleQuery();
  }
});

/** 新增按钮操作 */
const handleAdd = async (row?: Partial<DeptVO>) => {
  reset();
  const res = await listDept();
  const data = handleTree<DeptOptionsType>(res.data, 'deptId');
  if (data) {
    deptOptions.value = data;
    if (row && row.deptId) {
      form.value.parentId = row?.deptId;
    }
    setTitle(t('common.dialogAddDept'));
    openDialog();
  }
};

/** 修改按钮操作 */
const handleUpdate = async (row: Partial<DeptVO>) => {
  reset();
  //查询当前部门所有用户
  getDeptAllUser(row.deptId);
  const res = await getDept(row.deptId);
  form.value = res.data;
  const response = await listDeptExcludeChild(row.deptId);
  const data = handleTree<DeptOptionsType>(response.data, 'deptId');
  if (data) {
    deptOptions.value = data;
    if (data.length === 0) {
      const noResultsOptions: DeptOptionsType = {
        deptId: res.data.parentId,
        deptName: res.data.parentName,
        children: []
      };
      deptOptions.value.push(noResultsOptions);
    }
  }
  setTitle(t('common.dialogEditDept'));
  openDialog();
};
/** 提交按钮 */
const submitForm = () => {
  deptFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.deptId ? await updateDept(form.value) : await addDept(form.value);
      modal.msgSuccess(t('common.msgOperateSuccess'));
      closeDialog();
      await getList();
    }
  });
};
/** 删除按钮操作 */
const handleDelete = async (row: Partial<DeptVO>) => {
  await modal.confirm(t('common.msgboxConfirmDeleteMenu', { name: row.deptName }));
  await delDept(row.deptId);
  await getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

:global(.dept-form-dialog .el-dialog__body) {
  padding: 24px 28px 12px;
}

:global(.dept-form-dialog .animal-modal__content) {
  overflow-x: hidden;
}

:global(.animal-modal:has(.dept-form) .animal-modal__content) {
  overflow-x: hidden;
}

:global(.dept-form-dialog .dept-form > .el-row) {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

:global(.animal-modal:has(.dept-form) .dept-form > .el-row) {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

:global(.dept-form-dialog .dept-form .el-col) {
  min-width: 0;
}

:global(.animal-modal:has(.dept-form) .dept-form .el-col) {
  min-width: 0;
}

:global(.dept-form-dialog .dept-form .el-form-item) {
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
}

:global(.animal-modal:has(.dept-form) .dept-form .el-form-item) {
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  align-items: center;
}

:global(.dept-form-dialog .dept-form .el-form-item__label) {
  padding-right: 14px;
  white-space: nowrap;
}

:global(.animal-modal:has(.dept-form) .dept-form .el-form-item__label) {
  padding-right: 14px;
  white-space: nowrap;
}

:global(.dept-form-dialog .dept-form .el-input),
:global(.dept-form-dialog .dept-form .el-select),
:global(.dept-form-dialog .dept-form .el-tree-select),
:global(.dept-form-dialog .dept-form .el-input-number),
:global(.dept-form-dialog .dept-form .ui-animal-input-wrap),
:global(.dept-form-dialog .dept-form .ui-animal-select),
:global(.dept-form-dialog .dept-form .ui-animal-number-input) {
  width: 100%;
  min-width: 0;
}

:global(.animal-modal:has(.dept-form) .dept-form .el-input),
:global(.animal-modal:has(.dept-form) .dept-form .el-select),
:global(.animal-modal:has(.dept-form) .dept-form .el-tree-select),
:global(.animal-modal:has(.dept-form) .dept-form .el-input-number),
:global(.animal-modal:has(.dept-form) .dept-form .ui-animal-input-wrap),
:global(.animal-modal:has(.dept-form) .dept-form .ui-animal-select),
:global(.animal-modal:has(.dept-form) .dept-form .ui-animal-number-input) {
  width: 100%;
  min-width: 0;
}

:global(.dept-form-dialog .dept-form .el-form-item__content) {
  min-width: 0;
  margin-left: 0 !important;
}

:global(.animal-modal:has(.dept-form) .dept-form .el-form-item__content) {
  min-width: 0;
  margin-left: 0 !important;
}

:global(.dept-form-dialog .dept-form .el-radio-group) {
  min-height: 32px;
  align-items: center;
}

:global(.dept-form-dialog .dept-form .el-form-item__error) {
  white-space: nowrap;
}

@media (max-width: 720px) {
  :global(.dept-form-dialog .el-dialog__body) {
    padding: 20px 18px 8px;
  }

  :global(.dept-form-dialog .dept-form .el-form-item__label) {
    padding-right: 10px;
  }
}
</style>
