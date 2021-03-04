const MUDEngine = require('../libs/mud-engine');

function createState1 () {
    return {
        entities: {},
        blueprints: {
            "blueprint::a1": {
                "type": "item",
                "subtype": "misc",
                "name": "Objet diver 1",
                "desc": [
                    "Cet objet n'a rien de particulier"
                ],
                "uname": "",
                "udesc": [],
                "weight": 1,
                "stackable": false,
                "identified": true,
                "buc": "u",
                "tag": "",
                "inventory": false
            },
            "blueprint::or": {
                "type": "item",
                "subtype": "gold",
                "name": "Pièce d'or",
                "desc": [
                    "Cet objet n'a rien de particulier"
                ],
                "uname": "",
                "udesc": [],
                "weight": 0.0085,
                "stackable": true,
                "identified": true,
                "buc": "u",
                "tag": "",
                "inventory": false
            }
        },
        sectors: {
            "sector::001": {
                name: 'sector 1',
                desc: [
                    'the sector 1'
                ]
            }
        },
        rooms: {
            "room::r1": {
                name: 'room1',
                sector: 'sector::001',
                desc: [
                    'the room 1'
                ],
                nav: {
                     s: {
                         to: 'rooms::r2'
                     }
                },
                defaultEntities: [
                    {
                        "blueprint": "blueprint::a1"
                    }
                ]
            },
            "room::r2": {
                name: 'room2',
                sector: 'sector::001',
                desc: [
                    'the room 2'
                ],
                nav: {
                    n: {
                        to: 'rooms::r1'
                    }
                }
            }
        }
    }
}

describe('#MUDEngine', function () {
    describe('inventory', function () {
        it('vérifier création d\'une entité', function() {
            const m = new MUDEngine();
            m.state = createState1();
            m.createPlayerEntity('x1', 'test', 'room::r1');
            expect(m.getRoomLocalEntity('room::r1', 'i1')).toBeDefined();
        });
        it('vérifier qu\'on puisse rammasser l\'objet i1', function() {
            const m = new MUDEngine();
            m.state = createState1();
            const pid = m.createPlayerEntity('x1', 'test', 'room::r1');
            const p = m.getEntity(pid);
            expect(Object.keys(p.inventory).length).toBe(0);
            const oItem = m.getRoomLocalEntity('room::r1', 'i1');
            expect(m.getRoomEntityStorage('room::r1')[oItem.id]).toBeDefined();
            m.takeItem(pid, oItem.id);
            expect(Object.keys(p.inventory).length).toBe(1);
            expect(Object.keys(p.inventory)[0]).toBe(oItem.id);
            expect(m.getRoomLocalEntity('room::r1', 'i1')).toBeNull();
        });
        it('rammasser l\'objet i1 puis le poser', function() {
            const m = new MUDEngine();
            m.state = createState1();
            const pid = m.createPlayerEntity('x1', 'test', 'room::r1');
            const oItem = m.getRoomLocalEntity('room::r1', 'i1');
            m.takeItem(pid, oItem.id);
            expect(m.getRoomLocalEntity('room::r1', 'i1')).toBeNull();
            const oItem2 = m.dropItem(pid, oItem.id);
            expect(oItem2).toBe(oItem);
            m.setEntityLocation(oItem2.id, 'room::r1');
            expect(m.getRoomLocalEntity('room::r1', 'i1')).toBe(oItem2);
        });
        it('manipuler des stack d\'objet', function() {
            const m = new MUDEngine();
            m.state = createState1();
            const pid = m.createPlayerEntity('x1', 'test', 'room::r1');
            const idPileSol = m.createEntity('blueprint::or', 'room::r1', 20);
            // la pile au sol contient 20 pièces
            // on prend 7 pièces
            m.takeItem(pid, idPileSol, 7);
            const p = m.getEntity(pid);
            // la pile au sol ne doit contenir que 13 pièce
            const oPileSol = m.getEntity(idPileSol);
            expect(oPileSol.stack).toBe(13);
            const idPileInv = Object.keys(p.inventory)[0]
            const oPileInv = m.getEntity(idPileInv);
            expect(oPileInv.stack).toBe(7);
            // on fait tomber 3 pièce
            const oPile3 = m.dropItem(pid, idPileInv, 3);
            expect(oPileInv.stack).toBe(4);
            expect(oPile3.stack).toBe(3);
        });
    });

    describe('moving', function () {
        it('check if we can move from a room to another', function() {
            const m = new MUDEngine();
            m.state = createState1();
            const pid = m.createPlayerEntity('x1', 'test', 'room::r1');
            expect(m.getEntity(pid).location).toBe('room::r1');
            m.setEntityLocation(pid, 'room::r2');
            expect(m.getEntity(pid).location).toBe('room::r2');
        });

    });
});
