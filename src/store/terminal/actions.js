/**
 * A command is submitted, this action is intercepted by terminal plugin
 */
export function submitCommand({dispatch}, { command }) {
    console.log('command', command)
}
