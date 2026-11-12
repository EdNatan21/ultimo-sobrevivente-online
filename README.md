# Último Sobrevivente — Multiplayer v0.4

Jogo web multiplayer em tempo real para 2 a 8 pessoas, com salas por código, atributos individuais, escolhas simultâneas, resolução no servidor, itens e confirmação coletiva.

## Rodar no computador

1. Instale Node.js 20 ou superior: https://nodejs.org/
2. Abra um terminal dentro desta pasta.
3. Execute `npm install`.
4. Execute `npm start`.
5. Abra http://localhost:3000.

Para testar com duas pessoas na mesma rede local, ambas podem acessar o IP local do computador que está executando o servidor, na porta 3000. Para amigos em outras redes, publique como serviço Node no Render.

## Publicar no Render

1. Envie todos os arquivos desta pasta para um repositório GitHub.
2. No Render, crie um **New Web Service** e conecte o repositório.
3. Configure Runtime/Language como Node, Build Command `npm install` e Start Command `npm start`.
4. Use uma instância que mantenha o serviço ativo. O plano gratuito pode suspender após inatividade.
5. Abra o endereço HTTPS gerado pelo Render e compartilhe com os amigos.

## Estrutura

- `server.js`: servidor HTTP e Socket.IO; controla salas, jogadores, escolhas, rolagens, itens e confirmações.
- `game-data.js`: dados de atributos, itens, cenas e contexto compartilhados entre servidor e navegador.
- `public/index.html`: interface do jogo.

## Regras multiplayer

- O anfitrião cria a sala e compartilha o código de 6 caracteres.
- Entram de 2 a 8 jogadores.
- Cada jogador distribui 10 pontos entre Pontaria, Velocidade, Força, Furtividade e Vigor (máximo 5 por atributo).
- O anfitrião só pode iniciar quando todos estiverem prontos.
- As escolhas são individuais e ficam ocultas até todos os sobreviventes escolherem.
- O servidor calcula as chances, rolagens e disputas de itens; nenhum jogador publica o resultado.
- Cada sobrevivente confirma no próprio dispositivo. O anfitrião avança quando todos os vivos confirmarem.
- O navegador guarda um token local para permitir retorno à sala após uma desconexão/atualização, enquanto o processo do servidor continuar ativo.

## Limitações desta versão

- As salas ficam na memória do processo; reiniciar/reimplantar o servidor encerra as partidas em andamento.
- A reconexão funciona enquanto a sala ainda existir no mesmo processo e o navegador conservar os dados locais.
- Não há chat, contas, banco de dados ou painel administrativo.

## Correções da versão 0.4.1

- Adicionado o botão **Sair da campanha** no lobby, durante a partida e na tela final. Ao sair, o jogador é removido da sala e, se era o anfitrião, a liderança passa para outro jogador conectado.
- Corrigido o estado dos atributos no lobby: atualizações de outros jogadores não sobrescrevem a distribuição local ainda não confirmada. Depois de confirmar, os atributos ficam bloqueados e são mantidos pelo servidor durante a campanha.

### Atualização no GitHub / Render

Substitua os arquivos do diretório `ultimo-sobrevivente-online` pelos arquivos desta versão, mantendo `public/index.html` e `public/game-data.js` dentro de `public/`. Faça commit na branch `main` e execute um novo deploy no Render. Se o repositório mantém o projeto dentro da pasta `ultimo-sobrevivente-online`, mantenha esse valor em **Root Directory**.
