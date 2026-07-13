<template>
  <div class="p-2 app-container workflow-leave-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div><h3>{{ $t('common.sectionSearchCondition') }}</h3></div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item :label="$t('common.leaveDays')" prop="startLeaveDays">
            <el-input
              v-model="queryParams.startLeaveDays"
              :placeholder="$t('common.placeholderInputLeaveDays')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item prop="endLeaveDays">至</el-form-item>
          <el-form-item prop="endLeaveDays">
            <el-input
              v-model="queryParams.endLeaveDays"
              :placeholder="$t('common.placeholderInputLeaveDays')"
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
            <h3>{{ $t('common.sectionLeaveList') }}</h3>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['workflow:leave:add']" type="primary" plain icon="Plus" @click="handleAdd">
              {{ $t('common.btnAdd') }}
            </el-button>
            <el-button
              v-hasPermi="['workflow:leave:export']"
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
        :data="leaveList"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" :label="$t('common.primaryKey')" align="center" prop="id" />
        <el-table-column :label="$t('common.leaveType')" align="center">
          <template #default="scope">
            <el-tag>{{ options.find(e => e.value === scope.row.leaveType)?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.startTime')" align="center" prop="startDate">
          <template #default="scope">
            <span>{{ parseTime(scope.row.startDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.endTime')" align="center" prop="endDate">
          <template #default="scope">
            <span>{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.leaveDays')" align="center" prop="leaveDays" />
        <el-table-column :label="$t('common.leaveReason')" align="center" prop="remark" />
        <el-table-column align="center" :label="$t('common.processStatus')" min-width="70">
          <template #default="scope">
            <dict-tag :options="wf_business_status" :value="scope.row.status"></dict-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operation')" align="center" width="162">
          <template #default="scope">
            <el-row :gutter="10" class="mb8">
              <el-col
                :span="1.5"
                v-if="scope.row.status === 'draft' || scope.row.status === 'cancel' || scope.row.status === 'back'"
              >
                <el-button
                  v-hasPermi="['workflow:leave:edit']"
                  size="small"
                  type="primary"
                  icon="Edit"
                  @click="handleUpdate(scope.row)"
                >
                  {{ $t('common.btnEdit') }}
                </el-button>
              </el-col>
              <el-col
                :span="1.5"
                v-if="scope.row.status === 'draft' || scope.row.status === 'cancel' || scope.row.status === 'back'"
              >
                <el-button
                  v-hasPermi="['workflow:leave:remove']"
                  size="small"
                  type="primary"
                  icon="Delete"
                  @click="handleDelete(scope.row)"
                >
                  {{ $t('common.btnDelete') }}
                </el-button>
              </el-col>
            </el-row>
            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <el-button type="primary" size="small" icon="View" @click="handleView(scope.row)">{{ $t('common.btnView') }}</el-button>
              </el-col>
              <el-col :span="1.5" v-if="scope.row.status === 'waiting'">
                <el-button
                  size="small"
                  type="primary"
                  icon="Notification"
                  @click="handleCancelProcessApply(scope.row.id)"
                >
                  撤销
                </el-button>
              </el-col>
            </el-row>
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
  </div>
</template>

<script setup name="Leave" lang="ts">
import { useRoute } from 'vue-router';
import { cancelProcessApply } from '@/api/workflow/instance';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { delLeave, listLeave } from '@/api/workflow/leave';
import { LeaveForm, LeaveQuery, LeaveVO } from '@/api/workflow/leave/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import tab from '@/plugins/tab';
import router from '@/router';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';
import { parseTime } from '@/utils/ruoyi';

const route = useRoute();
const { wf_business_status } = toRefs<any>(useDict('wf_business_status'));
const leaveList = ref<LeaveVO[]>([]);
const { loading, setLoading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const { ids, single, multiple, handleSelectionChange } = useTableSelection<LeaveVO>(item => item.id);
const total = ref(0);
const options = [
  {
    value: '1',
    label: t('common.leaveTypePersonal')
  },
  {
    value: '2',
    label: t('common.leaveTypeCompensatory')
  },
  {
    value: '3',
    label: t('common.leaveTypeSick')
  },
  {
    value: '4',
    label: t('common.leaveTypeMarriage')
  }
];

const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<LeaveForm, LeaveQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    startLeaveDays: undefined,
    endLeaveDays: undefined
  },
  rules: {}
});

const { queryParams } = toRefs(data);

/** 查询请假列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listLeave(queryParams.value);
    leaveList.value = res.data?.rows;
    total.value = res.data?.total;
  });
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
  tab.closePage(route);
  router.push({
    path: `/workflow/leaveEdit/index`,
    query: {
      type: 'add'
    }
  });
};

/** 修改按钮操作 */
const handleUpdate = (row?: Partial<LeaveVO>) => {
  tab.closePage(route);
  router.push({
    path: `/workflow/leaveEdit/index`,
    query: {
      id: row.id,
      type: 'update'
    }
  });
};

/** 查看按钮操作 */
const handleView = (row?: Partial<LeaveVO>) => {
  tab.closePage(route);
  router.push({
    path: `/workflow/leaveEdit/index`,
    query: {
      id: row.id,
      type: 'view'
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: Partial<LeaveVO>) => {
  const leaveIds = row?.id || ids.value;
  await modal.confirm(t('common.msgboxConfirmDeleteLeave', { ids: leaveIds }));
  await delLeave(leaveIds);
  modal.msgSuccess(t('common.msgDeleteSuccess'));
  await getList();
};

/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'workflow/leave/export',
    {
      ...queryParams.value
    },
    `leave_${new Date().getTime()}.xlsx`
  );
};

/** 撤销按钮操作 */
const handleCancelProcessApply = async (id: string) => {
  await modal.confirm(t('common.msgboxConfirmCancelProcess'));
  setLoading(true);
  const data = {
    businessId: id,
    message: t('common.msgboxConfirmCancelProcess')
  };
  await cancelProcessApply(data).finally(() => setLoading(false));
  await getList();
  modal.msgSuccess('撤销成功');
};
onMounted(() => {
  getList();
});
</script>
