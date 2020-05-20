import terminal from './terminal';
import plugin from './plugin';

export default {
    modules: {
        terminal
    },
    plugins: [plugin()]
};