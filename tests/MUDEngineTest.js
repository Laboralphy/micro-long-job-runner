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
                content: [
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

function createState2() {
    const s = createState1();
    s.rooms["room::r1"].content.push(
        {
            blueprint: "blueprint::or",
            stack: 100
        }
    )
    return s;
}

describe('#MUDEngine', function () {
    describe('inventory', function () {
        it("vérifier identifiant local d'entité", function() {
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
            expect(oItem.ref).toBe('blueprint::a1');

            expect(p.inventory).not.toBeNull();

            const oTrans1 = m.moveItem(oItem.id, pid);
            expect(oTrans1).toBeDefined();
            expect(Object.keys(p.inventory).length).toBe(1);
            expect(Object.keys(p.inventory)[0]).toBe(oItem.id);
            expect(m.getRoomLocalEntity('room::r1', 'i1')).toBeNull();

        });

        it('rammasser l\'objet i1 puis le poser', function() {
            const m = new MUDEngine();
            m.state = createState1();
            const pid = m.createPlayerEntity('x1', 'test', 'room::r1');
            const oItem = m.getRoomLocalEntity('room::r1', 'i1');
            m.moveItem(oItem.id, pid);
            expect(m.getRoomLocalEntity('room::r1', 'i1')).toBeNull();
            const oItem2 = m.moveItem(oItem.id, 'room::r1');
            expect(oItem2).toBe(oItem);
            m.setEntityLocation(oItem2.id, 'room::r1');
            expect(m.getRoomLocalEntity('room::r1', 'i1')).toBe(oItem2);
        });

        it("retirer des exemplaire d'un objet empilable", function() {
            const m = new MUDEngine();
            m.state = createState1();
            const pid = m.createPlayerEntity('x1', 'test', 'room::r1');
            const oPileSol = m.createEntity('blueprint::or', 'room::r1', 20);
            const idPileSol = oPileSol.id;
            // la pile au sol contient 20 pièces
            // on prend 7 pièces
            expect(oPileSol.blueprint.stackable).toBeTruthy();
            expect(oPileSol.stack > 7).toBeTruthy();
            m.moveItem(idPileSol, pid, 7);
            const p = m.getEntity(pid);
            // la pile au sol ne doit contenir que 13 pièce
            expect(oPileSol.stack).toBe(13);
            const idPileInv = Object.keys(p.inventory)[0];
            const oPileInv = m.getEntity(idPileInv);
            expect(oPileInv.stack).toBe(7);
            // on fait tomber 3 pièce
            const oPile3 = m.moveItem(idPileInv, m.getEntity(pid).location, 3);
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

    describe('checking local id', function () {
        it('rammasser deux objet donne les identifiant locaux i1 et i2.', function () {
            const m = new MUDEngine();
            m.state = createState2();
            const pid = m.createPlayerEntity('x1', 'test', 'room::r1');
            const oItem1 = m.getRoomLocalEntity("room::r1", "i1");
            m.moveItem(oItem1.id, pid);
            const oItem2 = m.getRoomLocalEntity("room::r1", "i2");
            m.moveItem(oItem2.id, pid);
            expect(m.state.entities['player::x1'].inventory).toEqual({ 'entity::1': 'i1', 'entity::3': 'i2' });
            expect(m.isEntityExist('entity::2')).toBeFalsy();
        });
        it('rammasser deux objets (dont 1 stackable) donne les identifiant locaux i1 et i2', function () {
            const m = new MUDEngine();
            m.state = createState2();
            const pid = m.createPlayerEntity('x1', 'test', 'room::r1');
            const oItem1 = m.getRoomLocalEntity("room::r1", "i1");
            const oGP = m.getRoomLocalEntity("room::r1", "i2");
            expect(oItem1.name).toBe('Objet diver 1');
            expect(oGP.name).toBe("Pièce d'or (x100)");
            m.moveItem(oItem1.id, pid);
            expect(m.getInventoryEntities(pid)[0].lid).toBe('i1');
            m.moveItem(oGP.id, pid, 40);
            expect(m.getInventoryEntities(pid)[1].lid).toBe('i2');
            const oGPInBag = m.getInventoryEntities(pid)[1].entity;
            expect(oGPInBag.stack).toBe(40);
            expect(oGP.stack).toBe(60);
            const oItemTrans = m.moveItem(oGP.id, pid, 5);
            expect(oGPInBag.stack).toBe(45);
            expect(oGP.stack).toBe(55);
            expect(oItemTrans.stack).toBe(5);
        });

        it('dropper une pile sur une autre', function () {
            const m = new MUDEngine();
            m.state = createState2();
            const pid = m.createPlayerEntity('x1', 'test', 'room::r1');
            const oGP = m.getRoomLocalEntity("room::r1", "i2");
            m.moveItem(oGP.id, pid, 50);
            expect(oGP.stack).toBe(50);
            const oGPInv = m.getInventoryLocalEntity(pid, 'i1');
            m.moveItem(oGPInv.id, 'room::r1', 50);
            expect(oGP.stack).toBe(100);
        })
    });

});
