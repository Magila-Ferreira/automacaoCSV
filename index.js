// import { resolve } from 'chart.js/helpers';
import { inicializarPrograma } from './service/monitorarPasta.js';

(async () => {
    try {
        inicializarPrograma();
    }
    catch (error) {
        console.error("Erro ao iniciar o programa: ", error);
    }
})();