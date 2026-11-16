# Teleprompter Manual

Teleprompter simples para celular: escreva ou cole o roteiro, inicie a leitura e role manualmente com o dedo.

## Uso

Abra `dist/index.html` em um navegador. O roteiro, o tamanho da fonte e a opção de espelhamento são guardados localmente no navegador do aparelho.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie esta pasta inteira.
2. Em **Settings → Pages**, selecione **GitHub Actions** como fonte.
3. Faça um novo push para a branch `main`.

O arquivo `.github/workflows/deploy-pages.yml` publica automaticamente o conteúdo da pasta `dist`.
