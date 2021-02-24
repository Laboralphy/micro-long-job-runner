/**
 * adds a line line at the end of the terminal output text
 * @param state
 * @param content {string}
 */
export function appendLine(state, {content}) {
    state.lines.push(content);
    while (state.lines.length > state.maxLineCount) {
        state.lines.shift();
    }
}

/**
 * Replace the last appended line
 * @param state
 * @param content
 */
export function replaceLine(state, {content}) {
    state.lines.pop();
    state.lines.push(content);
}

/**
 * set password mode. during password mode, input type is set to password
 * so when typing, no characters are visible.
 * @param state
 * @param value {boolean}
 */
export function setPasswordMode(state, {value}) {
    state.password = value;
}

/**
 * Sets a new title
 * @param state
 * @param value {string}
 */
export function setTitle(state, {value}) {
    state.title = value;
}

export function appendBufferLine(state, {content}) {
    state.buffer.push(content);
}

export function shiftBufferLine(state) {
    state.buffer.shift();
}

export function setBusy(state, {value}) {
    state.busy = value;
}

export function setProgressLine(state, {value}) {
    state.progressLine = value;
}
