import {createNamespacedHelpers} from 'vuex'

const {
    mapMutations: screensMapMutations,
    mapActions: screensMapActions,
    mapGetters: screensMapGetters
} = createNamespacedHelpers('screens');

export default {
    methods: {
        ...screensMapActions({
            scrWriteLine: 'writeLine'
        }),
        ...screensMapMutations({
            scrSetActiveScreen: 'setActiveScreen',
            scrStoreText: 'storeMessage',
            scrReplaceLastText: 'replaceLastText'
        })
    },
    computed: {
        ...screensMapGetters({
            scrGetActiveScreen: 'getActiveScreen'
        })
    }
};
