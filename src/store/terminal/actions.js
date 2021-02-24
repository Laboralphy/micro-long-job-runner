/**
 * A command is submitted, this action is intercepted by terminal plugin
 */
export function submitCommand({dispatch}, {command}) {
    dispatch('writeLine', {content: command, immediate: true});

}

export function writeLine({dispatch, commit, getters}, {content, immediate = false}) {
    if (getters.isUsingBuffer && !immediate) {
        commit('appendBufferLine', {content});
        if (!getters.isBusy) {
            dispatch('displayLinesFromBuffer');
        }
    } else {
        commit('appendLine', {content});
    }
}

export function displayLinesFromBuffer({dispatch, commit, getters}) {
    if (getters.isBufferEmpty) {
        commit('setBusy', {value: false});
    } else {
        commit('setBusy', {value: true});
        const s = getters.getNextBufferLine;
        commit('shiftBufferLine');
        let i = 0;
        const CHUNK_SIZE = 24;
        let nInterval = 0;
        const procInterval = () => {
            const content = s.substr(0, i + CHUNK_SIZE);
            if (i === 0) {
                commit('appendLine', {content});
            } else if (i >= s.length) {
                clearInterval(nInterval);
                dispatch('displayLinesFromBuffer');
            } else {
                commit('replaceLine', {content});
            }
            i += CHUNK_SIZE;
        }
        nInterval = setInterval(procInterval, 64);
    }
}
