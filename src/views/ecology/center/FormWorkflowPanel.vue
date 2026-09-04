<template>
  <div class="form-workflow-panel">
    <div class="panel-toolbar">
      <div>
        <div class="panel-kicker"><span class="kicker-dot" /> FORM DEFINITIONS</div>
        <h3>表单配置</h3>
        <p>维护泛微表单和字段规则，审批方式在另一页签统一维护。</p>
      </div>
      <el-button v-hasPermi="['ecology:workflowConfig:add']" type="primary" icon="Plus" @click="openAdd">新增表单</el-button>
    </div>

    <el-alert title="先填写 workflowId，再按泛微表单逐项维护字段。选择类字段的选项值必须填写泛微实际值；业务提交时会按这里的配置自动组装表单。" type="info" :closable="false" show-icon class="panel-guide" />

    <el-table v-loading="loading" :data="rows" border class="config-table" row-key="id">
      <el-table-column label="表单名称" min-width="270">
        <template #default="scope">
          <div class="form-cell"><span class="form-cell__icon"><el-icon><Document /></el-icon></span><div><strong>{{ scope.row.formName }}</strong><small>{{ scope.row.workflowId }}</small></div></div>
        </template>
      </el-table-column>
      <el-table-column label="字段" width="100" align="center"><template #default="scope"><el-tag effect="plain" type="info">{{ fieldCount(scope.row) }} 项</el-tag></template></el-table-column>
      <el-table-column label="申请名称模板" prop="requestNameTemplate" min-width="230" show-overflow-tooltip />
      <el-table-column label="状态" width="110" align="center"><template #default="scope"><el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'" effect="plain">{{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}</el-tag></template></el-table-column>
      <el-table-column label="备注" prop="remark" min-width="190" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="150" align="center"><template #default="scope"><DepartmentTableActions><el-button v-hasPermi="['ecology:workflowConfig:edit']" link type="primary" @click="openEdit(asForm(scope.row))">编辑</el-button><el-button v-hasPermi="['ecology:workflowConfig:remove']" link type="danger" @click="remove(asForm(scope.row))">删除</el-button></DepartmentTableActions></template></el-table-column>
    </el-table>
    <el-empty v-if="!loading && rows.length === 0" description="暂无表单，请先新增表单配置" />

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="1080px" append-to-body destroy-on-close class="form-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="dialog-summary"><span class="summary-icon"><el-icon><Document /></el-icon></span><div><strong>泛微表单基本信息</strong><small>表单只配置一次，业务类型配置中选择使用哪个表单</small></div></div>
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="表单名称" prop="formName"><el-input v-model="form.formName" maxlength="100" placeholder="如：结算单（公用）" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="泛微 workflowId" prop="workflowId"><el-input v-model="form.workflowId" maxlength="64" placeholder="如：63526" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="申请名称模板"><el-input v-model="form.requestNameTemplate" maxlength="200" placeholder="可用 {businessType}、{formName}、{title}、{applicationNo}" /></el-form-item>

        <div class="schema-heading"><div><strong>表单字段</strong><span>把泛微页面中的字段翻译成用户看得懂的输入项</span></div><el-button type="primary" plain icon="Plus" @click="addField">新增字段</el-button></div>
        <el-alert title="字段标识是系统内部名称；泛微字段编码和选择项实际值请按泛微页面填写。审批方式字段请将语义类型设为“审批方式”，并在选项中填写对应的全局审批方式编码和泛微实际值。" type="warning" :closable="false" show-icon class="schema-guide" />
        <div class="schema-table-wrap">
          <el-table :data="fieldRows" border class="schema-table" empty-text="暂无字段，请点击右上角新增字段">
            <el-table-column label="字段标识" min-width="145"><template #default="scope"><el-input v-model="scope.row.key" size="small" placeholder="如 amount" /></template></el-table-column>
            <el-table-column label="显示名称" min-width="150"><template #default="scope"><el-input v-model="scope.row.label" size="small" placeholder="如 审批金额" /></template></el-table-column>
            <el-table-column label="泛微字段编码" min-width="160"><template #default="scope"><el-input v-model="scope.row.oaFieldCode" size="small" placeholder="如 field90109" /></template></el-table-column>
            <el-table-column label="控件" width="145"><template #default="scope"><el-select v-model="scope.row.controlType" size="small" @change="handleFieldTypeChange(asField(scope.row))"><el-option v-for="item in controlTypes" :key="item.value" :label="item.label" :value="item.value" /></el-select></template></el-table-column>
            <el-table-column label="语义" width="145"><template #default="scope"><el-select v-model="scope.row.semanticType" size="small"><el-option v-for="item in semanticTypes" :key="item.value" :label="item.label" :value="item.value" /></el-select></template></el-table-column>
            <el-table-column label="必填" width="65" align="center"><template #default="scope"><el-switch v-model="scope.row.required" size="small" /></template></el-table-column>
            <el-table-column label="多选" width="65" align="center"><template #default="scope"><el-switch v-if="scope.row.controlType === 'SELECT'" v-model="scope.row.multiple" size="small" /><span v-else class="schema-muted">—</span></template></el-table-column>
            <el-table-column label="选项" width="90" align="center"><template #default="scope"><el-button v-if="isChoice(asField(scope.row))" link type="primary" @click="openOptions(scope.$index)">维护选项</el-button><span v-else class="schema-muted">—</span></template></el-table-column>
            <el-table-column label="操作" width="70" align="center"><template #default="scope"><el-button link type="danger" icon="Delete" @click="removeField(scope.$index)" /></template></el-table-column>
          </el-table>
        </div>
        <div class="schema-footnote">共 {{ fieldRows.length }} 个字段。保存后，申请人只会看到显示名称、控件和选项，不需要接触泛微字段编码。</div>
        <el-form-item label="状态" class="dialog-status"><el-radio-group v-model="form.status"><el-radio label="ENABLED">启用</el-radio><el-radio label="DISABLED">停用</el-radio></el-radio-group></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" maxlength="1000" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="saving" @click="save">保存表单</el-button><el-button @click="dialog.visible = false">取消</el-button></template>
    </el-dialog>

    <el-dialog v-model="optionDialog.visible" title="维护字段选项" width="680px" append-to-body destroy-on-close class="option-dialog">
      <div class="option-dialog__hint">选项名称给用户看；泛微实际值原样传给泛微。审批方式字段还要填写全局审批方式编码，才能和审批方式配置关联。</div>
      <el-table :data="optionRows" border class="option-table">
        <el-table-column label="选项名称" min-width="180"><template #default="scope"><el-input v-model="scope.row.label" size="small" placeholder="如：会签" /></template></el-table-column>
        <el-table-column v-if="isApprovalField()" label="审批方式编码" min-width="160"><template #default="scope"><el-input v-model="scope.row.optionCode" size="small" placeholder="如 COUNTERSIGN" /></template></el-table-column>
        <el-table-column label="泛微实际值" min-width="160"><template #default="scope"><el-input v-model="scope.row.oaValue" size="small" placeholder="如 1" /></template></el-table-column>
        <el-table-column label="操作" width="70" align="center"><template #default="scope"><el-button link type="danger" icon="Delete" @click="optionRows.splice(scope.$index, 1)" /></template></el-table-column>
      </el-table>
      <el-button class="option-add" type="primary" link icon="Plus" @click="addOption">新增选项</el-button>
      <template #footer><el-button type="primary" @click="saveOptions">确定</el-button><el-button @click="optionDialog.visible = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Document } from '@element-plus/icons-vue';
import modal from '@/plugins/modal';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import { delOaFormWorkflow, getOaFormWorkflow, listOaFormWorkflows, saveOaFormWorkflow } from '@/api/ecology';
import type { OaFormFieldDefinition, OaFormFieldOption, OaFormFieldSchema, OaFormWorkflowForm, OaFormWorkflowVO } from '@/api/ecology/types';

const controlTypes = [{ label: '单行文本', value: 'TEXT' }, { label: '多行文本', value: 'TEXTAREA' }, { label: '数字', value: 'NUMBER' }, { label: '下拉单选/多选', value: 'SELECT' }, { label: '单选', value: 'RADIO' }, { label: '日期', value: 'DATE' }, { label: '日期时间', value: 'DATETIME' }, { label: '人员单选', value: 'USER_SINGLE' }, { label: '人员多选', value: 'USER_MULTI' }, { label: '附件', value: 'FILE' }, { label: '图片', value: 'IMAGE' }];
const semanticTypes = [{ label: '业务字段', value: 'SPECIFIC' }, { label: '申请标题', value: 'TITLE' }, { label: '申请内容', value: 'CONTENT' }, { label: '申请人', value: 'APPLICANT' }, { label: '申请时间', value: 'APPLICANT_DATE' }, { label: '紧急程度', value: 'URGENCY' }, { label: '审批方式', value: 'APPROVAL_MODE' }, { label: '审批人员', value: 'PARTICIPANT' }, { label: '抄送人员', value: 'COPY' }, { label: '附件', value: 'ATTACHMENT' }, { label: '图片', value: 'IMAGE' }, { label: '系统字段', value: 'SYSTEM' }];
const emptySchema = (): OaFormFieldSchema => ({ version: 1, fields: [] });
const newForm = (): OaFormWorkflowForm => ({ id: undefined, workflowId: '', formName: '', requestNameTemplate: '{formName}-{title}', fieldMappingJson: '{}', specificFieldMappingJson: '{}', fieldSchemaJson: JSON.stringify(emptySchema()), status: 'ENABLED', remark: '' });
const rows = ref<OaFormWorkflowVO[]>([]); const loading = ref(false); const saving = ref(false); const formRef = ref<ElFormInstance>(); const form = reactive<OaFormWorkflowForm>(newForm()); const fieldRows = ref<OaFormFieldDefinition[]>([]); const dialog = reactive({ visible: false, title: '' }); const optionDialog = reactive({ visible: false, fieldIndex: -1 }); const optionRows = ref<OaFormFieldOption[]>([]);
const rules = { workflowId: [{ required: true, message: '请输入 workflowId', trigger: 'blur' }], formName: [{ required: true, message: '请输入表单名称', trigger: 'blur' }] }; const asForm = (row: any): OaFormWorkflowVO => row; const asField = (row: any): OaFormFieldDefinition => row; const isChoice = (field: OaFormFieldDefinition) => field.controlType === 'SELECT' || field.controlType === 'RADIO'; const isApprovalField = () => fieldRows.value[optionDialog.fieldIndex]?.semanticType === 'APPROVAL_MODE';
const fieldCount = (row: any) => { try { const schema = JSON.parse(row.fieldSchemaJson || '{}'); return Array.isArray(schema.fields) ? schema.fields.length : 0; } catch { return 0; } };
const readSchema = (value?: string): OaFormFieldDefinition[] => { try { const schema = JSON.parse(value || '{}'); return Array.isArray(schema.fields) ? schema.fields.map((item: OaFormFieldDefinition) => ({ ...item, semanticType: item.semanticType || 'SPECIFIC', required: item.required === true, options: Array.isArray(item.options) ? item.options : [] })) : []; } catch { return []; } };
const syncSchema = () => { form.fieldSchemaJson = JSON.stringify({ version: 1, fields: fieldRows.value }, null, 2); };
const loadList = async () => { loading.value = true; try { rows.value = (await listOaFormWorkflows(false)).data || []; } finally { loading.value = false; } };
const resetForm = () => { Object.assign(form, newForm()); fieldRows.value = []; }; const openAdd = () => { resetForm(); dialog.title = '新增表单'; dialog.visible = true; };
const openEdit = async (row: OaFormWorkflowVO) => { const res = await getOaFormWorkflow(row.id); Object.assign(form, { ...newForm(), ...res.data }); fieldRows.value = readSchema(res.data?.fieldSchemaJson); dialog.title = '编辑表单'; dialog.visible = true; };
const addField = () => { const index = fieldRows.value.length + 1; fieldRows.value.push({ key: `field_${index}`, label: `字段${index}`, oaFieldCode: '', controlType: 'TEXT', semanticType: 'SPECIFIC', required: false, options: [], sortNo: index }); }; const removeField = (index: number) => { fieldRows.value.splice(index, 1); };
const handleFieldTypeChange = (field: OaFormFieldDefinition) => { if (isChoice(field) && !field.options?.length) field.options = [{ label: '', oaValue: '', ...(field.semanticType === 'APPROVAL_MODE' ? { optionCode: '' } : {}) }]; if (!isChoice(field)) field.options = []; };
const openOptions = (index: number) => { optionDialog.fieldIndex = index; optionRows.value = (fieldRows.value[index].options || []).map((item) => ({ ...item })); optionDialog.visible = true; }; const addOption = () => { optionRows.value.push({ label: '', oaValue: '', ...(isApprovalField() ? { optionCode: '' } : {}) }); }; const saveOptions = () => { if (optionDialog.fieldIndex >= 0) fieldRows.value[optionDialog.fieldIndex].options = optionRows.value.map((item) => ({ ...item })); optionDialog.visible = false; };
const save = async () => { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; if (!fieldRows.value.length) { modal.msgWarning('请至少配置一个表单字段'); return; } if (fieldRows.value.some((item) => !item.key || !item.label || !item.oaFieldCode)) { modal.msgWarning('请完善每个字段的标识、显示名称和泛微字段编码'); return; } if (fieldRows.value.some((item) => isChoice(item) && !item.options?.length)) { modal.msgWarning('选择类字段必须维护选项'); return; } syncSchema(); saving.value = true; try { await saveOaFormWorkflow(form); modal.msgSuccess('表单配置保存成功'); dialog.visible = false; await loadList(); } finally { saving.value = false; } };
const remove = async (row: OaFormWorkflowVO) => { await modal.confirm(`确认删除表单“${row.formName}”吗？已绑定该表单的业务将不能继续提交，请先确认影响范围。`); await delOaFormWorkflow(row.id); modal.msgSuccess('表单删除成功'); await loadList(); }; onMounted(loadList);
</script>

<style scoped lang="scss">
.panel-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 15px; }.panel-kicker { color: var(--el-color-primary); font-size: 11px; font-weight: 800; letter-spacing: .15em; }.kicker-dot { display: inline-block; width: 7px; height: 7px; margin-right: 6px; border-radius: 50%; background: var(--el-color-primary); }.panel-toolbar h3 { margin: 8px 0 5px; color: var(--app-text-title); font-size: 20px; }.panel-toolbar p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; }.panel-guide { margin-bottom: 15px; border-radius: 10px; }.config-table { border-radius: 10px; overflow: hidden; }.form-cell { display: flex; align-items: center; gap: 10px; }.form-cell__icon, .summary-icon { display: inline-flex; align-items: center; justify-content: center; color: var(--el-color-primary); background: var(--el-color-primary-light-9); }.form-cell__icon { width: 34px; height: 34px; border-radius: 10px; font-size: 17px; }.form-cell strong, .form-cell small { display: block; }.form-cell small { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 11px; }.form-dialog :deep(.el-dialog__body) { padding: 8px 24px 14px; }.dialog-summary { display: flex; align-items: center; gap: 11px; margin-bottom: 20px; padding: 12px 14px; border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--app-surface-border)); border-radius: 10px; background: color-mix(in srgb, var(--el-color-primary) 6%, var(--app-surface-bg)); }.summary-icon { width: 34px; height: 34px; border-radius: 10px; font-size: 17px; }.dialog-summary strong, .dialog-summary small { display: block; }.dialog-summary small { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }.schema-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 10px 0; }.schema-heading strong, .schema-heading span { display: block; }.schema-heading strong { color: var(--app-text-title); font-size: 16px; }.schema-heading span, .schema-footnote, .schema-muted, .option-dialog__hint { color: var(--el-text-color-secondary); font-size: 12px; }.schema-heading span { margin-top: 4px; }.schema-guide { margin-bottom: 10px; border-radius: 8px; }.schema-table-wrap { border: 1px solid var(--app-surface-border); border-radius: 9px; overflow: hidden; }.schema-table :deep(.el-input__wrapper), .schema-table :deep(.el-select__wrapper), .option-table :deep(.el-input__wrapper) { border-radius: 6px; }.schema-footnote { margin: 8px 0 16px; }.option-dialog__hint { margin-bottom: 14px; line-height: 1.6; }.option-table { border-radius: 8px; overflow: hidden; }.option-add { margin-top: 12px; }.dialog-status { margin-top: 4px; }.form-dialog :deep(.el-input__wrapper), .form-dialog :deep(.el-select__wrapper), .form-dialog :deep(.el-textarea__inner) { border-radius: 9px; }
@media (max-width: 900px) { .panel-toolbar { align-items: stretch; flex-direction: column; } }
</style>
