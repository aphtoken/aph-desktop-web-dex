<template>
  <section id="preview-wrapper" :class="[$store.state.styleMode]">
    <router-view></router-view>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';

let loadTokensIntervalId;

export default {
  beforeDestroy() {
    clearInterval(loadTokensIntervalId);
    this.$disconnect(); // Disconnect websocket
  },

  beforeMount() {
    this.connectWebsocket();
  },

  computed: {
    ...mapGetters([
      'websocketUri',
    ]),
  },

  data() {
    return {
      //
    };
  },

  methods: {
    connectWebsocket() {
      this.$connect(this.websocketUri);
    },
  },

  mounted() {
    this.$services.neo.fetchNEP5Tokens();

    loadTokensIntervalId = setInterval(() => {
      this.$services.neo.fetchNEP5Tokens();
    }, this.$constants.intervals.TOKENS_POLLING);
  },

  watch: {
    websocketUri(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.$disconnect();
        this.connectWebsocket();
      }
    },
  },
};
</script>

<style lang="scss">
#preview-wrapper {
  display: flex;
  flex-direction: row;
  overflow: hidden;

  > .content {
    background: $background;
    display: flex;
    flex-direction: column;
    flex: 1;
  }
}
</style>
