import { to } from 'await-to-js';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfo } from '@/api/system/user/types';
import type { LoginData, LoginResult } from '@/api/types';
import type { RuoYiAjaxResult } from '@/utils/api-types';
import { previewOss } from '@/api/system/oss';
import { getInfo as getUserInfo, login as loginApi, logout as logoutApi } from '@/api/login';
import defAva from '@/assets/images/profile.jpg';
import { getToken, removeToken, setToken } from '@/utils/auth';

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken());
  const name = ref('');
  const nickname = ref('');
  const userId = ref<string | number>('');
  const avatar = ref('');
  const roles = ref<Array<string>>([]); // 用户角色编码集合 → 判断路由权限
  const permissions = ref<Array<string>>([]); // 用户权限编码集合 → 判断按钮权限
  let avatarObjectUrl = '';

  const revokeAvatarObjectUrl = () => {
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
      avatarObjectUrl = '';
    }
  };

  /**
   * 登录
   * @param userInfo
   * @returns
   */
  const login = async (userInfo: LoginData): Promise<void> => {
    const [err, res] = await to(loginApi(userInfo));
    if (res) {
      const data = (res as RuoYiAjaxResult<LoginResult>).data;
      if (!data?.access_token) {
        return Promise.reject(err);
      }
      setToken(data.access_token);
      token.value = data.access_token;
      return Promise.resolve();
    }
    return Promise.reject(err);
  };

  // 获取用户信息
  const getInfo = async (): Promise<void> => {
    const [err, res] = await to(getUserInfo());
    if (res) {
      const data = (res as RuoYiAjaxResult<UserInfo>).data;
      if (!data?.user) {
        return Promise.reject(err);
      }
      const user = data.user;
      const profile = user.avatarUrl == '' || user.avatarUrl == null ? defAva : user.avatarUrl;

      if (data.roles && data.roles.length > 0) {
        // 验证返回的roles是否是一个非空数组
        roles.value = data.roles;
        permissions.value = data.permissions;
      } else {
        roles.value = ['ROLE_DEFAULT'];
      }
      name.value = user.userName;
      nickname.value = user.nickName;
      if (/^\d+$/.test(String(user.avatar ?? '')) && String(user.avatar) !== '0') {
        await loadAvatar(user.avatar);
      } else {
        setAvatar(profile);
      }
      userId.value = user.userId;
      return Promise.resolve();
    }
    return Promise.reject(err);
  };

  // 注销
  const logout = async (): Promise<void> => {
    await logoutApi();
    token.value = '';
    roles.value = [];
    permissions.value = [];
    setAvatar(defAva);
    removeToken();
  };

  const setAvatar = (value: string) => {
    revokeAvatarObjectUrl();
    avatar.value = value;
  };

  const loadAvatar = async (ossId: string | number): Promise<boolean> => {
    try {
      const blob = await previewOss(ossId);
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error('头像预览内容为空');
      }
      revokeAvatarObjectUrl();
      avatarObjectUrl = URL.createObjectURL(blob);
      avatar.value = avatarObjectUrl;
      return true;
    } catch (error) {
      console.warn('头像预览失败，已使用默认头像', error);
      setAvatar(defAva);
      return false;
    }
  };

  return {
    userId,
    token,
    nickname,
    avatar,
    roles,
    permissions,
    login,
    getInfo,
    logout,
    setAvatar,
    loadAvatar
  };
});
