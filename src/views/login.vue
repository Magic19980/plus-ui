<template>
  <div
    :class="['login', { 'login--animal': isAnimalMode }]"
    :style="parallaxStyle"
    @pointermove="handlePointerMove"
    @pointerleave="resetPointer"
  >
    <div class="login-aurora login-aurora-one" aria-hidden="true"></div>
    <div class="login-aurora login-aurora-two" aria-hidden="true"></div>
    <div class="login-grid" aria-hidden="true"></div>
    <div v-if="isAnimalMode" class="login-island-scene" aria-hidden="true">
      <span class="island-sun" />
      <span class="island-cloud island-cloud--one" />
      <span class="island-cloud island-cloud--two" />
      <span class="island-spark island-spark--one" />
      <span class="island-spark island-spark--two" />
      <span class="island-spark island-spark--three" />
      <span class="island-spark island-spark--four" />
      <span class="island-wave island-wave--one" />
      <span class="island-wave island-wave--two" />
      <span class="island-water" />
      <span class="island-ground" />
      <span class="island-tree island-tree--one" />
      <span class="island-tree island-tree--two" />
      <span class="island-leaf island-leaf--one" />
      <span class="island-leaf island-leaf--two" />
    </div>
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
          <h1 class="hero-title" aria-label="让每一次协作 都清晰可见">
            <span class="hero-title-main">
              {{ typedHeroTitleMain }}<i v-if="activeTypingLine === 'main'" class="typewriter-cursor" aria-hidden="true"></i>
            </span>
            <span class="hero-title-accent">
              {{ typedHeroTitleAccent }}<i v-if="activeTypingLine === 'accent' || activeTypingLine === 'done'" class="typewriter-cursor" aria-hidden="true"></i>
            </span>
          </h1>
          <p class="hero-desc">
            科室管理平台，统一沉淀人员档案、日报周报、工单任务与重点工作，让日常协作更顺畅，让每一步进展都可追踪。
          </p>

          <div class="hero-flow">
            <div class="flow-heading">
              <div class="flow-heading-main">
                <span>WORKFLOW / LIVE</span>
                <small>工作流实时状态</small>
              </div>
              <span class="flow-live" aria-live="polite"><i></i>{{ workflowSteps[activeFlowStep].title }}进行中</span>
            </div>
            <div class="flow-track" aria-label="协作流程">
              <template v-for="(step, index) in workflowSteps" :key="step.title">
                <div class="flow-step" :class="{ 'is-active': activeFlowStep === index }">
                  <span class="flow-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <span class="flow-step-copy">
                    <strong>{{ step.title }}</strong>
                    <small>{{ step.description }}</small>
                  </span>
                </div>
                <div
                  v-if="index < workflowSteps.length - 1"
                  class="flow-link"
                  :class="{ 'is-complete': activeFlowStep > index }"
                  aria-hidden="true"
                ></div>
              </template>
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
            autocomplete="username"
            aria-label="账号"
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
            autocomplete="current-password"
            show-password
            aria-label="密码"
            :placeholder="$t('login.password')"
            @blur="isCapsLockOn = false"
            @keyup="handlePasswordKeyup"
            @keyup.enter="handleLogin"
          >
            <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
          </el-input>
          <p v-if="isCapsLockOn" class="capslock-note" aria-live="polite">
            <span class="capslock-icon">⇧</span>大写锁定已开启
          </p>
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
            <img
              :src="codeUrl"
              class="login-code-img"
              alt="验证码，点击刷新"
              role="button"
              tabindex="0"
              @click="getCode"
              @keydown.enter="getCode"
              @keydown.space.prevent="getCode"
            />
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import logo from '@/assets/logo/tei-logo.svg';
import { getCodeImg } from '@/api/login';
import { authRouterUrl } from '@/api/system/social/auth';
import { LoginData } from '@/api/types';
import { HttpStatus } from '@/enums/RespEnum';
import { useUserStore } from '@/store/modules/user';
import { UiThemeEnum } from '@/enums/UiThemeEnum';
import { useSettingsStore } from '@/store/modules/settings';

const title = import.meta.env.VITE_APP_TITLE;
const currentYear = new Date().getFullYear();
const quickStats = [
  { label: '人员与组织', value: '档案可查' },
  { label: '日报与周报', value: '进度可追' },
  { label: '工单与任务', value: '闭环管理' }
];
const workflowSteps = [
  { title: '记录', description: '信息沉淀' },
  { title: '协同', description: '分派处理' },
  { title: '闭环', description: '复盘沉淀' }
] as const;
const heroTitleMain = '让每一次协作';
const heroTitleAccent = '都清晰可见';
const particles = [
  { left: '8%', top: '19%', delay: '-1.5s', duration: '7s' },
  { left: '22%', top: '74%', delay: '-4.5s', duration: '9s' },
  { left: '44%', top: '12%', delay: '-3s', duration: '8s' },
  { left: '72%', top: '21%', delay: '-6s', duration: '10s' },
  { left: '91%', top: '64%', delay: '-2s', duration: '8s' },
  { left: '63%', top: '87%', delay: '-5s', duration: '11s' }
] as const;
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const isAnimalMode = computed(() => settingsStore.uiTheme === UiThemeEnum.ANIMAL);
const activeFlowStep = ref(0);
const isCapsLockOn = ref(false);
const typedHeroTitleMain = ref('');
const typedHeroTitleAccent = ref('');
const activeTypingLine = ref<'main' | 'accent' | 'done'>('main');
let workflowTimer: number | undefined;
let typewriterTimer: number | undefined;
const pointerX = ref(0);
const pointerY = ref(0);
const parallaxStyle = computed(() => ({
  '--parallax-shell-x': `${(pointerX.value * 0.18).toFixed(2)}px`,
  '--parallax-shell-y': `${(pointerY.value * 0.18).toFixed(2)}px`,
  '--parallax-scene-x': `${(pointerX.value * -0.35).toFixed(2)}px`,
  '--parallax-scene-y': `${(pointerY.value * -0.35).toFixed(2)}px`
}));
const handlePointerMove = (event: PointerEvent) => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const target = event.currentTarget as HTMLElement | null;
  const bounds = target?.getBoundingClientRect();
  if (!bounds || !bounds.width || !bounds.height) return;
  pointerX.value = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
  pointerY.value = ((event.clientY - bounds.top) / bounds.height - 0.5) * 12;
};
const resetPointer = () => {
  pointerX.value = 0;
  pointerY.value = 0;
};
const handlePasswordKeyup = (event: KeyboardEvent) => {
  isCapsLockOn.value = event.getModifierState('CapsLock');
};
const startHeroTypewriter = () => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    typedHeroTitleMain.value = heroTitleMain;
    typedHeroTitleAccent.value = heroTitleAccent;
    activeTypingLine.value = 'done';
    return;
  }

  typedHeroTitleMain.value = '';
  typedHeroTitleAccent.value = '';
  activeTypingLine.value = 'main';
  let line: 'main' | 'accent' = 'main';
  let index = 0;

  const typeNextCharacter = () => {
    const text = line === 'main' ? heroTitleMain : heroTitleAccent;
    if (index < text.length) {
      if (line === 'main') typedHeroTitleMain.value += text[index];
      else typedHeroTitleAccent.value += text[index];
      index += 1;
      typewriterTimer = window.setTimeout(typeNextCharacter, 88);
      return;
    }

    if (line === 'main') {
      line = 'accent';
      index = 0;
      activeTypingLine.value = 'accent';
      typewriterTimer = window.setTimeout(typeNextCharacter, 180);
    } else {
      activeTypingLine.value = 'done';
      typewriterTimer = undefined;
    }
  };

  typeNextCharacter();
};
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
  if (loading.value) return;
  loginRef.value?.validate(async (valid: boolean) => {
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
  startHeroTypewriter();
  workflowTimer = window.setInterval(() => {
    activeFlowStep.value = (activeFlowStep.value + 1) % workflowSteps.length;
  }, 3600);
});

onBeforeUnmount(() => {
  if (workflowTimer) window.clearInterval(workflowTimer);
  if (typewriterTimer) window.clearTimeout(typewriterTimer);
});
</script>

<style lang="scss" scoped>
.login {
  position: relative;
  width: 100%;
  min-height: 100%;
  min-height: 100vh;
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

.hero-title-main,
.hero-title-accent {
  display: block;
  min-height: 1.04em;
}

.hero-title-main {
  color: #f8fbff;
}

.hero-title-accent {
  color: transparent;
  background: linear-gradient(90deg, #f8fbff 12%, #67e8f9 58%, #5eead4 100%);
  background-clip: text;
  -webkit-background-clip: text;
}

.typewriter-cursor {
  display: inline-block;
  width: 3px;
  height: 0.8em;
  margin-left: 8px;
  border-radius: 999px;
  background: #5eead4;
  box-shadow: 0 0 12px rgba(94, 234, 212, 0.7);
  vertical-align: -0.04em;
  animation: typewriterCursor 0.82s steps(1, end) infinite;
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
  margin-top: 38px;
  padding: 16px 17px 17px;
  overflow: hidden;
  border: 1px solid rgba(125, 211, 252, 0.2);
  border-radius: 22px;
  background:
    radial-gradient(circle at 100% 0%, rgba(45, 212, 191, 0.12), transparent 36%),
    linear-gradient(145deg, rgba(3, 17, 35, 0.72), rgba(9, 29, 47, 0.42));
  box-shadow:
    0 16px 30px rgba(2, 12, 27, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.035) inset;
}

.flow-heading {
  color: rgba(214, 242, 255, 0.86);
  font-size: 10px;
}

.flow-heading-main {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.flow-heading-main > span {
  font-weight: 700;
  letter-spacing: 0.14em;
}

.flow-heading-main small {
  color: rgba(186, 230, 253, 0.52);
  font-size: 10px;
  letter-spacing: 0.02em;
}

.flow-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid rgba(94, 234, 212, 0.2);
  border-radius: 999px;
  color: rgba(186, 230, 253, 0.72);
  background: rgba(45, 212, 191, 0.08);
  font-size: 10px;
  letter-spacing: 0.04em;
}

.flow-live i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #5eead4;
  box-shadow: 0 0 0 4px rgba(94, 234, 212, 0.1), 0 0 12px rgba(94, 234, 212, 0.8);
  animation: statusPulse 1.8s ease-in-out infinite;
}

.flow-track {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px minmax(0, 1fr) 42px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  margin-top: 15px;
}

.flow-step {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 9px 11px;
  border: 1px solid rgba(148, 163, 184, 0.17);
  border-radius: 15px;
  color: rgba(226, 240, 250, 0.8);
  background: rgba(255, 255, 255, 0.045);
  box-shadow: 0 7px 16px rgba(2, 12, 27, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.025) inset;
  white-space: nowrap;
  transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;
}

.flow-step.is-active {
  color: #f8fbff;
  border-color: rgba(94, 234, 212, 0.46);
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.17), rgba(56, 189, 248, 0.1));
  box-shadow: 0 9px 20px rgba(45, 212, 191, 0.12), 0 0 0 1px rgba(94, 234, 212, 0.08) inset;
}

.flow-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 29px;
  width: 29px;
  height: 29px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 10px;
  color: rgba(214, 242, 255, 0.9);
  font-family: 'SFMono-Regular', 'Cascadia Code', monospace;
  font-size: 10px;
  background: rgba(2, 12, 27, 0.22);
}

.flow-step.is-active .flow-index {
  border-color: rgba(94, 234, 212, 0.6);
  color: #5eead4;
  background: rgba(45, 212, 191, 0.12);
}

.flow-step-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.flow-step strong {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
}

.flow-step small {
  overflow: hidden;
  color: rgba(186, 230, 253, 0.52);
  font-size: 10px;
  line-height: 1.2;
  text-overflow: ellipsis;
}

.flow-link {
  position: relative;
  flex: 1;
  width: 100%;
  height: 2px;
  min-width: 0;
  margin: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(94, 234, 212, 0.52), rgba(148, 163, 184, 0.2));
  box-shadow: 0 0 10px rgba(94, 234, 212, 0.12);
}

.flow-link::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  content: '';
  background: #5eead4;
  box-shadow: 0 0 10px rgba(94, 234, 212, 0.78);
  transform: translate(-50%, -50%);
}

.flow-link.is-complete {
  background: linear-gradient(90deg, rgba(94, 234, 212, 0.72), rgba(45, 212, 191, 0.5));
}

.flow-link.is-complete::before {
  left: 100%;
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

.capslock-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -8px 0 0;
  color: #fbbf78;
  font-size: 11px;
  line-height: 1.4;
}

.capslock-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 1px solid currentColor;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
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

@keyframes typewriterCursor {
  0%,
  44% {
    opacity: 1;
  }

  45%,
  100% {
    opacity: 0;
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
    align-items: flex-start;
    padding: 18px 12px 68px;
  }

  .login-hero {
    min-height: auto;
    padding: 20px 18px 17px;
    border-radius: 24px;
  }

  .hero-topline {
    margin-bottom: 20px;
  }

  .hero-index,
  .hero-orbit,
  .hero-scanline,
  .hero-footer {
    display: none;
  }

  .hero-content {
    padding: 0;
  }

  .hero-kicker {
    margin-bottom: 11px;
    font-size: 9px;
  }

  .hero-title {
    font-size: clamp(32px, 10vw, 44px);
  }

  .hero-desc {
    margin-top: 14px;
    font-size: 12px;
    line-height: 1.7;
  }

  .hero-flow {
    margin-top: 20px;
    padding: 13px 12px 14px;
    border-radius: 18px;
  }

  .flow-heading-main small {
    display: none;
  }

  .flow-track {
    grid-template-columns: 1fr;
    gap: 7px;
    margin-top: 12px;
  }

  .flow-step {
    padding: 8px 10px;
    border-radius: 13px;
  }

  .flow-link {
    justify-self: start;
    width: 2px;
    height: 12px;
    margin-left: 25px;
    background: linear-gradient(180deg, rgba(94, 234, 212, 0.62), rgba(148, 163, 184, 0.24));
  }

  .flow-link::before {
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .flow-link.is-complete {
    background: linear-gradient(180deg, rgba(94, 234, 212, 0.78), rgba(45, 212, 191, 0.5));
  }

  .flow-link.is-complete::before {
    top: 100%;
    left: 50%;
  }

  .hero-features {
    gap: 8px;
    margin-top: 12px;
  }

  .feature-card {
    gap: 4px;
    padding: 11px 9px;
    border-radius: 14px;
  }

  .feature-card strong {
    font-size: 12px;
  }

  .feature-card > span:last-child {
    font-size: 10px;
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

/* 动森登录页：保留原有认证流程，只替换视觉层，背景使用缓慢流动的天空、海面和岛屿。 */
.login--animal {
  color: #5b765f;
  background:
    radial-gradient(circle at 14% 16%, rgb(255 255 255 / 56%), transparent 18%),
    radial-gradient(circle at 84% 12%, rgb(255 230 155 / 58%), transparent 19%),
    linear-gradient(135deg, #b9e9dc 0%, #b9dff1 48%, #f6e6b4 100%);
  background-size: 130% 130%;
  animation: islandSkyShift 24s ease-in-out infinite alternate;
}

.login--animal .login-aurora,
.login--animal .login-grid,
.login--animal .login-particle {
  display: none;
}

.login-island-scene { position: absolute; z-index: -1; inset: 0; overflow: hidden; pointer-events: none; }
.island-sun { position: absolute; top: 9%; right: 13%; width: 118px; height: 118px; border-radius: 50%; background: #ffe39b; box-shadow: 0 0 0 18px rgb(255 227 155 / 20%), 0 0 0 36px rgb(255 227 155 / 12%); }
.island-cloud { position: absolute; width: 158px; height: 36px; border-radius: 999px; background: rgb(255 255 255 / 64%); filter: blur(.2px); }
.island-cloud::before, .island-cloud::after { position: absolute; bottom: 0; border-radius: 50%; background: inherit; content: ''; }
.island-cloud::before { left: 16%; width: 42%; height: 145%; }.island-cloud::after { right: 10%; width: 34%; height: 118%; }
.island-cloud--one { top: 18%; left: 10%; transform: scale(.8); }.island-cloud--two { top: 34%; right: 25%; transform: scale(.56); opacity: .75; }
.island-water { position: absolute; right: -10%; bottom: -18%; left: -10%; height: 47%; border-radius: 50% 50% 0 0; background: repeating-linear-gradient(170deg, rgb(92 181 192 / 30%) 0 4px, transparent 4px 17px), linear-gradient(180deg, #79c7cb, #58aebd); transform: rotate(-3deg); }
.island-ground { position: absolute; right: 7%; bottom: 7%; width: 43%; height: 25%; border-radius: 55% 45% 49% 51%; background: #9bcf8a; box-shadow: inset 0 12px 0 rgb(255 240 169 / 42%), 0 14px 0 rgb(64 133 116 / 15%); transform: rotate(-5deg); }
.island-tree { position: absolute; bottom: 17%; width: 22px; height: 90px; border-radius: 12px; background: #8b6948; transform-origin: bottom; }.island-tree::before { position: absolute; bottom: 42px; left: 50%; width: 74px; height: 74px; border-radius: 50%; background: #5eaa76; box-shadow: 20px 8px 0 #78ba7c, -20px 12px 0 #4f9d70; content: ''; transform: translateX(-50%); }.island-tree--one { left: 16%; transform: scale(.72) rotate(-4deg); }.island-tree--two { right: 18%; transform: scale(.54) rotate(5deg); }

.login--animal .login-shell { position: relative; z-index: 1; }
.login--animal .login-hero,
.login--animal .login-form {
  border: 2px solid rgb(255 255 255 / 64%);
  border-radius: 30px;
  box-shadow: 0 12px 0 rgb(72 126 113 / 13%), 0 24px 48px rgb(44 97 104 / 18%);
  backdrop-filter: blur(12px);
}
.login--animal .login-hero { color: #52765c; background: rgb(255 253 235 / 72%); }
.login--animal .login-form { color: #5b765f; background: rgb(255 253 245 / 90%); }
.login--animal .brand-mark-wrap { border-color: #a6d1a0; background: #fff3c7; box-shadow: 0 5px 0 #d8c680; }
.login--animal .brand-lockup strong { color: #365b4a; }
.login--animal .brand-lockup span,
.login--animal .hero-index,
.login--animal .hero-footer { color: #709276; }
.login--animal .hero-kicker,
.login--animal .eyebrow,
.login--animal .auth-note { color: #4b9a83; }
.login--animal .hero-title,
.login--animal .title { color: #4d7655; }
.login--animal .hero-title-main { color: #4d7655; }
.login--animal .hero-title-accent { color: #1baea1; }
.login--animal .typewriter-cursor { background: #1baea1; box-shadow: 0 0 12px rgb(27 174 161 / 65%); }
.login--animal .hero-desc,
.login--animal .subtitle,
.login--animal .social-label { color: #739078; }
.login--animal .form-section-label { color: #5e8267; }
.login--animal .hero-flow {
  border-color: rgb(255 255 255 / 70%);
  background:
    radial-gradient(circle at 100% 0%, rgb(255 240 169 / 52%), transparent 40%),
    linear-gradient(145deg, rgb(255 253 239 / 86%), rgb(225 243 224 / 74%));
  box-shadow: 0 14px 26px rgb(72 126 113 / 12%), 0 0 0 1px rgb(255 255 255 / 38%) inset;
}

.login--animal .flow-heading,
.login--animal .flow-heading-main > span { color: #4b9a83; }

.login--animal .flow-heading-main small { color: #8aa78c; }

.login--animal .flow-live {
  border-color: rgb(111 185 139 / 38%);
  color: #5f9270;
  background: rgb(255 255 255 / 42%);
}

.login--animal .flow-live i {
  background: #62bd83;
  box-shadow: 0 0 0 4px rgb(98 189 131 / 14%), 0 0 12px rgb(98 189 131 / 62%);
}

.login--animal .flow-link {
  background: linear-gradient(90deg, #8fc991, #badb91);
  box-shadow: 0 0 10px rgb(129 185 126 / 24%);
}

.login--animal .flow-link::before {
  background: #74b77c;
  box-shadow: 0 0 10px rgb(116 183 124 / 70%);
}

.login--animal .flow-step {
  border-color: #c2dcb7;
  background: rgb(255 253 239 / 78%);
  box-shadow: 0 7px 16px rgb(72 126 113 / 8%), 0 0 0 1px rgb(255 255 255 / 42%) inset;
}

.login--animal .flow-step.is-active {
  border-color: #7dc8af;
  background: linear-gradient(135deg, #e2f6e6, #e6f4cf);
  box-shadow: 0 8px 18px rgb(83 169 137 / 14%), 0 0 0 1px rgb(255 255 255 / 52%) inset;
}

.login--animal .flow-index {
  border-color: #c2dcb7;
  color: #7aa674;
  background: rgb(255 255 255 / 45%);
}

.login--animal .flow-step.is-active .flow-index {
  border-color: #7dc8af;
  color: #4b9a83;
  background: #d3f1dd;
}

.login--animal .flow-step small { color: #8aa78c; }

.login--animal .capslock-note { color: #ad7d4a; }

.login--animal .feature-card { border-color: #d7e4be; background: rgb(255 253 235 / 78%); }.login--animal .feature-card strong { color: #2ba89a; }.login--animal .feature-card > span:last-child { color: #789275; }.login--animal .status-line { color: #64a573; }
.login--animal .flow-step { color: #5a765e; }
.login--animal .flow-step.is-active { color: #35624f; }
.login--animal .title-box :deep(.lang-select--style) { color: #4b9a83; border-color: #c7ddbf; background: #f8f4d9; }
.login--animal .login-form :deep(.el-input__wrapper) { border: 2px solid #d4e1c3; background: #fffdf1; box-shadow: 0 3px 0 #e4d9ad; }.login--animal .login-form :deep(.el-input__wrapper.is-focus) { border-color: #19c8b9; box-shadow: 0 0 0 3px rgb(25 200 185 / 18%), 0 3px 0 #d2c18d; }.login--animal .login-form :deep(.el-input__inner) { color: #55735d; }.login--animal .login-form :deep(.el-input__inner::placeholder) { color: #a2b29a; }.login--animal .login-form :deep(.el-checkbox__label), .login--animal .link-type { color: #6b8c70; }.login--animal .login-form :deep(.el-button.is-circle) { border-color: #c7ddbf; color: #4b9a83; background: #f8f4d9; }.login--animal .login-form :deep(.el-button.is-circle:hover) { border-color: #19c8b9; color: #19a99d; background: #e6f9f6; }.login--animal .submit-button { border-color: #19c8b9 !important; color: #164d48 !important; background: #75d9bd !important; box-shadow: 0 5px 0 #4aa98e !important; }.login--animal .submit-button:hover { background: #94e6c9 !important; }.login--animal .auth-note span { background: #5ebd84; box-shadow: 0 0 0 4px rgb(94 189 132 / 16%); }.login--animal .el-login-footer { color: #709276; }

/* 动森登录页动态层：所有效果都保持轻量，鼠标移动只改变很小的位移范围。 */
.login--animal {
  --parallax-shell-x: 0px;
  --parallax-shell-y: 0px;
  --parallax-scene-x: 0px;
  --parallax-scene-y: 0px;
}

.login--animal .login-shell {
  transform: translate3d(var(--parallax-shell-x), var(--parallax-shell-y), 0);
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.login--animal .login-island-scene {
  transform: translate3d(var(--parallax-scene-x), var(--parallax-scene-y), 0);
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.login--animal .login-hero::after {
  position: absolute;
  inset: -50% -30%;
  content: '';
  pointer-events: none;
  background: linear-gradient(112deg, transparent 38%, rgb(255 255 255 / 0%) 44%, rgb(255 255 255 / 38%) 50%, rgb(255 255 255 / 0%) 56%, transparent 62%);
  transform: translateX(-48%) rotate(8deg);
  animation: islandCardSheen 12s ease-in-out infinite;
}

.login--animal .login-form::before {
  position: absolute;
  inset: 2px;
  content: '';
  pointer-events: none;
  border-radius: 28px;
  border: 1px solid rgb(255 255 255 / 55%);
  opacity: 0.55;
  animation: islandFormGlow 5.5s ease-in-out infinite;
}

.login--animal .login-form {
  position: relative;
}

.login--animal .island-sun {
  animation: islandSunFloat 8s ease-in-out infinite;
}

.login--animal .island-sun::before {
  position: absolute;
  inset: -19px;
  content: '';
  border: 1px dashed rgb(255 227 155 / 62%);
  border-radius: 50%;
  animation: islandSunOrbit 20s linear infinite;
}

.login--animal .island-sun::after {
  position: absolute;
  inset: -9px;
  content: '';
  border-radius: 50%;
  box-shadow: 0 0 28px rgb(255 227 155 / 44%);
  animation: islandSunGlow 4s ease-in-out infinite;
}

.login--animal .island-cloud--one {
  animation: islandCloudDriftOne 28s ease-in-out infinite alternate;
}

.login--animal .island-cloud--two {
  animation: islandCloudDriftTwo 34s ease-in-out -8s infinite alternate;
}

.login--animal .island-water {
  background-size: 100% 100%, 140% 100%;
  animation: islandWaterFlow 16s ease-in-out infinite alternate;
}

.login--animal .island-water::before,
.login--animal .island-water::after {
  position: absolute;
  right: -8%;
  left: -8%;
  height: 18%;
  content: '';
  border-top: 2px solid rgb(255 255 255 / 26%);
  border-radius: 50%;
  animation: islandWaveDrift 12s ease-in-out infinite alternate;
}

.login--animal .island-water::before {
  top: 20%;
}

.login--animal .island-water::after {
  top: 42%;
  opacity: 0.6;
  animation-delay: -4s;
  animation-duration: 15s;
}

.login--animal .island-ground {
  animation: islandGroundFloat 9s ease-in-out infinite alternate;
}

.login--animal .island-tree--one {
  animation: islandTreeSwayOne 6s ease-in-out infinite alternate;
}

.login--animal .island-tree--two {
  animation: islandTreeSwayTwo 7s ease-in-out -2s infinite alternate;
}

.login--animal .island-tree::before {
  animation: islandCanopySway 5s ease-in-out infinite alternate;
}

.login--animal .island-tree--two::before {
  animation-delay: -2s;
}

.login--animal .island-spark {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #fff2b8;
  box-shadow: 0 0 0 4px rgb(255 242 184 / 14%), 0 0 18px rgb(255 242 184 / 80%);
  animation: islandSparkle 4.8s ease-in-out infinite;
}

.login--animal .island-spark--one { top: 22%; left: 31%; animation-delay: -1.2s; }
.login--animal .island-spark--two { top: 30%; right: 36%; width: 5px; height: 5px; animation-delay: -3.4s; }
.login--animal .island-spark--three { top: 47%; left: 14%; width: 4px; height: 4px; animation-delay: -2.2s; }
.login--animal .island-spark--four { top: 57%; right: 11%; width: 6px; height: 6px; animation-delay: -4.1s; }

.login--animal .island-wave {
  position: absolute;
  z-index: 0;
  right: 8%;
  bottom: 23%;
  width: 180px;
  height: 40px;
  border-top: 2px solid rgb(255 255 255 / 30%);
  border-radius: 50%;
  opacity: 0.75;
  animation: islandWaveDrift 10s ease-in-out infinite alternate;
}

.login--animal .island-wave--one { transform: rotate(-5deg); }
.login--animal .island-wave--two { right: 26%; bottom: 18%; width: 120px; opacity: 0.45; animation-delay: -3s; animation-duration: 13s; }

.login--animal .island-leaf {
  position: absolute;
  z-index: 1;
  width: 16px;
  height: 9px;
  border-radius: 100% 0 100% 0;
  background: #79b77b;
  box-shadow: 0 0 0 3px rgb(121 183 123 / 12%);
  animation: islandLeafFloat 11s ease-in-out infinite;
}

.login--animal .island-leaf--one { top: 29%; left: 40%; transform: rotate(26deg); }
.login--animal .island-leaf--two { top: 42%; right: 30%; width: 12px; height: 7px; opacity: 0.72; transform: rotate(-18deg); animation-delay: -5s; animation-duration: 14s; }

.login--animal .flow-link {
  position: relative;
  overflow: hidden;
  background-size: 220% 100%;
  animation: islandFlowLink 5s linear infinite;
}

.login--animal .flow-link::after {
  position: absolute;
  top: -2px;
  bottom: -2px;
  left: -30%;
  width: 28%;
  content: '';
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 68%), transparent);
  animation: islandFlowSweep 4.4s ease-in-out infinite;
}

.login--animal .flow-step:nth-child(1),
.login--animal .flow-step:nth-child(3),
.login--animal .flow-step:nth-child(5) {
  animation: islandStepPulse 5.5s ease-in-out infinite;
}

.login--animal .flow-step:nth-child(3) { animation-delay: -1.8s; }
.login--animal .flow-step:nth-child(5) { animation-delay: -3.6s; }

.login--animal .feature-card {
  animation: islandFeatureFloat 8s ease-in-out infinite;
}

.login--animal .feature-card:nth-child(2) { animation-delay: -2s; }
.login--animal .feature-card:nth-child(3) { animation-delay: -4s; }

@media (max-width: 560px) {
  .login--animal .flow-link {
    background: linear-gradient(180deg, #8fc991, #badb91);
  }

  .login--animal .flow-link.is-complete {
    background: linear-gradient(180deg, #79bd88, #a8d68c);
  }

  .login--animal .flow-link::before {
    top: 0;
    left: 50%;
  }

  .login--animal .flow-link.is-complete::before {
    top: 100%;
    left: 50%;
  }
}

html[data-color-mode='dark'] .login--animal {
  color: #d8ecd2;
  background: radial-gradient(circle at 14% 16%, rgb(92 180 164 / 20%), transparent 22%), radial-gradient(circle at 84% 12%, rgb(239 195 108 / 22%), transparent 20%), linear-gradient(135deg, #183934 0%, #254852 52%, #4b4a38 100%);

  .login-hero {
    color: #cce5ca;
    background: rgb(38 73 66 / 88%);
    border-color: #5d8778;
  }

  .island-water {
    opacity: 0.7;
  }

  .island-ground {
    opacity: 0.78;
  }

  .login-form {
    color: #d8ecd2;
    background: rgb(38 58 55 / 92%);
    border-color: #5d8778;
  }

  .login-form :deep(.el-input__wrapper) {
    border-color: #66867a;
    background: #263a38;
    box-shadow: 0 3px 0 #182625;
  }

  .login-form :deep(.el-input__inner) {
    color: #e1f0d8;
  }

  .login-form :deep(.el-checkbox__label),
  .link-type {
    color: #b9d2b7;
  }

  .title,
  .hero-title {
    color: #e6f0d5;
  }

  .hero-desc,
  .subtitle {
    color: #b9d2b7;
  }
}

@keyframes islandSkyShift {
  from { background-position: 0% 0%; }
  to { background-position: 100% 100%; }
}

@keyframes islandCardSheen {
  0%, 18% { transform: translateX(-48%) rotate(8deg); opacity: 0; }
  34% { opacity: 0.7; }
  56%, 100% { transform: translateX(48%) rotate(8deg); opacity: 0; }
}

@keyframes islandFormGlow {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.72; }
}

@keyframes islandSunFloat {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-8px, 8px, 0) scale(1.04); }
}

@keyframes islandSunOrbit {
  to { transform: rotate(360deg); }
}

@keyframes islandSunGlow {
  0%, 100% { opacity: 0.45; transform: scale(0.96); }
  50% { opacity: 0.9; transform: scale(1.08); }
}

@keyframes islandCloudDriftOne {
  from { transform: translate3d(-12px, 0, 0) scale(0.8); }
  to { transform: translate3d(54px, 8px, 0) scale(0.86); }
}

@keyframes islandCloudDriftTwo {
  from { transform: translate3d(18px, 0, 0) scale(0.56); }
  to { transform: translate3d(-46px, -6px, 0) scale(0.62); }
}

@keyframes islandWaterFlow {
  from { background-position: 0 0, 0 0; }
  to { background-position: 0 0, 18% 0; }
}

@keyframes islandWaveDrift {
  from { transform: translate3d(-24px, 0, 0) rotate(-2deg); }
  to { transform: translate3d(32px, 5px, 0) rotate(2deg); }
}

@keyframes islandGroundFloat {
  from { transform: rotate(-5deg) translate3d(0, 0, 0); }
  to { transform: rotate(-4deg) translate3d(-8px, -6px, 0); }
}

@keyframes islandTreeSwayOne {
  from { transform: scale(0.72) rotate(-4deg); }
  to { transform: scale(0.72) rotate(1deg); }
}

@keyframes islandTreeSwayTwo {
  from { transform: scale(0.54) rotate(5deg); }
  to { transform: scale(0.54) rotate(10deg); }
}

@keyframes islandCanopySway {
  from { transform: translateX(-50%) rotate(-2deg); }
  to { transform: translateX(-50%) rotate(3deg) scale(1.03); }
}

@keyframes islandSparkle {
  0%, 100% { opacity: 0.25; transform: translate3d(0, 4px, 0) scale(0.7); }
  45% { opacity: 1; transform: translate3d(0, -7px, 0) scale(1.1); }
  65% { opacity: 0.6; transform: translate3d(3px, -3px, 0) scale(0.9); }
}

@keyframes islandLeafFloat {
  0%, 100% { opacity: 0.35; transform: translate3d(0, 6px, 0) rotate(18deg); }
  50% { opacity: 0.95; transform: translate3d(24px, -20px, 0) rotate(56deg); }
}

@keyframes islandFlowLink {
  from { background-position: 0 0; }
  to { background-position: 220% 0; }
}

@keyframes islandFlowSweep {
  0%, 18% { left: -30%; opacity: 0; }
  34% { opacity: 1; }
  58%, 100% { left: 110%; opacity: 0; }
}

@keyframes islandStepPulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes islandFeatureFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@media (prefers-reduced-motion: reduce) {
  .login *,
  .login::before,
  .login::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }

  .login--animal .login-shell,
  .login--animal .login-island-scene {
    transform: none;
    transition: none;
  }
}
</style>
