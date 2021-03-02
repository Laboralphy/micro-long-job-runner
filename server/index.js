const WSS = require('@laboralphy/ws-service');
const ServiceFront = require('./services/front');
const ServiceMUD = require('./services/mud');

require('dotenv').config();

const wss = new WSS();
wss.service(new ServiceFront());
wss.service(new ServiceMUD());
wss.listen(process.env.SERVER_PORT, process.env.SERVER_ADDRESS);
console.log('listening on port', process.env.SERVER_PORT);
