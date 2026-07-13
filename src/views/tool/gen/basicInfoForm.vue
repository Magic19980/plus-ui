<template>
  <el-form ref="formRef" :model="infoForm" :rules="rules" label-width="150px">
    <el-row>
      <el-col :span="12">
        <el-form-item :label="$t('common.tableName')" prop="tableName">
          <el-input v-model="infoForm.tableName" :placeholder="$t('common.placeholderInputTableName')" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('common.tableDesc')" prop="tableComment">
          <el-input v-model="infoForm.tableComment" :placeholder="$t('common.placeholderInput')" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('common.className')" prop="className">
          <el-input v-model="infoForm.className" :placeholder="$t('common.placeholderInput')" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('common.authorName')" prop="functionAuthor">
          <el-input v-model="infoForm.functionAuthor" :placeholder="$t('common.placeholderInput')" />
        </el-form-item>
      </el-col>
      <el-col :span="24">
        <el-form-item :label="$t('common.remark')" prop="remark">
          <el-input v-model="infoForm.remark" type="textarea" :rows="3"></el-input>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus';
import { propTypes } from '@/utils/propTypes';

const prop = defineProps({
  info: propTypes.any.def({})
});

const infoForm = computed(() => prop.info);
const formRef = ref<FormInstance>();

// 表单校验
const rules = ref({
  tableName: [{ required: true, message: t('common.validationTableNameRequired'), trigger: 'blur' }],
  tableComment: [{ required: true, message: t('common.validationTableCommentRequired'), trigger: 'blur' }],
  className: [{ required: true, message: t('common.validationClassNameRequired'), trigger: 'blur' }],
  functionAuthor: [{ required: true, message: t('common.validationAuthorRequired'), trigger: 'blur' }]
});

/** Element Plus 推荐：通过 validate() 的 Promise 做校验 */
async function validate(): Promise<boolean> {
  if (!formRef.value) return false;
  try {
    await formRef.value.validate();
    return true;
  } catch {
    return false;
  }
}

defineExpose({ validate });
</script>
