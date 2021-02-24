const WSS = require('@laboralphy/ws-service');
const ServiceFront = require('./services/front');
const wss = new WSS();
wss.service(new ServiceFront());
wss.listen(8080);
console.log('listening on port 8080');
