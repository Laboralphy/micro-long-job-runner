<template>
  <section>
    <RichString
        v-for="(s, i) in text"
        :text="s"
        :key="'rs-' + i"
        @link="sText => $emit('link', sText)"
    ></RichString>
  </section>
</template>

<script>
import RichString from './RichString.vue';

export default {
  name: 'RichText',
  components: { RichString },
  props: {
    text: {
      type: Array,
      required: true
    }
  }
}
</script>

<style scoped>
section {
  margin: 0;
  padding: 0;
}
</style>
