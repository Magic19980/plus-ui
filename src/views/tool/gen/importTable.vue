<template>
  <el-dialog v-model="visible" :title="$t('common.dialogImportTable')" width="1100px" top="5vh" append-to-body>
    <el-form ref="queryFormRef" :model="queryParams" :inline="true">
      <el-form-item :label="$t('common.dataSource')" prop="dataName">
        <el-select v-model="queryParams.dataName" filterable :placeholder="$t('common.placeholderSelectDataSource')">
          <el-option v-for="item in dataNameList" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('common.tableName')" prop="tableName">
        <el-input v-model="queryParams.tableName" :placeholder="$t('common.placeholderInputTableName')" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item :label="$t('common.tableDesc')" prop="tableComment">
        <el-input v-model="queryParams.tableComment" :placeholder="$t('common.placeholderInputTableDesc')" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">{{ $t('common.btnSearch') }}</el-button>
        <el-button icon="Refresh" @click="resetQuery">{{ $t('common.btnReset') }}</el-button>
      </el-form-item>
    </el-form>
    <el-row>
      <el-table
        ref="tableRef"
        border
        :data="dbTableList"
        height="260px"
        @row-click="clickRow"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="tableName" :label="$t('common.tableName')" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="tableComment" :label="$t('common.tableDesc')" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="createTime" :label="$t('common.createTime')"></el-table-column>
        <el-table-column prop="updateTime" :label="$t('common.updateTime')"></el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-row>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="handleImportTable">{{ $t('common.btnConfirm') }}</el-button>
        <el-button @click="visible = false">{{ $t('common.btnCancel') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { listDbTable, importTable, getDataNames } from '@/api/tool/gen';
import { DbTableQuery, DbTableVO } from '@/api/tool/gen/types';
import { useI18n } from 'vue-i18n';
import modal from '@/plugins/modal';

const total = ref(0);
const visible = ref(false);
const tables = ref<Array<string>>([]);
const dbTableList = ref<Array<DbTableVO>>([]);

const tableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();

const queryParams = reactive<DbTableQuery>({
  pageNum: 1,
  pageSize: 10,
  dataName: '',
  tableName: '',
  tableComment: ''
});
const dataNameList = ref<Array<string>>([]);

const emit = defineEmits(['ok']);

/** 查询参数列表 */
const show = (dataName: string) => {
  getDataNames().then(res => {
    if (res.code == 200) {
      dataNameList.value = res.data;
      if (dataName) {
        queryParams.dataName = dataName;
      } else {
        queryParams.dataName = dataNameList.value[0];
      }
      getList();
      visible.value = true;
    }
  });
};
/** 单击选择行 */
const clickRow = (row: DbTableVO) => {
  // ele bug
  tableRef.value?.toggleRowSelection(row, false);
};
/** 多选框选中数据 */
const handleSelectionChange = (selection: DbTableVO[]) => {
  tables.value = selection.map(item => item.tableName);
};
/** 查询表数据 */
const getList = async () => {
  const res = await listDbTable(queryParams);
  dbTableList.value = res.data?.rows;
  total.value = res.data?.total;
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};
/** 导入按钮操作 */
const handleImportTable = async () => {
  const tableNames = tables.value.join(',');
  if (tableNames == '') {
    modal.msgError('请选择要导入的表');
    return;
  }
  const res = await importTable({
    tables: tableNames,
    dataName: queryParams.dataName
  });
  modal.msgSuccess(res.msg ?? '');
  if (res.code === 200) {
    visible.value = false;
    emit('ok');
  }
};

defineExpose({
  show
});
</script>
