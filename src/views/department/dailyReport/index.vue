<template>
  <div class="p-2 app-container department-daily-report-page">
    <el-card shadow="never" class="calendar-toolbar">
      <div class="toolbar-main">
        <div class="month-switcher">
          <el-button circle icon="ArrowLeft" @click="changeMonth(-1)" />
          <el-date-picker v-model="selectedMonth" type="month" value-format="YYYY-MM" placeholder="选择月份" :disabled-date="disableFutureMonth" />
          <el-button circle icon="ArrowRight" @click="changeMonth(1)" />
          <el-button plain @click="goCurrentMonth">本月</el-button>
        </div>
        <div class="toolbar-actions">
          <el-button v-hasPermi="['department:dailyReport:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增日报</el-button>
          <el-button v-hasPermi="['department:dailyReport:add']" type="warning" plain icon="Calendar" @click="openOverrideManager">日期例外</el-button>
          <el-button v-hasPermi="['department:dailyReport:export']" plain icon="Download" @click="handleExport">导出明细</el-button>
          <el-button v-hasPermi="['department:dailyReport:import']" plain icon="Upload" @click="handleImport">导入明细</el-button>
        </div>
      </div>
      <div class="toolbar-hint">日历仅展示当前科室已分配“日报”任务的成员；常规工作日由日报任务配置，临时日期安排在“日期例外”中维护，类型由数据字典配置，休假请在人事档案中维护。</div>
    </el-card>

    <el-card v-loading="loading" shadow="never" class="calendar-card mt-2">
      <template #header>
        <div class="calendar-heading">
          <div>
            <div class="panel-kicker">DEPARTMENT DAILY CALENDAR</div>
            <h3>{{ monthTitle }} 日报日历</h3>
            <p>成员：{{ calendar.members.length }} 人 · 工作日按日报任务分配计算</p>
          </div>
          <div class="legend"><span><i class="legend-dot filled" />已填</span><span><i class="legend-dot missing" />未填</span><span><i class="legend-dot leave" />休假</span><span><i class="legend-dot exception" />日期例外</span><span><i class="legend-dot rest" />休息日</span><span><i class="legend-dot unavailable" />未服务</span></div>
        </div>
      </template>

      <div class="summary-grid">
        <div class="summary-item blue"><strong>{{ calendar.requiredCount }}</strong><span>应填人天</span></div>
        <div class="summary-item green"><strong>{{ calendar.filledCount }}</strong><span>已完成人天</span></div>
        <div class="summary-item orange"><strong>{{ completionRate }}%</strong><span>完成率</span></div>
        <div class="summary-item red"><strong>{{ calendar.missingCount }}</strong><span>缺报人天</span></div>
        <div class="summary-item teal"><strong>{{ calendar.leaveCount }}</strong><span>休假日报</span></div>
      </div>

      <div v-if="calendar.futureMonth" class="empty-calendar">该月份尚未开始，日报只统计到今天。</div>
      <div v-else-if="!calendar.members.length" class="empty-calendar">当前科室暂无分配日报任务的成员，请先在人事档案纳入成员，再到任务中心分配日报任务。</div>
      <div v-else class="calendar-scroll">
        <DepartmentDataTable :data="visibleMembers" border class="calendar-table" row-key="userId">
          <el-table-column fixed label="科室成员" width="178" align="left">
            <template #default="scope"><div class="member-cell"><span class="member-name">{{ scope.row.nickName || scope.row.userName }}</span><span class="member-account">{{ scope.row.userName }}</span><span v-if="scope.row.jobTitle" class="member-title">{{ scope.row.jobTitle }}</span><span v-if="scope.row.sourceDeptName" class="member-dept">部门：{{ scope.row.sourceDeptName }}</span></div></template>
          </el-table-column>
          <el-table-column v-for="day in calendar.days" :key="day.date" :width="day.workday ? 96 : 88" align="center">
            <template #header><div class="day-header" :class="{ 'is-rest': !day.workday, 'is-exception': !!day.dayType, 'is-today': day.date === today }"><strong>{{ day.date.slice(8) }}</strong><span>周{{ day.weekLabel }}</span><em>{{ day.dayType ? dateExceptionLabel(day.dayType) : day.label }}</em></div></template>
            <template #default="scope">
              <div class="report-cell" :class="`state-${getCell(scope.row, day.date).state.toLowerCase()}`" :title="cellTitle(scope.row, getCell(scope.row, day.date), day)" @click="handleCellClick(scope.row, getCell(scope.row, day.date), day)">
                <template v-if="getCell(scope.row, day.date).state === 'FILLED'"><el-icon><Check /></el-icon><span>已填</span></template>
                <template v-else-if="getCell(scope.row, day.date).state === 'LEAVE'"><el-icon><CoffeeCup /></el-icon><span>休假</span></template>
                <template v-else-if="getCell(scope.row, day.date).state === 'EXCEPTION'"><el-icon><Calendar /></el-icon><span>{{ dateExceptionLabel(getCell(scope.row, day.date).dayType) }}</span></template>
                <template v-else-if="getCell(scope.row, day.date).state === 'MISSING'"><el-icon><Warning /></el-icon><span>未填</span></template>
                <template v-else-if="getCell(scope.row, day.date).state === 'UNAVAILABLE'"><span>—</span><small>未服务</small></template>
                <template v-else><el-icon><Minus /></el-icon><span>休息</span></template>
              </div>
            </template>
          </el-table-column>
        </DepartmentDataTable>
        <div v-if="calendar.members.length > memberPageSize" class="calendar-pagination">
          <span>共 {{ calendar.members.length }} 位成员</span>
          <el-pagination
            v-model:current-page="memberPage"
            v-model:page-size="memberPageSize"
            :page-sizes="[50, 100, 200]"
            layout="sizes, prev, pager, next"
            :total="calendar.members.length"
            background
            @size-change="handleMemberPageSizeChange"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="日报日期" prop="reportDate"><el-date-picker v-model="form.reportDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" :disabled-date="isUnavailableDate" /></el-form-item>
        <el-form-item label="今日工作" prop="todayWork"><el-input v-model="form.todayWork" type="textarea" :rows="6" maxlength="4000" show-word-limit placeholder="填写今日完成的主要工作" /></el-form-item>
        <el-form-item label="明日计划"><el-input v-model="form.tomorrowPlan" type="textarea" :rows="4" maxlength="2000" show-word-limit placeholder="填写明日计划" /></el-form-item>
        <el-form-item label="待协调事项"><el-input v-model="form.coordinationNote" type="textarea" :rows="3" maxlength="2000" show-word-limit placeholder="填写需要协调的事项或备注" /></el-form-item>
        <template v-if="form.id">
          <el-divider content-position="left">附件归档</el-divider>
          <el-upload :action="attachmentUploadUrl" :headers="globalHeaders()" :show-file-list="false" :on-success="handleAttachmentUploadSuccess" :on-error="handleAttachmentUploadError"><el-button type="primary" plain icon="Upload">上传附件</el-button></el-upload>
          <div v-if="attachments.length" class="attachment-list"><div v-for="item in attachments" :key="item.id" class="attachment-item"><el-link :href="item.url" target="_blank" type="primary">{{ item.originalName }}</el-link><el-button link type="danger" @click="handleDeleteAttachment(item)">移除归档</el-button></div></div>
          <div v-else class="attachment-empty">暂无附件</div>
        </template>
      </el-form>
      <template #footer><el-button :loading="buttonLoading" type="primary" @click="submitForm">保存日报</el-button><el-button @click="dialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="viewDialog.visible" title="日报详情" width="680px" append-to-body>
      <el-descriptions v-if="viewData" :column="1" border>
        <el-descriptions-item label="日报日期">{{ viewData.reportDate }}</el-descriptions-item>
        <el-descriptions-item label="填报人">{{ viewData.nickName || viewData.userName }}</el-descriptions-item>
        <el-descriptions-item label="今日工作"><div class="report-text">{{ viewData.todayWork }}</div></el-descriptions-item>
        <el-descriptions-item label="明日计划"><div class="report-text">{{ viewData.tomorrowPlan || '—' }}</div></el-descriptions-item>
        <el-descriptions-item label="待协调事项"><div class="report-text">{{ viewData.coordinationNote || '—' }}</div></el-descriptions-item>
        <el-descriptions-item label="来源">{{ viewData.sourceType === 'LEAVE' ? '休假自动填写' : '本人填写' }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">附件归档</el-divider>
      <div v-if="viewAttachments.length" class="attachment-list"><div v-for="item in viewAttachments" :key="item.id" class="attachment-item"><el-link :href="item.url" target="_blank" type="primary">{{ item.originalName }}</el-link></div></div>
      <div v-else class="attachment-empty">暂无附件</div>
      <template #footer><el-button v-if="viewData && isMine(viewData)" type="primary" @click="handleUpdate(viewData)">编辑日报</el-button><el-button @click="viewDialog.visible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="settingsDialog.visible" title="日期例外" width="min(980px, calc(100vw - 32px))" class="calendar-settings-dialog" append-to-body>
      <template #header>
        <div class="settings-dialog-title"><span class="settings-dialog-title-icon"><el-icon><Calendar /></el-icon></span><span class="settings-dialog-title-copy"><strong>日期例外</strong><small>临时调整日报填写规则</small></span></div>
      </template>
      <div class="settings-note"><span class="settings-note-icon"><el-icon><InfoFilled /></el-icon></span><div><strong>使用说明</strong><p>每周工作日和日报提醒由任务中心配置；本处用于临时调整指定日期是否需要填写日报。</p></div></div>

        <section class="settings-section exception-settings-section">
          <div class="settings-section-heading">
            <div>
              <div class="settings-heading-title"><h4>日期例外</h4><el-tag size="small" type="success" effect="plain">临时规则</el-tag></div>
              <p>按日期调整日报要求和适用成员</p>
            </div>
            <el-button type="primary" link icon="Plus" @click="resetOverrideForm">新增日期例外</el-button>
        </div>
        <el-form :model="overrideForm" label-position="top" class="override-form">
          <div class="override-form-row override-main-row">
            <el-form-item label="日期"><el-date-picker v-model="overrideForm.calendarDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" /></el-form-item>
            <el-form-item label="类型"><el-select v-model="overrideForm.dayType" :loading="!dm_date_exception.length" :disabled="!dm_date_exception.length" placeholder="请选择日期例外类型"><el-option v-for="item in dm_date_exception" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
            <el-form-item label="是否需要填写日报" class="report-requirement-item"><div class="report-rule-control"><el-switch v-model="overrideForm.needReport" class="report-rule-switch" size="large" inline-prompt active-text="需要" inactive-text="无需" :width="72" /><span class="report-rule-hint" :class="{ 'is-active': overrideForm.needReport }">{{ overrideForm.needReport ? '会生成日报填写要求' : '不生成日报填写要求' }}</span></div></el-form-item>
          </div>
          <div class="override-form-row override-detail-row">
            <el-form-item class="override-user" label="适用成员"><el-select v-model="selectedUserIds" multiple filterable clearable class="member-select" :disabled="!userOptions.length" placeholder="请选择成员，可多选或全选"><template #tag><span v-if="memberSelectionLabel" class="member-select-summary" :class="{ 'is-all': canManageDepartment && allUsersSelected }" :title="memberSelectionLabel">{{ memberSelectionLabel }}</span></template><template #header><el-checkbox :model-value="allUsersSelected" :indeterminate="someUsersSelected" :disabled="!userOptions.length" @change="toggleAllUsers">全选成员</el-checkbox></template><el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName || item.userName}（${item.userName}）`" :value="item.userId" /></el-select><span class="field-helper">支持多选和全选；选择框内仅显示已选人数</span></el-form-item>
            <el-form-item class="override-remark" label="说明"><el-input v-model="overrideForm.remark" placeholder="补充日期安排说明" /></el-form-item>
            <el-form-item class="override-action"><el-button type="primary" icon="Check" @click="saveOverride">保存例外</el-button></el-form-item>
          </div>
        </el-form>
        <DepartmentDataTable class="override-table" :data="overrides" border stripe size="small" max-height="260">
          <el-table-column prop="calendarDate" label="日期" width="140" align="center" />
          <el-table-column label="类型" width="160" align="center"><template #default="scope"><dict-tag :options="dm_date_exception" :value="scope.row.dayType" /></template></el-table-column>
          <el-table-column label="填写日报" width="110" align="center"><template #default="scope"><el-tag :type="scope.row.needReport ? 'success' : 'info'">{{ scope.row.needReport ? '是' : '否' }}</el-tag></template></el-table-column>
          <el-table-column label="人员范围" width="220"><template #default="scope">{{ getOverrideUserLabel(scope.row) }}</template></el-table-column>
          <el-table-column prop="remark" label="说明" show-overflow-tooltip />
          <el-table-column label="操作" width="90" align="center"><template #default="scope"><DepartmentTableActions><el-button link type="danger" @click="removeOverride(scope.row)">删除</el-button></DepartmentTableActions></template></el-table-column>
          <template #empty><div class="override-empty"><el-icon><Calendar /></el-icon><strong>暂无日期例外</strong><span>新增规则后会显示在这里</span></div></template>
        </DepartmentDataTable>
      </section>

      <template #footer>
        <div class="settings-footer"><el-button @click="settingsDialog.visible = false">关闭</el-button></div>
      </template>
    </el-dialog>

    <el-dialog v-model="upload.open" :title="upload.title" width="420px" append-to-body>
      <el-upload ref="uploadRef" drag :limit="1" accept=".xlsx,.xls" :headers="upload.headers" :action="upload.url" :auto-upload="false" :disabled="upload.isUploading" :on-progress="handleUploadProgress" :on-success="handleUploadSuccess"><el-icon class="el-icon--upload"><UploadFilled /></el-icon><div class="el-upload__text">拖拽 Excel 文件到此处，或点击上传</div><template #tip><div class="el-upload__tip">日报日期必须是工作日；每人每天只能有一条日报。</div></template></el-upload>
      <div class="upload-template-link" @click="downloadTemplate">下载导入模板</div>
      <template #footer><el-button type="primary" :loading="upload.isUploading" @click="submitUpload">开始导入</el-button><el-button @click="upload.open = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="DepartmentDailyReport" lang="ts">
import { computed, onMounted, reactive, ref, toRefs, type Ref, watch } from 'vue';
import { addDailyCalendarOverride, addDailyReport, delDailyCalendarOverride, delDailyReportAttachment, getDailyCalendar, getDailyReport, listDailyCalendarOverrides, listDailyReportAttachments, updateDailyCalendarOverride, updateDailyReport } from '@/api/department/dailyReport';
import type { DailyCalendarCellVO, DailyCalendarDayVO, DailyCalendarOverrideForm, DailyCalendarOverrideVO, DailyCalendarVO, DailyReportAttachmentVO, DailyReportForm, DailyReportVO } from '@/api/department/dailyReport/types';
import type { PersonUserOptionVO } from '@/api/department/person/types';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { useUserStore } from '@/store/modules/user';
import { download as requestDownload, globalHeaders } from '@/utils/request';
import { useDict } from '@/utils/dict';

const { loading, withLoading } = useLoading(true);
const userStore = useUserStore();
const { dm_date_exception, dm_leave_type } = toRefs<any>(useDict('dm_date_exception', 'dm_leave_type'));
const formatMonth = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const selectedMonth = ref(formatMonth(new Date()));
const calendar = reactive<DailyCalendarVO>({ month: selectedMonth.value, beginDate: '', endDate: '', workDays: '1,2,3,4,5', days: [], members: [], requiredCount: 0, filledCount: 0, missingCount: 0, leaveCount: 0, futureMonth: false });
const overrides = ref<DailyCalendarOverrideVO[]>([]);
const userOptions = ref<PersonUserOptionVO[]>([]);
const attachments = ref<DailyReportAttachmentVO[]>([]);
const viewAttachments = ref<DailyReportAttachmentVO[]>([]);
const buttonLoading = ref(false);
const formRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const today = formatDate(new Date());
const dialog = reactive({ visible: false, title: '' });
const viewDialog = reactive({ visible: false });
const viewData = ref<DailyReportVO>();
const settingsDialog = reactive({ visible: false });
const overrideForm = reactive<DailyCalendarOverrideForm>({ calendarDate: undefined, dayType: undefined, needReport: false, userId: undefined, remark: '' });
const selectedUserIds = ref<Array<string | number>>([]);
const form = reactive<DailyReportForm>({ id: undefined, reportDate: undefined, todayWork: undefined, tomorrowPlan: undefined, coordinationNote: undefined });
const memberPage = ref(1);
// 单个科室通常不超过 100 人，默认一次展示完整科室，只有更大数据量才分页。
const memberPageSize = ref(100);
const upload = reactive({ open: false, title: '导入日报', isUploading: false, headers: globalHeaders(), url: import.meta.env.VITE_APP_BASE_API + '/department/dailyReport/importData' });
const attachmentUploadUrl = computed(() => (form.id ? `${import.meta.env.VITE_APP_BASE_API}/department/dailyReport/attachment/upload/${form.id}` : ''));
const canManageDepartment = computed(() => userStore.roles?.includes('admin') || userStore.roles?.includes('superadmin') || userStore.permissions?.includes('*:*:*') || userStore.permissions?.includes('department:dailyReport:viewDept'));
const allUsersSelected = computed(() => userOptions.value.length > 0 && selectedUserIds.value.length === userOptions.value.length);
const someUsersSelected = computed(() => selectedUserIds.value.length > 0 && !allUsersSelected.value);
const memberSelectionLabel = computed(() => { if (!selectedUserIds.value.length) return ''; return canManageDepartment.value && allUsersSelected.value ? '全体成员' : `已选 ${selectedUserIds.value.length} 名成员`; });
const monthTitle = computed(() => selectedMonth.value.replace('-', '年') + '月');
const completionRate = computed(() => (calendar.requiredCount ? Math.round((calendar.filledCount / calendar.requiredCount) * 100) : 100));
const visibleMembers = computed(() => {
  const start = (memberPage.value - 1) * memberPageSize.value;
  return calendar.members.slice(start, start + memberPageSize.value);
});
const rules = { reportDate: [{ required: true, message: '日报日期不能为空', trigger: 'change' }], todayWork: [{ required: true, message: '今日工作不能为空', trigger: 'blur' }] };

const getCalendar = async () => { await withLoading(async () => { const res = await getDailyCalendar(`${selectedMonth.value}-01`); Object.assign(calendar, res.data || { days: [], members: [] }); memberPage.value = 1; }); };
const disableFutureMonth = (date: Date) => { const now = new Date(); return date > new Date(now.getFullYear(), now.getMonth(), 1); };
const changeMonth = (offset: number) => { const [year, month] = selectedMonth.value.split('-').map(Number); const nextMonth = new Date(year, month - 1 + offset, 1); if (disableFutureMonth(nextMonth)) return modal.msgWarning('日报只统计到今天，不能查看未来月份'); selectedMonth.value = formatMonth(nextMonth); memberPage.value = 1; getCalendar(); };
const goCurrentMonth = () => { selectedMonth.value = formatMonth(new Date()); memberPage.value = 1; getCalendar(); };
const handleMemberPageSizeChange = () => { memberPage.value = 1; };
const getCell = (member: any, date: string) => (member.cells || []).find((item: DailyCalendarCellVO) => item.date === date) || ({ date, state: 'REST', workday: false } as DailyCalendarCellVO);
const isUnavailableDate = (date: Date) => { const current = new Date(); if (date > current) return true; const dateText = formatDate(date); const day = calendar.days.find((item) => item.date === dateText); const currentMember = calendar.members.find((item) => String(item.userId) === String(userStore.userId)); const cell = currentMember ? getCell(currentMember, dateText) : undefined; return Boolean(cell ? !cell.workday : day && !day.workday); };
const isMine = (row: DailyReportVO) => String(row.userId) === String(userStore.userId);
const dateExceptionLabel = (value?: string) => dm_date_exception.value?.find((item: DictDataOption) => String(item.value) === String(value))?.label || value || '日期例外';
const leaveTypeLabel = (value?: string) => dm_leave_type.value?.find((item: DictDataOption) => String(item.value) === String(value))?.label || value || '休假';
const cellTitle = (member: any, cell: DailyCalendarCellVO, day: DailyCalendarDayVO) => cell.state === 'FILLED' ? `${member.nickName || member.userName}：点击查看日报` : cell.state === 'LEAVE' ? `${member.nickName || member.userName}：${leaveTypeLabel(cell.leaveType)}，点击查看自动日报` : cell.state === 'EXCEPTION' ? `${member.nickName || member.userName}：${dateExceptionLabel(cell.dayType)}，无需填写日报` : cell.state === 'MISSING' ? `${member.nickName || member.userName}：${dateExceptionLabel(cell.dayType || day.dayType) !== '日期例外' ? `${dateExceptionLabel(cell.dayType || day.dayType)}未填写日报` : `${cell.label || '工作日'}未填写日报`}` : cell.state === 'UNAVAILABLE' ? `${member.nickName || member.userName}：不在当前科室服务期内，无日报要求` : `${day.date}为${dateExceptionLabel(cell.dayType || day.dayType) !== '日期例外' ? dateExceptionLabel(cell.dayType || day.dayType) : cell.label || day.label || '休息日'}，无需填写`;
const resetReportForm = () => { Object.assign(form, { id: undefined, reportDate: undefined, todayWork: undefined, tomorrowPlan: undefined, coordinationNote: undefined }); attachments.value = []; formRef.value?.resetFields(); };
const handleAdd = (date?: string) => { resetReportForm(); form.reportDate = date || (selectedMonth.value === formatMonth(new Date()) ? today : `${selectedMonth.value}-01`); dialog.title = '新增日报'; dialog.visible = true; };
const handleCellClick = async (member: any, cell: DailyCalendarCellVO, day: DailyCalendarDayVO) => { if (cell.state === 'EXCEPTION') return; if (cell.reportId) { const row = { id: cell.reportId, reportDate: cell.date, userId: member.userId } as DailyReportVO; if (String(member.userId) === String(userStore.userId)) await handleUpdate(row); else await handleView(row); } else if (cell.state === 'MISSING') { if (String(member.userId) === String(userStore.userId)) handleAdd(day.date); else modal.msgWarning('该成员的日报需要由本人填写'); } };
const handleUpdate = async (row: DailyReportVO) => { resetReportForm(); const res = await getDailyReport(row.id); Object.assign(form, res.data); await loadAttachments(row.id, attachments); dialog.title = '编辑日报'; dialog.visible = true; viewDialog.visible = false; };
const handleView = async (row: DailyReportVO) => { const res = await getDailyReport(row.id); viewData.value = res.data; await loadAttachments(row.id, viewAttachments); viewDialog.visible = true; };
const loadAttachments = async (reportId: string | number, target: Ref<DailyReportAttachmentVO[]>) => { const res = await listDailyReportAttachments(reportId); target.value = res.data || []; };
const submitForm = () => { formRef.value?.validate(async (valid) => { if (!valid) return; buttonLoading.value = true; try { if (form.id) await updateDailyReport(form); else await addDailyReport(form); modal.msgSuccess('日报保存成功'); dialog.visible = false; await getCalendar(); } finally { buttonLoading.value = false; } }); };
const handleAttachmentUploadSuccess = (response: any) => { if (response?.data) attachments.value.push(response.data); else modal.msgError(response?.msg || '附件上传失败'); };
const handleAttachmentUploadError = () => modal.msgError('附件上传失败');
const handleDeleteAttachment = async (item: DailyReportAttachmentVO) => { await modal.confirm(`确认移除附件“${item.originalName}”的归档关系吗？`); await delDailyReportAttachment(item.id); attachments.value = attachments.value.filter((current) => current.id !== item.id); modal.msgSuccess('附件归档关系已移除'); };
const handleExport = () => requestDownload('department/dailyReport/export', { beginDate: calendar.beginDate, endDate: calendar.endDate }, `daily_report_${selectedMonth.value}.xlsx`);
const handleImport = () => { upload.open = true; upload.isUploading = false; };
const downloadTemplate = () => requestDownload('department/dailyReport/importTemplate', {}, `daily_report_template_${Date.now()}.xlsx`);
const handleUploadProgress = () => { upload.isUploading = true; };
const handleUploadSuccess = (response: any, file: any) => { upload.isUploading = false; upload.open = false; uploadRef.value?.handleRemove(file); modal.msgSuccess(response?.msg || '导入完成'); getCalendar(); };
const submitUpload = () => uploadRef.value?.submit();

const openOverrideManager = async () => { await loadUserOptions(); const res = await listDailyCalendarOverrides(calendar.beginDate, calendar.endDate); overrides.value = res.data || []; resetOverrideForm(); settingsDialog.visible = true; };
const resetOverrideForm = () => { Object.assign(overrideForm, { id: undefined, calendarDate: undefined, dayType: dm_date_exception.value?.[0]?.value || undefined, needReport: false, userId: undefined, remark: '' }); selectedUserIds.value = canManageDepartment.value ? [] : userStore.userId ? [userStore.userId] : []; };
const toggleAllUsers = (checked: boolean) => { selectedUserIds.value = checked ? userOptions.value.map((item) => item.userId) : []; };
const overrideTypeLabel = (value?: string) => dateExceptionLabel(value);
const getOverrideUserLabel = (row: any) => { if (!row.userId) return '全体成员'; const user = userOptions.value.find((item) => String(item.userId) === String(row.userId)); return user ? `${user.nickName || user.userName}（${user.userName}）` : `人员${row.userId}`; };
const saveOverride = async () => { if (!overrideForm.calendarDate) return modal.msgError('请选择日期'); if (!overrideForm.dayType) return modal.msgError('请选择日期例外类型'); if (overrideForm.needReport === undefined) return modal.msgError('请选择是否需要填写日报'); const targetUserIds = selectedUserIds.value; if (!targetUserIds.length) return modal.msgError('请选择至少一名适用成员'); const applyToAll = canManageDepartment.value && allUsersSelected.value; const payload = { ...overrideForm, userId: undefined }; if (payload.id) await updateDailyCalendarOverride({ ...payload, userId: targetUserIds[0] }); else if (applyToAll) await addDailyCalendarOverride(payload); else for (const userId of targetUserIds) await addDailyCalendarOverride({ ...payload, userId }); modal.msgSuccess(applyToAll ? '全体成员日期例外已保存' : `已为 ${targetUserIds.length} 名成员保存日期例外`); const res = await listDailyCalendarOverrides(calendar.beginDate, calendar.endDate); overrides.value = res.data || []; resetOverrideForm(); await getCalendar(); };
const removeOverride = async (row: any) => { await modal.confirm(`确认删除 ${row.calendarDate}${getOverrideUserLabel(row)}的${overrideTypeLabel(row.dayType)}规则吗？`); await delDailyCalendarOverride(row.id); overrides.value = overrides.value.filter((item) => item.id !== row.id); modal.msgSuccess('删除成功'); await getCalendar(); };

const loadUserOptions = async () => { const options = calendar.members.map((item) => ({ userId: item.userId, userName: item.userName || '', nickName: item.nickName, deptId: undefined, deptName: undefined })); userOptions.value = canManageDepartment.value ? options : options.filter((item) => String(item.userId) === String(userStore.userId)); };

watch(dm_date_exception, (options) => { if (!overrideForm.dayType && options?.length) overrideForm.dayType = options[0].value; }, { deep: true });

onMounted(getCalendar);
</script>

<style scoped lang="scss">
.department-daily-report-page {
  .calendar-toolbar, .calendar-card { border: 0; border-radius: 14px; }
  .toolbar-main, .calendar-heading, .leave-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .month-switcher, .toolbar-actions, .legend { display: flex; align-items: center; gap: 8px; }
  .toolbar-hint, .calendar-heading p { margin-top: 10px; color: var(--el-text-color-secondary); font-size: 13px; }
  .panel-kicker { color: var(--el-color-primary); font-size: 11px; letter-spacing: 1.2px; }
  .calendar-heading h3 { margin: 4px 0 0; color: var(--el-text-color-primary); }
  .legend { color: var(--el-text-color-secondary); font-size: 12px; flex-wrap: wrap; }
  .legend-dot { display: inline-block; width: 8px; height: 8px; margin-right: 4px; border-radius: 50%; }
  .legend-dot.filled { background: #67c23a; } .legend-dot.missing { background: #f56c6c; } .legend-dot.leave { background: #409eff; } .legend-dot.exception { background: #e6a23c; } .legend-dot.rest { background: #c0c4cc; } .legend-dot.unavailable { background: var(--el-text-color-placeholder); }
  .summary-grid { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .summary-item { min-height: 70px; padding: 12px 16px; background: var(--el-fill-color-light); border-left: 4px solid; border-radius: 8px; }
  .summary-item strong, .summary-item span { display: block; } .summary-item strong { font-size: 24px; line-height: 1.2; } .summary-item span { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
  .summary-item.blue { border-color: #409eff; color: #337ecc; } .summary-item.green { border-color: #67c23a; color: #529b2e; } .summary-item.orange { border-color: #e6a23c; color: #b88230; } .summary-item.red { border-color: #f56c6c; color: #c45656; } .summary-item.teal { border-color: #20a0a8; color: #198f96; }
  // 横向滚动交给 Element Plus 表格自身处理。外层再设置 overflow-x 会与表格 body-wrapper
  // 生成两根滚动条，且两根滚动条的滚动位置不同步，导致日报日期列难以操作。
  .calendar-scroll { overflow: hidden; }
  .calendar-table { width: 100%; min-width: 0; }
  .calendar-table :deep(.el-table__body-wrapper) { overflow-x: auto; }
  .calendar-pagination { display: flex; align-items: center; justify-content: flex-end; gap: 14px; margin-top: 14px; color: var(--el-text-color-secondary); font-size: 12px; }
  .calendar-pagination :deep(.el-pagination) { margin: 0; }
  .member-cell { display: flex; flex-direction: column; gap: 2px; padding: 4px 6px; text-align: left; } .member-name { font-weight: 600; } .member-account, .member-title, .member-dept { color: var(--el-text-color-secondary); font-size: 11px; } .member-dept { color: var(--el-color-warning); }
  .day-header { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 2px 0; line-height: 1.3; } .day-header strong { font-size: 14px; } .day-header span { color: var(--el-text-color-secondary); font-size: 11px; } .day-header em { color: var(--el-color-primary); font-size: 10px; font-style: normal; white-space: nowrap; }
  .day-header.is-rest { background: var(--el-fill-color); color: var(--el-text-color-secondary); } .day-header.is-rest em { color: var(--el-text-color-secondary); } .day-header.is-exception em { color: var(--el-color-warning); } .day-header.is-today { color: var(--el-color-primary); }
  .report-cell { display: flex; align-items: center; justify-content: center; gap: 3px; min-height: 46px; margin: -7px; cursor: pointer; font-size: 12px; transition: background .15s; } .report-cell:hover { background: var(--el-fill-color-light); } .report-cell.state-filled { color: #529b2e; } .report-cell.state-leave { color: #337ecc; } .report-cell.state-exception { color: #b88230; background: #fdf6ec; cursor: default; } .report-cell.state-missing { color: #c45656; background: #fef0f0; } .report-cell.state-rest { color: #a8abb2; background: var(--el-fill-color-lighter); cursor: default; } .report-cell.state-unavailable { flex-direction: column; gap: 0; color: var(--el-text-color-placeholder); background: transparent; cursor: default; } .report-cell.state-unavailable small { font-size: 10px; line-height: 1.2; }
  .empty-calendar { padding: 70px 0; color: var(--el-text-color-secondary); text-align: center; }
  .settings-dialog-title { display: flex; align-items: center; gap: 10px; }
  .settings-dialog-title-icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 10px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-size: 18px; }
  .settings-dialog-title-copy { display: flex; flex-direction: column; gap: 2px; }
  .settings-dialog-title-copy strong { color: var(--el-text-color-primary); font-size: 16px; line-height: 22px; }
  .settings-dialog-title-copy small { color: var(--el-text-color-secondary); font-size: 11px; line-height: 16px; }
  .settings-note { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; padding: 12px 14px; border: 1px solid var(--el-color-primary-light-8); border-left: 3px solid var(--el-color-primary); border-radius: 10px; background: var(--el-color-primary-light-9); }
  .settings-note-icon { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 22px; height: 22px; color: var(--el-color-primary); font-size: 16px; }
  .settings-note strong { display: block; color: var(--el-text-color-primary); font-size: 12px; line-height: 18px; }
  .settings-note p { margin: 1px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 18px; }
  .settings-section { padding: 16px 18px; border: 1px solid var(--el-border-color-lighter); border-radius: 14px; background: var(--el-bg-color); box-shadow: 0 4px 16px rgb(15 23 42 / 3%); }
  .settings-section + .settings-section { margin-top: 14px; }
  .settings-section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
  .settings-heading-title { display: flex; align-items: center; gap: 8px; }
  .settings-section-heading h4 { margin: 0; color: var(--el-text-color-primary); font-size: 16px; line-height: 22px; }
  .settings-section-heading p { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 18px; }
  .override-form { padding: 8px 0 2px; background: transparent; }
  .override-form-row { display: grid; gap: 10px 16px; align-items: start; }
  .override-main-row { grid-template-columns: minmax(160px, .85fr) minmax(180px, 1fr) minmax(250px, 1.25fr); }
  .override-detail-row { grid-template-columns: minmax(250px, .9fr) minmax(280px, 1.7fr) auto; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--el-border-color-extra-light); }
  .override-form-row .el-form-item { min-width: 0; margin-bottom: 0; }
  .override-form-row .el-form-item__label { padding-bottom: 6px; color: var(--el-text-color-regular); font-size: 12px; font-weight: 600; line-height: 18px; }
  .override-form-row .el-date-editor, .override-form-row .el-select, .override-form-row .el-input { width: 100% !important; }
  .report-rule-control { display: flex; align-items: center; gap: 10px; min-height: 32px; }
  .report-rule-switch { flex: 0 0 auto; }
  .report-rule-hint { color: var(--el-text-color-secondary); font-size: 12px; white-space: nowrap; }
  .report-rule-hint.is-active { color: var(--el-color-primary); }
  .member-select-summary { display: inline-flex; align-items: center; max-width: calc(100% - 8px); height: 24px; padding: 0 10px; overflow: hidden; border-radius: 6px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-size: 12px; font-weight: 500; line-height: 24px; text-overflow: ellipsis; white-space: nowrap; }
  .member-select-summary.is-all { background: var(--el-color-success-light-9); color: var(--el-color-success); }
  .field-helper { display: block; margin-top: 5px; color: var(--el-text-color-secondary); font-size: 11px; line-height: 16px; }
  .override-action { align-self: end; justify-self: end; }
  .override-action .el-button { min-width: 118px; }
  .override-table { margin-top: 14px; overflow: hidden; border-radius: 10px; }
  .override-table :deep(.el-table__header th) { background: var(--tableHeaderBg, var(--el-fill-color-lighter)); color: var(--tableHeaderTextColor, var(--el-text-color-regular)); font-weight: 600; }
  .override-empty { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 92px; color: var(--el-text-color-secondary); }
  .override-empty .el-icon { color: var(--el-color-primary-light-3); font-size: 22px; }
  .override-empty strong { color: var(--el-text-color-regular); font-size: 13px; font-weight: 500; }
  .override-empty span { font-size: 12px; }
  .settings-footer { display: flex; justify-content: flex-end; gap: 10px; }
  .leave-toolbar { margin-bottom: 12px; color: var(--el-text-color-secondary); font-size: 13px; }
  .report-text { white-space: pre-wrap; line-height: 1.7; } .attachment-list { margin-top: 12px; } .attachment-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--el-border-color-lighter); } .attachment-empty { margin-top: 10px; color: var(--el-text-color-secondary); font-size: 13px; } .upload-template-link { margin-top: 12px; color: var(--el-color-primary); cursor: pointer; }
  @media (max-width: 900px) { .toolbar-main, .calendar-heading { align-items: flex-start; flex-direction: column; } .summary-grid { grid-template-columns: repeat(2, 1fr); } .toolbar-actions { flex-wrap: wrap; } .calendar-pagination { align-items: flex-end; flex-direction: column; } }
  @media (max-width: 760px) { .override-main-row, .override-detail-row { grid-template-columns: 1fr; } .override-detail-row { margin-top: 10px; } .override-action { justify-self: start; } }
}
</style>

<style lang="scss">
.calendar-settings-dialog {
  --tableHeaderBg: var(--el-fill-color-lighter);
  --tableHeaderTextColor: var(--el-text-color-regular);

  &.el-dialog {
    overflow: hidden;
    border-radius: 14px;
  }

  .el-dialog__header {
    margin-right: 0;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  .el-dialog__body {
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    padding: 18px 24px 12px;
    background: var(--el-bg-color-page);
  }

  .el-dialog__footer {
    padding: 14px 24px 18px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .settings-dialog-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .settings-dialog-title-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 18px;
  }

  .settings-dialog-title-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .settings-dialog-title-copy strong {
    color: var(--el-text-color-primary);
    font-size: 16px;
    line-height: 22px;
  }

  .settings-dialog-title-copy small {
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 16px;
  }

  .settings-note {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
    padding: 12px 14px;
    border: 1px solid var(--el-color-primary-light-8);
    border-left: 3px solid var(--el-color-primary);
    border-radius: 10px;
    background: var(--el-color-primary-light-9);
  }

  .settings-note-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    color: var(--el-color-primary);
    font-size: 16px;
  }

  .settings-note strong {
    display: block;
    color: var(--el-text-color-primary);
    font-size: 12px;
    line-height: 18px;
  }

  .settings-note p {
    margin: 1px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  .settings-section {
    padding: 16px 18px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-bg-color);
    box-shadow: 0 4px 16px rgb(15 23 42 / 3%);
  }

  .settings-section + .settings-section {
    margin-top: 14px;
  }

  .settings-section-heading {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
    padding-left: 12px;
  }

  .settings-heading-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .settings-section-heading::before {
    position: absolute;
    top: 2px;
    left: 0;
    width: 4px;
    height: 18px;
    border-radius: 2px;
    background: var(--el-color-primary);
    content: '';
  }

  .exception-settings-section .settings-section-heading::before {
    background: var(--el-color-success);
  }

  .settings-section-heading h4 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 16px;
    line-height: 22px;
  }

  .settings-section-heading p {
    margin: 3px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  .override-form {
    padding: 8px 0 2px;
    background: transparent;
  }

  .override-form-row {
    display: grid;
    gap: 10px 16px;
    align-items: start;
  }

  .override-main-row {
    grid-template-columns: minmax(160px, .85fr) minmax(180px, 1fr) minmax(250px, 1.25fr);
  }

  .override-detail-row {
    grid-template-columns: minmax(250px, .9fr) minmax(280px, 1.7fr) auto;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-extra-light);
  }

  .override-form-row .el-form-item {
    min-width: 0;
    margin-bottom: 0;
  }

  .override-form-row .el-form-item__label {
    padding-bottom: 6px;
    color: var(--el-text-color-regular);
    font-size: 12px;
    font-weight: 600;
    line-height: 18px;
  }

  .override-form-row .el-date-editor,
  .override-form-row .el-select,
  .override-form-row .el-input {
    width: 100% !important;
  }

  .report-rule-control {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 32px;
  }

  .report-rule-switch {
    flex: 0 0 auto;
  }

  .report-rule-hint {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    white-space: nowrap;
  }

  .report-rule-hint.is-active {
    color: var(--el-color-primary);
  }

  .member-select-summary {
    display: inline-flex;
    align-items: center;
    max-width: calc(100% - 8px);
    height: 24px;
    padding: 0 10px;
    overflow: hidden;
    border-radius: 6px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-size: 12px;
    font-weight: 500;
    line-height: 24px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .member-select-summary.is-all {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }

  .field-helper {
    display: block;
    margin-top: 5px;
    color: var(--el-text-color-secondary);
    font-size: 11px;
    line-height: 16px;
  }

  .override-action {
    align-self: end;
    justify-self: end;
  }

  .override-action .el-button {
    min-width: 118px;
  }

  .override-table {
    margin-top: 12px;
    overflow: hidden;
    border-radius: 10px;
  }

  .override-table .el-table__header th {
    background: var(--tableHeaderBg);
    color: var(--tableHeaderTextColor);
    font-weight: 600;
  }

  .override-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 92px;
    color: var(--el-text-color-secondary);
  }

  .override-empty .el-icon {
    color: var(--el-color-primary-light-3);
    font-size: 22px;
  }

  .override-empty strong {
    color: var(--el-text-color-regular);
    font-size: 13px;
    font-weight: 500;
  }

  .override-empty span {
    font-size: 12px;
  }

  .settings-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

html.dark .calendar-settings-dialog {
  --tableHeaderBg: #18263a;
  --tableHeaderTextColor: #c2d0e4;

  .el-dialog__body {
    background: #0d1727;
  }

  .settings-note {
    border-color: rgba(56, 168, 242, 0.32);
    background: rgba(56, 168, 242, 0.12);
  }

  .settings-note strong {
    color: #d8ecff;
  }

  .settings-section {
    border-color: rgba(71, 85, 105, 0.62);
    background: #111c2d;
    box-shadow: 0 4px 18px rgb(0 0 0 / 18%);
  }

  .override-detail-row {
    border-top-color: rgba(71, 85, 105, 0.52);
  }

  .override-table .el-table__header th {
    background: var(--tableHeaderBg) !important;
    color: var(--tableHeaderTextColor) !important;
  }
}

@media (max-width: 760px) {
  .calendar-settings-dialog {
    .override-main-row,
    .override-detail-row {
      grid-template-columns: 1fr;
    }

    .override-detail-row {
      margin-top: 10px;
    }

    .override-action {
      justify-self: start;
    }
  }
}

.leave-manager-dialog {
  &.el-dialog {
    overflow: hidden;
    border-radius: 14px;
  }

  .el-dialog__header {
    margin-right: 0;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__body {
    max-height: calc(100vh - 260px);
    overflow-y: auto;
    padding: 18px 24px 14px;
  }

  .el-dialog__footer {
    padding: 14px 24px 18px;
    border-top: 1px solid var(--el-border-color-lighter);
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

  .leave-toolbar-copy {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .leave-toolbar-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
  }

  .leave-toolbar-text {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  .leave-table {
    overflow: hidden;
    border-radius: 10px;
  }

  .leave-table .el-table__header th {
    background: var(--el-fill-color-lighter);
    color: var(--el-text-color-regular);
    font-weight: 600;
  }

  .leave-dialog-footer {
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 760px) {
  .leave-manager-dialog {
    .leave-toolbar {
      align-items: stretch;
      flex-direction: column;
      gap: 12px;
    }

    .leave-toolbar .el-button {
      align-self: flex-start;
    }
  }
}
</style>
