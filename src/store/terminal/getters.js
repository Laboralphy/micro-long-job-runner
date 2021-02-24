export const getContent = state => state.lines;
export const getPasswordMode = state => state.password;
export const getTitle = state => state.title;
export const isBusy = state => state.busy;
export const isBufferEmpty = state => state.buffer.length === 0;
export const getNextBufferLine = state => state.buffer.length > 0 ? state.buffer[0] : '';
export const isUsingBuffer = state => state.useBuffer;
export const getProgressLine = state => state.progressLine;
