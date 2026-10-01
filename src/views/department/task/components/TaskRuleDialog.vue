<template>
  <UiDialog v-model="visible" :title="title" width="720px" class="task-rule-dialog" show-footer append-to-body>
    <el-form ref="formRef" :model="form" :rules="ruleRules" label-width="98px" class="rule-form">
      <section class="rule-form__section">
        <div class="rule-form__section-heading">
          <span class="rule-form__section-index">01</span>
          <div><h4>基础信息</h4><p>定义任务名称和执行类型</p></div>
        </div>
        <el-row :gutter="18">
          <el-col :xs="24" :sm="14">
            <el-form-item label="任务名称" prop="taskName"><UiInput v-model="form.taskName" :maxlength="100" placeholder="例如：每日提交工作日报" /></el-form-item>
          </el-col>
          <el-col :xs="24" :sm="10">
            <el-form-item label="任务类型" prop="taskType">
              <UiSelect v-model="form.taskType" :options="taskTypeOptions" style="width: 100%" @change="emit('task-type-change')" />
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <template v-if="form.taskType === 'DAILY_REPORT'">
        <section class="daily-rule-panel">
          <div class="daily-rule-panel__heading">
            <span class="daily-rule-panel__icon"><el-icon><Calendar /></el-icon></span>
            <div class="daily-rule-panel__title-wrap"><div class="daily-rule-panel__title">日报执行规则</div><div class="daily-rule-panel__subtitle">按成员个人工作日逐日检查完成情况</div></div>
            <UiTag type="success" effect="light">按成员执行</UiTag>
          </div>
          <div class="daily-rule-grid">
            <div><span>执行频率</span><strong>每个工作日</strong></div><div><span>完成要求</span><strong>1 条日报</strong></div><div><span>工作日</span><strong>成员独立配置</strong></div><div><span>提醒时间</span><strong>成员独立配置</strong></div>
          </div>
          <div class="daily-rule-panel__note"><el-icon><InfoFilled /></el-icon><span>休息日不会产生日报要求，未分配成员也不会计入提醒和缺报。</span></div>
        </section>
      </template>

      <template v-else>
        <section class="rule-form__section">
          <div class="rule-form__section-heading"><span class="rule-form__section-index">02</span><div><h4>执行规则</h4><p>设置任务周期、统计口径和提醒方式</p></div></div>
          <el-row :gutter="18">
            <el-col :xs="24" :sm="12"><el-form-item label="周期" prop="cycleType"><UiSelect v-model="form.cycleType" :options="cycleOptions" style="width: 100%" /></el-form-item></el-col>
            <el-col :xs="24" :sm="12"><el-form-item label="要求次数" prop="requiredCount"><UiNumberInput v-model="form.requiredCount" :min="1" :max="999" controls-position="right" style="width: 100%" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="18">
            <el-col :xs="24" :sm="12"><el-form-item label="截止日"><UiNumberInput v-model="form.deadlineDay" :min="0" :max="31" controls-position="right" style="width: 100%" /><div class="form-help">0 表示周期最后一天；每月可填 1-31。</div></el-form-item></el-col>
            <el-col :xs="24" :sm="12"><el-form-item label="截止时间"><UiTimePicker v-model="form.deadlineTime" value-format="HH:mm:ss" placeholder="18:00:00" style="width: 100%" /></el-form-item></el-col>
          </el-row>
          <el-row :gutter="18">
            <el-col :xs="24" :sm="12"><el-form-item label="完成口径"><UiSelect v-model="form.countMode" :options="countModeOptions" style="width: 100%" /></el-form-item></el-col>
            <el-col :xs="24" :sm="12"><el-form-item label="提前提醒(小时)"><UiNumberInput v-model="form.remindHours" :min="0" :max="720" controls-position="right" style="width: 100%" /></el-form-item></el-col>
          </el-row>
        </section>
      </template>

      <section class="rule-form__section rule-form__section--last">
        <div class="rule-form__section-heading"><span class="rule-form__section-index">{{ form.taskType === 'DAILY_REPORT' ? '02' : '03' }}</span><div><h4>生效与状态</h4><p>控制规则生效范围，并补充必要说明</p></div></div>
        <el-row :gutter="18">
          <el-col :xs="24" :sm="12"><el-form-item label="生效开始"><UiDatePicker v-model="form.effectiveStart" type="date" value-format="YYYY-MM-DD" placeholder="不填则立即生效" clearable style="width: 100%" /></el-form-item></el-col>
          <el-col :xs="24" :sm="12"><el-form-item label="生效结束"><UiDatePicker v-model="form.effectiveEnd" type="date" value-format="YYYY-MM-DD" placeholder="不填则长期有效" clearable style="width: 100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="状态" class="rule-status-item"><UiRadioGroup v-model="form.status" :options="statusOptions" /></el-form-item>
        <el-form-item label="备注"><UiTextarea v-model="form.remark" :rows="3" :maxlength="500" show-word-limit placeholder="补充任务执行要求或特殊说明" /></el-form-item>
      </section>
    </el-form>
    <template #footer><div class="rule-dialog-footer"><UiButton @click="visible = false">取消</UiButton><UiButton type="primary" :loading="loading" @click="submit">保存规则</UiButton></div></template>
  </UiDialog>
</template>

<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { Calendar, InfoFilled } from '@element-plus/icons-vue';
import type { DepartmentTaskRuleForm } from '@/api/department/task/types';
import { UiButton, UiDatePicker, UiDialog, UiInput, UiNumberInput, UiRadioGroup, UiSelect, UiTag, UiTextarea, UiTimePicker } from '@/components/UiKit';

const props = defineProps<{ modelValue: boolean; title: string; form: DepartmentTaskRuleForm; loading: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; 'task-type-change': []; save: [] }>();
const { title, form, loading } = toRefs(props);
const visible = computed({ get: () => props.modelValue, set: (value: boolean) => emit('update:modelValue', value) });
const formRef = ref<ElFormInstance>();
const taskTypeOptions = [{ value: 'SCORE_PROPOSAL', label: 'SCORE提案' }, { value: 'FIVE_WHY', label: '5WHY分析' }, { value: 'DAILY_REPORT', label: '日报' }];
const cycleOptions = [{ value: 'WEEK', label: '每周' }, { value: 'MONTH', label: '每月' }, { value: 'QUARTER', label: '每季度' }];
const countModeOptions = [{ value: 'SUBMITTED', label: '已提交' }, { value: 'APPROVED', label: '审核通过' }];
const statusOptions = [{ value: 'ENABLED', label: '启用' }, { value: 'DISABLED', label: '停用' }];
const ruleRules = { taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }], taskType: [{ required: true, message: '请选择任务类型', trigger: 'change' }], cycleType: [{ required: true, message: '请选择周期', trigger: 'change' }], requiredCount: [{ required: true, message: '请输入要求次数', trigger: 'change' }] };
const submit = () => { formRef.value?.validate(valid => { if (valid) emit('save'); }); };
</script>
