<template>
  <div class="p-2 app-container demo-demo-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div><h3>{{ $t('common.sectionSearchCondition') }}</h3></div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item :label="$t('common.key')" prop="testKey">
            <el-input v-model="queryParams.testKey" :placeholder="$t('common.placeholderInputKey')" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item :label="$t('common.value')" prop="value">
            <el-input v-model="queryParams.value" :placeholder="$t('common.placeholderInputValue')" clearable @keyup.enter="handleQuery" />
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
            <h3>{{ $t('common.testSingleList') }}</h3>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['demo:demo:add']" type="primary" plain icon="Plus" @click="handleAdd">
              {{ $t('common.btnAdd') }}
            </el-button>
            <el-button
              v-hasPermi="['demo:demo:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
            >
              {{ $t('common.btnEdit') }}
            </el-button>
            <el-button
              v-hasPermi="['demo:demo:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              {{ $t('common.btnDelete') }}
            </el-button>
            <el-button v-hasPermi="['demo:demo:export']" type="warning" plain icon="Download" @click="handleExport">
              {{ $t('common.btnExport') }}
            </el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        border
        class="data-table"
        :data="demoList"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="true" :label="$t('common.primaryKey')" align="center" prop="id" />
        <el-table-column :label="$t('common.deptId')" align="center" prop="deptId" />
        <el-table-column :label="$t('common.userId')" align="center" prop="userId" />
        <el-table-column :label="$t('common.sortNo')" align="center" prop="orderNum" />
        <el-table-column :label="$t('common.key')" align="center" prop="testKey" />
        <el-table-column :label="$t('common.value')" align="center" prop="value" />
        <el-table-column :label="$t('common.operation')" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip :content="$t('common.tooltipModify')" placement="top">
              <el-button
                v-hasPermi="['demo:demo:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip :content="$t('common.tooltipDelete')" placement="top">
              <el-button
                v-hasPermi="['demo:demo:remove']"
                link
                type="primary"
                icon="Delete"
                @click="handleDelete(scope.row)"
              ></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
    <!-- 添加或修改测试单对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="demoFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item :label="$t('common.deptId')" prop="deptId">
          <el-input v-model="form.deptId" :placeholder="$t('common.placeholderInputDeptId')" />
        </el-form-item>
        <el-form-item :label="$t('common.userId')" prop="userId">
          <el-input v-model="form.userId" :placeholder="$t('common.placeholderInputUserId')" />
        </el-form-item>
        <el-form-item :label="$t('common.sortNo')" prop="orderNum">
          <el-input v-model="form.orderNum" :placeholder="$t('common.placeholderInputOrderNum')" />
        </el-form-item>
        <el-form-item :label="$t('common.key')" prop="testKey">
          <el-input v-model="form.testKey" :placeholder="$t('common.placeholderInputKey')" />
        </el-form-item>
        <el-form-item :label="$t('common.value')" prop="value">
          <el-input v-model="form.value" :placeholder="$t('common.placeholderInputValue')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">{{ $t('common.btnConfirm') }}</el-button>
          <el-button @click="cancel">{{ $t('common.btnCancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Demo" lang="ts">
import { listDemo, getDemo, delDemo, addDemo, updateDemo } from '@/api/demo/demo';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { DemoVO, DemoQuery, DemoForm } from '@/api/demo/demo/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { download as requestDownload } from '@/utils/request';

const demoList = ref<DemoVO[]>([]);
const buttonLoading = ref(false);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const demoFormRef = ref<ElFormInstance>();

const initFormData: DemoForm = {
  id: undefined,
  deptId: undefined,
  userId: undefined,
  orderNum: undefined,
  testKey: undefined,
  value: undefined
};
const data = reactive<PageData<DemoForm, DemoQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptId: undefined,
    userId: undefined,
    orderNum: undefined,
    testKey: undefined,
    value: undefined
  },
  rules: {
    id: [{ required: true, message: t('common.validationPrimaryKeyRequired'), trigger: 'blur' }],
    deptId: [{ required: true, message: '部门id不能为空', trigger: 'blur' }],
    userId: [{ required: true, message: '用户id不能为空', trigger: 'blur' }],
    orderNum: [{ required: true, message: '排序号不能为空', trigger: 'blur' }],
    testKey: [{ required: true, message: 'key键不能为空', trigger: 'blur' }],
    value: [{ required: true, message: '值不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const { ids, single, multiple, handleSelectionChange } = useTableSelection<DemoVO>(item => item.id);
const {
  dialog,
  resetForm: reset,
  openDialog,
  showDialog,
  closeDialog
} = useFormDialog({
  form,
  formRef: demoFormRef,
  initialFormData: initFormData
});

/** 查询测试单列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listDemo(queryParams.value);
    demoList.value = res.data?.rows;
    total.value = res.data?.total;
  });
};

/** 取消按钮 */
const cancel = () => {
  reset();
  closeDialog();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  afterReset: () => {
    handleQuery();
  }
});

/** 新增按钮操作 */
const handleAdd = () => {
  openDialog('添加测试单');
};

/** 修改按钮操作 */
const handleUpdate = async (row?: Partial<DemoVO>) => {
  reset();
  const demoId = row?.id || ids.value[0];
  const res = await getDemo(demoId);
  Object.assign(form.value, res.data);
  showDialog('修改测试单');
};

/** 提交按钮 */
const submitForm = () => {
  demoFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateDemo(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addDemo(form.value).finally(() => (buttonLoading.value = false));
      }
      modal.msgSuccess(t('common.msgEditSuccess'));
      closeDialog();
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: Partial<DemoVO>) => {
  const demoIds = row?.id || ids.value;
  await modal.confirm(t('common.msgboxConfirmDeleteDemo', { ids: demoIds }));
  await delDemo(demoIds);
  modal.msgSuccess(t('common.msgDeleteSuccess'));
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'demo/demo/export',
    {
      ...queryParams.value
    },
    `demo_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>
