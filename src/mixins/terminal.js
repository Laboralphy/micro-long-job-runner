import {createNamespacedHelpers} from 'vuex'

const {
    mapActions: terminalMapActions
} = createNamespacedHelpers('terminal');

export default {
    methods: {
        ...terminalMapActions({
            termSubmitCommand: 'submitCommand'
        })
    }
}
