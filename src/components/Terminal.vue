<template>
  <div class="terminal" @click="$refs.commandLine.focus()" :data-theme="theme">
    <div class="row header">
      <span class="menu">≡</span><span class="caption">{{ caption }}</span>
    </div>
    <div class="row content">
      <div v-for="l in content">{{ l }}</div>
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
export default {
  name: "Terminal",
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
    }
  },

  updated() {
    this.$refs.lastItem.scrollIntoView();
  }
}
</script>

<style scoped>

.terminal[data-theme="green"], .terminal[data-theme="green"] input.command {
  color: #0F0;
}

.terminal[data-theme="green"] {
  background: repeating-linear-gradient(#000, #000 3px, #010 3px, #010 6px);
}

.terminal[data-theme="amber"], .terminal[data-theme="amber"] input.command {
  color: #FA0;
}

.terminal[data-theme="amber"] {
  background: repeating-linear-gradient(#000, #000 3px, #0F0A00 3px, #0F0A00 6px);
}

.terminal[data-theme="gray"], .terminal[data-theme="gray"] input.command {
  color: #CCC;
}

.terminal[data-theme="gray"] {
  background: repeating-linear-gradient(#000, #000 3px, #0C0C0C 3px, #0C0C0C 6px);
}


.terminal {
  display: flex;
  flex-flow: column;
  height: 100%;
  width: 100%;
}

.terminal .row.header {
  flex-grow: 0;
  flex-shrink: 1;
  flex-basis: auto;
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
</style>