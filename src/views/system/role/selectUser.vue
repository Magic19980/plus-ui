<template>
  <UserSelect
    ref="userSelectRef"
    :filter-keys="filterKeys"
    :load-users="loadUsers"
    :multiple="true"
    @confirm-call-back="handleSelectUser"
  />
</template>

<script setup name="SelectUser" lang="ts">
import { authUserSelectAll, unallocatedUserList } from '@/api/system/role';
import UserSelect from '@/components/UserSelect/index.vue';
import type { UserQuery, UserVO } from '@/api/system/user/types';
import modal from '@/plugins/modal';

const props = defineProps({
  roleId: {
    type: [Number, String],
    required: true
  }
});

const userSelectRef = ref<InstanceType<typeof UserSelect>>();
const filterKeys: Array<'userName' | 'nickName' | 'employeeNo' | 'email' | 'phoneNumber' | 'status'> = [
  'userName',
  'nickName',
  'employeeNo',
  'email',
  'phoneNumber',
  'status'
];

const loadUsers = (query: UserQuery) => unallocatedUserList({ ...query, roleId: props.roleId });

const emit = defineEmits(['ok']);
/** 选择授权用户操作。 */
const handleSelectUser = async (users: UserVO[]) => {
  const ids = users.map(item => item.userId).join(',');
  if (!ids) {
    modal.msgError('请选择要分配的用户');
    return;
  }
  await authUserSelectAll({ roleId: props.roleId, userIds: ids });
  modal.msgSuccess('分配成功');
  emit('ok');
};

const show = () => userSelectRef.value?.open();
// 暴露
defineExpose({
  show
});
</script>
