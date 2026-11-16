# Teleprompter Manual

Teleprompter simples para celular: escreva ou cole o roteiro, inicie a leitura e role manualmente com o dedo. O modo de leitura pode mostrar a câmera atrás do texto e gravar o vídeo diretamente no aparelho.

## Uso

Abra o aplicativo em um navegador. O roteiro, o tamanho da fonte e a opção de espelhamento são guardados localmente no navegador do aparelho. No modo de leitura, aceite a permissão de câmera e microfone; toque em **Gravar** para começar e em **Parar** para liberar **Salvar vídeo**. Se o celular abrir o menu de compartilhamento, escolha **Salvar Vídeo** para colocar o arquivo na galeria. Quando essa opção não estiver disponível, o navegador baixa o arquivo para a pasta de downloads/Arquivos. O app grava em MP4 quando o navegador permite; caso contrário, usa WebM.

> A câmera exige uma origem segura (HTTPS), como o GitHub Pages. Ela pode não abrir ao acessar o arquivo diretamente ou por uma rede HTTP local.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie esta pasta inteira.
2. Em **Settings → Pages**, selecione **GitHub Actions** como fonte.
3. Faça um novo push para a branch `main`.

O arquivo `.github/workflows/deploy-pages.yml` publica automaticamente o conteúdo da pasta `dist`.
