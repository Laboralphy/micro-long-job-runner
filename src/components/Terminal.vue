<template>
  <div class="terminal" @click="$refs.commandLine.focus()">
    <div class="row header">
      <span class="menu">≡</span><span class="caption">{{ getTerminalTitle }}</span>
    </div>
    <div class="row content">
      <div v-for="l in getTerminalContent">{{ l }}</div>
      <div v-if="getTerminalProgressLine !== ''">{{ getTerminalProgressLine }}</div>
      <label ref="commandLine">
        <input
            v-if="getTerminalPasswordMode"
            type="password"
            placeholder="***password***"
            v-model="inputString"
            class="command"
            @keypress.enter="enterCommand"
        />
        <input
            v-else
            type="text"
            v-model="inputString"
            placeholder="command>"
            class="command"
            @keypress.enter="enterCommand"
        />
      </label><br ref="lastItem" />
    </div>
  </div>
</template>

<script>
    import terminalMixin from "../mixins/terminal";
    export default {
        name: "Terminal",
        mixins: [terminalMixin],
        data: function() {
            return {
                inputString: ''
            }
        },

        methods: {
            enterCommand() {
                this.terminalSubmitCommand({command: this.inputString});
                this.inputString = '';
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
  flex-grow: 0;
  flex-shrink: 1;
  flex-basis: auto;
  color: #0F4;
  background-color: rgba(0, 15, 0, 0.2);
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