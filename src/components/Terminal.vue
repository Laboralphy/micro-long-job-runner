<template>
    <div class="terminal" @click="$refs.commandLine.focus()">
        <div v-for="l in getTerminalContent">{{ l }}&nbsp;</div>
        <label>
            <input ref="commandLine" v-model="inputString" class="command" type="text" @keypress.enter="enterCommand"/>
        </label><br ref="lastItem" />
    </div>
</template>

<script>
    import { createNamespacedHelpers } from 'vuex';
    import * as ACTIONS from '../store/terminal/action_types';
    const { mapGetters: terminalGetters, mapActions: terminalActions } = createNamespacedHelpers('terminal');
    export default {
        name: "Terminal",

        data: function() {
            return {
                inputString: ''
            }
        },

        computed: {
            ...terminalGetters(['getTerminalContent'])
        },

        methods: {
            ...terminalActions({
                submitCommand: ACTIONS.SUBMIT_COMMAND
            }),
            enterCommand() {
                this.submitCommand({content: this.inputString});
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
        border: none;
        width: 100%;
        height: 100%;
        overflow: auto;
    }
</style>