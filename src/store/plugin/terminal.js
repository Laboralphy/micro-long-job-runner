import TxatConnector from '../../../libs/txat-connector';

export default function main() {

    const tc = new TxatConnector();

    return async store => {

        function commit(namespace, mutation, payload) {
            store.commit(namespace + '/' + mutation, payload);
        }

        function dispatch(namespace, action, payload) {
            store.dispatch(namespace + '/' + action, payload);
        }

        function appendLine(content) {
            commit('terminal', 'appendLine', { content });
        }

        function replaceLine(content) {
            commit('terminal', 'replaceLine', { content });
        }

        async function writeLine(content) {
            return dispatch('terminal', 'writeLine', { content });
        }

        await writeLine('Connecting...');
        await tc.connect();
        await writeLine('Connected to server.');

        store.subscribeAction(async (action) => {
            switch (action.type) {
                case 'terminal/SUBMIT_COMMAND':
                    tc._socket.emit('message', {message: action.payload.content});
                    break;
            }
        });
    };
}
