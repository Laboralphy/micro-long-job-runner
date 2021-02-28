<template>
  <div class="spread-height">
    <Terminal
        :content="scrGetActiveScreen.lines"
        :caption="scrGetActiveScreen.caption"
        :password="scrGetActiveScreen.password"
        :status="scrGetActiveScreen.status"
        theme="green"
        @command="({ command }) => sendCommand(command)"
    ></Terminal>
  </div>
</template>

<script>
import Terminal from "./Terminal.vue";
import screensMixin from '../mixins/screens'
import terminalMixin from '../mixins/terminal'

export default {
  name: "Application",
  components: {Terminal},
  mixins: [screensMixin, terminalMixin],
  methods: {
    sendCommand: function(sCommand) {
      this.termSubmitCommand({ command: sCommand });
    }
  }
}
</script>

<style scoped>

</style>