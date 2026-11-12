# Último Sobrevivente — Multiplayer v0.5.0

Jogo web multiplayer em tempo real para 2 a 8 pessoas, com salas por código, atributos individuais, escolhas simultâneas, resolução no servidor, itens com efeitos e confirmação coletiva.

## Rodar no computador

1. Instale Node.js 20 ou superior: https://nodejs.org/
2. Abra um terminal dentro desta pasta.
3. Execute `npm install`.
4. Execute `npm start`.
5. Abra http://localhost:3000.

## Publicar no Render

1. Envie todos os arquivos desta pasta para o repositório GitHub.
2. Se o projeto estiver dentro da pasta `ultimo-sobrevivente-online`, configure essa pasta em **Root Directory** no Render. Se os arquivos estiverem na raiz do repositório, deixe Root Directory vazio.
3. Configure Build Command `npm install` e Start Command `npm start`.
4. Abra o endereço HTTPS gerado pelo Render e compartilhe com os amigos.

## Estrutura

- `server.js`: servidor HTTP e Socket.IO; controla salas, jogadores, escolhas, probabilidades, rolagens, efeitos dos itens e confirmações.
- `game-rules.js`: valida opções disponíveis por jogador e calcula probabilidades.
- `game-data.js`: atributos, itens, cenas, escolhas especiais e ajustes de dificuldade.
- `public/index.html`: interface do jogo.
- `public/game-data.js`: catálogo compartilhado com a interface do navegador.

## Regras multiplayer

- O anfitrião cria a sala e compartilha o código de 6 caracteres.
- Entram de 2 a 8 jogadores.
- Cada jogador distribui 10 pontos entre Pontaria, Velocidade, Força, Furtividade e Vigor (máximo 5 por atributo).
- O anfitrião só pode iniciar quando todos estiverem prontos.
- As escolhas são individuais e ficam ocultas até todos os sobreviventes escolherem.
- O servidor calcula as chances, rolagens, proteção do colete e disputas de itens.
- Cada sobrevivente confirma no próprio dispositivo. O anfitrião avança quando todos os vivos confirmarem.
- O anfitrião pode encerrar a campanha a qualquer momento pelo botão **Encerrar campanha**.
- O navegador guarda um token local para permitir retorno à sala enquanto o processo do servidor continuar ativo.

## Itens e uso nas cenas — v0.5.0

- **Pistola:** libera as opções de tiro. Opções de tiro não aparecem para quem não tem pistola.
- **Munição:** aumenta a chance de ações com arma e é consumida quando o jogador atira; também libera uma ação especial de cobertura com a pistola.
- **Pé de cabra:** concede bônus de Força e libera uma ação especial para abrir o portão da praça.
- **Tênis de corrida:** concede bônus de Velocidade e libera uma ação especial para atravessar a avenida durante a perseguição.
- **Sinalizadores:** concedem bônus para Furtividade e são consumidos quando usados em uma ação furtiva; ajudam a distrair os infectados.
- **Lanterna:** concede bônus de Furtividade e libera uma ação especial para iluminar os trilhos do metrô.
- **Colete:** concede bônus de Vigor e absorve uma falha, sendo consumido ao proteger o jogador. Também libera uma ação especial no confronto final.
- **Kit médico:** concede bônus de Vigor e libera uma ação especial para tratar os ferimentos antes do chefe; é consumido ao usar essa ação.

As ações especiais aparecem como **Opção D** somente para quem possui o item exigido e ele ainda está disponível. As escolhas de tiro exigem a pistola.

## Dificuldade dos zumbis e probabilidades

O anfitrião escolhe a dificuldade no lobby:

- **Fácil:** +10 pontos percentuais nas chances.
- **Normal:** sem ajuste global.
- **Difícil:** -10 pontos percentuais nas chances.

Além disso, a campanha aumenta a pressão por etapa: infectados rápidos (-5 a -8 pontos) e confrontos com o chefe (-15 e -20 pontos). A chance final é recalculada no servidor e exibida em cada opção, considerando atributo, item, dificuldade selecionada e etapa da campanha. O cálculo tem teste automatizado: execute `npm test`. O resultado fica limitado entre 5% e 95%.

## Limitações

- As salas ficam na memória do processo; reiniciar/reimplantar o servidor encerra as partidas em andamento.
- A reconexão funciona enquanto a sala ainda existir no mesmo processo e o navegador conservar os dados locais.
- Não há chat, contas ou banco de dados persistente.

## Atualizar GitHub / Render

Substitua os arquivos pelos desta versão, mantendo `public/index.html` e `public/game-data.js` dentro de `public/`. Faça commit na branch `main` e execute **Manual Deploy → Deploy latest commit** no Render. O valor de Root Directory depende da localização real do `package.json` no repositório.


Versão 0.6: resultados reorganizados; escolhas confirmadas visíveis; descrições de recompensas; justificativa de eliminações; desempates exibidos rodada a rodada; limite de 70% nas chances; dificuldade progressiva; avanço automático quando todos os participantes, inclusive eliminados, confirmam. Cada cena agora oferece cinco escolhas comuns, além de ações especiais condicionadas aos itens.
