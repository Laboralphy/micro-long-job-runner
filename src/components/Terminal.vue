<template>
  <div class="terminal theme" @click="$refs.commandLine.focus()" :data-theme="theme">
    <div class="row header">
      <span class="menu">≡</span><span class="caption">{{ caption }}</span>
    </div>
    <div class="row content">
      <RichText
          :text="content"
          @link="sText => doLinkAction(sText)"
      ></RichText>
      <div v-if="status !== undefined">{{ status }}</div>
      <label ref="commandLine">
        <input
            v-if="password"
            type="password"
            placeholder="***password***"
            v-model="passwordString"
            class="command"
            @keypress.enter="$emit('password', inputString)"
        />
        <input
            v-else
            type="text"
            v-model="inputString"
            placeholder="command>"
            class="command"
            @keypress.enter="notifyCommand"
        />
      </label><br ref="lastItem"/>
    </div>
  </div>
</template>

<script>
import RichText from './RichText.vue'
export default {
  name: "Terminal",
  components: { RichText },
  props: {
    content: {
      type: Array,
      required: true
    },
    caption: {
      type: String,
      required: false
    },
    status: {
      type: String,
      required: false
    },
    password: {
      type: Boolean,
      required: false,
      default: false
    },
    theme: {
      type: String,
      required: false,
      default: 'green'
    }
  },
  data: function () {
    return {
      inputString: '',
      passwordString: ''
    }
  },

  methods: {
    notifyCommand: function() {
      const sCommand = this.inputString;
      if (sCommand !== '') {
        this.inputString = '';
        this.$emit('command', { command: sCommand });
      }
    },
    notifyPassword: function() {
      const sCommand = this.inputString;
      this.inputString = '';
      this.$emit('command', { command: sCommand });
    },
    doLinkAction: function (command) {
      this.$emit('command', { command });
    }
  },

  updated() {
    this.$refs.lastItem.scrollIntoView();
  }
}
</script>

<style scoped>

.terminal {
  display: flex;
  flex-flow: column;
  height: 100%;
  width: 100%;
}

.terminal .row.header {
  flex: 0 1 auto;
}

.terminal .row.content {
  flex: 1 1 auto;
  overflow: auto;
}

.menu {
  padding-left: 0.5em;
  padding-right: 0.5em;
  cursor: pointer;
}

input.command:focus {
  outline: none;
}
</style>
