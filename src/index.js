import Vue from 'vue';
import Vuex from 'vuex';
import store from './store';
import Application from './components/Application.vue';

Vue.use(Vuex);

class Bootstrap {
    createVueApplication(sWhere = '#vue-application') {
        return new Vue({
            el: sWhere,
            store: new Vuex.Store(store),
            components: {
                Application
            },
            render: function (h) {
                return h(Application);
            }
        });
    }
}

function main() {
    const b = new Bootstrap();
    b.createVueApplication();
}

window.addEventListener('load', main);

