import * as MUTATIONS from './mutation_types';

export default {
    [MUTATIONS.WRITE_LINE]: function(state, {content}) {
        state.lines.push(content);
        while (state.lines.length > state.maxLines) {
            state.lines.shift();
        }
    }
};