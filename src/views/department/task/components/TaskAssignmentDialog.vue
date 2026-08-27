<template>
  <el-dialog v-model="visible" :title="`成员分配：${selectedRule?.taskName || ''}`" width="820px" class="task-assignment-dialog" append-to-body>
    <div class="assignment-dialog">
      <div class="assignment-dialog__intro">
        <span class="assignment-dialog__intro-icon"><el-icon><UserFilled /></el-icon></span>
        <div class="assignment-dialog__intro-content">
          <strong>只为已分配成员生成任务要求</strong>
          <p v-if="selectedRule?.taskType === 'DAILY_REPORT'">日报成员还需单独配置工作日和每日提醒时间，休息日不会产生日报要求。</p>
          <p v-else>成员分配后才会纳入任务统计、提醒和完成情况。</p>
        </div>
        <el-tag type="info" effect="plain">已分配 {{ assignments.length }} 人</el-tag>
      </div>

      <div class="assignment-form-card">
        <div class="assignment-block-heading">
          <div>
            <h4>{{ isEditing ? '编辑成员配置' : '添加成员' }}</h4>
            <p>{{ isEditing ? '修改成员的任务生效时间、状态及日报执行配置' : `设置成员的任务生效时间${selectedRule?.taskType === 'DAILY_REPORT' ? '、工作日和提醒时间' : ''}` }}</p>
          </div>
          <span class="assignment-block-heading__step">STEP 01</span>
        </div>
        <el-form :model="form" label-width="76px" class="assignment-form">
          <div class="assignment-form__grid">
            <el-form-item label="成员" class="assignment-field assignment-field--member">
              <el-select v-model="form.userId" filterable clearable placeholder="选择成员" :disabled="isEditing" style="width: 100%">
                <el-option v-for="item in userOptions" :key="item.userId" :label="`${item.nickName || item.userName}（${item.userName}）`" :value="item.userId" />
              </el-select>
            </el-form-item>
            <el-form-item label="生效开始" class="assignment-field assignment-field--start">
              <el-date-picker v-model="form.effectiveStart" type="date" value-format="YYYY-MM-DD" placeholder="立即生效" clearable style="width: 100%" />
            </el-form-item>
            <template v-if="selectedRule?.taskType === 'DAILY_REPORT'">
              <el-form-item label="工作日" class="assignment-field assignment-field--days">
                <el-checkbox-group :model-value="workDays" class="assignment-workdays" @update:model-value="updateWorkDays">
                  <el-checkbox v-for="item in weekOptions" :key="item.value" :label="item.value">{{ item.label }}</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="提醒时间" class="assignment-field assignment-field--time">
                <el-time-picker v-model="form.reminderTime" value-format="HH:mm:ss" placeholder="18:00:00" style="width: 100%" />
              </el-form-item>
            </template>
            <div class="assignment-form__action">
              <el-button type="primary" :icon="isEditing ? 'Check' : 'Plus'" @click="emit('save')">{{ isEditing ? '保存修改' : '添加分配' }}</el-button>
              <el-button v-if="isEditing" @click="emit('cancel-edit')">取消编辑</el-button>
            </div>
          </div>
        </el-form>
      </div>

      <div class="assignment-list">
        <div class="assignment-block-heading assignment-list__heading">
          <div>
            <h4>已分配成员</h4>
            <p>可在下方查看成员的生效范围和日报执行配置</p>
          </div>
          <span class="assignment-block-heading__step">STEP 02</span>
        </div>
        <el-table v-loading="loading" :data="assignments" border class="assignment-table">
          <el-table-column label="成员" min-width="170"><template #default="scope"><span class="assignment-member-name">{{ scope.row.nickName || scope.row.userName }}</span></template></el-table-column>
          <el-table-column label="账号" prop="userName" width="145" />
          <el-table-column label="生效时间" min-width="205" align="center"><template #default="scope">{{ scope.row.effectiveStart || '立即' }} 至 {{ scope.row.effectiveEnd || '长期' }}</template></el-table-column>
          <el-table-column v-if="selectedRule?.taskType === 'DAILY_REPORT'" label="工作日 / 提醒" min-width="165" align="center"><template #default="scope">{{ workDayLabel(scope.row.workDays) }} / {{ scope.row.reminderTime || '18:00:00' }}</template></el-table-column>
          <el-table-column label="状态" width="90" align="center"><template #default="scope"><el-tag :type="scope.row.status === 'DISABLED' ? 'info' : 'success'">{{ scope.row.status === 'DISABLED' ? '停用' : '启用' }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="116" align="center">
            <template #default="scope">
              <el-button v-hasPermi="['department:task:edit']" link type="primary" icon="Edit" @click="editRow(scope.row)">编辑</el-button>
              <el-button v-hasPermi="['department:task:edit']" link type="danger" icon="Delete" @click="removeRow(scope.row)" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <template #footer><el-button @click="visible = false">关闭</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { UserFilled } from '@element-plus/icons-vue';
import type { DepartmentTaskAssignmentForm, DepartmentTaskAssignmentVO, DepartmentTaskRuleVO } from '@/api/department/task/types';
import type { PersonUserOptionVO } from '@/api/department/person/types';

interface WeekOption {
  label: string;
  value: string;
}

const props = defineProps<{
  modelValue: boolean;
  selectedRule?: DepartmentTaskRuleVO;
  userOptions: PersonUserOptionVO[];
  assignments: DepartmentTaskAssignmentVO[];
  loading: boolean;
  form: DepartmentTaskAssignmentForm;
  workDays: string[];
  weekOptions: WeekOption[];
  workDayLabel: (value?: string) => string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'update:workDays': [value: string[]];
  save: [];
  'cancel-edit': [];
  edit: [row: DepartmentTaskAssignmentVO];
  remove: [row: DepartmentTaskAssignmentVO];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const { selectedRule, userOptions, assignments, loading, form, workDays, weekOptions, workDayLabel } = toRefs(props);
const isEditing = computed(() => Boolean(props.form.id));
const updateWorkDays = (value: string[] | number[]) => emit('update:workDays', value.map(String));
const editRow = (row: unknown) => emit('edit', row as DepartmentTaskAssignmentVO);
const removeRow = (row: unknown) => emit('remove', row as DepartmentTaskAssignmentVO);
</script>
