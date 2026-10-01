<template>
  <div class="p-2 app-container workflow-my-document-page">
    <el-row :gutter="20" class="content-grid">
      <!-- 流程分类树 -->
      <tree-panel
        ref="treePanelRef"
        v-model:collapsed="treeCollapsed"
        :title="$t('common.dialogFlowCategory')"
        :placeholder="$t('common.placeholderInputFlowCategory')"
        :data="categoryOptions"
        :expanded-span="4"
        filter-field="categoryName"
        @node-click="handleNodeClick"
      />
      <el-col
        :lg="treeCollapsed ? 23 : 20"
        :xs="24"
        class="tree-content-col content-main"
        :class="{ 'is-tree-collapsed': treeCollapsed }"
      >
        <div class="search-wrap">
          <UiCard shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
            <template #header>
              <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
                <div><h3>{{ $t('common.sectionSearchCondition') }}</h3></div>
              </div>
            </template>
            <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="120px" class="query-form">
              <el-form-item :label="$t('common.processDefinitionCode')" prop="flowCode">
                <UiInput v-model="queryParams.flowCode" :placeholder="$t('common.placeholderInputFlowCode')" @keyup.enter="handleQuery" />
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
                <h3>{{ $t('common.sectionMyDocument') }}</h3>
              </div>
              <div class="toolbar-actions">
                <right-toolbar
                  v-model:show-search="showSearch"
                  :search="false"
                  @query-table="handleQuery"
                ></right-toolbar>
              </div>
            </div>
          </template>

          <DepartmentDataTable
            :loading="loading"
            border
            class="data-table"
            :data="processInstanceList"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column align="center" type="index" :label="$t('common.index')" width="60"></el-table-column>
            <el-table-column v-if="false" align="center" prop="id" label="id"></el-table-column>
            <el-table-column
              :show-overflow-tooltip="true"
              prop="flowName"
              align="center"
              :label="$t('common.processDefinitionName')"
            ></el-table-column>
            <el-table-column align="center" prop="flowCode" :label="$t('common.processDefinitionCode')"></el-table-column>
            <el-table-column align="center" prop="categoryName" :label="$t('common.processCategory')"></el-table-column>
            <el-table-column align="center" prop="version" :label="$t('common.versionNumber')" width="90">
              <template #default="scope">v{{ scope.row.version }}.0</template>
            </el-table-column>
            <el-table-column v-if="tab === 'running'" align="center" prop="isSuspended" :label="$t('common.status')" min-width="70">
              <template #default="scope">
                <UiTag v-if="!scope.row.isSuspended" type="success">{{ $t('common.tagActive') }}</UiTag>
                <UiTag v-else type="danger">{{ $t('common.tagSuspended') }}</UiTag>
              </template>
            </el-table-column>
            <el-table-column align="center" :label="$t('common.processStatus')" min-width="70">
              <template #default="scope">
                <dict-tag :options="wf_business_status" :value="scope.row.flowStatus"></dict-tag>
              </template>
            </el-table-column>
            <el-table-column align="center" prop="createTime" :label="$t('common.launchTime')" width="160"></el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="250">
              <template #default="scope">
                <DepartmentTableActions>
                  <UiButton
                    v-if="
                      scope.row.flowStatus === 'draft' ||
                      scope.row.flowStatus === 'cancel' ||
                      scope.row.flowStatus === 'back'
                    "
                    type="primary"
                    size="small"
                    icon="Edit"
                    @click="handleOpen(scope.row, 'update')"
                  >
                    编辑
                  </UiButton>
                  <UiButton
                    v-if="
                      scope.row.flowStatus === 'draft' ||
                      scope.row.flowStatus === 'cancel' ||
                      scope.row.flowStatus === 'back'
                    "
                    type="danger"
                    size="small"
                    icon="Delete"
                    @click="handleDelete(scope.row)"
                  >
                    {{ $t('common.btnDelete') }}
                  </UiButton>
                  <UiButton type="primary" size="small" icon="View" @click="handleOpen(scope.row, 'view')">
                    查看
                  </UiButton>
                  <UiButton
                    v-if="scope.row.flowStatus === 'waiting'"
                    type="warning"
                    size="small"
                    icon="Notification"
                    @click="handleCancelProcessApply(scope.row.businessId)"
                  >
                    撤销
                  </UiButton>
                </DepartmentTableActions>
              </template>
            </el-table-column>
          </DepartmentDataTable>
          <UiPagination
            v-show="total > 0"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="getList"
          />
        </UiCard>
      </el-col>
    </el-row>
    <!-- 提交组件 -->
    <submitVerify ref="submitVerifyRef" @submit-callback="getList" />
  </div>
</template>

<script setup lang="ts">
import { categoryTree } from '@/api/workflow/category';
import { CategoryTreeVO } from '@/api/workflow/category/types';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { pageByCurrent, deleteByInstanceIds, cancelProcessApply } from '@/api/workflow/instance';
import { FlowInstanceQuery, FlowInstanceVO } from '@/api/workflow/instance/types';
import workflowCommon from '@/api/workflow/workflowCommon';
import { RouterJumpVo } from '@/api/workflow/workflowCommon/types';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import TreePanel from '@/components/TreePanel/index.vue';
import { useLoading } from '@/hooks/async/useLoading';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import { useTreeCollapsed } from '@/hooks/tree/useTreeCollapsed';
import { UiButton, UiCard, UiInput, UiPagination, UiTag } from '@/components/UiKit';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';

const { wf_business_status } = toRefs<any>(useDict('wf_business_status'));
const queryFormRef = ref<ElFormInstance>();

const { loading, setLoading, withLoading } = useLoading(true);
const {
  ids: instanceIds,
  single,
  multiple,
  handleSelectionChange
} = useTableSelection<FlowInstanceVO>(item => item.id);
const { showSearch } = useSearchToggle();
// 总条数
const total = ref(0);
// 模型定义表格数据
const processInstanceList = ref<FlowInstanceVO[]>([]);

const categoryOptions = ref<CategoryTreeVO[]>([]);
const { treeCollapsed } = useTreeCollapsed();

const tab = ref('running');
// 查询参数
const queryParams = ref<FlowInstanceQuery>({
  pageNum: 1,
  pageSize: 10,
  flowCode: undefined,
  category: undefined
});

onMounted(() => {
  getList();
  getTreeselect();
});

/** 节点单击事件 */
const handleNodeClick = (data: CategoryTreeVO) => {
  queryParams.value.category = data.id;
  if (data.id === '0') {
    queryParams.value.category = '';
  }
  handleQuery();
};
/** 查询流程分类下拉树结构 */
const getTreeselect = async () => {
  const res = await categoryTree();
  categoryOptions.value = res.data;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
};
const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  pageSizeKey: 'pageSize',
  initialPageSize: 10,
  resetExtras: () => {
    queryParams.value.category = '';
  },
  afterReset: () => {
    handleQuery();
  }
});
//分页
const getList = () => {
  withLoading(async () => {
    const resp = await pageByCurrent(queryParams.value);
    processInstanceList.value = resp.data?.rows;
    total.value = resp.data?.total;
  });
};

/** 删除按钮操作 */
const handleDelete = async (row: Partial<FlowInstanceVO>) => {
  const instanceIdList = row.id || instanceIds.value;
  await modal.confirm(t('common.msgConfirmDelete'));
  setLoading(true);
  if ('running' === tab.value) {
    await deleteByInstanceIds(instanceIdList).finally(() => setLoading(false));
    getList();
  }
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};

/** 撤销按钮操作 */
const handleCancelProcessApply = async (businessId: string) => {
  await modal.confirm(t('common.msgboxConfirmCancelProcess'));
  setLoading(true);
  if ('running' === tab.value) {
    const data = {
      businessId: businessId,
      message: t('common.msgboxConfirmCancelProcess')
    };
    await cancelProcessApply(data).finally(() => setLoading(false));
    getList();
  }
  modal.msgSuccess('撤销成功');
};

//办理
const handleOpen = async (row, type) => {
  const routerJumpVo = reactive<RouterJumpVo>({
    businessId: row.businessId,
    taskId: row.id,
    type: type,
    formCustom: row.formCustom,
    formPath: row.formPath
  });
  workflowCommon.routerJump(routerJumpVo);
};
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.tree-table-crud-page;

.content-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
