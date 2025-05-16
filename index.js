import { inicializarPrograma } from './service/monitorarPasta.js';
import { agendarLimpezaMensal } from './service/agendarDelecaoDB.js';

(async () => {
    try {
		inicializarPrograma();
		agendarLimpezaMensal(); // Inicia o agendamento
    }
    catch (error) {
        console.error("Erro ao iniciar o programa: ", error);
    }
})();