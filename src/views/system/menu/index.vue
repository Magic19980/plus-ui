<template>
  <div class="p-2 app-container system-menu-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div>
              <span class="panel-kicker">Search Filters</span>
              <h3>{{ $t('common.sectionSearchCondition') }}</h3>
            </div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item :label="$t('common.menuName')" prop="menuName">
            <el-input
              v-model="queryParams.menuName"
              :placeholder="$t('common.placeholderInputMenuName')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.status')" prop="status">
            <el-select v-model="queryParams.status" :placeholder="$t('common.menuStatus')" clearable>
              <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">{{ $t('common.btnSearch') }}</el-button>
            <el-button icon="Refresh" @click="resetQuery">{{ $t('common.btnReset') }}</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <span class="panel-kicker">Menu Dataset</span>
            <h3>{{ $t('common.sectionMenuList') }}</h3>
            <p>{{ $t('common.descMenuList') }}</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['system:menu:add']" type="primary" plain icon="Plus" @click="handleAdd()">
              {{ $t('common.btnAdd') }}
            </el-button>
            <el-button
              v-hasPermi="['system:menu:remove']"
              type="danger"
              plain
              icon="Delete"
              @click="handleCascadeDelete"
              :loading="deleteLoading"
            >
              {{ $t('common.btnBatchDelete') }}
            </el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <table-skeleton v-if="loading && !menuList?.length" />
      <el-table
        v-else
        ref="menuTableRef"
        v-loading="loading"
        class="data-table"
        :data="menuList"
        row-key="menuId"
        border
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        lazy
        :load="getChildrenList"
        :expand-change="expandMenuHandle"
      >
        <template #empty><empty-state /></template>
        <el-table-column prop="menuName" :label="$t('common.menuName')" :show-overflow-tooltip="true" width="220">
          <template #default="scope">
            <div class="menu-name-cell">
              <svg-icon v-if="isMenuIconVisible(scope.row.icon)" :icon-class="scope.row.icon" />
              <span class="menu-name-text">{{ scope.row.menuName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.type')" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getMenuTypeMeta(scope.row).type" size="small">
              {{ getMenuTypeMeta(scope.row).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" :label="$t('common.sort')" width="60"></el-table-column>
        <el-table-column prop="perms" :label="$t('common.permissionCode')" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="component" :label="$t('common.componentPath')" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="status" :label="$t('common.status')" width="80">
          <template #default="scope">
            <dict-tag :options="sys_normal_disable" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column fixed="right" :label="$t('common.operation')" width="180">
          <template #default="scope">
            <el-tooltip :content="$t('common.tooltipModify')" placement="top">
              <el-button
                v-hasPermi="['system:menu:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              />
            </el-tooltip>
            <el-tooltip :content="$t('common.tooltipAdd')" placement="top">
              <el-button
                v-hasPermi="['system:menu:add']"
                link
                type="primary"
                icon="Plus"
                @click="handleAdd(scope.row)"
              />
            </el-tooltip>
            <el-tooltip :content="$t('common.tooltipDelete')" placement="top">
              <el-button
                v-hasPermi="['system:menu:remove']"
                link
                type="primary"
                icon="Delete"
                @click="handleDelete(scope.row)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" destroy-on-close append-to-bod width="800px">
      <el-form ref="menuFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item :label="$t('common.parentMenu')">
              <el-tree-select
                v-model="form.parentId"
                :data="menuOptions"
                :props="{ value: 'menuId', label: 'menuName', children: 'children' } as any"
                value-key="menuId"
                :placeholder="$t('common.selectParentMenu')"
                check-strictly
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('common.menuType')" prop="menuType">
              <el-radio-group v-model="form.menuType">
                <el-radio value="M">{{ $t('common.menuTypeDirectory') }}</el-radio>
                <el-radio value="C">{{ $t('common.menuTypeMenu') }}</el-radio>
                <el-radio value="F">{{ $t('common.menuTypeButton') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col v-if="form.menuType !== 'F'" :span="24">
            <el-form-item :label="$t('common.menuIcon')" prop="icon">
              <!-- 图标选择器 -->
              <icon-select v-model="form.icon" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.menuName')" prop="menuName">
              <el-input v-model="form.menuName" :placeholder="$t('common.placeholderInputMenuNameCn')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.sort')" prop="orderNum">
              <el-input-number v-model="form.orderNum" controls-position="right" :min="0" />
            </el-form-item>
          </el-col>
          <template v-if="form.menuType !== 'F'">
            <el-col :span="24">
              <div class="i18n-card" :class="{ 'is-expanded': i18nExpanded }">
                <div class="i18n-card-head" @click="i18nExpanded = !i18nExpanded">
                  <span class="i18n-card-title">{{ $t('common.i18nConfig') }}</span>
                  <span class="i18n-card-badge" :class="`i18n-badge--${i18nCompletionTagType}`">{{ i18nCompletionText }}</span>
                  <el-icon class="i18n-card-arrow"><arrow-right /></el-icon>
                </div>
                <el-collapse-transition>
                  <div v-show="i18nExpanded" class="i18n-card-body">
                    <p class="i18n-card-hint">{{ $t('common.descI18nHint') }}</p>
                    <div class="i18n-card-grid">
                      <div v-for="cfg in LOCALE_CONFIG" :key="cfg.locale" class="i18n-card-field">
                        <label class="i18n-card-label">{{ cfg.label }}</label>
                        <el-input
                          v-model="i18nForm[cfg.locale]"
                          :placeholder="cfg.placeholder"
                          clearable
                        />
                      </div>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>
            </el-col>
          </template>
          <el-col v-if="form.menuType !== 'F'" :span="12">
            <el-form-item>
              <template #label>
                <span>
                  <el-tooltip :content="$t('common.tooltipSelectOutlink')" placement="top">
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>{{ $t('common.isExternalLink') }}</span>
              </template>
              <el-radio-group v-model="form.isFrame">
                <el-radio v-for="dict in sys_yes_no" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col v-if="form.menuType !== 'F'" :span="12">
            <el-form-item prop="path">
              <template #label>
                <span>
                  <el-tooltip
                    :content="$t('common.tooltipRouteAddress')"
                    placement="top"
                  >
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>{{ $t('common.routeAddress') }}</span>
              </template>
              <el-input v-model="form.path" :placeholder="$t('common.placeholderInputRouteAddress')" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.menuType === 'C'" :span="12">
            <el-form-item prop="component">
              <template #label>
                <span>
                  <el-tooltip :content="$t('common.tooltipComponentPath')" placement="top">
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>{{ $t('common.componentPath') }}</span>
              </template>
              <el-input v-model="form.component" :placeholder="$t('common.placeholderInputComponentPath')" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.menuType !== 'M'" :span="12">
            <el-form-item>
              <el-input v-model="form.perms" :placeholder="$t('common.placeholderInputPermission')" maxlength="100" />
              <template #label>
                <span>
                  <el-tooltip
                    :content="$t('common.tooltipPermission')"
                    placement="top"
                  >
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>{{ $t('common.permissionLabel') }}</span>
              </template>
            </el-form-item>
          </el-col>
          <el-col v-if="form.menuType === 'C'" :span="12">
            <el-form-item>
              <el-input v-model="form.queryParam" :placeholder="$t('common.placeholderInputRouteParams')" maxlength="255" />
              <template #label>
                <span>
                  <el-tooltip :content="$t('common.tooltipRouteParams')" placement="top">
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>{{ $t('common.routeParams') }}</span>
              </template>
            </el-form-item>
          </el-col>
          <el-col v-if="form.menuType === 'C'" :span="12">
            <el-form-item>
              <template #label>
                <span>
                  <el-tooltip
                    :content="$t('common.tooltipIsCache')"
                    placement="top"
                  >
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>{{ $t('common.isCache') }}</span>
              </template>
              <el-radio-group v-model="form.isCache">
                <el-radio value="Y">{{ $t('common.yes') }}</el-radio>
                <el-radio value="N">{{ $t('common.no') }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col v-if="form.menuType !== 'F'" :span="12">
            <el-form-item>
              <template #label>
                <span>
                  <el-tooltip :content="$t('common.tooltipDisplayStatus')" placement="top">
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>{{ $t('common.displayStatus') }}</span>
              </template>
              <el-radio-group v-model="form.visible">
                <el-radio v-for="dict in sys_show_hide" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <template #label>
                <span>
                  <el-tooltip :content="$t('common.tooltipMenuStatus')" placement="top">
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>{{ $t('common.menuStatus') }}</span>
              </template>
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col v-if="form.visible !== '0'" :span="12">
            <el-form-item :label="$t('common.activeMenu')" prop="activeMenu">
              <template #label>
                <span>
                  <el-tooltip :content="$t('common.tooltipActiveMenu')" placement="top">
                    <el-icon>
                      <question-filled />
                    </el-icon>
                  </el-tooltip>{{ $t('common.activePath') }}</span>
              </template>
              <el-input v-model="form.activeMenu" :placeholder="$t('common.placeholderInputActivePath')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.remark')" prop="remark">
              <el-input v-model="form.remark" :placeholder="$t('common.placeholderInputRemark')" maxlength="500" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">{{ $t('common.btnConfirm') }}</el-button>
          <el-button @click="cancel">{{ $t('common.btnCancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="deleteDialog.visible" :title="deleteDialog.title" destroy-on-close append-to-bod width="750px">
      <el-tree
        ref="menuTreeRef"
        class="tree-border"
        :data="menuOptions"
        show-checkbox
        node-key="menuId"
        :check-strictly="false"
        :empty-text="$t('common.isLoading')"
        :default-expanded-keys="[0]"
        :props="{ value: 'menuId', label: 'menuName', children: 'children' } as any"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitDeleteForm" :loading="deleteLoading">{{ $t('common.btnConfirm') }}</el-button>
          <el-button @click="cancelCascade">{{ $t('common.btnCancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Menu" lang="ts">
import { ArrowRight, QuestionFilled } from '@element-plus/icons-vue';
import { addMenu, cascadeDelMenu, delMenu, getMenu, listMenu, updateMenu } from '@/api/system/menu';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { MenuForm, MenuI18nItem, MenuQuery, MenuVO } from '@/api/system/menu/types';
import { MenuTypeEnum } from '@/enums/MenuTypeEnum';
import { useLoading } from '@/hooks/async/useLoading';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { handleTree } from '@/utils/ruoyi';
import EmptyState from '@/components/EmptyState/index.vue';
import TableSkeleton from '@/components/TableSkeleton/index.vue';

interface MenuOptionsType {
  menuId: number;
  menuName: string;
  children: MenuOptionsType[] | undefined;
}

const { sys_show_hide, sys_normal_disable, sys_yes_no } = toRefs<any>(
  useDict('sys_show_hide', 'sys_normal_disable', 'sys_yes_no')
);

/** 国际化语言配置，新增语言只需追加一项 */
const LOCALE_CONFIG = [
  { locale: 'en_US', label: 'English', placeholder: t('common.placeholderInputMenuNameEn') },
  { locale: 'id_ID', label: 'Bahasa Indonesia', placeholder: t('common.placeholderInputMenuNameId') }
];

/** 初始化国际化表单数据 */
function initI18nForm(): Record<string, string> {
  const form: Record<string, string> = {};
  LOCALE_CONFIG.forEach(c => (form[c.locale] = ''));
  return form;
}

/** 从 i18nForm 构建 i18nList */
function buildI18nList(i18nForm: Record<string, string>): MenuI18nItem[] {
  return LOCALE_CONFIG.filter(c => i18nForm[c.locale]?.trim()).map(c => ({
    locale: c.locale,
    menuName: i18nForm[c.locale].trim()
  }));
}

/** 从 i18nList 解析到 i18nForm */
function parseI18nList(i18nList?: MenuI18nItem[]): Record<string, string> {
  const form = initI18nForm();
  i18nList?.forEach(item => {
    form[item.locale] = item.menuName;
  });
  return form;
}

const menuList = ref<MenuVO[]>([]);
const menuChildrenListMap = ref({});
const menuExpandMap = ref({});
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const menuOptions = ref<MenuOptionsType[]>([]);
const i18nForm = reactive<Record<string, string>>(initI18nForm());
const i18nExpanded = ref(false);

/** 计算国际化完成度 */
function getI18nStats() {
  const filled = LOCALE_CONFIG.filter(c => i18nForm[c.locale]?.trim()).length;
  return { filled, total: LOCALE_CONFIG.length };
}

const queryFormRef = ref<ElFormInstance>();
const menuFormRef = ref<ElFormInstance>();
const initFormData = {
  path: '',
  menuId: undefined,
  parentId: 0,
  menuName: '',
  icon: '',
  menuType: MenuTypeEnum.M,
  orderNum: 1,
  isFrame: 'N',
  isCache: 'Y',
  visible: '0',
  status: '0',
  activeMenu: '',
  remark: ''
};
const data = reactive<PageData<MenuForm, MenuQuery>>({
  form: { ...initFormData },
  queryParams: {
    menuName: undefined,
    status: undefined
  },
  rules: {
    menuName: [{ required: true, message: t('common.validationMenuNameRequired'), trigger: 'blur' }],
    orderNum: [{ required: true, message: t('common.validationOrderNumRequired'), trigger: 'blur' }],
    path: [{ required: true, message: t('common.validationPathRequired'), trigger: 'blur' }]
  }
});

const menuTableRef = ref<ElTableInstance>();

const { queryParams, form, rules } = toRefs<PageData<MenuForm, MenuQuery>>(data);
const { dialog, openDialog, closeDialog, setTitle } = useDialogState();

type MenuTagType = 'warning' | 'primary' | 'success' | 'danger';

const isMenuIconVisible = (icon?: string) => {
  const normalizedIcon = icon?.trim();
  return !!normalizedIcon && normalizedIcon !== '#';
};

const getMenuTypeMeta = (menu: Partial<MenuVO>): { label: string; type: MenuTagType } => {
  if (menu.menuType === MenuTypeEnum.F) {
    return { label: t('common.menuTypeButton'), type: 'warning' };
  }
  if (menu.isFrame === 'Y') {
    return { label: t('common.menuTypeExternal'), type: 'danger' };
  }
  if (menu.menuType === MenuTypeEnum.M) {
    return { label: t('common.menuTypeDirectory'), type: 'primary' };
  }
  return { label: t('common.menuTypeMenu'), type: 'success' };
};

const i18nCompletionText = computed(() => {
  const { filled, total } = getI18nStats();
  if (filled === 0) return t('common.i18nUnconfigured');
  if (filled === total) return `${total}/${total}`;
  return `${filled}/${total}`;
});

const i18nCompletionTagType = computed(() => {
  const { filled, total } = getI18nStats();
  if (filled === total) return 'success';
  if (filled > 0) return 'warning';
  return 'info';
});

/** 获取子菜单列表 */
const getChildrenList = async (row: any, treeNode: unknown, resolve: (data: any[]) => void) => {
  menuExpandMap.value[row.menuId] = { row, treeNode, resolve };
  const children = menuChildrenListMap.value[row.menuId] || [];
  // 菜单的子菜单清空后关闭展开
  if (children.length == 0) {
    // fix: 处理当菜单只有一个子菜单并被删除，需要将父菜单的展开状态关闭
    menuTableRef.value?.updateKeyChildren(row.menuId, children);
  }
  resolve(children);
};

/** 收起菜单时从menuExpandMap中删除对应菜单id数据 */
const expandMenuHandle = async (row: any, expanded: boolean) => {
  if (!expanded) {
    menuExpandMap.value[row.menuId] = undefined;
  }
};

/** 刷新展开的菜单数据 */
const refreshLoadTree = (parentId: string | number) => {
  if (menuExpandMap.value[parentId]) {
    const { row, treeNode, resolve } = menuExpandMap.value[parentId];
    if (row) {
      getChildrenList(row, treeNode, resolve);
      if (row.parentId) {
        const grandpaMenu = menuExpandMap.value[row.parentId];
        getChildrenList(grandpaMenu.row, grandpaMenu.treeNode, grandpaMenu.resolve);
      }
    }
  }
};

/** 重新加载所有已展开的菜单的数据 */
const refreshAllExpandMenuData = () => {
  for (const menuId in menuExpandMap.value) {
    refreshLoadTree(menuId);
  }
};

/** 查询菜单列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await listMenu(queryParams.value);

    const tempMap = {};
    // 存储 父菜单:子菜单列表
    for (const menu of res.data) {
      const parentId = menu.parentId;
      if (!tempMap[parentId]) {
        tempMap[parentId] = [];
      }
      tempMap[parentId].push(menu);
    }
    // 创建一个当前所有 menuId 的 Set，用于查找父菜单是否存在于当前数据中
    const menuIdSet = new Set();
    // 设置有没有子菜单
    for (const menu of res.data) {
      menu['hasChildren'] = tempMap[menu.menuId]?.length > 0;
      menuIdSet.add(menu.menuId);
    }
    menuChildrenListMap.value = tempMap;
    // 找出所有父ID不在当前菜单ID集合中的菜单项，作为新的顶层菜单
    menuList.value = res.data.filter(menu => !menuIdSet.has(menu.parentId));
    // 根据新数据重新加载子菜单数据
    refreshAllExpandMenuData();
  });
};
/** 查询菜单下拉树结构 */
const getTreeselect = async () => {
  menuOptions.value = [];
  const response = await listMenu();
  const menu: MenuOptionsType = { menuId: 0, menuName: t('common.rootCategory'), children: [] };
  menu.children = handleTree<MenuOptionsType>(response.data, 'menuId');
  menuOptions.value.push(menu);
};
/** 取消按钮 */
const cancel = () => {
  reset();
  closeDialog();
};
/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  Object.assign(i18nForm, initI18nForm());
  i18nExpanded.value = false;
  menuFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  getList();
};
const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  afterReset: () => {
    handleQuery();
  }
});
/** 新增按钮操作 */
const handleAdd = (row?: Partial<MenuVO>) => {
  reset();
  getTreeselect();
  row && row.menuId ? (form.value.parentId = row.menuId) : (form.value.parentId = 0);
  setTitle(t('common.dialogAddMenu'));
  openDialog();
};
/** 修改按钮操作 */
const handleUpdate = async (row: Partial<MenuVO>) => {
  reset();
  await getTreeselect();
  if (row.menuId) {
    const { data } = await getMenu(row.menuId);
    form.value = data;
    // 回填国际化数据
    const parsed = parseI18nList(data.i18nList);
    Object.assign(i18nForm, parsed);
    if (getI18nStats().filled > 0) i18nExpanded.value = true;
  }
  setTitle(t('common.dialogEditMenu'));
  openDialog();
};
/** 提交按钮 */
const submitForm = () => {
  menuFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // 从国际化表单构建 i18nList
      form.value.i18nList = buildI18nList(i18nForm);
      form.value.menuId ? await updateMenu(form.value) : await addMenu(form.value);
      modal.msgSuccess(t('common.msgOperateSuccess'));
      closeDialog();
      await getList();
    }
  });
};
/** 删除按钮操作 */
const handleDelete = async (row: Partial<MenuVO>) => {
  await modal.confirm(t('common.msgboxConfirmDeleteMenu', { name: row.menuName }));
  await delMenu(row.menuId);
  await getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};

const deleteLoading = ref<boolean>(false);
const menuTreeRef = ref<ElTreeInstance>();

const {
  dialog: deleteDialog,
  openDialog: openDeleteDialog,
  closeDialog: closeDeleteDialog
} = useDialogState(t('common.dialogCascadeDelete'));

/** 级联删除按钮操作 */
const handleCascadeDelete = () => {
  menuTreeRef.value?.setCheckedKeys([]);
  getTreeselect();
  openDeleteDialog();
};

/** 取消按钮 */
const cancelCascade = () => {
  menuTreeRef.value?.setCheckedKeys([]);
  closeDeleteDialog();
};

/** 删除提交按钮 */
const submitDeleteForm = async () => {
  const menuIds = menuTreeRef.value?.getCheckedKeys();
  if (menuIds.length < 0) {
    modal.msgWarning(t('common.msgboxSelectMenuToDelete'));
    return;
  }

  deleteLoading.value = true;
  await cascadeDelMenu(menuIds).finally(() => (deleteLoading.value = false));
  await getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
  closeDeleteDialog();
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

.data-table {
  .menu-name-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .menu-name-text {
    min-width: 0;
  }
}

.i18n-card {
  margin: 8px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);

  &.is-expanded {
    border-color: var(--el-border-color-light);
  }
}

.i18n-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  transition: background .15s;

  &:hover {
    background: var(--el-fill-color-lighter);
  }
}

.i18n-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.i18n-card-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;

  &.i18n-badge--info {
    background: var(--el-color-info-light-9);
    color: var(--el-color-info);
  }
  &.i18n-badge--warning {
    background: var(--el-color-warning-light-9);
    color: var(--el-color-warning);
  }
  &.i18n-badge--success {
    background: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }
}

.i18n-card-arrow {
  margin-left: auto;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  transition: transform .25s;

  .is-expanded & {
    transform: rotate(90deg);
  }
}

.i18n-card-body {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 14px;
}

.i18n-card-hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.i18n-card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.i18n-card-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.i18n-card-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>

<style scoped lang="scss">
.tree-border {
  height: 300px;
  overflow: auto;
}
</style>
