<template>
  <section id="login--landing">
    <aph-icon name="logo"></aph-icon>
    <div class="version-number">v{{$store.state.version}}</div>
    <div class="btn-group">
      <router-link class="login-btn" to="/login/menu">
        <aph-icon name="wallet"></aph-icon>
        <p>{{ $t('login') }}</p>
      </router-link>
      <router-link class="create-wallet-btn" to="/login/create-wallet">
        <aph-icon name="create"></aph-icon>
        <p>{{ $t('createWallet') }}</p>
      </router-link>
    </div>
    <div class="explore-link">
      <router-link to="/app/trade" class="explore-dex-btn">{{ $t('exploreTheDex') }}</router-link>
    </div>
    <div class="support-links">Need help? <a href="https://www.youtube.com/watch?v=E6g593LZx0Q" target="_blank">View the Tutorial</a> or<br>join our <a href="https://t.me/apheliontoken" target="_blank">Telegram</a> channel.</div>
    <!-- <router-link class="settings-btn" to="login">Settings</router-link> -->
  </section>
</template>

<script>
export default {
  components: {},
};
</script>

<style lang="scss">
#login--landing {
  align-items: center;
  display: flex;
  flex-direction: column;

  .icon.logo {
    height: 20rem;
  }

  .version-number {
    @extend %small-uppercase-grey-label-dark;
  }

  .login-btn, .create-wallet-btn {
    @extend %btn-square;

    box-shadow: $box-shadow-lg;
  }

  .settings-btn {
    @extend %btn-outline;

    color: $purple;
    margin-top: $space * 5;
  }

  .btn-group {
    display: flex;
    flex-direction: row;
    margin-top: $space * 5;

    > .create-wallet-btn {
      margin-left: $space-xl;
    }

    svg {
      &.wallet {
        height: toRem(44px);
      }
    }
  }

  .explore-link {
    // font-size: toRem(16px);
    font-family: GilroySemibold;
    margin-top: $space-lg;
    text-align: center;
    width: 100%;

    .explore-dex-btn {
      @extend %btn;
    }
  }

  .support-links {
    margin-top: $space-lg;
    text-align: center;
    line-height: $copy-line-height;
  }
}
</style>
