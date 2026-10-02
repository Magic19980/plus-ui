<template>
  <UiTable
    v-if="useAnimalTable"
    ref="animalTableRef"
    v-bind="animalAttrs"
    :columns="animalColumns"
    :data="data"
    :row-key="rowKey"
    :striped="stripe"
    :show-header="showHeader"
    :default-sort="defaultSort"
    :current-row-key="currentRowKey"
    :highlight-current-row="highlightCurrentRow"
    :default-expand-all="defaultExpandAll"
    :tree-props="treeProps"
    :lazy="lazy"
    :load="load"
    :scroll="tableScroll"
    :loading="loading"
    class="department-data-table"
  >
    <template #empty>
      <slot name="empty">
        <div class="department-data-table__empty">{{ emptyText }}</div>
      </slot>
    </template>
  </UiTable>

  <el-table
    v-else
    ref="officeTableRef"
    v-bind="officeAttrs"
    v-loading="loading"
    :data="data"
    :row-key="elementRowKey"
    :stripe="stripe"
    :show-header="showHeader"
    :default-sort="defaultSort"
    :current-row-key="currentRowKey"
    :highlight-current-row="highlightCurrentRow"
    :default-expand-all="defaultExpandAll"
    :tree-props="treeProps"
    :lazy="lazy"
    :load="load"
    :max-height="maxHeight"
    class="department-data-table"
  >
    <slot />
  </el-table>
</template>

<script setup lang="ts">
import { ElTableColumn } from 'element-plus';
/**
 * 部门业务表格兼容层。
 *
 * 旧页面仍然可以使用 Element Plus 的 el-table-column 写法；办公模式原样
 * 渲染，动森模式则把列 VNode 转换为 UiTable 的主题无关列模型，避免大量
 * 业务表格因为历史写法直接回退到 Element Plus。
 */
import { Comment, Fragment, computed, isVNode, ref, useAttrs, useSlots, type VNode, type VNodeChild } from 'vue';
import { UiTable } from '@/components/UiKit';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

type TableKey = string | number;
type TableRecord = Record<string, unknown>;
type TableSortOrder = 'ascending' | 'descending' | null;
type TableLoadHandler = (
  row: TableRecord,
  treeNode: Record<string, unknown>,
  resolve: (children: TableRecord[]) => void
) => void | Promise<unknown>;
type LegacyColumnProps = Record<string, unknown>;
type ColumnScope = { row: TableRecord; $index: number; column: LegacyColumnProps };
type ColumnSlot = (scope: ColumnScope) => VNodeChild;

interface AnimalColumn {
  key?: string;
  title: string;
  dataIndex?: string;
  type?: 'selection' | 'index' | 'expand' | string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  sortable?: boolean | 'custom';
  filters?: Array<{ text?: string; label?: string; value: unknown }>;
  filterMultiple?: boolean;
  filteredValue?: unknown[];
  filterMethod?: (value: unknown, record: TableRecord, column: LegacyColumnProps) => boolean;
  index?: number | ((index: number) => number);
  selectable?: boolean | ((record: TableRecord, index: number) => boolean);
  className?: string;
  showOverflowTooltip?: boolean | Record<string, unknown>;
  renderHeader?: (index: number) => VNodeChild;
  render?: (value: unknown, record: TableRecord, index: number) => VNodeChild;
  renderExpanded?: (record: TableRecord, index: number) => VNodeChild;
  [key: string]: unknown;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    data?: unknown[];
    loading?: boolean;
    rowKey?: string | ((row: TableRecord) => TableKey);
    stripe?: boolean;
    showHeader?: boolean;
    maxHeight?: string | number;
    defaultSort?: { prop: string; order: TableSortOrder };
    currentRowKey?: TableKey;
    highlightCurrentRow?: boolean;
    defaultExpandAll?: boolean;
    treeProps?: Record<string, unknown>;
    lazy?: boolean;
    load?: TableLoadHandler;
    emptyText?: string;
  }>(),
  {
    data: () => [],
    loading: false,
    rowKey: 'id',
    stripe: false,
    showHeader: true,
    maxHeight: undefined,
    defaultSort: undefined,
    currentRowKey: undefined,
    highlightCurrentRow: false,
    defaultExpandAll: false,
    treeProps: undefined,
    lazy: false,
    load: undefined,
    emptyText: '暂无数据'
  }
);

const attrs = useAttrs();
const slots = useSlots();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const useAnimalTable = computed(() => isAnimalMode.value);
type TableMethods = {
  sort?: (prop: string, order: TableSortOrder) => void;
  toggleRowSelection?: (row: TableRecord, selected?: boolean) => void;
  setCurrentRow?: (row?: unknown | null) => void;
  toggleRowExpansion?: (row: TableRecord, expanded?: boolean) => void;
  updateKeyChildren?: (key: TableKey, children: TableRecord[]) => void;
};
const animalTableRef = ref<TableMethods>();
const officeTableRef = ref<TableMethods>();
const data = computed(() => (props.data || []) as TableRecord[]);
const rowKey = computed(() => props.rowKey);
const elementRowKey = computed(() => {
  const value = props.rowKey;
  return typeof value === 'function' ? (row: TableRecord) => String(value(row)) : value;
});
// 动森模式默认把长表格限制在当前视口内，避免历史页面仍依赖外层
// overflow:hidden 导致后续行不可见；业务显式传入的高度始终优先。
const animalTableMaxHeight = computed(() => {
  if (!isAnimalMode.value) return props.maxHeight;
  return props.maxHeight ?? 'calc(100vh - 340px)';
});
const tableScroll = computed(() => (animalTableMaxHeight.value ? { y: animalTableMaxHeight.value } : undefined));

function flattenVNodes(nodes: unknown[]): VNode[] {
  const result: VNode[] = [];
  nodes.forEach(node => {
    if (Array.isArray(node)) {
      result.push(...flattenVNodes(node));
      return;
    }
    if (!isVNode(node)) return;
    if (node.type === Fragment) {
      result.push(...flattenVNodes(Array.isArray(node.children) ? node.children : []));
      return;
    }
    if (node.type !== Comment) result.push(node);
  });
  return result;
}

function isTableColumnVNode(vnode: VNode) {
  if (vnode.type === ElTableColumn) return true;
  const type = vnode.type as { name?: string; __name?: string };
  return type?.name === 'ElTableColumn' || type?.['__name'] === 'ElTableColumn';
}

function readProp<T = unknown>(columnProps: LegacyColumnProps | null | undefined, name: string): T | undefined {
  if (!columnProps) return undefined;
  const kebabName = name.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`);
  return (columnProps[name] ?? columnProps[kebabName]) as T | undefined;
}

function columnSlots(vnode: VNode) {
  if (!vnode.children || Array.isArray(vnode.children) || typeof vnode.children !== 'object')
    return {} as { default?: ColumnSlot; header?: ColumnSlot };
  return vnode.children as { default?: ColumnSlot; header?: ColumnSlot };
}

function createColumn(vnode: VNode, index: number): AnimalColumn {
  const sourceProps = (vnode.props || {}) as LegacyColumnProps;
  const prop = readProp<string>(sourceProps, 'prop');
  const label = readProp<string>(sourceProps, 'label') || prop || '';
  const rawFixed = readProp<boolean | 'left' | 'right'>(sourceProps, 'fixed');
  const fixed = rawFixed === true ? 'left' : rawFixed === 'left' || rawFixed === 'right' ? rawFixed : undefined;
  const type = readProp<string>(sourceProps, 'type');
  const sourceSlots = columnSlots(vnode);
  const columnMeta: LegacyColumnProps = { ...sourceProps, prop, label, $index: index };
  const column: AnimalColumn = {
    key: String(vnode.key ?? prop ?? `column-${index}`),
    title: String(label),
    dataIndex: prop,
    // 兼容 Element Plus header-click 回调，保留业务侧使用的 property 字段。
    property: prop,
    type,
    width: readProp<string | number>(sourceProps, 'width'),
    minWidth: readProp<string | number>(sourceProps, 'minWidth'),
    align: readProp<'left' | 'center' | 'right'>(sourceProps, 'align'),
    fixed,
    sortable: readProp<boolean | 'custom'>(sourceProps, 'sortable'),
    filters: readProp<AnimalColumn['filters']>(sourceProps, 'filters'),
    filterMultiple: readProp<boolean>(sourceProps, 'filterMultiple'),
    filteredValue: readProp<unknown[]>(sourceProps, 'filteredValue'),
    filterMethod: readProp<AnimalColumn['filterMethod']>(sourceProps, 'filterMethod'),
    index: readProp<number | ((index: number) => number)>(sourceProps, 'index'),
    selectable: readProp<AnimalColumn['selectable']>(sourceProps, 'selectable'),
    className: readProp<string>(sourceProps, 'className'),
    showOverflowTooltip: readProp<boolean | Record<string, unknown>>(sourceProps, 'showOverflowTooltip')
  };

  if (sourceSlots.default) {
    if (type === 'expand') {
      // Element Plus 将 expand 列的默认插槽作为展开面板内容，而不是普通单元格内容。
      column.renderExpanded = (record, rowIndex) =>
        sourceSlots.default?.({ row: record, $index: rowIndex, column: columnMeta });
    } else {
      column.render = (value, record, rowIndex) =>
        sourceSlots.default?.({ row: record, $index: rowIndex, column: columnMeta }) ?? String(value ?? '');
    }
  }
  if (sourceSlots.header) {
    column.renderHeader = headerIndex =>
      sourceSlots.header?.({ row: {} as TableRecord, $index: headerIndex, column: columnMeta });
  }
  return column;
}

const animalColumns = computed<AnimalColumn[]>(() => {
  const nodes = flattenVNodes(slots.default?.() || []);
  const columnNodes = nodes.filter(isTableColumnVNode);
  return (columnNodes.length ? columnNodes : nodes).map(createColumn);
});

const animalAttrs = computed(() => {
  const next = { ...attrs };
  [
    'data',
    'loading',
    'row-key',
    'rowKey',
    'stripe',
    'show-header',
    'showHeader',
    'max-height',
    'maxHeight',
    'default-sort',
    'defaultSort',
    'current-row-key',
    'currentRowKey',
    'highlight-current-row',
    'highlightCurrentRow',
    'default-expand-all',
    'defaultExpandAll',
    'tree-props',
    'treeProps',
    'lazy',
    'load'
  ].forEach(key => Reflect.deleteProperty(next, key));
  return next;
});

const officeAttrs = computed(() => {
  const next = { ...attrs };
  [
    'data',
    'loading',
    'row-key',
    'rowKey',
    'stripe',
    'show-header',
    'showHeader',
    'max-height',
    'maxHeight',
    'default-sort',
    'defaultSort',
    'current-row-key',
    'currentRowKey',
    'highlight-current-row',
    'highlightCurrentRow',
    'default-expand-all',
    'defaultExpandAll',
    'tree-props',
    'treeProps',
    'lazy',
    'load'
  ].forEach(key => Reflect.deleteProperty(next, key));
  return next;
});

defineExpose({
  sort: (prop: string, order: TableSortOrder) => {
    if (useAnimalTable.value) animalTableRef.value?.sort?.(prop, order);
    else officeTableRef.value?.sort?.(prop, order);
  },
  toggleRowSelection: (row: TableRecord, selected?: boolean) => {
    if (useAnimalTable.value) animalTableRef.value?.toggleRowSelection?.(row, selected);
    else officeTableRef.value?.toggleRowSelection?.(row, selected);
  },
  setCurrentRow: (row?: unknown | null) => {
    if (useAnimalTable.value) animalTableRef.value?.setCurrentRow?.(row);
    else officeTableRef.value?.setCurrentRow?.(row);
  },
  toggleRowExpansion: (row: TableRecord, expanded?: boolean) => {
    if (useAnimalTable.value) animalTableRef.value?.toggleRowExpansion?.(row, expanded);
    else officeTableRef.value?.toggleRowExpansion?.(row, expanded);
  },
  updateKeyChildren: (key: TableKey, children: TableRecord[]) => {
    if (useAnimalTable.value) animalTableRef.value?.updateKeyChildren?.(key, children);
    else officeTableRef.value?.updateKeyChildren?.(key, children);
  }
});
</script>

<style scoped lang="scss">
.department-data-table {
  --el-table-bg-color: var(--app-surface-bg);
  --el-table-tr-bg-color: var(--app-surface-bg);
  --el-table-header-bg-color: var(--tableHeaderBg, #f8fafc);
  --el-table-border-color: var(--app-surface-border);
  --el-table-text-color: var(--app-text-title);

  width: 100%;
  overflow: hidden;
  border: 1px solid var(--app-surface-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface-bg);

  :deep(.el-table__inner-wrapper::before),
  :deep(.el-table__border-left-patch) {
    display: none;
  }

  :deep(.el-table__header-wrapper th.el-table__cell),
  :deep(.el-table__fixed-header-wrapper th.el-table__cell) {
    height: 46px;
    padding: 0 12px;
    color: var(--tableHeaderTextColor, #475569);
    background: var(--tableHeaderBg, #f8fafc) !important;
    font-size: 13px;
    font-weight: 600;
  }

  :deep(.el-table__body-wrapper td.el-table__cell),
  :deep(.el-table__fixed-body-wrapper td.el-table__cell) {
    min-height: 48px;
    padding: 11px 12px;
    color: var(--app-text-title);
    background: var(--app-surface-bg);
  }

  // 横向滚动时，固定列必须有独立的不透明层，避免底层单元格文字穿透。
  :deep(.el-table__fixed),
  :deep(.el-table__fixed-right) {
    z-index: 3;
    background: var(--el-table-bg-color, var(--app-surface-bg));
    box-shadow: -8px 0 16px rgba(15, 23, 42, 0.08);
  }

  :deep(.el-table__fixed-right::before),
  :deep(.el-table__fixed::before) {
    background-color: var(--app-surface-border);
  }

  :deep(.el-table__fixed-right th.el-table__cell),
  :deep(.el-table__fixed-right td.el-table__cell),
  :deep(.el-table__fixed-right-patch) {
    background: var(--el-table-bg-color, var(--app-surface-bg)) !important;
  }

  :deep(.el-table__fixed-right tr:hover > td.el-table__cell),
  :deep(.el-table__fixed-right tr.hover-row > td.el-table__cell) {
    background: var(--el-table-row-hover-bg-color) !important;
  }

  :deep(.department-table-actions) {
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  :deep(.el-table__body tr) {
    transition: background-color 0.18s ease;
  }

  :deep(.el-table__body tr:hover > td.el-table__cell),
  :deep(.el-table__body tr.hover-row > td.el-table__cell) {
    background: var(--el-table-row-hover-bg-color) !important;
  }

  :deep(.el-table__empty-block) {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    text-align: center;
  }

  :deep(.el-table__empty-text) {
    width: auto;
    color: var(--app-text-muted);
    font-size: var(--app-text-sm, 13px);
    text-align: center;
  }

  .department-data-table__empty {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    color: var(--animal-text-color-secondary, var(--app-text-muted));
    text-align: center;
  }

  :deep(.el-table__body tr.el-table__row--striped td.el-table__cell) {
    background: color-mix(in srgb, var(--app-surface-bg) 94%, var(--app-accent-soft));
  }
}
</style>
