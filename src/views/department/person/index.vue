<template>
  <div class="p-2 app-container department-person-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :model="queryParams" :inline="true" class="query-form">
        <el-form-item label="人员">
          <el-input v-model="queryParams.userName" clearable placeholder="账号或姓名" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="岗位">
          <el-input v-model="queryParams.jobTitle" clearable placeholder="岗位名称" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="纳入日报">
          <el-select v-model="queryParams.dailyReportEnabled" clearable placeholder="全部">
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel mt-2">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Department People</span>
            <h3>人员档案</h3>
            <p>维护工号、岗位、日报纳入范围和提醒时间</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['department:person:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增人员档案
            </el-button>
            <el-button v-hasPermi="['department:person:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
            <el-button v-hasPermi="['department:person:import']" type="info" plain icon="Upload" @click="handleImport">导入</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border :data="personList">
        <el-table-column label="账号" prop="userName" width="140" />
        <el-table-column label="姓名" prop="nickName" width="120" />
        <el-table-column label="部门" prop="deptName" min-width="160" show-overflow-tooltip />
        <el-table-column label="工号" prop="employeeNo" width="130" />
        <el-table-column label="岗位" prop="jobTitle" width="150" />
        <el-table-column label="纳入日报" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.dailyReportEnabled === '1' ? 'success' : 'info'">
              {{ scope.row.dailyReportEnabled === '1' ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提醒时间" prop="reminderTime" width="120" align="center" />
        <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="120" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:person:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">
              编辑
            </el-button>
            <el-button v-hasPermi="['department:person:remove']" link type="danger" icon="Delete" @click="handleDelete(scope.row)" />
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="系统用户" prop="userId">
          <el-select v-model="form.userId" filterable placeholder="选择系统用户" :disabled="Boolean(form.id)" style="width: 100%">
            <el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName || item.userName}（${item.userName}）`" :value="item.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="form.employeeNo" maxlength="64" placeholder="输入工号" />
        </el-form-item>
        <el-form-item label="岗位">
          <el-input v-model="form.jobTitle" maxlength="100" placeholder="输入岗位" />
        </el-form-item>
        <el-form-item label="纳入日报">
          <el-radio-group v-model="form.dailyReportEnabled">
            <el-radio label="1">是</el-radio>
            <el-radio label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="提醒时间">
          <el-time-picker v-model="form.reminderTime" value-format="HH:mm:ss" format="HH:mm" placeholder="选择提醒时间" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">保存</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="upload.open" :title="upload.title" width="420px" append-to-body>
      <el-upload
        ref="uploadRef"
        drag
        :limit="1"
        accept=".xlsx,.xls"
        :headers="upload.headers"
        :action="upload.url"
        :auto-upload="false"
        :disabled="upload.isUploading"
        :on-progress="handleUploadProgress"
        :on-success="handleUploadSuccess"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">拖拽 Excel 文件到此处，或点击上传</div>
      </el-upload>
      <div class="upload-template-link" @click="downloadTemplate">下载导入模板</div>
      <template #footer>
        <el-button type="primary" :loading="upload.isUploading" @click="submitUpload">开始导入</el-button>
        <el-button @click="upload.open = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentPerson" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import {
  addPersonProfile,
  delPersonProfile,
  getPersonProfile,
  listPersonProfile,
  listPersonUserOptions,
  updatePersonProfile
} from '@/api/department/person';
import type { PersonProfileForm, PersonProfileQuery, PersonProfileVO, PersonUserOptionVO } from '@/api/department/person/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { download as requestDownload, globalHeaders } from '@/utils/request';

const { loading, withLoading } = useLoading(true);
const personList = ref<PersonProfileVO[]>([]);
const userOptions = ref<PersonUserOptionVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const queryParams = reactive<PersonProfileQuery>({ pageNum: 1, pageSize: 10, userName: undefined, jobTitle: undefined, dailyReportEnabled: undefined });
const form = reactive<PersonProfileForm>({
  id: undefined,
  userId: undefined,
  employeeNo: undefined,
  jobTitle: undefined,
  dailyReportEnabled: '1',
  reminderTime: '18:00:00',
  remark: undefined
});
const dialog = reactive({ visible: false, title: '' });
const upload = reactive({
  open: false,
  title: '导入人员档案',
  isUploading: false,
  headers: globalHeaders(),
  url: import.meta.env.VITE_APP_BASE_API + '/department/person/importData'
});
const rules = {
  userId: [{ required: true, message: '请选择系统用户', trigger: 'change' }]
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listPersonProfile(queryParams);
    personList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const loadUserOptions = async () => {
  const res = await listPersonUserOptions();
  userOptions.value = res.data || [];
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.userName = undefined;
  queryParams.jobTitle = undefined;
  queryParams.dailyReportEnabled = undefined;
  handleQuery();
};

const resetForm = () => {
  Object.assign(form, { id: undefined, userId: undefined, employeeNo: undefined, jobTitle: undefined, dailyReportEnabled: '1', reminderTime: '18:00:00', remark: undefined });
  formRef.value?.resetFields();
};

const handleAdd = async () => {
  resetForm();
  await loadUserOptions();
  dialog.title = '新增人员档案';
  dialog.visible = true;
};

const handleUpdate = async (row: PersonProfileVO) => {
  resetForm();
  await loadUserOptions();
  const res = await getPersonProfile(row.id);
  Object.assign(form, res.data);
  dialog.title = '编辑人员档案';
  dialog.visible = true;
};

const submitForm = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      if (form.id) await updatePersonProfile(form);
      else await addPersonProfile(form);
      modal.msgSuccess('保存成功');
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleDelete = async (row: PersonProfileVO) => {
  await modal.confirm(`确认删除 ${row.nickName || row.userName} 的人员档案吗？`);
  await delPersonProfile(row.id);
  modal.msgSuccess('删除成功');
  await getList();
};

const handleExport = () => {
  requestDownload('department/person/export', { ...queryParams }, `person_profile_${Date.now()}.xlsx`);
};

const handleImport = () => {
  upload.open = true;
  upload.isUploading = false;
};

const downloadTemplate = () => {
  requestDownload('department/person/importTemplate', {}, `person_profile_template_${Date.now()}.xlsx`);
};

const handleUploadProgress = () => {
  upload.isUploading = true;
};

const handleUploadSuccess = (response: any, file: any) => {
  upload.isUploading = false;
  upload.open = false;
  uploadRef.value?.handleRemove(file);
  modal.msgSuccess(response?.msg || '导入完成');
  getList();
};

const submitUpload = () => {
  uploadRef.value?.submit();
};

onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
.department-person-page {
  .toolbar-shell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .table-heading h3 {
    margin: 4px 0;
  }

  .table-heading p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .upload-template-link {
    margin-top: 12px;
    color: var(--el-color-primary);
    cursor: pointer;
  }
}
</style>
