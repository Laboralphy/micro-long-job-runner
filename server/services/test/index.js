const ServiceAbstract = require('@laboralphy/ws-service/abstract');

class ServiceTest extends ServiceAbstract {
    connectClient(client) {
        const socket = client.socket;
        socket.on('CMD_HELP', () => {
            const text = [
                'Hello everyone!',
                'Packed spell archive',
                'this is my first project.',
                'This is the first spell I created and published.'
            ];
            text.forEach(t => socket.emit('TERM_PRINT', { content: t }));
        });
    }
}

module.exports = ServiceTest;
