<template>
  <div class="dashboard-page">
    <section class="dashboard-hero">
      <div class="hero-orb hero-orb--one"></div>
      <div class="hero-orb hero-orb--two"></div>
      <div class="hero-content">
        <div class="hero-kicker"><OfficeBuilding /> DEPARTMENT OPERATIONS</div>
        <h1>科室运营看板</h1>
        <p>用更少的信息，快速掌握成员状态、精益表现和待处理事项。</p>
        <div class="hero-context">
          <span class="context-dot"></span>
          <span>当前科室：{{ currentDeptName }}</span>
          <i></i>
          <span>统计周期：{{ monthLabel }}</span>
          <i></i>
          <span class="sync-label"><span :class="['sync-pulse', { active: loading }]" />{{ loading ? '正在同步' : `更新于 ${lastUpdated}` }}</span>
        </div>
      </div>
      <el-button class="hero-refresh" :loading="loading" plain round @click="loadDashboard"><el-icon><Refresh /></el-icon>刷新看板</el-button>
    </section>

    <section class="dashboard-section">
      <div class="section-heading">
        <div>
          <span class="section-eyebrow">DEPARTMENT VIEW</span>
          <h2>今日概览</h2>
          <p>成员状态、日报完成情况和当前需要处理的任务。</p>
        </div>
        <el-tag effect="plain" round><OfficeBuilding /> {{ currentDeptName }}</el-tag>
      </div>

      <div class="metric-grid metric-grid--overview">
        <article class="metric-card metric-card--blue">
          <div class="metric-icon"><User /></div>
          <span class="metric-label">在岗成员</span>
          <strong>{{ memberCount }}</strong>
          <small>今日实时在岗人数</small>
        </article>
        <article class="metric-card metric-card--cyan">
          <div class="metric-icon"><Calendar /></div>
          <span class="metric-label">今日休假</span>
          <strong>{{ leaveMembers.length }}</strong>
          <small>今日休假人数</small>
        </article>
        <article class="metric-card metric-card--green">
          <div class="metric-icon"><CircleCheck /></div>
          <span class="metric-label">日报完成率</span>
          <strong>{{ reportRate }}%</strong>
          <small>{{ calendar?.filledCount ?? 0 }} 条已完成</small>
        </article>
        <article class="metric-card metric-card--amber">
          <div class="metric-icon"><Timer /></div>
          <span class="metric-label">临近截止任务</span>
          <strong>{{ dueSoonCount }}</strong>
          <small>未来 24 小时内到期</small>
        </article>
        <article class="metric-card metric-card--red">
          <div class="metric-icon"><WarningFilled /></div>
          <span class="metric-label">逾期任务</span>
          <strong>{{ overdueCount }}</strong>
          <small>需要尽快处理</small>
        </article>
      </div>

      <div class="dashboard-content-grid">
        <section class="panel member-status-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">MEMBER STATUS</span>
              <h3>成员状态</h3>
              <p>{{ todayLabel }} 的成员服务状态</p>
            </div>
          </div>
          <div class="member-status-columns">
            <div class="member-status-group">
              <div class="member-status-group__heading"><span>在岗成员</span><el-tag type="success" effect="light" round>{{ memberCount }} 人</el-tag></div>
              <div v-if="onDutyMembers.length" class="member-list">
                <div v-for="member in onDutyMembers.slice(0, 6)" :key="member.userId" class="member-item">
                  <span class="member-avatar">{{ memberInitial(member) }}</span>
                  <span class="member-info"><strong>{{ memberDisplayName(member) }}</strong><small>{{ member.jobTitle || '未维护岗位' }}</small></span>
                </div>
                <button v-if="onDutyMembers.length > 6" type="button" class="member-more" @click="openMemberDrawer('onDuty')">还有 {{ onDutyMembers.length - 6 }} 人，查看全部 <ArrowRight /></button>
              </div>
              <el-empty v-else description="暂无在岗成员" :image-size="48" />
            </div>
            <div class="member-status-group member-status-group--leave">
              <div class="member-status-group__heading"><span>今日休假</span><el-tag type="warning" effect="light" round>{{ leaveMembers.length }} 人</el-tag></div>
              <div v-if="leaveMembers.length" class="member-list">
                <div v-for="member in leaveMembers.slice(0, 6)" :key="member.userId" class="member-item">
                  <span class="member-avatar member-avatar--leave">{{ memberInitial(member) }}</span>
                  <span class="member-info"><strong>{{ memberDisplayName(member) }}</strong><small>{{ leaveType(member) }}</small></span>
                </div>
                <button v-if="leaveMembers.length > 6" type="button" class="member-more" @click="openMemberDrawer('leave')">还有 {{ leaveMembers.length - 6 }} 人，查看全部 <ArrowRight /></button>
              </div>
              <el-empty v-else description="今日暂无休假人员" :image-size="48" />
            </div>
          </div>
        </section>

        <section class="panel lean-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-kicker">LEAN PROPOSAL</span>
              <h3>精益提案看板</h3>
              <p>{{ monthLabel }} · 仅统计已提交提案</p>
            </div>
            <el-tag type="primary" effect="light" round>本月</el-tag>
          </div>
          <div class="lean-summary">
            <div class="lean-score-box">
              <div><span>精益评分</span><strong>{{ formatScore(scoreMetric?.score) }}</strong></div>
              <el-tag :type="scoreTagType" effect="light" round>{{ scoreLabel }}</el-tag>
            </div>
            <div class="lean-total-box"><div class="lean-total-copy"><span>本月提案数</span><small>不含暂存</small></div><strong>{{ scoreMetric ? scoreMetric.totalCount : '—' }}</strong></div>
          </div>
          <div class="lean-status-grid">
            <div class="lean-status lean-status--approved"><span>已通过</span><strong>{{ scoreMetric ? scoreMetric.statusApprovedCount : '—' }}</strong></div>
            <div class="lean-status lean-status--confirm"><span>待现场确认</span><strong>{{ scoreMetric ? scoreMetric.pendingConfirmCount : '—' }}</strong></div>
            <div class="lean-status lean-status--pending"><span>待审核</span><strong>{{ scoreMetric ? scoreMetric.pendingCount : '—' }}</strong></div>
            <div class="lean-status lean-status--rejected"><span>未通过</span><strong>{{ scoreMetric ? scoreMetric.rejectedCount : '—' }}</strong></div>
          </div>
          <div v-if="scoreMetric && scoreMetric.totalCount > 0" class="lean-status-bar" aria-label="本月提案状态占比">
            <span class="lean-status-bar__segment lean-status-bar__segment--approved" :style="{ width: statusBarWidth(scoreMetric.statusApprovedCount) }"></span>
            <span class="lean-status-bar__segment lean-status-bar__segment--confirm" :style="{ width: statusBarWidth(scoreMetric.pendingConfirmCount) }"></span>
            <span class="lean-status-bar__segment lean-status-bar__segment--pending" :style="{ width: statusBarWidth(scoreMetric.pendingCount) }"></span>
            <span class="lean-status-bar__segment lean-status-bar__segment--rejected" :style="{ width: statusBarWidth(scoreMetric.rejectedCount) }"></span>
          </div>
          <div v-if="scoreMetric && scoreMetric.totalCount === 0" class="lean-empty">本月暂无已提交的提案</div>
          <div class="lean-status-legend">
            <span><i class="lean-status-dot lean-status-dot--approved"></i>已通过</span>
            <span><i class="lean-status-dot lean-status-dot--confirm"></i>待现场确认</span>
            <span><i class="lean-status-dot lean-status-dot--pending"></i>待审核</span>
            <span><i class="lean-status-dot lean-status-dot--rejected"></i>未通过</span>
          </div>
          <div class="lean-footnote"><CircleCheck /> 数据按现场确认通过结果自动更新</div>
        </section>
      </div>

      <div v-if="departmentRisks.length" class="panel risk-panel">
        <div class="panel-heading">
          <div>
            <span class="panel-kicker">ATTENTION</span>
            <h3>需要关注</h3>
            <p>只显示需要处理的运营信号</p>
          </div>
          <WarningFilled />
        </div>
        <div class="risk-list">
          <div v-for="risk in departmentRisks" :key="risk.title" :class="['risk-item', `risk-item--${risk.level}`]">
            <span class="risk-mark"><WarningFilled /></span>
            <div><strong>{{ risk.title }}</strong><small>{{ risk.detail }}</small></div>
            <el-tag :type="risk.level === 'danger' ? 'danger' : 'warning'" effect="light" round>{{ risk.label }}</el-tag>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-section dashboard-section--personal">
      <div class="section-heading">
        <div>
          <span class="section-eyebrow">MY WORKSPACE</span>
          <h2>我的任务</h2>
          <p>只展示分配给当前登录用户的任务，优先处理临近截止和逾期事项。</p>
        </div>
        <el-tag type="primary" effect="plain" round><User /> 我的任务</el-tag>
      </div>
      <div class="metric-grid metric-grid--personal">
        <article class="metric-card metric-card--indigo"><div class="metric-icon"><List /></div><span class="metric-label">我的任务</span><strong>{{ myTasks.length }}</strong><small>当前周期内分配任务</small></article>
        <article class="metric-card metric-card--green"><div class="metric-icon"><CircleCheck /></div><span class="metric-label">已完成</span><strong>{{ personalCompleted }}</strong><small>系统自动判断完成</small></article>
        <article class="metric-card metric-card--cyan"><div class="metric-icon"><CircleCheck /></div><span class="metric-label">完成率</span><strong>{{ personalRate }}%</strong><small>按任务完成情况统计</small></article>
        <article class="metric-card metric-card--amber"><div class="metric-icon"><Timer /></div><span class="metric-label">即将到期</span><strong>{{ personalDueSoon }}</strong><small>未来 24 小时内到期</small></article>
        <article class="metric-card metric-card--red"><div class="metric-icon"><WarningFilled /></div><span class="metric-label">逾期未完成</span><strong>{{ personalOverdue }}</strong><small>请及时跟进处理</small></article>
      </div>
      <div class="panel task-panel">
        <div class="panel-heading">
          <div><h3>任务进度</h3><p>离计划结束时间越近，提醒级别越高；完成任务显示真实完成时间。</p></div>
          <el-button text type="primary" @click="loadDashboard">同步进度 <ArrowRight /></el-button>
        </div>
        <div v-if="myTasks.length" class="task-list">
          <div v-for="task in sortedTasks" :key="`${task.ruleId}-${task.assignmentId}-${task.periodStart}`" :class="['task-row', `task-row--${taskTone(task)}`]">
            <div :class="['task-status-icon', { completed: task.status === 'COMPLETED' }]" ><CircleCheck v-if="task.status === 'COMPLETED'" /><WarningFilled v-else-if="taskTone(task) === 'danger'" /><Timer v-else /></div>
            <div class="task-main"><strong>{{ task.taskName }}</strong><div class="task-meta"><el-tag size="small" effect="plain" round>{{ taskTypeLabel(task.taskType) }}</el-tag><span>{{ task.periodStart }} ~ {{ task.periodEnd }}</span><span v-if="task.status === 'COMPLETED' && task.completedAt" class="completed-time">完成于 {{ formatDateTime(task.completedAt) }}</span><span v-else-if="task.deadline">截止 {{ formatDateTime(task.deadline) }}</span></div></div>
            <div class="task-count"><b>{{ task.completedCount }}</b><span>/ {{ task.requiredCount }}</span><small>完成数量</small></div>
            <div class="task-deadline"><span>{{ task.status === 'COMPLETED' ? '已完成' : taskTone(task) === 'danger' ? '已逾期' : '计划截止' }}</span><b v-if="task.status === 'COMPLETED' && task.completedAt">{{ formatDateTime(task.completedAt) }}</b><b v-else-if="task.deadline">{{ formatDateTime(task.deadline) }}</b><b v-else>未设置</b></div>
            <el-tag :type="statusTagType(task)" effect="light" round>{{ task.statusLabel || statusLabel(task.status) }}</el-tag>
          </div>
        </div>
        <el-empty v-else description="当前没有分配给你的任务" :image-size="72" />
      </div>
    </section>

    <el-drawer v-model="memberDrawer.visible" :title="memberDrawer.type === 'leave' ? '今日休假人员' : '在岗成员'" size="420px" append-to-body>
      <div class="member-drawer-context"><Calendar /> {{ todayLabel }} · {{ currentDeptName }}</div>
      <div v-if="memberDrawerItems.length" class="member-drawer-list">
        <div v-for="member in memberDrawerItems" :key="member.userId" class="member-drawer-item">
          <span :class="['member-avatar', { 'member-avatar--leave': memberDrawer.type === 'leave' }]">{{ memberInitial(member) }}</span>
          <div class="member-info"><strong>{{ memberDisplayName(member) }}</strong><small v-if="memberDrawer.type === 'leave'">{{ leaveType(member) }}</small><small v-else>{{ member.jobTitle || '未维护岗位' }}</small></div>
        </div>
      </div>
      <el-empty v-else :description="memberDrawer.type === 'leave' ? '今日暂无休假人员' : '暂无在岗成员'" :image-size="72" />
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ArrowRight, Calendar, CircleCheck, List, OfficeBuilding, Refresh, Timer, User, WarningFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getDailyCalendar } from '@/api/department/dailyReport';
import type { DailyCalendarMemberVO, DailyCalendarVO } from '@/api/department/dailyReport/types';
import { getScoreProposalMetric } from '@/api/department/scoreProposal';
import type { ScoreProposalMetricVO } from '@/api/department/scoreProposal/types';
import { listMyDepartmentTasks } from '@/api/department/task';
import type { DepartmentTaskProgressVO } from '@/api/department/task/types';
import { useDepartmentStore } from '@/store/modules/department';

const departmentStore = useDepartmentStore();
const loading = ref(false);
const calendar = ref<DailyCalendarVO>();
const scoreMetric = ref<ScoreProposalMetricVO>();
const myTasks = ref<DepartmentTaskProgressVO[]>([]);
const lastUpdated = ref('--');
const localNow = new Date();
const currentMonth = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}`;
const today = formatLocalDate(localNow);
const todayLabel = `${localNow.getFullYear()}年${localNow.getMonth() + 1}月${localNow.getDate()}日`;
const memberDrawer = reactive({ visible: false, type: 'onDuty' as 'onDuty' | 'leave' });

const currentDeptName = computed(() => departmentStore.currentDepartmentName || '未选择科室');
const monthLabel = computed(() => `${currentMonth.slice(0, 4)}年${Number(currentMonth.slice(5, 7))}月`);
const todayMembers = computed(() => (calendar.value?.members || []).filter(member => getTodayCell(member)?.state !== 'UNAVAILABLE'));
const leaveMembers = computed(() => todayMembers.value.filter(member => getTodayCell(member)?.state === 'LEAVE'));
const onDutyMembers = computed(() => todayMembers.value.filter(member => getTodayCell(member)?.state !== 'LEAVE'));
const memberCount = computed(() => onDutyMembers.value.length);
const reportRate = computed(() => { const required = calendar.value?.requiredCount || 0; return required ? Math.round(((calendar.value?.filledCount || 0) / required) * 100) : 0; });
const scoreLabel = computed(() => {
  if (!scoreMetric.value) return '等待同步';
  if (scoreMetric.value.score >= 2) return '优秀';
  if (scoreMetric.value.score >= 0) return '达标';
  return '需改善';
});
const scoreTagType = computed(() => {
  if (!scoreMetric.value) return 'info';
  if (scoreMetric.value.score >= 2) return 'success';
  if (scoreMetric.value.score >= 0) return 'primary';
  return 'danger';
});
const memberDrawerItems = computed(() => memberDrawer.type === 'leave' ? leaveMembers.value : onDutyMembers.value);
const now = () => new Date();
const isWithinHours = (value?: string, hours = 24) => { if (!value) return false; const diff = new Date(value).getTime() - now().getTime(); return diff >= 0 && diff <= hours * 3600000; };
const isOverdue = (task: DepartmentTaskProgressVO) => task.status === 'OVERDUE' || (task.status !== 'COMPLETED' && !!task.deadline && new Date(task.deadline).getTime() < now().getTime());
const dueSoonCount = computed(() => myTasks.value.filter(task => task.status !== 'COMPLETED' && isWithinHours(task.deadline)).length);
const overdueCount = computed(() => myTasks.value.filter(isOverdue).length);
const personalCompleted = computed(() => myTasks.value.filter(task => task.status === 'COMPLETED').length);
const personalRate = computed(() => myTasks.value.length ? Math.round((personalCompleted.value / myTasks.value.length) * 100) : 0);
const personalDueSoon = computed(() => dueSoonCount.value);
const personalOverdue = computed(() => overdueCount.value);
const sortedTasks = computed(() => [...myTasks.value].sort((a, b) => { const score = (task: DepartmentTaskProgressVO) => task.status === 'COMPLETED' ? 3 : isOverdue(task) ? 0 : isWithinHours(task.deadline) ? 1 : 2; return score(a) - score(b) || String(a.deadline || '').localeCompare(String(b.deadline || '')); }));
const departmentRisks = computed(() => {
  const risks: Array<{ title: string; detail: string; label: string; level: 'danger' | 'warning' }> = [];
  if (overdueCount.value) risks.push({ title: `${overdueCount.value} 项任务已经逾期`, detail: '请进入“我的任务”查看并完成处理。', label: '高风险', level: 'danger' });
  if (calendar.value?.missingCount) risks.push({ title: `${calendar.value.missingCount} 条日报尚未提交`, detail: '建议提醒相关成员在工作日结束前补齐。', label: '需关注', level: 'warning' });
  if (scoreMetric.value && scoreMetric.value.score < 0) risks.push({ title: '精益评分需要改善', detail: '当前已通过提案数量不足，请关注本月提案推进。', label: '需关注', level: 'warning' });
  return risks;
});

function formatLocalDate(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
function formatDateTime(value?: string) { return value ? value.replace('T', ' ').slice(0, 16) : '--'; }
function formatScore(value?: number) { if (value === undefined || value === null) return '—'; return `${value > 0 ? '+' : ''}${value} 分`; }
function statusBarWidth(value?: number) { const total = scoreMetric.value?.totalCount || 0; return total ? `${Math.max(0, Math.min(100, ((value || 0) / total) * 100))}%` : '0%'; }
function getTodayCell(member: DailyCalendarMemberVO) { return member.cells?.find(cell => cell.date === today); }
function memberDisplayName(member: DailyCalendarMemberVO) { return member.nickName || member.userName || '未命名成员'; }
function memberInitial(member: DailyCalendarMemberVO) { return memberDisplayName(member).slice(0, 1); }
function leaveType(member: DailyCalendarMemberVO) { return getTodayCell(member)?.leaveType || getTodayCell(member)?.label || '休假'; }
function openMemberDrawer(type: 'onDuty' | 'leave') { memberDrawer.type = type; memberDrawer.visible = true; }
function taskTypeLabel(type: string) { return ({ DAILY_REPORT: '日报', FIVE_WHY: '5WHY', SCORE_PROPOSAL: 'SCORE' } as Record<string, string>)[type] || type; }
function statusLabel(status: string) { return ({ COMPLETED: '已完成', OVERDUE: '已逾期', IN_PROGRESS: '进行中', NOT_STARTED: '未开始' } as Record<string, string>)[status] || status; }
function taskTone(task: DepartmentTaskProgressVO) { if (task.status === 'COMPLETED') return 'success'; if (isOverdue(task)) return 'danger'; if (isWithinHours(task.deadline)) return 'warning'; return 'normal'; }
function statusTagType(task: DepartmentTaskProgressVO) { return taskTone(task) === 'danger' ? 'danger' : taskTone(task) === 'warning' ? 'warning' : task.status === 'COMPLETED' ? 'success' : 'info'; }

async function loadDashboard() {
  loading.value = true;
  try {
    try { await departmentStore.load(); } catch { /* 无科室上下文时仍让页面保留空态 */ }
    const responses = await Promise.allSettled([getDailyCalendar(`${currentMonth}-01`), getScoreProposalMetric(currentMonth), listMyDepartmentTasks()]);
    const calendarRes = responses[0];
    const metricRes = responses[1];
    const taskRes = responses[2];
    calendar.value = calendarRes.status === 'fulfilled' ? calendarRes.value.data : undefined;
    scoreMetric.value = metricRes.status === 'fulfilled' ? metricRes.value.data : undefined;
    myTasks.value = taskRes.status === 'fulfilled' ? taskRes.value.data || [] : [];
    if (responses.every(response => response.status === 'rejected')) ElMessage.error('看板数据暂不可用，请检查当前科室或权限配置');
    lastUpdated.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } finally {
    loading.value = false;
  }
}

watch(() => departmentStore.switchRevision, () => loadDashboard());
onMounted(() => loadDashboard());
</script>

<style scoped lang="scss">
.dashboard-page { min-height: 100%; padding: 20px 24px 48px; color: var(--el-text-color-primary); background: var(--el-bg-color-page); }
.dashboard-hero { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; min-height: 158px; padding: 30px 36px; color: #eff6ff; border: 1px solid rgba(96, 165, 250, .28); border-radius: 20px; background: linear-gradient(115deg, #13243f 0%, #1d3a60 54%, #122d4d 100%); box-shadow: 0 14px 30px rgba(15, 38, 70, .14); }
.hero-content { position: relative; z-index: 1; }.hero-kicker { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; color: #93c5fd; font-size: 11px; font-weight: 800; letter-spacing: .16em; }.hero-kicker svg { width: 15px; }.dashboard-hero h1 { margin: 0 0 7px; font-size: 28px; }.dashboard-hero p { margin: 0; color: #bdd0e7; font-size: 14px; }.hero-context { display: flex; align-items: center; gap: 10px; margin-top: 20px; color: #d9e8f7; font-size: 13px; }.hero-context i { width: 3px; height: 3px; border-radius: 50%; background: #7da2c8; }.context-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 0 4px rgba(74, 222, 128, .16); }.sync-label { display: inline-flex; align-items: center; gap: 7px; color: #a9c2df; }.sync-pulse { width: 7px; height: 7px; border-radius: 50%; background: #64748b; }.sync-pulse.active { background: #fbbf24; animation: pulse 1s infinite; }.hero-refresh { position: relative; z-index: 1; color: #e7f1ff !important; border-color: rgba(191, 219, 254, .42) !important; background: rgba(255,255,255,.08) !important; }.hero-orb { position: absolute; border-radius: 50%; filter: blur(2px); opacity: .25; }.hero-orb--one { width: 290px; height: 290px; right: 16%; top: -200px; background: #60a5fa; }.hero-orb--two { width: 220px; height: 220px; right: -20px; bottom: -170px; background: #22d3ee; }
.dashboard-section { margin-top: 28px; }.dashboard-section--personal { margin-top: 34px; }.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin: 0 2px 14px; }.section-eyebrow, .panel-kicker { color: var(--el-color-primary); font-size: 11px; font-weight: 800; letter-spacing: .16em; }.section-heading h2 { margin: 4px 0; font-size: 22px; }.section-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }.section-heading .el-tag { display: inline-flex; align-items: center; gap: 5px; padding: 8px 13px; }.section-heading .el-tag svg { width: 14px; }
.metric-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }.metric-card { position: relative; overflow: hidden; min-height: 116px; padding: 16px 18px 13px; border: 1px solid var(--el-border-color-light); border-radius: 14px; background: var(--el-bg-color); box-shadow: 0 5px 16px rgba(30, 64, 100, .045); }.metric-card::after { position: absolute; right: -24px; bottom: -32px; width: 100px; height: 100px; border-radius: 50%; background: currentColor; opacity: .055; content: ''; }.metric-icon { display: flex; align-items: center; justify-content: center; width: 29px; height: 29px; margin-bottom: 9px; border-radius: 8px; background: currentColor; }.metric-icon svg { color: #fff; width: 15px; }.metric-label { display: block; color: var(--el-text-color-secondary); font-size: 12px; }.metric-card strong { display: block; margin: 1px 0 3px; color: currentColor; font-size: 26px; line-height: 1.15; }.metric-card small { color: var(--el-text-color-secondary); font-size: 11px; }.metric-card--blue { color: #3b82f6; }.metric-card--cyan { color: #0891b2; }.metric-card--green { color: #65a30d; }.metric-card--amber { color: #d97706; }.metric-card--red { color: #dc2626; }.metric-card--indigo { color: #6366f1; }
.dashboard-content-grid { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(320px, .7fr); gap: 14px; margin-top: 14px; }.panel { border: 1px solid var(--el-border-color-light); border-radius: 16px; background: var(--el-bg-color); box-shadow: 0 5px 16px rgba(30, 64, 100, .045); }.member-status-panel, .lean-panel, .task-panel, .risk-panel { padding: 20px; }.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }.panel-heading h3 { margin: 3px 0 5px; font-size: 16px; }.panel-heading p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; }.panel-heading > svg { width: 19px; color: var(--el-color-warning); opacity: .8; }.panel-kicker { display: block; font-size: 10px; }
.member-status-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; margin-top: 18px; }.member-status-group { min-width: 0; }.member-status-group--leave { padding-left: 22px; border-left: 1px solid var(--el-border-color-lighter); }.member-status-group__heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; color: var(--el-text-color-regular); font-size: 13px; font-weight: 600; }.member-status-group__heading .el-tag { font-size: 11px; }.member-list { max-height: 252px; overflow-y: auto; }.member-item { display: flex; align-items: center; width: 100%; min-height: 45px; padding: 7px 4px; border-bottom: 1px solid var(--el-border-color-lighter); }.member-more { display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%; min-height: 38px; padding: 7px 4px; border: 0; border-bottom: 1px solid var(--el-border-color-lighter); background: transparent; color: var(--el-color-primary); font: inherit; font-size: 12px; cursor: pointer; }.member-more:hover { background: var(--el-fill-color-lighter); }.member-more svg { width: 14px; }.member-avatar { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 30px; width: 30px; height: 30px; margin-right: 9px; border-radius: 50%; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 12px; font-weight: 700; }.member-avatar--leave { color: var(--el-color-warning); background: var(--el-color-warning-light-9); }.member-info { display: flex; flex: 1; flex-direction: column; min-width: 0; }.member-info strong, .member-info small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.member-info strong { font-size: 13px; }.member-info small { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 11px; }
.lean-panel { display: flex; flex-direction: column; }.lean-summary { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(120px, .8fr); gap: 10px; margin-top: 20px; }.lean-score-box, .lean-total-box { display: flex; align-items: center; justify-content: space-between; min-height: 80px; padding: 14px; border-radius: 12px; background: var(--el-fill-color-lighter); }.lean-score-box > div, .lean-total-copy { display: flex; flex-direction: column; }.lean-score-box span, .lean-total-copy span, .lean-total-copy small { color: var(--el-text-color-secondary); font-size: 12px; }.lean-score-box strong { display: block; margin-top: 8px; color: var(--el-color-success); font-size: 28px; line-height: 1; }.lean-total-box strong { flex: 0 0 auto; margin-left: 14px; color: var(--el-color-primary); font-size: 30px; line-height: 1; }.lean-total-copy span { white-space: nowrap; }.lean-total-copy small { margin-top: 5px; font-size: 10px; }.lean-status-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }.lean-status { display: flex; align-items: center; justify-content: space-between; min-height: 43px; padding: 9px 11px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-bg-color); }.lean-status span { color: var(--el-text-color-secondary); font-size: 11px; }.lean-status strong { font-size: 19px; line-height: 1; }.lean-status--approved strong { color: var(--el-color-success); }.lean-status--confirm strong { color: #2563eb; }.lean-status--pending strong { color: var(--el-color-warning); }.lean-status--rejected strong { color: var(--el-color-danger); }.lean-status-bar { display: flex; height: 8px; margin-top: 16px; overflow: hidden; border-radius: 999px; background: var(--el-fill-color); }.lean-status-bar__segment { min-width: 0; transition: width .3s ease; }.lean-status-bar__segment--approved { background: var(--el-color-success); }.lean-status-bar__segment--confirm { background: #60a5fa; }.lean-status-bar__segment--pending { background: var(--el-color-warning); }.lean-status-bar__segment--rejected { background: var(--el-color-danger); }.lean-status-legend { display: flex; flex-wrap: wrap; gap: 7px 12px; margin-top: 10px; color: var(--el-text-color-secondary); font-size: 10px; }.lean-status-legend span { display: inline-flex; align-items: center; gap: 4px; }.lean-status-dot { width: 6px; height: 6px; border-radius: 50%; }.lean-status-dot--approved { background: var(--el-color-success); }.lean-status-dot--confirm { background: #60a5fa; }.lean-status-dot--pending { background: var(--el-color-warning); }.lean-status-dot--rejected { background: var(--el-color-danger); }.lean-empty { margin-top: 16px; padding: 13px; border-radius: 10px; color: var(--el-text-color-secondary); background: var(--el-fill-color-lighter); font-size: 12px; text-align: center; }.lean-footnote { display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 18px; color: var(--el-text-color-secondary); font-size: 11px; }.lean-footnote svg { width: 14px; color: var(--el-color-success); }
.risk-panel { margin-top: 14px; }.risk-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 15px; }.risk-item { display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 10px 12px; border: 1px solid var(--el-border-color-lighter); border-left: 3px solid var(--el-color-info); border-radius: 10px; background: var(--el-fill-color-lighter); }.risk-item--danger { border-left-color: var(--el-color-danger); }.risk-item--warning { border-left-color: var(--el-color-warning); }.risk-item--success { border-left-color: var(--el-color-success); }.risk-mark { display: flex; align-items: center; justify-content: center; width: 24px; color: var(--el-color-warning); }.risk-item--danger .risk-mark { color: var(--el-color-danger); }.risk-item--success .risk-mark { color: var(--el-color-success); }.risk-item > div { display: flex; flex: 1; flex-direction: column; min-width: 0; }.risk-item strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }.risk-item small { margin-top: 3px; overflow: hidden; color: var(--el-text-color-secondary); text-overflow: ellipsis; white-space: nowrap; font-size: 11px; }.risk-item .el-tag { flex: 0 0 auto; }
.task-panel { margin-top: 14px; }.task-panel > .panel-heading { align-items: center; }.task-list { margin-top: 17px; }.task-row { display: flex; align-items: center; gap: 14px; min-height: 75px; padding: 10px 12px; border-bottom: 1px solid var(--el-border-color-lighter); border-left: 3px solid var(--el-border-color); transition: background .2s, border-color .2s; }.task-row:hover { background: var(--el-fill-color-lighter); }.task-row--danger { border-left-color: var(--el-color-danger); background: var(--el-color-danger-light-9); }.task-row--warning { border-left-color: var(--el-color-warning); background: var(--el-color-warning-light-9); }.task-row--success { border-left-color: var(--el-color-success); }.task-status-icon { display: flex; align-items: center; justify-content: center; flex: 0 0 31px; width: 31px; height: 31px; border-radius: 10px; color: var(--el-color-warning); background: var(--el-color-warning-light-9); }.task-status-icon.completed { color: var(--el-color-success); background: var(--el-color-success-light-9); }.task-status-icon svg { width: 17px; }.task-main { flex: 1; min-width: 0; }.task-main > strong { display: block; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }.task-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; color: var(--el-text-color-secondary); font-size: 11px; }.task-meta .el-tag { font-size: 10px; }.completed-time { color: var(--el-color-success); }.task-count { display: flex; flex: 0 0 72px; flex-direction: column; text-align: right; }.task-count b { color: var(--el-color-primary); font-size: 18px; }.task-count span { color: var(--el-text-color-secondary); font-size: 11px; }.task-count small { color: var(--el-text-color-secondary); font-size: 10px; }.task-deadline { display: flex; flex: 0 0 145px; flex-direction: column; gap: 3px; }.task-deadline span { color: var(--el-text-color-secondary); font-size: 10px; }.task-deadline b { font-size: 12px; }.task-row--danger .task-deadline b { color: var(--el-color-danger); }.task-row--warning .task-deadline b { color: var(--el-color-warning); }
.member-drawer-context { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; padding: 10px 12px; border-radius: 10px; color: var(--el-text-color-secondary); background: var(--el-fill-color-lighter); font-size: 12px; }.member-drawer-context svg { width: 15px; color: var(--el-color-primary); }.member-drawer-list { display: flex; flex-direction: column; }.member-drawer-item { display: flex; align-items: center; min-height: 58px; border-bottom: 1px solid var(--el-border-color-lighter); }
@keyframes pulse { 50% { opacity: .35; transform: scale(.7); } }
@media (max-width: 1250px) { .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }.dashboard-content-grid { grid-template-columns: 1fr; }.lean-panel { min-height: 210px; }.risk-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 760px) { .dashboard-page { padding: 12px 12px 30px; }.dashboard-hero { align-items: flex-start; flex-direction: column; gap: 18px; padding: 24px; }.dashboard-hero h1 { font-size: 25px; }.hero-context { flex-wrap: wrap; row-gap: 7px; }.section-heading { align-items: flex-start; flex-direction: column; }.metric-grid, .member-status-columns, .risk-list { grid-template-columns: 1fr; }.member-status-group--leave { padding-top: 16px; padding-left: 0; border-top: 1px solid var(--el-border-color-lighter); border-left: 0; }.task-row { align-items: flex-start; flex-wrap: wrap; gap: 9px; }.task-main { flex-basis: calc(100% - 46px); }.task-count, .task-deadline { margin-left: 45px; }.task-deadline { flex-basis: auto; }.task-row > .el-tag { margin-left: auto; } }
</style>
