<template>
  <div class="p-2 app-container department-weekly-report-page">
    <el-card shadow="hover" class="search-panel">
      <div class="query-toolbar">
        <div class="week-date-control">
          <span class="week-date-label">周报日期</span>
          <el-date-picker
            v-model="weekStart"
            class="week-date-picker"
            type="date"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            :clearable="false"
            placeholder="选择日期"
            @change="normalizeWeekStart"
          />
          <span class="week-date-hint">自动统计该日期所在周</span>
        </div>
        <div class="query-actions">
          <el-button type="primary" icon="Search" @click="loadSummary">获取汇总</el-button>
          <el-button v-hasPermi="['department:weeklyReport:add']" type="success" icon="DocumentAdd" @click="handleGenerate">
            生成周报快照
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card v-loading="summaryLoading" shadow="hover" class="summary-panel mt-2">
      <template #header>
        <DepartmentPanelHeader kicker="Weekly Department Report" :title="`${summary?.weekStart || weekStart} 至 ${summary?.weekEnd || '—'}`" description="运维指标与周报快照" />
      </template>

      <el-divider content-position="left">运维指标</el-divider>
      <DepartmentMetricGrid v-if="summary?.operationSummary" :columns="5">
        <DepartmentMetricCard :value="summary.operationSummary.totalCount" label="运维总量" tone="blue" />
        <DepartmentMetricCard :value="summary.operationSummary.resolvedCount" label="已解决记录" tone="green" />
        <DepartmentMetricCard :value="`${summary.operationSummary.resolutionRate}%`" label="运维解决率" tone="teal" />
        <DepartmentMetricCard :value="`${summary.operationSummary.averageProcessingMinutes}分钟`" label="平均处理时长" tone="orange" />
        <DepartmentMetricCard :value="`${summary.operationSummary.onlineRate}%`" label="系统在线率" tone="red" />
      </DepartmentMetricGrid>

      <el-empty v-if="!summary" description="请选择日期获取周报汇总" />
    </el-card>

    <el-card shadow="hover" class="history-panel mt-2">
      <template #header>
        <DepartmentPanelHeader title="周报快照历史" description="快照用于保证历史周报不随台账后续修改而漂移">
          <el-button icon="Refresh" @click="getList">刷新</el-button>
        </DepartmentPanelHeader>
      </template>
      <el-table v-loading="loading" border :data="reportList">
        <el-table-column label="周报周期" min-width="220" align="center">
          <template #default="scope">{{ scope.row.weekStart }} 至 {{ scope.row.weekEnd }}</template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="260" show-overflow-tooltip />
        <el-table-column label="生成时间" prop="createTime" width="180" align="center" />
        <el-table-column label="操作" fixed="right" width="130" align="center">
          <template #default="scope">
            <el-button v-hasPermi="['department:weeklyReport:export']" link type="primary" icon="Download" @click="handleExport(scope.row)">导出 PPT</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="DepartmentWeeklyReport" lang="ts">
import { onMounted, ref, reactive } from 'vue';
import type { WeeklyReportSummaryVO, WeeklyReportVO } from '@/api/department/weeklyReport/types';
import { generateWeeklyReport, getWeeklyReportSummary, listWeeklyReport } from '@/api/department/weeklyReport';
import DepartmentMetricCard from '@/components/Department/MetricCard.vue';
import DepartmentMetricGrid from '@/components/Department/MetricGrid.vue';
import DepartmentPanelHeader from '@/components/Department/PanelHeader.vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { download as requestDownload } from '@/utils/request';

const { loading, withLoading } = useLoading();
const summaryLoading = ref(false);
const reportList = ref<WeeklyReportVO[]>([]);
const total = ref(0);
const summary = ref<WeeklyReportSummaryVO>();
const weekStart = ref(getCurrentMonday());
const queryParams = reactive({ pageNum: 1, pageSize: 10, beginDate: undefined as string | undefined, endDate: undefined as string | undefined });

function getCurrentMonday() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return formatDate(date);
}

function formatDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const normalizeWeekStart = (value?: string | null) => {
  if (!value) {
    weekStart.value = getCurrentMonday();
    return;
  }
  const date = new Date(`${value}T00:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  weekStart.value = formatDate(date);
  summary.value = undefined;
};

const loadSummary = async () => {
  summaryLoading.value = true;
  try {
    const res = await getWeeklyReportSummary(weekStart.value);
    summary.value = res.data;
  } finally {
    summaryLoading.value = false;
  }
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listWeeklyReport(queryParams);
    reportList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleGenerate = async () => {
  await modal.confirm(`确认生成 ${summary.value?.weekStart || weekStart.value} 至 ${summary.value?.weekEnd || '本周'} 的周报快照吗？`);
  await generateWeeklyReport({ weekStart: weekStart.value });
  modal.msgSuccess('周报快照生成成功');
  await Promise.all([getList(), loadSummary()]);
};

const handleExport = (row: WeeklyReportVO) => {
  requestDownload(`department/weeklyReport/export/${row.id}`, {}, `weekly_report_${row.weekStart.replaceAll('-', '')}.pptx`);
};

onMounted(() => {
  loadSummary();
  getList();
});
</script>

<style scoped lang="scss">
.department-weekly-report-page {
  .query-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 12px 18px; }
  .week-date-control { display: flex; align-items: center; flex-wrap: nowrap; gap: 10px; min-width: 0; }
  .week-date-label { flex: none; color: var(--el-text-color-regular); font-weight: 600; white-space: nowrap; }
  .week-date-picker { width: 180px; }
  .week-date-hint { color: var(--el-text-color-secondary); font-size: 13px; white-space: nowrap; }
  .query-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-left: auto; }
  :deep(.department-metric-grid) { margin-bottom: 8px; }
  @media (max-width: 700px) {
    .week-date-control { flex-wrap: wrap; }
    .week-date-hint { flex-basis: 100%; margin-left: 0; }
  }
}
</style>
