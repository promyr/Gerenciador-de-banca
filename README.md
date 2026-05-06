# Banca Prime

Software web basico para gestao de banca com foco operacional em odds ate 1.30.

## O que inclui

- Registro simples do que foi feito, mercado, stake, odd, resultado e observacao.
- Campos selecionaveis para estrategia e mercado, com opcoes mais usadas no topo.
- Opcao para adicionar novas estrategias e mercados.
- Entradas em aberto com aba dedicada e acoes para finalizar como Green ou Red.
- Dashboard com banca atual, lucro liquido, ROI, taxa de acerto e exposicao media.
- Painel representativo de lucros, perdas, entradas em aberto, maior lucro e maior perda.
- Grafico da curva da banca.
- Grafico de distribuicao de resultados.
- Botao Demo com confirmacao antes de substituir dados locais.
- Importacao sanitizada para evitar odds, stakes e resultados fora das regras.
- Aviso de escopo local dos dados e fluxo de backup/restauracao por JSON.
- Persistencia local no navegador.
- Exportacao e importacao de dados em JSON.
- Manifesto PWA e service worker para uso instalavel/offline quando servido via HTTP.

## Online

Producao:

```text
https://gerenciador-de-banca-eight.vercel.app
```

## Como rodar

Com Node.js instalado:

```powershell
node dev-server.js
```

Depois acesse:

```text
http://localhost:4173
```

Para abrir no celular, use o IP da maquina na mesma rede, por exemplo:

```text
http://192.168.0.6:4173
```

Se o celular nao abrir, libere a porta `4173` no firewall do Windows.

## Deploy

O projeto esta conectado ao GitHub e a Vercel.

- Repositorio: `https://github.com/promyr/Gerenciador-de-banca`
- Producao: `https://gerenciador-de-banca-eight.vercel.app`
- Branch principal: `main`

Fluxo automatico:

1. Faca commit das alteracoes.
2. Envie para `main`.
3. A Vercel cria um novo deploy a partir do GitHub.

Fluxo manual usado neste workspace:

```powershell
npm.cmd run validate
git push
npx vercel deploy --prod --yes
```

### Quando precisar sincronizar dados

Hoje os dados ficam em `localStorage`, ou seja, no navegador/dispositivo atual. Para levar dados para outro aparelho, use Exportar JSON no dispositivo origem e Importar JSON no dispositivo destino.

Para a mesma banca aparecer automaticamente em todos os dispositivos, o proximo passo e adicionar backend com login e banco de dados. A rota mais direta seria:

- Frontend: manter este app.
- Backend: Supabase ou Firebase para autenticacao e banco.
- Dados: salvar entradas por usuario em vez de apenas `localStorage`.
- Deploy: Vercel para o frontend e Supabase/Firebase para persistencia.
