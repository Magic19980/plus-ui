<template>
  <div class="p-2 app-container monitor-operlog-page">
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
          <el-form-item :label="$t('common.operIp')" prop="operIp">
            <el-input v-model="queryParams.operIp" :placeholder="$t('common.placeholderInputHost')" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item :label="$t('common.systemModule')" prop="title">
            <el-input v-model="queryParams.title" :placeholder="$t('common.placeholderInputTitle')" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item :label="$t('common.operator')" prop="operName">
            <el-input
              v-model="queryParams.operName"
              :placeholder="$t('common.placeholderInputOperName')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.clientKey')" prop="clientKey">
            <el-input v-model="queryParams.clientKey" :placeholder="$t('common.placeholderInputClient')" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item :label="$t('common.deviceType')" prop="deviceType">
            <el-select v-model="queryParams.deviceType" :placeholder="$t('common.placeholderInputDeviceType')" clearable>
              <el-option v-for="dict in sys_device_type" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('common.browser')" prop="browser">
            <el-input v-model="queryParams.browser" :placeholder="$t('common.placeholderInputBrowser')" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item :label="$t('common.os')" prop="os">
            <el-input v-model="queryParams.os" :placeholder="$t('common.placeholderInputOs')" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item :label="$t('common.type')" prop="businessType">
            <el-select v-model="queryParams.businessType" :placeholder="$t('common.placeholderOperType')" clearable>
              <el-option v-for="dict in sys_oper_type" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('common.status')" prop="status">
            <el-select v-model="queryParams.status" :placeholder="$t('common.placeholderOperStatus')" clearable>
              <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('common.operTimeRange')" style="width: 308px">
            <el-date-picker
              v-model="dateRange"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="daterange"
              range-separator="-"
              :start-placeholder="$t('common.placeholderStartDate')"
              :end-placeholder="$t('common.placeholderEndDate')"
              :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
            ></el-date-picker>
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
            <span class="panel-kicker">Operation Logs</span>
            <h3>{{ $t('common.sectionOperLog') }}</h3>
            <p>共 {{ total }} 条记录，支持类型过滤、详情查看、批量清空和导出。</p>
          </div>
          <div class="toolbar-actions">
            <el-button
              v-hasPermi="['monitor:operlog:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              {{ $t('common.btnDelete') }}
            </el-button>
            <el-button
              v-hasPermi="['monitor:operlog:remove']"
              type="danger"
              plain
              icon="WarnTriangleFilled"
              @click="handleClean"
            >
              {{ $t('common.btnClear') }}
            </el-button>
            <el-button
              v-hasPermi="['monitor:operlog:export']"
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
        ref="operLogTableRef"
        v-loading="loading"
        :data="operlogList"
        class="data-table"
        border
        :default-sort="defaultSort"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column :label="$t('common.operId')" align="center" prop="operId" />
        <el-table-column :label="$t('common.systemModule')" align="center" prop="title" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.operationType')" align="center" prop="businessType">
          <template #default="scope">
            <dict-tag :options="sys_oper_type" :value="scope.row.businessType" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('common.operator')"
          align="center"
          width="110"
          prop="operName"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column :label="$t('common.dept')" align="center" prop="deptName" width="130" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.clientKey')" align="center" prop="clientKey" width="110" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.deviceType')" align="center" prop="deviceType" width="110" :show-overflow-tooltip="true">
          <template #default="scope">
            <dict-tag :options="sys_device_type" :value="scope.row.deviceType" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.browser')" align="center" prop="browser" width="110" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.os')" align="center" prop="os" width="110" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.operIp')" align="center" prop="operIp" width="130" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.operStatus')" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="sys_common_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('common.operTime')"
          align="center"
          prop="operTime"
          width="180"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.operTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="$t('common.costTime')"
          align="center"
          prop="costTime"
          width="110"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template #default="scope">
            <span>{{ scope.row.costTime }}毫秒</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operation')" fixed="right" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip :content="$t('common.tooltipOperDetail')" placement="top">
              <el-button
                v-hasPermi="['monitor:operlog:query']"
                link
                type="primary"
                icon="View"
                @click="handleView(scope.row)"
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
    <!-- 操作日志详细 -->
    <OperInfoDialog ref="operInfoDialogRef" />
  </div>
</template>

<script setup name="Operlog" lang="ts">
import { list, delOperlog, cleanOperlog } from '@/api/monitor/operlog';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { OperLogForm, OperLogQuery, OperLogVO } from '@/api/monitor/operlog/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import { useTableSortQuery } from '@/hooks/table/useTableSortQuery';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';
import { parseTime, selectDictLabel } from '@/utils/ruoyi';
import OperInfoDialog from './operInfoDialog.vue';

const { sys_oper_type, sys_common_status, sys_device_type } = toRefs<any>(
  useDict('sys_oper_type', 'sys_common_status', 'sys_device_type')
);

const operlogList = ref<OperLogVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();

const operLogTableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<OperLogForm, OperLogQuery>>({
  form: {
    operId: undefined,
    tenantId: undefined,
    title: '',
    businessType: 0,
    businessTypes: undefined,
    method: '',
    requestMethod: '',
    operatorType: 0,
    operName: '',
    userId: undefined,
    deptId: undefined,
    deptName: '',
    clientKey: '',
    deviceType: '',
    browser: '',
    os: '',
    operUrl: '',
    operIp: '',
    operLocation: '',
    operParam: '',
    jsonResult: '',
    status: 0,
    errorMsg: '',
    operTime: '',
    costTime: 0
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    operIp: '',
    title: '',
    operName: '',
    userId: '',
    deptId: '',
    clientKey: '',
    deviceType: '',
    browser: '',
    os: '',
    businessType: '',
    status: '',
    orderByColumn: 'operTime',
    isAsc: 'descending'
  },
  rules: {}
});

const { queryParams, form } = toRefs(data);
const {
  ids,
  multiple,
  handleSelectionChange: handleTableSelectionChange
} = useTableSelection<OperLogVO>(item => item.operId);

/** 查询登录日志 */
const getList = async () => {
  await withLoading(async () => {
    const res = await list(applyDateRange(queryParams.value));
    operlogList.value = res.data?.rows;
    total.value = res.data?.total;
  });
};
const { defaultSort, handleSortChange, resetSort } = useTableSortQuery<OperLogQuery>({
  queryParams,
  tableRef: operLogTableRef,
  defaultSort: { prop: 'operTime', order: 'descending' },
  onSortChange: getList
});
/** 操作日志类型字典翻译 */
const typeFormat = (row: OperLogForm) => {
  return selectDictLabel(sys_oper_type.value, row.businessType);
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
  resetExtras: () => {
    resetDateRange();
  },
  afterReset: () => {
    resetSort();
  }
});
const handleSelectionChange = (selection: OperLogVO[]) => {
  handleTableSelectionChange(selection);
};

const operInfoDialogRef = ref<InstanceType<typeof OperInfoDialog>>();
/** 详细按钮操作 */
const handleView = (row: Partial<OperLogVO>) => {
  operInfoDialogRef.value.openDialog(row as OperLogForm);
};

/** 删除按钮操作 */
const handleDelete = async (row?: Partial<OperLogVO>) => {
  const operIds = row?.operId || ids.value;
  await modal.confirm(t('common.msgboxConfirmDeleteOperlog', { ids: operIds }));
  await delOperlog(operIds);
  await getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};

/** 清空按钮操作 */
const handleClean = async () => {
  await modal.confirm(t('common.msgboxConfirmClearOperlog'));
  await cleanOperlog();
  await getList();
  modal.msgSuccess('清空成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'monitor/operlog/export',
    {
      ...queryParams.value
    },
    `operlog_${new Date().getTime()}.xlsx`
  );
};
onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
