<template>
  <div>
    <canvas ref="mainView" class="main-view" width="640" height="640"></canvas>
  </div>
</template>

<script>
export default {
  name: "SidePanel",

  mounted () {
    const cvs = this.$refs.mainView;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = 'rgb(128, 0, 0)';
    ctx.fillRect(100, 100, 300, 200);
  }
}
</script>

<style scoped>
.main-view {
  width: 19em;
  height: 19em;
}
</style>
