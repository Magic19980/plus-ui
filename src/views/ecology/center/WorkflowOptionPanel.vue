<template>
  <div class="workflow-option-panel">
    <div class="panel-toolbar">
      <div>
        <div class="panel-kicker"><span class="kicker-dot" /> APPROVAL OPTIONS</div>
        <h3>审批方式配置</h3>
        <p>维护可跨泛微表单复用的审批方式和审批节点规则。</p>
      </div>
      <el-button v-hasPermi="['ecology:workflowConfig:add']" type="primary" icon="Plus" @click="openAdd">新增审批方式</el-button>
    </div>

    <el-alert title="审批方式是通用配置；这里维护系统编码和审批节点。不同泛微表单的实际值，请在对应表单的“审批方式”字段选项中填写。" type="info" :closable="false" show-icon class="panel-guide" />
    <el-table v-loading="loading" :data="rows" border class="config-table" row-key="id">
      <el-table-column label="审批方式" min-width="250">
        <template #default="scope"><div class="option-cell"><span class="option-cell__icon"><el-icon><Finished /></el-icon></span><div><strong>{{ scope.row.optionName }}</strong><small>系统编码：{{ scope.row.optionCode }}</small></div></div></template>
      </el-table-column>
      <el-table-column label="节点字段映射" min-width="320" show-overflow-tooltip><template #default="scope">{{ stageSummary(asOption(scope.row)) }}</template></el-table-column>
      <el-table-column label="显示顺序" prop="sortNo" width="100" align="center" />
      <el-table-column label="状态" width="90" align="center"><template #default="scope"><el-tag :type="scope.row.status === 'ENABLED' ? 'success' : 'info'" effect="plain">{{ scope.row.status === 'ENABLED' ? '启用' : '停用' }}</el-tag></template></el-table-column>
      <el-table-column label="备注" prop="remark" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" fixed="right" width="150" align="center"><template #default="scope"><DepartmentTableActions><el-button v-hasPermi="['ecology:workflowConfig:edit']" link type="primary" @click="openEdit(asOption(scope.row))">编辑</el-button><el-button v-hasPermi="['ecology:workflowConfig:remove']" link type="danger" @click="remove(asOption(scope.row))">删除</el-button></DepartmentTableActions></template></el-table-column>
    </el-table>
    <el-empty v-if="!loading && !rows.length" description="暂无通用审批方式，请先新增配置" />

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="820px" append-to-body destroy-on-close class="option-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="dialog-summary"><span class="summary-icon"><el-icon><Finished /></el-icon></span><div><strong>通用审批方式</strong><small>同一审批方式可被多个泛微表单和业务类型复用。</small></div></div>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="审批方式名称" prop="optionName"><el-input v-model="form.optionName" maxlength="100" placeholder="如：依次签、会签、部门负责人审批" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="系统审批方式编码" prop="optionCode"><el-input v-model="form.optionCode" maxlength="64" placeholder="如：SEQUENTIAL、COUNTERSIGN，需全局唯一" /></el-form-item></el-col>
        </el-row>
        <div class="section-title"><span>审批节点字段映射</span><small>只有节点字段随审批方式变化时在这里维护</small></div>
        <div class="stage-list">
          <div v-for="(stage, index) in mapping.stages" :key="stage.key" class="stage-row">
            <span class="stage-index">{{ index + 1 }}</span>
            <el-input v-model="stage.code" class="stage-code" placeholder="节点编码，如 STAGE_1" />
            <el-input v-model="stage.name" class="stage-name" placeholder="节点名称，如 一级会签" />
            <el-input v-model="stage.fieldCode" class="stage-field" placeholder="泛微人员字段，如 ycq1" />
            <el-select v-model="stage.mode" class="stage-mode"><el-option label="依次签" value="SEQUENTIAL" /><el-option label="会签" value="COUNTERSIGN" /><el-option label="或签" value="OR_SIGN" /></el-select>
            <el-checkbox v-model="stage.required" class="stage-required">必填</el-checkbox>
            <el-button link type="danger" @click="removeStage(index)">删除</el-button>
          </div>
          <el-button type="primary" plain icon="Plus" @click="addStage">新增审批节点</el-button>
        </div>
        <div class="mapping-tip">申请标题、内容、申请人、申请日期、审批方式、抄送和附件等公用字段在“表单配置”中维护；这里只配置本审批方式的节点编码、泛微人员字段和顺序，用户在审批方案中维护。</div>
        <el-row :gutter="16" class="bottom-row"><el-col :span="8"><el-form-item label="显示顺序"><el-input-number v-model="form.sortNo" :min="0" :max="999" /></el-form-item></el-col><el-col :span="8"><el-form-item label="状态"><el-switch v-model="form.status" active-value="ENABLED" inactive-value="DISABLED" /></el-form-item></el-col></el-row>
        <el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" maxlength="1000" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button type="primary" :loading="saving" @click="save">保存审批方式</el-button><el-button @click="dialog.visible = false">取消</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Finished } from '@element-plus/icons-vue';
import modal from '@/plugins/modal';
import DepartmentTableActions from '@/components/Department/TableActions.vue';
import { delOaWorkflowOption, listOaWorkflowOptions, saveOaWorkflowOption } from '@/api/ecology';
import type { OaWorkflowOptionForm, OaWorkflowOptionVO } from '@/api/ecology/types';

type Stage = { key: number; code: string; name: string; fieldCode: string; mode: string; required: boolean; sortNo: number };
const rows = ref<OaWorkflowOptionVO[]>([]);
const loading = ref(false);
const saving = ref(false);
const formRef = ref<ElFormInstance>();
const dialog = reactive({ visible: false, title: '' });
const form = reactive<OaWorkflowOptionForm>(newOption());
const mapping = reactive<{ stages: Stage[] }>({ stages: [] });
const rules = { optionName: [{ required: true, message: '请输入审批方式名称', trigger: 'blur' }], optionCode: [{ required: true, message: '请输入系统审批方式编码', trigger: 'blur' }] };
const asOption = (row: any): OaWorkflowOptionVO => row;

function newOption(): OaWorkflowOptionForm { return { id: undefined, optionCode: '', optionName: '', participantMappingJson: '', sortNo: 0, status: 'ENABLED', remark: '' }; }
function emptyStage(index = mapping.stages.length + 1): Stage { return { key: Date.now() + index, code: 'STAGE_' + index, name: '', fieldCode: '', mode: 'SEQUENTIAL', required: true, sortNo: index }; }
function parseMapping(value?: string) {
  mapping.stages.splice(0);
  if (value) {
    try {
      const parsed = JSON.parse(value);
      const stages = Array.isArray(parsed.stages) ? parsed.stages : [];
      stages.forEach((item: any, index: number) => mapping.stages.push({ key: Date.now() + index, code: item.code || 'STAGE_' + (index + 1), name: item.name || '', fieldCode: item.fieldCode || item.field || '', mode: item.mode || 'SEQUENTIAL', required: item.required !== false, sortNo: index + 1 }));
    } catch {
      // 数据异常时仍给出一个可修复的默认节点。
    }
  }
  if (!mapping.stages.length) mapping.stages.push(emptyStage());
}
function serializedMapping() { return JSON.stringify({ stages: mapping.stages.map((item, index) => ({ code: item.code.trim().toUpperCase(), name: item.name.trim() || '审批节点' + (index + 1), fieldCode: item.fieldCode.trim(), mode: item.mode, sortNo: index + 1, required: item.required !== false })) }); }
const stageSummary = (row: OaWorkflowOptionVO) => { try { const stages = JSON.parse(row.participantMappingJson || '{}').stages || []; return stages.map((item: any) => (item.name || item.code) + '（' + (item.fieldCode || item.field || '未填') + '）').join('、') || '未配置节点'; } catch { return '节点映射格式有误'; } };
const loadData = async () => { loading.value = true; try { rows.value = (await listOaWorkflowOptions(false)).data || []; } finally { loading.value = false; } };
const resetForm = () => { Object.assign(form, newOption()); parseMapping(); };
const openAdd = () => { resetForm(); form.sortNo = rows.value.length; dialog.title = '新增通用审批方式'; dialog.visible = true; };
const openEdit = (row: OaWorkflowOptionVO) => { Object.assign(form, { ...newOption(), ...row }); parseMapping(row.participantMappingJson); dialog.title = '编辑通用审批方式'; dialog.visible = true; };
const addStage = () => mapping.stages.push(emptyStage());
const removeStage = (index: number) => { if (mapping.stages.length === 1) return modal.msgWarning('至少配置一个审批节点'); mapping.stages.splice(index, 1); };
const save = async () => { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; if (!mapping.stages.length || mapping.stages.some((item) => !item.code.trim() || !item.fieldCode.trim())) return modal.msgWarning('请完善审批节点编码和泛微字段编码'); form.participantMappingJson = serializedMapping(); saving.value = true; try { await saveOaWorkflowOption(form); modal.msgSuccess('通用审批方式保存成功'); dialog.visible = false; await loadData(); } finally { saving.value = false; } };
const remove = async (row: OaWorkflowOptionVO) => { await modal.confirm('确认删除“' + row.optionName + '”审批方式吗？'); await delOaWorkflowOption(row.id!); modal.msgSuccess('删除成功'); await loadData(); };
onMounted(loadData);
</script>

<style scoped lang="scss">
.panel-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }.panel-kicker { color: var(--el-color-primary); font-size: 11px; font-weight: 800; letter-spacing: .15em; }.kicker-dot { display: inline-block; width: 7px; height: 7px; margin-right: 6px; border-radius: 50%; background: var(--el-color-primary); }.panel-toolbar h3 { margin: 8px 0 5px; color: var(--app-text-title); font-size: 20px; }.panel-toolbar p { margin: 0; color: var(--el-text-color-secondary); font-size: 12px; }.panel-toolbar > :deep(.el-button) { border-radius: 9px; }.panel-guide { margin: 15px 0; border-radius: 10px; }.config-table { border-radius: 10px; overflow: hidden; }.option-cell { display: flex; align-items: center; gap: 10px; }.option-cell__icon, .summary-icon { display: inline-flex; align-items: center; justify-content: center; color: var(--el-color-primary); background: var(--el-color-primary-light-9); }.option-cell__icon { width: 34px; height: 34px; border-radius: 10px; font-size: 17px; }.option-cell strong, .option-cell small { display: block; }.option-cell small { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 11px; }.option-dialog :deep(.el-dialog__body) { padding: 8px 24px 14px; }.dialog-summary { display: flex; align-items: center; gap: 11px; margin-bottom: 20px; padding: 12px 14px; border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--app-surface-border)); border-radius: 10px; background: color-mix(in srgb, var(--el-color-primary) 6%, var(--app-surface-bg)); }.summary-icon { width: 34px; height: 34px; border-radius: 10px; font-size: 17px; }.dialog-summary strong, .dialog-summary small { display: block; }.dialog-summary strong { color: var(--app-text-title); }.dialog-summary small { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; }.section-title { display: flex; align-items: baseline; gap: 10px; margin: 10px 0 14px; color: var(--app-text-title); font-weight: 700; }.section-title small { color: var(--el-text-color-secondary); font-size: 12px; font-weight: 400; }.stage-list { padding: 12px; border: 1px solid var(--app-surface-border); border-radius: 10px; background: var(--el-fill-color-lighter); }.stage-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }.stage-index { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-size: 12px; }.stage-code { width: 125px; }.stage-name { flex: 1; min-width: 130px; }.stage-field { width: 145px; }.stage-mode { width: 110px; }.stage-required { width: 50px; margin: 0; }.mapping-tip { margin-top: 10px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.6; }.bottom-row { margin-top: 12px; }.option-dialog :deep(.el-input__wrapper), .option-dialog :deep(.el-select__wrapper), .option-dialog :deep(.el-textarea__inner) { border-radius: 9px; }
@media (max-width: 760px) { .panel-toolbar { align-items: stretch; flex-direction: column; }.stage-row { align-items: stretch; flex-wrap: wrap; }.stage-code, .stage-name, .stage-field, .stage-mode { width: calc(50% - 16px); }.stage-required { width: auto; } }
</style>
