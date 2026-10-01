<template>
  <div class="p-2 app-container dict-page">
    <el-row :gutter="16" class="dict-grid">
      <!-- 字典类型 -->
      <el-col :xs="24" :lg="12">
        <UiCard shadow="hover" class="dict-card table-panel">
          <template #header>
            <div class="toolbar-shell dict-card__header">
              <div class="table-heading">
                <div
                  class="panel-heading search-panel-toggle dict-title-toggle"
                  :class="{ 'is-collapsed': !showTypeSearch }"
                  @click.stop="showTypeSearch = !showTypeSearch"
                >
                  <div>
                    <h3>{{ $t('common.sectionDictManage') }}</h3>
                  </div>
                </div>
              </div>
              <div class="toolbar-actions">
                <right-toolbar v-model:show-search="showTypeSearch" :search="false" @query-table="getTypeList" />
              </div>
            </div>
          </template>

          <div class="dict-search" :class="{ 'is-collapsed': !showTypeSearch }">
            <el-form ref="typeQueryFormRef" :model="typeQueryParams" :inline="true" class="query-form">
              <el-form-item :label="$t('common.dictName')" prop="dictName">
                <UiInput
                  v-model="typeQueryParams.dictName"
                  :placeholder="$t('common.placeholderInputDictName')"
                  clearable
                  @keyup.enter="handleTypeQuery"
                />
              </el-form-item>
              <el-form-item :label="$t('common.dictType')" prop="dictType">
                <UiInput
                  v-model="typeQueryParams.dictType"
                  :placeholder="$t('common.placeholderInputDictType')"
                  clearable
                  @keyup.enter="handleTypeQuery"
                />
              </el-form-item>
              <el-form-item>
                <UiButton type="primary" icon="Search" @click="handleTypeQuery">{{ $t('common.btnSearch') }}</UiButton>
                <UiButton icon="Refresh" @click="handleTypeResetQuery">{{ $t('common.btnReset') }}</UiButton>
              </el-form-item>
            </el-form>
          </div>

          <div class="toolbar-actions dict-actions">
            <UiButton v-hasPermi="['system:dict:add']" type="primary" plain icon="Plus" @click="handleTypeAdd">
              {{ $t('common.btnAdd') }}
            </UiButton>
            <UiButton
              v-hasPermi="['system:dict:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="typeSingle"
              @click="handleTypeUpdate()"
            >
              {{ $t('common.btnEdit') }}
            </UiButton>
            <UiButton
              v-hasPermi="['system:dict:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="typeMultiple"
              @click="handleTypeDelete()"
            >
              {{ $t('common.btnDelete') }}
            </UiButton>
            <UiButton
              v-hasPermi="['system:dict:export']"
              type="warning"
              plain
              icon="Download"
              @click="handleTypeExport"
            >
              {{ $t('common.btnExport') }}
            </UiButton>
            <UiButton
              v-hasPermi="['system:dict:remove']"
              type="danger"
              plain
              icon="Refresh"
              @click="handleRefreshCache"
            >
              {{ $t('common.refreshCache') }}
            </UiButton>
          </div>

          <div class="dict-table-wrap">
            <table-skeleton v-if="typeLoading && !typeList?.length" />
            <DepartmentDataTable
              v-else
              ref="typeTableRef"
              border
              class="data-table"
              :data="typeList"
              row-key="dictId"
              highlight-current-row
              @row-click="handleTypeRowClick"
              @selection-change="handleTypeSelectionChange"
            >
              <template #empty><empty-state /></template>
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column v-if="false" :label="$t('common.dictId')" align="center" prop="dictId" />
              <el-table-column :label="$t('common.dictName')" align="center" prop="dictName" width="120" />
              <el-table-column :label="$t('common.dictType')" align="center" prop="dictType" width="160">
                <template #default="scope">
                  <span class="link-type" @click.stop="handleTypeRowClick(scope.row)">
                    {{ scope.row.dictType }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('common.remark')" align="center" prop="remark" width="160" />
              <el-table-column :label="$t('common.createTime')" align="center" prop="createTime" width="180">
                <template #default="scope">
                  <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('common.operation')"
                fixed="right"
                align="center"
                width="120"
                class-name="small-padding fixed-width"
              >
                <template #default="scope">
                  <DepartmentTableActions>
                    <UiTooltip :content="$t('common.tooltipModify')" placement="bottom">
                      <UiButton
                        v-hasPermi="['system:dict:edit']"
                        link
                        type="primary"
                        icon="Edit"
                        @click="handleTypeUpdate(scope.row)"
                      />
                    </UiTooltip>
                    <UiTooltip :content="$t('common.tooltipDelete')" placement="bottom">
                      <UiButton
                        v-hasPermi="['system:dict:remove']"
                        link
                        type="primary"
                        icon="Delete"
                        @click="handleTypeDelete(scope.row)"
                      />
                    </UiTooltip>
                  </DepartmentTableActions>
                </template>
              </el-table-column>
            </DepartmentDataTable>
          </div>

          <UiPagination
            v-show="typeTotal > 0"
            v-model:page="typeQueryParams.pageNum"
            v-model:limit="typeQueryParams.pageSize"
            :total="typeTotal"
            @pagination="getTypeList"
          />
        </UiCard>
      </el-col>

      <!-- 字典数据 -->
      <el-col :xs="24" :lg="12">
        <UiCard shadow="hover" class="dict-card table-panel">
          <template #header>
            <div class="toolbar-shell dict-card__header">
              <div class="table-heading">
                <div
                  class="panel-heading search-panel-toggle dict-title-toggle"
                  :class="{ 'is-collapsed': !showDataSearch }"
                  @click.stop="showDataSearch = !showDataSearch"
                >
                  <div>
                    <h3>{{ $t('common.sectionDictData') }}</h3>
                    <p v-if="hasCurrentDict" class="dict-card__subtitle">{{ currentDictLabel }}</p>
                  </div>
                </div>
              </div>
              <div class="toolbar-actions">
                <right-toolbar v-model:show-search="showDataSearch" :search="false" @query-table="getDataList" />
              </div>
            </div>
          </template>

          <div class="dict-search" :class="{ 'is-collapsed': !showDataSearch }">
            <el-form ref="dataQueryFormRef" :model="dataQueryParams" :inline="true" class="query-form">
              <el-form-item :label="$t('common.dictLabel')" prop="dictLabel">
                <UiInput
                  v-model="dataQueryParams.dictLabel"
                  :placeholder="$t('common.placeholderInputDictLabel')"
                  clearable
                  :disabled="!hasCurrentDict"
                  @keyup.enter="handleDataQuery"
                />
              </el-form-item>
              <el-form-item>
                <UiButton type="primary" icon="Search" :disabled="!hasCurrentDict" @click="handleDataQuery">
                  {{ $t('common.btnSearch') }}
                </UiButton>
                <UiButton icon="Refresh" :disabled="!hasCurrentDict" @click="handleDataResetQuery">{{ $t('common.btnReset') }}</UiButton>
              </el-form-item>
            </el-form>
          </div>

          <div class="toolbar-actions dict-actions">
            <UiButton
              v-hasPermi="['system:dict:add']"
              type="primary"
              plain
              icon="Plus"
              :disabled="!hasCurrentDict"
              @click="handleDataAdd"
            >
              {{ $t('common.btnAdd') }}
            </UiButton>
            <UiButton
              v-hasPermi="['system:dict:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="dataSingle || !hasCurrentDict"
              @click="handleDataUpdate()"
            >
              {{ $t('common.btnEdit') }}
            </UiButton>
            <UiButton
              v-hasPermi="['system:dict:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="dataMultiple || !hasCurrentDict"
              @click="handleDataDelete()"
            >
              {{ $t('common.btnDelete') }}
            </UiButton>
            <UiButton
              v-hasPermi="['system:dict:export']"
              type="warning"
              plain
              icon="Download"
              :disabled="!hasCurrentDict"
              @click="handleDataExport"
            >
              {{ $t('common.btnExport') }}
            </UiButton>
          </div>

          <div class="dict-table-wrap">
            <table-skeleton v-if="dataLoading && !dataList?.length" />
            <DepartmentDataTable
              v-else
              border
              class="data-table"
              :data="dataList"
              row-key="dictCode"
              @selection-change="handleDataSelectionChange"
            >
              <template #empty><empty-state /></template>
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column v-if="false" :label="$t('common.dictCode')" align="center" prop="dictCode" />
              <el-table-column :label="$t('common.dictLabel')" align="center" prop="dictLabel" width="100">
                <template #default="scope">
                  <span
                    v-if="
                      (scope.row.listClass === '' || scope.row.listClass === 'default') &&
                      (scope.row.cssClass === '' || scope.row.cssClass == null)
                    "
                  >
                    {{ scope.row.dictLabel }}
                  </span>
                  <UiTag
                    v-else
                    :type="
                      scope.row.listClass === 'primary' || scope.row.listClass === 'default'
                        ? 'primary'
                        : scope.row.listClass
                    "
                    :class="scope.row.cssClass"
                  >
                    {{ scope.row.dictLabel }}
                  </UiTag>
                </template>
              </el-table-column>
              <el-table-column :label="$t('common.dictValue')" align="center" prop="dictValue" width="100" />
              <el-table-column :label="$t('common.dictSort')" align="center" prop="dictSort" width="80" />
              <el-table-column :label="$t('common.remark')" align="center" prop="remark" width="100" />
              <el-table-column :label="$t('common.createTime')" align="center" prop="createTime" width="180">
                <template #default="scope">
                  <span>{{ parseTime(scope.row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="$t('common.operation')"
                fixed="right"
                align="center"
                width="120"
                class-name="small-padding fixed-width"
              >
                <template #default="scope">
                  <DepartmentTableActions>
                    <UiTooltip :content="$t('common.tooltipModify')" placement="bottom">
                      <UiButton
                        v-hasPermi="['system:dict:edit']"
                        link
                        type="primary"
                        icon="Edit"
                        @click="handleDataUpdate(scope.row)"
                      />
                    </UiTooltip>
                    <UiTooltip :content="$t('common.tooltipDelete')" placement="bottom">
                      <UiButton
                        v-hasPermi="['system:dict:remove']"
                        link
                        type="primary"
                        icon="Delete"
                        @click="handleDataDelete(scope.row)"
                      />
                    </UiTooltip>
                  </DepartmentTableActions>
                </template>
              </el-table-column>
            </DepartmentDataTable>
          </div>

          <UiPagination
            v-show="dataTotal > 0"
            v-model:page="dataQueryParams.pageNum"
            v-model:limit="dataQueryParams.pageSize"
            :total="dataTotal"
            @pagination="getDataList"
          />
        </UiCard>
      </el-col>
    </el-row>

    <!-- 字典类型对话框 -->
    <UiDialog v-model="typeDialog.visible" :title="typeDialog.title" width="500px" append-to-body>
      <el-form ref="typeFormRef" :model="typeForm" :rules="typeRules" label-width="100px">
        <el-form-item :label="$t('common.dictName')" prop="dictName">
          <UiInput v-model="typeForm.dictName" :placeholder="$t('common.placeholderInputDictName')" />
        </el-form-item>
        <el-form-item prop="dictType">
          <template #label>
            <span>
              <UiTooltip :content="$t('common.dictTooltipTypeKey')" placement="bottom">
                <span class="dict-help-icon" aria-label="提示">?</span>
              </UiTooltip>
              {{ $t('common.dictType') }}
            </span>
          </template>
          <UiInput v-model="typeForm.dictType" :placeholder="$t('common.placeholderInputDictType')" :maxlength="100" />
        </el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remark">
          <UiTextarea v-model="typeForm.remark" :placeholder="$t('common.placeholderInputContent')"></UiTextarea>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <UiButton type="primary" @click="submitTypeForm">{{ $t('common.btnConfirm') }}</UiButton>
          <UiButton @click="cancelType">{{ $t('common.btnCancel') }}</UiButton>
        </div>
      </template>
    </UiDialog>

    <!-- 字典数据对话框 -->
    <UiDialog v-model="dataDialog.visible" :title="dataDialog.title" width="500px" append-to-body>
      <el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="80px">
        <el-form-item :label="$t('common.dictType')">
          <UiInput v-model="dataForm.dictType" disabled />
        </el-form-item>
        <el-form-item :label="$t('common.dataLabel')" prop="dictLabel">
          <UiInput v-model="dataForm.dictLabel" :placeholder="$t('common.placeholderInputDataLabel')" />
        </el-form-item>
        <el-form-item :label="$t('common.dataKey')" prop="dictValue">
          <UiInput v-model="dataForm.dictValue" :placeholder="$t('common.placeholderInputDataValue')" />
        </el-form-item>
        <el-form-item :label="$t('common.cssClass')" prop="cssClass">
          <UiInput v-model="dataForm.cssClass" :placeholder="$t('common.placeholderInputCssClass')" />
        </el-form-item>
        <el-form-item :label="$t('common.sort')" prop="dictSort">
          <UiNumberInput v-model="dataForm.dictSort" controls-position="right" :min="0" />
        </el-form-item>
        <el-form-item :label="$t('common.listClass')" prop="listClass">
          <UiSelect
            v-model="dataForm.listClass"
            :options="listClassOptions.map(item => ({ value: item.value, label: item.label + '(' + item.value + ')' }))"
            clearable
          />
        </el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remark">
          <UiTextarea v-model="dataForm.remark" :placeholder="$t('common.placeholderInputContent')"></UiTextarea>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <UiButton type="primary" @click="submitDataForm">{{ $t('common.btnConfirm') }}</UiButton>
          <UiButton @click="cancelData">{{ $t('common.btnCancel') }}</UiButton>
        </div>
      </template>
    </UiDialog>
  </div>
</template>

<script setup name="Dict" lang="ts">
import { listData, getData, delData, addData, updateData } from '@/api/system/dict/data';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { DictDataForm, DictDataQuery, DictDataVO } from '@/api/system/dict/data/types';
import { listType, getType, delType, addType, updateType, refreshCache } from '@/api/system/dict/type';
import { DictTypeForm, DictTypeQuery, DictTypeVO } from '@/api/system/dict/type/types';
import modal from '@/plugins/modal';
import { useDictStore } from '@/store/modules/dict';
import { download as requestDownload } from '@/utils/request';
import { parseTime } from '@/utils/ruoyi';
import EmptyState from '@/components/EmptyState/index.vue';
import TableSkeleton from '@/components/TableSkeleton/index.vue';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import { UiButton, UiCard, UiDialog, UiInput, UiNumberInput, UiPagination, UiSelect, UiTag, UiTextarea, UiTooltip } from '@/components/UiKit';

const typeList = ref<DictTypeVO[]>([]);
const typeLoading = ref(true);
const showTypeSearch = ref(true);
const typeIds = ref<Array<number | string>>([]);
const typeSingle = ref(true);
const typeMultiple = ref(true);
const typeTotal = ref(0);

const typeFormRef = ref<ElFormInstance>();
const typeQueryFormRef = ref<ElFormInstance>();
const typeTableRef = ref<{ setCurrentRow?: (row?: unknown | null) => void }>();

const typeDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const typeInitFormData: DictTypeForm = {
  dictId: undefined,
  dictName: '',
  dictType: '',
  remark: ''
};

const typeState = reactive<PageData<DictTypeForm, DictTypeQuery>>({
  form: { ...typeInitFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    dictName: '',
    dictType: ''
  },
  rules: {
    dictName: [{ required: true, message: t('common.msgDictNameRequired'), trigger: 'blur' }],
    dictType: [{ required: true, message: t('common.msgDictTypeRequired'), trigger: 'blur' }]
  }
});

const { queryParams: typeQueryParams, form: typeForm, rules: typeRules } = toRefs(typeState);

const currentDict = ref<DictTypeVO | null>(null);
const hasCurrentDict = computed(() => !!currentDict.value);
const currentDictLabel = computed(() => {
  if (!currentDict.value) return t('common.selectDictFirst');
  return `${currentDict.value.dictName} / ${currentDict.value.dictType}`;
});

const dataList = ref<DictDataVO[]>([]);
const dataLoading = ref(false);
const showDataSearch = ref(true);
const dataIds = ref<Array<string | number>>([]);
const dataSingle = ref(true);
const dataMultiple = ref(true);
const dataTotal = ref(0);

const dataFormRef = ref<ElFormInstance>();
const dataQueryFormRef = ref<ElFormInstance>();

const dataDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const listClassOptions = ref<Array<{ value: string; label: string }>>([
  { value: 'default', label: t('common.listStyleDefault') },
  { value: 'primary', label: t('common.listStylePrimary') },
  { value: 'success', label: t('common.listStyleSuccess') },
  { value: 'info', label: t('common.listStyleInfo') },
  { value: 'warning', label: t('common.listStyleWarning') },
  { value: 'danger', label: t('common.listStyleDanger') }
]);

const dataInitFormData: DictDataForm = {
  dictCode: undefined,
  dictLabel: '',
  dictValue: '',
  cssClass: '',
  listClass: 'primary',
  dictSort: 0,
  remark: ''
};

const dataState = reactive<PageData<DictDataForm, DictDataQuery>>({
  form: { ...dataInitFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    dictName: '',
    dictType: '',
    dictLabel: ''
  },
  rules: {
    dictLabel: [{ required: true, message: t('common.msgDictLabelRequired'), trigger: 'blur' }],
    dictValue: [{ required: true, message: t('common.msgDictValueRequired'), trigger: 'blur' }],
    dictSort: [{ required: true, message: t('common.msgDictSortRequired'), trigger: 'blur' }]
  }
});

const { queryParams: dataQueryParams, form: dataForm, rules: dataRules } = toRefs(dataState);

const getTypeList = () => {
  typeLoading.value = true;
  listType(typeQueryParams.value).then(res => {
    typeList.value = res.data?.rows;
    typeTotal.value = res.data?.total;
    typeLoading.value = false;
    ensureCurrentType();
  });
};

const ensureCurrentType = () => {
  if (!typeList.value.length) {
    currentDict.value = null;
    dataQueryParams.value.dictType = '';
    dataList.value = [];
    dataTotal.value = 0;
    return;
  }

  const current = currentDict.value && typeList.value.find(item => item.dictId === currentDict.value?.dictId);
  const nextRow = current || typeList.value[0];
  setCurrentType(nextRow);
};

const setCurrentType = (row: DictTypeVO) => {
  currentDict.value = row;
  dataQueryParams.value.dictType = row.dictType;
  dataQueryParams.value.pageNum = 1;
  dataQueryParams.value.dictLabel = '';
  getDataList();
  nextTick(() => typeTableRef.value?.setCurrentRow(row));
};

const handleTypeRowClick = (row: Partial<DictTypeVO>) => {
  setCurrentType(row as DictTypeVO);
};

const cancelType = () => {
  resetTypeForm();
  typeDialog.visible = false;
};

const resetTypeForm = () => {
  typeForm.value = { ...typeInitFormData };
  typeFormRef.value?.resetFields();
};

const handleTypeQuery = () => {
  typeQueryParams.value.pageNum = 1;
  getTypeList();
};

const handleTypeResetQuery = () => {
  typeQueryFormRef.value?.resetFields();
  handleTypeQuery();
};

const handleTypeAdd = () => {
  resetTypeForm();
  typeDialog.visible = true;
  typeDialog.title = t('common.addDictType');
};

const handleTypeSelectionChange = (selection: DictTypeVO[]) => {
  typeIds.value = selection.map(item => item.dictId);
  typeSingle.value = selection.length != 1;
  typeMultiple.value = !selection.length;
};

const handleTypeUpdate = async (row?: Partial<DictTypeVO>) => {
  resetTypeForm();
  const dictId = row?.dictId || typeIds.value[0];
  const res = await getType(dictId);
  Object.assign(typeForm.value, res.data);
  typeDialog.visible = true;
  typeDialog.title = t('common.editDictType');
};

const submitTypeForm = () => {
  typeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      typeForm.value.dictId ? await updateType(typeForm.value) : await addType(typeForm.value);
      modal.msgSuccess(t('common.msgOperateSuccess'));
      typeDialog.visible = false;
      getTypeList();
    }
  });
};

const handleTypeDelete = async (row?: Partial<DictTypeVO>) => {
  const dictIds = row?.dictId || typeIds.value;
  await modal.confirm(t('common.msgboxConfirmDeleteDict', { ids: dictIds }));
  await delType(dictIds);
  getTypeList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};

const handleTypeExport = () => {
  requestDownload(
    'system/dict/type/export',
    {
      ...typeQueryParams.value
    },
    `dict_${new Date().getTime()}.xlsx`
  );
};

const handleRefreshCache = async () => {
  await refreshCache();
  modal.msgSuccess(t('common.refreshSuccess'));
  useDictStore().cleanDict();
};

const getDataList = async () => {
  if (!currentDict.value) {
    dataList.value = [];
    dataTotal.value = 0;
    dataLoading.value = false;
    return;
  }
  dataLoading.value = true;
  const res = await listData(dataQueryParams.value);
  dataList.value = res.data?.rows;
  dataTotal.value = res.data?.total;
  dataLoading.value = false;
};

const cancelData = () => {
  dataDialog.visible = false;
  resetDataForm();
};

const resetDataForm = () => {
  dataForm.value = { ...dataInitFormData };
  dataFormRef.value?.resetFields();
};

const handleDataQuery = () => {
  if (!currentDict.value) return;
  dataQueryParams.value.pageNum = 1;
  getDataList();
};

const handleDataResetQuery = () => {
  dataQueryFormRef.value?.resetFields();
  dataQueryParams.value.dictLabel = '';
  handleDataQuery();
};

const handleDataAdd = () => {
  if (!currentDict.value) {
    modal.msgWarning(t('common.selectDictFirst'));
    return;
  }
  resetDataForm();
  dataForm.value.dictType = currentDict.value.dictType;
  dataDialog.visible = true;
  dataDialog.title = t('common.addDictData');
};

const handleDataSelectionChange = (selection: DictDataVO[]) => {
  dataIds.value = selection.map(item => item.dictCode);
  dataSingle.value = selection.length != 1;
  dataMultiple.value = !selection.length;
};

const handleDataUpdate = async (row?: Partial<DictDataVO>) => {
  if (!currentDict.value) {
    modal.msgWarning(t('common.selectDictFirst'));
    return;
  }
  resetDataForm();
  const dictCode = row?.dictCode || dataIds.value[0];
  const res = await getData(dictCode);
  Object.assign(dataForm.value, res.data);
  dataDialog.visible = true;
  dataDialog.title = t('common.editDictData');
};

const submitDataForm = () => {
  dataFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      dataForm.value.dictCode ? await updateData(dataForm.value) : await addData(dataForm.value);
      useDictStore().removeDict(dataQueryParams.value.dictType);
      modal.msgSuccess(t('common.msgOperateSuccess'));
      dataDialog.visible = false;
      await getDataList();
    }
  });
};

const handleDataDelete = async (row?: Partial<DictDataVO>) => {
  if (!currentDict.value) {
    modal.msgWarning(t('common.selectDictFirst'));
    return;
  }
  const dictCodes = row?.dictCode || dataIds.value;
  await modal.confirm(t('common.msgboxConfirmDeleteDictData', { ids: dictCodes }));
  await delData(dictCodes);
  await getDataList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
  useDictStore().removeDict(dataQueryParams.value.dictType);
};

const handleDataExport = () => {
  if (!currentDict.value) {
    modal.msgWarning(t('common.selectDictFirst'));
    return;
  }
  requestDownload(
    'system/dict/data/export',
    {
      ...dataQueryParams.value
    },
    `dict_data_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getTypeList();
});
</script>

<style lang="scss" scoped>
.dict-grid {
  row-gap: 16px;
}

.dict-card {
  height: 100%;
}

.dict-card__header {
  gap: 12px;
}

.dict-title-toggle {
  padding: 0 !important;
}

.dict-title-toggle.is-collapsed::after {
  transform: rotate(45deg);
}

.dict-card__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dict-search {
  overflow: hidden;
  max-height: 240px;
  opacity: 1;
  margin-bottom: 12px;
  transition:
    max-height 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.24s ease,
    margin-bottom 0.24s ease;
}

.dict-search.is-collapsed {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
  pointer-events: none;
}

.dict-search :deep(.el-form-item) {
  margin-bottom: 0;
}

.dict-actions {
  margin: 0 0 12px;
  padding-bottom: 0;
}

.dict-actions :deep(.el-button),
.dict-actions :deep(.ui-animal-button) {
  height: 32px;
  padding: 0 14px;
  border-radius: 10px !important;
}

.dict-actions :deep(.el-button + .el-button),
.dict-actions :deep(.ui-animal-button + .ui-animal-button) {
  margin-left: 0;
}

.dict-table-wrap {
  overflow-x: auto;
}
</style>
