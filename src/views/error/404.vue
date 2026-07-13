<template>
  <div class="wscn-http404-container">
    <div class="wscn-http404">
      <div class="pic-404">
        <img class="pic-404__parent" src="@/assets/404_images/404.png" alt="404" />
        <img class="pic-404__child left" src="@/assets/404_images/404_cloud.png" alt="404" />
        <img class="pic-404__child mid" src="@/assets/404_images/404_cloud.png" alt="404" />
        <img class="pic-404__child right" src="@/assets/404_images/404_cloud.png" alt="404" />
      </div>
      <div class="bullshit">
        <div class="bullshit__oops">{{ $t('common.error404') }}</div>
        <div class="bullshit__headline">
          {{ message }}
        </div>
        <div class="bullshit__info">
          对不起，您正在寻找的页面不存在。尝试检查URL的错误，然后按浏览器上的刷新按钮或尝试在我们的应用程序中找到其他内容。
        </div>
        <router-link to="/index" class="bullshit__return-home">{{ $t('common.returnHome') }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const message = computed(() => {
  return '找不到网页！';
});
</script>

<style lang="scss" scoped>
.wscn-http404-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.wscn-http404 {
  display: flex;
  align-items: center;
  gap: 48px;
  max-width: 1000px;
  width: 100%;

  .pic-404 {
    position: relative;
    flex: 0 0 400px;
    max-width: 400px;

    &__parent {
      width: 100%;
      height: auto;
    }

    &__child {
      position: absolute;

      &.left {
        width: 16%;
        top: 5%;
        left: 38%;
        opacity: 0;
        animation: cloudLeft 2s linear 1s forwards;
      }

      &.mid {
        width: 10%;
        top: 3%;
        left: 70%;
        opacity: 0;
        animation: cloudMid 2s linear 1.2s forwards;
      }

      &.right {
        width: 13%;
        top: 28%;
        left: 82%;
        opacity: 0;
        animation: cloudRight 2s linear 1s forwards;
      }
    }
  }

  .bullshit {
    flex: 1;
    min-width: 240px;

    &__oops {
      font-size: var(--app-text-3xl, 24px);
      font-weight: bold;
      line-height: 1.2;
      color: var(--app-accent-strong);
      margin-bottom: 16px;
      opacity: 0;
      animation: slideUp 0.5s forwards;
    }

    &__headline {
      font-size: var(--app-text-xl, 18px);
      line-height: 1.3;
      color: var(--app-text-title);
      font-weight: bold;
      margin-bottom: 12px;
      opacity: 0;
      animation: slideUp 0.5s 0.1s forwards;
    }

    &__info {
      font-size: var(--app-text-sm, 13px);
      line-height: 1.6;
      color: var(--app-text-muted);
      margin-bottom: 24px;
      opacity: 0;
      animation: slideUp 0.5s 0.2s forwards;
    }

    &__return-home {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      padding: 0 24px;
      background: var(--app-accent-strong);
      color: #ffffff;
      border-radius: 999px;
      font-size: var(--app-text-sm, 13px);
      font-weight: 600;
      text-decoration: none;
      opacity: 0;
      animation: slideUp 0.5s 0.3s forwards;
      transition:
        background-color 0.2s ease,
        transform 0.2s ease;

      &:hover {
        background: #0c8dc9;
        transform: translateY(-1px);
      }
    }
  }
}

// 云朵动画（相对值版本）
@keyframes cloudLeft {
  0% { top: 5%; left: 38%; opacity: 0; }
  20% { top: 7%; left: 32%; opacity: 1; }
  80% { top: 17%; left: 16%; opacity: 1; }
  100% { top: 19%; left: 10%; opacity: 0; }
}

@keyframes cloudMid {
  0% { top: 3%; left: 70%; opacity: 0; }
  20% { top: 8%; left: 60%; opacity: 1; }
  70% { top: 26%; left: 30%; opacity: 1; }
  100% { top: 31%; left: 20%; opacity: 0; }
}

@keyframes cloudRight {
  0% { top: 28%; left: 82%; opacity: 0; }
  20% { top: 32%; left: 76%; opacity: 1; }
  80% { top: 44%; left: 56%; opacity: 1; }
  100% { top: 48%; left: 50%; opacity: 0; }
}

@keyframes slideUp {
  0% { transform: translateY(30px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@media (max-width: 768px) {
  .wscn-http404 {
    flex-direction: column;
    text-align: center;
    gap: 24px;

    .pic-404 {
      flex: 0 0 240px;
      max-width: 240px;
    }
  }
}
</style>
