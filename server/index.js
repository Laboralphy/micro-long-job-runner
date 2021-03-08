const WSS = require('@laboralphy/ws-service');
const Logger = require('../libs/logger');
const ServiceFront = require('./services/front');
const ServiceMUD = require('./services/mud');

require('dotenv').config();
const PACKAGE_JSON = require('../package.json');

console.log(PACKAGE_JSON.name, 'version', PACKAGE_JSON.version);

if (process.env.SERVER_PORT) {
  const wss = new WSS();
  wss.service(new ServiceFront());
  wss.service(new ServiceMUD());
  wss.listen(process.env.SERVER_PORT, process.env.SERVER_ADDRESS);
  Logger.log('[server] listening address:', process.env.SERVER_ADDRESS);
  Logger.log('[server] listening on port:', process.env.SERVER_PORT);
} else {
  Logger.log('[server] SERVER_PORT variable not set (check .env file)');
}
