import terminal from './terminal';
import plugin from './plugin/terminal';

export default {
    modules: {
        terminal
    },
    plugins: [plugin()]
};