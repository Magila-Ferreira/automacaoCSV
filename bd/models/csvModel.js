const { resolve } = require('chart.js/helpers');
const db = require('../config/db');

const salvarDadosCSV = async (dados) => {
    try {
        for (const item of dados) {
            const sql_identificacao = `INSERT INTO identificacao (setor, cargo, idade, escolaridade, estadoCivil, genero) VALUES (?, ?, ?, ?, ?, ?)`;

            const valores_identificacao = [item.setor, item.cargo, parseInt(item.idade, 10), item.escolaridade, item.estadoCivil, item.genero];

            const [result] = await db.promise().query(sql_identificacao, valores_identificacao);

            const id_identificacao = result.insertId;

            const sql_respostas = `INSERT INTO respostas (id_identificacao, q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13, q14, q15, q16, q17, q18, q19, q20, q21, q22, q23, q24, q25, q26, q27, q28, q29, q30, q31, q32, q33, q34, q35, q36, q37, q38, q39, q40, q41, q42, q43, q44, q45, q46) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const valores_respostas = [id_identificacao, item.q1, item.q2, item.q3, item.q4, item.q5, item.q6, item.q7, item.q8, item.q9, item.q10, item.q11, item.q12, item.q13, item.q14, item.q15, item.q16, item.q17, item.q18, item.q19, item.q20, item.q21, item.q22, item.q23, item.q24, item.q25, item.q26, item.q27, item.q28, item.q29, item.q30, item.q31, item.q32, item.q33, item.q34, item.q35, item.q36, item.q37, item.q38, item.q39, item.q40, item.q41, item.q42, item.q43, item.q44, item.q45, item.q46];

            await db.promise().query(sql_respostas, valores_respostas);
        }
        return "Todos os dados foram salvos com sucesso no bd!";
    } catch (err) {
        console.error("Erro ao salvar os dados no banco de dados: ", err);
        throw err;
    }
};

module.exports = { salvarDadosCSV };