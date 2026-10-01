<template>
  <div :class="{ hidden: hidden }" class="pagination-container">
    <el-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :background="background"
      :layout="layout"
      :page-sizes="pageSizes"
      :pager-count="pagerCount"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup name="Pagination" lang="ts">
import { propTypes } from '@/utils/propTypes';
import { scrollTo } from '@/utils/scroll-to';

const props = defineProps({
  total: propTypes.number,
  page: propTypes.number.def(1),
  limit: propTypes.number.def(20),
  pageSizes: { type: Array<number>, default: () => [10, 20, 30, 50] },
  // 移动端页码按钮的数量端默认值5
  pagerCount: propTypes.number.def(document.body.clientWidth < 992 ? 5 : 7),
  layout: propTypes.string.def('total, sizes, prev, pager, next, jumper'),
  background: propTypes.bool.def(true),
  autoScroll: propTypes.bool.def(true),
  hidden: propTypes.bool.def(false),
  float: propTypes.string.def('right')
});

const emit = defineEmits(['update:page', 'update:limit', 'pagination']);
const currentPage = computed({
  get() {
    return props.page;
  },
  set(val) {
    emit('update:page', val);
  }
});
const pageSize = computed({
  get() {
    return props.limit;
  },
  set(val) {
    emit('update:limit', val);
  }
});
function handleSizeChange(val: number) {
  if (currentPage.value * val > props.total) {
    currentPage.value = 1;
  }
  emit('pagination', { page: currentPage.value, limit: val });
  if (props.autoScroll) {
    scrollTo(0, 800);
  }
}
function handleCurrentChange(val: number) {
  emit('pagination', { page: val, limit: pageSize.value });
  if (props.autoScroll) {
    scrollTo(0, 800);
  }
}
</script>

<style lang="scss" scoped>
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  min-height: 52px;
  padding: 12px 0 4px;
  margin-top: 18px;
  border-top: 1px solid var(--app-surface-border);

  .el-pagination {
    // 统一 Element Plus 分页令牌，使直接使用 pagination 组件的旧页面
    // 与 UiPagination 适配器拥有相同的尺寸、圆角和间距。
    --el-pagination-font-size: 13px;
    --el-pagination-bg-color: var(--app-surface-bg);
    --el-pagination-text-color: var(--app-text-muted);
    --el-pagination-border-radius: 12px;
    --el-pagination-button-color: var(--app-text-title);
    --el-pagination-button-bg-color: var(--app-elevated-soft-bg);
    --el-pagination-button-disabled-color: var(--app-text-muted);
    --el-pagination-button-disabled-bg-color: var(--app-surface-bg);
    --el-pagination-hover-color: var(--app-accent-strong);
    --el-pagination-item-gap: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
    float: none;
  }

  // Element Plus 和动森分页共用胶囊按钮的尺寸与层次，旧页面也能保持一致。
  :deep(.el-pagination .btn-prev),
  :deep(.el-pagination .btn-next),
  :deep(.el-pagination .el-pager li) {
    border: 1px solid var(--app-surface-border);
    border-radius: 12px;
    box-shadow: 0 2px 0 var(--app-surface-border);
    transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  }

  :deep(.el-pagination .btn-prev:hover:not(:disabled)),
  :deep(.el-pagination .btn-next:hover:not(:disabled)),
  :deep(.el-pagination .el-pager li:hover:not(.is-disabled):not(.is-active)) {
    border-color: var(--app-accent-strong);
    background-color: color-mix(in srgb, var(--app-accent-strong) 12%, var(--app-elevated-soft-bg));
    transform: translateY(-1px);
  }

  :deep(.el-pagination .el-pager li.is-active) {
    border-color: var(--app-accent-strong);
    box-shadow: 0 2px 0 color-mix(in srgb, var(--app-accent-strong) 70%, var(--app-surface-border));
  }

  :deep(.el-pagination .el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 0 0 1px var(--app-surface-border) inset, 0 2px 0 var(--app-surface-border);
  }
}
.pagination-container.hidden {
  display: none;
}
</style>
