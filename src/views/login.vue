<template>
  <div class="login">
    <div class="login-aurora login-aurora-one" aria-hidden="true"></div>
    <div class="login-aurora login-aurora-two" aria-hidden="true"></div>
    <div class="login-grid" aria-hidden="true"></div>
    <span
      v-for="particle in particles"
      :key="particle.left + particle.top"
      class="login-particle"
      :style="{
        left: particle.left,
        top: particle.top,
        animationDelay: particle.delay,
        animationDuration: particle.duration
      }"
      aria-hidden="true"
    ></span>

    <div class="login-shell">
      <section class="login-hero">
        <div class="hero-orbit hero-orbit-one" aria-hidden="true"></div>
        <div class="hero-orbit hero-orbit-two" aria-hidden="true"></div>
        <div class="hero-scanline" aria-hidden="true"></div>

        <div class="hero-topline">
          <div class="brand-lockup">
            <div class="brand-mark-wrap">
              <img :src="logo" class="brand-mark" alt="TEI" />
            </div>
            <div>
              <strong>TEI</strong>
              <span>DEPARTMENT HUB</span>
            </div>
          </div>
          <span class="hero-index">TEI / 01</span>
        </div>

        <div class="hero-content">
          <p class="hero-kicker">DEPARTMENT OPERATIONS PLATFORM</p>
          <h1 class="hero-title">
            让每一次协作
            <span>都清晰可见</span>
          </h1>
          <p class="hero-desc">
            科室管理平台，统一沉淀人员档案、日报周报、工单任务与重点工作，让日常协作更顺畅，让每一步进展都可追踪。
          </p>

          <div class="hero-flow">
            <div class="flow-heading">
              <span>WORKFLOW / LIVE</span>
              <i></i>
            </div>
            <div class="flow-track">
              <div class="flow-step is-active">
                <span class="flow-index">01</span>
                <strong>记录</strong>
              </div>
              <div class="flow-link"></div>
              <div class="flow-step">
                <span class="flow-index">02</span>
                <strong>协同</strong>
              </div>
              <div class="flow-link"></div>
              <div class="flow-step">
                <span class="flow-index">03</span>
                <strong>闭环</strong>
              </div>
            </div>
          </div>

          <div class="hero-features">
            <article v-for="item in quickStats" :key="item.label" class="feature-card">
              <span class="feature-dot"></span>
              <strong>{{ item.value }}</strong>
              <span>{{ item.label }}</span>
            </article>
          </div>
        </div>

        <div class="hero-footer">
          <span>TEI · 科室管理平台</span>
          <span class="status-line"><i></i> SYSTEM READY</span>
        </div>
      </section>

      <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
        <div class="title-box">
          <div>
            <p class="eyebrow">WELCOME BACK / TEI ACCESS</p>
            <h2 class="title">{{ title }}</h2>
            <p class="subtitle">进入你的科室工作台，继续处理今日工作。</p>
          </div>
          <lang-select />
        </div>

        <div class="form-section-label">账号认证</div>

        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            type="text"
            size="large"
            auto-complete="off"
            :placeholder="$t('login.username')"
          >
            <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            size="large"
            auto-complete="off"
            :placeholder="$t('login.password')"
            @keyup.enter="handleLogin"
          >
            <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="captchaEnabled" prop="code" class="captcha-row">
          <el-input
            v-model="loginForm.code"
            size="large"
            auto-complete="off"
            :placeholder="$t('login.code')"
            @keyup.enter="handleLogin"
          >
            <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
          </el-input>
          <div class="login-code">
            <img :src="codeUrl" class="login-code-img" @click="getCode" />
          </div>
        </el-form-item>

        <div class="form-meta">
          <el-checkbox v-model="loginForm.rememberMe">{{ $t('login.rememberPassword') }}</el-checkbox>
          <router-link v-if="register" class="link-type" :to="'/register'">
            {{ $t('login.switchRegisterPage') }}
          </router-link>
        </div>

        <div class="social-panel">
          <span class="social-label">其他认证方式</span>
          <div class="social-actions">
            <el-button circle :title="$t('login.social.wechat')" @click="doSocialLogin('wechat')">
              <svg-icon icon-class="wechat" />
            </el-button>
            <el-button circle :title="$t('login.social.maxkey')" @click="doSocialLogin('maxkey')">
              <svg-icon icon-class="maxkey" />
            </el-button>
            <el-button circle :title="$t('login.social.topiam')" @click="doSocialLogin('topiam')">
              <svg-icon icon-class="topiam" />
            </el-button>
            <el-button circle :title="$t('login.social.gitee')" @click="doSocialLogin('gitee')">
              <svg-icon icon-class="gitee" />
            </el-button>
            <el-button circle :title="$t('login.social.github')" @click="doSocialLogin('github')">
              <svg-icon icon-class="github" />
            </el-button>
          </div>
        </div>

        <el-form-item class="submit-row">
          <el-button :loading="loading" size="large" type="primary" class="submit-button" @click.prevent="handleLogin">
            <span v-if="!loading">进入工作台</span>
            <span v-else>正在验证...</span>
          </el-button>
        </el-form-item>

        <p class="auth-note"><span></span> 安全连接已建立 · TEI INTERNAL NETWORK</p>
      </el-form>
    </div>

    <div class="el-login-footer">
      <span>TEI · 科室管理平台 · 让工作更清晰</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { to } from 'await-to-js';
import { useI18n } from 'vue-i18n';
import logo from '@/assets/logo/tei-logo.svg';
import { getCodeImg } from '@/api/login';
import { authRouterUrl } from '@/api/system/social/auth';
import { LoginData } from '@/api/types';
import { HttpStatus } from '@/enums/RespEnum';
import { useUserStore } from '@/store/modules/user';

const title = import.meta.env.VITE_APP_TITLE;
const currentYear = new Date().getFullYear();
const quickStats = [
  { label: '人员与组织', value: '档案可查' },
  { label: '日报与周报', value: '进度可追' },
  { label: '工单与任务', value: '闭环管理' }
];
const particles = [
  { left: '8%', top: '19%', delay: '-1.5s', duration: '7s' },
  { left: '22%', top: '74%', delay: '-4.5s', duration: '9s' },
  { left: '44%', top: '12%', delay: '-3s', duration: '8s' },
  { left: '72%', top: '21%', delay: '-6s', duration: '10s' },
  { left: '91%', top: '64%', delay: '-2s', duration: '8s' },
  { left: '63%', top: '87%', delay: '-5s', duration: '11s' }
] as const;
const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();

const loginForm = ref<LoginData>({
  username: 'admin',
  password: 'admin123',
  rememberMe: false,
  code: '',
  uuid: ''
} as LoginData);

const loginRules: ElFormRules = {
  username: [
    {
      required: true,
      trigger: 'blur',
      message: t('login.rule.username.required')
    }
  ],
  password: [
    {
      required: true,
      trigger: 'blur',
      message: t('login.rule.password.required')
    }
  ],
  code: [
    {
      required: true,
      trigger: 'change',
      message: t('login.rule.code.required')
    }
  ]
};

const codeUrl = ref('');
const loading = ref(false);
const captchaEnabled = ref(true);
const register = ref(false);
const redirect = ref('/');
const loginRef = ref<ElFormInstance>();

watch(
  () => router.currentRoute.value,
  (newRoute: any) => {
    redirect.value = newRoute.query && newRoute.query.redirect && decodeURIComponent(newRoute.query.redirect);
  },
  { immediate: true }
);

const handleLogin = () => {
  loginRef.value?.validate(async (valid: boolean, fields: any) => {
    if (valid) {
      loading.value = true;
      if (loginForm.value.rememberMe) {
        localStorage.setItem('username', String(loginForm.value.username));
        localStorage.setItem('rememberMe', String(loginForm.value.rememberMe));
      } else {
        localStorage.removeItem('username');
        localStorage.removeItem('rememberMe');
      }
      localStorage.removeItem('password');
      const [err] = await to(userStore.login(loginForm.value));
      if (!err) {
        const redirectUrl = redirect.value || '/';
        await router.push(redirectUrl);
        loading.value = false;
      } else {
        loading.value = false;
        if (captchaEnabled.value) {
          await getCode();
        }
      }
    } else {
      console.log('error submit!', fields);
    }
  });
};

const getCode = async () => {
  const res = await getCodeImg();
  const { data } = res;
  captchaEnabled.value = data.captchaEnabled === undefined ? true : data.captchaEnabled;
  if (captchaEnabled.value) {
    loginForm.value.code = '';
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    loginForm.value.uuid = data.uuid;
  }
};

const getLoginData = () => {
  const username = localStorage.getItem('username');
  const rememberMe = localStorage.getItem('rememberMe');
  localStorage.removeItem('password');
  loginForm.value = {
    username: username === null ? String(loginForm.value.username) : username,
    password: username === null ? String(loginForm.value.password) : '',
    rememberMe: rememberMe === 'true'
  } as LoginData;
};

const doSocialLogin = (type: string) => {
  authRouterUrl(type).then((res: any) => {
    if (res.code === HttpStatus.SUCCESS) {
      window.location.href = res.data;
    } else {
      ElMessage.error(res.msg);
    }
  });
};

onMounted(() => {
  getCode();
  getLoginData();
});
</script>

<style lang="scss" scoped>
.login {
  position: relative;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  isolation: isolate;
  padding: 46px 28px 92px;
  color: #f8fbff;
  background:
    radial-gradient(circle at 12% 12%, rgba(14, 165, 233, 0.22), transparent 24%),
    radial-gradient(circle at 87% 18%, rgba(45, 212, 191, 0.16), transparent 22%),
    linear-gradient(135deg, #050b18 0%, #0b1630 48%, #122b4f 100%);
}

.login::before {
  position: absolute;
  inset: 0;
  z-index: -2;
  content: '';
  background:
    linear-gradient(115deg, transparent 0 42%, rgba(56, 189, 248, 0.08) 42.2%, transparent 42.5%),
    linear-gradient(295deg, transparent 0 66%, rgba(45, 212, 191, 0.06) 66.2%, transparent 66.45%);
  pointer-events: none;
}

.login::after {
  position: absolute;
  inset: 0;
  z-index: -1;
  content: '';
  opacity: 0.32;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.035) 1px, transparent 1px);
  background-size: 80px 80px;
  mask-image: linear-gradient(to bottom, black, transparent 78%);
  pointer-events: none;
}

.login-grid {
  position: absolute;
  z-index: -1;
  width: 760px;
  height: 760px;
  right: -220px;
  bottom: -360px;
  border: 1px solid rgba(56, 189, 248, 0.1);
  border-radius: 50%;
  box-shadow:
    0 0 0 72px rgba(56, 189, 248, 0.035),
    0 0 0 144px rgba(56, 189, 248, 0.025),
    0 0 0 216px rgba(56, 189, 248, 0.018);
  animation: gridOrbit 22s linear infinite;
  pointer-events: none;
}

.login-aurora {
  position: absolute;
  z-index: -1;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.5;
  pointer-events: none;
}

.login-aurora-one {
  top: -210px;
  left: -120px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.22), transparent 68%);
  animation: auroraFloat 10s ease-in-out infinite alternate;
}

.login-aurora-two {
  right: 12%;
  bottom: -280px;
  background: radial-gradient(circle, rgba(45, 212, 191, 0.18), transparent 68%);
  animation: auroraFloat 13s ease-in-out -4s infinite alternate-reverse;
}

.login-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #67e8f9;
  box-shadow:
    0 0 8px rgba(103, 232, 249, 0.9),
    0 0 24px rgba(56, 189, 248, 0.55);
  animation: particleDrift ease-in-out infinite alternate;
  pointer-events: none;
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1240px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(380px, 440px);
  gap: 34px;
  align-items: stretch;
}

.login-hero,
.login-form {
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow:
    0 32px 90px rgba(2, 8, 23, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(22px);
}

.login-hero {
  position: relative;
  min-height: 650px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 40px 44px 32px;
  border-radius: 32px;
  background:
    radial-gradient(circle at 92% 8%, rgba(45, 212, 191, 0.18), transparent 24%),
    linear-gradient(145deg, rgba(27, 63, 96, 0.88), rgba(8, 22, 43, 0.84));
  animation: cardReveal 0.8s ease-out both;
}

.login-hero::before {
  position: absolute;
  inset: 0;
  content: '';
  opacity: 0.32;
  background:
    linear-gradient(90deg, transparent 0 49.8%, rgba(125, 211, 252, 0.12) 50%, transparent 50.2%),
    linear-gradient(0deg, transparent 0 49.8%, rgba(125, 211, 252, 0.1) 50%, transparent 50.2%);
  background-size: 128px 128px;
  mask-image: radial-gradient(circle at 52% 46%, black, transparent 74%);
  pointer-events: none;
}

.hero-scanline {
  position: absolute;
  top: -30%;
  left: 0;
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.65), transparent);
  box-shadow: 0 0 20px rgba(103, 232, 249, 0.5);
  animation: scanLine 7s ease-in-out infinite;
  pointer-events: none;
}

.hero-orbit {
  position: absolute;
  right: -170px;
  top: -190px;
  width: 560px;
  height: 560px;
  border: 1px solid rgba(103, 232, 249, 0.13);
  border-radius: 50%;
  pointer-events: none;
}

.hero-orbit::after {
  position: absolute;
  inset: 42px;
  content: '';
  border: 1px dashed rgba(45, 212, 191, 0.14);
  border-radius: 50%;
  animation: orbitSpin 18s linear infinite;
}

.hero-orbit-one {
  transform: rotate(22deg);
}

.hero-orbit-two {
  right: -212px;
  top: -232px;
  transform: rotate(-30deg) scale(0.78);
  border-color: rgba(59, 130, 246, 0.15);
}

.hero-topline,
.hero-content,
.hero-footer {
  position: relative;
  z-index: 1;
}

.hero-topline,
.hero-footer,
.flow-heading,
.status-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;

  strong,
  span {
    display: block;
  }

  strong {
    color: #f8fbff;
    font-size: 16px;
    letter-spacing: 0.14em;
  }

  span {
    margin-top: 4px;
    color: rgba(214, 242, 255, 0.78);
    font-size: 10px;
    letter-spacing: 0.16em;
  }
}

.brand-mark-wrap {
  position: relative;
  width: 42px;
  height: 42px;
  padding: 4px;
  border: 1px solid rgba(103, 232, 249, 0.42);
  border-radius: 13px;
  background: rgba(7, 19, 35, 0.6);
  box-shadow:
    0 0 0 4px rgba(56, 189, 248, 0.06),
    0 0 24px rgba(45, 212, 191, 0.22);
  animation: logoPulse 3.2s ease-in-out infinite;
}

.brand-mark {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 9px;
}

.hero-index,
.hero-kicker,
.flow-heading,
.auth-note,
.eyebrow {
  font-family: 'SFMono-Regular', 'Cascadia Code', 'Roboto Mono', monospace;
  letter-spacing: 0.12em;
}

.hero-index {
  color: rgba(214, 242, 255, 0.72);
  font-size: 11px;
}

.hero-content {
  max-width: 700px;
  margin: auto 0;
  padding: 54px 0 46px;
}

.hero-kicker {
  margin: 0 0 18px;
  color: #67e8f9;
  font-size: 11px;
  font-weight: 700;
}

.hero-title {
  margin: 0;
  color: #f8fbff;
  font-size: clamp(42px, 5vw, 68px);
  font-weight: 700;
  line-height: 1.04;
  letter-spacing: -0.07em;
  text-wrap: balance;
}

.hero-title span {
  display: block;
  color: transparent;
  background: linear-gradient(90deg, #f8fbff 12%, #67e8f9 58%, #5eead4 100%);
  background-clip: text;
  -webkit-background-clip: text;
}

.hero-desc {
  max-width: 590px;
  margin: 26px 0 0;
  color: rgba(239, 247, 255, 0.88);
  font-size: 15px;
  line-height: 1.95;
}

.hero-flow {
  max-width: 620px;
  margin-top: 42px;
  padding: 18px 20px 20px;
  border: 1px solid rgba(125, 211, 252, 0.16);
  border-radius: 20px;
  background: rgba(2, 12, 27, 0.26);
}

.flow-heading {
  color: rgba(214, 242, 255, 0.8);
  font-size: 10px;
}

.flow-heading i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #5eead4;
  box-shadow: 0 0 0 4px rgba(94, 234, 212, 0.1), 0 0 12px rgba(94, 234, 212, 0.8);
  animation: statusPulse 1.8s ease-in-out infinite;
}

.flow-track {
  display: flex;
  align-items: center;
  margin-top: 18px;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(226, 240, 250, 0.8);
  white-space: nowrap;
}

.flow-step.is-active {
  color: #f8fbff;
}

.flow-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 8px;
  color: rgba(214, 242, 255, 0.9);
  font-family: 'SFMono-Regular', 'Cascadia Code', monospace;
  font-size: 10px;
}

.flow-step.is-active .flow-index {
  border-color: rgba(94, 234, 212, 0.6);
  color: #5eead4;
  background: rgba(45, 212, 191, 0.12);
}

.flow-step strong {
  font-size: 13px;
  font-weight: 600;
}

.flow-link {
  flex: 1;
  height: 1px;
  min-width: 24px;
  margin: 0 12px;
  background: linear-gradient(90deg, rgba(94, 234, 212, 0.5), rgba(148, 163, 184, 0.18));
}

.hero-features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.feature-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
  padding: 17px 16px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.06);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;
}

.feature-card:hover {
  transform: translateY(-3px);
  border-color: rgba(103, 232, 249, 0.44);
  background: rgba(103, 232, 249, 0.1);
}

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.9);
}

.feature-card strong {
  color: #f8fbff;
  font-size: 17px;
}

.feature-card > span:last-child {
  color: rgba(214, 242, 255, 0.78);
  font-size: 12px;
}

.hero-footer {
  color: rgba(214, 242, 255, 0.68);
  font-family: 'SFMono-Regular', 'Cascadia Code', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
}

.status-line {
  gap: 7px;
}

.status-line i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5eead4;
  box-shadow: 0 0 10px rgba(94, 234, 212, 0.8);
}

.login-form {
  align-self: center;
  width: 100%;
  padding: 34px 30px 24px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(19, 39, 65, 0.96), rgba(8, 20, 38, 0.98)),
    #0b1628;
  animation: cardReveal 0.8s 0.12s ease-out both;
}

.title-box {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;
}

.title-box .eyebrow {
  margin: 0 0 9px;
  color: #67e8f9;
  font-size: 10px;
  font-weight: 700;
}

.title-box .title {
  margin: 0;
  color: #f8fbff;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.title-box .subtitle {
  margin: 9px 0 0;
  color: rgba(214, 242, 255, 0.8);
  font-size: 13px;
  line-height: 1.7;
}

.title-box :deep(.lang-select--style) {
  line-height: 0;
  padding: 10px;
  color: rgba(186, 230, 253, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
}

.form-section-label {
  margin: 0 0 12px;
  color: rgba(214, 242, 255, 0.72);
  font-family: 'SFMono-Regular', 'Cascadia Code', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
}

.login-form .el-input {
  height: 48px;
}

.login-form .input-icon {
  width: 14px;
  height: 46px;
  margin-left: 0;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 17px;
}

.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 15px;
  background: rgba(4, 14, 28, 0.62);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.login-form :deep(.el-input__inner) {
  color: #f8fbff;
}

.login-form :deep(.el-input__inner::placeholder) {
  color: rgba(214, 242, 255, 0.56);
}

.login-form :deep(.el-input__prefix-inner) {
  color: rgba(103, 232, 249, 0.7);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(103, 232, 249, 0.68);
  box-shadow:
    0 0 0 1px rgba(103, 232, 249, 0.16) inset,
    0 0 0 4px rgba(45, 212, 191, 0.1),
    0 0 24px rgba(45, 212, 191, 0.12);
}

.captcha-row :deep(.el-form-item__content) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 122px;
  gap: 12px;
}

.form-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: -1px 0 18px;
}

.login-form :deep(.el-checkbox__label) {
  color: rgba(214, 242, 255, 0.78);
}

.link-type {
  color: #67e8f9;
}

.social-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  margin-bottom: 21px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.045);
}

.social-label {
  color: rgba(214, 242, 255, 0.76);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.social-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}

.login-form :deep(.el-button.is-circle) {
  width: 30px;
  height: 30px;
  margin: 0;
  color: rgba(239, 247, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(2, 12, 27, 0.48);
}

.login-form :deep(.el-button.is-circle:hover) {
  color: #67e8f9;
  border-color: rgba(103, 232, 249, 0.5);
  background: rgba(45, 212, 191, 0.12);
  box-shadow: 0 0 18px rgba(45, 212, 191, 0.16);
}

.submit-row {
  margin-bottom: 0 !important;
}

.submit-button {
  width: 100%;
  height: 50px;
  border: 0;
  border-radius: 15px;
  color: #042131;
  font-weight: 700;
  background: linear-gradient(100deg, #67e8f9, #38bdf8 48%, #5eead4);
  box-shadow:
    0 16px 28px rgba(14, 165, 233, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.16) inset;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;
}

.submit-button:hover {
  transform: translateY(-2px);
  filter: saturate(1.15);
  box-shadow:
    0 20px 34px rgba(14, 165, 233, 0.28),
    0 0 28px rgba(45, 212, 191, 0.18);
}

.login-code {
  height: 48px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 15px;
  background: rgba(4, 14, 28, 0.62);
}

.login-code img {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
  object-fit: cover;
}

.auth-note {
  margin: 17px 0 0;
  color: rgba(186, 230, 253, 0.68);
  font-size: 9px;
  text-align: center;
}

.auth-note span {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 5px;
  border-radius: 50%;
  background: #5eead4;
  box-shadow: 0 0 8px rgba(94, 234, 212, 0.75);
}

.el-login-footer {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  height: 42px;
  line-height: 42px;
  color: rgba(186, 230, 253, 0.62);
  font-family: 'SFMono-Regular', 'Cascadia Code', monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-align: center;
}

@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes auroraFloat {
  from {
    transform: translate3d(-16px, 10px, 0) scale(0.92);
  }

  to {
    transform: translate3d(24px, -18px, 0) scale(1.08);
  }
}

@keyframes particleDrift {
  from {
    opacity: 0.25;
    transform: translate3d(0, 12px, 0) scale(0.7);
  }

  to {
    opacity: 0.95;
    transform: translate3d(0, -18px, 0) scale(1.2);
  }
}

@keyframes gridOrbit {
  to {
    transform: rotate(360deg);
  }
}

@keyframes orbitSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes scanLine {
  0%,
  100% {
    top: -10%;
    opacity: 0;
  }

  20%,
  78% {
    opacity: 0.8;
  }

  88% {
    top: 110%;
    opacity: 0;
  }
}

@keyframes logoPulse {
  0%,
  100% {
    box-shadow:
      0 0 0 4px rgba(56, 189, 248, 0.06),
      0 0 24px rgba(45, 212, 191, 0.22);
  }

  50% {
    box-shadow:
      0 0 0 5px rgba(56, 189, 248, 0.1),
      0 0 34px rgba(45, 212, 191, 0.42);
  }
}

@keyframes statusPulse {
  0%,
  100% {
    opacity: 0.65;
    transform: scale(0.85);
  }

  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@media (max-width: 1020px) {
  .login {
    padding: 30px 18px 80px;
  }

  .login-shell {
    grid-template-columns: minmax(0, 1fr) minmax(340px, 410px);
    gap: 20px;
  }

  .login-hero {
    padding: 32px 30px 26px;
  }
}

@media (max-width: 820px) {
  .login-shell {
    grid-template-columns: 1fr;
    max-width: 560px;
  }

  .login-hero {
    min-height: auto;
  }

  .login-form {
    max-width: 440px;
    justify-self: center;
  }
}

@media (max-width: 560px) {
  .login {
    padding: 18px 12px 68px;
  }

  .login-hero {
    display: none;
  }

  .login-form {
    padding: 28px 18px 22px;
    border-radius: 24px;
  }

  .title-box {
    flex-direction: column;
  }

  .social-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .social-actions {
    justify-content: flex-start;
  }

  .captcha-row :deep(.el-form-item__content) {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login *,
  .login::before,
  .login::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
