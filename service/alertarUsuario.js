import notifier from "node-notifier";

import nodemailer from "nodemailer";

import fs from "fs";
import path from "path";
import os from "os";

import player from "play-sound";

const alertarFimDoProcesso = async (pastaDestino) => {
	// 1. Pop-up de notificação
	try {
		notifier.notify({
			title: "Arquivos PDF Gerados",
			message: `Os arquivos foram salvos em:\n${pastaDestino}`,
			sound: true, // Ativar som
			wait: false, // Fechar automaticamente
		});
		console.log("\n✅ Pop-up enviado com sucesso!");
	} catch (error) { 
		console.error("\n❌ Erro ao notificar via Pop-up: ", error);
	}

	// 2. Email de notificação
	try {
		let transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: "magilamorganasf@gmail.com", // Substitua pelo seu email
				pass: "vwmh fimt akus anle", // Substitua pela sua senha ou use um app password
			},
		});

		let mailOptions = {
			from: "magilamorganasf@gmail.com",
			to: "devmagmorg@gmail.com",
			subject: "Arquivos PDF Gerados",
			text: `Os arquivos foram gerados e salvos em: ${pastaDestino}`,
		};
		await transporter.sendMail(mailOptions);
		console.log("\n✅ Email enviado com sucesso!");
	} catch (error) {
		console.error("\n❌ Erro ao notificar via Email: ", error);
	}

	// 3. Arquivo de alerta
	try {
		const caminhoPadraoDesktop = path.join(os.homedir(), "Desktop", "ALERTA_PDF_GERADO.txt");
		const caminhoPersonalizadoDesktop = path.join("E:\\OneDrive\\Desktop", "ALERTA_PDF_GERADO.txt");
		const caminhoPadraoProjeto = path.resolve(process.cwd(), '..', 'arquivosPgr', 'ALERTA_PDF_GERADO.txt');
		const mensagem = `Os arquivos PDF foram gerados com sucesso!\nDestino: ${pastaDestino}\n\nData: ${new Date().toLocaleString()}`;

		fs.writeFileSync(caminhoPadraoProjeto, mensagem, "utf-8");
		console.log("\n✅ Arquivo de alerta criado com sucesso! Em: arquivosPgr");
	} catch (error) { 
		console.error("\n❌ Erro ao criar arquivo de alerta: ", error);
	}

	// 4. Reproduzir som de notificação
	try {
		const tocador = player();
		tocador.play("C:\\Windows\\Media\\Alarm08.wav", (err) => {
			if (err) console.error("Erro ao tocar som: ", err);
		});
		console.log(`\n✅ Som de notificação reproduzido com sucesso! Destino dos arquivos: ${pastaDestino}`);
	} catch (error) {
		console.error("\n❌ Erro ao reproduzir som de notificação: ", error);
	}
};
export { alertarFimDoProcesso };