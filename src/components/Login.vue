<template>
  <section id="login">
    <div class="left">
      <router-view name="left"></router-view>
    </div>
    <div class="right">
      <video loop muted autoplay>
        <source src="~@/assets/video/login.mp4" type="video/mp4">
      </video>
      <div :class="['right-content', routeClassName]">
        <router-view name="right"></router-view>
      </div>
    </div>
  </section>
</template>
<script>
import { defaultSettings } from '../constants';
import { store } from '../store';
import router from '../router';

export default {
  beforeDestroy() {
    this.$store.commit('resetRequests');
  },

  computed: {
    routeClassName() {
      return _.kebabCase(this.$route.path);
    },
  },

  mounted() {
    if (this.$services.wallets.getCurrentWallet()) {
      this.$router.push(this.$constants.defaultSettings.LANDING_ROUTE);
    }
  },

  beforeRouteEnter(to, from, next) {
    if (Object.prototype.hasOwnProperty.call(to.query, 'ref')) {
      store.commit('setLoginRef', to.query.ref);
      router.replace(defaultSettings.LOGIN_ROUTE);
      return;
    }
    next();
  },
};
</script>

<style lang="scss">
#login {
  display: flex;

  .left, .right {
    flex: 1;
  }

  .left {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .right {
    overflow: hidden;
    position: relative;

    video {
      bottom: 0;
      height: 100%;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
    }
  }

  .right-content {
    @include transition(background-color);

    align-items: center;
    background-color: rgba($dark, .7);
    bottom: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;

    &.login {
      background: none;
    }

    &.login-wallet-created {
      background-color: $background;
    }
  }
}
</style>
