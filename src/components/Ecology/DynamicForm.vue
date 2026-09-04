<template>
  <div class="dynamic-form">
    <div v-if="fields.length" class="dynamic-form__summary">
      <div>
        <strong>填写申请信息</strong>
        <span>带 <i>*</i> 的字段为必填项</span>
      </div>
      <el-tag size="small" effect="plain" type="info">{{ fields.length }} 个字段</el-tag>
    </div>
    <div v-if="fields.length" class="dynamic-form__grid">
      <div v-for="field in fields" :key="field.key" class="dynamic-field" :class="fieldClass(field)">
        <label class="dynamic-field__label"><span><span v-if="field.required" class="required-mark">*</span>{{ field.label }}</span><small v-if="!field.required">选填</small></label>
        <el-input v-if="field.controlType === 'TEXT'" :model-value="localModel[field.key]" :placeholder="field.placeholder || `请输入${field.label}`" @update:model-value="setValue(field.key, $event)" />
        <el-input v-else-if="field.controlType === 'TEXTAREA'" type="textarea" :rows="4" :model-value="localModel[field.key]" :placeholder="field.placeholder || `请输入${field.label}`" @update:model-value="setValue(field.key, $event)" />
        <el-input-number v-else-if="field.controlType === 'NUMBER'" class="dynamic-field__number" :model-value="toNumber(localModel[field.key])" controls-position="right" :placeholder="field.placeholder || `请输入${field.label}`" @update:model-value="setValue(field.key, $event)" />
        <el-select v-else-if="field.controlType === 'SELECT'" class="dynamic-field__control" :model-value="localModel[field.key]" :multiple="field.multiple === true" collapse-tags collapse-tags-tooltip clearable filterable :placeholder="field.placeholder || `请选择${field.label}`" @update:model-value="setValue(field.key, $event)"><el-option v-for="option in field.options || []" :key="option.oaValue" :label="option.label" :value="option.oaValue" /></el-select>
        <el-radio-group v-else-if="field.controlType === 'RADIO'" :model-value="localModel[field.key]" @update:model-value="setValue(field.key, $event)"><el-radio v-for="option in field.options || []" :key="option.oaValue" :value="option.oaValue">{{ option.label }}</el-radio></el-radio-group>
        <el-date-picker v-else-if="field.controlType === 'DATE'" class="dynamic-field__control" type="date" value-format="YYYY-MM-DD" :model-value="localModel[field.key]" :placeholder="field.placeholder || `请选择${field.label}`" @update:model-value="setValue(field.key, $event)" />
        <el-date-picker v-else-if="field.controlType === 'DATETIME'" class="dynamic-field__control" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" :model-value="localModel[field.key]" :placeholder="field.placeholder || `请选择${field.label}`" @update:model-value="setValue(field.key, $event)" />
        <div v-else-if="field.controlType === 'USER_SINGLE' || field.controlType === 'USER_MULTI'" class="dynamic-user-field"><el-button plain @click="openUserSelector(field)"><el-icon><User /></el-icon>{{ userSelectionText(field) }}</el-button><div v-if="selectedUsers[field.key]?.length" class="dynamic-user-field__tags"><el-tag v-for="user in selectedUsers[field.key]" :key="user.userId" closable @close="removeUser(field, user.userId)">{{ user.nickName }}</el-tag></div></div>
        <FileUpload v-else-if="field.controlType === 'FILE'" :model-value="attachmentValue('FILE')" :limit="10" :is-show-tip="false" @update:model-value="updateAttachments('FILE', $event)" />
        <ImageUpload v-else-if="field.controlType === 'IMAGE'" :model-value="attachmentValue('IMAGE')" :limit="10" :is-show-tip="false" @update:model-value="updateAttachments('IMAGE', $event)" />
        <div v-if="field.controlType === 'SELECT' && field.multiple" class="dynamic-field__hint">支持多选</div>
      </div>
    </div>
    <el-empty v-else :description="emptyText" :image-size="60" />

    <UserSelect ref="userSelectorRef" :multiple="activeUserField?.controlType === 'USER_MULTI'" :data="activeUserIds" @confirm-call-back="setUserSelection" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { User } from '@element-plus/icons-vue';
import FileUpload from '@/components/FileUpload/index.vue';
import ImageUpload from '@/components/ImageUpload/index.vue';
import UserSelect from '@/components/UserSelect/index.vue';
import type { UserVO } from '@/api/system/user/types';
import type { OaFormFieldDefinition, OaFormFieldSchema } from '@/api/ecology/types';

const props = withDefaults(defineProps<{ schemaJson?: string; modelValue?: Record<string, any>; attachments?: Array<{ ossId: string | number; attachmentType?: string }> }>(), { schemaJson: '', modelValue: () => ({}), attachments: () => [] });
const emit = defineEmits<{ (event: 'update:modelValue', value: Record<string, any>): void; (event: 'update:attachments', value: Array<{ ossId: string | number; attachmentType?: string }>): void }>();
const allFields = computed<OaFormFieldDefinition[]>(() => { try { const schema = JSON.parse(props.schemaJson || '{}') as OaFormFieldSchema; return Array.isArray(schema.fields) ? [...schema.fields].toSorted((a, b) => (a.sortNo || 0) - (b.sortNo || 0)) : []; } catch { return []; } });
const fields = computed(() => allFields.value.filter((field) => !['APPLICANT', 'APPLICANT_DATE', 'APPROVAL_MODE', 'PARTICIPANT', 'COPY', 'SYSTEM'].includes(String(field.semanticType || '').toUpperCase())));
const emptyText = computed(() => props.schemaJson ? '该表单暂未配置可填写字段' : '请先选择业务类型和泛微表单');
const localModel = reactive<Record<string, any>>({});
const selectedUsers = reactive<Record<string, UserVO[]>>({});
const activeUserField = ref<OaFormFieldDefinition>();
const userSelectorRef = ref<InstanceType<typeof UserSelect>>();
const activeUserIds = computed(() => activeUserField.value ? (Array.isArray(localModel[activeUserField.value.key]) ? localModel[activeUserField.value.key] : localModel[activeUserField.value.key] ? [localModel[activeUserField.value.key]] : []) : []);
watch(() => props.modelValue, (value) => { Object.keys(localModel).forEach((key) => delete localModel[key]); Object.assign(localModel, value || {}); }, { deep: true, immediate: true });
const setValue = (key: string, value: any) => { localModel[key] = value; emit('update:modelValue', { ...localModel }); };
const toNumber = (value: any) => value === '' || value === null || value === undefined ? undefined : Number(value);
const fieldClass = (field: OaFormFieldDefinition) => ({
  'dynamic-field--wide': ['TEXTAREA', 'FILE', 'IMAGE', 'USER_MULTI'].includes(field.controlType),
  'dynamic-field--choice': ['SELECT', 'RADIO'].includes(field.controlType),
  'dynamic-field--upload': ['FILE', 'IMAGE'].includes(field.controlType)
});
const openUserSelector = (field: OaFormFieldDefinition) => { activeUserField.value = field; void userSelectorRef.value?.open(); };
const setUserSelection = (users: UserVO[]) => { if (!activeUserField.value) return; selectedUsers[activeUserField.value.key] = users; const ids = users.map((item) => item.userId); setValue(activeUserField.value.key, activeUserField.value.controlType === 'USER_MULTI' ? ids : ids[0]); };
const removeUser = (field: OaFormFieldDefinition, userId: string | number) => { const users = (selectedUsers[field.key] || []).filter((item) => String(item.userId) !== String(userId)); selectedUsers[field.key] = users; setValue(field.key, field.controlType === 'USER_MULTI' ? users.map((item) => item.userId) : users[0]?.userId); };
const userSelectionText = (field: OaFormFieldDefinition) => selectedUsers[field.key]?.length ? `已选择 ${selectedUsers[field.key].length} 人` : `选择${field.controlType === 'USER_MULTI' ? '人员（可多选）' : '人员'}`;
const attachmentValue = (type: string) => (props.attachments || []).filter((item) => String(item.attachmentType || 'FILE').toUpperCase() === type).map((item) => item.ossId).join(',');
const updateAttachments = (type: string, value: string) => { const ids = String(value || '').split(',').map((item) => item.trim()).filter(Boolean); const other = (props.attachments || []).filter((item) => String(item.attachmentType || 'FILE').toUpperCase() !== type); emit('update:attachments', [...other, ...ids.map((ossId) => ({ ossId, attachmentType: type }))]); };
const isBlank = (value: any) => value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
const validate = () => { const field = fields.value.find((item) => item.required && ((item.controlType === 'FILE' || item.controlType === 'IMAGE') ? !(props.attachments || []).some((attachment) => String(attachment.attachmentType || 'FILE').toUpperCase() === item.controlType) : isBlank(localModel[item.key]))); return field ? { valid: false, message: `请填写必填字段：${field.label}` } : { valid: true, message: '' }; };
defineExpose({ validate });
</script>

<style scoped lang="scss">
.dynamic-form__summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; margin: -2px 0 16px; border: 1px solid var(--el-color-primary-light-8); border-radius: 10px; background: var(--el-color-primary-light-9); }.dynamic-form__summary strong, .dynamic-form__summary span { display: block; }.dynamic-form__summary strong { color: var(--el-text-color-primary); font-size: 13px; line-height: 18px; }.dynamic-form__summary span { margin-top: 2px; color: var(--el-text-color-secondary); font-size: 11px; line-height: 16px; }.dynamic-form__summary i { color: var(--el-color-danger); font-style: normal; }.dynamic-form__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 22px; }.dynamic-field { min-width: 0; margin-bottom: 18px; }.dynamic-field--wide { grid-column: 1 / -1; }.dynamic-field--choice { padding: 10px 12px 11px; border: 1px solid var(--el-border-color-lighter); border-radius: 10px; background: var(--el-fill-color-lighter); }.dynamic-field--upload { padding: 12px; border: 1px dashed var(--el-border-color); border-radius: 10px; background: var(--el-fill-color-lighter); }.dynamic-field__label { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 7px; color: var(--el-text-color-regular); font-size: 12px; font-weight: 650; line-height: 18px; }.dynamic-field__label small { flex: 0 0 auto; color: var(--el-text-color-secondary); font-size: 11px; font-weight: 400; }.required-mark { margin-right: 4px; color: var(--el-color-danger); }.dynamic-field__control, .dynamic-field__number { width: 100%; }.dynamic-field :deep(.el-input__wrapper), .dynamic-field :deep(.el-select__wrapper), .dynamic-field :deep(.el-textarea__inner), .dynamic-field :deep(.el-input-number) { border-radius: 10px; }.dynamic-field :deep(.el-radio-group) { display: flex; flex-wrap: wrap; min-height: 40px; align-items: center; gap: 8px 18px; }.dynamic-user-field { min-height: 40px; }.dynamic-user-field__tags { display: flex; flex-wrap: wrap; max-height: 76px; gap: 6px; margin-top: 7px; overflow-y: auto; }.dynamic-field__hint { margin-top: 5px; color: var(--el-text-color-secondary); font-size: 11px; }.dynamic-field :deep(.el-upload-list) { margin-top: 8px; }
@media (max-width: 760px) { .dynamic-form__grid { grid-template-columns: minmax(0, 1fr); }.dynamic-field--wide { grid-column: auto; } }
</style>
