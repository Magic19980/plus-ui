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
        <el-form-item>
          <el-checkbox v-model="queryParams.includeHistory">包含已结束服务关系</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel mt-2">
      <template #header>
        <DepartmentPanelHeader kicker="Department People" title="人员档案" description="展示科室成员、工号、岗位及基础信息；基础数据由用户管理统一维护">
          <el-button v-hasPermi="['department:person:add']" type="primary" plain icon="Plus" @click="handleAdd">新增人员档案</el-button>
          <el-button v-hasPermi="['department:person:query']" type="success" plain icon="Calendar" @click="openLeaveManager">休假安排</el-button>
          <el-button v-hasPermi="['department:person:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          <el-button v-hasPermi="['department:person:import']" type="info" plain icon="Upload" @click="handleImport">导入</el-button>
        </DepartmentPanelHeader>
      </template>

      <el-table v-loading="loading" border :data="personList">
        <el-table-column label="账号" prop="userName" width="140" />
        <el-table-column label="姓名" prop="nickName" width="120" />
        <el-table-column label="部门" prop="deptName" min-width="160" show-overflow-tooltip />
        <el-table-column label="工号" prop="employeeNo" width="130" />
        <el-table-column label="岗位" prop="jobTitle" width="150" />
        <el-table-column label="加入日期" prop="joinDate" width="120" />
        <el-table-column label="离开生效日" prop="leaveDate" width="130">
          <template #default="scope">{{ scope.row.leaveDate || '服务中' }}</template>
        </el-table-column>
        <el-table-column label="成员类型" prop="memberType" width="100">
          <template #default="scope">{{ scope.row.memberType === 'TEMP' ? '临时协作' : '正式成员' }}</template>
        </el-table-column>
        <el-table-column label="服务状态" prop="memberStatus" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.memberStatus === 'ENDED' ? 'info' : 'success'" size="small">
              {{ scope.row.memberStatus === 'ENDED' ? '已结束' : '服务中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="210" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:person:edit']" link type="primary" icon="Edit" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button
              v-if="scope.row.memberStatus !== 'ENDED'"
              v-hasPermi="['department:person:remove']"
              link
              type="danger"
              icon="CircleClose"
              @click="handleDelete(scope.row)"
            >
              结束服务
            </el-button>
            <span v-else class="text-secondary">已结束</span>
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
          <div class="selected-user-field">
            <div v-if="selectedUser" class="selected-user-card">
              <div class="selected-user-name">{{ selectedUser.nickName || selectedUser.userName }}</div>
              <div class="selected-user-meta">
                {{ selectedUser.userName }} · {{ selectedUser.deptName || '未分配部门' }}
                <span v-if="selectedUser.employeeNo"> · 工号 {{ selectedUser.employeeNo }}</span>
              </div>
            </div>
            <el-button v-if="dialog.mode === 'add' && !selectedUser" type="primary" plain icon="Search" @click="openUserPicker">选择系统用户</el-button>
            <el-button v-if="dialog.mode === 'add' && selectedUser" link type="primary" @click="openUserPicker">更换</el-button>
          </div>
        </el-form-item>
        <el-form-item label="加入日期" prop="joinDate">
          <el-date-picker v-model="form.joinDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" placeholder="选择纳入科室日期" />
        </el-form-item>
        <el-form-item label="成员类型" prop="memberType">
          <el-select v-model="form.memberType" style="width: 100%">
            <el-option label="正式成员" value="FULL" />
            <el-option label="临时协作" value="TEMP" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="例如：负责某项目支持、临时协作范围" />
        </el-form-item>
        <el-alert
          :title="dialog.mode === 'edit' ? '修改成员关系不会删除日报、任务或其他历史数据。加入日期调整后，日报和任务将按新日期计算。' : '加入日期当天开始纳入；离开生效日当天起不再生成日报和任务，历史数据仍保留。'"
          type="info"
          :closable="false"
          show-icon
        />
      </el-form>
      <template #footer>
        <el-button :loading="buttonLoading" type="primary" @click="submitForm">{{ dialog.mode === 'edit' ? '保存修改' : '加入科室' }}</el-button>
        <el-button @click="dialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="endDialog.visible" title="结束科室服务关系" width="480px" append-to-body>
      <el-form ref="endFormRef" :model="endForm" :rules="endRules" label-width="100px">
        <el-alert
          title="离开生效日当天起关闭日报、任务和提醒，不会删除已有日报、任务或业务记录；当天可重新加入。"
          type="warning"
          :closable="false"
          show-icon
          class="mb-4"
        />
        <el-form-item label="离开生效日" prop="leaveDate">
          <el-date-picker
            v-model="endForm.leaveDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            placeholder="选择离开后不再服务的日期"
          />
        </el-form-item>
        <el-form-item label="结束原因" prop="reason">
          <el-input v-model="endForm.reason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="例如：项目支持结束、调离科室" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :loading="buttonLoading" type="danger" @click="submitEnd">确认结束服务</el-button>
        <el-button @click="endDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="leaveDialog.visible" title="人员休假安排" width="860px" append-to-body>
      <div class="leave-toolbar">
        <div>
          <div class="leave-toolbar-title">按人员维护休假记录</div>
          <div class="leave-toolbar-text">休假期间，工作日会自动生成“休假”日报；周末及休息日不生成日报。</div>
        </div>
        <el-button v-hasPermi="['department:person:add']" type="primary" icon="Plus" @click="openLeaveForm()">新增休假</el-button>
      </div>
      <el-table v-loading="leaveLoading" :data="leaves" border max-height="360" class="leave-table">
        <template #empty><empty-state description="当前科室暂无休假安排" /></template>
        <el-table-column label="人员" min-width="150">
          <template #default="scope">{{ scope.row.nickName || scope.row.userName }}<span class="leave-user-account">（{{ scope.row.userName }}）</span></template>
        </el-table-column>
        <el-table-column label="休假日期" width="230" align="center"><template #default="scope">{{ scope.row.startDate }} 至 {{ scope.row.endDate }}</template></el-table-column>
        <el-table-column prop="leaveType" label="类型" width="120" align="center" />
        <el-table-column prop="reason" label="说明" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="130" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:person:edit']" link type="primary" @click="openLeaveForm(scope.row)">编辑</el-button>
            <el-button v-hasPermi="['department:person:remove']" link type="danger" @click="removeLeave(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer><el-button @click="leaveDialog.visible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="leaveFormDialog.visible" :title="leaveForm.id ? '编辑休假' : '新增休假'" width="560px" append-to-body>
      <el-form ref="leaveFormRef" :model="leaveForm" :rules="leaveRules" label-width="100px">
        <el-form-item label="休假人员" prop="userId">
          <el-select v-model="leaveForm.userId" filterable placeholder="搜索并选择人员" style="width: 100%">
            <el-option v-for="item in leaveMembers" :key="item.userId" :label="`${item.nickName || item.userName}（${item.userName}）`" :value="item.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate"><el-date-picker v-model="leaveForm.startDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="结束日期" prop="endDate"><el-date-picker v-model="leaveForm.endDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" /></el-form-item>
        <el-form-item label="休假类型"><el-input v-model="leaveForm.leaveType" placeholder="例如：年假、病假，默认休假" /></el-form-item>
        <el-form-item label="休假说明"><el-input v-model="leaveForm.reason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="补充休假原因或说明" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button v-hasPermi="[leaveForm.id ? 'department:person:edit' : 'department:person:add']" type="primary" :loading="leaveSaving" @click="saveLeave">保存并生成日报</el-button>
        <el-button @click="leaveFormDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="userPicker.visible" title="选择系统用户" width="760px" append-to-body>
      <div class="user-picker-dialog">
        <el-form :inline="true" @submit.prevent="handleUserPickerQuery">
          <el-form-item label="搜索人员">
            <el-input
              v-model="userPicker.keyword"
              clearable
              placeholder="账号、姓名、工号或部门"
              style="width: 320px"
              @keyup.enter="handleUserPickerQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleUserPickerQuery">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table
          v-loading="userPicker.loading"
          :data="userPickerOptions"
          row-key="userId"
          highlight-current-row
          @row-click="handleUserRowClick"
        >
          <template #empty><empty-state description="没有可加入当前科室的系统用户" /></template>
          <el-table-column width="58" align="center">
            <template #default="scope">
              <el-radio :model-value="pickerSelectedUser?.userId" :label="scope.row.userId" @click.stop="handleUserRowClick(scope.row)">
                <span class="sr-only">选择</span>
              </el-radio>
            </template>
          </el-table-column>
          <el-table-column label="账号" prop="userName" min-width="150" />
          <el-table-column label="姓名" prop="nickName" min-width="130" />
          <el-table-column label="工号" prop="employeeNo" width="130" />
          <el-table-column label="部门" prop="deptName" min-width="180" show-overflow-tooltip />
        </el-table>
        <pagination
          v-show="userPicker.total > 0"
          v-model:page="userPicker.pageNum"
          v-model:limit="userPicker.pageSize"
          :total="userPicker.total"
          @pagination="loadUserPicker"
        />
      </div>
      <template #footer>
        <el-button type="primary" :disabled="!pickerSelectedUser" @click="confirmUserPicker">确定选择</el-button>
        <el-button @click="userPicker.visible = false">取消</el-button>
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
  addPersonLeave,
  endPersonProfile,
  delPersonLeave,
  listPersonProfile,
  listPersonLeaves,
  listPersonMemberOptions,
  listPersonUserOptionsPage,
  updatePersonLeave,
  updatePersonProfile
} from '@/api/department/person';
import type {
  PersonLeaveForm,
  PersonLeaveVO,
  PersonProfileForm,
  PersonProfileQuery,
  PersonProfileVO,
  PersonUserOptionQuery,
  PersonUserOptionVO
} from '@/api/department/person/types';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { download as requestDownload, globalHeaders } from '@/utils/request';

const { loading, withLoading } = useLoading(true);
const personList = ref<PersonProfileVO[]>([]);
const userPickerOptions = ref<PersonUserOptionVO[]>([]);
const selectedUser = ref<PersonUserOptionVO>();
const pickerSelectedUser = ref<PersonUserOptionVO>();
const leaves = ref<PersonLeaveVO[]>([]);
const leaveMembers = ref<PersonUserOptionVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const leaveLoading = ref(false);
const leaveSaving = ref(false);
const formRef = ref<ElFormInstance>();
const leaveFormRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const queryParams = reactive<PersonProfileQuery>({ pageNum: 1, pageSize: 10, userName: undefined, jobTitle: undefined, includeHistory: false });
const form = reactive<PersonProfileForm>({
  id: undefined,
  userId: undefined,
  joinDate: undefined,
  leaveDate: undefined,
  memberType: 'FULL',
  remark: ''
});
const dialog = reactive<{ visible: boolean; title: string; mode: 'add' | 'edit' }>({ visible: false, title: '', mode: 'add' });
const endDialog = reactive<{ visible: boolean; personId?: string | number }>({ visible: false, personId: undefined });
const endForm = reactive({ leaveDate: '', reason: '' });
const endFormRef = ref<ElFormInstance>();
const leaveDialog = reactive({ visible: false });
const leaveFormDialog = reactive({ visible: false });
const leaveForm = reactive<PersonLeaveForm>({ userId: undefined, startDate: undefined, endDate: undefined, leaveType: '休假', reason: '' });
const userPicker = reactive<PersonUserOptionQuery & { visible: boolean; loading: boolean; total: number }>({
  visible: false,
  loading: false,
  total: 0,
  pageNum: 1,
  pageSize: 8,
  keyword: undefined
});
const upload = reactive({
  open: false,
  title: '导入人员档案',
  isUploading: false,
  headers: globalHeaders(),
  url: import.meta.env.VITE_APP_BASE_API + '/department/person/importData'
});
const rules = {
  userId: [{ required: true, message: '请选择系统用户', trigger: 'change' }],
  joinDate: [{ required: true, message: '请选择加入日期', trigger: 'change' }]
};
const endRules = {
  leaveDate: [{ required: true, message: '请选择离开生效日', trigger: 'change' }]
};
const leaveRules = {
  userId: [{ required: true, message: '请选择休假人员', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
};

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listPersonProfile(queryParams);
    personList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.userName = undefined;
  queryParams.jobTitle = undefined;
  queryParams.includeHistory = false;
  handleQuery();
};

const resetForm = () => {
  Object.assign(form, { id: undefined, userId: undefined, joinDate: undefined, memberType: 'FULL', leaveDate: undefined, remark: '' });
  selectedUser.value = undefined;
  pickerSelectedUser.value = undefined;
  formRef.value?.resetFields();
  form.joinDate = today();
};

const handleAdd = () => {
  resetForm();
  dialog.mode = 'add';
  dialog.title = '新增人员档案';
  dialog.visible = true;
};

const handleEdit = (row: unknown) => {
  const person = row as PersonProfileVO;
  Object.assign(form, {
    id: person.id,
    userId: person.userId,
    joinDate: person.joinDate,
    leaveDate: person.leaveDate,
    memberType: person.memberType || 'FULL',
    remark: person.remark || ''
  });
  selectedUser.value = {
    userId: person.userId,
    userName: person.userName || '',
    nickName: person.nickName,
    deptName: person.deptName,
    employeeNo: person.employeeNo
  };
  pickerSelectedUser.value = selectedUser.value;
  dialog.mode = 'edit';
  dialog.title = '编辑人员档案';
  dialog.visible = true;
};

const loadUserPicker = async () => {
  userPicker.loading = true;
  try {
    const res = await listPersonUserOptionsPage({
      pageNum: userPicker.pageNum,
      pageSize: userPicker.pageSize,
      keyword: userPicker.keyword
    });
    userPickerOptions.value = res.data?.rows || [];
    userPicker.total = res.data?.total || 0;
  } finally {
    userPicker.loading = false;
  }
};

const openUserPicker = async () => {
  pickerSelectedUser.value = selectedUser.value;
  userPicker.pageNum = 1;
  userPicker.visible = true;
  await loadUserPicker();
};

const handleUserPickerQuery = () => {
  userPicker.pageNum = 1;
  loadUserPicker();
};

const handleUserRowClick = (row: unknown) => {
  pickerSelectedUser.value = row as PersonUserOptionVO;
};

const confirmUserPicker = () => {
  if (!pickerSelectedUser.value) return;
  selectedUser.value = pickerSelectedUser.value;
  form.userId = pickerSelectedUser.value.userId;
  userPicker.visible = false;
  formRef.value?.clearValidate('userId');
};

const submitForm = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      if (dialog.mode === 'edit') {
        await updatePersonProfile(form);
        modal.msgSuccess('人员档案已更新');
      } else {
        await addPersonProfile(form);
        modal.msgSuccess('已加入当前科室');
      }
      dialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const handleDelete = async (row: unknown) => {
  const person = row as PersonProfileVO;
  endForm.leaveDate = today();
  endForm.reason = '';
  endDialog.visible = true;
  endDialog.personId = person.id;
};

const submitEnd = () => {
  endFormRef.value?.validate(async (valid) => {
    if (!valid || !endDialog.personId) return;
    buttonLoading.value = true;
    try {
      await endPersonProfile(endDialog.personId, endForm);
      modal.msgSuccess('服务关系已结束，历史数据已保留');
      endDialog.visible = false;
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const loadLeaveMembers = async () => {
  const res = await listPersonMemberOptions();
  leaveMembers.value = res.data || [];
};

const loadLeaves = async () => {
  leaveLoading.value = true;
  try {
    const res = await listPersonLeaves();
    leaves.value = res.data || [];
  } finally {
    leaveLoading.value = false;
  }
};

const openLeaveManager = async () => {
  await Promise.all([loadLeaveMembers(), loadLeaves()]);
  leaveDialog.visible = true;
};

const openLeaveForm = (row?: PersonLeaveVO) => {
  leaveFormRef.value?.resetFields();
  Object.assign(
    leaveForm,
    row
      ? {
          id: row.id,
          userId: row.userId,
          startDate: row.startDate,
          endDate: row.endDate,
          leaveType: row.leaveType || '休假',
          reason: row.reason || ''
        }
      : { id: undefined, userId: leaveMembers.value[0]?.userId, startDate: today(), endDate: today(), leaveType: '休假', reason: '' }
  );
  leaveFormDialog.visible = true;
};

const saveLeave = () => {
  leaveFormRef.value?.validate(async (valid) => {
    if (!valid) return;
    leaveSaving.value = true;
    try {
      if (leaveForm.id) {
        await updatePersonLeave(leaveForm);
      } else {
        await addPersonLeave(leaveForm);
      }
      modal.msgSuccess('休假已保存，并已自动生成工作日休假日报');
      leaveFormDialog.visible = false;
      await loadLeaves();
    } finally {
      leaveSaving.value = false;
    }
  });
};

const removeLeave = async (row: PersonLeaveVO) => {
  await modal.confirm(`确认删除 ${row.startDate} 至 ${row.endDate} 的休假安排吗？`);
  await delPersonLeave(row.id);
  modal.msgSuccess('休假安排已删除');
  await loadLeaves();
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
  .selected-user-field {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .selected-user-card {
    flex: 1;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--el-color-primary-light-5);
    border-radius: 8px;
    background: var(--el-color-primary-light-9);
  }

  .selected-user-name {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .selected-user-meta {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-picker-dialog {
    .el-form {
      margin-bottom: 4px;
    }

    .el-pagination {
      margin-top: 12px;
    }
  }

  .leave-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 14px;
    padding: 13px 16px;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
  }

  .leave-toolbar-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .leave-toolbar-text {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-user-account {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-table {
    margin-bottom: 4px;
  }

  .upload-template-link {
    margin-top: 12px;
    color: var(--el-color-primary);
    cursor: pointer;
  }
}

@media (max-width: 700px) {
  .department-person-page .leave-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
