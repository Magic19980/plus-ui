<template>
  <el-form ref="pwdRef" :model="user" :rules="rules" label-width="80px" class="profile-form">
    <el-form-item :label="$t('common.oldPassword')" prop="oldPassword">
      <el-input v-model="user.oldPassword" :placeholder="$t('common.placeholderInputOldPwd')" type="password" show-password />
    </el-form-item>
    <el-form-item :label="$t('common.newPassword')" prop="newPassword">
      <el-input v-model="user.newPassword" :placeholder="$t('common.placeholderInputNewPwd')" type="password" show-password />
    </el-form-item>
    <el-form-item :label="$t('common.confirmPassword')" prop="confirmPassword">
      <el-input v-model="user.confirmPassword" :placeholder="$t('common.placeholderConfirmNewPwd')" type="password" show-password />
    </el-form-item>
    <el-form-item class="profile-form__actions">
      <el-button type="primary" @click="submit">{{ $t('common.btnSave') }}</el-button>
      <el-button @click="close">{{ $t('common.btnClose') }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import type { ResetPwdForm } from '@/api/system/user/types';
import { updateUserPwd } from '@/api/system/user';
import { useI18n } from 'vue-i18n';
import modal from '@/plugins/modal';
import tab from '@/plugins/tab';

const { t } = useI18n();

const pwdRef = ref<ElFormInstance>();
const user = ref<ResetPwdForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const equalToPassword = (rule: any, value: string, callback: any) => {
  if (user.value.newPassword !== value) {
    callback(new Error(t('login.rule.confirmPassword.equalToPassword')));
  } else {
    callback();
  }
};
const rules = ref({
  oldPassword: [{ required: true, message: t('common.validationOldPwdRequired'), trigger: 'blur' }],
  newPassword: [
    { required: true, message: t('common.validationNewPwdRequired'), trigger: 'blur' },
    {
      min: 6,
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
  confirmPassword: [
    { required: true, message: t('common.validationConfirmPwdRequired'), trigger: 'blur' },
    {
      required: true,
      validator: equalToPassword,
      trigger: 'blur'
    }
  ]
});

/** 提交按钮 */
const submit = () => {
  pwdRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      await updateUserPwd(user.value.oldPassword, user.value.newPassword);
      modal.msgSuccess(t('common.msgEditSuccess'));
    }
  });
};
/** 关闭按钮 */
const close = () => {
  tab.closePage();
};
</script>

<style lang="scss" scoped>
.profile-form {
  max-width: 520px;
}

.profile-form :deep(.el-input__wrapper) {
  border-radius: 12px;
}

.profile-form :deep(.el-button) {
  border-radius: 10px;
}

.profile-form__actions :deep(.el-form-item__content) {
  display: flex;
  gap: 8px;
}
</style>
