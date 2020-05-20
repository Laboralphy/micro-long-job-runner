import TxatConnector from '../../libs/txat-connector';
import * as TERMINAL_MUTATIONS from '../terminal/mutation_types';

export default function main() {

    const tc = new TxatConnector();

    return store => {

        function commit(namespace, mutation, payload) {
            store.commit(namespace + '/' + mutation, payload);
        }

        tc.events.on('connected', () => {
            commit('terminal', TERMINAL_MUTATIONS.WRITE_LINE, {content: 'Connected to server.'});
        });

        commit('terminal', TERMINAL_MUTATIONS.WRITE_LINE, {content: 'Connecting...'});
        tc.connect();

        store.subscribeAction(async (action) => {
            switch (action.type) {
                case 'terminal/SUBMIT_COMMAND':
                    console.log('emiting', action.payload.content, tc.connected);
                    tc._socket.emit('message', {message: action.payload.content});
                    break;
            }
        });
    };
}