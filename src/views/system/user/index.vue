<template>
  <div class="p-2 system-user-page">
    <el-row :gutter="20" class="content-grid">
      <!-- 部门树 -->
      <tree-panel
        ref="treePanelRef"
        v-model:collapsed="treeCollapsed"
        :title="$t('common.dialogDeptStructure')"
        :placeholder="$t('common.placeholderInputDeptName')"
        :data="deptOptions"
        :expanded-span="5"
        @node-click="handleNodeClick"
      />
      <el-col
        :lg="treeCollapsed ? 23 : 19"
        :xs="24"
        class="tree-content-col content-main"
        :class="{ 'is-tree-collapsed': treeCollapsed }"
      >
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
              <el-form-item :label="$t('common.userName')" prop="userName">
                <el-input
                  v-model="queryParams.userName"
                  :placeholder="$t('common.placeholderInputUserName')"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
              <el-form-item :label="$t('common.nickName')" prop="nickName">
                <el-input
                  v-model="queryParams.nickName"
                  :placeholder="$t('common.placeholderInputNickName')"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>
              <el-form-item :label="$t('common.phoneNumber')" prop="phoneNumber">
                <el-input
                  v-model="queryParams.phoneNumber"
                  :placeholder="$t('common.placeholderInputPhone')"
                  clearable
                  @keyup.enter="handleQuery"
                />
              </el-form-item>

              <el-form-item :label="$t('common.status')" prop="status">
                <el-select v-model="queryParams.status" :placeholder="$t('common.userStatus')" clearable>
                  <el-option
                    v-for="dict in sys_normal_disable"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
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
            <search-filter-summary
              :show-search="showSearch"
              :active-filters="activeFilters"
              @clear-all="handleQuery"
            />
          </el-card>
        </div>

        <el-card shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <span class="panel-kicker">User Dataset</span>
                <h3>{{ $t('common.sectionUserList') }}</h3>
                <p>{{ $t("common.recordCount", { total }) }}</p>
              </div>
              <div class="toolbar-actions">
                <el-button v-has-permi="['system:user:add']" type="primary" plain icon="Plus" @click="handleAdd()">
                  {{ $t('common.btnAdd') }}
                </el-button>
                <el-button
                  v-has-permi="['system:user:edit']"
                  type="success"
                  plain
                  :disabled="single"
                  icon="Edit"
                  @click="handleUpdate()"
                >
                  {{ $t('common.btnEdit') }}
                </el-button>
                <el-button
                  v-has-permi="['system:user:remove']"
                  type="danger"
                  plain
                  :disabled="multiple"
                  icon="Delete"
                  @click="handleDelete()"
                >
                  {{ $t('common.btnDelete') }}
                </el-button>
                <el-button
                  v-hasPermi="['system:user:edit']"
                  type="warning"
                  plain
                  icon="Unlock"
                  :disabled="single"
                  @click="handleUnlock()"
                >
                  {{ $t('common.btnUnlock') }}
                </el-button>
                <el-dropdown class="mt-[1px]">
                  <el-button plain type="info">
                    {{ $t('common.btnMore') }}
                    <el-icon class="el-icon--right"><arrow-down /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item icon="Download" @click="importTemplate">{{ $t('common.btnDownloadTemplate') }}</el-dropdown-item>
                      <!-- 注意 由于el-dropdown-item标签是延迟加载的 所以v-has-permi自定义标签不生效 需要使用v-if调用方法执行 -->
                      <el-dropdown-item v-if="checkPermi(['system:user:import'])" icon="Top" @click="handleImport">
                        {{ $t('common.btnImportData') }}
                      </el-dropdown-item>
                      <el-dropdown-item v-if="checkPermi(['system:user:export'])" icon="Download" @click="handleExport">
                        {{ $t('common.btnExportData') }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <right-toolbar
                  v-model:show-search="showSearch"
                  :columns="columns"
                  :search="false"
                  storage-key="sys_user_column_visible"
                  @query-table="getList"
                ></right-toolbar>
              </div>
            </div>
          </template>

          <table-skeleton v-if="loading && !userList?.length" />
          <el-table
            v-else
            v-loading="loading"
            border
            class="data-table"
            :data="userList"
            @selection-change="handleSelectionChange"
          >
            <template #empty><empty-state /></template>
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column v-if="columns[0].visible" key="userId" :label="$t('common.userId')" align="center" prop="userId" />
            <el-table-column
              v-if="columns[1].visible"
              key="userName"
              :label="$t('common.userName')"
              align="center"
              :show-overflow-tooltip="true"
            >
              <template #default="scope">
                <el-link type="primary" underline="never" @click="handleViewDetail(scope.row)">
                  {{ scope.row.userName }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column
              v-if="columns[2].visible"
              key="nickName"
              :label="$t('common.nickName')"
              align="center"
              prop="nickName"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              v-if="columns[3].visible"
              key="employeeNo"
              :label="$t('common.employeeNo')"
              align="center"
              prop="employeeNo"
              width="130"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              v-if="columns[4].visible"
              key="deptName"
              :label="$t('common.dept')"
              align="center"
              prop="deptName"
              :show-overflow-tooltip="true"
            />
            <el-table-column
              v-if="columns[5].visible"
              key="phoneNumber"
              :label="$t('common.phoneNumber')"
              align="center"
              prop="phoneNumber"
              width="120"
            />
            <el-table-column v-if="columns[6].visible" key="status" :label="$t('common.status')" align="center">
              <template #default="scope">
                <el-switch
                  v-model="scope.row.status"
                  active-value="0"
                  inactive-value="1"
                  @change="handleStatusChange(scope.row)"
                ></el-switch>
              </template>
            </el-table-column>

            <el-table-column v-if="columns[7].visible" :label="$t('common.createTime')" align="center" prop="createTime" width="160">
              <template #default="scope">
                <span>{{ scope.row.createTime }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t('common.operation')" fixed="right" width="180" class-name="small-padding fixed-width">
              <template #default="scope">
                <el-tooltip v-if="scope.row.userId !== '1761100000000000001'" :content="$t('common.tooltipModify')" placement="top">
                  <el-button
                    v-hasPermi="['system:user:edit']"
                    link
                    type="primary"
                    icon="Edit"
                    @click="handleUpdate(scope.row)"
                  ></el-button>
                </el-tooltip>
                <el-tooltip v-if="scope.row.userId !== '1761100000000000001'" :content="$t('common.tooltipDelete')" placement="top">
                  <el-button
                    v-hasPermi="['system:user:remove']"
                    link
                    type="primary"
                    icon="Delete"
                    @click="handleDelete(scope.row)"
                  ></el-button>
                </el-tooltip>

                <el-tooltip v-if="scope.row.userId !== '1761100000000000001'" :content="$t('common.tooltipResetPwd')" placement="top">
                  <el-button
                    v-hasPermi="['system:user:resetPwd']"
                    link
                    type="primary"
                    icon="Key"
                    @click="handleResetPwd(scope.row)"
                  ></el-button>
                </el-tooltip>

                <el-tooltip v-if="scope.row.userId !== '1761100000000000001'" :content="$t('common.tooltipAssignRole')" placement="top">
                  <el-button
                    v-hasPermi="['system:user:edit']"
                    link
                    type="primary"
                    icon="CircleCheck"
                    @click="handleAuthRole(scope.row)"
                  ></el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="total > 0"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            :total="total"
            @pagination="getList"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加或修改用户配置对话框 -->
    <el-dialog
      ref="formDialogRef"
      v-model="dialog.visible"
      :title="dialog.title"
      width="680px"
      class="user-form-dialog"
      append-to-body
      @close="closeDialog"
    >
      <el-form
        ref="userFormRef"
        v-loading="userDialogLoading"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-row>
          <el-col :span="12">
            <el-form-item :label="$t('common.nickName')" prop="nickName">
              <el-input v-model="form.nickName" :placeholder="$t('common.placeholderInputNickName')" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.userId == null || form.userId != useUserStore().userId">
            <el-form-item :label="$t('common.dept')" prop="deptId">
              <el-popover
                v-model:visible="deptPickerVisible"
                placement="bottom-start"
                :width="560"
                trigger="click"
                :persistent="false"
                popper-class="user-dept-tree-popper"
                @show="handleDeptPickerShow"
              >
                <template #reference>
                  <el-input
                    :model-value="selectedDeptPath"
                    :placeholder="$t('common.placeholderSelectDept')"
                    readonly
                    clearable
                    class="dept-tree-input"
                    @clear="handleDeptClear"
                  >
                    <template #suffix>
                      <el-icon><ArrowDown /></el-icon>
                    </template>
                  </el-input>
                </template>
                <div class="dept-picker-panel">
                  <el-input
                    v-model="deptSearchKeyword"
                    :placeholder="$t('common.placeholderInputDeptName')"
                    clearable
                    class="dept-picker-search"
                  />
                  <el-tree-v2
                    ref="deptTreeRef"
                    :data="deptTreeVisibleOptions"
                    :props="deptTreeProps"
                    :height="340"
                    :item-size="36"
                    :default-expanded-keys="deptTreeExpandedKeys"
                    :current-node-key="form.deptId"
                    highlight-current
                    :expand-on-click-node="false"
                    @node-click="handleDeptTreeNodeClick"
                  >
                    <template #default="{ data }">
                      <div class="dept-tree-node" :title="data.path">
                        <span class="dept-tree-node__label">{{ data.label }}</span>
                      </div>
                    </template>
                  </el-tree-v2>
                </div>
              </el-popover>
              <div v-if="selectedDeptPath" class="dept-selected-summary">
                <span class="dept-selected-summary__label">{{ $t('common.selectedDept') }}</span>
                <span class="dept-selected-summary__path">{{ selectedDeptPath }}</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item :label="$t('common.employeeNo')" prop="employeeNo">
              <el-input v-model="form.employeeNo" placeholder="请输入工号" maxlength="64" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item :label="$t('common.phoneNumber')" prop="phoneNumber">
              <el-input v-model="form.phoneNumber" :placeholder="$t('common.placeholderInputPhone')" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('common.email')" prop="email">
              <el-input v-model="form.email" :placeholder="$t('common.placeholderInputEmail')" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" :label="$t('common.userName')" prop="userName">
              <el-input v-model="form.userName" :placeholder="$t('common.placeholderInputUserName')" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" :label="$t('common.userPassword')" prop="password">
              <el-input
                v-model="form.password"
                :placeholder="$t('common.placeholderInputUserPwd')"
                type="password"
                maxlength="20"
                show-password
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item :label="$t('common.gender')">
              <el-select v-model="form.gender" :placeholder="$t('common.placeholderSelect')">
                <el-option
                  v-for="dict in sys_user_gender"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
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
        </el-row>
        <el-row>
          <el-col :span="12" v-if="form.userId == null || form.userId != useUserStore().userId">
            <el-form-item :label="$t('common.post')">
              <el-select v-model="form.postIds" multiple :placeholder="$t('common.placeholderSelect')">
                <el-option
                  v-for="item in postOptions"
                  :key="item.postId"
                  :label="item.postName"
                  :value="item.postId"
                  :disabled="item.status == '1'"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.userId == null || form.userId != useUserStore().userId">
            <el-form-item :label="$t('common.role')" prop="roleIds">
              <el-select v-model="form.roleIds" filterable multiple :placeholder="$t('common.placeholderSelect')">
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId"
                  :disabled="item.status == '1'"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item :label="$t('common.remark')">
              <el-input v-model="form.remark" type="textarea" :placeholder="$t('common.placeholderInputContent')"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :disabled="userDialogLoading" @click="submitForm">
            {{ $t('common.btnConfirm') }}
          </el-button>
          <el-button @click="cancel()">{{ $t('common.btnCancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 用户导入对话框 -->
    <el-dialog v-model="upload.open" :title="upload.title" width="400px" append-to-body>
      <el-upload
        ref="uploadRef"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <el-icon class="el-icon--upload">
          <UploadFilled />
        </el-icon>
        <div class="el-upload__text">
          {{ $t('common.uploadDragHint') }}
          <em>{{ $t('common.uploadClickHint') }}</em>
        </div>
        <template #tip>
          <div class="text-center el-upload__tip">
            <div class="el-upload__tip">
              <el-checkbox v-model="upload.updateSupport" />
              {{ $t('common.checkboxUpdateExisting') }}
            </div>
            <span>{{ $t('common.uploadFileLimit') }}</span>
            <el-link
              type="primary"
              underline="never"
              style="font-size: 12px; vertical-align: baseline"
              @click="importTemplate"
            >
              {{ $t('common.btnDownloadTemplate') }}
            </el-link>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">{{ $t('common.btnConfirm') }}</el-button>
          <el-button @click="upload.open = false">{{ $t('common.btnCancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 用户详情抽屉 -->
    <user-view-drawer ref="userViewRef" />
  </div>
</template>

<script setup name="User" lang="ts">
import { ArrowDown, UploadFilled } from '@element-plus/icons-vue';
import { to } from 'await-to-js';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
const { t, locale } = useI18n();
import { getConfigKey } from '@/api/system/config';
import { DeptTreeVO, DeptVO } from '@/api/system/dept/types';
import { optionselect } from '@/api/system/post';
import { PostVO } from '@/api/system/post/types';
import { RoleVO } from '@/api/system/role/types';
import api from '@/api/system/user';
import { UserForm, UserQuery, UserVO } from '@/api/system/user/types';
import TreePanel from '@/components/TreePanel/index.vue';
import EmptyState from '@/components/EmptyState/index.vue';
import SearchFilterSummary from '@/components/SearchFilterSummary/index.vue';
import TableSkeleton from '@/components/TableSkeleton/index.vue';
import { useLoading } from '@/hooks/async/useLoading';
import { useDialogState } from '@/hooks/dialog/useDialogState';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import { useTreeCollapsed } from '@/hooks/tree/useTreeCollapsed';
import modal from '@/plugins/modal';
import { useUserStore } from '@/store/modules/user';
import { useDict } from '@/utils/dict';
import { checkPermi } from '@/utils/permission';
import { globalHeaders } from '@/utils/request';
import { download as requestDownload } from '@/utils/request';
import UserViewDrawer from './view.vue';

const router = useRouter();
const { sys_normal_disable, sys_user_gender } = toRefs<any>(useDict('sys_normal_disable', 'sys_user_gender'));
const userList = ref<UserVO[]>();
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();
const { treeCollapsed } = useTreeCollapsed();
const deptOptions = ref<DeptTreeVO[]>([]);

// --- 搜索面板折叠时显示已选筛选条件 ---
const activeFilters = computed(() => {
  const filters: { label: string; value: string; onRemove: () => void }[] = [];
  const qp = queryParams.value;
  if (qp.userName) filters.push({ label: t('common.userName'), value: qp.userName, onRemove: () => { qp.userName = undefined; handleQuery(); } });
  if (qp.nickName) filters.push({ label: t('common.nickName'), value: qp.nickName, onRemove: () => { qp.nickName = undefined; handleQuery(); } });
  if (qp.phoneNumber) filters.push({ label: t('common.phoneNumber'), value: qp.phoneNumber, onRemove: () => { qp.phoneNumber = undefined; handleQuery(); } });
  if (qp.status !== undefined && qp.status !== null && qp.status !== '') filters.push({ label: t('common.status'), value: qp.status, onRemove: () => { qp.status = undefined; handleQuery(); } });
  if (dateRange.value?.length) {
    const rangeStr = dateRange.value.join(' ~ ').substring(0, 20) + '...';
    filters.push({ label: t('common.createDate'), value: rangeStr, onRemove: () => { dateRange.value = []; handleQuery(); } });
  }
  return filters;
});
const enabledDeptOptions = ref<DeptTreeVO[]>([]);
type DeptTreeOption = Omit<DeptTreeVO, 'children'> & {
  children: DeptTreeOption[];
  path: string;
};

const deptPickerVisible = ref(false);
const deptSearchKeyword = ref('');
const deptTreeRef = ref<{ setCurrentKey: (key: number | string | undefined) => void }>();
const deptTreeProps = {
  value: 'id',
  label: 'label',
  children: 'children',
  disabled: 'disabled'
};

const buildDeptTreeOptions = (nodes: DeptTreeVO[], parentPath = ''): DeptTreeOption[] => {
  return nodes.map(dept => {
    const path = parentPath ? `${parentPath} / ${dept.label}` : dept.label;
    return {
      ...dept,
      path,
      children: buildDeptTreeOptions(dept.children ?? [], path)
    };
  });
};

const deptTreeOptions = computed<DeptTreeOption[]>(() => buildDeptTreeOptions(enabledDeptOptions.value));

const deptTreeVisibleOptions = computed<DeptTreeOption[]>(() => {
  const keyword = deptSearchKeyword.value.trim().toLocaleLowerCase();
  if (!keyword) return deptTreeOptions.value;

  const filterNodes = (nodes: DeptTreeOption[]): DeptTreeOption[] => {
    return nodes.reduce<DeptTreeOption[]>((result, node) => {
      const children = filterNodes(node.children);
      const matched = node.label.toLocaleLowerCase().includes(keyword) || node.path.toLocaleLowerCase().includes(keyword);
      if (matched || children.length) result.push({ ...node, children });
      return result;
    }, []);
  };

  return filterNodes(deptTreeOptions.value);
});

const deptTreeExpandedKeys = computed<(number | string)[]>(() => {
  const expandedKeys: (number | string)[] = [];
  const collectExpandedKeys = (nodes: DeptTreeOption[]) => {
    nodes.forEach(node => {
      if (node.children.length) {
        expandedKeys.push(node.id);
        collectExpandedKeys(node.children);
      }
    });
  };

  if (deptSearchKeyword.value.trim()) {
    collectExpandedKeys(deptTreeVisibleOptions.value);
  } else {
    expandedKeys.push(...deptTreeOptions.value.map(node => node.id));
  }
  return expandedKeys;
});
const initPassword = ref<string>('');
const postOptions = ref<PostVO[]>([]);
const roleOptions = ref<RoleVO[]>([]);
/*** 用户导入参数 */
const upload = reactive<ImportOption>({
  // 是否显示弹出层（用户导入）
  open: false,
  // 弹出层标题（用户导入）
  title: '',
  // 是否禁用上传
  isUploading: false,
  // {{ $t('common.checkboxUpdateExisting') }}
  updateSupport: 0,
  // 设置上传的请求头部
  headers: globalHeaders(),
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + '/system/user/importData'
});
// 列显隐信息
const columns = ref<FieldOption[]>([
  { key: 0, label: t('common.userId'), visible: false, children: [] },
  { key: 1, label: t('common.userName'), visible: true, children: [] },
  { key: 2, label: t('common.nickName'), visible: true, children: [] },
  { key: 3, label: t('common.employeeNo'), visible: true, children: [] },
  { key: 4, label: t('common.dept'), visible: true, children: [] },
  { key: 5, label: t('common.phoneNumber'), visible: true, children: [] },
  { key: 6, label: t('common.status'), visible: true, children: [] },
  { key: 7, label: t('common.createTime'), visible: true, children: [] }
]);

// 语言切换时更新列标签
watch(locale, () => {
  columns.value[0].label = t('common.userId');
  columns.value[1].label = t('common.userName');
  columns.value[2].label = t('common.nickName');
  columns.value[3].label = t('common.employeeNo');
  columns.value[4].label = t('common.dept');
  columns.value[5].label = t('common.phoneNumber');
  columns.value[6].label = t('common.status');
  columns.value[7].label = t('common.createTime');
});

const treePanelRef = ref<InstanceType<typeof TreePanel>>();
const queryFormRef = ref<ElFormInstance>();
const userFormRef = ref<ElFormInstance>();
const uploadRef = ref<ElUploadInstance>();
const formDialogRef = ref<ElDialogInstance>();
const userViewRef = ref<InstanceType<typeof UserViewDrawer>>();

const initFormData: UserForm = {
  userId: undefined,
  deptId: undefined,
  userName: '',
  nickName: undefined,
  employeeNo: undefined,
  password: '',
  phoneNumber: undefined,
  email: undefined,
  gender: undefined,
  status: '0',
  remark: '',
  postIds: [],
  roleIds: []
};

const initData: PageData<UserForm, UserQuery> = {
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userName: '',
    phoneNumber: '',
    status: '',
    deptId: '',
    roleId: ''
  },
  rules: {
    userName: [
      { required: true, message: t('common.validationUserNameRequired'), trigger: 'blur' },
      {
        min: 2,
        max: 20,
        message: t('common.validationLengthBetween'),
        trigger: 'blur'
      }
    ],
    nickName: [{ required: true, message: t('common.validationNickNameRequired'), trigger: 'blur' }],
    password: [
      { required: true, message: t('common.validationUserPwdRequired'), trigger: 'blur' },
      {
        min: 5,
        max: 20,
        message: t('common.validationLengthBetween'),
        trigger: 'blur'
      },
      {
        pattern: /^[^<>"'|\\]+$/,
        message: t('common.validationInvalidChars'),
        trigger: 'blur'
      }
    ],
    email: [
      {
        type: 'email',
        message: t('common.validationInvalidEmail'),
        trigger: ['blur', 'change']
      }
    ],
    phoneNumber: [
      {
        pattern: /^1[3456789][0-9]\d{8}$/,
        message: t('common.validationInvalidPhone'),
        trigger: 'blur'
      }
    ],
    roleIds: [{ required: true, message: t('common.validationUserRoleRequired'), trigger: 'blur' }]
  }
};
const data = reactive<PageData<UserForm, UserQuery>>(initData);

const { queryParams, form, rules } = toRefs<PageData<UserForm, UserQuery>>(data);
const { ids, single, multiple, handleSelectionChange } = useTableSelection<UserVO>(item => item.userId);
const { dialog, openDialog: openUserDialog, closeDialog: closeUserDialog, setTitle: setDialogTitle } = useDialogState();
const userDialogLoading = ref(false);
let userDialogRequestId = 0;

/** 查询用户列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await api.listUser(applyDateRange(queryParams.value));
    userList.value = res.data?.rows;
    total.value = res.data?.total;
  });
};

/** 查询部门下拉树结构 */
const getDeptTree = async () => {
  const res = await api.deptTreeSelect();
  deptOptions.value = res.data;
  enabledDeptOptions.value = filterDisabledDept(res.data);
};

/** 过滤禁用的部门，并返回独立的新树，避免污染左侧完整部门树 */
const filterDisabledDept = (deptList: DeptTreeVO[]): DeptTreeVO[] => {
  return deptList.reduce<DeptTreeVO[]>((result, dept) => {
    if (dept.disabled) {
      return result;
    }
    result.push({
      ...dept,
      children: dept.children?.length ? filterDisabledDept(dept.children) : []
    });
    return result;
  }, []);
};

/** 获取当前部门完整路径，避免级联输入框省略长名称后无法确认选择结果 */
const findDeptPath = (deptList: DeptTreeVO[], deptId: number | string | null | undefined, parentPath: string[] = []): string[] => {
  if (deptId === undefined || deptId === null || deptId === '') return [];

  for (const dept of deptList) {
    const currentPath = [...parentPath, dept.label];
    if (String(dept.id) === String(deptId)) return currentPath;
    if (dept.children?.length) {
      const childPath = findDeptPath(dept.children, deptId, currentPath);
      if (childPath.length) return childPath;
    }
  }

  return [];
};

const selectedDeptPath = computed(() => findDeptPath(deptOptions.value, form.value.deptId).join(' / '));

const handleDeptPickerShow = () => {
  deptSearchKeyword.value = '';
  deptTreeRef.value?.setCurrentKey(form.value.deptId);
};

const handleDeptTreeNodeClick = (data: DeptTreeOption) => {
  if (data.disabled) return;
  form.value.deptId = data.id;
  deptPickerVisible.value = false;
  deptSearchKeyword.value = '';
  handleDeptChange(data.id);
};

const handleDeptClear = () => {
  form.value.deptId = undefined;
  handleDeptChange(undefined);
};

/** 节点单击事件 */
const handleNodeClick = (data: DeptVO) => {
  queryParams.value.deptId = data.id;
  handleQuery();
};

/** 搜索按钮操作 */
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
    queryParams.value.deptId = undefined;
    treePanelRef.value?.setCurrentKey(undefined);
  },
  afterReset: () => {
    handleQuery();
  }
});

/** 删除按钮操作 */
const handleDelete = async (row?: Partial<UserVO>) => {
  const userIds = row?.userId || ids.value;
  const [err] = await to(modal.confirm(t('common.msgboxConfirmDeleteUser', { id: userIds })) as any);
  if (!err) {
    await api.delUser(userIds);
    await getList();
    modal.msgSuccess(t('common.msgDeleteSuccess'));
  }
};

/** 解锁按钮操作 */
const handleUnlock = async () => {
  const userId = ids.value[0];
  const [err] = await to(modal.confirm(t('common.msgboxConfirmUnlockUser', { id: userId })) as any);
  if (!err) {
    await api.unlockUser(userId);
    modal.msgSuccess(t('common.msgUnlockSuccess'));
  }
};

/** 用户状态修改  */
const handleStatusChange = async (row: Partial<UserVO>) => {
  const text = row.status === '0' ? t('common.tagEnabled') : t('common.tagDisabled');
  try {
    await modal.confirm(t('common.msgboxConfirmStatusChange', { action: text, name: row.userName }));
    await api.changeUserStatus(row.userId, row.status);
    modal.msgSuccess(t('common.msgStatusChangeSuccess'));
  } catch (err) {
    row.status = row.status === '0' ? '1' : '0';
  }
};
/** 跳转角色分配 */
const handleAuthRole = (row: Partial<UserVO>) => {
  const userId = row.userId;
  router.push('/system/user-auth/role/' + userId);
};

/** 重置密码按钮操作 */
const handleResetPwd = async (row: Partial<UserVO>) => {
  const [err, res] = await to(
    ElMessageBox.prompt(t('common.msgboxInputNewPwd', { name: row.userName }), t('common.tip'), {
      confirmButtonText: t('common.btnConfirm'),
      cancelButtonText: t('common.btnCancel'),
      closeOnClickModal: false,
      inputPattern: /^.{5,20}$/,
      inputErrorMessage: t('common.msgboxPwdLength'),
      inputValidator: value => {
        if (/<|>|"|'|\||\\/.test(value)) {
          return t('common.validationInvalidChars');
        }
      }
    })
  );
  if (!err && res) {
    await api.resetUserPwd(row.userId, res.value);
    modal.msgSuccess(t('common.msgResetPwdSuccess') + ': ' + res.value);
  }
};

/** 详情按钮操作 */
const handleViewDetail = (row: Partial<UserVO>) => {
  userViewRef.value?.openDrawer(row.userId);
};

/** 导入按钮操作 */
const handleImport = () => {
  upload.title = t('common.userImport');
  upload.open = true;
};
/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'system/user/export',
    {
      ...queryParams.value
    },
    `user_${new Date().getTime()}.xlsx`
  );
};
/** 下载模板操作 */
const importTemplate = () => {
  requestDownload('system/user/importTemplate', {}, `user_template_${new Date().getTime()}.xlsx`);
};

/**文件上传中处理 */
const handleFileUploadProgress = () => {
  upload.isUploading = true;
};

const formatImportResultMessage = (message: unknown) => {
  return String(message ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, '');
};

/** 文件上传成功处理 */
const handleFileSuccess = (response: any, file: UploadFile) => {
  upload.open = false;
  upload.isUploading = false;
  uploadRef.value?.handleRemove(file);
  ElMessageBox.alert(formatImportResultMessage(response.msg), t('common.dialogImportResult'), {
    customClass: 'import-result-box'
  });
  getList();
};

/** 提交上传文件 */
function submitFileForm() {
  uploadRef.value?.submit();
}

/** 重置操作表单 */
const reset = () => {
  form.value = { ...initFormData };
  userFormRef.value?.resetFields();
};
/** 取消按钮 */
const cancel = () => {
  userDialogRequestId++;
  userDialogLoading.value = false;
  closeUserDialog();
  reset();
};

/** 新增按钮操作 */
const handleAdd = async () => {
  const requestId = ++userDialogRequestId;
  reset();
  postOptions.value = [];
  roleOptions.value = [];
  setDialogTitle(t('common.dialogAddUser'));
  openUserDialog();
  form.value.password = initPassword.value.toString();
  userDialogLoading.value = true;
  try {
    const { data } = await api.getUser();
    if (requestId !== userDialogRequestId) return;
    postOptions.value = data.posts;
    roleOptions.value = data.roles;
  } finally {
    if (requestId === userDialogRequestId) userDialogLoading.value = false;
  }
};

/** 修改按钮操作 */
const handleUpdate = async (row?: Partial<UserForm>) => {
  const requestId = ++userDialogRequestId;
  reset();
  const userId = row?.userId || ids.value[0];
  setDialogTitle(t('common.dialogEditUser'));
  openUserDialog();
  userDialogLoading.value = true;
  try {
    const { data } = await api.getUser(userId);
    if (requestId !== userDialogRequestId) return;
    Object.assign(form.value, data.user);
    postOptions.value = data.posts;
    roleOptions.value = Array.from(
      new Map([...data.roles, ...data.user.roles].map(role => [role.roleId, role])).values()
    );
    form.value.postIds = data.postIds;
    form.value.roleIds = data.roleIds;
    form.value.password = '';
  } finally {
    if (requestId === userDialogRequestId) userDialogLoading.value = false;
  }
};

/** 提交按钮 */
const submitForm = () => {
  userFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      if (form.value.userId) {
        // 自己编辑自己的情况下 不允许编辑角色部门岗位
        if (form.value.userId == useUserStore().userId) {
          form.value.roleIds = null;
          form.value.deptId = null;
          form.value.postIds = null;
        }
        await api.updateUser(form.value);
      } else {
        await api.addUser(form.value);
      }
      modal.msgSuccess(t('common.msgOperateSuccess'));
      closeUserDialog();
      await getList();
    }
  });
};

/**
 * 关闭用户弹窗
 */
const closeDialog = () => {
  userDialogRequestId++;
  userDialogLoading.value = false;
  closeUserDialog();
  resetForm();
};

/**
 * 重置表单
 */
const resetForm = () => {
  userFormRef.value?.resetFields();
  userFormRef.value?.clearValidate();

  form.value.id = undefined;
  form.value.status = '1';
};
onMounted(() => {
  getDeptTree(); // 初始化部门数据
  getList(); // 初始化列表数据
  getConfigKey('sys.user.initPassword').then(response => {
    initPassword.value = response.data;
  });
});

async function handleDeptChange(value: number | string | null | undefined) {
  if (value === undefined || value === null || value === '') {
    postOptions.value = [];
    form.value.postIds = [];
    return;
  }

  const response = await optionselect(value);
  postOptions.value = response.data;
  form.value.postIds = [];
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.tree-table-crud-page;

:global(.import-result-box .el-message-box__message) {
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 20px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.dept-tree-input) {
  width: 100%;
}

.dept-selected-summary {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  margin-top: 8px;
  padding: 7px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 20px;
}

.dept-selected-summary__label {
  flex: none;
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.dept-selected-summary__path {
  min-width: 0;
  color: var(--el-color-primary);
  overflow-wrap: anywhere;
}

:global(.user-dept-tree-popper) {
  width: min(560px, calc(100vw - 24px));
  min-width: min(560px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  padding: 0;
}

:global(.user-dept-tree-popper .dept-picker-panel) {
  padding: 12px;
}

:global(.user-dept-tree-popper .dept-picker-search) {
  margin-bottom: 8px;
}

:global(.user-dept-tree-popper .el-tree) {
  --el-tree-node-content-height: 36px;
  background: transparent;
}

:global(.user-dept-tree-popper .el-tree-node__content) {
  box-sizing: border-box;
  height: 36px;
  border-radius: 6px;
  padding-right: 8px;
}

:global(.user-dept-tree-popper .dept-tree-node) {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  height: 100%;
}

:global(.user-dept-tree-popper .dept-tree-node__label) {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  :global(.user-dept-tree-popper) {
    width: calc(100vw - 24px);
    min-width: calc(100vw - 24px);
  }
}
</style>
