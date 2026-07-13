<template>
  <div class="p-2 app-container demo-tree-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div><h3>{{ $t('common.sectionSearchCondition') }}</h3></div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item :label="$t('common.treeNodeName')" prop="treeName">
            <el-input
              v-model="queryParams.treeName"
              :placeholder="$t('common.placeholderInputTreeNodeName')"
              clearable
              @keyup.enter="handleQuery"
            />
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
            <h3>{{ $t('common.testTreeList') }}</h3>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['demo:tree:add']" type="primary" plain icon="Plus" @click="handleAdd()">
              {{ $t('common.btnAdd') }}
            </el-button>
            <el-button type="info" plain icon="Sort" @click="handleToggleExpandAll">{{ $t('common.checkboxExpandCollapse') }}</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>
      <el-table
        ref="treeTableRef"
        v-loading="loading"
        class="data-table"
        :data="treeList"
        row-key="id"
        border
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column :label="$t('common.parentId')" prop="parentId" />
        <el-table-column :label="$t('common.deptId')" align="center" prop="deptId" />
        <el-table-column :label="$t('common.userId')" align="center" prop="userId" />
        <el-table-column :label="$t('common.treeNodeName')" align="center" prop="treeName" />
        <el-table-column :label="$t('common.operation')" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip :content="$t('common.tooltipModify')" placement="top">
              <el-button
                v-hasPermi="['demo:tree:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              />
            </el-tooltip>
            <el-tooltip :content="$t('common.tooltipAdd')" placement="top">
              <el-button v-hasPermi="['demo:tree:add']" link type="primary" icon="Plus" @click="handleAdd(scope.row)" />
            </el-tooltip>
            <el-tooltip :content="$t('common.tooltipDelete')" placement="top">
              <el-button
                v-hasPermi="['demo:tree:remove']"
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
    <!-- 添加或修改测试树对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="treeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item :label="$t('common.parentId')" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="treeOptions"
            :props="{ value: 'id', label: 'treeName', children: 'children' } as any"
            value-key="id"
            :placeholder="$t('common.placeholderSelectParentId')"
            check-strictly
          />
        </el-form-item>
        <el-form-item :label="$t('common.deptId')" prop="deptId">
          <el-input v-model="form.deptId" :placeholder="$t('common.placeholderInputDeptId')" />
        </el-form-item>
        <el-form-item :label="$t('common.userId')" prop="userId">
          <el-input v-model="form.userId" :placeholder="$t('common.placeholderInputUserId')" />
        </el-form-item>
        <el-form-item :label="$t('common.value')" prop="treeName">
          <el-input v-model="form.treeName" :placeholder="$t('common.placeholderInputValue')" />
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

<script setup name="Tree" lang="ts">
import { listTree, getTree, delTree, addTree, updateTree } from '@/api/demo/tree';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { TreeVO, TreeQuery, TreeForm } from '@/api/demo/tree/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTreeTableExpand } from '@/hooks/tree/useTreeTableExpand';
import modal from '@/plugins/modal';
import { handleTree } from '@/utils/ruoyi';

type TreeOption = {
  id: number;
  treeName: string;
  children?: TreeOption[];
};

const treeList = ref<TreeVO[]>([]);
const treeOptions = ref<TreeOption[]>([]);
const buttonLoading = ref(false);
const { showSearch } = useSearchToggle();
const { loading, setLoading, withLoading } = useLoading();

const queryFormRef = ref<ElFormInstance>();
const treeFormRef = ref<ElFormInstance>();
const treeTableRef = ref<ElTableInstance>();
const { isExpandAll, handleToggleExpandAll } = useTreeTableExpand<TreeVO>({
  tableRef: treeTableRef,
  data: treeList
});

const initFormData: TreeForm = {
  id: undefined,
  parentId: undefined,
  deptId: undefined,
  userId: undefined,
  treeName: undefined
};

const data = reactive<PageData<TreeForm, TreeQuery>>({
  form: { ...initFormData },
  queryParams: {
    parentId: undefined,
    deptId: undefined,
    userId: undefined,
    treeName: undefined
  },
  rules: {
    id: [{ required: true, message: t('common.validationPrimaryKeyRequired'), trigger: 'blur' }],
    parentId: [{ required: true, message: '父id不能为空', trigger: 'blur' }],
    deptId: [{ required: true, message: '部门id不能为空', trigger: 'blur' }],
    userId: [{ required: true, message: '用户id不能为空', trigger: 'blur' }],
    treeName: [{ required: true, message: '值不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const {
  dialog,
  resetForm: reset,
  openDialog,
  showDialog,
  closeDialog
} = useFormDialog({
  form,
  formRef: treeFormRef,
  initialFormData: initFormData
});

/** 查询测试树列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listTree(queryParams.value);
    const data = handleTree<TreeVO>(res.data, 'id', 'parentId');
    if (data) {
      treeList.value = data;
    }
  });
};

/** 查询测试树下拉树结构 */
const getTreeselect = async () => {
  const res = await listTree();
  treeOptions.value = [];
  const data: TreeOption = { id: 0, treeName: '顶级节点', children: [] };
  data.children = handleTree<TreeOption>(res.data, 'id', 'parentId');
  treeOptions.value.push(data);
};

// 取消按钮
const cancel = () => {
  reset();
  closeDialog();
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
const handleAdd = (row?: Partial<TreeVO>) => {
  openDialog('添加测试树');
  getTreeselect();
  if (row && row.id) {
    form.value.parentId = row.id;
  } else {
    form.value.parentId = 0;
  }
};

/** 修改按钮操作 */
const handleUpdate = async (row: Partial<TreeVO>) => {
  reset();
  await getTreeselect();
  if (row) {
    form.value.parentId = row.id;
  }
  const res = await getTree(row.id);
  Object.assign(form.value, res.data);
  showDialog('修改测试树');
};

/** 提交按钮 */
const submitForm = () => {
  treeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      buttonLoading.value = true;
      if (form.value.id) {
        await updateTree(form.value).finally(() => (buttonLoading.value = false));
      } else {
        await addTree(form.value).finally(() => (buttonLoading.value = false));
      }
      modal.msgSuccess(t('common.msgOperateSuccess'));
      closeDialog();
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row: Partial<TreeVO>) => {
  await modal.confirm(t('common.msgboxConfirmDeleteTree', { ids: row.id }));
  setLoading(true);
  await delTree(row.id).finally(() => setLoading(false));
  await getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};

onMounted(() => {
  getList();
});
</script>
