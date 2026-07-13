<template>
  <div class="p-2 app-container monitor-logininfo-page">
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
          <el-form-item :label="$t('common.loginAddress')" prop="ipaddr">
            <el-input v-model="queryParams.ipaddr" :placeholder="$t('common.placeholderInputLoginAddress')" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item :label="$t('common.userName')" prop="userName">
            <el-input
              v-model="queryParams.userName"
              :placeholder="$t('common.placeholderInputUserName')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.status')" prop="status">
            <el-select v-model="queryParams.status" :placeholder="$t('common.placeholderLoginStatus')" clearable>
              <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('common.loginTime')" style="width: 308px">
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
            <span class="panel-kicker">Access Logs</span>
            <h3>{{ $t('common.sectionLoginLog') }}</h3>
            <p>共 {{ total }} 条记录，支持排序、批量清理、导出和账号解锁。</p>
          </div>
          <div class="toolbar-actions">
            <el-button
              v-hasPermi="['monitor:logininfo:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              {{ $t('common.btnDelete') }}
            </el-button>
            <el-button v-hasPermi="['monitor:logininfo:remove']" type="danger" plain icon="Delete" @click="handleClean">
              {{ $t('common.btnClear') }}
            </el-button>
            <el-button
              v-hasPermi="['monitor:logininfo:unlock']"
              type="primary"
              plain
              icon="Unlock"
              :disabled="single"
              @click="handleUnlock"
            >
              {{ $t('common.btnUnlock') }}
            </el-button>
            <el-button
              v-hasPermi="['monitor:logininfo:export']"
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
        ref="loginInfoTableRef"
        v-loading="loading"
        :data="loginInfoList"
        class="data-table"
        :default-sort="defaultSort"
        border
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column :label="$t('common.infoId')" align="center" prop="infoId" />
        <el-table-column
          :label="$t('common.userName')"
          align="center"
          prop="userName"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column :label="$t('common.clientKey')" align="center" prop="clientKey" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.deviceType')" align="center">
          <template #default="scope">
            <dict-tag :options="sys_device_type" :value="scope.row.deviceType" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.ipaddr')" align="center" prop="ipaddr" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.loginLocation')" align="center" prop="loginLocation" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.os')" align="center" prop="os" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.browser')" align="center" prop="browser" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.loginStatus')" align="center" prop="status">
          <template #default="scope">
            <dict-tag :options="sys_common_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.description')" align="center" prop="msg" :show-overflow-tooltip="true" />
        <el-table-column
          :label="$t('common.loginTime')"
          align="center"
          prop="loginTime"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
          width="180"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.loginTime) }}</span>
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

<script setup name="LoginInfo" lang="ts">
import { list, delLoginInfo, cleanLoginInfo, unlockLoginInfo } from '@/api/monitor/logininfo';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { LoginInfoQuery, LoginInfoVO } from '@/api/monitor/logininfo/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import { useTableSortQuery } from '@/hooks/table/useTableSortQuery';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';
import { parseTime } from '@/utils/ruoyi';

const { sys_device_type } = toRefs<any>(useDict('sys_device_type'));
const { sys_common_status } = toRefs<any>(useDict('sys_common_status'));

const loginInfoList = ref<LoginInfoVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();

const queryFormRef = ref<ElFormInstance>();
const loginInfoTableRef = ref<ElTableInstance>();
// 查询参数
const queryParams = ref<LoginInfoQuery>({
  pageNum: 1,
  pageSize: 10,
  ipaddr: '',
  userName: '',
  status: '',
  orderByColumn: 'loginTime',
  isAsc: 'descending'
});
const {
  ids,
  selectedRows,
  single,
  multiple,
  handleSelectionChange: handleTableSelectionChange
} = useTableSelection<LoginInfoVO>(item => item.infoId);
const selectName = computed(() => selectedRows.value.map(item => item.userName));

/** 查询登录日志列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await list(applyDateRange(queryParams.value));
    loginInfoList.value = res.data?.rows;
    total.value = res.data?.total;
  });
};
const { defaultSort, handleSortChange, resetSort } = useTableSortQuery<LoginInfoQuery>({
  queryParams,
  tableRef: loginInfoTableRef,
  defaultSort: { prop: 'loginTime', order: 'descending' },
  onSortChange: getList
});
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
const handleSelectionChange = (selection: LoginInfoVO[]) => {
  handleTableSelectionChange(selection);
};
/** 删除按钮操作 */
const handleDelete = async (row?: LoginInfoVO) => {
  const infoIds = row?.infoId || ids.value;
  await modal.confirm(t('common.msgboxConfirmDeleteLoginInfo', { ids: infoIds }));
  await delLoginInfo(infoIds);
  await getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};
/** 清空按钮操作 */
const handleClean = async () => {
  await modal.confirm(t('common.msgboxConfirmClearLoginlog'));
  await cleanLoginInfo();
  await getList();
  modal.msgSuccess('清空成功');
};
/** 解锁按钮操作 */
const handleUnlock = async () => {
  const username = selectName.value;
  await modal.confirm(t('common.msgboxConfirmUnlockUserByName', { name: username }));
  await unlockLoginInfo(username);
  modal.msgSuccess('用户' + username + '解锁成功');
};
/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'monitor/loginInfo/export',
    {
      ...queryParams.value
    },
    `logininfo_${new Date().getTime()}.xlsx`
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
