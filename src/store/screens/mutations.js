export function storeText(state, { screen, text }) {
    const oScreen = state.screens.find(s => s.id === screen);
    oScreen.lines.push(text);
}

export function replaceLastText(state, { screen, text }) {
    const oScreen = state.screens.find(s => s.id === screen);
    if (oScreen.lines.length > 0) {
        oScreen.lines.pop();
    }
    oScreen.lines.push(text);
}

export function createScreen (state, { id, caption, maxLineCount = 300 }) {
    state.screens.push({
        id,
        caption,
        lines: [],
        status: '',
        maxLineCount: 300,
        password: false
    });
}

export function destroyScreen (state, { screen }) {
    let iScreen = state.screens.findIndex(s => s.id === screen);
    if (iScreen >= 0) {
        state.screens.splice(iScreen, 1);
        iScreen = Math.min(state.screens.length - 1, Math.max(0, iScreen));
        state.activeScreen = state.screens[iScreen].id;
    }
}

export function clearScreen (state, { screen }) {
    const oScreen = state.screens.find(s => s.id === screen);
    if (oScreen) {
        oScreen.lines.splice(0, oScreen.lines.length);
    }
}

export function setActiveScreen (state, { screen }) {
    if (state.screens.find(s => s.id === screen)) {
        state.activeScreen = screen;
    }
}

export function setPasswordMode (state, { screen, value }) {
    const oScreen = state.screens.find(s => s.id === screen);
    oScreen.password = value;
}

export function setCaption (state, { screen, value }) {
    const oScreen = state.screens.find(s => s.id === screen);
    oScreen.caption = value;
}

export function setStatus (state, { screen, value }) {
    const oScreen = state.screens.find(s => s.id === screen);
    oScreen.statusBar = value;
}

export function setMaxLineCount (state, { screen, value }) {
    const oScreen = state.screens.find(s => s.id === screen);
    oScreen.maxLineCount = value;
}
