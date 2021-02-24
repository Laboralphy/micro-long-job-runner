import { createNamespacedHelpers } from 'vuex'

const {
    mapMutations: terminalMapMutations,
    mapActions: terminalMapActions,
    mapGetters: terminalMapGetters
} = createNamespacedHelpers('terminal');

export default {
    methods: {
        ...terminalMapActions({
            terminalSubmitCommand: 'submitCommand',
            terminalWriteLine: 'writeLine'
        }),
        ...terminalMapMutations({
            terminalAppendLine: 'appendLine',
            terminalReplaceLine: 'replaceLine',
            terminalSetPasswordMode: 'setPasswordMode',
            terminalSetTitle: 'setTitle'
        })
    },
    computed: {
        ...terminalMapGetters({
            getTerminalContent: 'getContent',
            getTerminalPasswordMode: 'getPasswordMode',
            getTerminalTitle: 'getTitle',
            getTerminalProgressLine: 'getProgressLine'
        })
    }
}