<template>
  <div class="p-2 app-container system-post-page">
    <el-row :gutter="20" class="content-grid">
      <!-- 部门树 -->
      <tree-panel
        ref="treePanelRef"
        v-model:collapsed="treeCollapsed"
        :title="$t('common.dialogDeptStructure')"
        :placeholder="$t('common.placeholderInputDeptName')"
        :data="deptOptions"
        :expanded-span="5"
        @node-click="handleNodeClick"
      />
      <el-col
        :lg="treeCollapsed ? 23 : 19"
        :xs="24"
        class="tree-content-col content-main"
        :class="{ 'is-tree-collapsed': treeCollapsed }"
      >
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
              <el-form-item :label="$t('common.postCode')" prop="postCode">
                <el-input
                  v-model="queryParams.postCode"
                  :placeholder="$t('common.placeholderInputPostCode')"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
              <el-form-item :label="$t('common.postName')" prop="postName">
                <el-input
                  v-model="queryParams.postName"
                  :placeholder="$t('common.placeholderInputPostName')"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
              <el-form-item :label="$t('common.postIndonesianName')" prop="postIndonesianName">
                <el-input
                  v-model="queryParams.postIndonesianName"
                  :placeholder="$t('common.placeholderInputPostIndonesianName')"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
              <el-form-item :label="$t('common.dept')" prop="deptId">
                <DeptTreeSelect
                  v-model="queryParams.deptId"
                  :data="deptOptions"
                  :placeholder="$t('common.placeholderSelectDept')"
                  check-strictly
                />
              </el-form-item>
              <el-form-item :label="$t('common.status')" prop="status">
                <el-select v-model="queryParams.status" :placeholder="$t('common.postStatus')" clearable>
                  <el-option
                    v-for="dict in sys_normal_disable"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
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
                <span class="panel-kicker">Post Dataset</span>
                <h3>{{ $t('common.sectionPostList') }}</h3>
                <p>共 {{ total }} 条记录，支持按部门筛选、岗位维护和导出。</p>
              </div>
              <div class="toolbar-actions">
                <el-button v-hasPermi="['system:post:add']" type="primary" plain icon="Plus" @click="handleAdd">
                  {{ $t('common.btnAdd') }}
                </el-button>
                <el-button
                  v-hasPermi="['system:post:edit']"
                  type="success"
                  plain
                  icon="Edit"
                  :disabled="single"
                  @click="handleUpdate()"
                >
                  {{ $t('common.btnEdit') }}
                </el-button>
                <el-button
                  v-hasPermi="['system:post:remove']"
                  type="danger"
                  plain
                  icon="Delete"
                  :disabled="multiple"
                  @click="handleDelete()"
                >
                  {{ $t('common.btnDelete') }}
                </el-button>
                <el-button
                  v-hasPermi="['system:post:export']"
                  type="warning"
                  plain
                  icon="Download"
                  @click="handleExport"
                >
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
            :data="postList"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column v-if="false" :label="$t('common.postId')" align="center" prop="postId" />
            <el-table-column :label="$t('common.postCode')" align="center" prop="postCode" />
            <el-table-column :label="$t('common.postName')" align="center" prop="postName" />
            <el-table-column :label="$t('common.postIndonesianName')" align="center" prop="postIndonesianName" />
            <el-table-column :label="$t('common.dept')" align="center" prop="deptName" />
            <el-table-column :label="$t('common.sort')" align="center" prop="postSort" />
            <el-table-column :label="$t('common.status')" align="center" prop="status">
              <template #default="scope">
                <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.createTime')" align="center" prop="createTime" width="180">
              <template #default="scope">
                <span>{{ parseTime(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="180" align="center" class-name="small-padding fixed-width">
              <template #default="scope">
                <el-tooltip :content="$t('common.tooltipModify')" placement="top">
                  <el-button
                    v-hasPermi="['system:post:edit']"
                    link
                    type="primary"
                    icon="Edit"
                    @click="handleUpdate(scope.row)"
                  ></el-button>
                </el-tooltip>
                <el-tooltip :content="$t('common.tooltipDelete')" placement="top">
                  <el-button
                    v-hasPermi="['system:post:remove']"
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

        <!-- 添加或修改岗位对话框 -->
        <el-dialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
          <el-form ref="postFormRef" :model="form" :rules="rules" label-width="80px">
            <el-form-item :label="$t('common.postName')" prop="postName">
              <el-input v-model="form.postName" :placeholder="$t('common.placeholderInputPostName')" />
            </el-form-item>
            <el-form-item :label="$t('common.postIndonesianName')" prop="postIndonesianName">
              <el-input
                v-model="form.postIndonesianName"
                :placeholder="$t('common.placeholderInputPostIndonesianName')"
                maxlength="100"
                show-word-limit
                clearable
              />
            </el-form-item>
            <el-form-item :label="$t('common.dept')" prop="deptId">
              <DeptTreeSelect
                v-model="form.deptId"
                :data="deptOptions"
                :placeholder="$t('common.placeholderSelectDept')"
                check-strictly
              />
            </el-form-item>
            <el-form-item :label="$t('common.postCode')" prop="postCode">
              <el-input v-model="form.postCode" :placeholder="$t('common.placeholderInputPostCodeName')" />
            </el-form-item>
            <el-form-item :label="$t('common.postSort')" prop="postSort">
              <el-input-number v-model="form.postSort" controls-position="right" :min="0" />
            </el-form-item>
            <el-form-item :label="$t('common.postStatus')" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="$t('common.remark')" prop="remark">
              <el-input v-model="form.remark" type="textarea" :placeholder="$t('common.placeholderInputContent')" />
            </el-form-item>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button type="primary" @click="submitForm">{{ $t('common.btnConfirm') }}</el-button>
              <el-button @click="cancel">{{ $t('common.btnCancel') }}</el-button>
            </div>
          </template>
        </el-dialog>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Post" lang="ts">
import { DeptTreeVO, DeptVO } from '@/api/system/dept/types';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { listPost, addPost, delPost, getPost, updatePost, deptTreeSelect } from '@/api/system/post';
import { PostForm, PostQuery, PostVO } from '@/api/system/post/types';
import DeptTreeSelect from '@/components/DeptTreeSelect/index.vue';
import TreePanel from '@/components/TreePanel/index.vue';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import { useTreeCollapsed } from '@/hooks/tree/useTreeCollapsed';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';
import { parseTime } from '@/utils/ruoyi';

const { sys_normal_disable } = toRefs<any>(useDict('sys_normal_disable'));

const postList = ref<PostVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const { ids, single, multiple, handleSelectionChange } = useTableSelection<PostVO>(item => item.postId);
const total = ref(0);
const { treeCollapsed } = useTreeCollapsed();
const deptOptions = ref<DeptTreeVO[]>([]);
const treePanelRef = ref<InstanceType<typeof TreePanel>>();
const postFormRef = ref<ElFormInstance>();
const queryFormRef = ref<ElFormInstance>();

const initFormData: PostForm = {
  postId: undefined,
  deptId: undefined,
  postCode: '',
  postName: '',
  postIndonesianName: '',
  postSort: 0,
  status: '0',
  remark: ''
};

const data = reactive<PageData<PostForm, PostQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    deptId: undefined,
    belongDeptId: undefined,
    postCode: '',
    postName: '',
    postIndonesianName: '',
    status: ''
  },
  rules: {
    postName: [{ required: true, message: t('common.validationPostNameRequired'), trigger: 'blur' }],
    postCode: [{ required: true, message: t('common.validationPostCodeRequired'), trigger: 'blur' }],
    deptId: [{ required: true, message: t('common.validationDeptRequired'), trigger: 'blur' }],
    postSort: [{ required: true, message: t('common.validationPostSortRequired'), trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs<PageData<PostForm, PostQuery>>(data);
const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({
  form,
  formRef: postFormRef,
  initialFormData: initFormData
});
const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  resetExtras: () => {
    queryParams.value.deptId = undefined;
    treePanelRef.value?.setCurrentKey(undefined);
    queryParams.value.belongDeptId = undefined;
  },
  afterReset: () => {
    handleQuery();
  }
});

/** 查询部门下拉树结构 */
const getTreeSelect = async () => {
  const res = await deptTreeSelect();
  deptOptions.value = res.data;
};

/** 节点单击事件 */
const handleNodeClick = (data: DeptVO) => {
  queryParams.value.belongDeptId = data.id;
  queryParams.value.deptId = undefined;
  handleQuery();
};

/** 查询岗位列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listPost(queryParams.value);
    postList.value = res.data?.rows;
    total.value = res.data?.total;
  });
};

/** 取消按钮 */
const cancel = () => {
  closeDialog();
  resetForm();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  if (queryParams.value.deptId) {
    queryParams.value.belongDeptId = undefined;
  }
  getList();
};

/** 新增按钮操作 */
const handleAdd = () => {
  openDialog('添加岗位');
  // 从左侧部门结构进入新增岗位时，默认带入当前选中的部门；也兼容筛选条件中的部门选择。
  form.value.deptId = queryParams.value.belongDeptId || queryParams.value.deptId;
};

/** 修改按钮操作 */
const handleUpdate = async (row?: Partial<PostVO>) => {
  resetForm();
  const postId = row?.postId || ids.value[0];
  const res = await getPost(postId);
  Object.assign(form.value, res.data);
  showDialog('修改岗位');
};

/** 提交按钮 */
const submitForm = () => {
  postFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.postId ? await updatePost(form.value) : await addPost(form.value);
      modal.msgSuccess(t('common.msgOperateSuccess'));
      closeDialog();
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: Partial<PostVO>) => {
  const postIds = row?.postId || ids.value;
  await modal.confirm(t('common.msgboxConfirmDeletePost', { ids: postIds }));
  await delPost(postIds);
  await getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};

/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'system/post/export',
    {
      ...queryParams.value
    },
    `post_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getTreeSelect(); // 初始化部门数据
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.tree-table-crud-page;
</style>
