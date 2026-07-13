<template>
  <div class="errPage-container">
    <el-button icon="arrow-left" class="pan-back-btn" @click="back">{{ $t('common.btnBack') }}</el-button>
    <div class="err-content">
      <div class="err-text">
        <h1 class="text-jumbo">{{ $t('common.error401') }}</h1>
        <h2>{{ $t('common.noAccessPermission') }}</h2>
        <h6>{{ $t('common.noAccessPermissionDesc') }}</h6>
        <ul class="list-unstyled">
          <li class="link-type">
            <router-link to="/">{{ $t('common.backHome') }}</router-link>
          </li>
        </ul>
      </div>
      <div class="err-image">
        <img :src="errGif" alt="Girl has dropped her ice cream." />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import errImage from '@/assets/401_images/401.gif';

const route = useRoute();
const router = useRouter();

const errGif = ref(errImage + '?' + +new Date());

function back() {
  if (route.query.noGoBack) {
    router.push({ path: '/' });
  } else {
    router.go(-1);
  }
}
</script>

<style lang="scss" scoped>
.errPage-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;

  .pan-back-btn {
    align-self: flex-start;
    background: var(--app-accent-strong);
    color: #fff;
    border: none !important;
    border-radius: var(--app-radius-md);
    margin-bottom: 24px;
  }

  .err-content {
    display: flex;
    align-items: center;
    gap: 48px;
    max-width: 800px;
    width: 100%;
  }

  .err-text {
    flex: 1;
  }

  .err-image {
    flex: 0 0 auto;

    img {
      max-width: 100%;
      height: auto;
      object-fit: contain;
    }
  }

  .text-jumbo {
    font-size: var(--app-text-5xl, 36px);
    font-weight: 700;
    color: var(--app-text-title);
    margin: 0 0 8px;
  }

  h2 {
    font-size: var(--app-text-xl, 18px);
    color: var(--app-text-title);
    margin: 0 0 12px;
  }

  h6 {
    font-size: var(--app-text-sm, 13px);
    color: var(--app-text-muted);
    font-weight: 400;
    margin: 0 0 20px;
    line-height: 1.6;
  }

  .list-unstyled {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding-bottom: 5px;
    }

    a {
      color: var(--app-accent-strong);
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

@media (max-width: 640px) {
  .errPage-container .err-content {
    flex-direction: column-reverse;
    text-align: center;
    gap: 24px;

    .err-image img {
      max-width: 200px;
    }
  }
}
</style>
