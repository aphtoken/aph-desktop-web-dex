<template>
  <section id="preview-header">
    <a href="/login" class="login-to-trade-btn">Login To Trade</a>
  </section>
</template>

<script>
export default {

};
</script>

<style lang="scss">
#preview-header {
  background: $purple;
  padding: $space;
  display: flex;
  justify-content: center;

  .login-to-trade-btn {
    @extend %btn-outline;

    border-color: #fff;
    width: auto;
    padding-left: $space-lg;
    padding-right: $space-lg;
  }
}
</style>
