import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { listMyDepartmentContexts, switchMyDepartment } from '@/api/department/person';
import type { PersonDepartmentContextVO } from '@/api/department/person/types';

/**
 * 当前业务科室上下文。
 *
 * 科室切换是业务上下文变化，不是登录态变化，因此不应通过整页刷新实现。
 * switchRevision 用于通知 AppMain 重新挂载当前业务页面，避免旧科室数据残留。
 */
export const useDepartmentStore = defineStore('department', () => {
  const contexts = ref<PersonDepartmentContextVO[]>([]);
  const loading = ref(false);
  const loaded = ref(false);
  const switchRevision = ref(0);

  const current = computed(() => contexts.value.find(item => item.current));
  const currentDepartmentName = computed(() => current.value?.deptName || contexts.value[0]?.deptName || '未选择');

  const load = async (force = false) => {
    if (loaded.value && !force) {
      return contexts.value;
    }
    loading.value = true;
    try {
      const res = await listMyDepartmentContexts();
      contexts.value = res.data || [];
      loaded.value = true;
      return contexts.value;
    } finally {
      loading.value = false;
    }
  };

  const switchDepartment = async (deptId: string | number) => {
    const target = contexts.value.find(item => String(item.deptId) === String(deptId));
    if (!target || target.current) {
      return target;
    }

    const res = await switchMyDepartment(deptId);
    const switched = res.data || target;
    contexts.value = contexts.value.map(item => ({
      ...item,
      current: String(item.deptId) === String(switched.deptId)
    }));
    switchRevision.value += 1;
    return switched;
  };

  const clear = () => {
    contexts.value = [];
    loaded.value = false;
    switchRevision.value = 0;
  };

  return {
    contexts,
    loading,
    loaded,
    switchRevision,
    current,
    currentDepartmentName,
    load,
    switchDepartment,
    clear
  };
});
