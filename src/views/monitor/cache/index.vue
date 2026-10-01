<template>
  <div class="p-2 app-container monitor-cache-page">
    <el-row :gutter="12" class="cache-grid">
      <el-col :span="24">
        <UiCard shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <h3>{{ $t('common.sectionCacheOverview') }}</h3>
                <p>{{ $t('common.cacheMonitorDesc') }}</p>
              </div>
            </div>
          </template>

          <div class="el-table el-table--enable-row-hover el-table--medium cache-table">
            <table style="width: 100%">
              <tbody>
                <tr>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.redisVersion') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">{{ cache.info.redis_version }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.runMode') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">
                      {{ cache.info.redis_mode === 'standalone' ? '单机' : '集群' }}
                    </div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.port') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">{{ cache.info.tcp_port }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.clientCount') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">{{ cache.info.connected_clients }}</div>
                  </td>
                </tr>
                <tr>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.uptimeDays') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">{{ cache.info.uptime_in_days }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.usedMemory') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">{{ cache.info.used_memory_human }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.usedCpu') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">
                      {{ parseFloat(cache.info.used_cpu_user_children).toFixed(2) }}
                    </div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.memoryConfig') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">{{ cache.info.maxmemory_human }}</div>
                  </td>
                </tr>
                <tr>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.aofEnabled') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">
                      {{ cache.info.aof_enabled === '0' ? '否' : '是' }}
                    </div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.rdbSuccess') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">
                      {{ cache.info.rdb_last_bgsave_status }}
                    </div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.keyCount') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.dbSize" class="cell">{{ cache.dbSize }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div class="cell">{{ $t('common.networkInOut') }}</div>
                  </td>
                  <td class="el-table__cell is-leaf">
                    <div v-if="cache.info" class="cell">
                      {{ cache.info.instantaneous_input_kbps }}kps/{{ cache.info.instantaneous_output_kbps }}kps
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UiCard>
      </el-col>

      <el-col :xs="24" :lg="12">
        <UiCard shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <h3>{{ $t('common.sectionCommandStats') }}</h3>
              </div>
            </div>
          </template>
          <div class="el-table el-table--enable-row-hover el-table--medium cache-chart">
            <div ref="commandstats" style="height: 420px" />
          </div>
        </UiCard>
      </el-col>

      <el-col :xs="24" :lg="12">
        <UiCard shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <h3>{{ $t('common.sectionMemoryInfo') }}</h3>
              </div>
            </div>
          </template>
          <div class="el-table el-table--enable-row-hover el-table--medium cache-chart">
            <div ref="usedmemory" style="height: 420px" />
          </div>
        </UiCard>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Cache" lang="ts">
import * as echarts from 'echarts';
import { UiCard } from '@/components/UiKit';
import { getCache } from '@/api/monitor/cache';
import { CacheVO } from '@/api/monitor/cache/types';
import modal from '@/plugins/modal';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

const cache = ref<Partial<CacheVO>>({});
const settingsStore = useSettingsStore();
const commandstats = ref();
const usedmemory = ref();
let commandstatsInstance: echarts.ECharts | undefined;
let usedmemoryInstance: echarts.ECharts | undefined;

const handleResize = () => {
  commandstatsInstance?.resize();
  usedmemoryInstance?.resize();
};

const disposeCharts = () => {
  commandstatsInstance?.dispose();
  usedmemoryInstance?.dispose();
  commandstatsInstance = undefined;
  usedmemoryInstance = undefined;
};

const chartColors = () => {
  const isAnimal = settingsStore.uiTheme === UiThemeEnum.ANIMAL;
  const isDark = settingsStore.dark;
  return {
    text: isAnimal ? (isDark ? '#f5ead1' : '#5c513f') : isDark ? '#e5e7eb' : '#303133',
    muted: isAnimal ? (isDark ? '#b9c9c2' : '#8c8170') : isDark ? '#a3a3a3' : '#909399',
    border: isAnimal ? (isDark ? '#617a72' : '#d8cdb8') : isDark ? '#4b5563' : '#dcdfe6',
    accent: isAnimal ? (isDark ? '#65d8ca' : '#4db6ac') : '#409eff',
    secondary: isAnimal ? (isDark ? '#e1b365' : '#d79b4a') : '#67c23a'
  };
};

const renderCharts = (data: Partial<CacheVO>) => {
  if (!commandstats.value || !usedmemory.value || !data.info) return;
  const colors = chartColors();
  disposeCharts();
  commandstatsInstance = echarts.init(commandstats.value, undefined, { renderer: 'canvas' });
  commandstatsInstance.setOption({
    color: [colors.accent, colors.secondary, '#9b8ce6', '#e58a82', '#7db8d8'],
    textStyle: { color: colors.text },
    tooltip: {
      trigger: 'item',
      textStyle: { color: colors.text },
      backgroundColor: settingsStore.dark ? '#22312f' : '#ffffff',
      borderColor: colors.border,
      formatter: '{a} <br/>{b} : {c} ({d}%)'
    },
    series: [
      {
        name: '命令',
        type: 'pie',
        roseType: 'radius',
        radius: [15, 95],
        center: ['50%', '38%'],
        label: { color: colors.text },
        labelLine: { lineStyle: { color: colors.muted } },
        data: data.commandStats,
        animationEasing: 'cubicInOut',
        animationDuration: 1000
      }
    ]
  });
  usedmemoryInstance = echarts.init(usedmemory.value, undefined, { renderer: 'canvas' });
  usedmemoryInstance.setOption({
    textStyle: { color: colors.text },
    tooltip: {
      textStyle: { color: colors.text },
      backgroundColor: settingsStore.dark ? '#22312f' : '#ffffff',
      borderColor: colors.border,
      formatter: '{b} <br/>{a} : ' + data.info.used_memory_human
    },
    series: [
      {
        name: '峰值',
        type: 'gauge',
        min: 0,
        max: 1000,
        axisLine: { lineStyle: { width: 14, color: [[0.7, colors.accent], [1, colors.border]] } },
        axisTick: { lineStyle: { color: colors.muted } },
        axisLabel: { color: colors.muted },
        splitLine: { lineStyle: { color: colors.muted } },
        pointer: { itemStyle: { color: colors.accent } },
        detail: { color: colors.text, formatter: data.info.used_memory_human },
        title: { color: colors.muted },
        data: [
          {
            value: parseFloat(data.info.used_memory_human || '0'),
            name: '内存消耗'
          }
        ]
      }
    ]
  });
};

const getList = async () => {
  modal.loading('正在加载缓存监控数据，请稍候！');
  try {
    const res = await getCache();
    cache.value = res.data;
    renderCharts(res.data);
  } finally {
    modal.closeLoading();
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  getList();
});

watch(
  [() => settingsStore.dark, () => settingsStore.uiTheme],
  () => {
    if (cache.value.info) renderCharts(cache.value);
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  disposeCharts();
});
</script>

<style lang="scss" scoped>
.cache-grid {
  row-gap: 12px;
}

.cache-table {
  overflow: hidden;
  background: var(--app-surface-bg);
  border: 1px solid var(--app-surface-border);
  border-radius: 10px;
}

.cache-table .el-table__cell {
  color: var(--el-text-color-regular);
  background: transparent;
  border-color: var(--app-surface-border);
}

.cache-table .el-table__cell:nth-child(odd) {
  color: var(--el-text-color-secondary);
}

.cache-table table {
  border-collapse: collapse;
}

.cache-chart {
  overflow: hidden;
  min-height: 420px;
  background: var(--app-surface-bg);
  border-radius: 10px;
}

:global(html[data-ui-theme='animal'] .monitor-cache-page .ui-animal-card) {
  background: var(--app-surface-bg);
}
</style>
