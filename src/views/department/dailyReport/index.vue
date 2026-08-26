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
      <div class="toolbar-hint">日历仅展示当前科室已分配“日报”任务的成员；工作日和个人调休在日报任务中配置，休假请在人事档案中维护。</div>
    </el-card>

    <el-card v-loading="loading" shadow="never" class="calendar-card mt-2">
      <template #header>
        <div class="calendar-heading">
          <div>
            <div class="panel-kicker">DEPARTMENT DAILY CALENDAR</div>
            <h3>{{ monthTitle }} 日报日历</h3>
            <p>成员：{{ calendar.members.length }} 人 · 工作日按日报任务分配计算</p>
          </div>
          <div class="legend"><span><i class="legend-dot filled" />已填</span><span><i class="legend-dot missing" />未填</span><span><i class="legend-dot leave" />休假</span><span><i class="legend-dot rest" />休息日</span><span><i class="legend-dot unavailable" />未服务</span></div>
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
        <el-table :data="calendar.members" border class="calendar-table" row-key="userId">
          <el-table-column fixed label="科室成员" width="178" align="left">
            <template #default="scope"><div class="member-cell"><span class="member-name">{{ scope.row.nickName || scope.row.userName }}</span><span class="member-account">{{ scope.row.userName }}</span><span v-if="scope.row.jobTitle" class="member-title">{{ scope.row.jobTitle }}</span><span v-if="scope.row.sourceDeptName" class="member-dept">部门：{{ scope.row.sourceDeptName }}</span></div></template>
          </el-table-column>
          <el-table-column v-for="day in calendar.days" :key="day.date" :width="day.workday ? 96 : 88" align="center">
            <template #header><div class="day-header" :class="{ 'is-rest': !day.workday, 'is-today': day.date === today }"><strong>{{ day.date.slice(8) }}</strong><span>周{{ day.weekLabel }}</span><em>{{ day.label }}</em></div></template>
            <template #default="scope">
              <div class="report-cell" :class="`state-${getCell(scope.row, day.date).state.toLowerCase()}`" :title="cellTitle(scope.row, getCell(scope.row, day.date), day)" @click="handleCellClick(scope.row, getCell(scope.row, day.date), day)">
                <template v-if="getCell(scope.row, day.date).state === 'FILLED'"><el-icon><Check /></el-icon><span>已填</span></template>
                <template v-else-if="getCell(scope.row, day.date).state === 'LEAVE'"><el-icon><CoffeeCup /></el-icon><span>休假</span></template>
                <template v-else-if="getCell(scope.row, day.date).state === 'MISSING'"><el-icon><Warning /></el-icon><span>未填</span></template>
                <template v-else-if="getCell(scope.row, day.date).state === 'UNAVAILABLE'"><span>—</span><small>未服务</small></template>
                <template v-else><el-icon><Minus /></el-icon><span>休息</span></template>
              </div>
            </template>
          </el-table-column>
        </el-table>
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

    <el-dialog v-model="settingsDialog.visible" title="日期例外" width="min(900px, calc(100vw - 32px))" class="calendar-settings-dialog" append-to-body>
      <el-alert class="settings-alert" type="info" :closable="false" show-icon title="每周工作日和日报提醒由任务中心的日报任务配置；本处只维护临时日期例外。休息日适用于全科室，调休上班必须选择具体人员。" />

      <section class="settings-section exception-settings-section">
        <div class="settings-section-heading">
          <div>
            <h4>日期例外</h4>
            <p>按日期调整日报规则；调休上班仅对选定的个人生效</p>
          </div>
          <el-button type="primary" link icon="Plus" @click="resetOverrideForm">新增日期例外</el-button>
        </div>
        <el-form :model="overrideForm" label-position="top" class="override-form">
          <div class="override-grid">
            <el-form-item class="override-date" label="日期"><el-date-picker v-model="overrideForm.calendarDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" /></el-form-item>
            <el-form-item class="override-type" label="类型"><el-select v-model="overrideForm.dayType" @change="handleOverrideTypeChange"><el-option label="调休上班" value="WORKDAY" /><el-option label="休息日" value="REST" /></el-select></el-form-item>
            <el-form-item v-if="overrideForm.dayType === 'WORKDAY'" class="override-user" label="调休人员"><el-select v-model="overrideForm.userId" filterable placeholder="选择人员"><el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName || item.userName}（${item.userName}）`" :value="item.userId" /></el-select></el-form-item>
            <el-form-item class="override-remark" label="说明"><el-input v-model="overrideForm.remark" placeholder="例如：中秋调休" /></el-form-item>
            <el-form-item class="override-action"><el-button type="primary" @click="saveOverride">保存例外</el-button></el-form-item>
          </div>
        </el-form>
        <el-table class="override-table" :data="overrides" border max-height="260">
          <el-table-column prop="calendarDate" label="日期" width="140" align="center" />
          <el-table-column label="类型" width="140" align="center"><template #default="scope"><el-tag :type="scope.row.dayType === 'WORKDAY' ? 'success' : 'info'">{{ scope.row.dayType === 'WORKDAY' ? '调休上班' : '休息日' }}</el-tag></template></el-table-column>
          <el-table-column label="人员范围" width="220"><template #default="scope">{{ getOverrideUserLabel(scope.row) }}</template></el-table-column>
          <el-table-column prop="remark" label="说明" show-overflow-tooltip />
          <el-table-column label="操作" width="90" align="center"><template #default="scope"><el-button link type="danger" @click="removeOverride(scope.row)">删除</el-button></template></el-table-column>
        </el-table>
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
import { computed, onMounted, reactive, ref, type Ref } from 'vue';
import { addDailyCalendarOverride, addDailyReport, delDailyCalendarOverride, delDailyReportAttachment, getDailyCalendar, getDailyReport, listDailyCalendarOverrides, listDailyReportAttachments, updateDailyCalendarOverride, updateDailyReport } from '@/api/department/dailyReport';
import type { DailyCalendarCellVO, DailyCalendarDayVO, DailyCalendarOverrideForm, DailyCalendarOverrideVO, DailyCalendarVO, DailyReportAttachmentVO, DailyReportForm, DailyReportVO } from '@/api/department/dailyReport/types';
import type { PersonUserOptionVO } from '@/api/department/person/types';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { useUserStore } from '@/store/modules/user';
import { download as requestDownload, globalHeaders } from '@/utils/request';

const { loading, withLoading } = useLoading(true);
const userStore = useUserStore();
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
const overrideForm = reactive<DailyCalendarOverrideForm>({ calendarDate: undefined, dayType: 'WORKDAY', userId: undefined, remark: '' });
const form = reactive<DailyReportForm>({ id: undefined, reportDate: undefined, todayWork: undefined, tomorrowPlan: undefined, coordinationNote: undefined });
const upload = reactive({ open: false, title: '导入日报', isUploading: false, headers: globalHeaders(), url: import.meta.env.VITE_APP_BASE_API + '/department/dailyReport/importData' });
const attachmentUploadUrl = computed(() => (form.id ? `${import.meta.env.VITE_APP_BASE_API}/department/dailyReport/attachment/upload/${form.id}` : ''));
const canManageDepartment = computed(() => userStore.roles?.includes('admin') || userStore.permissions?.includes('department:dailyReport:viewDept'));
const monthTitle = computed(() => selectedMonth.value.replace('-', '年') + '月');
const completionRate = computed(() => (calendar.requiredCount ? Math.round((calendar.filledCount / calendar.requiredCount) * 100) : 100));
const rules = { reportDate: [{ required: true, message: '日报日期不能为空', trigger: 'change' }], todayWork: [{ required: true, message: '今日工作不能为空', trigger: 'blur' }] };

const getCalendar = async () => { await withLoading(async () => { const res = await getDailyCalendar(`${selectedMonth.value}-01`); Object.assign(calendar, res.data || { days: [], members: [] }); }); };
const disableFutureMonth = (date: Date) => { const now = new Date(); return date > new Date(now.getFullYear(), now.getMonth(), 1); };
const changeMonth = (offset: number) => { const [year, month] = selectedMonth.value.split('-').map(Number); const nextMonth = new Date(year, month - 1 + offset, 1); if (disableFutureMonth(nextMonth)) return modal.msgWarning('日报只统计到今天，不能查看未来月份'); selectedMonth.value = formatMonth(nextMonth); getCalendar(); };
const goCurrentMonth = () => { selectedMonth.value = formatMonth(new Date()); getCalendar(); };
const getCell = (member: any, date: string) => (member.cells || []).find((item: DailyCalendarCellVO) => item.date === date) || ({ date, state: 'REST', workday: false } as DailyCalendarCellVO);
const isUnavailableDate = (date: Date) => { const current = new Date(); if (date > current) return true; const dateText = formatDate(date); const day = calendar.days.find((item) => item.date === dateText); const currentMember = calendar.members.find((item) => String(item.userId) === String(userStore.userId)); const cell = currentMember ? getCell(currentMember, dateText) : undefined; return Boolean(cell ? !cell.workday : day && !day.workday); };
const isMine = (row: DailyReportVO) => String(row.userId) === String(userStore.userId);
const cellTitle = (member: any, cell: DailyCalendarCellVO, day: DailyCalendarDayVO) => cell.state === 'FILLED' ? `${member.nickName || member.userName}：点击查看日报` : cell.state === 'LEAVE' ? `${member.nickName || member.userName}：${cell.leaveType || '休假'}，点击查看自动日报` : cell.state === 'MISSING' ? `${member.nickName || member.userName}：${cell.label || '工作日'}未填写日报` : cell.state === 'UNAVAILABLE' ? `${member.nickName || member.userName}：不在当前科室服务期内，无日报要求` : `${day.date}为${cell.label || day.label || '休息日'}，无需填写`;
const resetReportForm = () => { Object.assign(form, { id: undefined, reportDate: undefined, todayWork: undefined, tomorrowPlan: undefined, coordinationNote: undefined }); attachments.value = []; formRef.value?.resetFields(); };
const handleAdd = (date?: string) => { resetReportForm(); form.reportDate = date || (selectedMonth.value === formatMonth(new Date()) ? today : `${selectedMonth.value}-01`); dialog.title = '新增日报'; dialog.visible = true; };
const handleCellClick = async (member: any, cell: DailyCalendarCellVO, day: DailyCalendarDayVO) => { if (cell.reportId) { const row = { id: cell.reportId, reportDate: cell.date, userId: member.userId } as DailyReportVO; if (String(member.userId) === String(userStore.userId)) await handleUpdate(row); else await handleView(row); } else if (cell.state === 'MISSING') { if (String(member.userId) === String(userStore.userId)) handleAdd(day.date); else modal.msgWarning('该成员的日报需要由本人填写'); } };
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
const resetOverrideForm = () => Object.assign(overrideForm, { id: undefined, calendarDate: undefined, dayType: 'WORKDAY', userId: canManageDepartment.value ? undefined : userStore.userId, remark: '' });
const handleOverrideTypeChange = (value: 'WORKDAY' | 'REST') => { if (value === 'REST') overrideForm.userId = undefined; else if (!canManageDepartment.value) overrideForm.userId = userStore.userId; };
const getOverrideUserLabel = (row: any) => { if (row.dayType !== 'WORKDAY') return '全科室'; const user = userOptions.value.find((item) => String(item.userId) === String(row.userId)); return user ? `${user.nickName || user.userName}（${user.userName}）` : row.userId ? `人员${row.userId}` : '未指定人员'; };
const saveOverride = async () => { if (!overrideForm.calendarDate) return modal.msgError('请选择日期'); if (overrideForm.dayType === 'WORKDAY' && !overrideForm.userId) return modal.msgError('请选择调休人员'); if (overrideForm.dayType === 'REST') overrideForm.userId = undefined; if (overrideForm.id) await updateDailyCalendarOverride(overrideForm); else await addDailyCalendarOverride(overrideForm); modal.msgSuccess('日期例外已保存'); const res = await listDailyCalendarOverrides(calendar.beginDate, calendar.endDate); overrides.value = res.data || []; resetOverrideForm(); await getCalendar(); };
const removeOverride = async (row: any) => { await modal.confirm(`确认删除 ${row.calendarDate}${row.dayType === 'WORKDAY' ? `的${getOverrideUserLabel(row)}调休` : '的全科室休息日'}吗？`); await delDailyCalendarOverride(row.id); overrides.value = overrides.value.filter((item) => item.id !== row.id); modal.msgSuccess('删除成功'); await getCalendar(); };

const loadUserOptions = async () => { userOptions.value = calendar.members.map((item) => ({ userId: item.userId, userName: item.userName || '', nickName: item.nickName, deptId: undefined, deptName: undefined })); };

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
  .legend-dot.filled { background: #67c23a; } .legend-dot.missing { background: #f56c6c; } .legend-dot.leave { background: #409eff; } .legend-dot.rest { background: #c0c4cc; } .legend-dot.unavailable { background: var(--el-text-color-placeholder); }
  .summary-grid { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .summary-item { min-height: 70px; padding: 12px 16px; background: var(--el-fill-color-light); border-left: 4px solid; border-radius: 8px; }
  .summary-item strong, .summary-item span { display: block; } .summary-item strong { font-size: 24px; line-height: 1.2; } .summary-item span { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }
  .summary-item.blue { border-color: #409eff; color: #337ecc; } .summary-item.green { border-color: #67c23a; color: #529b2e; } .summary-item.orange { border-color: #e6a23c; color: #b88230; } .summary-item.red { border-color: #f56c6c; color: #c45656; } .summary-item.teal { border-color: #20a0a8; color: #198f96; }
  // 横向滚动交给 Element Plus 表格自身处理。外层再设置 overflow-x 会与表格 body-wrapper
  // 生成两根滚动条，且两根滚动条的滚动位置不同步，导致日报日期列难以操作。
  .calendar-scroll { overflow: hidden; }
  .calendar-table { width: 100%; min-width: 0; }
  .calendar-table :deep(.el-table__body-wrapper) { overflow-x: auto; }
  .member-cell { display: flex; flex-direction: column; gap: 2px; padding: 4px 6px; text-align: left; } .member-name { font-weight: 600; } .member-account, .member-title, .member-dept { color: var(--el-text-color-secondary); font-size: 11px; } .member-dept { color: var(--el-color-warning); }
  .day-header { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 2px 0; line-height: 1.3; } .day-header strong { font-size: 14px; } .day-header span { color: var(--el-text-color-secondary); font-size: 11px; } .day-header em { color: var(--el-color-primary); font-size: 10px; font-style: normal; white-space: nowrap; }
  .day-header.is-rest { background: var(--el-fill-color); color: var(--el-text-color-secondary); } .day-header.is-rest em { color: var(--el-text-color-secondary); } .day-header.is-today { color: var(--el-color-primary); }
  .report-cell { display: flex; align-items: center; justify-content: center; gap: 3px; min-height: 46px; margin: -7px; cursor: pointer; font-size: 12px; transition: background .15s; } .report-cell:hover { background: var(--el-fill-color-light); } .report-cell.state-filled { color: #529b2e; } .report-cell.state-leave { color: #337ecc; } .report-cell.state-missing { color: #c45656; background: #fef0f0; } .report-cell.state-rest { color: #a8abb2; background: var(--el-fill-color-lighter); cursor: default; } .report-cell.state-unavailable { flex-direction: column; gap: 0; color: var(--el-text-color-placeholder); background: transparent; cursor: default; } .report-cell.state-unavailable small { font-size: 10px; line-height: 1.2; }
  .empty-calendar { padding: 70px 0; color: var(--el-text-color-secondary); text-align: center; }
  .settings-alert { margin-bottom: 18px; }
  .settings-section { padding: 18px 20px; border: 1px solid var(--el-border-color-lighter); border-radius: 12px; background: var(--el-bg-color); }
  .settings-section + .settings-section { margin-top: 16px; }
  .settings-section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
  .settings-section-heading h4 { margin: 0; color: var(--el-text-color-primary); font-size: 15px; line-height: 22px; }
  .settings-section-heading p { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 18px; }
  .override-form { padding: 14px 16px; background: var(--el-fill-color-lighter); border-radius: 8px; }
  .override-grid { display: grid; grid-template-columns: minmax(180px, 1fr) 150px minmax(220px, 1fr); gap: 4px 16px; align-items: start; }
  .override-grid .el-form-item { min-width: 0; margin-bottom: 0; }
  .override-grid .el-date-editor, .override-grid .el-select, .override-grid .el-input { width: 100% !important; }
  .override-remark { grid-column: 1 / span 2; }
  .override-action { grid-column: 3; align-self: end; justify-self: end; }
  .override-table { margin-top: 14px; }
  .settings-footer { display: flex; justify-content: flex-end; gap: 10px; }
  .leave-toolbar { margin-bottom: 12px; color: var(--el-text-color-secondary); font-size: 13px; }
  .report-text { white-space: pre-wrap; line-height: 1.7; } .attachment-list { margin-top: 12px; } .attachment-item { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--el-border-color-lighter); } .attachment-empty { margin-top: 10px; color: var(--el-text-color-secondary); font-size: 13px; } .upload-template-link { margin-top: 12px; color: var(--el-color-primary); cursor: pointer; }
  @media (max-width: 900px) { .toolbar-main, .calendar-heading { align-items: flex-start; flex-direction: column; } .summary-grid { grid-template-columns: repeat(2, 1fr); } .toolbar-actions { flex-wrap: wrap; } }
  @media (max-width: 760px) { .override-grid { grid-template-columns: 1fr; } .override-remark, .override-action { grid-column: auto; } .override-action { justify-self: start; } }
}
</style>

<style lang="scss">
.calendar-settings-dialog {
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
    max-height: calc(100vh - 220px);
    overflow-y: auto;
    padding: 18px 24px 12px;
  }

  .el-dialog__footer {
    padding: 14px 24px 18px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .settings-alert {
    margin-bottom: 16px;
  }

  .settings-section {
    padding: 16px 18px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-bg-color);
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
    font-size: 15px;
    line-height: 22px;
  }

  .settings-section-heading p {
    margin: 3px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  .override-form {
    padding: 12px 14px;
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
  }

  .override-grid {
    display: grid;
    grid-template-columns: minmax(170px, 0.9fr) 140px minmax(220px, 1.2fr);
    gap: 4px 14px;
    align-items: start;
  }

  .override-grid .el-form-item {
    min-width: 0;
    margin-bottom: 0;
  }

  .override-grid .el-date-editor,
  .override-grid .el-select,
  .override-grid .el-input {
    width: 100% !important;
  }

  .override-remark {
    grid-column: 1 / span 2;
  }

  .override-action {
    grid-column: 3;
    align-self: end;
    justify-self: end;
  }

  .override-table {
    margin-top: 12px;
  }

  .settings-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

@media (max-width: 760px) {
  .calendar-settings-dialog {
    .override-grid {
      grid-template-columns: 1fr;
    }

    .override-remark,
    .override-action {
      grid-column: auto;
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
