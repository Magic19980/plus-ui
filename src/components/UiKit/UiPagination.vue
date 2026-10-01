<template>
  <AnimalPagination
    v-if="isAnimalMode"
    v-bind="animalAttrs"
    class="ui-pagination-animal"
    :total="total"
    :current="page"
    :page-size="limit"
    :show-size-changer="showSizeChanger"
    :page-size-options="pageSizeOptions"
    :show-quick-jumper="showQuickJumper"
    :show-total="showTotal"
    variant="teal"
    @update:current="handlePageUpdate"
    @update:page-size="handleLimitUpdate"
    @change="handleAnimalChange"
  />
  <pagination
    v-else
    v-bind="officeAttrs"
    :page="page"
    :limit="limit"
    :total="total"
    @update:page="handlePageUpdate"
    @update:limit="handleLimitUpdate"
    @pagination="handleOfficePagination"
  />
</template>

<script setup lang="ts">
/**
 * 统一分页适配器。
 * Animal 模式使用组件库原生分页，办公模式沿用项目现有分页组件，
 * 对业务层统一暴露 page/limit/pagination 事件。
 */
import { computed, defineAsyncComponent, useAttrs } from 'vue';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    page?: number;
    limit?: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
    showQuickJumper?: boolean;
    showTotal?: boolean;
  }>(),
  {
    page: 1,
    limit: 10,
    showSizeChanger: true,
    pageSizeOptions: () => [10, 20, 50, 100],
    showQuickJumper: true,
    showTotal: true
  }
);

const emit = defineEmits<{
  'update:page': [value: number];
  'update:limit': [value: number];
  pagination: [{ page: number; limit: number }];
}>();

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const AnimalPagination = defineAsyncComponent(() => import('animal-island-vue').then(({ Pagination }) => Pagination));

const animalAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  ['page', 'limit', 'total', 'show-size-changer', 'page-size-options', 'show-quick-jumper', 'show-total', 'onUpdatePage', 'onUpdateLimit', 'onPagination'].forEach(key => Reflect.deleteProperty(nextAttrs, key));
  return nextAttrs;
});

const officeAttrs = computed(() => {
  const nextAttrs = { ...attrs };
  ['page', 'limit', 'total', 'showSizeChanger', 'pageSizeOptions', 'showQuickJumper', 'showTotal', 'onUpdatePage', 'onUpdateLimit', 'onPagination'].forEach(key => Reflect.deleteProperty(nextAttrs, key));
  return nextAttrs;
});

const handlePageUpdate = (value: number) => emit('update:page', value);
const handleLimitUpdate = (value: number) => emit('update:limit', value);
const emitPagination = (page: number, limit: number) => emit('pagination', { page, limit });
const handleAnimalChange = (page: number, limit: number) => {
  emit('update:page', page);
  emit('update:limit', limit);
  emitPagination(page, limit);
};
const handleOfficePagination = (payload: { page: number; limit: number }) => emitPagination(payload.page, payload.limit);
</script>

<style scoped lang="scss">
/**
 * 分页栏统一靠右，与表格内容形成稳定的尾部对齐线。
 * 根节点允许换行，窄屏时控件仍靠右排列，避免按钮把页面撑出横向滚动。
 */
:global(.ui-pagination-animal) {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
  min-height: 52px;
  margin-top: 18px;
  padding: 12px 0 4px;
  border-top: 1px solid color-mix(in srgb, var(--animal-border-color-light, #e8e2d6) 78%, transparent);
}

// 统一动森分页内部控件的尺寸和层次，避免不同页面因默认间距产生视觉跳动。
:global(.ui-pagination-animal .animal-pagination__item) {
  width: 34px;
  height: 34px;
  border: 1px solid color-mix(in srgb, var(--animal-border-color-light, #e8e2d6) 88%, transparent);
  border-radius: 12px;
  background: var(--animal-bg-color-input, #fffbe7);
  box-shadow: 0 2px 0 var(--animal-shadow-soft, #d4c9b4);
}

:global(.ui-pagination-animal .animal-pagination__total),
:global(.ui-pagination-animal .animal-pagination__size-changer),
:global(.ui-pagination-animal .animal-pagination__jumper) {
  margin-inline: 0;
}

:global(.ui-pagination-animal .animal-pagination__item:hover:not(:disabled):not(.animal-pagination__item--active)) {
  border-color: var(--animal-primary-color, #19c8b9);
  background: var(--animal-primary-color-bg, #e6f9f6);
  color: var(--animal-primary-color, #19c8b9);
}

:global(.ui-pagination-animal .animal-pagination__item--active) {
  border-color: var(--animal-primary-color, #19c8b9);
  border-radius: 12px;
  box-shadow: 0 2px 0 var(--animal-primary-color-active, #0ea89c);
}

:global(.ui-pagination-animal .animal-pagination__size-trigger) {
  min-height: 34px;
  border-width: 1px;
  border-radius: 12px;
  box-shadow: 0 2px 0 var(--animal-shadow-soft, #d4c9b4);
}

:global(.ui-pagination-animal .animal-pagination__jumper-input) {
  border: 1px solid color-mix(in srgb, var(--animal-border-color-light, #e8e2d6) 88%, transparent);
  box-shadow: 0 2px 0 var(--animal-shadow-soft, #d4c9b4);
}

// UiTable 内置分页已经由表格容器提供分隔线和内边距，避免重复叠加。
:global(.ui-animal-table__pagination .ui-pagination-animal) {
  min-height: 34px;
  margin-top: 0;
  padding: 0;
  border-top: 0;
}

@media (max-width: 768px) {
  :global(.ui-pagination-animal) {
    justify-content: flex-end;
    row-gap: 8px;
  }
}
</style>
