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

## Como colocar online

### Opcao recomendada: Vercel

1. Crie um repositorio no GitHub e envie estes arquivos.
2. Acesse `https://vercel.com/new`.
3. Importe o repositorio.
4. Framework preset: `Other`.
5. Build command: deixe vazio.
6. Output directory: deixe vazio ou use `.`.
7. Publique.

Essa opcao e simples para o MVP porque o app e estatico. Ele fica online com HTTPS, pode ser aberto no celular e mantem os dados no navegador de cada dispositivo.

### Quando precisar sincronizar dados

Para a mesma banca aparecer em todos os dispositivos, o proximo passo e adicionar backend com login e banco de dados. A rota mais direta seria:

- Frontend: manter este app.
- Backend: Supabase ou Firebase para autenticacao e banco.
- Dados: salvar entradas por usuario em vez de apenas `localStorage`.
- Deploy: Vercel para o frontend e Supabase/Firebase para persistencia.
