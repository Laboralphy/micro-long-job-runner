<template>
  <div class="spread-height">
    <div class="flex-container">
      <div class="flex-item">
        <div class="terminal-container">
          <Terminal
              :content="scrGetActiveScreen.lines"
              :caption="scrGetActiveScreen.caption"
              :password="scrGetActiveScreen.password"
              :status="scrGetActiveScreen.status"
              theme="gray"
              @command="({ command }) => sendCommand(command)"
          ></Terminal>
        </div>
      </div>
<!--      <div class="flex-item theme" data-theme="gray">-->
<!--        <SidePanel></SidePanel>-->
<!--      </div>-->
    </div>
  </div>
</template>

<script>
import Terminal from "./Terminal.vue";
import screensMixin from '../mixins/screens';
import terminalMixin from '../mixins/terminal';
import SidePanel from './SidePanel.vue';

export default {
  name: "Application",
  components: { SidePanel, Terminal},
  mixins: [screensMixin, terminalMixin],
  methods: {
    sendCommand: function(sCommand) {
      this.termSubmitCommand({ command: sCommand });
    }
  }
}
</script>

<style scoped>
.flex-container {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-content: stretch;
  align-items: stretch;
  height: 100%;
}

.flex-item {
  align-self: auto;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

.flex-item:nth-child(1) {
  order: 0;
  flex: auto;
}

.flex-item:nth-child(2) {
  order: 0;
  flex: none;
  width: 10em;
}

.terminal-container {
  min-width: 40ch;
  height: 100%;
}
</style>
