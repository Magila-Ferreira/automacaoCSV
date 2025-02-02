//const { resolve } = require('chart.js/helpers');
const { inicializarPrograma } = require('./service/monitorarPasta');

(async () => {
    try {
        inicializarPrograma();
    }
    catch (error) {
        console.error("Erro ao iniciar o programa: ", error);
    }
})();