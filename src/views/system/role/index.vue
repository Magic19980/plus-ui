<template>
  <div class="p-2 system-role-page">
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
          <el-form-item :label="$t('common.roleName')" prop="roleName">
            <el-input
              v-model="queryParams.roleName"
              :placeholder="$t('common.placeholderInputRoleName')"
              clearable
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <el-form-item :label="$t('common.permission')" prop="roleKey">
            <el-input v-model="queryParams.roleKey" :placeholder="$t('common.placeholderInputRoleKey')" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item :label="$t('common.status')" prop="status">
            <el-select v-model="queryParams.status" :placeholder="$t('common.menuStatus')" clearable>
              <el-option v-for="dict in sys_normal_disable" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('common.createTime')" style="width: 308px">
            <el-date-picker
              v-model="dateRange"
              value-format="YYYY-MM-DD HH:mm:ss"
              type="daterange"
              range-separator="-"
              :start-placeholder="$t('common.placeholderStartDate')"
              :end-placeholder="$t('common.placeholderEndDate')"
              :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
            ></el-date-picker>
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
            <span class="panel-kicker">Role Dataset</span>
            <h3>{{ $t('common.sectionRoleList') }}</h3>
            <p>{{ $t("common.recordCountRole", { total }) }}</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['system:role:add']" type="primary" plain icon="Plus" @click="handleAdd()">
              {{ $t('common.btnAdd') }}
            </el-button>
            <el-button
              v-hasPermi="['system:role:edit']"
              type="success"
              plain
              :disabled="single"
              icon="Edit"
              @click="handleUpdate()"
            >
              {{ $t('common.btnEdit') }}
            </el-button>
            <el-button
              v-hasPermi="['system:role:remove']"
              type="danger"
              plain
              :disabled="ids.length === 0"
              icon="Delete"
              @click="handleDelete()"
            >
              {{ $t('common.btnDelete') }}
            </el-button>
            <el-button v-hasPermi="['system:role:export']" type="warning" plain icon="Download" @click="handleExport">
              {{ $t('common.btnExport') }}
            </el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <table-skeleton v-if="loading && !roleList?.length" />
      <el-table
        v-else
        border
        class="data-table"
        v-loading="loading"
        :data="roleList"
        @selection-change="handleSelectionChange"
      >
        <template #empty><empty-state /></template>
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" :label="$t('common.roleId')" prop="roleId" width="120" />
        <el-table-column :label="$t('common.roleName')" prop="roleName" :show-overflow-tooltip="true" width="150" />
        <el-table-column :label="$t('common.permission')" prop="roleKey" :show-overflow-tooltip="true" width="200" />
        <el-table-column :label="$t('common.sort')" prop="roleSort" width="100" />
        <el-table-column :label="$t('common.status')" align="center" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="0"
              inactive-value="1"
              @change="handleStatusChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.createTime')" align="center" prop="createTime">
          <template #default="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>

        <el-table-column fixed="right" :label="$t('common.operation')" width="180">
          <template #default="scope">
            <el-tooltip v-if="scope.row.roleId !== 1761300000000000001" :content="$t('common.tooltipModify')" placement="top">
              <el-button
                v-hasPermi="['system:role:edit']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.roleId !== 1761300000000000001" :content="$t('common.tooltipDelete')" placement="top">
              <el-button
                v-hasPermi="['system:role:remove']"
                link
                type="primary"
                icon="Delete"
                @click="handleDelete(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.roleId !== 1761300000000000001" :content="$t('common.tooltipAssignPermission')" placement="top">
              <el-button
                v-hasPermi="['system:role:edit']"
                link
                type="primary"
                icon="CircleCheck"
                @click="handleDataScope(scope.row)"
              ></el-button>
            </el-tooltip>
            <el-tooltip v-if="scope.row.roleId !== 1761300000000000001" :content="$t('common.tooltipAssignUser')" placement="top">
              <el-button
                v-hasPermi="['system:role:edit']"
                link
                type="primary"
                icon="User"
                @click="handleAuthUser(scope.row)"
              ></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" append-to-body>
      <el-form ref="roleFormRef" :model="form" :rules="rules" label-width="100px" class="dialog-grid-form">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('common.roleName')" prop="roleName">
              <el-input v-model="form.roleName" :placeholder="$t('common.placeholderInputRoleName')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item prop="roleKey">
              <template #label>
                <span>
                  <el-tooltip content="控制器中定义的权限字符，如：@SaCheckRole('admin')" placement="top">
                    <el-icon><question-filled /></el-icon>
                  </el-tooltip>{{ $t('common.permissionLabel') }}</span>
              </template>
              <el-input v-model="form.roleKey" :placeholder="$t('common.placeholderInputRoleKey')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.roleSort')" prop="roleSort">
              <el-input-number v-model="form.roleSort" controls-position="right" :min="0" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.status')">
              <el-radio-group v-model="form.status">
                <el-radio v-for="dict in sys_normal_disable" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('common.remark')">
              <el-input v-model="form.remark" type="textarea" :rows="3" :placeholder="$t('common.placeholderInputContent')"></el-input>
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

    <!-- 分配角色权限对话框 -->
    <el-dialog v-model="openDataScope" :title="dialog.title" width="760px" append-to-body>
      <el-form ref="dataScopeRef" :model="form" label-width="90px" class="dialog-grid-form permission-dialog-form">
        <el-tabs v-model="permissionTab">
          <el-tab-pane :label="$t('common.tabMenuPermission')" name="menu">
            <el-checkbox v-model="menuExpand" @change="handleCheckedTreeExpand($event, 'menu')">{{ $t('common.checkboxExpandCollapse') }}</el-checkbox>
            <el-checkbox v-model="menuNodeAll" @change="handleCheckedTreeNodeAll($event, 'menu')">
              全选/全不选
            </el-checkbox>
            <el-checkbox v-model="form.menuCheckStrictly" @change="handleCheckedTreeConnect($event, 'menu')">
              父子联动
            </el-checkbox>
            <div class="menu-tree-permission-wrap tree-border">
              <div class="menu-tree-header" role="row">
                <span class="menu-tree-header-name">{{ $t('common.menuName') }}</span>
                <span class="menu-tree-header-buttons">{{ $t('common.permissionButton') }}</span>
              </div>
              <el-tree
                ref="menuRef"
                class="menu-tree-panel"
                :data="menuOptions"
                :indent="0"
                show-checkbox
                node-key="id"
                :check-strictly="!form.menuCheckStrictly"
                :empty-text="$t('common.isLoading')"
                :props="{ label: 'label', children: 'children', disabled: 'disabled' }"
                @check="handleMenuTreeCheck"
              >
                <template #default="{ data, node }">
                  <div class="menu-tree-node-row">
                    <span
                      class="menu-tree-node-label"
                      :class="{ 'is-hidden': isMenuPermissionHidden(data), 'is-disabled': data.disabled }"
                      :style="getMenuNodeLabelStyle(node.level)"
                    >
                      <span>{{ data.label }}</span>
                      <el-tooltip v-if="isMenuPermissionHidden(data)" :content="$t('common.tooltipHidden')" placement="top">
                        <el-icon class="menu-visibility-icon"><Hide /></el-icon>
                      </el-tooltip>
                      <el-tooltip v-if="data.disabled" :content="$t('common.tooltipDisabled')" placement="top">
                        <el-icon class="menu-disabled-icon"><CircleCloseFilled /></el-icon>
                      </el-tooltip>
                    </span>
                    <div v-if="data.buttonPermissions?.length" class="menu-tree-node-buttons" @click.stop>
                      <el-checkbox
                        v-for="button in data.buttonPermissions"
                        :key="button.menuId"
                        :model-value="isPermissionChecked(button.menuId)"
                        :disabled="button.disabled"
                        @change="handleButtonPermissionChange(data.id, button.menuId, $event)"
                        @click.stop
                      >
                        <span class="menu-button-label" :class="{ 'is-disabled': button.disabled }">
                          <span>{{ button.menuName }}</span>
                          <el-tooltip v-if="button.disabled" :content="$t('common.tooltipDisabled')" placement="top">
                            <el-icon class="menu-button-disabled-icon"><CircleCloseFilled /></el-icon>
                          </el-tooltip>
                        </span>
                      </el-checkbox>
                    </div>
                  </div>
                </template>
              </el-tree>
            </div>
          </el-tab-pane>
          <el-tab-pane :label="$t('common.dataScope')" name="data">
            <el-form-item :label="$t('common.authScope')">
              <el-select v-model="form.dataScope" @change="dataScopeSelectChange">
                <el-option
                  v-for="item in dataScopeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></el-option>
              </el-select>
            </el-form-item>
            <el-form-item v-show="form.dataScope === '2'" :label="$t('common.dataScope')">
              <el-checkbox v-model="deptExpand" @change="handleCheckedTreeExpand($event, 'dept')">{{ $t('common.checkboxExpandCollapse') }}</el-checkbox>
              <el-checkbox v-model="deptNodeAll" @change="handleCheckedTreeNodeAll($event, 'dept')">
                全选/全不选
              </el-checkbox>
              <el-checkbox v-model="form.deptCheckStrictly" @change="handleCheckedTreeConnect($event, 'dept')">
                父子联动
              </el-checkbox>
              <el-tree
                ref="deptRef"
                class="tree-border"
                :data="deptOptions"
                show-checkbox
                default-expand-all
                node-key="id"
                :check-strictly="!form.deptCheckStrictly"
                :empty-text="$t('common.isLoading')"
                :props="{ label: 'label', children: 'children' }"
              ></el-tree>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitDataScope">{{ $t('common.btnConfirm') }}</el-button>
          <el-button @click="cancelDataScope">{{ $t('common.btnCancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Role" lang="ts">
import { useRouter } from 'vue-router';
import { roleMenuTreeselect } from '@/api/system/menu';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { MenuTreeOption, RoleMenuButtonOption, RoleMenuTree } from '@/api/system/menu/types';
import {
  addRole,
  changeRoleStatus,
  delRole,
  getRole,
  listRole,
  updateRolePermission,
  updateRole,
  deptTreeSelect
} from '@/api/system/role';
import { RoleVO, RoleForm, RoleQuery, DeptTreeOption } from '@/api/system/role/types';
import { MenuTypeEnum } from '@/enums/MenuTypeEnum';
import { useLoading } from '@/hooks/async/useLoading';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';
import { parseTime } from '@/utils/ruoyi';
import EmptyState from '@/components/EmptyState/index.vue';
import TableSkeleton from '@/components/TableSkeleton/index.vue';

const router = useRouter();
const { sys_normal_disable } = toRefs<any>(useDict('sys_normal_disable'));

interface RoleMenuPermissionOption extends MenuTreeOption {
  buttonPermissions: RoleMenuButtonOption[];
  disabled?: boolean;
  children?: RoleMenuPermissionOption[];
}

interface RoleMenuPermissionMeta {
  treeOptions: RoleMenuPermissionOption[];
  buttonIds: Set<string>;
  disabledButtonIds: Set<string>;
  buttonParentMap: Map<string, string>;
  menuAncestorMap: Map<string, Array<string | number>>;
  menuButtonIdsMap: Map<string, Array<string | number>>;
}

const roleList = ref<RoleVO[]>();
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();
const menuPermissionMeta = ref<RoleMenuPermissionMeta>({
  treeOptions: [],
  buttonIds: new Set<string>(),
  disabledButtonIds: new Set<string>(),
  buttonParentMap: new Map<string, string>(),
  menuAncestorMap: new Map<string, Array<string | number>>(),
  menuButtonIdsMap: new Map<string, Array<string | number>>()
});
const menuExpand = ref(false);
const menuNodeAll = ref(false);
const deptExpand = ref(true);
const deptNodeAll = ref(false);
const deptOptions = ref<DeptTreeOption[]>([]);
const openDataScope = ref(false);
/**
 * 权限分配弹窗 Tab：
 * data=数据权限，menu=菜单权限
 */
const permissionTab = ref<'data' | 'menu'>('menu');

/** 数据范围选项*/
const dataScopeOptions = ref([
  { value: '1', label: t('common.dataScopeAll') },
  { value: '2', label: t('common.dataScopeCustom') },
  { value: '3', label: t('common.dataScopeDept') },
  { value: '4', label: t('common.dataScopeDeptBelow') },
  { value: '5', label: t('common.dataScopeSelf') },
  { value: '6', label: t('common.dataScopeDeptOrSelf') }
]);

const queryFormRef = ref<ElFormInstance>();
const roleFormRef = ref<ElFormInstance>();
const dataScopeRef = ref<ElFormInstance>();
const menuRef = ref<ElTreeInstance>();
const deptRef = ref<ElTreeInstance>();
const selectedMenuPermissionIds = ref<Array<string | number>>([]);
const selectedButtonPermissionIds = ref<Array<string | number>>([]);
const lastCheckedMenuKeys = ref<string[]>([]);
const syncingMenuTree = ref(false);

const menuOptions = computed(() => menuPermissionMeta.value.treeOptions);

const isButtonPermission = (permissionId: string | number) => {
  return menuPermissionMeta.value.buttonIds.has(String(permissionId));
};

const isButtonPermissionDisabled = (permissionId: string | number) => {
  return menuPermissionMeta.value.disabledButtonIds.has(String(permissionId));
};

const isPermissionChecked = (permissionId: string | number) => {
  return selectedButtonPermissionIds.value.some(menuId => String(menuId) === String(permissionId));
};

const isMenuPermissionHidden = (menu: MenuTreeOption) => menu.visible === '1';

/**
 * 基于节点层级给菜单名称增加缩进，确保按钮列始终固定对齐。
 */
const getMenuNodeLabelStyle = (level: number) => {
  return {
    paddingLeft: `${Math.max(0, level - 1) * 18}px`
  };
};

const getCheckedMenuKeys = () => {
  const checkedKeys = (menuRef.value?.getCheckedKeys(false) ?? []) as Array<string | number>;
  const halfCheckedKeys = (menuRef.value?.getHalfCheckedKeys() ?? []) as Array<string | number>;
  return {
    checkedKeys,
    halfCheckedKeys,
    allCheckedKeys: [...halfCheckedKeys, ...checkedKeys]
  };
};

const createEmptyMenuPermissionMeta = (): RoleMenuPermissionMeta => ({
  treeOptions: [],
  buttonIds: new Set<string>(),
  disabledButtonIds: new Set<string>(),
  buttonParentMap: new Map<string, string>(),
  menuAncestorMap: new Map<string, Array<string | number>>(),
  menuButtonIdsMap: new Map<string, Array<string | number>>()
});

const isMenuPermissionDisabledByStatus = (menu: MenuTreeOption) => menu.status === '1';

const buildRoleMenuPermissionOptions = (
  menuTree: MenuTreeOption[],
  disabledButtonIds: Set<string>,
  buttonIds: Set<string>,
  buttonParentMap: Map<string, string>,
  ancestorDirectoryDisabled = false
): RoleMenuPermissionOption[] => {
  return menuTree.reduce<RoleMenuPermissionOption[]>((options, menu) => {
    if (menu.menuType === MenuTypeEnum.F) {
      return options;
    }

    const selfDisabled = isMenuPermissionDisabledByStatus(menu);
    const nextDirectoryDisabled = ancestorDirectoryDisabled || (menu.menuType === MenuTypeEnum.M && selfDisabled);
    const nodeDisabled = ancestorDirectoryDisabled || selfDisabled;
    const buttonPermissions =
      menu.children
        ?.filter(child => child.menuType === MenuTypeEnum.F)
        .map(button => {
          const buttonDisabled = nodeDisabled || isMenuPermissionDisabledByStatus(button);
          buttonIds.add(String(button.id));
          buttonParentMap.set(String(button.id), String(menu.id));
          if (buttonDisabled) {
            disabledButtonIds.add(String(button.id));
          }
          return {
            menuId: button.id,
            menuName: button.label,
            parentId: button.parentId,
            status: button.status,
            disabled: buttonDisabled
          };
        }) ?? [];
    const children = menu.children?.length
      ? buildRoleMenuPermissionOptions(
          menu.children,
          disabledButtonIds,
          buttonIds,
          buttonParentMap,
          nextDirectoryDisabled
        )
      : [];
    options.push({
      ...menu,
      disabled: nodeDisabled,
      buttonPermissions,
      children
    });
    return options;
  }, []);
};

const buildMenuPermissionMeta = (menuTree: MenuTreeOption[]): RoleMenuPermissionMeta => {
  const buttonIds = new Set<string>();
  const disabledButtonIds = new Set<string>();
  const buttonParentMap = new Map<string, string>();
  const treeOptions = buildRoleMenuPermissionOptions(menuTree, disabledButtonIds, buttonIds, buttonParentMap);
  const menuAncestorMap = new Map<string, Array<string | number>>();
  const menuButtonIdsMap = new Map<string, Array<string | number>>();

  const collectMenuMeta = (nodes: RoleMenuPermissionOption[], ancestors: Array<string | number> = []) => {
    return nodes.reduce<Array<string | number>>((permissionIds, node) => {
      menuAncestorMap.set(String(node.id), ancestors);
      const childButtonIds = node.children?.length ? collectMenuMeta(node.children, [...ancestors, node.id]) : [];
      const ownButtonIds = node.buttonPermissions.map(button => button.menuId);
      const currentButtonIds = [...ownButtonIds, ...childButtonIds];
      menuButtonIdsMap.set(String(node.id), currentButtonIds);
      permissionIds.push(...currentButtonIds);
      return permissionIds;
    }, []);
  };

  collectMenuMeta(treeOptions);
  return {
    treeOptions,
    buttonIds,
    disabledButtonIds,
    buttonParentMap,
    menuAncestorMap,
    menuButtonIdsMap
  };
};

const collectMenuNodeIds = (
  nodes: RoleMenuPermissionOption[] = menuOptions.value,
  includeDisabled = true
): Array<string | number> => {
  return nodes.reduce<Array<string | number>>((menuIds, node) => {
    if (includeDisabled || !node.disabled) {
      menuIds.push(node.id);
    }
    if (node.children?.length) {
      menuIds.push(...collectMenuNodeIds(node.children, includeDisabled));
    }
    return menuIds;
  }, []);
};

const collectButtonPermissionIds = (includeDisabled = true) => {
  const buttonIds = new Set<string | number>();
  menuPermissionMeta.value.menuButtonIdsMap.forEach(ids => {
    ids.forEach(id => {
      if (includeDisabled || !isButtonPermissionDisabled(id)) {
        buttonIds.add(id);
      }
    });
  });
  return [...buttonIds];
};

const getSelectedButtonPermissionIds = () => {
  return selectedButtonPermissionIds.value;
};

const getSelectedMenuPermissionIds = () => {
  return selectedMenuPermissionIds.value;
};

const normalizePermissionIds = (permissionIds: Iterable<string | number>) => {
  const normalizedIds = new Map<string, string | number>();
  for (const permissionId of permissionIds) {
    normalizedIds.set(String(permissionId), permissionId);
  }
  return [...normalizedIds.values()];
};

const getPermissionStateIds = () => {
  return normalizePermissionIds([...getSelectedMenuPermissionIds(), ...getSelectedButtonPermissionIds()]);
};

const getDerivedMenuIdsFromButtons = (buttonIds: Iterable<string | number> = getSelectedButtonPermissionIds()) => {
  if (!form.value.menuCheckStrictly) {
    return [];
  }

  const derivedMenuIds = new Map<string, string | number>();
  for (const buttonId of buttonIds) {
    const parentMenuId = menuPermissionMeta.value.buttonParentMap.get(String(buttonId));
    if (!parentMenuId) {
      continue;
    }
    derivedMenuIds.set(String(parentMenuId), parentMenuId);
    menuPermissionMeta.value.menuAncestorMap.get(parentMenuId)?.forEach(ancestorId => {
      derivedMenuIds.set(String(ancestorId), ancestorId);
    });
  }
  return [...derivedMenuIds.values()];
};

const setSelectedButtonPermissionIds = (permissionIds: Iterable<string | number>) => {
  selectedButtonPermissionIds.value = normalizePermissionIds(permissionIds);
};

const setSelectedMenuPermissionIds = (permissionIds: Iterable<string | number>) => {
  selectedMenuPermissionIds.value = normalizePermissionIds(permissionIds);
};

const syncFormMenuPermissionIds = () => {
  form.value.menuIds = getMenuAllCheckedKeys();
};

const initPermissionState = (permissionIds: Array<string | number>) => {
  setSelectedMenuPermissionIds(permissionIds.filter(permissionId => !isButtonPermission(permissionId)));
  setSelectedButtonPermissionIds(permissionIds.filter(permissionId => isButtonPermission(permissionId)));
};

const updateMenuCheckAllState = () => {
  const checkedMenuIds = new Set(getCheckedMenuKeys().checkedKeys.map(menuId => String(menuId)));
  const allMenuIds = collectMenuNodeIds(menuOptions.value, false);
  const allButtonIds = collectButtonPermissionIds(false);
  menuNodeAll.value =
    allMenuIds.length > 0 &&
    allMenuIds.every(menuId => checkedMenuIds.has(String(menuId))) &&
    allButtonIds.every(buttonId =>
      selectedButtonPermissionIds.value.some(permissionId => String(permissionId) === String(buttonId))
    );
};

const updateMenuPermissionOptions = (menuTree: MenuTreeOption[]) => {
  menuPermissionMeta.value = buildMenuPermissionMeta(menuTree);
};

const getDisplayCheckedMenuKeys = (checkedKeys: Array<string | number>) => {
  const displayMenuKeys = new Set<string | number>();

  checkedKeys.forEach(key => {
    if (form.value.menuCheckStrictly && isButtonPermission(key)) {
      const parentMenuId = menuPermissionMeta.value.buttonParentMap.get(String(key));
      if (parentMenuId) {
        displayMenuKeys.add(parentMenuId);
      }
      return;
    }
    displayMenuKeys.add(key);
  });

  return [...displayMenuKeys];
};

const applyMenuTreeCheckedState = (checkedKeys: Array<string | number>) => {
  const tree = menuRef.value;
  if (!tree) {
    return;
  }

  syncingMenuTree.value = true;
  tree.setCheckedKeys([]);
  getDisplayCheckedMenuKeys(checkedKeys).forEach(key => {
    tree.setChecked(key, true, false);
  });
  syncingMenuTree.value = false;
};

const buildCheckedButtonPermissionIds = (
  selectedButtonIds: Iterable<string | number>,
  newlyCheckedMenuIds: Array<string | number> = []
) => {
  const { allCheckedKeys } = getCheckedMenuKeys();
  const activeMenuIds = new Set(allCheckedKeys.map(key => String(key)));
  const nextButtonIds = new Set<string | number>();

  for (const buttonId of selectedButtonIds) {
    if (!form.value.menuCheckStrictly) {
      nextButtonIds.add(buttonId);
      continue;
    }
    const parentMenuId = menuPermissionMeta.value.buttonParentMap.get(String(buttonId));
    if (parentMenuId && activeMenuIds.has(parentMenuId)) {
      nextButtonIds.add(buttonId);
    }
  }
  if (form.value.menuCheckStrictly) {
    newlyCheckedMenuIds.forEach(menuId => {
      menuPermissionMeta.value.menuButtonIdsMap.get(String(menuId))?.forEach(buttonId => nextButtonIds.add(buttonId));
    });
  }

  return [...nextButtonIds];
};

const syncButtonPermissionStateFromTree = () => {
  const previousCheckedMenuIds = new Set(lastCheckedMenuKeys.value);
  const checkedMenuIds = getCheckedMenuKeys().checkedKeys;
  const newlyCheckedMenuIds = checkedMenuIds.filter(menuId => !previousCheckedMenuIds.has(String(menuId)));
  const selectedButtonIds = getSelectedButtonPermissionIds();

  setSelectedButtonPermissionIds(buildCheckedButtonPermissionIds(selectedButtonIds, newlyCheckedMenuIds));
  updateMenuCheckAllState();
  lastCheckedMenuKeys.value = checkedMenuIds.map(key => String(key));
};

const refreshMenuTreeCheckedState = (checkedKeys: Array<string | number>) => {
  applyMenuTreeCheckedState(checkedKeys);
  updateMenuCheckAllState();
  lastCheckedMenuKeys.value = getCheckedMenuKeys().checkedKeys.map(key => String(key));
};

const handleMenuTreeCheck = () => {
  if (syncingMenuTree.value) {
    return;
  }

  const previousEffectiveMenuIds = new Set([
    ...getSelectedMenuPermissionIds().map(menuId => String(menuId)),
    ...getDerivedMenuIdsFromButtons().map(menuId => String(menuId))
  ]);
  const currentMenuIds = getCheckedMenuKeys().allCheckedKeys;
  const currentMenuIdSet = new Set(currentMenuIds.map(menuId => String(menuId)));
  const nextManualMenuIds = new Set(getSelectedMenuPermissionIds().map(menuId => String(menuId)));

  currentMenuIds.forEach(menuId => {
    const normalizedMenuId = String(menuId);
    if (!previousEffectiveMenuIds.has(normalizedMenuId)) {
      nextManualMenuIds.add(normalizedMenuId);
    }
  });

  previousEffectiveMenuIds.forEach(menuId => {
    if (!currentMenuIdSet.has(menuId)) {
      nextManualMenuIds.delete(menuId);
    }
  });

  setSelectedMenuPermissionIds(currentMenuIds.filter(menuId => nextManualMenuIds.has(String(menuId))));
  syncButtonPermissionStateFromTree();
};

const handleButtonPermissionChange = (
  _parentMenuId: string | number,
  buttonMenuId: string | number,
  checked: string | number | boolean
) => {
  if (isButtonPermissionDisabled(buttonMenuId)) {
    return;
  }

  const selectedButtonIds = new Set(getSelectedButtonPermissionIds());

  if (checked) {
    selectedButtonIds.add(buttonMenuId);
  } else {
    selectedButtonIds.delete(buttonMenuId);
  }

  setSelectedButtonPermissionIds(selectedButtonIds);
  refreshMenuTreeCheckedState(getPermissionStateIds());
};

const initForm: RoleForm = {
  roleId: undefined,
  roleSort: 1,
  status: '0',
  roleName: '',
  roleKey: '',
  menuCheckStrictly: true,
  deptCheckStrictly: true,
  remark: '',
  dataScope: '1',
  menuIds: [],
  deptIds: []
};

const data = reactive<PageData<RoleForm, RoleQuery>>({
  form: { ...initForm },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    roleName: '',
    roleKey: '',
    status: ''
  },
  rules: {
    roleName: [{ required: true, message: t('common.validationRoleNameRequired'), trigger: 'blur' }],
    roleKey: [{ required: true, message: t('common.validationRoleKeyRequired'), trigger: 'blur' }],
    roleSort: [{ required: true, message: t('common.validationRoleSortRequired'), trigger: 'blur' }]
  }
});
const { form, queryParams, rules } = toRefs(data);
const { ids, single, handleSelectionChange } = useTableSelection<RoleVO>(item => item.roleId);
const { dialog, openDialog, closeDialog, setTitle } = useDialogState();

/**
 * 查询角色列表
 */
const getList = () => {
  withLoading(async () => {
    const res = await listRole(applyDateRange(queryParams.value));
    roleList.value = res.data?.rows;
    total.value = res.data?.total;
  });
};

/**
 * 搜索按钮操作
 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  resetExtras: () => {
    resetDateRange();
  },
  afterReset: () => {
    handleQuery();
  }
});
/**删除按钮操作 */
const handleDelete = async (row?: Partial<RoleVO>) => {
  const roleids = row?.roleId || ids.value;
  await modal.confirm(t('common.msgboxConfirmDeleteRole', { ids: roleids }));
  await delRole(roleids);
  getList();
  modal.msgSuccess(t('common.msgDeleteSuccess'));
};

/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'system/role/export',
    {
      ...queryParams.value
    },
    `role_${new Date().getTime()}.xlsx`
  );
};
/** 角色状态修改 */
const handleStatusChange = async (row: Partial<RoleVO>) => {
  const text = row.status === '0' ? t('common.tagEnabled') : t('common.tagDisabled');
  try {
    await modal.confirm(t('common.msgboxConfirmStatusChange', { action: text, name: row.roleName }));
    await changeRoleStatus(row.roleId, row.status);
    modal.msgSuccess(t('common.msgStatusChangeSuccess'));
  } catch {
    row.status = row.status === '0' ? '1' : '0';
  }
};

/** 分配用户 */
const handleAuthUser = (row: Partial<RoleVO>) => {
  router.push('/system/role-auth/user/' + row.roleId);
};

/** 所有部门节点数据 */
const getDeptAllCheckedKeys = (): any => {
  // 目前被选中的部门节点
  const checkedKeys = deptRef.value?.getCheckedKeys();
  // 半选中的部门节点
  const halfCheckedKeys = deptRef.value?.getHalfCheckedKeys();
  if (halfCheckedKeys) {
    checkedKeys?.unshift(...halfCheckedKeys);
  }
  return checkedKeys;
};
/** 重置新增的表单以及其他数据  */
const reset = () => {
  menuRef.value?.setCheckedKeys([]);
  menuPermissionMeta.value = createEmptyMenuPermissionMeta();
  setSelectedMenuPermissionIds([]);
  setSelectedButtonPermissionIds([]);
  lastCheckedMenuKeys.value = [];
  syncingMenuTree.value = false;
  menuExpand.value = false;
  menuNodeAll.value = false;
  deptExpand.value = true;
  deptNodeAll.value = false;
  form.value = { ...initForm };
  roleFormRef.value?.resetFields();
};

/** 添加角色 */
const handleAdd = () => {
  reset();
  setTitle(t('common.dialogAddRole'));
  openDialog();
};
/** 修改角色 */
const handleUpdate = async (row?: Partial<RoleVO>) => {
  reset();
  const roleId = row?.roleId || ids.value[0];
  const { data } = await getRole(roleId);
  Object.assign(form.value, data);
  form.value.roleSort = Number(form.value.roleSort);
  // 菜单分配已迁移到“分配权限”弹窗，这里预置已有菜单，避免基础信息保存时误清空菜单权限。
  const { checkedKeys } = await getRoleMenuTreeselect(roleId);
  form.value.menuIds = checkedKeys;
  setTitle(t('common.dialogEditRole'));
  openDialog();
};
/** 根据角色ID查询菜单树结构 */
const getRoleMenuTreeselect = (roleId: string | number) => {
  return roleMenuTreeselect(roleId).then((res): RoleMenuTree => {
    updateMenuPermissionOptions(res.data.menus);
    return res.data;
  });
};
/** 根据角色ID查询部门树结构 */
const getRoleDeptTreeSelect = async (roleId: string | number) => {
  const res = await deptTreeSelect(roleId);
  deptOptions.value = res.data.depts;
  return res.data;
};
/** 树权限（展开/折叠）*/
const handleCheckedTreeExpand = (value: unknown, type: string) => {
  const expanded = Boolean(value);
  if (type == 'menu') {
    const nodeMap = menuRef.value?.store?.nodesMap as Record<string, { expanded: boolean }> | undefined;
    if (nodeMap) {
      Object.keys(nodeMap).forEach(nodeId => {
        nodeMap[nodeId].expanded = expanded;
      });
    }
  } else if (type == 'dept') {
    const treeList = deptOptions.value;
    for (let i = 0; i < treeList.length; i++) {
      if (deptRef.value) {
        deptRef.value.store.nodesMap[treeList[i].id].expanded = expanded;
      }
    }
  }
};
/** 树权限（全选/全不选） */
const handleCheckedTreeNodeAll = (value: any, type: string) => {
  if (type == 'menu') {
    setSelectedMenuPermissionIds(value ? collectMenuNodeIds(menuOptions.value, false) : []);
    setSelectedButtonPermissionIds(value ? collectButtonPermissionIds(false) : []);
    refreshMenuTreeCheckedState(getPermissionStateIds());
  } else if (type == 'dept') {
    deptRef.value?.setCheckedNodes(value ? (deptOptions.value as any) : []);
  }
};
/** 树权限（父子联动） */
const handleCheckedTreeConnect = async (value: any, type: string) => {
  if (type == 'menu') {
    form.value.menuCheckStrictly = value;
    await nextTick();
    refreshMenuTreeCheckedState(getPermissionStateIds());
  } else if (type == 'dept') {
    form.value.deptCheckStrictly = value;
  }
};
/** 所有菜单节点数据 */
const getMenuAllCheckedKeys = (): any => {
  return normalizePermissionIds([...getCheckedMenuKeys().allCheckedKeys, ...getSelectedButtonPermissionIds()]);
};
/** 提交按钮 */
const submitForm = () => {
  roleFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      syncFormMenuPermissionIds();
      form.value.roleId ? await updateRole(form.value) : await addRole(form.value);
      modal.msgSuccess(t('common.msgOperateSuccess'));
      closeDialog();
      getList();
    }
  });
};
/** 取消按钮 */
const cancel = () => {
  reset();
  closeDialog();
};
/** 选择角色权限范围触发 */
const dataScopeSelectChange = (value: string) => {
  if (value !== '2') {
    deptRef.value?.setCheckedKeys([]);
  }
};
/** 分配数据权限操作 */
const handleDataScope = async (row: Partial<RoleVO>) => {
  permissionTab.value = 'menu';
  const response = await getRole(row.roleId);
  Object.assign(form.value, response.data);
  const menuRes = await getRoleMenuTreeselect(row.roleId);
  const res = await getRoleDeptTreeSelect(row.roleId);
  openDataScope.value = true;
  setTitle(t('common.dialogAssignPermission'));
  await nextTick(() => {
    initPermissionState(menuRes.checkedKeys);
    syncFormMenuPermissionIds();
    refreshMenuTreeCheckedState(getPermissionStateIds());
    deptRef.value?.setCheckedKeys(res.checkedKeys);
    handleCheckedTreeExpand(menuExpand.value, 'menu');
    handleCheckedTreeExpand(deptExpand.value, 'dept');
  });
};
/** 提交按钮（数据权限） */
const submitDataScope = async () => {
  if (form.value.roleId) {
    // 权限信息统一提交：菜单权限 + 数据权限。
    syncFormMenuPermissionIds();
    form.value.deptIds = getDeptAllCheckedKeys();
    await updateRolePermission(form.value);
    modal.msgSuccess(t('common.msgEditSuccess'));
    openDataScope.value = false;
    getList();
  }
};
/** 取消按钮（数据权限）*/
const cancelDataScope = () => {
  dataScopeRef.value?.resetFields();
  form.value = { ...initForm };
  permissionTab.value = 'menu';
  menuRef.value?.setCheckedKeys([]);
  menuPermissionMeta.value = createEmptyMenuPermissionMeta();
  setSelectedMenuPermissionIds([]);
  setSelectedButtonPermissionIds([]);
  lastCheckedMenuKeys.value = [];
  syncingMenuTree.value = false;
  menuExpand.value = false;
  menuNodeAll.value = false;
  deptExpand.value = true;
  deptNodeAll.value = false;
  openDataScope.value = false;
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;

.dialog-grid-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-input-number.w-full) {
    width: 100%;
  }
}

.permission-dialog-form {
  --menu-name-col-width: 220px;
  --menu-tree-leading-offset: 44px;

  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }

  :deep(.tree-border) {
    max-height: 320px;
    padding: 8px;
    border-radius: 6px;
    overflow: auto;
  }

  /* 菜单权限：表头 + 树同一容器，滚动只发生在树区域 */
  .menu-tree-permission-wrap.tree-border {
    display: flex;
    flex-direction: column;
    max-height: 320px;
    margin-top: 8px;
    padding: 0;
    overflow: hidden;
  }

  .menu-tree-permission-wrap .menu-tree-panel {
    flex: 1 1 auto;
    min-height: 0;
    padding: 8px;
    overflow: auto;
  }

  :deep(.menu-tree-panel .el-tree-node__content) {
    min-height: 28px;
    height: auto;
    align-items: flex-start;
    padding-top: 3px;
    padding-bottom: 3px;
  }

  .menu-tree-permission-wrap .menu-tree-header {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    gap: 12px;
    padding: 8px 12px 8px calc(var(--menu-tree-leading-offset) + 8px);
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .menu-tree-permission-wrap .menu-tree-header-name {
    width: var(--menu-name-col-width);
    flex: none;
  }

  .menu-tree-permission-wrap .menu-tree-header-buttons {
    flex: 1;
    min-width: 0;
  }

  :deep(.menu-tree-node-row) {
    width: 100%;
    min-height: 22px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  :deep(.menu-tree-node-label) {
    width: var(--menu-name-col-width);
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    line-height: 24px;
    color: var(--el-text-color-primary);
    box-sizing: border-box;
  }

  :deep(.menu-tree-node-label.is-hidden:not(.is-disabled)) {
    color: var(--el-text-color-secondary);
  }

  :deep(.menu-tree-node-label.is-disabled) {
    color: var(--el-color-danger);
  }

  :deep(.menu-visibility-icon) {
    flex: 0 0 auto;
    margin-top: 1px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  :deep(.menu-disabled-icon) {
    flex: 0 0 auto;
    margin-top: 1px;
    font-size: 14px;
    color: var(--el-color-danger);
  }

  :deep(.menu-tree-node-buttons) {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
  }

  :deep(.menu-button-label) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  :deep(.menu-button-label.is-disabled) {
    color: var(--el-color-danger);
  }

  :deep(.menu-button-disabled-icon) {
    flex: 0 0 auto;
    margin-top: 1px;
    font-size: 14px;
    color: var(--el-color-danger);
  }

  @media (max-width: 900px) {
    --menu-name-col-width: 160px;
  }
}
</style>
