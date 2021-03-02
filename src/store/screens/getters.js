export const getActiveScreen = state => state.screens.find(s => s.id === state.activeScreen);
export const getScreens = state => state.screens;
