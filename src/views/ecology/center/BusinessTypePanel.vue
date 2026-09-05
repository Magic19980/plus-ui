<template>
  <div class="business-type-panel">
    <DepartmentTableToolbar>
      <div class="panel-heading">
        <span class="panel-heading__icon"><el-icon><CollectionTag /></el-icon></span>
        <div>
          <strong>业务类型目录</strong>
          <p>业务类型只维护一次，审批方案和通用审批申请统一选择已配置的业务类型。</p>
        </div>
      </div>
      <template #actions>
        <div class="toolbar__actions">
        <el-input v-model="query.keyword" clearable placeholder="搜索名称或标识" style="width: 220px" @keyup.enter="loadList" />
        <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 130px" @change="loadList">
          <el-option label="启用" value="ENABLED" />
          <el-option label="停用" value="DISABLED" />
        </el-select>
        <el-button type="primary" icon="Search" @click="loadList">查询</el-button>
        <el-button v-hasPermi="['ecology:businessType:add']" type="primary" plain icon="Plus" @click="openAdd">新增业务类型</el-button>
        </div>
      </template>
    </DepartmentTableToolbar>

    <div class="panel-summary">
      <div><span class="panel-summary__dot" />已配置 <strong>{{ rows.length }}</strong> 个业务类型</div>
      <span>业务标识用于系统自动匹配审批方案</span>
    </div>

    <DepartmentDataTable v-loading="loading" :data="rows" border stripe>
      <el-table-column label="业务名称" prop="businessName" min-width="180" show-overflow-tooltip />
      <el-table-column label="业务标识" prop="businessType" min-width="220" show-overflow-tooltip>
        <template #default="scope"><el-tag effect="plain" class="business-code-tag">{{ scope.row.businessType }}</el-tag></template>
      </el-table-column>
      <el-table-column label="泛微表单" min-width="190" show-overflow-tooltip><template #default="scope">{{ formNameFor(scope.row.businessType) || '未绑定' }}</template></el-table-column>
      <el-table-column label="可用审批方式" min-width="180"><template #default="scope"><span v-if="optionNamesFor(scope.row.businessType).length">{{ optionNamesFor(scope.row.businessType).join('、') }}</span><span v-else class="muted-text">未配置</span></template></el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="scope"><el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'">{{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="220" show-overflow-tooltip />
      <el-table-column label="更新时间" prop="updateTime" width="180" />
      <el-table-column label="操作" fixed="right" width="160" align="center">
        <template #default="scope">
          <DepartmentTableActions>
            <el-button v-hasPermi="['ecology:businessType:edit']" link type="primary" @click="openEdit(asBusinessType(scope.row))">编辑</el-button>
            <el-button v-if="scope.row.status === 'ENABLED'" v-hasPermi="['ecology:businessType:remove']" link type="danger" @click="disable(asBusinessType(scope.row))">停用</el-button>
          </DepartmentTableActions>
        </template>
      </el-table-column>
    </DepartmentDataTable>
    <el-empty v-if="!loading && rows.length === 0" description="暂无业务类型，请先新增配置" />

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" class="business-type-dialog" append-to-body destroy-on-close>
      <div class="dialog-intro">
        <span class="dialog-intro__icon"><el-icon><CollectionTag /></el-icon></span>
        <div>
          <strong>配置业务发起规则</strong>
          <p>先定义业务身份，再绑定可用表单和审批方式。</p>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="business-type-form">
        <section class="form-section">
          <div class="section-heading">
            <span class="section-heading__icon"><el-icon><Setting /></el-icon></span>
            <div>
              <h3>基础信息</h3>
              <p>用于识别业务类型和控制是否允许发起申请。</p>
            </div>
          </div>

          <div class="form-grid form-grid--two">
            <el-form-item label="业务名称" prop="businessName">
              <el-input v-model="form.businessName" maxlength="100" placeholder="如：费用报销" />
            </el-form-item>
            <el-form-item label="状态">
              <el-radio-group v-model="form.status" class="status-toggle">
                <el-radio label="ENABLED" class="status-option status-option--enabled">
                  <span class="status-option__content">
                    <span class="status-option__icon">✓</span>
                    <span class="status-option__copy"><strong>启用</strong><small>允许用户发起申请</small></span>
                    <span class="status-option__mark" />
                  </span>
                </el-radio>
                <el-radio label="DISABLED" class="status-option status-option--disabled">
                  <span class="status-option__content">
                    <span class="status-option__icon">—</span>
                    <span class="status-option__copy"><strong>停用</strong><small>暂停新申请，保留历史记录</small></span>
                    <span class="status-option__mark" />
                  </span>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </div>

          <el-form-item label="业务标识" prop="businessType">
            <el-input v-model="form.businessType" maxlength="64" :disabled="Boolean(form.id)" placeholder="如：EXPENSE_REIMBURSEMENT" />
            <div class="field-tip"><el-icon><InfoFilled /></el-icon>用于系统匹配审批方案，保存后不能修改；如需更换请停用旧类型后新增。</div>
          </el-form-item>
        </section>

        <section class="form-section form-section--binding">
          <div class="section-heading">
            <span class="section-heading__icon section-heading__icon--blue"><el-icon><Connection /></el-icon></span>
            <div>
              <h3>发起配置</h3>
              <p>为该业务选择一个泛微表单，并设置允许使用的审批方式。</p>
            </div>
          </div>

          <div class="binding-tip"><el-icon><InfoFilled /></el-icon><span>未绑定表单时，该业务不会出现在发起申请列表中。</span></div>

          <el-form-item label="使用表单" class="form-item--wide">
            <el-select v-model="bindingForm.formId" clearable filterable style="width: 100%" placeholder="选择可复用的泛微表单" @change="handleBindingFormChange">
              <el-option v-for="item in workflowForms" :key="item.id" :label="`${item.formName}（${item.workflowId}）`" :value="item.id" />
            </el-select>
          </el-form-item>

          <div v-if="bindingForm.formId" class="form-grid form-grid--two">
            <el-form-item label="可用审批方式" :required="Boolean(bindingForm.formId)">
              <el-select v-model="bindingForm.optionIds" multiple collapse-tags collapse-tags-tooltip filterable style="width: 100%" placeholder="请选择允许的审批方式">
                <el-option v-for="item in availableOptions" :key="item.id" :label="item.optionName" :value="item.id" />
              </el-select>
              <div class="field-tip">可多选，用户发起时只能从这里选择。</div>
            </el-form-item>
            <el-form-item label="默认审批方式" required>
              <el-select v-model="bindingForm.defaultOptionId" filterable style="width: 100%" placeholder="请选择默认方式">
                <el-option v-for="item in selectedOptions" :key="item.id" :label="item.optionName" :value="item.id" />
              </el-select>
              <div class="field-tip">用户发起时自动带出，可再次调整。</div>
            </el-form-item>
          </div>
          <div v-else class="binding-empty"><el-icon><Link /></el-icon><span>选择表单后，可继续配置审批方式</span></div>
        </section>

        <section class="form-section form-section--remark">
          <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="3" maxlength="1000" show-word-limit placeholder="补充该业务的使用说明（选填）" /></el-form-item>
        </section>
      </el-form>
      <template #footer><div class="dialog-footer"><span class="footer-hint">配置完成后，业务用户即可按此规则发起申请</span><div><el-button @click="dialog.visible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存配置</el-button></div></div></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import DepartmentDataTable from '@/components/Department/DataTable.vue';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import DepartmentTableToolbar from '@/components/Department/TableToolbar.vue';
import { delOaBusinessWorkflowBinding, disableOaBusinessType, listOaBusinessTypes, listOaBusinessWorkflowBindings, listOaFormWorkflows, listOaWorkflowOptions, saveOaBusinessType, saveOaBusinessWorkflowBinding } from '@/api/ecology';
import type { OaBusinessTypeForm, OaBusinessTypeVO, OaBusinessWorkflowBindingVO, OaFormWorkflowVO, OaWorkflowOptionVO } from '@/api/ecology/types';

const rows = ref<OaBusinessTypeVO[]>([]);
const loading = ref(false);
const saving = ref(false);
const formRef = ref<ElFormInstance>();
const query = reactive<{ keyword?: string; status?: string }>({ keyword: undefined, status: undefined });
const form = reactive<OaBusinessTypeForm>(newForm());
const workflowForms = ref<OaFormWorkflowVO[]>([]);
const workflowOptions = ref<OaWorkflowOptionVO[]>([]);
const workflowBindings = ref<OaBusinessWorkflowBindingVO[]>([]);
const bindingForm = reactive<{ formId?: string | number; optionIds: Array<string | number>; defaultOptionId?: string | number }>({ formId: undefined, optionIds: [], defaultOptionId: undefined });
const dialog = reactive({ visible: false, title: '' });
const rules = {
  businessName: [{ required: true, message: '请输入业务名称', trigger: 'blur' }],
  businessType: [{ required: true, message: '请输入业务标识', trigger: 'blur' }]
};
const availableOptions = computed(() => workflowOptions.value.filter((item) => item.status === 'ENABLED'));
const selectedOptions = computed(() => availableOptions.value.filter((item) => bindingForm.optionIds.some((id) => String(id) === String(item.id))));
const asBusinessType = (row: unknown) => row as OaBusinessTypeVO;

function newForm(): OaBusinessTypeForm {
  return { id: undefined, businessName: '', businessType: '', status: 'ENABLED', remark: '' };
}

const loadList = async () => {
  loading.value = true;
  try {
    const res = await listOaBusinessTypes(query.keyword, false);
    rows.value = (res.data || []).filter((item) => !query.status || item.status === query.status);
  } finally {
    loading.value = false;
  }
};

const loadWorkflowBindingData = async () => {
  const [forms, bindings, options] = await Promise.all([listOaFormWorkflows(true), listOaBusinessWorkflowBindings(), listOaWorkflowOptions(true)]);
  workflowForms.value = forms.data || [];
  workflowBindings.value = bindings.data || [];
  workflowOptions.value = options.data || [];
};

const bindingFor = (businessType?: string) => workflowBindings.value.find((item) => item.businessType === businessType);
const formNameFor = (businessType?: string) => { const binding = bindingFor(businessType); return workflowForms.value.find((item) => String(item.id) === String(binding?.formId))?.formName; };
const optionNamesFor = (businessType?: string) => { const binding = bindingFor(businessType); return workflowOptions.value.filter((item) => binding?.optionIds?.some((id) => String(id) === String(item.id))).map((item) => item.optionName); };
const resetBindingForm = () => { bindingForm.formId = undefined; bindingForm.optionIds = []; bindingForm.defaultOptionId = undefined; };
const loadBindingForm = (businessType?: string) => { const binding = bindingFor(businessType); bindingForm.formId = binding?.formId; bindingForm.optionIds = [...(binding?.optionIds || [])]; bindingForm.defaultOptionId = binding?.defaultOptionId; };
const handleBindingFormChange = () => { bindingForm.optionIds = []; bindingForm.defaultOptionId = undefined; };

const openAdd = () => {
  Object.assign(form, newForm());
  resetBindingForm();
  dialog.title = '新增业务类型';
  dialog.visible = true;
};

const openEdit = (row: OaBusinessTypeVO) => {
  Object.assign(form, row);
  loadBindingForm(row.businessType);
  dialog.title = '编辑业务类型';
  dialog.visible = true;
};

const save = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (bindingForm.formId && (!bindingForm.optionIds.length || !bindingForm.defaultOptionId)) {
    modal.msgWarning('已选择泛微表单时，请至少选择一种审批方式并设置默认项');
    return;
  }
  saving.value = true;
  try {
    await saveOaBusinessType(form);
    if (bindingForm.formId) {
      await saveOaBusinessWorkflowBinding(form.businessType!, { formId: bindingForm.formId, optionIds: bindingForm.optionIds, defaultOptionId: bindingForm.defaultOptionId });
    } else if (form.businessType) {
      await delOaBusinessWorkflowBinding(form.businessType);
    }
    modal.msgSuccess('业务类型保存成功');
    dialog.visible = false;
    await Promise.all([loadList(), loadWorkflowBindingData()]);
  } finally {
    saving.value = false;
  }
};

const disable = async (row: OaBusinessTypeVO) => {
  await modal.confirm(`确认停用业务类型“${row.businessName}”吗？停用后不能新增审批方案，但历史记录仍会保留。`);
  await disableOaBusinessType(row.id);
  modal.msgSuccess('业务类型已停用');
  await loadList();
};

onMounted(async () => { await Promise.all([loadList(), loadWorkflowBindingData()]); });
</script>

<style scoped lang="scss">
.panel-heading { display: flex; align-items: center; min-width: 0; gap: 11px; }
.panel-heading__icon { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; flex: 0 0 38px; border: 1px solid color-mix(in srgb, #7268dd 24%, var(--app-surface-border)); border-radius: 12px; color: #7268dd; background: color-mix(in srgb, #7268dd 12%, var(--app-surface-bg)); font-size: 18px; }
.panel-heading strong { color: var(--app-text-title); font-size: 15px; }
.panel-heading p { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.toolbar__actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.toolbar__actions :deep(.el-input__wrapper), .toolbar__actions :deep(.el-select__wrapper) { border-radius: 9px; }
.toolbar__actions :deep(.el-button) { border-radius: 9px; }
.panel-summary { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 10px 14px; border: 1px solid var(--app-surface-border); border-radius: 10px; color: var(--el-text-color-secondary); background: var(--app-elevated-soft-bg); font-size: 12px; }
.panel-summary strong { color: var(--el-color-primary); font-size: 15px; }
.panel-summary__dot { display: inline-block; width: 7px; height: 7px; margin-right: 7px; border-radius: 50%; background: #72d6a0; box-shadow: 0 0 0 4px color-mix(in srgb, #72d6a0 20%, transparent); }
.business-code-tag { border-color: color-mix(in srgb, var(--el-color-primary) 32%, var(--app-surface-border)); color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 8%, var(--app-surface-bg)); }
.form-tip { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.muted-text { color: var(--el-text-color-secondary); }

.dialog-intro { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding: 12px 14px; border: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, var(--app-surface-border)); border-radius: 12px; background: color-mix(in srgb, var(--el-color-primary) 7%, var(--app-surface-bg)); }
.dialog-intro__icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: 10px; color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 14%, var(--app-surface-bg)); font-size: 17px; }
.dialog-intro strong { display: block; color: var(--app-text-title); font-size: 14px; line-height: 1.3; }
.dialog-intro p { margin: 3px 0 0; color: var(--app-text-muted); font-size: 12px; line-height: 1.4; }

.business-type-form { display: flex; flex-direction: column; gap: 12px; }
.form-section { padding: 17px 18px 5px; border: 1px solid var(--app-surface-border); border-radius: 14px; background: var(--app-elevated-soft-bg); }
.section-heading { display: flex; align-items: center; gap: 10px; margin-bottom: 17px; }
.section-heading__icon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; flex: 0 0 30px; border: 1px solid color-mix(in srgb, #8b7cf6 30%, var(--app-surface-border)); border-radius: 9px; color: #8b7cf6; background: color-mix(in srgb, #8b7cf6 12%, var(--app-surface-bg)); }
.section-heading__icon--blue { border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--app-surface-border)); color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 12%, var(--app-surface-bg)); }
.section-heading h3 { margin: 0; color: var(--app-text-title); font-size: 14px; font-weight: 650; line-height: 1.3; }
.section-heading p { margin: 3px 0 0; color: var(--app-text-muted); font-size: 12px; line-height: 1.4; }
.form-grid { display: grid; gap: 0 16px; }
.form-grid--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.business-type-form :deep(.el-form-item) { margin-bottom: 16px; }
.business-type-form :deep(.el-form-item__label) { height: auto; padding: 0 0 7px; color: var(--app-text-title); font-size: 13px; font-weight: 600; line-height: 1.25; }
.business-type-form :deep(.el-form-item__content) { line-height: normal; }
.business-type-form :deep(.el-input__wrapper), .business-type-form :deep(.el-select__wrapper), .business-type-form :deep(.el-textarea__inner) { border-radius: 10px; background: var(--app-surface-bg); box-shadow: 0 0 0 1px var(--app-surface-border) inset; }
.business-type-form :deep(.el-input__wrapper:hover), .business-type-form :deep(.el-select__wrapper:hover), .business-type-form :deep(.el-textarea__inner:hover) { box-shadow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 42%, var(--app-surface-border)) inset; }
.business-type-form :deep(.el-input__wrapper.is-focus), .business-type-form :deep(.el-select__wrapper.is-focused), .business-type-form :deep(.el-textarea__inner:focus) { box-shadow: 0 0 0 1px var(--el-color-primary) inset, 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent); }
.business-type-form :deep(.el-input.is-disabled .el-input__wrapper) { background: color-mix(in srgb, var(--app-elevated-soft-bg) 70%, var(--app-surface-bg)); }
.status-toggle { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; width: 100%; }
.status-toggle :deep(.el-radio.status-option) { position: relative; display: flex; align-items: stretch; min-width: 0; height: 64px; margin: 0; padding: 0; border: 1px solid var(--app-surface-border); border-radius: 12px; color: var(--app-text-muted); background: var(--app-surface-bg); cursor: pointer; transition: border-color .2s ease, background .2s ease, box-shadow .2s ease, transform .2s ease; }
.status-toggle :deep(.el-radio.status-option:hover) { border-color: color-mix(in srgb, var(--el-color-primary) 48%, var(--app-surface-border)); background: color-mix(in srgb, var(--el-color-primary) 5%, var(--app-surface-bg)); transform: translateY(-1px); }
.status-toggle :deep(.status-option .el-radio__input) { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; pointer-events: none; }
.status-toggle :deep(.status-option .el-radio__label) { display: block; width: 100%; padding: 0; }
.status-option__content { display: flex; align-items: center; width: 100%; height: 100%; min-width: 0; padding: 10px 12px; gap: 9px; }
.status-option__icon { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; flex: 0 0 27px; border: 1px solid color-mix(in srgb, var(--app-text-muted) 35%, var(--app-surface-border)); border-radius: 50%; color: var(--app-text-muted); font-size: 15px; font-weight: 700; line-height: 1; }
.status-option__copy { display: flex; flex-direction: column; min-width: 0; gap: 3px; }
.status-option__copy strong { color: var(--app-text-title); font-size: 13px; font-weight: 650; line-height: 1.2; }
.status-option__copy small { overflow: hidden; color: var(--app-text-muted); font-size: 11px; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.status-option__mark { width: 7px; height: 7px; flex: 0 0 7px; margin-left: auto; border: 1px solid color-mix(in srgb, var(--app-text-muted) 42%, var(--app-surface-border)); border-radius: 50%; background: transparent; }
.status-toggle :deep(.el-radio.status-option.is-checked) { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 10%, transparent); transform: translateY(-1px); }
.status-toggle :deep(.status-option--enabled.is-checked) { border-color: color-mix(in srgb, #46c98f 68%, var(--app-surface-border)); background: color-mix(in srgb, #46c98f 10%, var(--app-surface-bg)); }
.status-toggle :deep(.status-option--enabled.is-checked .status-option__icon) { border-color: #46c98f; color: #46c98f; background: color-mix(in srgb, #46c98f 13%, transparent); }
.status-toggle :deep(.status-option--enabled.is-checked .status-option__mark) { border-color: #46c98f; background: #46c98f; box-shadow: 0 0 0 3px color-mix(in srgb, #46c98f 16%, transparent); }
.status-toggle :deep(.status-option--disabled.is-checked) { border-color: color-mix(in srgb, #94a3b8 70%, var(--app-surface-border)); background: color-mix(in srgb, #94a3b8 10%, var(--app-surface-bg)); }
.status-toggle :deep(.status-option--disabled.is-checked .status-option__icon) { border-color: #94a3b8; color: #cbd5e1; background: color-mix(in srgb, #94a3b8 14%, transparent); }
.status-toggle :deep(.status-option--disabled.is-checked .status-option__mark) { border-color: #94a3b8; background: #94a3b8; box-shadow: 0 0 0 3px color-mix(in srgb, #94a3b8 16%, transparent); }
.field-tip { display: flex; align-items: flex-start; gap: 4px; margin-top: 6px; color: var(--app-text-muted); font-size: 12px; line-height: 1.45; }
.field-tip :deep(.el-icon) { flex: 0 0 auto; margin-top: 1px; color: var(--el-color-primary); }
.binding-tip { display: flex; align-items: center; gap: 7px; margin: -3px 0 15px; padding: 9px 11px; border: 1px solid color-mix(in srgb, var(--el-color-primary) 16%, var(--app-surface-border)); border-radius: 9px; color: var(--app-text-muted); background: color-mix(in srgb, var(--el-color-primary) 6%, var(--app-surface-bg)); font-size: 12px; line-height: 1.45; }
.binding-tip :deep(.el-icon) { flex: 0 0 auto; color: var(--el-color-primary); }
.form-item--wide { margin-bottom: 17px !important; }
.binding-empty { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 58px; margin: 0 0 16px; border: 1px dashed color-mix(in srgb, var(--el-color-primary) 28%, var(--app-surface-border)); border-radius: 10px; color: var(--app-text-muted); background: color-mix(in srgb, var(--app-surface-bg) 76%, transparent); font-size: 12px; }
.binding-empty :deep(.el-icon) { color: var(--el-color-primary); }
.form-section--remark { padding-bottom: 1px; }
.form-section--remark :deep(.el-form-item) { margin-bottom: 14px; }
.dialog-footer { align-items: center; }
.footer-hint { margin-right: auto; color: var(--app-text-muted); font-size: 12px; }
.dialog-footer > div { display: flex; gap: 8px; }
.dialog-footer :deep(.el-button) { min-width: 82px; border-radius: 9px; }

@media (max-width: 720px) {
  :deep(.business-type-dialog) { width: calc(100vw - 24px) !important; }
  .form-grid--two { grid-template-columns: 1fr; }
  .footer-hint { display: none; }
}

@media (max-width: 1100px) { .toolbar__actions { width: 100%; } }
</style>
