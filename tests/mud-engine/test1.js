const MUDEngine = require('../../server/services/mud/MUDEngine');

const m = new MUDEngine();
m._state.entities['player::111'] = {
    type: 'player',
    name: 'adv',
    location: 'room::b3009',
    inventory: [
        'item::k3011xx'
    ],
    skills: {
        spot: 5,
        picklock: 5
    },
    spotted: {},
    events: []
};

m.events.on('player-event', ({ id, message }) => {
    console.log('*', message);
});

m.events.on('room-event', ({ id, message }) => {
    console.log('[ROOM]', message);
});

function test1 () {

    function display() {
        console.log(' ');
        console.log(m.renderPlayerVisualReport(pid).join('\n'));
    }

    const pid = 'player::111';

    display();
    m.actionPlayerMove(pid, 'e');
    display();
    m.actionPlayerSearch(pid, 'sw');
    m.actionPlayerSearch(pid, 'se');
    display();
    m.actionPlayerMove(pid, 'se');
    display();
    m.actionPlayerMove(pid, 'nw');
    display();
    m.actionPlayerMove(pid, 's');
    display();
    m.actionPlayerMove(pid, 's');
    display();
    m.actionPlayerPicklock(pid, 'w');
    display();
    m.actionPlayerMove(pid, 'w');
    display();
}

test1();
