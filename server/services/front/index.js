const path = require('path');
const ServiceAbstract = require('@laboralphy/ws-service/abstract');

class ServiceFront extends ServiceAbstract {
    registerRoutes(application, express) {
        const WEBAPP_LOCATION = path.resolve(__dirname, '../../../')
        application.use('/dist', express.static(path.join(WEBAPP_LOCATION, 'dist')));
        application.use('/public', express.static(path.join(WEBAPP_LOCATION, 'public')));
        application.get('/', (req, res) => {
            res.redirect('/public/');
        })
    }
}

module.exports = ServiceFront;
