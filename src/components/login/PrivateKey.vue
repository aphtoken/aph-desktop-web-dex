<template>
  <section id="login--saved-wallet">
    <login-form-wrapper identifier="openPrivateKey" :on-submit="login">
      <aph-input :hasError="$isFailed('openPrivateKey')" v-model="wif" :placeholder="$t('enterYourPrivateKeyWIF')" type="password"></aph-input>
      <button class="login" :disabled="shouldDisableLoginButton">{{$t('login')}}</button>
    </login-form-wrapper>
  </section>
</template>

<script>
import LoginFormWrapper from './LoginFormWrapper';

export default {
  components: {
    LoginFormWrapper,
  },

  computed: {
    shouldDisableLoginButton() {
      return this.wif.length === 0;
    },
  },

  data() {
    return {
      wif: '',
    };
  },

  methods: {
    login() {
      this.$store.dispatch('openPrivateKey', {
        wif: this.wif,
        done: this.$services.login.success,
      });
    },
  },
};
</script>

<style lang="scss">
#login--saved-wallet {
  max-width: toRem(400px);
  width: 60%;

  .aph-input {
    margin-top: $space-lg;
  }

  .login {
    @extend %btn-outline;

    margin-top: $space-xl;
  }
}
</style>
