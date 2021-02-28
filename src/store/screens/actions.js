export async function writeLine({dispatch, commit, getters}, { screen = undefined, text }) {
    if (screen === '*') {
        getters.getScreens.forEach(s => {
            commit('storeText', { screen: s.id, text });
        })
    } else if (screen) {
        await dispatch('createScreen', { id: screen });
        commit('storeText', { screen, text });
    } else {
        commit('storeText', { screen: getters.getActiveScreen.id, text });
    }
}

export function createScreen({dispatch, commit, getters}, { id, go = false }) {
    if (!getters.getScreens.find(s => s.id === id)) {
        // the screen does not exist yet
        commit('createScreen', { id, caption: id });
        if (go) {
            commit('setActiveScreen', { screen: id });
        }
    }
}

export function destroyScreen({dispatch, commit, getters}, { screen }) {
    commit('destroyScreen', { screen });
}

export function clearScreen({dispatch, commit, getters}, { screen }) {
    commit('clearScreen', { screen });
}
