<template>
  <div class="table-skeleton">
    <el-skeleton animated :throttle="500" :rows="rows">
      <template #template>
        <!-- 模拟表头 -->
        <div class="skeleton-header-row">
          <el-skeleton-item
            v-for="i in columns"
            :key="'h' + i"
            variant="rect"
            class="skeleton-col"
            style="height: 40px; border-radius: 8px"
          />
        </div>
        <!-- 模拟数据行 -->
        <div v-for="row in rows" :key="'r' + row" class="skeleton-row">
          <el-skeleton-item
            v-for="col in columns"
            :key="'c' + row + '-' + col"
            variant="rect"
            class="skeleton-col"
            style="height: 36px; border-radius: 6px"
          />
        </div>
        <!-- 模拟分页 -->
        <div class="skeleton-pagination">
          <el-skeleton-item variant="rect" style="width: 240px; height: 28px; border-radius: 6px" />
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rows?: number;
  columns?: number;
}

withDefaults(defineProps<Props>(), {
  rows: 8,
  columns: 5,
});
</script>

<style lang="scss" scoped>
.table-skeleton {
  padding: 16px;
}

.skeleton-header-row,
.skeleton-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.skeleton-header-row {
  margin-bottom: 16px;
}

.skeleton-col {
  flex: 1;
}

.skeleton-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
}

// 骨架屏亮/暗色适配
:deep(.el-skeleton__item) {
  background: var(--el-fill-color, #f0f2f5);
}

html.dark :deep(.el-skeleton__item) {
  background: rgba(148, 163, 184, 0.1);
}
</style>
