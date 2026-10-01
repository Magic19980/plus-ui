<template>
  <div
    v-if="useAnimalTable"
    :class="['ui-animal-table-shell', attrs.class, { 'is-loading': loading }]"
    :style="animalStyle"
    v-bind="animalAttrs"
  >
    <div class="ui-animal-table-scroll" :class="{ 'is-vertical-scroll': Boolean(props.scroll?.y) }" :style="tableScrollStyle">
      <table class="ui-animal-table" :style="{ minWidth: tableMinWidth, gridTemplateColumns: tableGridTemplate }">
        <colgroup>
          <col v-for="(column, index) in columns" :key="columnKey(column, index)" :style="columnWidthStyle(column, index)" />
        </colgroup>

        <thead v-if="showHeader" class="ui-animal-table__head">
          <tr class="ui-animal-table__head-row">
            <th
              v-for="(column, index) in columns"
              :key="columnKey(column, index)"
              class="ui-animal-table__th"
              :class="columnClass(column, index)"
              :style="cellStyle(column, index)"
              :aria-sort="column.sortable ? ariaSort(column) : undefined"
              @click="handleHeaderClick(column, index, $event)"
            >
              <div class="ui-animal-table__header-content">
                <input
                  v-if="column.type === 'selection'"
                  class="ui-animal-table__checkbox"
                  type="checkbox"
                  :checked="allRowsSelected"
                  :disabled="!selectableRows.length"
                  :aria-checked="allRowsSelected ? 'true' : selectableRows.length > 0 && selectedRowsOnPage.length > 0 ? 'mixed' : 'false'"
                  aria-label="选择当前页"
                  @click.stop
                  @change="toggleAllRows"
                >
                <span v-else-if="column.type === 'index'" class="ui-animal-table__index-label">序号</span>
                <button
                  v-else-if="column.sortable"
                  type="button"
                  class="ui-animal-table__sort-trigger"
                  @click.stop="handleSortTrigger(column, index, $event)"
                >
                  <TableRender :content="headerContent(column, index)" />
                  <span class="ui-animal-table__sort-icon" :class="sortIconClass(column)" aria-hidden="true">↕</span>
                </button>
                <TableRender v-else :content="headerContent(column, index)" />

                <button
                  v-if="column.filters?.length"
                  type="button"
                  class="ui-animal-table__filter-trigger"
                  :class="{ 'is-active': activeFilterValues(column).length }"
                  :aria-expanded="openFilterKey === columnKey(column, index)"
                  aria-label="筛选列"
                  @click.stop="toggleFilter(column, index, $event)"
                >
                  ▾
                </button>

              </div>
            </th>
          </tr>
        </thead>

        <tbody class="ui-animal-table__body">
          <template v-for="(row, rowIndex) in pageRows" :key="rowKeyValue(row, rowIndex)">
            <tr
              class="ui-animal-table__row"
              :class="[
                rowClass(row, rowIndex),
                {
                  'is-tree-parent': isTreeTable && hasTreeChildren(row),
                  'is-tree-expanded': isTreeTable && isRowExpanded(row, rowIndex),
                  'is-tree-leaf': isTreeTable && !hasTreeChildren(row)
                }
              ]"
              :data-row-key="rowKeyValue(row, rowIndex)"
              :data-tree-depth="isTreeTable ? treeDepth(row) : undefined"
              :aria-level="isTreeTable ? treeDepth(row) + 1 : undefined"
              @click="handleRowClick(row, rowIndex, $event)"
              @dblclick="handleRowDblclick(row, rowIndex, $event)"
            >
              <td
                v-for="(column, columnIndex) in columns"
                :key="columnKey(column, columnIndex)"
                class="ui-animal-table__cell"
                :class="[
                  columnClass(column, columnIndex),
                  { 'is-tree-label': isTreeTable && columnIndex === treeLabelColumnIndex }
                ]"
                :style="cellStyle(column, columnIndex)"
              >
                <input
                  v-if="column.type === 'selection'"
                  class="ui-animal-table__checkbox"
                  type="checkbox"
                  :checked="isRowSelected(row, rowIndex)"
                  :disabled="isRowSelectionDisabled(row, rowIndex)"
                  :aria-label="`选择第 ${rowIndex + 1} 行`"
                  @click.stop
                  @change="toggleRow(row, rowIndex)"
                >
                <button
                  v-else-if="column.type === 'expand'"
                  type="button"
                  class="ui-animal-table__expand-trigger"
                  :class="{ 'is-expanded': isRowExpanded(row, rowIndex) }"
                  :aria-expanded="isRowExpanded(row, rowIndex)"
                  aria-label="展开或收起"
                  @click.stop="toggleExpand(row, rowIndex)"
                >
                  <span aria-hidden="true">›</span>
                </button>
                <span v-else-if="column.type === 'index' && !column.render" class="ui-animal-table__index">{{ rowIndexValue(column, rowIndex) }}</span>
                <span
                  class="ui-animal-table__cell-inner"
                  :class="{ 'is-tree-label-content': isTreeTable && columnIndex === treeLabelColumnIndex }"
                >
                  <span
                    v-if="isTreeTable && columnIndex === treeLabelColumnIndex"
                    class="ui-animal-tree-prefix"
                    :data-tree-depth="treeDepth(row)"
                  >
                    <span
                      v-for="level in treeDepth(row)"
                      :key="level"
                      class="ui-animal-tree-prefix__level"
                      :class="{ 'is-last': level === treeDepth(row) }"
                      aria-hidden="true"
                    />
                    <button
                      v-if="hasTreeChildren(row)"
                      type="button"
                      class="ui-animal-tree-prefix__toggle"
                      :class="{ 'is-expanded': isRowExpanded(row, rowIndex), 'is-loading': isTreeLoading(row) }"
                      :aria-expanded="isRowExpanded(row, rowIndex)"
                      :aria-busy="isTreeLoading(row)"
                      :disabled="isTreeLoading(row)"
                      aria-label="展开或收起"
                      @click.stop="toggleTreeRow(row, rowIndex)"
                    >
                      <span aria-hidden="true">{{ isTreeLoading(row) ? '·' : '›' }}</span>
                    </button>
                    <span v-else class="ui-animal-tree-prefix__placeholder" aria-hidden="true" />
                  </span>
                  <UiTooltip
                    v-if="hasCellTooltip(column, row)"
                    :content="cellTooltipText(column, row)"
                    placement="bottom"
                    :show-after="120"
                    popper-class="ui-table-overflow-tooltip"
                  >
                    <span class="ui-animal-table__cell-content ui-animal-table__cell-content--overflow">
                      <slot
                        v-if="column.dataIndex && $slots[`cell-${column.dataIndex}`]"
                        :name="`cell-${column.dataIndex}`"
                        :value="row[column.dataIndex]"
                        :record="row"
                        :index="rowIndex"
                      />
                      <TableRender v-else-if="column.render" :content="renderCell(column, row, rowIndex)" />
                      <span v-else>{{ cellValue(column, row) }}</span>
                    </span>
                  </UiTooltip>
                  <span v-else class="ui-animal-table__cell-content">
                    <slot
                      v-if="column.dataIndex && $slots[`cell-${column.dataIndex}`]"
                      :name="`cell-${column.dataIndex}`"
                      :value="row[column.dataIndex]"
                      :record="row"
                      :index="rowIndex"
                    />
                    <TableRender v-else-if="column.render" :content="renderCell(column, row, rowIndex)" />
                    <span v-else>{{ cellValue(column, row) }}</span>
                  </span>
                </span>
              </td>
            </tr>
            <tr v-if="isRowExpanded(row, rowIndex) && !isTreeTable" class="ui-animal-table__expanded-row">
              <td :colspan="columns.length || 1">
                <slot name="expanded-row" :record="row" :row="row" :index="rowIndex">
                  <TableRender v-if="expandColumn(columnForExpand)" :content="renderExpandedCell(row, rowIndex)" />
                </slot>
              </td>
            </tr>
          </template>

          <tr v-if="!pageRows.length" class="ui-animal-table__empty-row">
            <td :colspan="columns.length || 1" class="ui-animal-table__empty-cell">
              <slot name="empty">
                <div class="ui-animal-table__empty">
                  <span class="ui-animal-table__empty-icon" aria-hidden="true">▧</span>
                  <span>{{ emptyText }}</span>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="loading" class="ui-animal-table__loader" role="status" aria-live="polite">
      <span class="ui-animal-table__spinner" aria-hidden="true">◌</span>
      <span>加载中…</span>
    </div>

    <div v-if="paginationConfig" class="ui-animal-table__pagination">
      <UiPagination
        :page="currentPage"
        :limit="currentPageSize"
        :total="paginationTotal"
        :show-size-changer="paginationShowSizeChanger"
        :page-size-options="paginationPageSizeOptions"
        :show-quick-jumper="paginationShowQuickJumper"
        :show-total="paginationShowTotal"
        @pagination="handlePagination"
      />
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="useAnimalTable && openFilterColumn"
      ref="filterMenuEl"
      class="ui-animal-table__filter-menu"
      :style="filterMenuStyle"
      @click.stop
    >
      <label v-for="filter in openFilterColumn.filters" :key="filterValueKey(filter.value)" class="ui-animal-table__filter-option">
        <input
          type="checkbox"
          :checked="isFilterChecked(openFilterColumn, filter.value)"
          @change="toggleFilterValue(openFilterColumn, filter.value)"
        >
        <span>{{ filter.text ?? filter.label ?? String(filter.value) }}</span>
      </label>
      <div class="ui-animal-table__filter-actions">
        <button type="button" class="ui-animal-table__filter-clear" @click="clearFilter(openFilterColumn)">清空</button>
        <button type="button" class="ui-animal-table__filter-apply" @click="applyFilter(openFilterColumn, openFilterColumnIndex)">确定</button>
      </div>
    </div>
  </Teleport>

  <ElTable
    v-if="!useAnimalTable"
    v-bind="elementAttrs"
    :data="data"
    :row-key="elementRowKey"
    :stripe="striped"
    :show-header="showHeader"
    :default-expand-all="defaultExpandAll"
    :tree-props="treeProps"
    :lazy="lazy"
    :load="load"
    :row-class-name="elementRowClassName"
    v-loading="loading"
  >
    <ElTableColumn v-for="column in columns" :key="String(column.dataIndex || column.key || column.type || column.title)" v-bind="elementColumnProps(column)">
      <template #default="scope">
        <slot v-if="column.dataIndex" :name="`cell-${column.dataIndex}`" v-bind="{ value: scope.row[column.dataIndex], record: scope.row, index: scope.$index }">
          {{ scope.row[column.dataIndex] }}
        </slot>
      </template>
    </ElTableColumn>
    <template #empty><slot name="empty">{{ emptyText }}</slot></template>
  </ElTable>
</template>

<script setup lang="ts">
/**
 * 结构化数据表格适配器。
 *
 * Animal Island 自带 Table 只覆盖展示和简单分页，因此复杂表格由这里提供
 * 统一的选择、展开、排序、筛选、固定列和滚动能力。办公模式继续交给 Element
 * Plus，业务页面不需要感知底层实现差异。
 */
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch, type CSSProperties, type PropType, type VNodeChild } from 'vue';
import { ElTable, ElTableColumn } from 'element-plus';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';
import UiPagination from './UiPagination.vue';
import UiTooltip from './UiTooltip.vue';

defineOptions({ inheritAttrs: false });

type TableKey = string | number;
type TableRecord = Record<string, unknown>;
type SortOrder = 'ascending' | 'descending' | null;

interface UiTableFilter {
  text?: string;
  label?: string;
  value: unknown;
}

interface UiTableColumn {
  key?: string;
  title: string | (() => VNodeChild);
  dataIndex?: string;
  type?: 'selection' | 'index' | 'expand' | string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
  sortable?: boolean | 'custom';
  renderHeader?: (index: number) => VNodeChild;
  sortMethod?: (a: unknown, b: unknown) => number;
  sortBy?: string | ((record: TableRecord) => unknown);
  filters?: UiTableFilter[];
  filterMultiple?: boolean;
  filteredValue?: unknown[];
  filterMethod?: (value: unknown, record: TableRecord, column: UiTableColumn) => boolean;
  index?: number | ((index: number) => number);
  selectable?: boolean | ((record: TableRecord, index: number) => boolean);
  style?: Record<string, string | number>;
  render?: (value: unknown, record: TableRecord, index: number) => VNodeChild;
  [key: string]: unknown;
}

interface UiTablePagination {
  current?: number;
  defaultCurrent?: number;
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  total?: number;
  remote?: boolean;
  [key: string]: unknown;
}

type TreeLoadResolve = (children: TableRecord[]) => void;
type TreeLoadHandler = (row: TableRecord, treeNode: Record<string, unknown>, resolve: TreeLoadResolve) => void | Promise<unknown>;

const TableRender = defineComponent({
  name: 'UiTableRender',
  props: {
    content: { type: null as unknown as PropType<VNodeChild>, default: null }
  },
  setup(props) {
    return () => props.content;
  }
});

const props = withDefaults(
  defineProps<{
    columns?: UiTableColumn[];
    data?: unknown[];
    rowKey?: string | ((row: TableRecord) => TableKey);
    striped?: boolean;
    showHeader?: boolean;
    rowClassName?: string | ((row: TableRecord, index: number) => string);
    loading?: boolean;
    emptyText?: string;
    defaultSort?: { prop?: string; order?: SortOrder };
    scroll?: { x?: number | string; y?: number | string };
    pagination?: false | UiTablePagination;
    treeProps?: { children?: string; hasChildren?: string; [key: string]: unknown };
    lazy?: boolean;
    load?: TreeLoadHandler;
    selectedRowKeys?: TableKey[];
    defaultSelectedRowKeys?: TableKey[];
    expandedRowKeys?: TableKey[];
    defaultExpandedRowKeys?: TableKey[];
    defaultExpandAll?: boolean;
    currentRowKey?: TableKey;
    highlightCurrentRow?: boolean;
  }>(),
  {
    columns: () => [],
    data: () => [],
    rowKey: 'id',
    striped: true,
    showHeader: true,
    rowClassName: undefined,
    loading: false,
    emptyText: '暂无数据',
    defaultSort: undefined,
    scroll: undefined,
    pagination: false,
    treeProps: undefined,
    lazy: false,
    load: undefined,
    selectedRowKeys: undefined,
    defaultSelectedRowKeys: () => [],
    expandedRowKeys: undefined,
    defaultExpandedRowKeys: () => [],
    defaultExpandAll: false,
    currentRowKey: undefined,
    highlightCurrentRow: false
  }
);

const attrs = useAttrs();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const useAnimalTable = computed(() => isAnimalMode.value);
const columns = computed(() => props.columns || []);
const data = computed(() => (props.data || []) as TableRecord[]);
const paginationConfig = computed(() => {
  const value = props.pagination as false | UiTablePagination | undefined;
  return value || undefined;
});

const selectedKeys = ref<string[]>(normalizeKeys(props.selectedRowKeys ?? props.defaultSelectedRowKeys));
const expandedKeys = ref<string[]>(normalizeKeys(props.expandedRowKeys ?? props.defaultExpandedRowKeys));
const currentPage = ref(Math.max(1, paginationConfig.value?.current ?? paginationConfig.value?.defaultCurrent ?? 1));
const currentPageSize = ref(Math.max(1, paginationConfig.value?.pageSize ?? paginationConfig.value?.defaultPageSize ?? 10));
const openFilterKey = ref<string | null>(null);
const filterDraft = ref<unknown[]>([]);
const filterState = ref<Record<string, unknown[]>>({});
const sortState = ref<{ prop: string; order: SortOrder }>({
  prop: props.defaultSort?.prop || '',
  order: props.defaultSort?.order || null
});
const filterAnchor = ref<HTMLElement | null>(null);
const filterMenuEl = ref<HTMLElement | null>(null);
const filterMenuStyle = ref<CSSProperties>({});

const openFilterColumnIndex = computed(() => columns.value.findIndex((column, index) => columnKey(column, index) === openFilterKey.value));
const openFilterColumn = computed(() => {
  const index = openFilterColumnIndex.value;
  return index >= 0 ? columns.value[index] : undefined;
});

function normalizeKeys(keys?: TableKey[]) {
  return (keys || []).map(key => String(key));
}

function invokeListener(name: string, ...args: unknown[]) {
  const listener = attrs[name];
  if (typeof listener === 'function') {
    listener(...args);
    return;
  }
  // Vue 允许同一事件绑定多个监听器，组件 attrs 会以数组形式透传。
  // 适配器必须保持这个行为，否则页面同时绑定业务回调和埋点回调时，
  // 动森模式只会执行其中一个或直接静默丢失。
  if (Array.isArray(listener)) listener.forEach(handler => {
    if (typeof handler === 'function') handler(...args);
  });
}

function columnKey(column: UiTableColumn, index: number) {
  return String(column.key ?? column.dataIndex ?? (column.type ? `${column.type}-${index}` : `column-${index}`));
}

function rowKeyValue(row: TableRecord, index: number) {
  if (typeof props.rowKey === 'function') return String(props.rowKey(row));
  const key = row[props.rowKey];
  return key === undefined || key === null ? String(index) : String(key);
}

const isTreeTable = computed(() => Boolean(props.treeProps));
const treeChildrenKey = computed(() => props.treeProps?.children || 'children');
const lazyChildren = ref<Record<string, TableRecord[]>>({});
const lazyLoadedKeys = ref<Set<string>>(new Set());
const lazyLoadingKeys = ref<Set<string>>(new Set());

function rowTreeKey(row: TableRecord) {
  const rowIndex = data.value.indexOf(row);
  return rowKeyValue(row, rowIndex >= 0 ? rowIndex : 0);
}

const treeDepths = computed(() => {
  const depths = new Map<TableRecord, number>();
  const visit = (rows: TableRecord[], depth: number) => {
    rows.forEach(row => {
      depths.set(row, depth);
      const children = treeChildren(row);
      if (children.length) visit(children, depth + 1);
    });
  };
  if (isTreeTable.value) visit(data.value, 0);
  return depths;
});
const treeLabelColumnIndex = computed(() => {
  const index = columns.value.findIndex(column => column.type !== 'selection' && column.type !== 'index');
  return index >= 0 ? index : 0;
});

function treeChildren(row: TableRecord) {
  const key = rowTreeKey(row);
  if (props.lazy && lazyLoadedKeys.value.has(key)) return lazyChildren.value[key] || [];
  const children = row[treeChildrenKey.value];
  return Array.isArray(children) ? children.filter((child): child is TableRecord => Boolean(child && typeof child === 'object')) : [];
}

function hasTreeChildren(row: TableRecord) {
  if (treeChildren(row).length) return true;
  if (props.lazy && lazyLoadedKeys.value.has(rowTreeKey(row))) return false;
  const hasChildrenKey = props.treeProps?.hasChildren;
  return Boolean(hasChildrenKey && row[hasChildrenKey]);
}

function isTreeLoading(row: TableRecord) {
  return props.lazy && lazyLoadingKeys.value.has(rowTreeKey(row));
}

function treeDepth(row: TableRecord) {
  return treeDepths.value.get(row) || 0;
}

function normalizeCompareValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return String(value).toLowerCase();
}

function columnValue(column: UiTableColumn, row: TableRecord) {
  if (typeof column.sortBy === 'function') return column.sortBy(row);
  if (typeof column.sortBy === 'string') return row[column.sortBy];
  return column.dataIndex ? row[column.dataIndex] : undefined;
}

const isRemote = computed(() => Boolean(paginationConfig.value?.remote));

const treeRows = computed(() => {
  if (!isTreeTable.value) return [] as TableRecord[];
  const rows: TableRecord[] = [];
  const visit = (items: TableRecord[]) => {
    items.forEach(row => {
      rows.push(row);
      if (isRowExpanded(row, rows.length - 1)) visit(treeChildren(row));
    });
  };
  visit(data.value);
  return rows;
});

function activeFilterValues(column: UiTableColumn) {
  const key = columnKey(column, columns.value.indexOf(column));
  if (column.filteredValue) return column.filteredValue;
  return filterState.value[key] || [];
}

const processedRows = computed(() => {
  if (isTreeTable.value) return treeRows.value;
  let rows = [...data.value];
  if (!isRemote.value) {
    rows = rows.filter(row => columns.value.every(column => {
      if (!column.filters?.length) return true;
      const values = activeFilterValues(column);
      if (!values.length) return true;
      const value = column.dataIndex ? row[column.dataIndex] : undefined;
      return values.some(filterValue => column.filterMethod ? column.filterMethod(filterValue, row, column) : String(value) === String(filterValue));
    }));
  }

  if (!isRemote.value && sortState.value.prop && sortState.value.order) {
    const column = columns.value.find((item, index) => columnKey(item, index) === sortState.value.prop);
    if (column && column.sortable !== 'custom') {
      const direction = sortState.value.order === 'ascending' ? 1 : -1;
      rows.sort((a, b) => {
        const result = column.sortMethod
          ? column.sortMethod(columnValue(column, a), columnValue(column, b))
          : compareValues(columnValue(column, a), columnValue(column, b));
        return result * direction;
      });
    }
  }
  return rows;
});

function compareValues(left: unknown, right: unknown) {
  const a = normalizeCompareValue(left);
  const b = normalizeCompareValue(right);
  if (a === b) return 0;
  if (typeof a === 'number' && typeof b === 'number') return a > b ? 1 : -1;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

const paginationTotal = computed(() => {
  if (isRemote.value && paginationConfig.value) return paginationConfig.value.total ?? data.value.length;
  return processedRows.value.length;
});
const maxPage = computed(() => Math.max(1, Math.ceil(paginationTotal.value / Math.max(1, currentPageSize.value))));
const normalizedPage = computed(() => Math.min(currentPage.value, maxPage.value));
const pageRows = computed(() => {
  // 未配置分页时必须展示完整数据；currentPageSize 仅作为内部默认值，
  // 不能把无分页表格误截断为前 10 条，尤其是树表展开子节点后会丢失兄弟节点。
  if (!paginationConfig.value) return processedRows.value;
  if (isRemote.value) return processedRows.value;
  const start = (normalizedPage.value - 1) * currentPageSize.value;
  return processedRows.value.slice(start, start + currentPageSize.value);
});

const selectableRows = computed(() => pageRows.value.map((row, index) => ({ row, index })).filter(({ row, index }) => !isRowSelectionDisabled(row, index)));
const selectedRowsOnPage = computed(() => selectableRows.value.filter(({ row, index }) => isRowSelected(row, index)));
const allRowsSelected = computed(() => selectableRows.value.length > 0 && selectedRowsOnPage.value.length === selectableRows.value.length);

const tableWidth = computed(() => {
  const width = columns.value.reduce((total, column, index) => total + columnWidth(column, index), 0);
  const scrollWidth = props.scroll?.x;
  const scrollPixels = typeof scrollWidth === 'number' ? scrollWidth : parseInt(String(scrollWidth || ''), 10);
  return Math.max(width, Number.isFinite(scrollPixels) ? scrollPixels : 0);
});
const tableMinWidth = computed(() => `${tableWidth.value}px`);
const flexibleColumnIndices = computed(() => {
  const candidates = columns.value
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => !isOperationColumn(column) && !['selection', 'index', 'expand'].includes(String(column.type || '')));
  const unbounded = candidates.filter(({ column }) => column.width === undefined && column.minWidth === undefined);
  if (unbounded.length) return new Set(unbounded.map(({ index }) => index));
  const widest = candidates.reduce<{ index: number; width: number } | undefined>((current, item) => {
    const width = columnWidth(item.column, item.index);
    return !current || width > current.width ? { index: item.index, width } : current;
  }, undefined);
  return new Set(widest ? [widest.index] : []);
});
const tableGridTemplate = computed(() => columns.value.map((column, index) => {
  const width = columnWidth(column, index);
  return flexibleColumnIndices.value.has(index) ? `minmax(${width}px, 1fr)` : `${width}px`;
}).join(' '));
const tableScrollStyle = computed<CSSProperties>(() => ({
  maxHeight: typeof props.scroll?.y === 'number' ? `${props.scroll.y}px` : props.scroll?.y,
  overflowX: props.scroll?.x ? 'auto' : undefined,
  // 仅在内容确实超出表体高度时显示内部滚动条；滚到表体边界后由浏览器
  // 把滚轮继续交给外层 app-main，避免页面出现两个“抢滚轮”的容器。
  overflowY: props.scroll?.y ? 'auto' : undefined
}));

const leftOffsets = computed(() => {
  const offsets = new Map<string, number>();
  let offset = 0;
  columns.value.forEach((column, index) => {
    if (column.fixed === 'left') {
      offsets.set(columnKey(column, index), offset);
      offset += columnWidth(column, index);
    }
  });
  return offsets;
});
const rightOffsets = computed(() => {
  const offsets = new Map<string, number>();
  let offset = 0;
  for (let index = columns.value.length - 1; index >= 0; index -= 1) {
    const column = columns.value[index];
    if (column.fixed === 'right') {
      offsets.set(columnKey(column, index), offset);
      offset += columnWidth(column, index);
    }
  }
  return offsets;
});

function columnWidth(column: UiTableColumn, index: number) {
  const value = column.width ?? column.minWidth;
  const titleMinimum = columnTitleMinimumWidth(column);
  if (typeof value === 'number') return isOperationColumn(column) ? Math.max(value, 216) : Math.max(value, titleMinimum);
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (Number.isFinite(parsed)) return isOperationColumn(column) ? Math.max(parsed, 216) : Math.max(parsed, titleMinimum);
  }
  if (column.type === 'selection' || column.type === 'expand') return 56;
  if (column.type === 'index') return 68;
  if (isOperationColumn(column)) return 216;
  return Math.max(150 + (index === 0 ? 10 : 0), titleMinimum);
}

/**
 * 历史页面经常把 3～4 个汉字的表头配置成 60px；在 CSS Grid 中这不会挤压
 * 数据列，而是会让表头文字溢出到下一列，看起来像“表头与数据错位”。
 * 以近似字宽计算一个只针对表头的安全下限，仍保留业务显式设置更宽列的能力。
 */
function columnTitleMinimumWidth(column: UiTableColumn) {
  const title = typeof column.title === 'string' ? column.title.trim() : '';
  if (!title || ['selection', 'index', 'expand'].includes(String(column.type || ''))) return 0;
  const contentWidth = [...title].reduce((total, character) => {
    return total + (/[\u2e80-\u9fff]/.test(character) ? 14 : 8);
  }, 0);
  const filterAllowance = column.filters?.length ? 18 : 0;
  const sortAllowance = column.sortable ? 16 : 0;
  return Math.ceil(contentWidth + 32 + filterAllowance + sortAllowance);
}

function columnWidthStyle(column: UiTableColumn, index: number) {
  const calculatedWidth = columnWidth(column, index);
  const sourceWidth = column.width ?? column.minWidth;
  const width = typeof sourceWidth === 'number'
    ? `${sourceWidth}px`
    : typeof sourceWidth === 'string' && /^\s*\d+(?:\.\d+)?\s*$/.test(sourceWidth)
      ? `${sourceWidth.trim()}px`
      : sourceWidth || `${calculatedWidth}px`;
  return { width, minWidth: `${calculatedWidth}px` };
}

function cellStyle(column: UiTableColumn, index: number) {
  const key = columnKey(column, index);
  const align = column.align || (isOperationColumn(column) ? 'center' : 'left');
  const style: Record<string, string | number> = { textAlign: align, ...column.style };
  if (column.fixed === 'left') {
    style.position = 'sticky';
    style.left = `${leftOffsets.value.get(key) || 0}px`;
    style.zIndex = 2;
  } else if (column.fixed === 'right') {
    style.position = 'sticky';
    style.right = `${rightOffsets.value.get(key) || 0}px`;
    style.zIndex = 2;
  }
  return style;
}

function isOperationColumn(column: UiTableColumn) {
  const customClass = typeof column.className === 'string' ? column.className : '';
  return /(^|[\s_-])(operation|table-operation|fixed-width)(?:$|[\s_-])/i.test(customClass)
    || (typeof column.title === 'string' && /^(操作|operation)$/i.test(column.title.trim()))
    || /^(operation|actions?)$/i.test(String(column.dataIndex || ''));
}

function columnClass(column: UiTableColumn, index: number) {
  const customClass = typeof column.className === 'string' ? column.className : '';
  const align = column.align || (isOperationColumn(column) ? 'center' : 'left');
  return [customClass, {
    'is-fixed-left': column.fixed === 'left',
    'is-fixed-right': column.fixed === 'right',
    'is-first-fixed-left': column.fixed === 'left' && !columns.value[index - 1]?.fixed,
    'is-last-fixed-right': column.fixed === 'right' && !columns.value[index + 1]?.fixed,
    'is-selection': column.type === 'selection',
    'is-expand': column.type === 'expand',
    'is-operation': isOperationColumn(column),
    'is-align-left': align === 'left',
    'is-align-center': align === 'center',
    'is-align-right': align === 'right'
  }];
}

function rowClass(row: TableRecord, index: number) {
  const custom = typeof props.rowClassName === 'function' ? props.rowClassName(row, index) : props.rowClassName;
  return [
    custom || '',
    { 'is-current': props.highlightCurrentRow && currentRowKey.value === rowKeyValue(row, index) }
  ];
}

const currentRowKey = ref(props.currentRowKey === undefined ? '' : String(props.currentRowKey));
function rowIndexValue(column: UiTableColumn, index: number) {
  if (typeof column.index === 'function') return column.index(index);
  if (typeof column.index === 'number') return column.index + index;
  return index + 1 + (normalizedPage.value - 1) * currentPageSize.value;
}

function columnTitle(column: UiTableColumn) {
  return typeof column.title === 'function' ? column.title() : column.title;
}

function headerContent(column: UiTableColumn, index: number) {
  return column.renderHeader ? column.renderHeader(index) : columnTitle(column);
}

function renderCell(column: UiTableColumn, row: TableRecord, index: number) {
  return column.render?.(column.dataIndex ? row[column.dataIndex] : undefined, row, index);
}

function cellValue(column: UiTableColumn, row: TableRecord) {
  return column.dataIndex ? row[column.dataIndex] : '';
}

function cellTooltipText(column: UiTableColumn, row: TableRecord) {
  if (!column.showOverflowTooltip) return '';
  const value = cellValue(column, row);
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function hasCellTooltip(column: UiTableColumn, row: TableRecord) {
  return Boolean(cellTooltipText(column, row));
}

const columnForExpand = computed(() => columns.value.find(column => column.type === 'expand'));
function expandColumn(column: UiTableColumn | undefined) {
  return Boolean(column);
}
function renderExpandedCell(row: TableRecord, index: number) {
  return columnForExpand.value?.render?.(undefined, row, index);
}

function isRowSelectionDisabled(row: TableRecord, index: number) {
  const column = columns.value.find(item => item.type === 'selection');
  if (!column || column.selectable === undefined) return false;
  return typeof column.selectable === 'function' ? !column.selectable(row, index) : !column.selectable;
}
function isRowSelected(row: TableRecord, index: number) {
  return !isRowSelectionDisabled(row, index) && selectedKeys.value.includes(rowKeyValue(row, index));
}
function emitSelectionChange() {
  const rows = data.value.filter((row, index) => selectedKeys.value.includes(rowKeyValue(row, index)));
  invokeListener('onUpdateSelectedRowKeys', [...selectedKeys.value]);
  invokeListener('onSelectionChange', rows);
}
function toggleRow(row: TableRecord, index: number) {
  const key = rowKeyValue(row, index);
  if (isRowSelectionDisabled(row, index)) return;
  selectedKeys.value = selectedKeys.value.includes(key) ? selectedKeys.value.filter(item => item !== key) : [...selectedKeys.value, key];
  const selectedRows = selectedRowsOnPage.value.map(({ row: selectedRow }) => selectedRow);
  invokeListener('onSelect', selectedRows, row);
  emitSelectionChange();
}

function setRowSelection(row: TableRecord, selected = true) {
  const rowIndex = data.value.indexOf(row);
  const index = rowIndex >= 0 ? rowIndex : 0;
  if (isRowSelectionDisabled(row, index)) return;
  const key = rowKeyValue(row, index);
  const isSelected = selectedKeys.value.includes(key);
  if (selected === isSelected) return;
  selectedKeys.value = selected
    ? [...selectedKeys.value, key]
    : selectedKeys.value.filter(item => item !== key);
  const selectedRows = selectedRowsOnPage.value.map(({ row: selectedRow }) => selectedRow);
  invokeListener('onSelect', selectedRows, row);
  emitSelectionChange();
}

function toggleAllRows() {
  const wasAllSelected = allRowsSelected.value;
  const keys = selectableRows.value.map(({ row, index }) => rowKeyValue(row, index));
  if (wasAllSelected) selectedKeys.value = selectedKeys.value.filter(key => !keys.includes(key));
  else selectedKeys.value = Array.from(new Set([...selectedKeys.value, ...keys]));
  const selectedRows = selectedRowsOnPage.value.map(({ row }) => row);
  invokeListener('onSelectAll', selectedRows);
  emitSelectionChange();
}

function isRowExpanded(row: TableRecord, index: number) {
  return expandedKeys.value.includes(rowKeyValue(row, index));
}

// Element Plus 的 expand-change 第二个参数是当前已展开的行对象集合，
// 不是内部使用的主键集合。树表需要递归收集已知子节点，普通展开行则
// 直接从当前数据集中筛选，保证历史页面收到的参数格式保持一致。
const expandedRows = computed(() => {
  const rows: TableRecord[] = [];
  const visit = (items: TableRecord[]) => {
    items.forEach((item, itemIndex) => {
      if (expandedKeys.value.includes(rowKeyValue(item, itemIndex))) rows.push(item);
      if (isTreeTable.value) visit(treeChildren(item));
    });
  };
  visit(data.value);
  return rows;
});

function toggleExpand(row: TableRecord, index: number) {
  const key = rowKeyValue(row, index);
  const expanded = !expandedKeys.value.includes(key);
  expandedKeys.value = expanded ? [...expandedKeys.value, key] : expandedKeys.value.filter(item => item !== key);
  invokeListener('onUpdateExpandedRowKeys', [...expandedKeys.value]);
  invokeListener('onExpandChange', row, expandedRows.value);
}

function toggleTreeRow(row: TableRecord, index: number) {
  if (!hasTreeChildren(row)) return;
  const key = rowKeyValue(row, index);
  if (props.lazy && !lazyLoadedKeys.value.has(key)) {
    loadTreeChildren(row, index);
    return;
  }
  toggleExpand(row, index);
}

function loadTreeChildren(row: TableRecord, index: number) {
  if (!props.lazy || !props.load) {
    toggleExpand(row, index);
    return;
  }

  const key = rowKeyValue(row, index);
  if (lazyLoadedKeys.value.has(key) || lazyLoadingKeys.value.has(key)) return;

  lazyLoadingKeys.value = new Set(lazyLoadingKeys.value).add(key);
  const resolve: TreeLoadResolve = children => {
    const normalized = Array.isArray(children)
      ? children.filter((child): child is TableRecord => Boolean(child && typeof child === 'object'))
      : [];
    lazyChildren.value = { ...lazyChildren.value, [key]: normalized };
    lazyLoadedKeys.value = new Set(lazyLoadedKeys.value).add(key);
    const nextLoadingKeys = new Set(lazyLoadingKeys.value);
    nextLoadingKeys.delete(key);
    lazyLoadingKeys.value = nextLoadingKeys;
    if (normalized.length && !isRowExpanded(row, index)) toggleExpand(row, index);
  };

  try {
    const result = props.load(row, {
      expanded: isRowExpanded(row, index),
      level: treeDepth(row),
      key
    }, resolve);
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      void (result as Promise<unknown>).then(value => {
        if (Array.isArray(value)) resolve(value as TableRecord[]);
      }).catch(() => resolve([]));
    }
  } catch {
    resolve([]);
  }
}

function setTreeRowExpansion(row: TableRecord, expanded?: boolean) {
  const index = data.value.indexOf(row);
  const rowIndex = index >= 0 ? index : 0;
  const shouldExpand = expanded === undefined ? !isRowExpanded(row, rowIndex) : expanded;
  if (shouldExpand) {
    if (!isRowExpanded(row, rowIndex)) toggleTreeRow(row, rowIndex);
  } else if (isRowExpanded(row, rowIndex)) {
    toggleExpand(row, rowIndex);
  }
}

function updateKeyChildren(key: TableKey, children: TableRecord[]) {
  const normalized = Array.isArray(children)
    ? children.filter((child): child is TableRecord => Boolean(child && typeof child === 'object'))
    : [];
  const normalizedKey = String(key);
  lazyChildren.value = { ...lazyChildren.value, [normalizedKey]: normalized };
  lazyLoadedKeys.value = new Set(lazyLoadedKeys.value).add(normalizedKey);
  const nextLoadingKeys = new Set(lazyLoadingKeys.value);
  nextLoadingKeys.delete(normalizedKey);
  lazyLoadingKeys.value = nextLoadingKeys;
  if (!normalized.length) {
    expandedKeys.value = expandedKeys.value.filter(item => item !== normalizedKey);
    invokeListener('onUpdateExpandedRowKeys', [...expandedKeys.value]);
  }
}

function ariaSort(column: UiTableColumn) {
  const key = columnKey(column, columns.value.indexOf(column));
  if (sortState.value.prop !== key || !sortState.value.order) return 'none';
  return sortState.value.order === 'ascending' ? 'ascending' : 'descending';
}
function sortIconClass(column: UiTableColumn) {
  const key = columnKey(column, columns.value.indexOf(column));
  return {
    'is-ascending': sortState.value.prop === key && sortState.value.order === 'ascending',
    'is-descending': sortState.value.prop === key && sortState.value.order === 'descending'
  };
}
function toggleSort(column: UiTableColumn) {
  if (!column.sortable) return;
  const key = columnKey(column, columns.value.indexOf(column));
  const nextOrder: SortOrder = sortState.value.prop !== key
    ? 'ascending'
    : sortState.value.order === 'ascending'
      ? 'descending'
      : sortState.value.order === 'descending'
        ? null
        : 'ascending';
  sortState.value = { prop: nextOrder ? key : '', order: nextOrder };
  currentPage.value = 1;
  invokeListener('onSortChange', { prop: key, order: nextOrder });
}

function handleHeaderClick(column: UiTableColumn, _index: number, event: MouseEvent) {
  invokeListener('onHeaderClick', column, event);
}

function handleSortTrigger(column: UiTableColumn, index: number, event: MouseEvent) {
  // Element Plus 的 custom 排序由业务自行维护（例如对象存储的多字段排序）。
  // 点击排序按钮时直接复用 header-click，避免适配到 Animal Table 后排序逻辑丢失。
  if (column.sortable === 'custom' && typeof attrs.onHeaderClick === 'function') {
    handleHeaderClick(column, index, event);
    return;
  }
  toggleSort(column);
}

function setSort(prop: string, order: SortOrder, emitChange = false) {
  sortState.value = { prop, order };
  currentPage.value = 1;
  if (emitChange) invokeListener('onSortChange', { prop, order });
}

function setCurrentRow(row?: unknown | null) {
  if (!row || typeof row !== 'object') {
    currentRowKey.value = '';
    return;
  }
  const record = row as TableRecord;
  const rowIndex = data.value.indexOf(record);
  currentRowKey.value = rowKeyValue(record, rowIndex >= 0 ? rowIndex : 0);
}

function filterValueKey(value: unknown) {
  return `${typeof value}:${String(value)}`;
}
function isFilterChecked(column: UiTableColumn, value: unknown) {
  return filterDraft.value.some(item => filterValueKey(item) === filterValueKey(value));
}
function updateFilterMenuPosition() {
  if (!filterAnchor.value || !openFilterKey.value) return;
  const anchorRect = filterAnchor.value.getBoundingClientRect();
  const menuWidth = filterMenuEl.value?.offsetWidth || 210;
  const menuHeight = filterMenuEl.value?.offsetHeight || 220;
  const padding = 12;
  const maxLeft = Math.max(padding, window.innerWidth - menuWidth - padding);
  const left = Math.min(Math.max(padding, anchorRect.left), maxLeft);
  const canPlaceBelow = anchorRect.bottom + 8 + menuHeight <= window.innerHeight - padding;
  const top = canPlaceBelow
    ? anchorRect.bottom + 8
    : Math.max(padding, anchorRect.top - menuHeight - 8);
  filterMenuStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`
  };
}

function toggleFilter(column: UiTableColumn, index: number, event: MouseEvent) {
  const key = columnKey(column, index);
  if (openFilterKey.value === key) {
    closeFilterMenu(true);
    return;
  }
  openFilterKey.value = key;
  filterAnchor.value = event.currentTarget as HTMLElement;
  filterDraft.value = [...activeFilterValues(column)];
  filterMenuStyle.value = {};
  void nextTick(updateFilterMenuPosition);
}
function toggleFilterValue(column: UiTableColumn, value: unknown) {
  const next = filterDraft.value.some(item => filterValueKey(item) === filterValueKey(value))
    ? filterDraft.value.filter(item => filterValueKey(item) !== filterValueKey(value))
    : column.filterMultiple === false ? [value] : [...filterDraft.value, value];
  filterDraft.value = next;
}
function clearFilter(column: UiTableColumn) {
  filterDraft.value = [];
  applyFilter(column, columns.value.indexOf(column));
}
function applyFilter(column: UiTableColumn, index: number) {
  const key = columnKey(column, index);
  if (!column.filteredValue) filterState.value = { ...filterState.value, [key]: [...filterDraft.value] };
  closeFilterMenu(true);
  currentPage.value = 1;
  const filterValues = column.filteredValue || filterDraft.value;
  invokeListener('onFilterChange', { [key]: filterValues });
}

function handleRowClick(row: TableRecord, index: number, event: MouseEvent) {
  currentRowKey.value = rowKeyValue(row, index);
  invokeListener('onUpdateCurrentRowKey', currentRowKey.value);
  invokeListener('onCurrentChange', row);
  invokeListener('onRowClick', row, index, event);
}
function handleRowDblclick(row: TableRecord, index: number, event: MouseEvent) {
  invokeListener('onRowDblclick', row, index, event);
}

function handlePagination(payload: { page: number; limit: number }) {
  if (!paginationConfig.value) return;
  if (paginationConfig.value.current === undefined) currentPage.value = payload.page;
  if (paginationConfig.value.pageSize === undefined) currentPageSize.value = payload.limit;
  invokeListener('onChange', payload.page, payload.limit);
  invokeListener('onPagination', payload);
}

const paginationShowSizeChanger = computed(() => paginationConfig.value?.showSizeChanger ?? true);
const paginationPageSizeOptions = computed(() => paginationConfig.value?.pageSizeOptions ?? [10, 20, 50, 100]);
const paginationShowQuickJumper = computed(() => paginationConfig.value?.showQuickJumper ?? true);
const paginationShowTotal = computed(() => paginationConfig.value?.showTotal ?? true);

const animalAttrs = computed(() => {
  const next = { ...attrs };
  ['class', 'style', 'border', 'height', 'max-height', 'size', 'highlight-current-row', 'current-row-key', 'selected-row-keys', 'expanded-row-keys', 'lazy', 'load'].forEach(key => Reflect.deleteProperty(next, key));
  Object.keys(next).filter(key => key.startsWith('on')).forEach(key => Reflect.deleteProperty(next, key));
  return next;
});
const animalStyle = computed(() => attrs.style);
const elementAttrs = computed(() => ({ ...attrs }));
const elementRowKey = computed(() => {
  const rowKey = props.rowKey;
  if (typeof rowKey === 'function') return (row: TableRecord) => String(rowKey(row));
  return rowKey;
});

function elementColumnProps(column: UiTableColumn) {
  return {
    ...column,
    prop: column.dataIndex,
    label: typeof column.title === 'string' ? column.title : undefined,
    sortable: column.sortable || false
  } as Record<string, unknown>;
}

const elementRowClassName = computed(() => {
  const rowClassName = props.rowClassName;
  if (typeof rowClassName !== 'function') return rowClassName;
  return ({ row, rowIndex }: { row: TableRecord; rowIndex: number }) => rowClassName(row, rowIndex) || '';
});

watch(() => props.selectedRowKeys, value => {
  if (value) selectedKeys.value = normalizeKeys(value);
}, { deep: true });
watch(() => props.expandedRowKeys, value => {
  if (value) expandedKeys.value = normalizeKeys(value);
}, { deep: true });
watch(() => props.currentRowKey, value => {
  currentRowKey.value = value === undefined ? '' : String(value);
});
watch(() => props.defaultSort, value => {
  if (value) setSort(value.prop || '', value.order || null);
}, { deep: true });
watch(() => paginationConfig.value?.current, value => {
  if (value !== undefined) currentPage.value = Math.max(1, value);
});
watch(() => paginationConfig.value?.pageSize, value => {
  if (value !== undefined) currentPageSize.value = Math.max(1, value);
});
watch([paginationTotal, currentPageSize], () => {
  if (currentPage.value > maxPage.value) currentPage.value = maxPage.value;
});
watch(data, rows => {
  if (props.defaultExpandAll && !props.expandedRowKeys) {
    const keys: string[] = [];
    const visit = (items: TableRecord[]) => items.forEach((row, index) => {
      if (!hasTreeChildren(row)) return;
      keys.push(rowKeyValue(row, index));
      visit(treeChildren(row));
    });
    visit(rows);
    expandedKeys.value = keys;
  }
});

function closeFilterMenu(restoreFocus = false) {
  const anchor = filterAnchor.value;
  openFilterKey.value = null;
  filterAnchor.value = null;
  filterMenuStyle.value = {};
  if (restoreFocus) void nextTick(() => anchor?.focus());
}

const closeFilterOnDocumentClick = () => closeFilterMenu();
const closeFilterOnEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !openFilterKey.value) return;
  event.preventDefault();
  event.stopPropagation();
  closeFilterMenu(true);
};
onMounted(() => document.addEventListener('click', closeFilterOnDocumentClick));
onMounted(() => {
  document.addEventListener('keydown', closeFilterOnEscape, true);
  window.addEventListener('resize', updateFilterMenuPosition);
  window.addEventListener('scroll', updateFilterMenuPosition, true);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', closeFilterOnDocumentClick);
  document.removeEventListener('keydown', closeFilterOnEscape, true);
  window.removeEventListener('resize', updateFilterMenuPosition);
  window.removeEventListener('scroll', updateFilterMenuPosition, true);
});

defineExpose({
  sort: (prop: string, order: SortOrder) => setSort(prop, order, true),
  setCurrentRow,
  toggleRowSelection: setRowSelection,
  toggleRowExpansion: setTreeRowExpansion,
  updateKeyChildren
});
</script>

<style scoped>
.ui-animal-table-shell {
  position: relative;
  width: 100%;
  overflow: hidden;
  border: 2px solid var(--animal-border-color-light, #e8e2d6);
  border-radius: 20px;
  background: var(--animal-bg-color-secondary, #f0e8d8);
  color: var(--animal-text-color, #794f27);
  box-shadow: 0 4px 0 var(--animal-shadow-soft, #d4c9b4), var(--app-shadow-sm, 0 8px 22px rgba(61, 52, 40, .08));
}

.ui-animal-table-scroll { width: 100%; max-width: 100%; overflow-x: auto; overscroll-behavior: auto; -webkit-overflow-scrolling: touch; scrollbar-color: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 48%, var(--animal-border-color, #aaa69d)) transparent; scrollbar-width: thin; }
.ui-animal-table-scroll.is-vertical-scroll { scrollbar-gutter: stable; }
.ui-animal-table-scroll.is-vertical-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
.ui-animal-table-scroll.is-vertical-scroll::-webkit-scrollbar-track { background: var(--animal-bg-color-secondary, #f0e8d8); border-radius: 999px; }
.ui-animal-table-scroll.is-vertical-scroll::-webkit-scrollbar-thumb { border: 2px solid var(--animal-bg-color-secondary, #f0e8d8); border-radius: 999px; background: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 52%, var(--animal-border-color, #aaa69d)); }
.ui-animal-table-scroll.is-vertical-scroll::-webkit-scrollbar-thumb:hover { background: var(--animal-primary-color, #19c8b9); }
.ui-animal-table {
  display: grid;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: var(--animal-font-family, 'Nunito', 'Noto Sans SC', sans-serif);
}
.ui-animal-table colgroup,
.ui-animal-table thead,
.ui-animal-table tbody,
.ui-animal-table tr { display: contents; }
.ui-animal-table colgroup { display: none; }
.ui-animal-table__head { background: var(--animal-bg-color-secondary, #f0e8d8); }
.ui-animal-table__head-row, .ui-animal-table__row { position: relative; }
.ui-animal-table__th, .ui-animal-table__cell { box-sizing: border-box; border-bottom: 1px dashed var(--animal-border-color-light, #e8e2d6); color: var(--animal-text-color, #794f27); vertical-align: middle; }
.ui-animal-table__th { position: relative; min-height: 52px; padding: 14px 16px; overflow: hidden; background: var(--animal-bg-color-secondary, #f0e8d8); font-size: 13px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.ui-animal-table-scroll.is-vertical-scroll .ui-animal-table__th { position: sticky; top: 0; z-index: 4 !important; }
.ui-animal-table-scroll.is-vertical-scroll .ui-animal-table__th.is-fixed-left,
.ui-animal-table-scroll.is-vertical-scroll .ui-animal-table__th.is-fixed-right { z-index: 5 !important; }
.ui-animal-table__cell { min-height: 52px; padding: 13px 16px; background: var(--animal-bg-color, #f8f8f0); font-size: 14px; font-weight: 550; line-height: 1.55; overflow-wrap: anywhere; }
.ui-animal-table__cell.is-operation { overflow: visible; padding-right: 12px; padding-left: 12px; white-space: nowrap; }
.ui-animal-table__cell.is-operation :deep(.department-table-actions),
.ui-animal-table__cell.is-operation :deep(.table-actions),
.ui-animal-table__cell.is-operation :deep(.history-actions) { display: inline-flex; width: max-content; max-width: none; flex-wrap: nowrap; align-items: center; white-space: nowrap; }
.ui-animal-table__cell.is-operation .ui-animal-table__cell-inner { display: inline-flex; width: max-content; max-width: none; align-items: center; justify-content: center; flex-wrap: nowrap; white-space: nowrap; }
.ui-animal-table__cell.is-operation .ui-animal-table__cell-content { display: inline-flex; width: max-content; max-width: none; align-items: center; gap: 8px; flex-wrap: nowrap; white-space: nowrap; }
.ui-animal-table__cell.is-operation :deep(.el-tooltip),
.ui-animal-table__cell.is-operation :deep(.ui-tooltip),
.ui-animal-table__cell.is-operation :deep(.el-button),
.ui-animal-table__cell.is-operation :deep(.ui-animal-button) { display: inline-flex; flex: 0 0 auto; align-items: center; white-space: nowrap; }
.ui-animal-table__cell.is-operation :deep(.el-button),
.ui-animal-table__cell.is-operation :deep(.ui-animal-button) { margin: 0 !important; }
.ui-animal-table__row:nth-child(even) .ui-animal-table__cell { background: color-mix(in srgb, var(--animal-bg-color-secondary, #f0e8d8) 30%, var(--animal-bg-color, #f8f8f0)); }
.ui-animal-table__row:hover .ui-animal-table__cell, .ui-animal-table__row.is-current .ui-animal-table__cell { background: var(--animal-primary-color-bg, #e6f9f6); color: var(--animal-text-color, #794f27); }
.ui-animal-table__row:hover .ui-animal-table__cell.is-fixed-left,
.ui-animal-table__row:hover .ui-animal-table__cell.is-fixed-right,
.ui-animal-table__row.is-current .ui-animal-table__cell.is-fixed-left,
.ui-animal-table__row.is-current .ui-animal-table__cell.is-fixed-right { background: var(--animal-primary-color-bg, #e6f9f6); color: var(--animal-text-color, #794f27); }
.ui-animal-table__row.is-tree-parent .ui-animal-table__cell.is-tree-label { font-weight: 700; }
.ui-animal-table__row.is-tree-expanded .ui-animal-table__cell.is-tree-label { background: color-mix(in srgb, var(--animal-primary-color-bg, #e6f9f6) 48%, var(--animal-bg-color, #f8f8f0)); }
.ui-animal-table__row.is-tree-leaf .ui-animal-table__cell.is-tree-label { font-weight: 500; }
.ui-animal-table__th.is-fixed-left, .ui-animal-table__cell.is-fixed-left, .ui-animal-table__th.is-fixed-right, .ui-animal-table__cell.is-fixed-right { z-index: 2; background: var(--animal-bg-color, #f8f8f0); }
.ui-animal-table__th.is-fixed-left, .ui-animal-table__th.is-fixed-right { background: var(--animal-bg-color-secondary, #f0e8d8); }
.ui-animal-table__cell.is-first-fixed-left, .ui-animal-table__th.is-first-fixed-left { box-shadow: 3px 0 0 color-mix(in srgb, var(--animal-border-color, #aaa69d) 42%, transparent); }
.ui-animal-table__cell.is-last-fixed-right, .ui-animal-table__th.is-last-fixed-right { box-shadow: -3px 0 0 color-mix(in srgb, var(--animal-border-color, #aaa69d) 42%, transparent); }
.ui-animal-table__header-content { position: relative; display: flex; align-items: center; width: 100%; min-width: 0; overflow: hidden; gap: 6px; text-overflow: ellipsis; white-space: nowrap; }
.ui-animal-table__th.is-align-left .ui-animal-table__header-content { justify-content: flex-start; }
.ui-animal-table__th.is-align-center .ui-animal-table__header-content { justify-content: center; }
.ui-animal-table__th.is-align-right .ui-animal-table__header-content { justify-content: flex-end; }
.ui-animal-table__sort-trigger, .ui-animal-table__filter-trigger, .ui-animal-table__expand-trigger { border: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.ui-animal-table__sort-trigger { display: inline-flex; align-items: center; gap: 6px; padding: 0; }
.ui-animal-table__sort-trigger:hover, .ui-animal-table__filter-trigger:hover, .ui-animal-table__filter-trigger.is-active { color: var(--animal-primary-color, #19c8b9); }
.ui-animal-table__sort-icon { color: var(--animal-text-color-secondary, #9f927d); font-size: 13px; transition: transform .2s ease, color .2s ease; }
.ui-animal-table__sort-icon.is-ascending, .ui-animal-table__sort-icon.is-descending { color: var(--animal-primary-color, #19c8b9); }
.ui-animal-table__sort-icon.is-ascending { transform: rotate(180deg); }
.ui-animal-table__filter-trigger { padding: 0 2px; font-size: 12px; }
.ui-animal-table__filter-menu { z-index: 100001; min-width: 170px; max-width: min(280px, calc(100vw - 24px)); max-height: min(360px, calc(100vh - 24px)); overflow: auto; padding: 10px; border: 2px solid var(--animal-border-color-light, #e8e2d6); border-radius: 14px; background: var(--animal-bg-color, #f8f8f0); box-shadow: var(--app-shadow-lg, 0 12px 28px rgba(61, 52, 40, .2)); color: var(--animal-text-color, #794f27); text-align: left; }
.ui-animal-table__cell-inner { display: inline-flex; align-items: center; max-width: 100%; min-width: 0; vertical-align: middle; }
.ui-animal-table__cell-inner.is-tree-label-content { display: flex; width: 100%; gap: 8px; overflow: hidden; white-space: nowrap; }
.ui-animal-table__cell-inner.is-tree-label-content > .ui-animal-tree-prefix { flex: 0 0 auto; }
.ui-animal-table__cell-inner.is-tree-label-content > .ui-animal-table__cell-content,
.ui-animal-table__cell-inner.is-tree-label-content > :deep(.el-tooltip),
.ui-animal-table__cell-inner.is-tree-label-content > :deep(.ui-tooltip) { flex: 1 1 auto; min-width: 0; overflow: hidden; }
.ui-animal-table__cell-inner.is-tree-label-content > :deep(.el-tooltip) .ui-animal-table__cell-content,
.ui-animal-table__cell-inner.is-tree-label-content > :deep(.ui-tooltip) .ui-animal-table__cell-content { display: block; width: 100%; }
.ui-animal-table__cell-content { display: inline-block; max-width: 100%; min-width: 0; vertical-align: middle; }
.ui-animal-table__cell-content--overflow { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-animal-tree-prefix { display: inline-flex; align-items: center; min-height: 28px; vertical-align: middle; }
.ui-animal-tree-prefix__level { position: relative; display: inline-block; width: 26px; height: 28px; flex: 0 0 26px; }
.ui-animal-tree-prefix__level::before { position: absolute; top: -8px; bottom: -8px; left: 12px; width: 1px; background: color-mix(in srgb, var(--animal-border-color, #aaa69d) 58%, transparent); content: ''; }
.ui-animal-tree-prefix__level.is-last::after { position: absolute; top: 13px; left: 12px; width: 14px; height: 1px; background: color-mix(in srgb, var(--animal-border-color, #aaa69d) 58%, transparent); content: ''; }
.ui-animal-tree-prefix__toggle { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; width: 23px; height: 23px; margin-right: 7px; padding: 0 0 1px; border: 1px solid color-mix(in srgb, var(--animal-primary-color, #19c8b9) 52%, var(--animal-border-color, #aaa69d)); border-radius: 8px; background: color-mix(in srgb, var(--animal-primary-color-bg, #e6f9f6) 78%, var(--animal-bg-color, #f8f8f0)); color: var(--animal-primary-color, #19c8b9); font: inherit; font-size: 18px; font-weight: 800; line-height: 1; cursor: pointer; transition: transform .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease; }
.ui-animal-tree-prefix__toggle:hover { border-color: var(--animal-primary-color, #19c8b9); background: var(--animal-primary-color-bg, #e6f9f6); box-shadow: 0 2px 0 color-mix(in srgb, var(--animal-primary-color, #19c8b9) 20%, transparent); }
.ui-animal-tree-prefix__toggle.is-expanded { transform: rotate(90deg); background: var(--animal-primary-color-bg, #e6f9f6); }
.ui-animal-tree-prefix__toggle.is-loading { color: var(--animal-accent-color, #f0a85b); cursor: wait; transform: none; }
.ui-animal-tree-prefix__toggle:disabled { opacity: .72; }
.ui-animal-tree-prefix__placeholder { display: inline-block; width: 30px; height: 24px; flex: 0 0 30px; }
.ui-animal-table__filter-option { display: flex; align-items: center; gap: 8px; min-height: 32px; padding: 5px 6px; border-radius: 9px; cursor: pointer; }
.ui-animal-table__filter-option:hover { background: var(--animal-primary-color-bg, #e6f9f6); }
.ui-animal-table__filter-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--animal-border-color-light, #e8e2d6); }
.ui-animal-table__filter-clear, .ui-animal-table__filter-apply { min-height: 28px; padding: 0 10px; border: 1px solid var(--animal-border-color, #aaa69d); border-radius: 999px; background: transparent; color: var(--animal-text-color, #794f27); font: inherit; cursor: pointer; }
.ui-animal-table__filter-apply { border-color: var(--animal-primary-color, #19c8b9); background: var(--animal-primary-color, #19c8b9); color: #fff; }
.ui-animal-table__checkbox { width: 17px; height: 17px; accent-color: var(--animal-primary-color, #19c8b9); cursor: pointer; }
.ui-animal-table__checkbox:disabled { cursor: not-allowed; opacity: .5; }
.ui-animal-table__expand-trigger { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; color: var(--animal-primary-color, #19c8b9); font-size: 24px; line-height: 1; transition: transform .2s ease, background .2s ease; }
.ui-animal-table__expand-trigger:hover { background: var(--animal-primary-color-bg, #e6f9f6); }
.ui-animal-table__expand-trigger.is-expanded { transform: rotate(90deg); }
.ui-animal-table__index-label, .ui-animal-table__index { display: inline-block; width: 100%; text-align: center; }
.ui-animal-table__expanded-row td { padding: 16px 20px; border-bottom: 1px dashed var(--animal-border-color-light, #e8e2d6); background: color-mix(in srgb, var(--animal-primary-color-bg, #e6f9f6) 42%, var(--animal-bg-color, #f8f8f0)); }
.ui-animal-table__expanded-row td,
.ui-animal-table__empty-row td { grid-column: 1 / -1; }
.ui-animal-table__empty-cell { padding: 54px 20px; background: var(--animal-bg-color, #f8f8f0); }
.ui-animal-table__empty { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--animal-text-color-secondary, #9f927d); }
.ui-animal-table__empty-icon { color: var(--animal-primary-color, #19c8b9); font-size: 34px; opacity: .55; }
.ui-animal-table__loader { position: absolute; z-index: 6; inset: 0; display: flex; align-items: center; justify-content: center; gap: 10px; background: color-mix(in srgb, var(--animal-bg-color, #f8f8f0) 82%, transparent); color: var(--animal-primary-color, #19c8b9); font-weight: 800; backdrop-filter: blur(2px); }
.ui-animal-table__spinner { display: inline-block; font-size: 28px; animation: ui-animal-table-spin 1s linear infinite; }
.ui-animal-table__pagination { display: flex; justify-content: flex-end; padding: 10px 14px 8px; border-top: 1px dashed var(--animal-border-color-light, #e8e2d6); background: var(--animal-bg-color-secondary, #f0e8d8); }
@keyframes ui-animal-table-spin { to { transform: rotate(360deg); } }

/* 动森深色模式：表头、内容、hover/current、固定列和浮层使用同一套实体层级。 */
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table-shell {
  border-color: var(--animal-border-color-light, #526b65);
  background: var(--animal-bg-color-secondary, #405650);
  color: var(--animal-text-color, #f5ead1);
  box-shadow: 0 4px 0 var(--animal-shadow-soft, #1a2525), var(--app-shadow-sm);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__head,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__th,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__th.is-fixed-left,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__th.is-fixed-right {
  background: var(--animal-bg-color-secondary, #405650);
  color: var(--tableHeaderTextColor, #fff6df);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__th:hover {
  background: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 22%, var(--animal-bg-color-secondary, #405650));
  color: #ffffff;
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__th,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__cell {
  border-bottom-color: var(--animal-border-color-light, #526b65);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__cell,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__cell.is-fixed-left,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__cell.is-fixed-right {
  background: var(--animal-bg-color, #344a46);
  color: var(--animal-text-color, #f5ead1);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__row:nth-child(even) .ui-animal-table__cell {
  background: color-mix(in srgb, var(--animal-bg-color-secondary, #405650) 32%, var(--animal-bg-color, #344a46));
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__row:hover .ui-animal-table__cell,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__row.is-current .ui-animal-table__cell {
  background: var(--animal-primary-color-bg, #244946) !important;
  color: var(--animal-text-color, #f5ead1);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__row.is-tree-expanded .ui-animal-table__cell.is-tree-label {
  background: color-mix(in srgb, var(--animal-primary-color-bg, #244946) 72%, var(--animal-bg-color, #344a46));
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-tree-prefix__level::before,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-tree-prefix__level.is-last::after {
  background: color-mix(in srgb, var(--animal-border-color, #78918a) 82%, transparent);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-tree-prefix__toggle {
  border-color: color-mix(in srgb, var(--animal-primary-color, #19c8b9) 58%, var(--animal-border-color, #78918a));
  background: color-mix(in srgb, var(--animal-primary-color-bg, #244946) 86%, var(--animal-bg-color, #344a46));
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__cell-content,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__cell-content :deep(*) {
  color: inherit;
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__cell.is-first-fixed-left,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__th.is-first-fixed-left {
  box-shadow: 3px 0 0 color-mix(in srgb, var(--animal-border-color, #78918a) 70%, transparent);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__cell.is-last-fixed-right,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__th.is-last-fixed-right {
  box-shadow: -3px 0 0 color-mix(in srgb, var(--animal-border-color, #78918a) 70%, transparent);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__filter-menu {
  border-color: var(--animal-border-color-light, #526b65);
  background: var(--animal-bg-color, #344a46);
  color: var(--animal-text-color, #f5ead1);
  box-shadow: var(--app-shadow-lg);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__filter-option:hover,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__expand-trigger:hover,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-tree-prefix__toggle:hover {
  background: var(--animal-primary-color-bg, #244946);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__empty-cell,
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__expanded-row td {
  background: var(--animal-bg-color, #344a46);
  color: var(--animal-text-color, #f5ead1);
}
:global(html[data-ui-theme='animal'][data-color-mode='dark']) .ui-animal-table__pagination {
  border-top-color: var(--animal-border-color-light, #526b65);
  background: var(--animal-bg-color-secondary, #405650);
}
@media (max-width: 768px) {
  .ui-animal-table-shell { border-radius: 14px; }
  .ui-animal-table__th { padding: 12px 10px; font-size: 12px; }
  .ui-animal-table__cell { padding: 11px 10px; font-size: 13px; }
  .ui-animal-table__cell.is-operation { padding-right: 8px; padding-left: 8px; }
  .ui-animal-table__cell.is-operation .ui-animal-table__cell-content { gap: 4px; }
  .ui-animal-table__pagination :deep(.animal-pagination) { justify-content: flex-end; }
}
</style>
