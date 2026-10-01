<template>
  <div class="top-right-btn" :style="style">
    <div class="toolbar-row">
      <UiTooltip
        v-if="search"
        class="item"
        :content="showSearch ? t('common.btnHideSearch') : t('common.btnShowSearch')"
        placement="bottom"
      >
        <UiButton class="toolbar-icon-button" circle icon="Search" :aria-label="showSearch ? t('common.btnHideSearch') : t('common.btnShowSearch')" @click="toggleSearch()" />
      </UiTooltip>
      <UiTooltip class="item" :content="t('common.btnRefresh')" placement="bottom">
        <UiButton class="toolbar-icon-button" circle icon="Refresh" :aria-label="t('common.btnRefresh')" @click="refresh()" />
      </UiTooltip>
      <UiTooltip v-if="columns" class="item" :content="t('common.btnShowHideColumn')" placement="bottom">
        <div class="show-btn">
          <el-popover placement="bottom-start" trigger="click" :teleported="true" :hide-after="0" popper-class="right-toolbar-column-popper">
            <div class="tree-header">{{ t('common.btnShowHideColumn') }}</div>
            <el-tree
              ref="columnRef"
              :data="columns"
              show-checkbox
              node-key="key"
              :props="{ label: 'label', children: 'children' } as any"
              @check="columnChange"
            ></el-tree>
            <template #reference>
              <UiButton class="toolbar-icon-button" circle icon="Menu" :aria-label="t('common.btnShowHideColumn')" />
            </template>
          </el-popover>
        </div>
      </UiTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import cache from '@/plugins/cache';
import { propTypes } from '@/utils/propTypes';
import { UiButton, UiTooltip } from '@/components/UiKit';

const { t } = useI18n();

const props = defineProps({
  showSearch: propTypes.bool.def(true),
  columns: propTypes.fieldOption,
  search: propTypes.bool.def(true),
  gutter: propTypes.number.def(10),
  /* 列显隐状态记忆的 localStorage key（传入则启用记忆，不传则不记忆） */
  storageKey: propTypes.string.def('')
});

const columnRef = ref<ElTreeInstance>();
const emits = defineEmits(['update:showSearch', 'queryTable']);

const style = computed(() => {
  const ret: any = {};
  if (props.gutter) {
    ret.marginRight = `${props.gutter / 2}px`;
  }
  return ret;
});

// 搜索
function toggleSearch() {
  emits('update:showSearch', !props.showSearch);
}

// 刷新
function refresh() {
  emits('queryTable');
}

// 将当前列显隐状态持久化到 localStorage
function saveStorage() {
  if (!props.storageKey) return;
  try {
    const state: Record<string, boolean> = {};
    props.columns?.forEach((col, index) => {
      state[index] = col.visible;
    });
    cache.local.setJSON(props.storageKey, state);
  } catch (e) {}
}

// 更改数据列的显示和隐藏
function columnChange(...args: any[]) {
  props.columns?.forEach(item => {
    item.visible = args[1].checkedKeys.includes(item.key);
  });
  saveStorage();
}

// 显隐列初始默认隐藏列
onMounted(() => {
  // 如果传入了 storageKey，从 localStorage 恢复列显隐状态
  if (props.storageKey) {
    try {
      const saved = cache.local.getJSON(props.storageKey);
      if (saved && typeof saved === 'object') {
        props.columns?.forEach((col, index) => {
          if (saved[index] !== undefined) col.visible = saved[index];
        });
      }
    } catch (e) {}
  }
  props.columns?.forEach(item => {
    if (item.visible) {
      columnRef.value?.setChecked(item.key, true, false);
    }
  });
});
</script>

<style lang="scss" scoped>
:deep(.toolbar-icon-button.el-button.is-circle),
:deep(.toolbar-icon-button.ui-animal-button--circle) {
  width: 36px;
  min-width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: 14px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);
  color: var(--app-text-muted);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    color 0.25s ease,
    background 0.25s ease;

  &:hover {
    transform: translateY(-1px);
    color: var(--app-accent-strong);
    background: var(--app-accent-soft);
    border-color: rgba(14, 165, 233, 0.2);
  }
}

:deep(.toolbar-icon-button .el-icon),
:deep(.toolbar-icon-button .animal-btn__icon) {
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
}

:deep(.toolbar-icon-button .el-icon svg),
:deep(.toolbar-icon-button .animal-btn__icon svg) {
  width: 16px;
  height: 16px;
}

:deep(.el-transfer__button) {
  border-radius: 50%;
  display: block;
  margin-left: 0px;
}
:deep(.el-transfer__button:first-child) {
  margin-bottom: 10px;
}

.my-el-transfer {
  text-align: center;
}

.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  max-width: 100%;
  margin: 0 !important;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.tree-header {
  width: 100%;
  line-height: 24px;
  text-align: center;
  font-weight: 700;
  color: var(--app-text-title);
}

.show-btn {
  margin-left: 0;
}
</style>
