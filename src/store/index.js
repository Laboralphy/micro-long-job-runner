import terminal from './terminal';
import screens from './screens';
import connectorPlugin from './plugin/connector';

export default {
    modules: {
        terminal,
        screens
    },
    plugins: [connectorPlugin()]
};
