const DATA = {
    creatures: {
        c1: {
            name: 'hero',
            skill: 10,
            stamina: 160,
            weapon: 'sword_1'
        },
        c2: {
            name: 'goblin',
            skill: 5,
            stamina: 40,
            weapon: 'dagger_0'
        }
    },
    baseweapons: {
        sword: {
            damages: [10, 20],
            type: 'slashing',
            effects: []
        },
        dagger: {
            damages: [5, 10],
            type: 'piercing',
            effects: []
        }
    },
    weapons: {
        sword_1: {
            name: 'Epée de bonne qualité',
            base: 'sword',
            factor: 1.1,
            effects: []
        },
        dagger_0: {
            name: 'Dague ordinaire',
            base: 'dagger',
            factor: 1,
            effects: []
        }
    }
}