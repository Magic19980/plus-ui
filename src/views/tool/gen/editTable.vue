<template>
  <UiCard class="gen-edit-card">
    <UiTabs v-model="activeName" :items="tabItems" aria-label="代码生成配置">
      <template #basic>
        <basic-info-form ref="basicInfo" :info="info" />
      </template>
      <template #columnInfo>
        <DepartmentDataTable ref="dragTable" border :data="columns" row-key="columnId" :max-height="tableHeight" class="data-table">
          <el-table-column :label="$t('common.index')" type="index" min-width="5%" />
          <el-table-column :label="$t('common.columnName')" prop="columnName" min-width="10%" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('common.columnDesc')" min-width="10%">
            <template #default="scope">
              <UiInput v-model="scope.row.columnComment" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.physicalType')" prop="columnType" min-width="10%" :show-overflow-tooltip="true" />
          <el-table-column :label="$t('common.javaType')" min-width="11%">
            <template #default="scope">
              <UiSelect v-model="scope.row.javaType" :options="javaTypeOptions" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.javaProperty')" min-width="10%">
            <template #default="scope">
              <UiInput v-model="scope.row.javaField" />
            </template>
          </el-table-column>

          <el-table-column :label="$t('common.insert')" min-width="5%">
            <template #default="scope">
              <UiCheckbox v-model="scope.row.isInsert" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.edit')" min-width="5%">
            <template #default="scope">
              <UiCheckbox v-model="scope.row.isEdit" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.list')" min-width="5%">
            <template #default="scope">
              <UiCheckbox v-model="scope.row.isList" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.query')" min-width="5%">
            <template #default="scope">
              <UiCheckbox v-model="scope.row.isQuery" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.queryType')" min-width="10%">
            <template #default="scope">
              <UiSelect v-model="scope.row.queryType" :options="queryTypeOptions" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.required')" min-width="5%">
            <template #default="scope">
              <UiCheckbox v-model="scope.row.isRequired" true-value="1" false-value="0" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.displayType')" min-width="12%">
            <template #default="scope">
              <UiSelect v-model="scope.row.htmlType" :options="htmlTypeOptions" @change="handleHtmlTypeChange(scope.row)" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('common.dictType')" min-width="12%">
            <template #default="scope">
              <UiSelect
                v-model="scope.row.dictType"
                clearable
                filterable
                :placeholder="$t('common.placeholderSelect')"
                :disabled="!supportsDictHtmlType(scope.row.htmlType)"
                :options="dictSelectOptions"
              />
            </template>
          </el-table-column>
        </DepartmentDataTable>
      </template>
      <template #genInfo>
        <gen-info-form ref="genInfo" :info="info" :columns="columns" />
      </template>
    </UiTabs>
    <div class="gen-edit-footer">
      <div>
        <UiButton type="primary" @click="submitForm()">{{ $t('common.btnSubmit') }}</UiButton>
        <UiButton @click="close()">{{ $t('common.btnBack') }}</UiButton>
      </div>
    </div>
  </UiCard>
</template>

<script setup name="GenEdit" lang="ts">
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { optionselect as getDictOptionselect } from '@/api/system/dict/type';
import { DictTypeVO } from '@/api/system/dict/type/types';
import { getGenTable, updateGenTable } from '@/api/tool/gen';
import { DbColumnVO, DbTableVO } from '@/api/tool/gen/types';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import { UiButton, UiCard, UiCheckbox, UiInput, UiSelect, UiTabs } from '@/components/UiKit';
import modal from '@/plugins/modal';
import tab from '@/plugins/tab';
import BasicInfoForm from './basicInfoForm.vue';
import GenInfoForm from './genInfoForm.vue';

const route = useRoute();
const { t } = useI18n();
const activeName = ref('columnInfo');
const tableHeight = ref(document.documentElement.scrollHeight - 245 + 'px');
const columns = ref<DbColumnVO[]>([]);
const dictOptions = ref<DictTypeVO[]>([]);
const info = ref<Partial<DbTableVO>>({});
const DICT_HTML_TYPES = ['select', 'radio', 'checkbox', 'switch'];
const tabItems = computed(() => [
  { key: 'basic', label: t('common.tabBasicInfo') },
  { key: 'columnInfo', label: t('common.tabFieldInfo') },
  { key: 'genInfo', label: t('common.tabGenInfo') }
]);
const javaTypeOptions = [
  'Long',
  'String',
  'Integer',
  'Double',
  'BigDecimal',
  'LocalDateTime',
  'Boolean'
].map(value => ({ value, label: value }));
const queryTypeOptions = [
  ['EQ', '='],
  ['NE', '!='],
  ['GT', '>'],
  ['GE', '>='],
  ['LT', '<'],
  ['LE', '<='],
  ['LIKE', 'LIKE'],
  ['BETWEEN', 'BETWEEN']
].map(([value, label]) => ({ value, label }));
const htmlTypeOptions = [
  ['input', '文本框'],
  ['inputNumber', '数字输入'],
  ['textarea', '文本域'],
  ['select', '下拉框'],
  ['radio', '单选框'],
  ['checkbox', '复选框'],
  ['switch', '开关'],
  ['datetime', '日期控件'],
  ['imageUpload', '图片上传'],
  ['fileUpload', '文件上传'],
  ['editor', '富文本控件']
].map(([value, label]) => ({ value, label }));

const basicInfo = ref<InstanceType<typeof BasicInfoForm>>();
const genInfo = ref<InstanceType<typeof GenInfoForm>>();
const dictSelectOptions = computed(() => dictOptions.value.map(item => ({ value: item.dictType, label: `${item.dictName} (${item.dictType})` })));

const supportsDictHtmlType = (htmlType?: string) => DICT_HTML_TYPES.includes(htmlType ?? '');

const normalizeColumnDictType = (column: Partial<DbColumnVO>) => {
  if (!supportsDictHtmlType(String(column.htmlType ?? ''))) {
    column.dictType = '';
  }
};

const handleHtmlTypeChange = (column: Partial<DbColumnVO>) => {
  normalizeColumnDictType(column);
};

/** 提交按钮 */
const submitForm = async () => {
  const basicOk = (await basicInfo.value?.validate()) ?? false;
  const genOk = (await genInfo.value?.validate()) ?? false;
  if (!basicOk || !genOk) {
    modal.msgError('表单校验未通过，请重新检查提交内容');
    return;
  }
  columns.value.forEach(normalizeColumnDictType);
  const genTable: Record<string, unknown> = { ...info.value };
  genTable.columns = columns.value;
  genTable.params = {
    treeCode: info.value?.treeCode,
    treeName: info.value.treeName,
    treeParentCode: info.value.treeParentCode,
    parentMenuId: info.value.parentMenuId,
    enableExport: info.value.enableExport,
    enableStatus: info.value.enableStatus,
    statusField: info.value.statusField,
    enableUnique: info.value.enableUnique,
    uniqueFields: info.value.uniqueFields,
    enableSort: info.value.enableSort,
    sortField: info.value.sortField,
    treeRootValue: info.value.treeRootValue,
    treeAncestors: info.value.treeAncestorsField,
    treeOrderField: info.value.treeOrderField
  };
  const response = await updateGenTable(genTable as any);
  modal.msgSuccess(response.msg ?? '');
  if (response.code === 200) {
    close();
  }
};

const close = () => {
  tab.closeOpenPage({
    path: '/tool/gen',
    query: { t: Date.now().toString(), pageNum: route.query.pageNum }
  });
};

onMounted(async () => {
  const tableId = route.params?.tableId as string | undefined;
  if (!tableId) return;
  const res = await getGenTable(tableId);
  const detail = res.data;
  if (!detail) return;
  columns.value = (detail.rows ?? []).map(column => {
    const item = { ...column };
    normalizeColumnDictType(item);
    return item;
  });
  info.value = {
    enableExport: detail.info.enableExport ?? true,
    enableStatus: detail.info.enableStatus ?? false,
    statusField: detail.info.statusField ?? '',
    enableUnique: detail.info.enableUnique ?? false,
    uniqueFields: detail.info.uniqueFields ?? [],
    enableSort: detail.info.enableSort ?? false,
    sortField: detail.info.sortField ?? '',
    frontendType: detail.info.frontendType ?? 'vue',
    treeRootValue: detail.info.treeRootValue ?? '0',
    treeAncestorsField: detail.info.treeAncestorsField ?? '',
    treeOrderField: detail.info.treeOrderField ?? '',
    ...detail.info
  };
  info.value.frontendType ||= 'vue';
  const response = await getDictOptionselect();
  dictOptions.value = response.data;
});
</script>
