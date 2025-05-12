@echo off

echo \n Arquivos PDF salvos com sucesso!
echo \n A pasta de destino será aberta em 3 segundos.
echo \n Por favor, não feche esta janela.

timeout /t 3 >nul
explorer "C:\amb_teste\servico_windows\arquivosPgr\pdf"
