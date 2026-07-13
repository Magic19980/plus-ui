<template>
  <div class="p-2 app-container system-notice-page">
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
          <el-form-item :label="$t('common.noticeTitle')" prop="noticeTitle">
            <el-input
              v-model="queryParams.noticeTitle"
              :placeholder="$t('common.placeholderInputNoticeTitle')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.operator')" prop="createByName">
            <el-input
              v-model="queryParams.createByName"
              :placeholder="$t('common.placeholderInputOperName')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.type')" prop="noticeType">
            <el-select v-model="queryParams.noticeType" :placeholder="$t('common.placeholderSelectNoticeType')" clearable>
              <el-option v-for="dict in sys_notice_type" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
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
            <span class="panel-kicker">Notice Dataset</span>
            <h3>{{ $t('common.sectionNoticeList') }}</h3>
            <p>共 {{ total }} 条记录，支持类型筛选、内容编辑和状态管理。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['system:notice:add']" type="primary" plain icon="Plus" @click="handleAdd">
              {{ $t('common.btnAdd') }}
            </el-button>
            <el-button
              v-hasPermi="['system:notice:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
            >
              {{ $t('common.btnEdit') }}
            </el-button>
            <el-button
              v-hasPermi="['system:notice:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              {{ $t('common.btnDelete') }}
            </el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <table-skeleton v-if="loading && !noticeList?.length" />
      <el-table
        v-else
        v-loading="loading"
        border
        class="data-table"
        :data="noticeList"
        @selection-change="handleSelectionChange"
      >
        <template #empty><empty-state /></template>
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" :label="$t('common.index')" align="center" prop="noticeId" width="100" />
        <el-table-column :label="$t('common.noticeTitle')" align="center" prop="noticeTitle" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.noticeType')" align="center" prop="noticeType" width="100">
          <template #default="scope">
            <dict-tag :options="sys_notice_type" :value="scope.row.noticeType" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.status')" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="sys_notice_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.createBy')" align="center" prop="createByName" width="100" />
        <el-table-column :label="$t('common.createTime')" align="center" prop="createTime" width="100">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.operation')" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip :content="$t('common.tooltipDetail')" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetail(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip :content="$t('common.tooltipModify')" placement="top">
              <el-button
                v-hasPermi="['system:notice:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip :content="$t('common.tooltipDelete')" placement="top">
              <el-button
                v-hasPermi="['system:notice:remove']"
                link
                type="primary"
                icon="Delete"
                @click="handleDelete(scope.row)"
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
    <!-- 添加或修改公告对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="780px"
      append-to-body
      destroy-on-close
      @closed="handleDialogClosed"
    >
      <el-form ref="noticeFormRef" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item :label="$t('common.noticeTitle')" prop="noticeTitle">
              <el-input v-model="form.noticeTitle" :placeholder="$t('common.placeholderInputNoticeTitle')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.noticeType')" prop="noticeType">
              <el-select v-model="form.noticeType" :placeholder="$t('common.placeholderSelect')">
                <el-option
                  v-for="dict in sys_notice_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('common.status')">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_notice_status" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('common.content')">
              <editor v-model="form.noticeContent" :min-height="192" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">{{ $t('common.btnConfirm') }}</el-button>
          <el-button @click="cancel">{{ $t('common.btnCancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialog.visible"
      :title="$t('common.dialogNoticeDetail')"
      width="820px"
      append-to-body
      @closed="handleDetailDialogClosed"
    >
      <div class="notice-detail">
        <div class="notice-detail__header">
          <div class="notice-detail__title">{{ detailForm.noticeTitle || '-' }}</div>
          <div class="notice-detail__meta">
            <div class="notice-detail__meta-item">
              <span class="notice-detail__meta-label">{{ $t('common.typeColon') }}</span>
              <dict-tag :options="sys_notice_type" :value="detailForm.noticeType" />
            </div>
            <div class="notice-detail__meta-item">
              <span class="notice-detail__meta-label">{{ $t('common.statusColon') }}</span>
              <dict-tag :options="sys_notice_status" :value="detailForm.status" />
            </div>
            <div class="notice-detail__meta-item">
              <span class="notice-detail__meta-label">{{ $t('common.creatorColon') }}</span>
              <span>{{ detailForm.createByName || '-' }}</span>
            </div>
            <div class="notice-detail__meta-item">
              <span class="notice-detail__meta-label">{{ $t('common.createTimeColon') }}</span>
              <span>{{ parseTime(detailForm.createTime, '{y}-{m}-{d} {h}:{i}:{s}') || '-' }}</span>
            </div>
          </div>
        </div>
        <el-divider />
        <div class="notice-detail__content" v-html="safeNoticeContent"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup name="Notice" lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { listNotice, getNotice, delNotice, addNotice, updateNotice } from '@/api/system/notice';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { NoticeForm, NoticeQuery, NoticeVO } from '@/api/system/notice/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { resolveOssContent } from '@/utils/ossContent';
import { parseTime } from '@/utils/ruoyi';
import { sanitizeHtml } from '@/utils/sanitize';
import EmptyState from '@/components/EmptyState/index.vue';
import TableSkeleton from '@/components/TableSkeleton/index.vue';

const { sys_notice_status, sys_notice_type } = toRefs<any>(useDict('sys_notice_status', 'sys_notice_type'));
const route = useRoute();
const router = useRouter();

const noticeList = ref<NoticeVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const noticeFormRef = ref<ElFormInstance>();
const routeDetailSyncing = ref(false);
const emptyNoticeContent = computed(() => `<p>${t('common.noNoticeContent')}</p>`);

const initFormData: NoticeForm = {
  noticeId: undefined,
  noticeTitle: '',
  noticeType: '',
  noticeContent: '',
  status: '0',
  remark: '',
  createByName: ''
};
const detailForm = ref<NoticeVO>({} as NoticeVO);
const safeNoticeContent = computed(() => sanitizeHtml(detailForm.value.noticeContent || emptyNoticeContent));
const data = reactive<PageData<NoticeForm, NoticeQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    noticeTitle: '',
    createByName: '',
    status: '',
    noticeType: ''
  },
  rules: {
    noticeTitle: [{ required: true, message: t('common.validationNoticeTitleRequired'), trigger: 'blur' }],
    noticeType: [{ required: true, message: t('common.validationNoticeTypeRequired'), trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);
const { ids, single, multiple, handleSelectionChange } = useTableSelection<NoticeVO>(item => item.noticeId);
const {
  dialog,
  resetForm: reset,
  openDialog,
  showDialog,
  closeDialog
} = useFormDialog({
  form,
  formRef: noticeFormRef,
  initialFormData: initFormData
});
const {
  dialog: detailDialog,
  openDialog: openDetailDialog,
  closeDialog: closeDetailDialog
} = useDialogState('公告详情');

/** 查询公告列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listNotice(queryParams.value);
    noticeList.value = res.data?.rows;
    total.value = res.data?.total;
  });
};
/** 取消按钮 */
const cancel = () => {
  closeDialog();
};
/** 对话框关闭后重置 */
const handleDialogClosed = () => {
  reset();
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
  openDialog('添加公告');
};
/**修改按钮操作 */
const handleUpdate = async (row?: Partial<NoticeVO>) => {
  reset();
  const noticeId = row?.noticeId || ids.value[0];
  const { data } = await getNotice(noticeId);
  Object.assign(form.value, data);
  showDialog('修改公告');
};
/** 详情按钮操作 */
const handleDetail = async (row: Partial<NoticeVO>) => {
  await openDetail(row.noticeId);
};
/** 打开详情 */
const openDetail = async (noticeId: string | number) => {
  const { data } = await getNotice(noticeId);
  data.noticeContent = await resolveOssContent(data.noticeContent);
  detailForm.value = data;
  openDetailDialog();
};
/** 详情弹窗关闭后移除路由参数 */
const handleDetailDialogClosed = async () => {
  if (!route.query.noticeId) {
    return;
  }
  routeDetailSyncing.value = true;
  await router.replace({
    path: route.path,
    query: {
      ...route.query,
      noticeId: undefined
    }
  });
  routeDetailSyncing.value = false;
};
/** 提交按钮 */
const submitForm = () => {
  noticeFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.noticeId ? await updateNotice(form.value) : await addNotice(form.value);
      modal.msgSuccess(t('common.msgOperateSuccess'));
      closeDialog();
      await getList();
    }
  });
};
/** 删除按钮操作 */
const handleDelete = async (row?: Partial<NoticeVO>) => {
  const noticeIds = row?.noticeId || ids.value;
  await modal.confirm(t('common.msgboxConfirmDeleteNotice', { ids: noticeIds }));
  await delNotice(noticeIds);
  await getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};

onMounted(() => {
  getList();
});

watch(
  () => route.query.noticeId,
  async noticeId => {
    if (routeDetailSyncing.value || !noticeId) {
      return;
    }
    await openDetail(String(noticeId));
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

.notice-detail {
  &__header {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.4;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.6;
  }

  &__meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  &__meta-label {
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  &__content {
    max-height: 60vh;
    overflow: auto;
    color: var(--el-text-color-primary);
    line-height: 1.8;
    word-break: break-word;
  }

  :deep(.notice-detail__meta-item > div) {
    display: inline-flex;
    align-items: center;
  }
}
</style>
