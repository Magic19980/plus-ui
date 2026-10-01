<template>
  <div class="app-container hrm-sync-page">
    <UiCard shadow="never" class="intro-card" :body-style="{ padding: 0 }">
      <div class="intro-card__content">
        <div class="intro-card__copy">
          <span class="eyebrow"><el-icon><OfficeBuilding /></el-icon>ECOLOGY HRM DIRECTORY</span>
          <h2>泛微组织与人员同步</h2>
          <p>泛微是组织唯一来源，同步后自动更新本地部门；业务科室仍由管理员手工选择配置。</p>
        </div>
        <div class="intro-card__status">
          <span class="intro-card__status-icon"><el-icon><Connection /></el-icon></span>
          <div>
            <strong>泛微主数据</strong>
            <span>组织与人员单向同步</span>
          </div>
          <span class="intro-card__connected">已接入</span>
        </div>
      </div>
    </UiCard>

    <UiCard shadow="never" class="main-card mt-2" :body-style="{ padding: '0 26px 30px' }">
      <template #header>
        <div class="main-card__header">
          <div class="section-heading">
            <span class="section-heading__icon"><el-icon><Refresh /></el-icon></span>
            <div>
              <h3>同步控制台</h3>
              <p>部门、岗位、人员直接同步到本地系统主表，统一查看组织结果与同步记录。</p>
            </div>
          </div>
          <div class="action-group">
          <UiButton v-hasPermi="['ecology:hrmSync:user']" plain @click="openPasswordDialog">设置人员初始密码</UiButton>
          <UiButton v-hasPermi="['ecology:hrmSync:organization']" plain :loading="syncLoading" @click="syncOrganization">同步并接管组织</UiButton>
          <UiButton v-hasPermi="['ecology:hrmSync:user']" type="primary" :loading="syncLoading" @click="syncUsers">同步人员</UiButton>
          </div>
        </div>
      </template>

      <DepartmentPageTabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane name="tree">
          <template #label><span class="sync-tab-label"><el-icon><OfficeBuilding /></el-icon>组织目录</span></template>
          <div class="tree-toolbar">
            <div class="tree-toolbar__copy">
              <strong>组织目录</strong>
              <span>组织层级来自泛微的上级分部 ID、上级部门 ID，不按部门名称拆分。</span>
            </div>
            <div class="tree-toolbar__actions">
              <el-checkbox v-model="includeDisabled" @change="loadOrganizationTree">显示已封存</el-checkbox>
              <UiButton plain @click="loadOrganizationTree">刷新目录</UiButton>
            </div>
          </div>
          <el-alert title="同步后的泛微组织会自动成为本地部门树，业务科室配置不会被覆盖；岗位和人员分别写入系统主表。" type="info" :closable="false" show-icon class="sync-alert" />
          <div class="tree-shell">
            <el-tree v-loading="treeLoading" :data="organizationTree" node-key="nodeKey" :render-after-expand="true" :expand-on-click-node="false" class="organization-tree">
              <template #default="{ data }">
                <div class="tree-node">
                  <div class="tree-node__main">
                    <span class="tree-node__icon"><el-icon><OfficeBuilding v-if="data.nodeType === 'SUBCOMPANY'" /><Folder v-else /></el-icon></span>
                    <span class="tree-node__name">{{ data.name }}</span>
                    <UiTag v-if="treeNodeTypeLabel(data.nodeType || data.oaSourceType)" size="small" effect="plain" class="tree-node__type-tag">
                      {{ treeNodeTypeLabel(data.nodeType || data.oaSourceType) }}
                    </UiTag>
                    <UiTag v-if="data.status === 'DISABLED'" size="small" type="info">已封存</UiTag>
                    <UiTag v-if="data.treeStatus !== 'VALID'" size="small" :type="treeStatusType(data.treeStatus)">{{ treeStatusLabel(data.treeStatus) }}</UiTag>
                  </div>
                  <div class="tree-node__meta">
                    <span v-if="data.nodeType === 'DEPARTMENT' && data.localDeptName">本地部门：{{ data.localDeptName }}</span>
                    <span>ID：{{ data.oaId }}</span>
                    <span v-if="data.oaCode">编码：{{ data.oaCode }}</span>
                  </div>
                </div>
              </template>
            </el-tree>
            <UiEmpty v-if="!treeLoading && organizationTree.length === 0" description="暂无组织树，请先同步并接管组织" />
          </div>
        </el-tab-pane>

        <el-tab-pane name="batch" lazy>
          <template #label><span class="sync-tab-label"><el-icon><Refresh /></el-icon>同步批次</span></template>
          <DepartmentDataTable :loading="batchLoading" :data="batches" border stripe class="data-table">
            <el-table-column label="批次 ID" prop="id" width="170" />
            <el-table-column label="类型" width="100"><template #default="scope">{{ scope.row.syncType === 'USER' ? '人员' : '组织' }}</template></el-table-column>
            <el-table-column label="模式" width="100"><template #default="scope">{{ scope.row.syncMode === 'FULL' ? '全量' : scope.row.syncMode === 'RETRY' ? '重试' : '增量' }}</template></el-table-column>
            <el-table-column label="状态" width="100" align="center"><template #default="scope"><UiTag :type="batchType(scope.row.status)">{{ batchLabel(scope.row.status) }}</UiTag></template></el-table-column>
            <el-table-column label="总数" prop="totalCount" width="90" />
            <el-table-column label="成功" prop="successCount" width="90" />
            <el-table-column label="新增" prop="createdCount" width="90" />
            <el-table-column label="更新" prop="updatedCount" width="90" />
            <el-table-column label="待处理" prop="pendingCount" width="90" />
            <el-table-column label="失败" prop="failedCount" width="90" />
            <el-table-column label="开始时间" prop="startedAt" min-width="170" />
            <el-table-column label="结束时间" prop="finishedAt" min-width="170" />
            <el-table-column label="说明" prop="message" min-width="180" show-overflow-tooltip />
          </DepartmentDataTable>
          <UiPagination v-show="batchTotal > 0" v-model:page="batchPage.pageNum" v-model:limit="batchPage.pageSize" :total="batchTotal" @pagination="loadBatches" />
          <UiEmpty v-if="!batchLoading && batches.length === 0" description="暂无同步批次" />
        </el-tab-pane>

        <el-tab-pane name="detail" lazy>
          <template #label><span class="sync-tab-label"><el-icon><InfoFilled /></el-icon>异常明细</span></template>
          <el-form :inline="true" class="detail-query" @submit.prevent>
            <el-form-item label="批次 ID"><UiInput v-model="detailBatchId" clearable placeholder="可选" style="width: 190px" @keyup.enter="searchDetails" /></el-form-item>
            <el-form-item label="处理状态">
              <UiSelect v-model="detailStatus" :options="detailStatusOptions" clearable placeholder="全部状态" style="width: 150px" @change="searchDetails" />
            </el-form-item>
            <el-form-item>
              <UiButton @click="searchDetails">查询</UiButton>
            </el-form-item>
          </el-form>
          <el-alert title="异常明细只记录本次同步的校验、冲突和失败原因；修正泛微主数据或配置后重新执行同步。" type="info" :closable="false" show-icon class="sync-alert" />
          <DepartmentDataTable :loading="detailLoading" :data="details" border stripe class="data-table">
            <el-table-column label="批次 ID" prop="batchId" width="170" />
            <el-table-column label="类型" width="90"><template #default="scope">{{ scope.row.entityType === 'USER' ? '人员' : scope.row.entityType }}</template></el-table-column>
            <el-table-column label="泛微源 ID" prop="sourceId" width="130" />
            <el-table-column label="业务键" prop="sourceKey" min-width="160" show-overflow-tooltip />
            <el-table-column label="动作" prop="action" width="100" />
            <el-table-column label="状态" width="100" align="center"><template #default="scope"><UiTag :type="detailType(scope.row.detailStatus)">{{ detailLabel(scope.row.detailStatus) }}</UiTag></template></el-table-column>
            <el-table-column label="说明" prop="message" min-width="260" show-overflow-tooltip />
            <el-table-column label="时间" prop="createTime" min-width="170" />
          </DepartmentDataTable>
          <UiPagination v-show="detailTotal > 0" v-model:page="detailPage.pageNum" v-model:limit="detailPage.pageSize" :total="detailTotal" @pagination="loadDetails" />
          <UiEmpty v-if="!detailLoading && details.length === 0" description="暂无同步异常明细" />
        </el-tab-pane>
      </DepartmentPageTabs>
    </UiCard>

    <UiDialog
      v-model="passwordDialog.visible"
      :title="passwordStatus.configured ? '修改人员初始密码' : '设置人员初始密码'"
      width="560px"
      append-to-body
      class="password-dialog"
    >
      <div class="password-dialog__intro">
        <span class="password-dialog__intro-icon"><el-icon><Lock /></el-icon></span>
        <div>
          <div class="password-dialog__intro-title">{{ passwordStatus.configured ? '初始密码已配置' : '新人员账号安全设置' }}</div>
          <p>{{ passwordStatus.configured ? '如需更换密码，请在下方输入新的初始密码。' : '用于泛微同步新增人员首次登录系统时的初始密码。' }}</p>
        </div>
      </div>
      <el-alert
        :title="passwordStatus.configured ? `当前已配置（${passwordSourceLabel(passwordStatus.source)}）` : '当前尚未配置人员初始密码'"
        :type="passwordStatus.configured ? 'success' : 'warning'"
        :closable="false"
        show-icon
        class="password-dialog__status"
      >
        <template #default>
          <span v-if="passwordStatus.configured">密码已安全保存且不会回显；重新输入并保存后，后续新增的泛微人员将使用新密码。</span>
          <span v-else>新增的泛微人员会使用该密码创建系统账号，已经存在的系统用户不会被重置密码。</span>
        </template>
      </el-alert>
      <div v-if="passwordStatus.password" class="password-dialog__current">
        <div class="password-dialog__current-header">
          <span>当前初始密码</span>
          <UiTag type="success" effect="plain" size="small">可用于后续新账号</UiTag>
        </div>
        <div class="password-dialog__current-value">
          <code>{{ passwordStatus.password }}</code>
          <UiButton text type="primary" icon="CopyDocument" @click="copyPassword">复制密码</UiButton>
        </div>
      </div>
      <div v-else-if="passwordStatus.configured && passwordStatus.source === 'PAGE'" class="password-dialog__legacy-tip">
        当前密码是旧版本保存的单向摘要，无法回显；请输入新密码并保存一次即可启用密码显示。
      </div>
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="96px"
        class="password-dialog__form"
        size="large"
      >
        <el-form-item label="初始密码" prop="password">
          <UiInput
            v-model="passwordForm.password"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="passwordStatus.configured ? '请输入新的 5-20 位初始密码' : '请输入 5-20 位初始密码'"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <UiInput
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="请再次输入初始密码"
          />
        </el-form-item>
      </el-form>
      <div class="password-dialog__tip">
        <el-icon><InfoFilled /></el-icon>
        <span>出于安全原因，已保存的密码不会回显；保存新密码只影响后续新建账号。</span>
      </div>
      <template #footer>
        <div class="password-dialog__footer">
          <UiButton @click="closePasswordDialog">取消</UiButton>
          <UiButton type="primary" :loading="passwordDialog.loading" @click="submitPassword">{{ passwordStatus.configured ? '修改并保存' : '保存设置' }}</UiButton>
        </div>
      </template>
    </UiDialog>

  </div>
</template>

<script setup name="EcologyHrmSync" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import DepartmentPageTabs from '@/components/Department/PageTabs.vue';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import { getOaHrmUserPasswordStatus, listOaOrganizationTree, listOaSyncBatches, listOaSyncDetails, syncOaOrganization, syncOaUsers, updateOaHrmUserPassword } from '@/api/ecology';
import type { OaHrmUserPasswordStatusVO, OaOrganizationTreeVO, OaSyncBatchVO, OaSyncDetailVO } from '@/api/ecology/types';
import { UiButton, UiCard, UiDialog, UiEmpty, UiInput, UiPagination, UiSelect, UiTag } from '@/components/UiKit';

const activeTab = ref('tree');
const syncLoading = ref(false);
const batchLoading = ref(false);
const detailLoading = ref(false);
const treeLoading = ref(false);
const batches = ref<OaSyncBatchVO[]>([]);
const batchTotal = ref(0);
const details = ref<OaSyncDetailVO[]>([]);
const detailTotal = ref(0);
const organizationTree = ref<OaOrganizationTreeVO[]>([]);
const includeDisabled = ref(false);
const detailStatusOptions = [{ value: 'PENDING', label: '待处理' }, { value: 'CONFLICT', label: '冲突' }, { value: 'FAILED', label: '失败' }];
const batchPage = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
const detailPage = reactive<PageQuery>({ pageNum: 1, pageSize: 10 });
const detailBatchId = ref<string>();
const detailStatus = ref<string>();
const passwordFormRef = ref<ElFormInstance>();
const passwordForm = reactive({ password: '', confirmPassword: '' });
const passwordStatus = reactive<OaHrmUserPasswordStatusVO>({ configured: false, source: 'NONE' });
const passwordDialog = reactive({ visible: false, loading: false });

const validatePasswordConfirmation = (_rule: any, value: string, callback: (error?: Error) => void) => {
  if (value !== passwordForm.password) {
    callback(new Error('两次输入的密码不一致'));
    return;
  }
  callback();
};
const passwordRules: ElFormRules = {
  password: [
    { required: true, message: '人员初始密码不能为空', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度必须在5到20个字符之间', trigger: 'blur' },
    { pattern: /^[^<>"'|\\]+$/, message: '密码包含非法字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认初始密码', trigger: 'blur' },
    { validator: validatePasswordConfirmation, trigger: 'blur' }
  ]
};

const batchLabel = (status?: string) => ({ RUNNING: '执行中', SUCCESS: '成功', PARTIAL: '部分成功', FAILED: '失败' }[status || ''] || status || '未知');
const batchType = (status?: string) => ({ SUCCESS: 'success', PARTIAL: 'warning', FAILED: 'danger', RUNNING: 'warning' }[status || ''] || 'info') as 'success' | 'warning' | 'danger' | 'info';
const detailLabel = (status?: string) => ({ PENDING: '待处理', CONFLICT: '冲突', FAILED: '失败', SUCCESS: '成功' }[status || ''] || status || '未知');
const detailType = (status?: string) => ({ CONFLICT: 'danger', FAILED: 'danger', SUCCESS: 'success' }[status || ''] || 'warning') as 'success' | 'warning' | 'danger' | 'info';
const treeNodeTypeLabel = (type?: string) => {
  const normalizedType = String(type || '').replaceAll('_', '').toUpperCase();
  if (normalizedType === 'SUBCOMPANY') return '分部';
  if (normalizedType === 'DEPARTMENT' || normalizedType === 'DEPT') return '部门';
  return '';
};
const treeStatusLabel = (status?: string) => ({ ORPHAN: '上级缺失', CYCLE: '循环引用' }[status || ''] || status || '正常');
const treeStatusType = (status?: string) => ({ ORPHAN: 'warning', CYCLE: 'danger' }[status || ''] || 'info') as 'success' | 'warning' | 'danger' | 'info';
const passwordSourceLabel = (source?: string) => ({ PAGE: '页面配置', ENV: '环境变量' }[source || ''] || '未配置');

const loadOrganizationTree = async () => { if (treeLoading.value) return; treeLoading.value = true; try { const res = await listOaOrganizationTree(includeDisabled.value); organizationTree.value = res.data || []; } finally { treeLoading.value = false; } };
const loadBatches = async () => { batchLoading.value = true; try { const res = await listOaSyncBatches(undefined, batchPage); batches.value = res.data?.rows || []; batchTotal.value = res.data?.total || 0; } finally { batchLoading.value = false; } };
const loadDetails = async () => { detailLoading.value = true; try { const res = await listOaSyncDetails(detailBatchId.value || undefined, detailStatus.value, detailPage); details.value = res.data?.rows || []; detailTotal.value = res.data?.total || 0; } finally { detailLoading.value = false; } };
const handleTabChange = (name: string | number) => { if (name === 'tree' && organizationTree.value.length === 0) loadOrganizationTree(); if (name === 'batch' && batches.value.length === 0) loadBatches(); if (name === 'detail' && details.value.length === 0) loadDetails(); };
const searchDetails = () => { detailPage.pageNum = 1; loadDetails(); };
const openPasswordDialog = async () => {
  passwordForm.password = '';
  passwordForm.confirmPassword = '';
  passwordStatus.password = undefined;
  passwordDialog.visible = true;
  const res = await getOaHrmUserPasswordStatus();
  Object.assign(passwordStatus, res.data || { configured: false, source: 'NONE' });
};
const copyPassword = async () => {
  if (!passwordStatus.password) return;
  try {
    await navigator.clipboard.writeText(passwordStatus.password);
    modal.msgSuccess('初始密码已复制');
  } catch {
    modal.msgError('复制失败，请手动复制');
  }
};
const closePasswordDialog = () => {
  passwordDialog.visible = false;
  passwordForm.password = '';
  passwordForm.confirmPassword = '';
  passwordFormRef.value?.resetFields();
};
const submitPassword = () => {
  passwordFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    passwordDialog.loading = true;
    try {
      await updateOaHrmUserPassword({ password: passwordForm.password });
      passwordStatus.configured = true;
      passwordStatus.source = 'PAGE';
      modal.msgSuccess('人员初始密码保存成功，重新同步人员即可生效');
      closePasswordDialog();
    } finally {
      passwordDialog.loading = false;
    }
  });
};
const syncOrganization = async () => { await modal.confirm('确认以泛微为唯一组织来源并接管本地部门吗？全量同步成功后，旧本地部门和手工岗位会逻辑删除，泛微当前组织和岗位将成为有效主数据。'); syncLoading.value = true; try { const res = await syncOaOrganization(true); modal.msgSuccess(`组织、岗位同步完成：${res.data?.status || '已提交'}`); organizationTree.value = []; await Promise.all([activeTab.value === 'tree' ? loadOrganizationTree() : Promise.resolve(), loadBatches()]); } finally { syncLoading.value = false; } };
const syncUsers = async () => { await modal.confirm('确认全量同步泛微人员吗？人员会依据泛微部门自动归属本地部门，并写入系统用户表；同步成功后，历史本地普通用户会逻辑删除，超级管理员保留；新人员需要先配置初始密码。'); syncLoading.value = true; try { const res = await syncOaUsers(true); modal.msgSuccess(`人员同步完成：${res.data?.status || '已提交'}`); await loadBatches(); } finally { syncLoading.value = false; } };

onMounted(async () => { await loadOrganizationTree(); });
</script>

<style scoped lang="scss">
.hrm-sync-page {
  --hrm-ink: #172d49;
  --hrm-muted: #71839a;
  --hrm-line: #e5edf6;
  --hrm-blue: #4b9ee8;
  --hrm-blue-soft: #edf6ff;
  padding: 18px 20px 30px;
  background:
    radial-gradient(circle at 92% 4%, rgba(111, 188, 244, 0.09), transparent 24%),
    linear-gradient(180deg, #f7faff 0%, #f3f6fb 100%);
}

:global(.hrm-sync-page .el-card),
:global(.hrm-sync-page .ui-animal-card) {
  overflow: hidden;
  border: 1px solid rgba(218, 229, 241, 0.9);
  border-radius: 22px;
  box-shadow: 0 16px 38px rgba(35, 67, 105, 0.075);
}

:global(.hrm-sync-page .intro-card) {
  border: 1px solid rgba(29, 73, 111, 0.55);
  background: #183858;
  box-shadow: 0 20px 46px rgba(21, 53, 85, 0.18), 0 4px 12px rgba(21, 53, 85, 0.08);
}

:global(.hrm-sync-page .intro-card .el-card__body),
:global(.hrm-sync-page .intro-card .ui-animal-card__body) { padding: 0 !important; }

.intro-card__content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 164px;
  gap: 34px;
  overflow: hidden;
  padding: 31px 40px;
  color: #eef6ff;
  background:
    radial-gradient(circle at 80% 0%, rgba(106, 190, 239, 0.16), transparent 27%),
    linear-gradient(118deg, #122946 0%, #1b456b 56%, #216a77 100%);
}

.intro-card__content::before,
.intro-card__content::after {
  position: absolute;
  content: '';
  border-radius: 50%;
  pointer-events: none;
}

.intro-card__content::before {
  top: -215px;
  right: 18%;
  width: 390px;
  height: 390px;
  background: radial-gradient(circle, rgba(113, 198, 249, 0.28) 0 43%, rgba(113, 198, 249, 0.04) 44% 70%, transparent 71%);
}

.intro-card__content::after {
  right: -90px;
  bottom: -235px;
  width: 390px;
  height: 390px;
  border: 1px solid rgba(164, 239, 234, 0.24);
  box-shadow: 0 0 0 22px rgba(164, 239, 234, 0.035), 0 0 0 44px rgba(164, 239, 234, 0.025);
}

.intro-card__copy { position: relative; z-index: 1; min-width: 0; }
.eyebrow { display: inline-flex; align-items: center; gap: 7px; color: #a9ddfb; font-size: 11px; font-weight: 800; letter-spacing: 0.17em; }
.eyebrow .el-icon { font-size: 14px; }
.intro-card h2 { margin: 10px 0 8px; color: #fff; font-size: 29px; line-height: 1.2; letter-spacing: 0.01em; text-shadow: 0 2px 14px rgba(4, 25, 48, 0.18); }
.intro-card p { max-width: 760px; margin: 0; color: rgba(231, 242, 253, 0.76); font-size: 14px; line-height: 1.6; }

.intro-card__status {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 11px;
  min-width: 270px;
  padding: 15px 17px;
  border: 1px solid rgba(217, 241, 255, 0.24);
  border-radius: 17px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.055));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.13), 0 14px 28px rgba(5, 27, 47, 0.13);
  backdrop-filter: blur(10px);
}

.intro-card__status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(175, 244, 243, 0.18);
  border-radius: 13px;
  color: #a5eff0;
  background: linear-gradient(145deg, rgba(102, 225, 225, 0.24), rgba(102, 225, 225, 0.1));
  box-shadow: 0 6px 14px rgba(50, 176, 184, 0.12);
  font-size: 20px;
}

.intro-card__status strong,
.intro-card__status > div > span { display: block; }
.intro-card__status > div { display: flex; flex-direction: column; justify-content: center; min-height: 42px; }
.intro-card__status strong { color: #fff; font-size: 14px; }
.intro-card__status div span { margin-top: 4px; color: rgba(231, 242, 253, 0.64); font-size: 12px; }
.intro-card__connected { display: inline-flex !important; align-items: center; justify-content: center; align-self: center; min-width: 60px; height: 28px; margin-top: 0 !important; margin-left: auto; padding: 0 11px; border: 1px solid rgba(160, 241, 192, 0.5); border-radius: 999px; color: #b4f4c9; background: rgba(76, 201, 129, 0.1); box-shadow: 0 0 0 3px rgba(76, 201, 129, 0.07); font-size: 12px; font-weight: 700; line-height: 1 !important; white-space: nowrap; }
.intro-card__connected::before { width: 5px; height: 5px; margin-right: 5px; border-radius: 50%; background: #8ce6aa; box-shadow: 0 0 0 3px rgba(140, 230, 170, 0.12); content: ''; }

:global(.hrm-sync-page .main-card .el-card__header),
:global(.hrm-sync-page .main-card .ui-animal-card__header) { padding: 0; border-bottom: 1px solid var(--hrm-line); }
:global(.hrm-sync-page .main-card .el-card__body),
:global(.hrm-sync-page .main-card .ui-animal-card__body) { padding: 0 26px 30px; }
.main-card__header { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 24px 28px; background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); }
.section-heading { display: flex; align-items: center; min-width: 0; gap: 12px; }
.section-heading__icon { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; flex: 0 0 44px; border: 1px solid #d5e9fc; border-radius: 14px; color: #438fe0; background: linear-gradient(145deg, #eff7ff, #e7f2ff); box-shadow: 0 5px 12px rgba(72, 148, 219, 0.1); font-size: 20px; }
.section-heading h3 { margin: 0; color: var(--hrm-ink); font-size: 17px; line-height: 1.3; }
.section-heading p { margin: 4px 0 0; overflow: hidden; color: var(--hrm-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.action-group { display: flex; flex: 0 0 auto; flex-wrap: wrap; justify-content: flex-end; gap: 8px; padding: 6px; border: 1px solid #e5edf6; border-radius: 14px; background: #f5f8fc; }
.action-group .el-button,
.action-group .ui-animal-button { margin-left: 0; border-radius: 10px; }
.action-group .el-button:not(.el-button--primary),
.action-group .ui-animal-button:not(.animal-btn--primary) { border-color: transparent; background: #fff; box-shadow: 0 2px 5px rgba(47, 75, 109, 0.05); }
.action-group .el-button--primary,
.action-group .animal-btn--primary { box-shadow: 0 5px 12px rgba(75, 158, 232, 0.22); }

.sync-tab-label { display: inline-flex; align-items: center; gap: 7px; }
.sync-tab-label .el-icon { font-size: 15px; }

.tree-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 14px; padding: 15px 16px; border: 1px solid #e6eef7; border-radius: 15px; background: linear-gradient(105deg, #f8fbff 0%, #ffffff 72%); }
.tree-toolbar__copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.tree-toolbar__copy strong { display: inline-flex; align-items: center; gap: 8px; color: var(--hrm-ink); font-size: 15px; }
.tree-toolbar__copy strong::before { width: 4px; height: 17px; border-radius: 4px; background: linear-gradient(180deg, #56a9ea, #70c8c9); content: ''; }
.tree-toolbar__copy span { color: var(--hrm-muted); font-size: 12px; line-height: 1.5; }
.tree-toolbar__actions { display: flex; align-items: center; flex: 0 0 auto; gap: 13px; }
.tree-toolbar__actions .el-checkbox { padding: 7px 10px; border-radius: 8px; color: #6f8196; background: #f3f7fb; }
.tree-toolbar__actions .el-button,
.tree-toolbar__actions .ui-animal-button { border-radius: 9px; }
.sync-alert { margin-bottom: 14px; border: 1px solid #dfeefa; border-radius: 12px; background: linear-gradient(90deg, #f2f8ff 0%, #f8fbff 100%); }
.sync-alert :deep(.el-alert__icon) { color: #5aa7e8; }
.sync-alert :deep(.el-alert__title) { color: #58718e; font-size: 12px; font-weight: 500; line-height: 1.5; }

.tree-shell { min-height: 330px; overflow: hidden; border: 1px solid #e2ebf5; border-radius: 16px; background: linear-gradient(180deg, #fbfdff 0%, #f8fbfe 100%); box-shadow: inset 0 1px 0 #fff; }
.organization-tree { min-height: 330px; padding: 9px 10px 12px; }
.organization-tree :deep(.el-tree-node__content) { height: 54px; margin: 3px 0; border: 1px solid transparent; border-radius: 11px; background: rgba(255, 255, 255, 0.86); box-shadow: 0 1px 2px rgba(39, 71, 107, 0.025); transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s, transform 0.2s; }
.organization-tree :deep(.el-tree-node__content:hover) { border-color: #d8eafa; background: #fff; box-shadow: 0 5px 16px rgba(55, 103, 151, 0.08); transform: translateX(2px); }
.organization-tree :deep(.el-tree-node__expand-icon) { margin-right: 3px; color: #8fa5bb; font-size: 14px; }
.organization-tree :deep(.el-tree-node__expand-icon.is-leaf) { color: transparent; }
.tree-node { display: flex; align-items: center; justify-content: space-between; width: 100%; min-width: 0; gap: 20px; padding-right: 10px; }
.tree-node__main, .tree-node__meta { display: flex; align-items: center; min-width: 0; gap: 8px; }
.tree-node__main { overflow: hidden; }
.tree-node__icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex: 0 0 32px; border: 1px solid #d9ebfc; border-radius: 10px; color: #4d9be5; background: linear-gradient(145deg, #f0f8ff, #e6f2ff); box-shadow: 0 3px 8px rgba(73, 149, 220, 0.1); font-size: 16px; }
.tree-node__name { min-width: 0; overflow: hidden; flex: 0 1 auto; color: #2f4660; font-size: 13px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.tree-node__type-tag { flex: 0 0 auto; }
.tree-node__main :deep(.el-tag) { border-radius: 6px; }
.tree-node__meta { flex: 0 0 auto; color: #8a9caf; font-size: 11px; white-space: nowrap; }
.tree-node__meta span { padding: 4px 8px; border: 1px solid #edf1f5; border-radius: 6px; background: #f8fafc; }

.data-table { overflow: hidden; border: 1px solid #e3ebf4; border-radius: 14px; }
.data-table :deep(.el-table__header-wrapper) { background: linear-gradient(180deg, #f8fbfe 0%, #f2f7fc 100%); }
.data-table :deep(th.el-table__cell) { height: 48px; color: #5c7188; background: transparent; font-size: 12px; font-weight: 700; }
.data-table :deep(td.el-table__cell) { height: 50px; color: #52677e; border-bottom-color: #eef3f7; }
.data-table :deep(.el-table__row:hover > td.el-table__cell) { background: #f6faff; }
.data-table :deep(.el-table__inner-wrapper::before) { display: none; }
.detail-query { margin-bottom: 14px; padding: 14px 16px 1px; border: 1px solid var(--hrm-line); border-radius: 14px; background: linear-gradient(105deg, #f8fbff, #ffffff); }
.detail-query :deep(.el-form-item) { margin-bottom: 13px; }
.detail-query :deep(.el-button),
.detail-query :deep(.ui-animal-button) { border-radius: 8px; }

.table-empty { min-height: 260px; border: 1px dashed #dce7f1; border-radius: 14px; background: rgba(255, 255, 255, 0.72); }

@media (max-width: 1180px) {
  .hrm-sync-page { padding-right: 14px; padding-left: 14px; }
  .main-card__header { align-items: flex-start; flex-direction: column; }
  .action-group { width: 100%; justify-content: flex-start; }
}

@media (max-width: 720px) {
  .hrm-sync-page { padding: 10px 8px 20px; }
  .intro-card__content { align-items: flex-start; flex-direction: column; padding: 26px 24px; }
  .intro-card h2 { font-size: 24px; }
  .intro-card__status { width: 100%; min-width: 0; }
  .main-card__header { padding: 20px; }
  :global(.hrm-sync-page .main-card .el-card__body),
  :global(.hrm-sync-page .main-card .ui-animal-card__body) { padding: 0 14px 20px; }
  .tree-toolbar { align-items: flex-start; flex-direction: column; }
  .tree-toolbar__actions { width: 100%; justify-content: space-between; }
  .tree-node__meta { display: none; }
}

small { color: var(--el-text-color-secondary); }
:global(.password-dialog) { max-width: calc(100vw - 32px); }
:global(.password-dialog.el-dialog) { overflow: hidden; border-radius: 16px; }
:global(.password-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
:global(.password-dialog .el-dialog__title) { font-size: 18px; font-weight: 700; color: var(--el-text-color-primary); }
:global(.password-dialog .el-dialog__headerbtn) { top: 17px; right: 20px; }
:global(.password-dialog .el-dialog__body) { padding: 22px 24px 4px; }
:global(.password-dialog .el-dialog__footer) { padding: 18px 24px 22px; border-top: 1px solid var(--el-border-color-lighter); }
.password-dialog__intro {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding: 2px 4px;
}
.password-dialog__intro-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-size: 20px;
}
.password-dialog__intro-title { color: var(--el-text-color-primary); font-size: 15px; font-weight: 600; }
.password-dialog__intro p { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.5; }
.password-dialog__status { margin-bottom: 22px; border-radius: 12px; }
.password-dialog__status :deep(.el-alert__title) { font-weight: 600; }
.password-dialog__status :deep(.el-alert__description) { line-height: 1.6; }
.password-dialog__current { margin: -4px 4px 22px; padding: 14px 16px; border: 1px solid var(--el-color-success-light-5); border-radius: 12px; background: var(--el-color-success-light-9); }
.password-dialog__current-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--el-color-success-dark-2); font-size: 13px; font-weight: 600; }
.password-dialog__current-value { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; }
.password-dialog__current-value code { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--el-text-color-primary); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 16px; letter-spacing: 1px; word-break: break-all; }
.password-dialog__legacy-tip { margin: -4px 4px 22px; padding: 10px 12px; border: 1px solid var(--el-color-warning-light-5); border-radius: 10px; color: var(--el-color-warning-dark-2); background: var(--el-color-warning-light-9); font-size: 12px; line-height: 1.6; }
.password-dialog__form { margin: 0 4px; }
.password-dialog__form :deep(.el-form-item) { margin-bottom: 20px; }
.password-dialog__form :deep(.el-form-item__label) { color: var(--el-text-color-regular); font-weight: 600; }
.password-dialog__form :deep(.el-input__wrapper) { border-radius: 10px; box-shadow: 0 0 0 1px var(--el-border-color) inset; }
.password-dialog__form :deep(.el-input__wrapper:hover),
.password-dialog__form :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px var(--el-color-primary) inset; }
.password-dialog__tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 2px 4px 4px 100px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}
.password-dialog__tip .el-icon { margin-top: 2px; color: var(--el-color-primary); }
.password-dialog__footer { display: flex; justify-content: flex-end; gap: 10px; }
.password-dialog__footer .el-button { min-width: 88px; }
@media (max-width: 600px) {
  :global(.password-dialog .el-dialog__header),
  :global(.password-dialog .el-dialog__body),
  :global(.password-dialog .el-dialog__footer) { padding-left: 16px; padding-right: 16px; }
  .password-dialog__tip { margin-left: 4px; }
}
</style>

<style lang="scss">
html.dark .hrm-sync-page {
  --hrm-ink: #e8f1ff;
  --hrm-muted: #91a4bf;
  --hrm-line: rgba(71, 85, 105, 0.48);
  --hrm-blue: #63b8f2;
  --hrm-blue-soft: rgba(56, 189, 248, 0.14);
  color: var(--app-text-title);
  background:
    radial-gradient(circle at 92% 4%, rgba(56, 189, 248, 0.12), transparent 24%),
    linear-gradient(180deg, #0b1220 0%, #060b16 100%);

  .el-card,
  .ui-animal-card,
  .main-card {
    border-color: rgba(71, 85, 105, 0.48);
    background: var(--app-surface-bg);
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  .intro-card {
    border-color: rgba(103, 190, 239, 0.34);
    background: linear-gradient(118deg, #0f213a 0%, #163958 56%, #1e5a66 100%);
    box-shadow: 0 20px 46px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.16);
  }

  .intro-card__content {
    background:
      radial-gradient(circle at 80% 0%, rgba(103, 190, 239, 0.2), transparent 27%),
      linear-gradient(118deg, #0f213a 0%, #163958 56%, #1e5a66 100%);
  }

  .intro-card__status {
    border-color: rgba(165, 226, 255, 0.3);
    background: linear-gradient(135deg, rgba(30, 64, 88, 0.82), rgba(15, 35, 56, 0.62));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 14px 28px rgba(0, 0, 0, 0.2);
  }

  .main-card .el-card__header,
  .main-card .ui-animal-card__header {
    border-bottom-color: var(--hrm-line);
  }

  .main-card__header {
    background: linear-gradient(180deg, rgba(30, 41, 59, 0.96) 0%, rgba(17, 24, 39, 0.96) 100%);
  }

  .section-heading__icon {
    border-color: rgba(103, 190, 239, 0.28);
    color: #8ed1ff;
    background: linear-gradient(145deg, rgba(56, 189, 248, 0.18), rgba(37, 99, 235, 0.14));
    box-shadow: 0 5px 12px rgba(14, 165, 233, 0.12);
  }

  .action-group {
    border-color: rgba(71, 85, 105, 0.44);
    background: rgba(15, 23, 42, 0.72);
  }

  .action-group .el-button:not(.el-button--primary) {
    border-color: rgba(71, 85, 105, 0.5);
    background: rgba(30, 41, 59, 0.82);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .action-group .el-button:not(.el-button--primary):hover {
    border-color: rgba(103, 190, 239, 0.52);
    background: rgba(51, 65, 85, 0.92);
  }

  .tree-toolbar {
    border-color: rgba(71, 85, 105, 0.46);
    background: linear-gradient(105deg, rgba(30, 41, 59, 0.88) 0%, rgba(17, 24, 39, 0.9) 72%);
  }

  .tree-toolbar__actions .el-checkbox {
    color: #9aabc1;
    background: rgba(30, 41, 59, 0.78);
  }

  .tree-toolbar__actions .el-button {
    background: rgba(30, 41, 59, 0.78);
    border-color: rgba(71, 85, 105, 0.5);
  }

  .tree-toolbar__actions .el-button:hover {
    background: rgba(51, 65, 85, 0.92);
    border-color: rgba(103, 190, 239, 0.5);
  }

  .sync-alert {
    border-color: rgba(56, 189, 248, 0.24);
    background: linear-gradient(90deg, rgba(14, 116, 144, 0.22) 0%, rgba(30, 41, 59, 0.78) 100%);
  }

  .sync-alert .el-alert__title {
    color: #b9d8f4;
  }

  .tree-shell {
    border-color: rgba(71, 85, 105, 0.5);
    background: linear-gradient(180deg, rgba(17, 24, 39, 0.92) 0%, rgba(15, 23, 42, 0.94) 100%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .organization-tree .el-tree-node__content {
    border-color: transparent;
    background: rgba(30, 41, 59, 0.72);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.16);
  }

  .organization-tree .el-tree-node__content:hover {
    border-color: rgba(103, 190, 239, 0.36);
    background: rgba(51, 65, 85, 0.88);
    box-shadow: 0 5px 16px rgba(0, 0, 0, 0.2);
  }

  .organization-tree .el-tree-node__expand-icon {
    color: #91a4bf;
  }

  .tree-node__icon {
    border-color: rgba(103, 190, 239, 0.28);
    color: #8ed1ff;
    background: linear-gradient(145deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.14));
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.16);
  }

  .tree-node__name {
    color: #dbeafe;
  }

  .tree-node__meta {
    color: #91a4bf;
  }

  .tree-node__meta span {
    border-color: rgba(71, 85, 105, 0.48);
    background: rgba(15, 23, 42, 0.62);
  }

  .data-table {
    --el-table-bg-color: #111827;
    --el-table-tr-bg-color: #111827;
    --el-table-header-bg-color: #1e293b;
    --el-table-row-hover-bg-color: rgba(56, 189, 248, 0.1);
    --el-table-border-color: rgba(71, 85, 105, 0.46);
    --el-table-text-color: #cbd5e1;
    border-color: rgba(71, 85, 105, 0.5);
  }

  .data-table .el-table__header-wrapper {
    background: linear-gradient(180deg, #1e293b 0%, #172235 100%);
  }

  .data-table th.el-table__cell {
    color: #b8c9dd;
    background: transparent;
  }

  .data-table td.el-table__cell {
    color: #cbd5e1;
    border-bottom-color: rgba(71, 85, 105, 0.34);
  }

  .data-table .el-table__row:hover > td.el-table__cell {
    background: rgba(56, 189, 248, 0.1);
  }

  .detail-query {
    border-color: rgba(71, 85, 105, 0.46);
    background: linear-gradient(105deg, rgba(30, 41, 59, 0.88), rgba(17, 24, 39, 0.9));
  }

  .detail-query .el-input__wrapper,
  .detail-query .el-select__wrapper {
    background: rgba(15, 23, 42, 0.72);
    box-shadow: 0 0 0 1px rgba(71, 85, 105, 0.56) inset;
  }

  .table-empty {
    border-color: rgba(71, 85, 105, 0.5);
    background: rgba(30, 41, 59, 0.52);
  }

  .el-empty__description p {
    color: var(--app-text-muted);
  }
}

/* 动森模式页面皮肤：页面原有的 html.dark 样式只服务办公蓝主题，
 * 因此在这里按 Animal 语义变量重绘同步页的所有业务区域。 */
html[data-ui-theme='animal'] .hrm-sync-page {
  --hrm-ink: var(--animal-text-color);
  --hrm-muted: var(--animal-text-color-secondary);
  --hrm-line: var(--animal-border-color-light);
  --hrm-blue: var(--animal-primary-color);
  --hrm-blue-soft: var(--animal-primary-color-bg);
  color: var(--animal-text-color);
  background: transparent;

  .el-card,
  .ui-animal-card,
  .main-card {
    border-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
    box-shadow: var(--app-shadow-md);
  }

  .intro-card {
    border-color: var(--animal-border-color);
    background: var(--app-surface-bg);
    box-shadow: var(--app-shadow-lg);
  }

  .intro-card__content {
    color: var(--animal-text-color);
    background:
      radial-gradient(circle at 80% 0%, rgb(25 200 185 / 16%), transparent 27%),
      linear-gradient(118deg, #d7efdc 0%, #d2ece9 56%, #e7f0cf 100%);
  }

  .intro-card__content::before {
    background: radial-gradient(circle, rgb(25 200 185 / 24%) 0 43%, rgb(25 200 185 / 5%) 44% 70%, transparent 71%);
  }

  .intro-card__content::after {
    border-color: rgb(25 200 185 / 22%);
    box-shadow: 0 0 0 22px rgb(25 200 185 / 4%), 0 0 0 44px rgb(25 200 185 / 3%);
  }

  .eyebrow {
    color: #3f8f83;
  }

  .intro-card h2 {
    color: #345e4c;
    text-shadow: 0 2px 14px rgb(64 91 74 / 14%);
  }

  .intro-card p {
    color: #5c806e;
  }

  .intro-card__status {
    border-color: rgb(25 145 132 / 24%);
    background: linear-gradient(135deg, rgb(255 255 255 / 56%), rgb(232 249 239 / 58%));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 72%), var(--app-shadow-md);
  }

  .intro-card__status-icon {
    border-color: rgb(25 200 185 / 24%);
    color: #218f85;
    background: linear-gradient(145deg, rgb(25 200 185 / 20%), rgb(25 200 185 / 8%));
  }

  .intro-card__status strong {
    color: #345e4c;
  }

  .intro-card__status div span {
    color: #6d917f;
  }

  .intro-card__connected {
    border-color: rgb(85 168 107 / 48%);
    color: #43875a;
    background: rgb(85 168 107 / 12%);
    box-shadow: 0 0 0 3px rgb(85 168 107 / 8%);
  }

  .intro-card__connected::before {
    background: #55a86b;
    box-shadow: 0 0 0 3px rgb(85 168 107 / 14%);
  }

  .main-card .el-card__header,
  .main-card .ui-animal-card__header {
    border-bottom-color: var(--animal-border-color-light);
  }

  .main-card__header {
    background: linear-gradient(180deg, #fffdf5 0%, #f7f3df 100%);
  }

  .section-heading__icon {
    border-color: rgb(25 200 185 / 28%);
    color: #168f84;
    background: linear-gradient(145deg, #e6f9f6, #d7f1e7);
    box-shadow: 0 5px 12px rgb(25 200 185 / 12%);
  }

  .section-heading h3,
  .tree-toolbar__copy strong {
    color: var(--animal-text-color);
  }

  .section-heading p,
  .tree-toolbar__copy span,
  .tree-node__meta {
    color: var(--animal-text-color-secondary);
  }

  .action-group {
    border-color: var(--animal-border-color-light);
    background: var(--animal-bg-color-secondary);
  }

  .action-group .animal-btn--default,
  .action-group .animal-btn--dashed {
    border-color: var(--animal-border-color) !important;
    color: var(--animal-text-color) !important;
    background: var(--animal-bg-color-input) !important;
  }

  .action-group .animal-btn--primary {
    border-color: var(--animal-primary-color) !important;
    color: #153b36 !important;
    background: var(--animal-primary-color) !important;
  }

  .department-page-tabs .el-tabs__header {
    border-bottom-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
  }

  .department-page-tabs .el-tabs__nav-wrap {
    border-color: var(--animal-border-color-light);
    background: var(--animal-bg-color-secondary);
  }

  .department-page-tabs .el-tabs__item {
    color: var(--animal-text-color-secondary);
  }

  .department-page-tabs .el-tabs__item:hover,
  .department-page-tabs .el-tabs__item.is-active {
    color: var(--animal-primary-color);
    background: var(--animal-bg-color-input);
  }

  .tree-toolbar {
    border-color: var(--animal-border-color-light);
    background: linear-gradient(105deg, var(--animal-bg-color-secondary) 0%, var(--app-surface-bg) 72%);
  }

  .tree-toolbar__copy strong::before {
    background: linear-gradient(180deg, var(--animal-primary-color), #74ba79);
  }

  .tree-toolbar__actions .el-checkbox {
    color: var(--animal-text-color-secondary);
    background: var(--animal-bg-color-secondary);
  }

  .tree-toolbar__actions .animal-btn--default {
    color: var(--animal-text-color) !important;
    background: var(--animal-bg-color-input) !important;
    border-color: var(--animal-border-color) !important;
  }

  .sync-alert {
    border-color: rgb(25 200 185 / 24%);
    background: linear-gradient(90deg, rgb(25 200 185 / 12%), var(--animal-bg-color-secondary));
  }

  .sync-alert .el-alert__icon {
    color: var(--animal-primary-color);
  }

  .sync-alert .el-alert__title {
    color: var(--animal-text-color-secondary);
  }

  .tree-shell {
    border-color: var(--animal-border-color-light);
    background: linear-gradient(180deg, var(--animal-bg-color) 0%, var(--app-surface-bg) 100%);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 70%);
  }

  .organization-tree .el-tree-node__content {
    border-color: transparent;
    background: var(--app-surface-bg);
    box-shadow: 0 1px 2px rgb(64 91 74 / 5%);
  }

  .organization-tree .el-tree-node__content:hover {
    border-color: rgb(25 200 185 / 34%);
    background: var(--animal-primary-color-bg);
    box-shadow: var(--app-shadow-sm);
  }

  .organization-tree .el-tree-node__expand-icon {
    color: var(--animal-text-color-secondary);
  }

  .tree-node__icon {
    border-color: rgb(25 200 185 / 28%);
    color: #168f84;
    background: linear-gradient(145deg, #e6f9f6, #e2f2d8);
    box-shadow: 0 3px 8px rgb(64 91 74 / 8%);
  }

  .tree-node__name {
    color: var(--animal-text-color);
  }

  .tree-node__meta span {
    border-color: var(--animal-border-color-light);
    background: var(--animal-bg-color-secondary);
  }

  .data-table {
    --el-table-bg-color: var(--app-surface-bg);
    --el-table-tr-bg-color: var(--app-surface-bg);
    --el-table-header-bg-color: var(--tableHeaderBg);
    --el-table-row-hover-bg-color: color-mix(in srgb, var(--animal-primary-color) 12%, var(--app-surface-bg));
    --el-table-border-color: var(--animal-border-color-light);
    --el-table-text-color: var(--animal-text-color);
    border-color: var(--animal-border-color-light);
  }

  .data-table .el-table__header-wrapper {
    background: var(--tableHeaderBg);
  }

  .data-table th.el-table__cell {
    color: var(--tableHeaderTextColor) !important;
    background: var(--tableHeaderBg) !important;
  }

  .data-table td.el-table__cell {
    color: var(--animal-text-color);
    border-bottom-color: var(--animal-border-color-light);
  }

  .data-table .el-table__row:hover > td.el-table__cell {
    background: var(--el-table-row-hover-bg-color);
  }

  .detail-query {
    border-color: var(--animal-border-color-light);
    background: linear-gradient(105deg, var(--animal-bg-color-secondary), var(--app-surface-bg));
  }

  .detail-query .el-input__wrapper,
  .detail-query .el-select__wrapper {
    background: var(--animal-bg-color-input);
    box-shadow: 0 0 0 1px var(--animal-border-color) inset;
  }

  .table-empty {
    border-color: var(--animal-border-color-light);
    background: var(--animal-bg-color-secondary);
  }

  .el-empty__description p {
    color: var(--animal-text-color-secondary);
  }
}

html[data-ui-theme='animal'][data-color-mode='dark'] .hrm-sync-page {
  --hrm-ink: var(--animal-text-color);
  --hrm-muted: var(--animal-text-color-secondary);
  --hrm-line: var(--animal-border-color-light);
  --hrm-blue: var(--animal-primary-color);
  --hrm-blue-soft: rgb(25 200 185 / 16%);

  .el-card,
  .main-card {
    border-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
    box-shadow: var(--app-shadow-md);
  }

  .intro-card {
    border-color: var(--animal-border-color);
    background: var(--app-surface-bg);
  }

  .intro-card__content {
    color: var(--animal-text-color);
    background:
      radial-gradient(circle at 80% 0%, rgb(25 200 185 / 20%), transparent 27%),
      linear-gradient(118deg, #29433f 0%, #345751 56%, #3f6b62 100%);
  }

  .intro-card__content::before {
    background: radial-gradient(circle, rgb(127 228 211 / 25%) 0 43%, rgb(127 228 211 / 6%) 44% 70%, transparent 71%);
  }

  .intro-card__content::after {
    border-color: rgb(127 228 211 / 26%);
    box-shadow: 0 0 0 22px rgb(127 228 211 / 5%), 0 0 0 44px rgb(127 228 211 / 3%);
  }

  .eyebrow {
    color: #8fe0d1;
  }

  .intro-card h2 {
    color: var(--animal-text-color);
    text-shadow: 0 2px 14px rgb(0 0 0 / 20%);
  }

  .intro-card p {
    color: var(--animal-text-color-secondary);
  }

  .intro-card__status {
    border-color: rgb(127 228 211 / 28%);
    background: linear-gradient(135deg, rgb(64 86 80 / 88%), rgb(38 58 56 / 72%));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 8%), var(--app-shadow-md);
  }

  .intro-card__status-icon {
    border-color: rgb(127 228 211 / 24%);
    color: #9be9dc;
    background: linear-gradient(145deg, rgb(25 200 185 / 24%), rgb(25 200 185 / 9%));
  }

  .intro-card__status strong {
    color: var(--animal-text-color);
  }

  .intro-card__status div span {
    color: var(--animal-text-color-secondary);
  }

  .intro-card__connected {
    border-color: rgb(123 200 142 / 58%);
    color: #a7e6b7;
    background: rgb(123 200 142 / 13%);
  }

  .intro-card__connected::before {
    background: var(--animal-status-success);
    box-shadow: 0 0 0 3px rgb(123 200 142 / 16%);
  }

  .main-card__header {
    background: linear-gradient(180deg, var(--animal-bg-color) 0%, var(--animal-bg-color-input) 100%);
  }

  .section-heading__icon {
    border-color: rgb(127 228 211 / 28%);
    color: #9be9dc;
    background: linear-gradient(145deg, rgb(25 200 185 / 22%), rgb(25 200 185 / 9%));
    box-shadow: 0 5px 12px rgb(0 0 0 / 18%);
  }

  .action-group {
    border-color: var(--animal-border-color-light);
    background: var(--animal-bg-color-input);
  }

  .action-group .animal-btn--default,
  .action-group .animal-btn--dashed {
    border-color: var(--animal-border-color) !important;
    color: var(--animal-text-color) !important;
    background: var(--animal-bg-color) !important;
  }

  .action-group .animal-btn--primary {
    border-color: var(--animal-primary-color) !important;
    color: #153b36 !important;
    background: var(--animal-primary-color) !important;
  }

  .department-page-tabs .el-tabs__header {
    border-bottom-color: var(--animal-border-color-light);
    background: var(--app-surface-bg);
  }

  .department-page-tabs .el-tabs__nav-wrap {
    border-color: var(--animal-border-color-light);
    background: var(--animal-bg-color-secondary);
  }

  .department-page-tabs .el-tabs__item {
    color: var(--animal-text-color-secondary);
  }

  .department-page-tabs .el-tabs__item:hover,
  .department-page-tabs .el-tabs__item.is-active {
    color: var(--animal-primary-color);
    background: var(--animal-bg-color-input);
  }

  .tree-toolbar {
    border-color: var(--animal-border-color-light);
    background: linear-gradient(105deg, var(--animal-bg-color) 0%, var(--animal-bg-color-input) 72%);
  }

  .tree-toolbar__copy strong::before {
    background: linear-gradient(180deg, var(--animal-primary-color), var(--animal-status-success));
  }

  .tree-toolbar__actions .el-checkbox {
    color: var(--animal-text-color-secondary);
    background: var(--animal-bg-color-input);
  }

  .tree-toolbar__actions .animal-btn--default {
    color: var(--animal-text-color) !important;
    background: var(--animal-bg-color) !important;
    border-color: var(--animal-border-color) !important;
  }

  .sync-alert {
    border-color: rgb(25 200 185 / 28%);
    background: linear-gradient(90deg, rgb(25 200 185 / 16%), var(--animal-bg-color-input));
  }

  .sync-alert .el-alert__icon {
    color: var(--animal-primary-color);
  }

  .sync-alert .el-alert__title {
    color: var(--animal-text-color-secondary);
  }

  .tree-shell {
    border-color: var(--animal-border-color-light);
    background: linear-gradient(180deg, var(--animal-bg-color-input) 0%, var(--app-surface-bg) 100%);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 4%);
  }

  .organization-tree .el-tree-node__content {
    border-color: transparent;
    background: var(--animal-bg-color);
    box-shadow: 0 1px 2px rgb(0 0 0 / 16%);
  }

  .organization-tree .el-tree-node__content:hover {
    border-color: rgb(127 228 211 / 36%);
    background: var(--animal-bg-color-secondary);
    box-shadow: var(--app-shadow-sm);
  }

  .organization-tree .el-tree-node__expand-icon {
    color: var(--animal-text-color-secondary);
  }

  .tree-node__icon {
    border-color: rgb(127 228 211 / 28%);
    color: #9be9dc;
    background: linear-gradient(145deg, rgb(25 200 185 / 22%), rgb(25 200 185 / 8%));
    box-shadow: 0 3px 8px rgb(0 0 0 / 18%);
  }

  .tree-node__name {
    color: var(--animal-text-color);
  }

  .tree-node__meta {
    color: var(--animal-text-color-secondary);
  }

  .tree-node__meta span {
    border-color: var(--animal-border-color-light);
    background: var(--animal-bg-color-input);
  }

  .data-table {
    --el-table-bg-color: var(--app-surface-bg);
    --el-table-tr-bg-color: var(--app-surface-bg);
    --el-table-header-bg-color: var(--tableHeaderBg);
    --el-table-row-hover-bg-color: color-mix(in srgb, var(--animal-primary-color) 12%, var(--app-surface-bg));
    --el-table-border-color: var(--animal-border-color-light);
    --el-table-text-color: var(--animal-text-color);
    border-color: var(--animal-border-color-light);
  }

  .data-table .el-table__header-wrapper {
    background: var(--tableHeaderBg);
  }

  .data-table th.el-table__cell {
    color: var(--tableHeaderTextColor) !important;
    background: var(--tableHeaderBg) !important;
  }

  .data-table td.el-table__cell {
    color: var(--animal-text-color);
    border-bottom-color: var(--animal-border-color-light);
  }

  .data-table .el-table__row:hover > td.el-table__cell {
    background: var(--el-table-row-hover-bg-color);
  }

  .detail-query {
    border-color: var(--animal-border-color-light);
    background: linear-gradient(105deg, var(--animal-bg-color) 0%, var(--animal-bg-color-input) 100%);
  }

  .detail-query .el-input__wrapper,
  .detail-query .el-select__wrapper {
    background: var(--animal-bg-color-input);
    box-shadow: 0 0 0 1px var(--animal-border-color) inset;
  }

  .table-empty {
    border-color: var(--animal-border-color-light);
    background: rgb(52 74 70 / 64%);
  }

  .el-empty__description p {
    color: var(--animal-text-color-secondary);
  }
}
</style>
