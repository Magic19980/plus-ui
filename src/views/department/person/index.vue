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
            <div v-if="selectedUsers.length" class="selected-user-list">
              <div v-for="user in selectedUsers" :key="String(user.userId)" class="selected-user-card">
                <div class="selected-user-card-main">
                  <div class="selected-user-name">{{ user.nickName || user.userName }}</div>
                  <div class="selected-user-meta">
                    {{ user.userName }} · {{ user.deptName || '未分配部门' }}
                    <span v-if="user.employeeNo"> · 工号 {{ user.employeeNo }}</span>
                  </div>
                </div>
                <el-button
                  v-if="dialog.mode === 'add'"
                  link
                  type="danger"
                  icon="Close"
                  title="移除"
                  @click="removeSelectedUser(user.userId)"
                />
              </div>
            </div>
            <el-button v-if="dialog.mode === 'add' && !selectedUsers.length" type="primary" plain icon="Search" @click="openUserPicker">选择系统用户</el-button>
            <el-button v-if="dialog.mode === 'add' && selectedUsers.length" link type="primary" @click="openUserPicker">重新选择</el-button>
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

    <el-dialog v-model="leaveDialog.visible" title="人员休假安排" width="900px" class="leave-manager-dialog" append-to-body>
      <div class="leave-dialog-summary">
        <div class="leave-dialog-summary-main">
          <div class="leave-dialog-summary-icon"><el-icon><Calendar /></el-icon></div>
          <div>
            <div class="leave-dialog-summary-title">维护科室成员休假</div>
            <div class="leave-dialog-summary-text">休假期间，工作日自动生成“休假”日报；周末及休息日无需填写。</div>
          </div>
        </div>
        <div class="leave-dialog-summary-actions">
          <span class="leave-record-count">{{ leaves.length }} 条记录</span>
          <el-button v-hasPermi="['department:person:add']" type="primary" icon="Plus" @click="openLeaveForm()">新增休假</el-button>
        </div>
      </div>

      <div class="leave-dialog-hint">
        <el-icon><InfoFilled /></el-icon>
        <span>休假日期包含开始日和结束日；保存后会自动补齐对应工作日的休假日报。</span>
      </div>

      <div v-if="leaves.length" v-loading="leaveLoading" class="leave-table-shell">
        <el-table :data="leaves" border size="small" class="leave-table">
          <el-table-column label="人员" min-width="180">
            <template #default="scope">{{ scope.row.nickName || scope.row.userName }}<span class="leave-user-account">（{{ scope.row.userName }}）</span></template>
          </el-table-column>
          <el-table-column label="休假日期" width="230" align="center"><template #default="scope">{{ scope.row.startDate }} 至 {{ scope.row.endDate }}</template></el-table-column>
          <el-table-column prop="leaveType" label="类型" width="120" align="center" />
          <el-table-column prop="reason" label="说明" min-width="220" show-overflow-tooltip />
          <el-table-column label="操作" width="140" align="center">
            <template #default="scope">
              <el-button v-hasPermi="['department:person:edit']" link type="primary" @click="openLeaveForm(scope.row)">编辑</el-button>
              <el-button v-hasPermi="['department:person:remove']" link type="danger" @click="removeLeave(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else v-loading="leaveLoading" class="leave-empty-state">
        <div class="leave-empty-icon"><el-icon><Calendar /></el-icon></div>
        <div class="leave-empty-title">暂无休假安排</div>
        <div class="leave-empty-text">为科室成员新增休假后，系统会自动生成对应的休假日报。</div>
        <el-button v-hasPermi="['department:person:add']" type="primary" plain icon="Plus" @click="openLeaveForm()">新增第一条休假</el-button>
      </div>
      <template #footer>
        <div class="leave-dialog-footer">
          <span>休假记录仅影响日报生成，不会删除历史数据。</span>
          <el-button @click="leaveDialog.visible = false">关闭</el-button>
        </div>
      </template>
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

    <el-dialog v-model="userPicker.visible" title="选择系统用户" width="min(980px, calc(100vw - 32px))" class="person-user-picker-dialog" append-to-body>
      <div class="user-picker-dialog">
        <el-form :inline="true" @submit.prevent="handleUserPickerQuery">
          <el-form-item label="搜索人员">
            <el-input
              v-model="userPicker.keyword"
              clearable
              placeholder="账号、姓名或工号"
              style="width: 260px"
              @keyup.enter="handleUserPickerQuery"
            />
          </el-form-item>
          <el-form-item label="所属部门">
            <DeptTreeSelect
              v-model="userPicker.deptId"
              :data="deptOptions"
              check-strictly
              clearable
              placeholder="全部部门"
              style="width: 230px"
              @change="handleUserPickerQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleUserPickerQuery">查询</el-button>
          </el-form-item>
        </el-form>
        <div class="user-picker-selection">
          <div class="user-picker-selection-heading">
            <span>已选用户</span>
            <el-tag type="primary" size="small">{{ pickerSelectedUsers.length }} 人</el-tag>
            <el-button v-if="pickerSelectedUsers.length" link type="primary" @click="clearPickerSelection">清空</el-button>
          </div>
          <div v-if="pickerSelectedUsers.length" class="user-picker-selection-tags">
            <el-tag v-for="user in pickerSelectedUsers" :key="String(user.userId)" closable @close="removePickerUser(user.userId)">
              {{ user.nickName || user.userName }}（{{ user.userName }}）
            </el-tag>
          </div>
          <span v-else class="user-picker-selection-empty">请从下方列表勾选需要纳入当前科室的人员，可跨页保留选择</span>
        </div>
        <el-table
          v-loading="userPicker.loading"
          :data="userPickerOptions"
          row-key="userId"
          highlight-current-row
          @row-click="handleUserRowClick"
        >
          <template #empty><empty-state description="没有可加入当前科室的系统用户" /></template>
          <el-table-column width="58" align="center">
            <template #header>
              <el-checkbox
                :model-value="isPickerPageAllSelected"
                :indeterminate="isPickerPageIndeterminate"
                @change="togglePickerPage"
              />
            </template>
            <template #default="scope">
              <el-checkbox
                :model-value="isPickerUserSelected(scope.row)"
                @click.stop
                @change="handlePickerCheckboxChange(scope.row, $event)"
              />
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
        <div class="user-picker-footer-summary">已选择 {{ pickerSelectedUsers.length }} 人，翻页或筛选不会清除已选项</div>
        <el-button type="primary" :disabled="!pickerSelectedUsers.length" @click="confirmUserPicker">确定选择</el-button>
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
import { computed, onMounted, reactive, ref } from 'vue';
import {
  addPersonProfiles,
  addPersonLeave,
  endPersonProfile,
  delPersonLeave,
  listPersonProfile,
  listPersonLeaves,
  listPersonMemberOptions,
  listPersonUserOptionDeptTree,
  listPersonUserOptionsPage,
  updatePersonLeave,
  updatePersonProfile
} from '@/api/department/person';
import type {
  PersonLeaveForm,
  PersonLeaveVO,
  PersonProfileBatchForm,
  PersonProfileForm,
  PersonProfileQuery,
  PersonProfileVO,
  PersonUserOptionQuery,
  PersonUserOptionVO
} from '@/api/department/person/types';
import type { DeptTreeVO } from '@/api/system/dept/types';
import DeptTreeSelect from '@/components/DeptTreeSelect/index.vue';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { download as requestDownload, globalHeaders } from '@/utils/request';

const { loading, withLoading } = useLoading(true);
const personList = ref<PersonProfileVO[]>([]);
const userPickerOptions = ref<PersonUserOptionVO[]>([]);
const selectedUsers = ref<PersonUserOptionVO[]>([]);
const pickerSelectedUsers = ref<PersonUserOptionVO[]>([]);
const deptOptions = ref<DeptTreeVO[]>([]);
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
  keyword: undefined,
  deptId: undefined
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
  Object.assign(form, { id: undefined, userId: undefined, userIds: undefined, joinDate: undefined, memberType: 'FULL', leaveDate: undefined, remark: '' });
  selectedUsers.value = [];
  pickerSelectedUsers.value = [];
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
    userIds: undefined,
    joinDate: person.joinDate,
    leaveDate: person.leaveDate,
    memberType: person.memberType || 'FULL',
    remark: person.remark || ''
  });
  selectedUsers.value = [{
    userId: person.userId,
    userName: person.userName || '',
    nickName: person.nickName,
    deptName: person.deptName,
    employeeNo: person.employeeNo
  }];
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
      keyword: userPicker.keyword,
      deptId: userPicker.deptId
    });
    userPickerOptions.value = res.data?.rows || [];
    userPicker.total = res.data?.total || 0;
  } finally {
    userPicker.loading = false;
  }
};

const loadDeptOptions = async () => {
  const res = await listPersonUserOptionDeptTree();
  deptOptions.value = res.data || [];
};

const userKey = (user: PersonUserOptionVO) => String(user.userId);

const isPickerUserSelected = (user: PersonUserOptionVO) => {
  return pickerSelectedUsers.value.some(item => userKey(item) === userKey(user));
};

const isPickerPageAllSelected = computed(() => {
  return userPickerOptions.value.length > 0 && userPickerOptions.value.every(isPickerUserSelected);
});

const isPickerPageIndeterminate = computed(() => {
  const selectedCount = userPickerOptions.value.filter(isPickerUserSelected).length;
  return selectedCount > 0 && selectedCount < userPickerOptions.value.length;
});

const openUserPicker = async () => {
  pickerSelectedUsers.value = [...selectedUsers.value];
  userPicker.pageNum = 1;
  userPicker.keyword = undefined;
  userPicker.deptId = undefined;
  userPicker.visible = true;
  await Promise.all([loadDeptOptions(), loadUserPicker()]);
};

const handleUserPickerQuery = () => {
  userPicker.pageNum = 1;
  loadUserPicker();
};

const removePickerUser = (userId: string | number) => {
  pickerSelectedUsers.value = pickerSelectedUsers.value.filter(user => userKey(user) !== String(userId));
};

const clearPickerSelection = () => {
  pickerSelectedUsers.value = [];
};

const togglePickerUser = (row: PersonUserOptionVO, checked?: boolean) => {
  const exists = isPickerUserSelected(row);
  const shouldSelect = checked === undefined ? !exists : checked;
  if (shouldSelect && !exists) {
    pickerSelectedUsers.value.push(row);
  } else if (!shouldSelect && exists) {
    removePickerUser(row.userId);
  }
};

const handlePickerCheckboxChange = (row: PersonUserOptionVO, checked: boolean | string | number) => {
  togglePickerUser(row, Boolean(checked));
};

const handleUserRowClick = (row: unknown) => {
  togglePickerUser(row as PersonUserOptionVO);
};

const togglePickerPage = (checked: boolean) => {
  userPickerOptions.value.forEach(row => togglePickerUser(row, checked));
};

const confirmUserPicker = () => {
  if (!pickerSelectedUsers.value.length) return;
  selectedUsers.value = [...pickerSelectedUsers.value];
  form.userId = pickerSelectedUsers.value[0].userId;
  form.userIds = pickerSelectedUsers.value.map(user => user.userId);
  userPicker.visible = false;
  formRef.value?.clearValidate('userId');
};

const removeSelectedUser = (userId: string | number) => {
  selectedUsers.value = selectedUsers.value.filter(user => userKey(user) !== String(userId));
  form.userIds = selectedUsers.value.map(user => user.userId);
  form.userId = selectedUsers.value[0]?.userId;
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
        const batchForm: PersonProfileBatchForm = {
          userIds: selectedUsers.value.map(user => user.userId),
          joinDate: form.joinDate,
          leaveDate: form.leaveDate,
          memberType: form.memberType,
          remark: form.remark
        };
        await addPersonProfiles(batchForm);
        modal.msgSuccess(`已加入当前科室（${batchForm.userIds.length}人）`);
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

  .selected-user-list {
    display: flex;
    flex: 1;
    min-width: 0;
    max-height: 190px;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
  }

  .selected-user-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
    padding: 10px 12px;
    border: 1px solid var(--el-color-primary-light-5);
    border-radius: 8px;
    background: var(--el-color-primary-light-9);
  }

  .selected-user-card-main {
    min-width: 0;
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

  .leave-dialog-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 14px 16px;
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 12px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-blank));
  }

  .leave-dialog-summary-main,
  .leave-dialog-summary-actions,
  .leave-dialog-footer {
    display: flex;
    align-items: center;
  }

  .leave-dialog-summary-main {
    min-width: 0;
    gap: 12px;
  }

  .leave-dialog-summary-icon {
    display: flex;
    flex: 0 0 36px;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
    font-size: 20px;
  }

  .leave-dialog-summary-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .leave-dialog-summary-text {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-dialog-summary-actions {
    flex: 0 0 auto;
    gap: 12px;
  }

  .leave-record-count {
    padding: 5px 10px;
    border-radius: 999px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-blank);
    font-size: 12px;
    white-space: nowrap;
  }

  .leave-dialog-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 14px 2px 12px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-dialog-hint .el-icon {
    color: var(--el-color-primary);
  }

  .leave-table-shell {
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .leave-user-account {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-table {
    width: 100%;

    :deep(.el-table__header th) {
      background: var(--el-fill-color-lighter);
      color: var(--el-text-color-secondary);
      font-weight: 600;
    }

    :deep(.el-table__cell) {
      padding: 11px 0;
    }
  }

  .leave-empty-state {
    display: flex;
    min-height: 220px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
  }

  .leave-empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    margin-bottom: 2px;
    border-radius: 50%;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    font-size: 25px;
  }

  .leave-empty-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .leave-empty-text {
    margin-bottom: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-dialog-footer {
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .upload-template-link {
    margin-top: 12px;
    color: var(--el-color-primary);
    cursor: pointer;
  }
}

@media (max-width: 700px) {
  .department-person-page .leave-dialog-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .department-person-page .leave-dialog-summary-actions,
  .department-person-page .leave-dialog-footer {
    width: 100%;
  }

  .department-person-page .leave-dialog-summary-actions {
    justify-content: space-between;
  }

  .department-person-page .leave-dialog-footer {
    align-items: flex-end;
    flex-direction: column;
  }
}
</style>

<style lang="scss">
/* el-dialog 使用 append-to-body 后不再处于页面组件作用域内，弹窗样式需要单独作用于全局弹窗节点。 */
.leave-manager-dialog {
  .el-dialog__body {
    padding: 18px 24px 12px;
  }

  .el-dialog__footer {
    padding: 14px 24px 20px;
  }

  .leave-dialog-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 14px 16px;
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 12px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-blank));
  }

  .leave-dialog-summary-main,
  .leave-dialog-summary-actions,
  .leave-dialog-footer {
    display: flex;
    align-items: center;
  }

  .leave-dialog-summary-main {
    min-width: 0;
    gap: 12px;
  }

  .leave-dialog-summary-icon {
    display: flex;
    flex: 0 0 36px;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-8);
    font-size: 20px;
  }

  .leave-dialog-summary-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .leave-dialog-summary-text {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-dialog-summary-actions {
    flex: 0 0 auto;
    gap: 12px;
  }

  .leave-record-count {
    padding: 5px 10px;
    border-radius: 999px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-blank);
    font-size: 12px;
    white-space: nowrap;
  }

  .leave-dialog-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 14px 2px 12px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-dialog-hint .el-icon {
    color: var(--el-color-primary);
  }

  .leave-table-shell {
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
  }

  .leave-table {
    width: 100%;

    .el-table__header th {
      background: var(--el-fill-color-lighter);
      color: var(--el-text-color-secondary);
      font-weight: 600;
    }

    .el-table__cell {
      padding: 11px 0;
    }
  }

  .leave-user-account {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-empty-state {
    display: flex;
    min-height: 220px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-fill-color-lighter);
  }

  .leave-empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    margin-bottom: 2px;
    border-radius: 50%;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    font-size: 25px;
  }

  .leave-empty-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
  }

  .leave-empty-text {
    margin-bottom: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .leave-dialog-footer {
    justify-content: space-between;
    gap: 16px;
    width: 100%;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.person-user-picker-dialog {
  .el-dialog__body {
    padding: 18px 24px 12px;
  }

  .el-dialog__footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px 20px;
  }

  .user-picker-dialog {
    .el-form {
      margin-bottom: 14px;
      padding: 14px 16px 2px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 10px;
      background: var(--el-fill-color-lighter);
    }

    .el-form-item {
      margin-bottom: 12px;
    }

    .user-picker-selection {
      margin-bottom: 12px;
      padding: 12px 14px;
      border: 1px solid var(--el-color-primary-light-8);
      border-radius: 10px;
      background: var(--el-color-primary-light-9);
    }

    .user-picker-selection-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--el-text-color-primary);
      font-size: 13px;
      font-weight: 600;
    }

    .user-picker-selection-heading .el-button {
      margin-left: auto;
    }

    .user-picker-selection-tags {
      display: flex;
      max-height: 72px;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 9px;
      overflow-y: auto;
    }

    .user-picker-selection-empty {
      display: block;
      margin-top: 7px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .el-table {
      .el-table__header th {
        background: var(--el-fill-color-lighter);
        color: var(--el-text-color-secondary);
        font-weight: 600;
      }

      .el-table__cell {
        padding: 10px 0;
      }
    }

    .el-pagination {
      margin-top: 12px;
    }
  }

  .user-picker-footer-summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 700px) {
  .person-user-picker-dialog {
    width: calc(100% - 24px) !important;

    .el-dialog__footer {
      flex-wrap: wrap;
    }

    .user-picker-footer-summary {
      flex-basis: 100%;
      order: 3;
      text-align: left;
    }
  }
}

@media (max-width: 700px) {
  .leave-manager-dialog {
    width: calc(100% - 24px) !important;

    .leave-dialog-summary {
      align-items: flex-start;
      flex-direction: column;
    }

    .leave-dialog-summary-actions,
    .leave-dialog-footer {
      width: 100%;
    }

    .leave-dialog-summary-actions {
      justify-content: space-between;
    }

    .leave-dialog-footer {
      align-items: flex-end;
      flex-direction: column;
    }
  }
}
</style>
