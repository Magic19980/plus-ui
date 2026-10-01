<template>
  <div class="p-2 app-container system-config-page">
    <div class="search-wrap">
      <UiCard shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div>
              <span class="panel-kicker">Search Filters</span>
              <h3>{{ $t('common.sectionSearchCondition') }}</h3>
            </div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item :label="$t('common.parameterName')" prop="configName">
            <UiInput
              v-model="queryParams.configName"
              :placeholder="$t('common.placeholderInputConfigName')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.configKey')" prop="configKey">
            <UiInput
              v-model="queryParams.configKey"
              :placeholder="$t('common.placeholderInputConfigKey')"
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

    <UiCard v-loading="loading" shadow="hover" class="table-panel config-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Config Dataset</span>
            <h3>{{ $t('common.sectionConfigList') }}</h3>
            <p>共 {{ total }} 条记录，支持键值维护、导出和缓存刷新。</p>
          </div>
          <div class="toolbar-actions">
            <UiButton v-hasPermi="['system:config:add']" type="primary" plain icon="Plus" @click="handleAdd">
              {{ $t('common.btnAdd') }}
            </UiButton>
            <UiButton v-hasPermi="['system:config:export']" type="warning" plain icon="Download" @click="handleExport">
              {{ $t('common.btnExport') }}
            </UiButton>
            <UiButton
              v-hasPermi="['system:config:remove']"
              type="danger"
              plain
              icon="Refresh"
              @click="handleRefreshCache"
            >
              刷新缓存
            </UiButton>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <div class="config-body">
        <UiTabs
          v-model="activeTab"
          class="config-tabs"
          :items="configTabs"
          contentless
          aria-label="配置类型"
          @change="handleTabChange"
        />

        <div class="config-content">
          <table-skeleton v-if="loading && !configList?.length" />
          <DepartmentDataTable v-else :data="configList" :loading="loading" :border="false">
            <template #empty><empty-state /></template>
            <el-table-column :label="$t('common.parameterName')" prop="configName" min-width="160" />
            <el-table-column :label="$t('common.configKey')" prop="configKey" min-width="160" />
            <el-table-column :label="$t('common.configValue')" min-width="160">
              <template #default="{ row }">
                <UiInput
                  v-model="row.configValue"
                  :placeholder="$t('common.placeholderInputConfigValue')"
                  @blur="handleInlineSave(row)"
                  @keyup.enter="handleInlineSave(row)"
                />
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.remark')" prop="remark" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.remark || '-' }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="80" align="center">
              <template #default="{ row }">
                <DepartmentTableActions>
                  <UiTooltip :content="$t('common.tooltipModify')" placement="bottom">
                    <UiButton
                    v-hasPermi="['system:config:edit']"
                    link
                    type="primary"
                    icon="Edit"
                    @click="handleUpdate(row)"
                    />
                  </UiTooltip>
                  <UiTooltip :content="$t('common.tooltipDelete')" placement="bottom">
                    <UiButton
                    v-hasPermi="['system:config:remove']"
                    link
                    type="danger"
                    icon="Delete"
                    @click="handleDelete(row)"
                    />
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
            @pagination="getList"
          />
        </div>
      </div>
    </UiCard>

    <!-- 添加或修改参数配置对话框 -->
    <UiDialog v-model="dialog.visible" :title="dialog.title" width="500px" append-to-body>
      <el-form ref="configFormRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item :label="$t('common.parameterName')" prop="configName">
          <UiInput v-model="form.configName" :placeholder="$t('common.placeholderInputConfigName')" />
        </el-form-item>
        <el-form-item :label="$t('common.configKey')" prop="configKey">
          <UiInput v-model="form.configKey" :placeholder="$t('common.placeholderInputConfigKey')" />
        </el-form-item>
        <el-form-item :label="$t('common.configValue')" prop="configValue">
          <UiTextarea v-model="form.configValue" :placeholder="$t('common.placeholderInputConfigValue')" />
        </el-form-item>
        <el-form-item :label="$t('common.systemBuiltIn')" prop="configType">
          <UiRadioGroup v-model="form.configType" :options="sys_yes_no" />
        </el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remark">
          <UiTextarea v-model="form.remark" :placeholder="$t('common.placeholderInputContent')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <UiButton type="primary" @click="submitForm">{{ $t('common.btnConfirm') }}</UiButton>
          <UiButton @click="cancel">{{ $t('common.btnCancel') }}</UiButton>
        </div>
      </template>
    </UiDialog>
  </div>
</template>

<script setup name="Config" lang="ts">
import { listConfig, getConfig, delConfig, addConfig, updateConfig, updateConfigByKey, refreshCache } from '@/api/system/config';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { ConfigForm, ConfigQuery, ConfigVO } from '@/api/system/config/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';
import EmptyState from '@/components/EmptyState/index.vue';
import TableSkeleton from '@/components/TableSkeleton/index.vue';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import { UiButton, UiCard, UiDialog, UiInput, UiPagination, UiRadioGroup, UiTabs, UiTextarea, UiTooltip } from '@/components/UiKit';

const { sys_yes_no } = toRefs<any>(useDict('sys_yes_no'));

const configList = ref<ConfigVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);
const activeTab = ref('');
const configTabs = computed(() => [
  { key: '', label: t('common.all') },
  { key: 'Y', label: t('common.systemBuiltIn') },
  { key: 'N', label: t('common.tabCustomConfig') }
]);

const queryFormRef = ref<ElFormInstance>();
const configFormRef = ref<ElFormInstance>();
const initFormData: ConfigForm = {
  configId: undefined,
  configName: '',
  configKey: '',
  configValue: '',
  configType: 'Y',
  remark: ''
};
const data = reactive<PageData<ConfigForm, ConfigQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    configName: '',
    configKey: '',
    configType: ''
  },
  rules: {
    configName: [{ required: true, message: '参数名称不能为空', trigger: 'blur' }],
    configKey: [{ required: true, message: '参数键名不能为空', trigger: 'blur' }],
    configValue: [{ required: true, message: '参数键值不能为空', trigger: 'blur' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const { dialog, resetForm, openDialog, showDialog, closeDialog } = useFormDialog({
  form,
  formRef: configFormRef,
  initialFormData: initFormData
});
const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  afterReset: () => {
    handleQuery();
  }
});

/** 查询参数列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listConfig({ ...queryParams.value });
    configList.value = res.data?.rows;
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
  getList();
};
/** tab 切换 */
const handleTabChange = (tab: string | number) => {
  queryParams.value.configType = tab as string;
  queryParams.value.pageNum = 1;
  getList();
};
/** 新增按钮操作 */
const handleAdd = () => {
  openDialog('添加参数');
};
/** 修改按钮操作 */
const handleUpdate = async (row?: Partial<ConfigVO>) => {
  resetForm();
  const configId = row?.configId;
  const res = await getConfig(configId!);
  Object.assign(form.value, res.data);
  showDialog('修改参数');
};
/** 内联保存参数值 */
const handleInlineSave = async (row: Partial<ConfigVO>) => {
  if (!row.configKey) {
    return;
  }
  await modal.confirm(t('common.msgboxConfirmSaveConfig', { name: row.configKey }));
  await updateConfigByKey(row.configKey, row.configValue ?? '');
  modal.msgSuccess(t('common.msgEditSuccess'));
};
/** 提交按钮 */
const submitForm = () => {
  configFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.configId ? await updateConfig(form.value) : await addConfig(form.value);
      modal.msgSuccess(t('common.msgOperateSuccess'));
      closeDialog();
      await getList();
    }
  });
};
/** 删除按钮操作 */
const handleDelete = async (row?: Partial<ConfigVO>) => {
  const configIds = row?.configId;
  await modal.confirm(t('common.msgboxConfirmDeleteConfig', { ids: configIds }));
  await delConfig(configIds!);
  await getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};
/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'system/config/export',
    {
      ...queryParams.value
    },
    `config_${new Date().getTime()}.xlsx`
  );
};
/** 刷新缓存按钮操作 */
const handleRefreshCache = async () => {
  await refreshCache();
  modal.msgSuccess('刷新缓存成功');
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.toolbar-responsive;

.config-body {
  display: flex;
}

.config-tabs {
  flex-shrink: 0;
}

.config-tabs :deep(.el-tabs__header.is-left) {
  margin-right: 0;
}

.config-tabs :deep(.el-tabs__nav-wrap.is-left::after) {
  width: 1px;
  background: var(--el-border-color-lighter);
}

.config-tabs :deep(.el-tabs__content) {
  display: none;
}

.config-tabs :deep(.el-tabs__item) {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.config-tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 500;
}

.config-content {
  flex: 1;
  min-width: 0;
  padding-left: 16px;
}
</style>
