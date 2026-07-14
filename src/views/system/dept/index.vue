<template>
  <div class="p-2 app-container system-dept-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
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
            <el-input
              v-model="queryParams.deptName"
              :placeholder="$t('common.placeholderInputDeptName')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.categoryCode')" prop="deptCategory">
            <el-input
              v-model="queryParams.deptCategory"
              :placeholder="$t('common.placeholderInputPostCategory')"
              clearable
              style="width: 240px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.status')" prop="status">
            <el-select v-model="queryParams.status" :placeholder="$t('common.deptStatus')" clearable>
              <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">{{ $t('common.btnSearch') }}</el-button>
            <el-button icon="Refresh" @click="resetQuery">{{ $t('common.btnReset') }}</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Department Dataset</span>
            <h3>{{ $t('common.sectionDeptList') }}</h3>
            <p>{{ $t('common.descDeptList') }}</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['system:dept:add']" type="primary" plain icon="Plus" @click="handleAdd()">
              {{ $t('common.btnAdd') }}
            </el-button>
            <el-button type="info" plain icon="Sort" @click="handleToggleExpandAll">{{ $t('common.checkboxExpandCollapse') }}</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <el-table
        ref="deptTableRef"
        v-loading="loading"
        class="data-table"
        :data="deptList"
        row-key="deptId"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="isExpandAll"
      >
        <el-table-column prop="deptName" :label="$t('common.deptName')" width="260"></el-table-column>
        <el-table-column prop="deptCategory" align="center" :label="$t('common.categoryCode')" width="200"></el-table-column>
        <el-table-column prop="orderNum" align="center" :label="$t('common.sort')" width="200"></el-table-column>
        <el-table-column prop="status" align="center" :label="$t('common.status')" width="100">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.createTime')" align="center" prop="createTime" width="200">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" align="center" :label="$t('common.operation')">
          <template #default="scope">
            <el-tooltip :content="$t('common.tooltipModify')" placement="top">
              <el-button
                v-hasPermi="['system:dept:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              />
            </el-tooltip>
            <el-tooltip :content="$t('common.tooltipAdd')" placement="top">
              <el-button
                v-hasPermi="['system:dept:add']"
                link
                type="primary"
                icon="Plus"
                @click="handleAdd(scope.row)"
              />
            </el-tooltip>
            <el-tooltip :content="$t('common.tooltipDelete')" placement="top">
              <el-button
                v-hasPermi="['system:dept:remove']"
                link
                type="primary"
                icon="Delete"
                @click="handleDelete(scope.row)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" destroy-on-close append-to-body width="600px">
      <el-form ref="deptFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col v-if="form.parentId !== 0" :span="24">
            <el-form-item :label="$t('common.parentDept')" prop="parentId">
              <el-tree-select
                id="parentId"
                v-model="form.parentId"
                :data="deptOptions"
                :props="{ value: 'deptId', label: 'deptName', children: 'children' } as any"
                value-key="deptId"
                :placeholder="$t('common.placeholderSelectParentDept')"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.deptName')" prop="deptName">
              <el-input v-model="form.deptName" :placeholder="$t('common.placeholderInputDeptName')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.categoryCode')" prop="deptCategory">
              <el-input v-model="form.deptCategory" :placeholder="$t('common.placeholderInputPostCategory')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.sort')" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.leader')" prop="leader">
              <el-select id="leader" v-model="form.leader" :placeholder="$t('common.placeholderSelectLeader')">
                <el-option
                  v-for="item in deptUserList"
                  :key="item.userId"
                  :label="item.userName"
                  :value="item.userId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.phone')" prop="phone">
              <el-input v-model="form.phone" :placeholder="$t('common.placeholderInputPhone')" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.email')" prop="email">
              <el-input v-model="form.email" :placeholder="$t('common.placeholderInputEmail')" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.deptStatus')" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">{{ $t('common.btnConfirm') }}</el-button>
          <el-button @click="cancel">{{ $t('common.btnCancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Dept" lang="ts">
import { listDept, getDept, delDept, addDept, updateDept, listDeptExcludeChild } from '@/api/system/dept';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { DeptForm, DeptQuery, DeptVO } from '@/api/system/dept/types';
import { listUserByDeptId } from '@/api/system/user';
import { UserVO } from '@/api/system/user/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTreeTableExpand } from '@/hooks/tree/useTreeTableExpand';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { handleTree, parseTime } from '@/utils/ruoyi';

interface DeptOptionsType {
  deptId: number | string;
  deptName: string;
  children: DeptOptionsType[];
}

const { sys_normal_disable } = toRefs<any>(useDict('sys_normal_disable'));

const deptList = ref<DeptVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const deptOptions = ref<DeptOptionsType[]>([]);
const deptUserList = ref<UserVO[]>([]);

const deptTableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();
const deptFormRef = ref<ElFormInstance>();
const { isExpandAll, handleToggleExpandAll } = useTreeTableExpand<DeptVO>({
  tableRef: deptTableRef,
  data: deptList
});

const initFormData: DeptForm = {
  deptId: undefined,
  parentId: undefined,
  deptName: undefined,
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

/** 查询菜单列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listDept(queryParams.value);
    const data = handleTree<DeptVO>(res.data, 'deptId');
    if (data) {
      deptList.value = data;
    }
  });
};

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
</style>
