<template>
  <section>
    <div class="rich-text" v-if="text !== ''">
      <span
          v-for="(p, i) in getTokenizedText"
          :key="i"
          :class="'rich-string ' + p.tokens.join(' ')"
          @click="doClick('link' in p ? p.link : false)"
          :title="'link' in p ? p.link : false"
      >{{ p.text }}</span>
    </div>
    <div class="rich-text" v-else>
      <br />
    </div>
  </section>
</template>

<script>
import CurlyTokenizer from '../../libs/curly-tokenizer';
import quoteSplit from '../../libs/quote-split/node';
const ct = new CurlyTokenizer();

export default {
  name: 'RichString',
  props: {
    text: {
      type: String,
      required: true
    }
  },
  computed: {
    getTokenizedText: function () {
      const aParsed = ct.parse(this.text);
      aParsed.forEach(p => {
        if (p.tokens.includes('link')) {
          const aSplit = quoteSplit(p.text);
          const sLink = aSplit.shift();
          const sNewText = aSplit.join(' ');
          p.link = sLink;
          p.text = sNewText;
        }
      });
      return aParsed;
    }
  },
  methods: {
    doClick (sText) {
      if (sText) {
        this.$emit('link', sText);
      }
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
