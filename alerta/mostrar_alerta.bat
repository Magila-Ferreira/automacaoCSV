@echo off

echo "Arquivos PDF salvos com sucesso!"
echo "Abrindo a pasta de destino... em 3 segundos."

timeout /t 3 >nul
explorer "C:\amb_sw\arquivosPgr\pdf"
