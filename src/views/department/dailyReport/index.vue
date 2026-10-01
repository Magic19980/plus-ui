<template>
  <div class="p-2 app-container department-daily-report-page">
    <UiCard shadow="never" class="calendar-toolbar">
      <div class="toolbar-main">
        <div class="toolbar-period">
          <div class="toolbar-period-copy">
            <span class="toolbar-period-icon" aria-hidden="true"><el-icon><Calendar /></el-icon></span>
            <div>
              <strong>日报周期</strong>
              <small>按月查看填写进度</small>
            </div>
          </div>
          <div class="month-switcher">
            <UiButton class="month-nav-button" circle icon="ArrowLeft" aria-label="上个月" @click="changeMonth(-1)" />
            <div class="month-picker-shell">
              <UiDatePicker v-model="selectedMonth" type="month" value-format="YYYY-MM" placeholder="选择月份" :disabled-date="disableFutureMonth" />
            </div>
            <UiButton class="month-nav-button" circle icon="ArrowRight" aria-label="下个月" @click="changeMonth(1)" />
            <UiButton class="current-month-button" plain @click="goCurrentMonth">本月</UiButton>
          </div>
        </div>
        <div class="toolbar-actions">
          <UiButton v-hasPermi="['department:dailyReport:add']" type="primary" plain icon="Plus" @click="handleAdd()">新增日报</UiButton>
          <UiButton v-hasPermi="['department:dailyReport:add']" type="warning" plain icon="Calendar" @click="openOverrideManager">日期例外</UiButton>
          <UiButton v-hasPermi="['department:dailyReport:export']" plain icon="Download" @click="handleExport">导出明细</UiButton>
          <UiButton v-hasPermi="['department:dailyReport:import']" plain icon="Upload" @click="handleImport">导入明细</UiButton>
        </div>
      </div>
      <div class="toolbar-hint">
        <span class="toolbar-hint-icon" aria-hidden="true"><el-icon><InfoFilled /></el-icon></span>
        <span>日历仅展示当前科室已分配“日报”任务的成员；常规工作日由日报任务配置，临时日期安排在“日期例外”中维护，类型由数据字典配置，休假请在人事档案中维护。</span>
      </div>
    </UiCard>

    <UiCard v-loading="loading" shadow="never" class="calendar-card mt-2">
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
          <UiPagination
            :page="memberPage"
            :limit="memberPageSize"
            :total="calendar.members.length"
            :page-size-options="[50, 100, 200]"
            :show-quick-jumper="false"
            @update:page="handleMemberPageChange"
            @update:limit="handleMemberPageSizeChange"
          />
        </div>
      </div>
    </UiCard>

    <UiDialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body :show-footer="true">
      <template #header>
        <div class="report-dialog-title">
          <span class="report-dialog-title-icon" aria-hidden="true"><el-icon><Calendar /></el-icon></span>
          <span class="report-dialog-title-copy">
            <strong>{{ dialog.title }}</strong>
            <small>{{ dialog.title === '新增日报' ? '记录今日工作，安排明日计划' : '补充并更新日报记录' }}</small>
          </span>
        </div>
      </template>
      <el-form ref="formRef" class="daily-report-form" :model="form" :rules="rules" label-width="110px">
        <el-form-item class="report-date-field" label="日报日期" prop="reportDate"><UiDatePicker v-model="form.reportDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" :disabled-date="isUnavailableDate" /></el-form-item>
        <el-form-item class="report-field report-field--primary" label="今日工作" prop="todayWork"><UiTextarea v-model="form.todayWork" :rows="6" :maxlength="4000" show-word-limit placeholder="填写今日完成的主要工作" /></el-form-item>
        <el-form-item class="report-field" label="明日计划"><UiTextarea v-model="form.tomorrowPlan" :rows="4" :maxlength="2000" show-word-limit placeholder="填写明日计划" /></el-form-item>
        <el-form-item class="report-field" label="待协调事项"><UiTextarea v-model="form.coordinationNote" :rows="3" :maxlength="2000" show-word-limit placeholder="填写需要协调的事项或备注" /></el-form-item>
        <template v-if="form.id">
          <el-divider content-position="left">附件归档</el-divider>
          <UiUpload :action="attachmentUploadUrl" :headers="globalHeaders()" :show-file-list="false" :on-success="handleAttachmentUploadSuccess" :on-error="handleAttachmentUploadError"><UiButton type="primary" plain icon="Upload">上传附件</UiButton></UiUpload>
          <div v-if="attachments.length" class="attachment-list"><div v-for="item in attachments" :key="item.id" class="attachment-item"><el-link :href="item.url" target="_blank" type="primary">{{ item.originalName }}</el-link><UiButton link type="danger" @click="handleDeleteAttachment(item)">移除归档</UiButton></div></div>
          <div v-else class="attachment-empty">暂无附件</div>
        </template>
      </el-form>
      <template #footer><div class="report-dialog-footer"><UiButton :loading="buttonLoading" type="primary" @click="submitForm">保存日报</UiButton><UiButton @click="dialog.visible = false">取消</UiButton></div></template>
    </UiDialog>

    <UiDialog v-model="viewDialog.visible" title="日报详情" width="680px" append-to-body :show-footer="true">
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
      <template #footer><UiButton v-if="viewData && isMine(viewData)" type="primary" @click="handleUpdate(viewData)">编辑日报</UiButton><UiButton @click="viewDialog.visible = false">关闭</UiButton></template>
    </UiDialog>

    <UiDialog v-model="settingsDialog.visible" title="日期例外规则" width="920px" class="calendar-settings-dialog" append-to-body :show-footer="true">
      <template #header>
        <div class="settings-dialog-title"><span class="settings-dialog-title-icon"><el-icon><Calendar /></el-icon></span><span class="settings-dialog-title-copy"><strong>日期例外规则</strong><small>临时调整日报填写要求</small></span></div>
      </template>
      <div class="calendar-settings-content">
        <div class="settings-note"><span class="settings-note-icon"><el-icon><InfoFilled /></el-icon></span><div><strong>使用说明</strong><p>每周工作日和日报提醒由任务中心配置；本处用于临时调整指定日期是否需要填写日报。</p></div></div>

        <section class="settings-section exception-settings-section">
          <div class="settings-section-heading">
            <div>
              <div class="settings-heading-title"><h4>日期例外</h4><UiTag size="small" type="success" effect="plain">临时规则</UiTag></div>
              <p>按日期调整日报要求和适用成员</p>
            </div>
            <UiButton type="primary" link icon="Plus" @click="resetOverrideForm">新增日期例外</UiButton>
        </div>
        <el-form :model="overrideForm" label-position="top" class="override-form">
          <div class="override-form-row override-main-row">
            <el-form-item label="日期"><UiDatePicker v-model="overrideForm.calendarDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" /></el-form-item>
            <el-form-item label="类型"><UiSelect v-model="overrideForm.dayType" :options="dateExceptionOptions" :disabled="!dm_date_exception.length" placeholder="请选择日期例外类型" /></el-form-item>
            <el-form-item label="是否需要填写日报" class="report-requirement-item"><div class="report-rule-control"><UiSwitch v-model="overrideForm.needReport" class="report-rule-switch" size="large" inline-prompt active-text="需要" inactive-text="无需" :width="72" /><span class="report-rule-hint" :class="{ 'is-active': overrideForm.needReport }">{{ overrideForm.needReport ? '会生成日报填写要求' : '不生成日报填写要求' }}</span></div></el-form-item>
          </div>
          <div class="override-form-row override-detail-row">
            <el-form-item class="override-user" label="适用成员"><el-select v-model="selectedUserIds" multiple filterable clearable class="member-select" :disabled="!userOptions.length" placeholder="请选择成员，可多选或全选"><template #tag><span v-if="memberSelectionLabel" class="member-select-summary" :class="{ 'is-all': canManageDepartment && allUsersSelected }" :title="memberSelectionLabel">{{ memberSelectionLabel }}</span></template><template #header><el-checkbox :model-value="allUsersSelected" :indeterminate="someUsersSelected" :disabled="!userOptions.length" @change="toggleAllUsers">全选成员</el-checkbox></template><el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName || item.userName}（${item.userName}）`" :value="item.userId" /></el-select><span class="field-helper">支持多选和全选；选择框内仅显示已选人数</span></el-form-item>
            <el-form-item class="override-remark" label="说明"><UiInput v-model="overrideForm.remark" placeholder="补充日期安排说明" /></el-form-item>
            <el-form-item class="override-action"><UiButton type="primary" icon="Plus" @click="saveOverride">添加例外</UiButton></el-form-item>
          </div>
        </el-form>
        <DepartmentDataTable class="override-table" :data="overrides" border stripe size="small" max-height="260">
          <el-table-column prop="calendarDate" label="日期" width="140" align="center" />
          <el-table-column label="类型" width="160" align="center"><template #default="scope"><dict-tag :options="dm_date_exception" :value="scope.row.dayType" /></template></el-table-column>
          <el-table-column label="填写日报" width="110" align="center"><template #default="scope"><UiTag :type="scope.row.needReport ? 'success' : 'info'">{{ scope.row.needReport ? '是' : '否' }}</UiTag></template></el-table-column>
          <el-table-column label="人员范围" width="220"><template #default="scope">{{ getOverrideUserLabel(scope.row) }}</template></el-table-column>
          <el-table-column prop="remark" label="说明" show-overflow-tooltip />
          <el-table-column label="操作" width="90" align="center"><template #default="scope"><DepartmentTableActions><UiButton link type="danger" @click="removeOverride(scope.row)">删除</UiButton></DepartmentTableActions></template></el-table-column>
          <template #empty><div class="override-empty"><el-icon><Calendar /></el-icon><strong>暂无日期例外</strong><span>新增规则后会显示在这里</span></div></template>
        </DepartmentDataTable>
        </section>
      </div>

      <template #footer>
        <div class="settings-footer"><UiButton @click="settingsDialog.visible = false">关闭</UiButton></div>
      </template>
    </UiDialog>

    <UiDialog v-model="upload.open" :title="upload.title" width="420px" append-to-body :show-footer="true">
      <UiUpload ref="uploadRef" drag :limit="1" accept=".xlsx,.xls" :headers="upload.headers" :action="upload.url" :auto-upload="false" :disabled="upload.isUploading" :on-progress="handleUploadProgress" :on-success="handleUploadSuccess"><el-icon class="el-icon--upload"><UploadFilled /></el-icon><div class="el-upload__text">拖拽 Excel 文件到此处，或点击上传</div><template #tip><div class="el-upload__tip">日报日期必须是工作日；每人每天只能有一条日报。</div></template></UiUpload>
      <div class="upload-template-link" @click="downloadTemplate">下载导入模板</div>
      <template #footer><UiButton type="primary" :loading="upload.isUploading" @click="submitUpload">开始导入</UiButton><UiButton @click="upload.open = false">取消</UiButton></template>
    </UiDialog>
  </div>
</template>

<script setup name="DepartmentDailyReport" lang="ts">
import { computed, onMounted, reactive, ref, toRefs, type Ref, watch } from 'vue';
import { addDailyCalendarOverride, addDailyReport, delDailyCalendarOverride, delDailyReportAttachment, getDailyCalendar, getDailyReport, listDailyCalendarOverrides, listDailyReportAttachments, updateDailyCalendarOverride, updateDailyReport } from '@/api/department/dailyReport';
import type { DailyCalendarCellVO, DailyCalendarDayVO, DailyCalendarOverrideForm, DailyCalendarOverrideVO, DailyCalendarVO, DailyReportAttachmentVO, DailyReportForm, DailyReportVO } from '@/api/department/dailyReport/types';
import type { PersonUserOptionVO } from '@/api/department/person/types';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import { UiButton, UiCard, UiDatePicker, UiDialog, UiInput, UiPagination, UiSelect, UiSwitch, UiTag, UiTextarea, UiUpload } from '@/components/UiKit';
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
const uploadRef = ref<{ handleRemove?: (file: unknown) => void; submit?: () => void }>();
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
const handleMemberPageChange = (page: number) => { memberPage.value = page; };
const handleMemberPageSizeChange = (pageSize: number) => { memberPageSize.value = pageSize; memberPage.value = 1; };
const getCell = (member: any, date: string) => (member.cells || []).find((item: DailyCalendarCellVO) => item.date === date) || ({ date, state: 'REST', workday: false } as DailyCalendarCellVO);
const isUnavailableDate = (date: Date) => { const current = new Date(); if (date > current) return true; const dateText = formatDate(date); const day = calendar.days.find((item) => item.date === dateText); const currentMember = calendar.members.find((item) => String(item.userId) === String(userStore.userId)); const cell = currentMember ? getCell(currentMember, dateText) : undefined; return Boolean(cell ? !cell.workday : day && !day.workday); };
const isMine = (row: DailyReportVO) => String(row.userId) === String(userStore.userId);
const dateExceptionLabel = (value?: string) => dm_date_exception.value?.find((item: DictDataOption) => String(item.value) === String(value))?.label || value || '日期例外';
const dateExceptionOptions = computed(() => (dm_date_exception.value || []).map((item: DictDataOption) => ({ value: item.value, label: item.label })));
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
  // 日期选择器的面板是绝对定位浮层，工具栏不能继续裁剪它，否则动森模式下只能看到触发器。
  .calendar-toolbar { overflow: visible; border: 0; border-radius: 14px; }
  .calendar-toolbar :deep(.el-card__body), .calendar-toolbar :deep(.ui-animal-card__body) { overflow: visible; }
  .calendar-card { border: 0; border-radius: 14px; }
  .toolbar-main, .calendar-heading, .leave-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  // 将标题、月份和快捷操作收敛为一个完整控件，避免几个独立胶囊拼接在一起。
  .toolbar-period { display: flex; align-items: center; gap: 6px; min-width: 0; padding: 4px; border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color-light)); border-radius: 20px; background: color-mix(in srgb, var(--el-color-primary) 5%, var(--el-fill-color-light)); box-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-primary) 16%, transparent); }
  .toolbar-period-copy { display: flex; align-items: center; gap: 8px; min-width: 146px; padding: 3px 12px 3px 5px; border-right: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color-lighter)); }
  .toolbar-period-copy strong { display: block; color: var(--el-text-color-primary); font-size: 14px; line-height: 20px; }
  .toolbar-period-copy small { display: block; margin-top: 2px; color: var(--el-text-color-secondary); font-size: 11px; line-height: 16px; white-space: nowrap; }
  .toolbar-period-icon { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; width: 32px; height: 32px; border: 1px solid color-mix(in srgb, var(--el-color-primary) 28%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--el-color-primary) 14%, transparent); color: var(--el-color-primary); font-size: 16px; box-shadow: 0 2px 0 color-mix(in srgb, var(--el-color-primary) 20%, transparent); }
  .month-switcher, .toolbar-actions, .legend { display: flex; align-items: center; gap: 8px; }
  .month-switcher { flex: 0 0 auto; gap: 4px; padding: 0 4px 0 2px; border: 0; border-radius: 16px; background: transparent; box-shadow: none; }
  .month-switcher .month-nav-button { flex: 0 0 40px; width: 40px; min-width: 40px; }
  .month-picker-shell { display: flex; align-items: center; flex: 0 0 150px; width: 150px; }
  .month-picker-shell .animal-date-picker { width: 150px; }
  .month-switcher .current-month-button { min-width: 70px; margin-left: 2px; }
  .month-switcher :deep(.animal-date-picker__trigger) { min-height: 40px; padding: 0 10px; border-color: transparent; border-radius: 14px; background: transparent; box-shadow: none; }
  .month-switcher :deep(.animal-date-picker__value) { color: var(--el-text-color-primary); font-weight: 700; letter-spacing: .2px; }
  .month-switcher :deep(.animal-date-picker__calendar-icon) { color: var(--el-color-primary); }
  .month-switcher :deep(.animal-date-picker__clear) { color: var(--el-text-color-secondary); }
  :global(html[data-ui-theme='animal'][data-color-mode] .department-daily-report-page .month-nav-button) { color: var(--animal-text-color-secondary) !important; background: transparent !important; border-color: transparent !important; box-shadow: none !important; }
  :global(html[data-ui-theme='animal'][data-color-mode] .department-daily-report-page .month-nav-button:hover:not(:disabled)) { color: var(--animal-primary-color) !important; background: color-mix(in srgb, var(--animal-primary-color) 14%, transparent) !important; border-color: color-mix(in srgb, var(--animal-primary-color) 22%, transparent) !important; }
  :global(html[data-ui-theme='animal'][data-color-mode] .department-daily-report-page .current-month-button) { color: #173c37 !important; background: var(--animal-primary-color) !important; border-color: var(--animal-primary-color) !important; box-shadow: 0 3px 0 var(--animal-primary-color-active) !important; }
  :global(html[data-ui-theme='animal'][data-color-mode] .department-daily-report-page .current-month-button:hover:not(:disabled)) { background: var(--animal-primary-color-hover) !important; border-color: var(--animal-primary-color-hover) !important; box-shadow: 0 4px 0 var(--animal-primary-color-active) !important; }
  :global(html[data-ui-theme='animal'] .department-daily-report-page .month-picker-shell .animal-date-picker__trigger) { color: var(--animal-text-color) !important; background: transparent !important; border-color: transparent !important; box-shadow: none !important; }
  .toolbar-actions { flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
  .toolbar-hint { display: flex; align-items: flex-start; gap: 8px; margin-top: 14px; padding: 11px 2px 0; border-top: 1px solid var(--el-border-color-lighter); color: var(--el-text-color-secondary); font-size: 12px; line-height: 18px; }
  .toolbar-hint-icon { display: inline-flex; flex: 0 0 auto; margin-top: 1px; color: var(--el-color-primary); font-size: 15px; }
  .toolbar-hint > span:last-child { flex: 1; min-width: 0; }
  .calendar-heading p { margin-top: 10px; color: var(--el-text-color-secondary); font-size: 13px; }
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
  .report-cell { display: flex; align-items: center; justify-content: center; gap: 3px; min-height: 46px; margin: -7px; cursor: pointer; font-size: 12px; transition: background .15s; } .report-cell:hover { background: var(--el-fill-color-light); } .report-cell.state-filled { color: #529b2e; } .report-cell.state-leave { color: #337ecc; } .report-cell.state-exception { color: #b88230; background: var(--daily-cell-exception-bg, #fdf6ec); cursor: default; } .report-cell.state-missing { color: #c45656; background: var(--daily-cell-missing-bg, #fef0f0); } .report-cell.state-rest { color: #a8abb2; background: var(--el-fill-color-lighter); cursor: default; } .report-cell.state-unavailable { flex-direction: column; gap: 0; color: var(--el-text-color-placeholder); background: transparent; cursor: default; } .report-cell.state-unavailable small { font-size: 10px; line-height: 1.2; }
  :global(html[data-ui-theme='animal'][data-color-mode='dark'] .department-daily-report-page) { --daily-cell-exception-bg: color-mix(in srgb, var(--animal-status-warning) 14%, var(--app-surface-bg)); --daily-cell-missing-bg: color-mix(in srgb, var(--animal-status-danger) 14%, var(--app-surface-bg)); }
  // 动森主题的日历板样式放在下方的全局主题块中，办公模式保持 Element Plus 原生布局。
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
  @media (max-width: 900px) { .toolbar-main, .calendar-heading { align-items: flex-start; flex-direction: column; } .toolbar-period { width: 100%; justify-content: space-between; } .summary-grid { grid-template-columns: repeat(2, 1fr); } .toolbar-actions { justify-content: flex-start; flex-wrap: wrap; } .calendar-pagination { align-items: flex-end; flex-direction: column; } }
  @media (max-width: 760px) { .toolbar-period { align-items: flex-start; flex-direction: column; gap: 10px; } .month-switcher { width: 100%; } .month-picker-shell, .month-picker-shell .animal-date-picker { flex: 1; width: auto; min-width: 0; } .toolbar-actions { width: 100%; } .override-main-row, .override-detail-row { grid-template-columns: 1fr; } .override-detail-row { margin-top: 10px; } .override-action { justify-self: start; } }
}
</style>

<style lang="scss">
// 动森主题的日历板样式仅作用于动森模式，避免污染办公模式的 Element Plus 表格。
html[data-ui-theme='animal'] .department-daily-report-page {
  .calendar-scroll {
    margin: 2px 0 0;
    padding: 12px;
    border: 1px solid color-mix(in srgb, var(--animal-primary-color) 16%, var(--animal-border-color-light));
    border-radius: 24px;
    background: color-mix(in srgb, var(--animal-primary-color) 4%, var(--animal-bg-color));
  }

  .calendar-scroll .calendar-table {
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--animal-primary-color) 26%, var(--animal-border-color-light));
    border-radius: 18px;
    background: var(--animal-bg-color);
    box-shadow: 0 3px 0 color-mix(in srgb, var(--animal-primary-color) 13%, var(--animal-shadow-soft)), 0 10px 24px color-mix(in srgb, var(--animal-shadow-soft) 50%, transparent);
  }

  .calendar-scroll .calendar-table .ui-animal-table__th {
    min-height: 74px;
    padding: 10px 8px;
    border-bottom: 2px solid color-mix(in srgb, var(--animal-primary-color) 16%, var(--animal-border-color-light));
    background: color-mix(in srgb, var(--animal-accent-color, #f0a85b) 8%, var(--animal-bg-color-secondary));
    color: var(--animal-text-color);
  }

  .calendar-scroll .calendar-table .ui-animal-table__th:first-child {
    padding-left: 18px;
    background: color-mix(in srgb, var(--animal-primary-color) 9%, var(--animal-bg-color-secondary));
    text-align: left;
  }

  .calendar-scroll .calendar-table .ui-animal-table__cell {
    min-height: 92px;
    padding: 12px 8px;
    border-bottom-color: color-mix(in srgb, var(--animal-border-color-light) 76%, transparent);
    background: color-mix(in srgb, #fff 28%, var(--animal-bg-color));
  }

  .calendar-scroll .calendar-table .ui-animal-table__th,
  .calendar-scroll .calendar-table .ui-animal-table__cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .calendar-scroll .calendar-table .ui-animal-table__th:first-child,
  .calendar-scroll .calendar-table .ui-animal-table__cell:first-child {
    justify-content: flex-start;
  }

  .calendar-scroll .calendar-table .ui-animal-table__row:nth-child(even) .ui-animal-table__cell {
    background: color-mix(in srgb, var(--animal-primary-color) 3%, var(--animal-bg-color));
  }

  .calendar-scroll .calendar-table .ui-animal-table__row:last-child .ui-animal-table__cell {
    border-bottom: 0;
  }

  .calendar-scroll .calendar-table .ui-animal-table__row:hover .ui-animal-table__cell {
    background: color-mix(in srgb, var(--animal-primary-color) 8%, var(--animal-bg-color));
  }

  .calendar-scroll .calendar-table .ui-animal-table__cell:first-child {
    padding-left: 18px;
  }

  .calendar-scroll .calendar-table .ui-animal-table__header-content {
    justify-content: center;
  }

  .calendar-scroll .calendar-table .ui-animal-table__th:first-child .ui-animal-table__header-content {
    justify-content: flex-start;
  }

  .member-cell {
    position: relative;
    gap: 3px;
    padding: 5px 4px 5px 16px;
  }

  .member-cell::before {
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 0;
    width: 5px;
    border-radius: 999px;
    background: var(--animal-primary-color);
    content: '';
  }

  .member-name {
    color: var(--animal-text-color);
    font-size: 14px;
    font-weight: 800;
  }

  .member-account,
  .member-title,
  .member-dept {
    font-size: 11px;
    line-height: 17px;
  }

  .day-header {
    min-height: 52px;
    gap: 2px;
    padding: 2px 3px;
    border-radius: 14px;
  }

  .day-header strong {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 31px;
    height: 26px;
    padding: 0 7px;
    border-radius: 10px;
    background: color-mix(in srgb, #fff 62%, var(--animal-bg-color-secondary));
    color: var(--animal-text-color);
    font-size: 13px;
    line-height: 26px;
  }

  .day-header span {
    color: var(--animal-text-color-secondary);
    font-size: 11px;
    font-weight: 700;
  }

  .day-header em {
    padding: 1px 7px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--animal-primary-color) 11%, transparent);
    color: var(--animal-primary-color);
    font-size: 10px;
    font-weight: 700;
    line-height: 16px;
  }

  .day-header.is-rest {
    background: color-mix(in srgb, var(--animal-accent-color, #f0a85b) 9%, transparent);
    color: var(--animal-text-color-secondary);
  }

  .day-header.is-rest strong {
    background: color-mix(in srgb, var(--animal-accent-color, #f0a85b) 16%, var(--animal-bg-color-secondary));
  }

  .day-header.is-rest em {
    background: color-mix(in srgb, var(--animal-accent-color, #f0a85b) 14%, transparent);
    color: var(--animal-accent-color, #b88230);
  }

  .day-header.is-exception em {
    background: color-mix(in srgb, var(--animal-status-warning, #e6a23c) 16%, transparent);
    color: var(--animal-status-warning, #b88230);
  }

  .day-header.is-today {
    background: color-mix(in srgb, var(--animal-primary-color) 10%, transparent);
  }

  .day-header.is-today strong {
    background: var(--animal-primary-color);
    color: #fff;
    box-shadow: 0 2px 0 var(--animal-primary-color-active, #0ea89c);
  }

  .report-cell {
    flex-direction: column;
    gap: 2px;
    min-width: 62px;
    min-height: 38px;
    margin: 0 auto;
    padding: 6px 5px;
    border: 1px solid transparent;
    border-radius: 14px;
    font-size: 12px;
    font-weight: 800;
    line-height: 16px;
    transition: transform .16s ease, background .16s ease, border-color .16s ease, box-shadow .16s ease;
  }

  .report-cell:hover:not(.state-rest):not(.state-exception):not(.state-unavailable) {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--animal-primary-color) 34%, transparent);
    background: color-mix(in srgb, var(--animal-primary-color) 13%, var(--animal-bg-color));
    box-shadow: 0 2px 0 color-mix(in srgb, var(--animal-primary-color) 20%, transparent);
  }

  .report-cell.state-filled {
    border-color: color-mix(in srgb, var(--animal-status-success, #67c23a) 22%, transparent);
    background: color-mix(in srgb, var(--animal-status-success, #67c23a) 10%, var(--animal-bg-color));
    color: var(--animal-status-success, #529b2e);
  }

  .report-cell.state-leave {
    border-color: color-mix(in srgb, var(--animal-status-info, #409eff) 22%, transparent);
    background: color-mix(in srgb, var(--animal-status-info, #409eff) 10%, var(--animal-bg-color));
    color: var(--animal-status-info, #337ecc);
  }

  .report-cell.state-exception {
    border-color: color-mix(in srgb, var(--animal-status-warning, #e6a23c) 24%, transparent);
    background: color-mix(in srgb, var(--animal-status-warning, #e6a23c) 11%, var(--animal-bg-color));
    color: var(--animal-status-warning, #b88230);
  }

  .report-cell.state-missing {
    border-color: color-mix(in srgb, var(--animal-status-danger, #f56c6c) 22%, transparent);
    background: color-mix(in srgb, var(--animal-status-danger, #f56c6c) 10%, var(--animal-bg-color));
    color: var(--animal-status-danger, #c45656);
  }

  .report-cell.state-rest {
    border-color: color-mix(in srgb, var(--animal-border-color-light) 65%, transparent);
    background: color-mix(in srgb, var(--animal-bg-color-secondary) 58%, var(--animal-bg-color));
    color: var(--animal-text-color-secondary);
  }

  .report-cell.state-unavailable {
    min-width: 52px;
    background: transparent;
    color: var(--animal-text-color-disabled, var(--el-text-color-placeholder));
  }

  .report-cell .el-icon {
    font-size: 13px;
  }

  .report-cell.state-unavailable small {
    color: inherit;
    font-size: 10px;
    font-weight: 600;
  }
}

html[data-ui-theme='animal'][data-color-mode='dark'] .department-daily-report-page {
  .calendar-scroll {
    border-color: color-mix(in srgb, var(--animal-primary-color) 24%, var(--animal-border-color-light));
    background: color-mix(in srgb, var(--animal-primary-color) 5%, var(--animal-bg-color));
  }

  .calendar-scroll .calendar-table {
    border-color: var(--animal-border-color-light);
    background: var(--animal-bg-color);
    box-shadow: 0 3px 0 var(--animal-shadow-soft), 0 10px 24px rgb(0 0 0 / 18%);
  }

  .calendar-scroll .calendar-table .ui-animal-table__th {
    border-bottom-color: var(--animal-border-color-light);
    background: var(--animal-bg-color-secondary);
    color: var(--animal-text-color);
  }

  .calendar-scroll .calendar-table .ui-animal-table__th:first-child {
    background: color-mix(in srgb, var(--animal-primary-color) 12%, var(--animal-bg-color-secondary));
  }

  .calendar-scroll .calendar-table .ui-animal-table__cell {
    border-bottom-color: var(--animal-border-color-light);
    background: var(--animal-bg-color);
    color: var(--animal-text-color);
  }

  .calendar-scroll .calendar-table .ui-animal-table__row:nth-child(even) .ui-animal-table__cell {
    background: color-mix(in srgb, var(--animal-primary-color) 4%, var(--animal-bg-color));
  }

  .calendar-scroll .calendar-table .ui-animal-table__row:hover .ui-animal-table__cell {
    background: color-mix(in srgb, var(--animal-primary-color) 10%, var(--animal-bg-color));
  }

  .day-header strong {
    background: var(--animal-bg-color-input);
  }

  .day-header.is-rest {
    background: color-mix(in srgb, var(--animal-accent-color, #e4b66a) 10%, transparent);
  }

  .day-header.is-rest strong {
    background: color-mix(in srgb, var(--animal-accent-color, #e4b66a) 18%, var(--animal-bg-color-input));
  }

  .report-cell.state-filled {
    background: color-mix(in srgb, var(--animal-status-success) 14%, var(--animal-bg-color));
  }

  .report-cell.state-leave {
    background: color-mix(in srgb, var(--animal-status-info) 14%, var(--animal-bg-color));
  }

  .report-cell.state-exception {
    background: color-mix(in srgb, var(--animal-status-warning) 14%, var(--animal-bg-color));
  }

  .report-cell.state-missing {
    background: color-mix(in srgb, var(--animal-status-danger) 14%, var(--animal-bg-color));
  }

  .report-cell.state-rest {
    background: color-mix(in srgb, var(--animal-bg-color-secondary) 72%, var(--animal-bg-color));
  }
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

/*
 * 日报弹窗是跨主题复用的表单；动森模式的 Modal 会通过 Teleport 渲染，
 * 因此使用稳定的业务类名约束弹窗标题、字段卡片和底部操作区，避免依赖
 * 业务页面的 scoped 属性，也避免标签、文本域和计数器发生错位。
 */
.report-dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.report-dialog-title-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 28%, var(--el-border-color-light));
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-size: 17px;
}

.report-dialog-title-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.report-dialog-title-copy strong,
.report-dialog-title-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-dialog-title-copy strong {
  color: var(--el-text-color-primary);
  font-size: 20px;
  line-height: 26px;
}

.report-dialog-title-copy small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 17px;
}

.animal-modal:has(.daily-report-form) .animal-modal__body {
  // 动森弹窗顶部是收窄的有机曲线，标题需要下移到宽阔区域，避免图标和文字被曲线裁掉。
  padding: 44px 34px 18px;
}

.animal-modal:has(.daily-report-form) .animal-modal__header {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--animal-overlay-border, var(--el-border-color-lighter));
}

.animal-modal:has(.daily-report-form) .animal-modal__title {
  width: 100%;
}

.animal-modal:has(.daily-report-form) .report-dialog-title {
  padding: 0 12px;
}

.animal-modal:has(.daily-report-form) .animal-modal__content {
  padding: 14px 2px 16px;
  overflow-x: hidden;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}

.animal-modal:has(.daily-report-form) .animal-modal__footer {
  justify-content: center;
  padding-top: 12px;
  border-top: 1px solid var(--animal-overlay-border, var(--el-border-color-lighter));
}

.animal-modal:has(.daily-report-form) .report-dialog-footer {
  justify-content: center;
}

.daily-report-form {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

.daily-report-form .el-form-item {
  display: block;
  width: 100%;
  min-width: 0;
  margin: 0;
}

.daily-report-form .el-form-item__label {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: auto !important;
  min-height: 20px;
  margin-bottom: 7px;
  padding: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 700;
  line-height: 20px;
  text-align: left;
  white-space: nowrap;
}

.daily-report-form .el-form-item__content {
  display: block;
  width: 100%;
  min-width: 0;
  margin-left: 0 !important;
  line-height: normal;
}

.daily-report-form .el-form-item__content > * {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.daily-report-form .report-date-field {
  display: grid;
  grid-template-columns: 82px minmax(0, 184px);
  column-gap: 14px;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-color-primary) 5%, var(--el-bg-color));
}

.daily-report-form .report-date-field .el-form-item__label {
  margin: 0;
}

.daily-report-form .report-date-field .el-form-item__content {
  display: flex;
  align-items: center;
}

.daily-report-form .report-date-field .animal-date-picker,
.daily-report-form .report-date-field .el-date-editor {
  width: 184px !important;
  max-width: 100%;
}

.daily-report-form .report-field {
  padding: 10px 12px 11px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color));
}

.daily-report-form .report-field--primary {
  border-color: color-mix(in srgb, var(--el-color-primary) 38%, var(--el-border-color-lighter));
  background: color-mix(in srgb, var(--el-color-primary) 7%, var(--el-bg-color));
}

.daily-report-form .report-field .el-form-item__label {
  margin-bottom: 6px;
}

.daily-report-form .report-field .ui-animal-textarea {
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--animal-border-color-light, var(--el-border-color-light)));
  border-radius: 14px;
  background: var(--animal-bg-color-input, var(--el-fill-color-blank));
  box-shadow: 0 2px 0 var(--animal-shadow-soft, var(--el-border-color-light));
}

.daily-report-form .report-field--primary .ui-animal-textarea {
  min-height: 120px;
}

.daily-report-form .report-field:not(.report-field--primary) .ui-animal-textarea {
  min-height: 68px;
}

.daily-report-form .report-field .ui-animal-textarea__count {
  right: 12px;
  bottom: 8px;
}

.daily-report-form .el-divider {
  margin: 4px 0 14px;
}

.report-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.calendar-settings-content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.animal-modal__content:has(.calendar-settings-content) {
  overflow-x: hidden;
}

.calendar-settings-content .settings-dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.calendar-settings-content .settings-dialog-title-icon,
.animal-modal__title .settings-dialog-title-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 18px;
}

.animal-modal__title .settings-dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.animal-modal__title .settings-dialog-title-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.animal-modal__title .settings-dialog-title-copy strong,
.animal-modal__title .settings-dialog-title-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.animal-modal__title .settings-dialog-title-copy strong {
  color: var(--el-text-color-primary);
  font-size: 16px;
  line-height: 22px;
}

.animal-modal__title .settings-dialog-title-copy small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 16px;
}

.calendar-settings-content .settings-note,
.calendar-settings-content .settings-section {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.calendar-settings-content .settings-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 0;
  padding: 12px 14px;
  border: 1px solid var(--el-color-primary-light-8);
  border-left: 3px solid var(--el-color-primary);
  border-radius: 10px;
  background: var(--el-color-primary-light-9);
}

.calendar-settings-content .settings-note > div {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
}

.calendar-settings-content .settings-note-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--el-color-primary);
  font-size: 16px;
  line-height: 1;
}

.calendar-settings-content .settings-note strong {
  display: block;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 20px;
}

.calendar-settings-content .settings-note p {
  margin: 2px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.calendar-settings-content .settings-note p {
  overflow-wrap: anywhere;
}

.calendar-settings-content .settings-section {
  margin: 0;
  padding: 16px 18px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}

/*
 * 动森日期选择器的面板挂载在触发器内部，并通过 absolute 向下展开。
 * 日常状态仍保持设置区的边界裁剪；仅在面板打开时释放必要的溢出空间，
 * 避免日历被设置卡片、弹窗内容滚动区或弹窗主体提前截断。
 */
.calendar-settings-content:has(.animal-date-picker__panel),
.animal-modal__content:has(.calendar-settings-content .animal-date-picker__panel),
.animal-modal__body:has(.calendar-settings-content .animal-date-picker__panel),
.calendar-settings-content .exception-settings-section:has(.animal-date-picker__panel) {
  overflow: visible;
}

.calendar-settings-content .settings-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-width: 0;
  margin-bottom: 14px;
  padding-left: 12px;
  box-sizing: border-box;
}

.calendar-settings-content .settings-section-heading > div:first-child {
  min-width: 0;
}

.calendar-settings-content .settings-heading-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-settings-content .settings-section-heading h4 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  line-height: 22px;
}

.calendar-settings-content .settings-section-heading p {
  margin: 3px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.calendar-settings-content .settings-section-heading p {
  overflow-wrap: anywhere;
}

.calendar-settings-content .settings-section-heading .ui-animal-button {
  flex: 0 0 auto;
}

.calendar-settings-content .override-form,
.calendar-settings-content .override-form-row {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.calendar-settings-content .override-form {
  padding: 4px 0 0;
}

.calendar-settings-content .override-form-row {
  display: grid;
  align-items: start;
  gap: 12px 16px;
}

.calendar-settings-content .override-main-row {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.35fr);
}

.calendar-settings-content .override-detail-row {
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) 118px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.calendar-settings-content .override-form-row .el-form-item {
  width: 100%;
  min-width: 0;
  margin-bottom: 0;
}

.calendar-settings-content .override-form-row .el-form-item__label {
  width: auto !important;
  padding-bottom: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.calendar-settings-content .override-form-row .el-form-item__content {
  width: 100%;
  min-width: 0;
  margin-left: 0 !important;
}

.calendar-settings-content .override-form-row .animal-date-picker,
.calendar-settings-content .override-form-row .animal-select,
.calendar-settings-content .override-form-row .el-date-editor,
.calendar-settings-content .override-form-row .el-select,
.calendar-settings-content .override-form-row .el-input {
  width: 100% !important;
  min-width: 0;
  max-width: 100%;
}

.calendar-settings-content .report-rule-control {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  min-height: 40px;
}

.calendar-settings-content .report-rule-hint {
  overflow-wrap: anywhere;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 16px;
  white-space: normal;
}

.calendar-settings-content .override-action {
  align-self: end;
  justify-self: end;
}

.calendar-settings-content .override-action .ui-animal-button,
.calendar-settings-content .override-action .el-button {
  min-width: 118px;
}

.calendar-settings-content .override-table {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  margin-top: 14px;
  overflow: hidden;
  border-radius: 10px;
}

.calendar-settings-content .override-table .el-table,
.calendar-settings-content .override-table .el-table__header-wrapper,
.calendar-settings-content .override-table .el-table__body-wrapper {
  width: 100% !important;
  min-width: 0;
  max-width: 100%;
}

.calendar-settings-content .override-table .el-table__body-wrapper {
  overflow-x: auto;
}

html.dark .calendar-settings-content .settings-note {
  border-color: rgba(92, 211, 199, 0.32);
  background: rgba(92, 211, 199, 0.1);
}

html.dark .calendar-settings-content .settings-note strong,
html.dark .calendar-settings-content .settings-section-heading h4 {
  color: #f5ead1;
}

html.dark .calendar-settings-content .settings-note p,
html.dark .calendar-settings-content .settings-section-heading p {
  color: #b9c9c2;
}

html.dark .calendar-settings-content .settings-section {
  border-color: rgba(115, 153, 145, 0.42);
  background: #2b3a39;
  box-shadow: 0 4px 16px rgb(0 0 0 / 14%);
}

html.dark .calendar-settings-content .override-detail-row {
  border-top-color: rgba(115, 153, 145, 0.3);
}

@media (max-width: 760px) {
  .daily-report-form .el-form-item,
  .calendar-settings-content .override-main-row,
  .calendar-settings-content .override-detail-row {
    grid-template-columns: 1fr;
  }

  .daily-report-form .el-form-item__label,
  .daily-report-form .el-form-item:first-child .el-form-item__label {
    padding-top: 0;
    text-align: left;
  }

  .calendar-settings-content .override-detail-row {
    margin-top: 10px;
  }

  .calendar-settings-content .override-action {
    justify-self: start;
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
