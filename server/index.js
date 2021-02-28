const WSS = require('@laboralphy/ws-service');
const ServiceFront = require('./services/front');
const ServiceTxat = require('./services/txat');
const wss = new WSS();
wss.service(new ServiceFront());
wss.service(new ServiceTxat());
wss.listen(8080);
console.log('listening on port 8080');
