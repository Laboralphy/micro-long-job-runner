const WSS = require('@laboralphy/ws-service');
const ServiceFront = require('./services/front');
const ServiceMUD = require('./services/mud');
const wss = new WSS();
wss.service(new ServiceFront());
wss.service(new ServiceMUD());
wss.listen(8044);
console.log('listening on port 8044');
