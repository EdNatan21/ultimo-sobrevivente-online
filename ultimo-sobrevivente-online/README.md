# Último Sobrevivente — Multiplayer v0.6.2

Jogo web multiplayer de sobrevivência zumbi para 2 a 8 pessoas. Os jogadores atravessam dez cenas, fazem escolhas individuais, encontram equipamentos e tentam alcançar o navio de evacuação.

## Requisitos e execução local

1. Instale Node.js 20 ou superior: https://nodejs.org/
2. Abra um terminal nesta pasta (a pasta que contém `package.json`).
3. Execute `npm install`.
4. Execute `npm start`.
5. Acesse http://localhost:3000.

Para validar as regras, execute `npm test`.

## Publicar no Render

1. Envie o conteúdo desta pasta para o repositório GitHub.
2. No Render, crie um Web Service conectado ao repositório.
3. **Root Directory:** informe o caminho relativo da pasta que contém `package.json`. Se o `package.json` estiver na raiz do repositório, deixe o campo vazio.
4. **Build Command:** `npm install`.
5. **Start Command:** `npm start`.
6. Publique o serviço e compartilhe o endereço HTTPS com os participantes.

## Estrutura do projeto

- `server.js`: servidor HTTP e Socket.IO; salas, jogadores, escolhas, rolagens, recompensas e confirmações.
- `game-rules.js`: opções disponíveis e cálculo de probabilidades no servidor.
- `game-data.js`: atributos, itens, cenas, escolhas e modificadores.
- `public/index.html`: interface do jogo.
- `public/game-data.js`: catálogo de dados utilizado pelo navegador (deve acompanhar `game-data.js`).
- `test/game-rules.test.js`: testes automatizados das regras.
- `HISTORICO-DE-VERSOES.md`: alterações por versão.
- `HISTORIA-DO-JOGO.md`: premissa, cenários, ameaças e desfechos.

## Regras principais

- O anfitrião cria uma sala e compartilha o código de seis caracteres.
- De 2 a 8 jogadores podem participar.
- Cada jogador distribui 10 pontos entre Pontaria, Velocidade, Força, Furtividade e Vigor, com máximo de 5 por atributo.
- O anfitrião inicia a partida quando todos estiverem prontos e escolhe a dificuldade dos zumbis.
- Cada cena oferece sete escolhas comuns diferentes. Ações especiais adicionais aparecem quando o jogador possui o item exigido.
- As escolhas ficam ocultas para os demais até todos os jogadores vivos escolherem. Depois disso, o grupo vê as escolhas e os resultados. O servidor resolve os testes e as disputas de recompensas.
- A chance de sucesso considera atributo, item, dificuldade e etapa da campanha; fica entre 5% e 70%.
- Após os resultados, somente os jogadores vivos precisam confirmar para avançar. O anfitrião pode forçar a próxima cena sem esperar as confirmações pendentes.
- O anfitrião pode encerrar a campanha a qualquer momento.

## Itens e recompensas

Os itens podem conceder bônus de atributo, liberar ações especiais, ser consumidos ou proteger contra uma falha fatal. As recompensas e os itens são exibidos apenas pelo nome, sem descrições ou tooltips na interface.

| Item | Efeito |
|---|---|
| Pistola | Libera escolhas de tiro e concede +5 pontos em Pontaria. |
| Munição | Concede +4 pontos em Pontaria enquanto disponível; é consumida em ações de disparo. |
| Pé de cabra | +5 pontos em Força e libera uma ação especial para abrir obstáculos. |
| Tênis de corrida | +5 pontos em Velocidade. |
| Sinalizadores | +6 pontos em Furtividade enquanto disponíveis; podem ser consumidos para distrair infectados. |
| Lanterna | +5 pontos em Furtividade e libera uma ação especial em áreas escuras. |
| Colete | +4 pontos em Vigor; absorve uma falha fatal e é consumido. |
| Kit de primeiros socorros | +7 pontos em Vigor enquanto disponível; pode ser consumido para tratar ferimentos. |
| Faca de resgate | +5 pontos em Força e libera uma ação especial contra o Anfitrião. |
| Máscara filtrante | +5 pontos em Vigor e libera uma ação especial para proteção contra fluidos infectados. |
| Rádio portátil | +5 pontos em Furtividade e libera uma ação especial de distração. |

## Dificuldade e probabilidades

- **Fácil:** base de 68 pontos percentuais.
- **Médio:** base de 52 pontos percentuais.
- **Difícil:** base de 36 pontos percentuais.
- Escolhas que oferecem uma recompensa começam com 10 pontos percentuais a menos que escolhas sem recompensa do mesmo nível.
- Cada ponto no atributo usado acrescenta 4 pontos percentuais; itens concedem bônus reduzidos, entre 4 e 7 pontos percentuais.
- A dificuldade global dos zumbis e a progressão das cenas também modificam a chance; o resultado final permanece entre 5% e 70%.

A campanha aplica penalidades progressivas conforme os infectados se tornam mais perigosos. O limite máximo continua em 70%, mesmo com atributos e itens elevados.

## Limitações conhecidas

- As salas ficam na memória do processo; reiniciar ou reimplantar o servidor encerra as partidas em andamento.
- A reconexão depende de a sala continuar ativa e de o navegador conservar o token local.
- Não há contas, chat ou banco de dados persistente.
- Os testes automatizados verificam regras do jogo; não substituem um teste multiplayer real com vários navegadores conectados.

## Atualizar uma instalação existente

Substitua os arquivos da versão anterior pelo conteúdo desta pasta, preservando a estrutura `public/`. Faça commit e push para a branch utilizada pelo Render e execute um novo deploy. Confira o **Root Directory** com base na localização real do `package.json`; não presuma que a pasta do projeto está aninhada.
