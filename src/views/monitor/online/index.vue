<template>
  <div class="p-2 app-container monitor-online-page">
    <div class="search-wrap">
      <UiCard shadow="hover" class="search-panel">
        <template #header>
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">Search Filters</span>
              <h3>{{ $t('common.sectionSearchCondition') }}</h3>
            </div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item :label="$t('common.loginAddress')" prop="ipaddr">
            <UiInput v-model="queryParams.ipaddr" :placeholder="$t('common.placeholderInputLoginAddress')" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item :label="$t('common.userName')" prop="userName">
            <UiInput
              v-model="queryParams.userName"
              :placeholder="$t('common.placeholderInputUserName')"
              clearable
              @keyup.enter="handleQuery"
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
            <span class="panel-kicker">Online Sessions</span>
            <h3>{{ $t('common.sectionOnlineUser') }}</h3>
            <p>共 {{ total }} 条记录，支持按账号或地址检索并执行会话强退。</p>
          </div>
        </div>
      </template>
      <DepartmentDataTable
        :loading="loading"
        border
        class="data-table"
        :data="
          onlineList.slice((queryParams.pageNum - 1) * queryParams.pageSize, queryParams.pageNum * queryParams.pageSize)
        "
        row-key="tokenId"
        style="width: 100%"
      >
        <el-table-column :label="$t('common.index')" width="50" type="index" align="center">
          <template #default="scope">
            <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.sessionId')" align="center" prop="tokenId" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.loginName')" align="center" prop="userName" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.clientKey')" align="center" prop="clientKey" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.deviceType')" align="center">
          <template #default="scope">
            <dict-tag :options="sys_device_type" :value="scope.row.deviceType" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.dept')" align="center" prop="deptName" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.host')" align="center" prop="ipaddr" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.loginLocation')" align="center" prop="loginLocation" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.os')" align="center" prop="os" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.browser')" align="center" prop="browser" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.loginTime')" align="center" prop="loginTime" width="180">
          <template #default="scope">
            <span>{{ parseTime(scope.row.loginTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" :label="$t('common.operation')" align="center" width="180" class-name="small-padding fixed-width">
          <template #default="scope">
            <DepartmentTableActions>
              <UiTooltip :content="$t('common.tooltipForceLogout')" placement="bottom">
                <UiButton
                v-hasPermi="['monitor:online:forceLogout']"
                link
                type="primary"
                icon="Delete"
                @click="handleForceLogout(scope.row)"
                ></UiButton>
              </UiTooltip>
            </DepartmentTableActions>
          </template>
        </el-table-column>
      </DepartmentDataTable>

      <UiPagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
      />
    </UiCard>
  </div>
</template>

<script setup name="Online" lang="ts">
import { to } from 'await-to-js';
import { forceLogout, list as initData } from '@/api/monitor/online';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { OnlineQuery, OnlineVO } from '@/api/monitor/online/types';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { parseTime } from '@/utils/ruoyi';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import { UiButton, UiCard, UiInput, UiPagination, UiTooltip } from '@/components/UiKit';

const { sys_device_type } = toRefs<any>(useDict('sys_device_type'));

const onlineList = ref<OnlineVO[]>([]);
const loading = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();

const queryParams = ref<OnlineQuery>({
  pageNum: 1,
  pageSize: 10,
  ipaddr: '',
  userName: ''
});

/** 查询登录日志列表 */
const getList = async () => {
  loading.value = true;
  const res = await initData(queryParams.value);
  onlineList.value = res.data?.rows;
  total.value = res.data?.total;
  loading.value = false;
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};
/** 强退按钮操作 */
const handleForceLogout = async (row: Partial<OnlineVO>) => {
  const [err] = await to(modal.confirm(t('common.msgboxConfirmForceLogout', { name: row.userName })) as any);
  if (!err) {
    await forceLogout(row.tokenId);
    await getList();
    modal.msgSuccess(t('common.msgDeleteSuccess'));
  }
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
