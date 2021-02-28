export const getActiveScreen = state => {
    const x = state.screens.find(s => s.id === state.activeScreen);
    if (x === undefined) {
        console.log(JSON.parse(JSON.stringify(state)))
    }
    return x;
}
export const getScreens = state => state.screens;
