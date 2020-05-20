const spawn = require('child_process').spawn;
const ansi = require('ansi-colors');


function run(command, args, callback) {
    return new Promise((resolve) => {
        const oProcess = spawn(command, args);
        oProcess.stdout.on('data', data => {
            callback(data.toString());
        });
        oProcess.on('exit', code => {
            resolve(code);
        });
    });
}

async function doPythonJob(n, color) {
    const code = await run(
        'python3.6',
        ['/home/ralphy/PycharmProjects/genericserver/TestTask.py'],
        s => console.log(ansi[color]('le script ' + n +  ' -> ' + JSON.stringify(JSON.parse(s))))
    );
    console.log('exit with code', code);
}

// lancer le premier script python
doPythonJob(1, 'green');

// lancer le second script python, 2.5 seconde après le premier
setTimeout(
    () => doPythonJob(2, 'magenta'),
    2500
);