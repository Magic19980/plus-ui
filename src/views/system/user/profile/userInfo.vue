<template>
  <el-form ref="userRef" :model="userForm" :rules="rules" label-width="80px" class="profile-form">
    <el-form-item :label="$t('common.nickName')" prop="nickName">
      <el-input v-model="userForm.nickName" maxlength="30" />
    </el-form-item>
    <el-form-item :label="$t('common.indonesianName')" prop="indonesianName">
      <el-input v-model="userForm.indonesianName" maxlength="100" />
    </el-form-item>
    <el-form-item :label="$t('common.phoneNumber')" prop="phoneNumber">
      <el-input v-model="userForm.phoneNumber" maxlength="11" />
    </el-form-item>
    <el-form-item :label="$t('common.email')" prop="email">
      <el-input v-model="userForm.email" maxlength="50" />
    </el-form-item>
    <el-form-item :label="$t('common.gender')">
      <el-radio-group v-model="userForm.gender">
        <el-radio v-for="dict in sys_user_gender" :key="dict.value" :value="dict.value">
          {{ dict.label }}
        </el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item class="profile-form__actions">
      <el-button type="primary" @click="submit">{{ $t('common.btnSave') }}</el-button>
      <el-button @click="close">{{ $t('common.btnClose') }}</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { updateUserProfile } from '@/api/system/user';
import type { UserProfileForm } from '@/api/system/user/types';
import modal from '@/plugins/modal';
import tab from '@/plugins/tab';
import { useDict } from '@/utils/dict';
import { useI18n } from 'vue-i18n';
import { propTypes } from '@/utils/propTypes';

const { t } = useI18n();

const { sys_user_gender } = toRefs<any>(useDict('sys_user_gender'));
const props = defineProps({
  user: propTypes.any.isRequired
});
const userForm = computed(() => props.user);
const userRef = ref<ElFormInstance>();
const rule: ElFormRules = {
  nickName: [{ required: true, message: t('common.validationNickNameRequired'), trigger: 'blur' }],
  email: [
    { required: true, message: t('common.validationEmailRequired'), trigger: 'blur' },
    {
      type: 'email',
      message: t('common.validationInvalidEmail'),
      trigger: ['blur', 'change']
    }
  ],
  phoneNumber: [
    {
      required: true,
      message: t('common.validationPhoneRequired'),
      trigger: 'blur'
    },
    {
      pattern: /^1[3456789][0-9]\d{8}$/,
      message: t('common.validationInvalidPhone'),
      trigger: 'blur'
    }
  ]
};
const rules = ref<ElFormRules>(rule);

/** 提交按钮 */
const submit = () => {
  userRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      const profile: UserProfileForm = {
        nickName: props.user.nickName,
        indonesianName: props.user.indonesianName,
        phoneNumber: props.user.phoneNumber,
        email: props.user.email,
        gender: props.user.gender
      };
      await updateUserProfile(profile);
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

.profile-form :deep(.el-radio-group) {
  gap: 16px;
}

.profile-form :deep(.el-button) {
  border-radius: 10px;
}

.profile-form__actions :deep(.el-form-item__content) {
  display: flex;
  gap: 8px;
}
</style>
