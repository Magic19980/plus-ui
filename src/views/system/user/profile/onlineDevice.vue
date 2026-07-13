<template>
  <div class="profile-table-wrap">
    <el-table :data="devices" border class="data-table profile-device-table">
      <el-table-column :label="$t('common.deviceType')" align="center">
        <template #default="scope">
          <dict-tag :options="sys_device_type" :value="scope.row.deviceType" />
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.host')" align="center" prop="ipaddr" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.loginLocation')" align="center" prop="loginLocation" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.os')" align="center" prop="os" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.browser')" align="center" prop="browser" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.loginTime')" align="center" prop="loginTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.loginTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-tooltip :content="$t('common.tooltipDelete')" placement="top">
            <el-button link type="primary" icon="Delete" @click="handldDelOnline(scope.row)"></el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup name="Online" lang="ts">
import { delOnline } from '@/api/monitor/online';
import modal from '@/plugins/modal';
import tab from '@/plugins/tab';
import { useDict } from '@/utils/dict';
import { useI18n } from 'vue-i18n';
import { propTypes } from '@/utils/propTypes';
import { parseTime } from '@/utils/ruoyi';

const { t } = useI18n();

const { sys_device_type } = toRefs<any>(useDict('sys_device_type'));

const props = defineProps({
  devices: propTypes.any.isRequired
});
const devices = computed(() => props.devices);

/** 删除按钮操作 */
const handldDelOnline = (row: any) => {
  ElMessageBox.confirm(t('common.msgboxConfirmDelDevice'))
    .then(() => {
      return delOnline(row.tokenId);
    })
    .then((res: any) => {
      if (res.code === 200) {
        modal.msgSuccess(t('common.msgDeleteSuccess'));
        tab.refreshPage();
      } else {
        modal.msgError(res.msg);
      }
    })
    .catch(() => {});
};
</script>

<style lang="scss" scoped>
.profile-table-wrap {
  width: 100%;
}
</style>
