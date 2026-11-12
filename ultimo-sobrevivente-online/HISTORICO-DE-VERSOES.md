# Histórico de versões — Último Sobrevivente

Este arquivo registra as alterações conhecidas do projeto. Nas versões antigas, algumas datas e detalhes não estavam registrados nos arquivos preservados; nesses casos, o histórico informa apenas o que foi possível confirmar, sem inventar mudanças.

## v0.6.2 — 12/11/2026
- Probabilidade-base por nível de escolha: Fácil 68, Médio 52 e Difícil 36.
- Escolhas que oferecem recompensa recebem penalidade-base de 10 pontos em relação a opções sem recompensa do mesmo nível.
- Reduzidos os bônus de atributo dos itens.
- Removidas da interface as porcentagens das escolhas e as descrições/tooltips das recompensas.
- Dificuldades coloridas: Fácil em verde, Médio em laranja e Difícil em vermelho.
- Escolhas individuais ocultas para os demais jogadores até todos os jogadores vivos enviarem uma escolha.
- Jogadores eliminados deixam de precisar confirmar a próxima cena.
- Adicionada ao anfitrião a opção de forçar o avanço para a próxima cena.
- Atualizados README, instruções rápidas, dados do navegador e testes automatizados.

## v0.6.1 — 12/11/2026
- Adicionadas três recompensas permanentes: Faca de resgate (+12% Força), Máscara filtrante (+12% Vigor) e Rádio portátil (+12% Furtividade).
- Cada nova recompensa também libera uma ação contextual em uma cena posterior.
- Substituídas escolhas repetidas por alternativas diferentes; agora há sete escolhas comuns exclusivas em cada cena, além das ações especiais condicionadas a itens.
- Adicionados tooltips ao passar o mouse ou focar por teclado nas recompensas possíveis e nos itens do inventário, explicando seus efeitos.
- Melhorada a leitura dos resultados: interpretação da rolagem e identificação de quem venceu cada rodada de desempate.
- Corrigido o botão de confirmação para permitir que jogadores eliminados também confirmem a continuidade; a confirmação de todos os participantes era exigida até a v0.6.1.
- Atualizados README, instruções rápidas, versão do pacote e documentação da história.

## v0.6.0 — 12/11/2026
- Reorganização da tela de resultados.
- Exibição da escolha confirmada de cada jogador.
- Descrição das recompensas, justificativa de eliminações e histórico de desempates.
- Dificuldade progressiva por cena e limite máximo de 70% para as probabilidades.
- Avanço condicionado à confirmação de todos os participantes, incluindo eliminados (a interface do botão para eliminados foi corrigida na v0.6.1).
- Ampliação do conjunto de escolhas por cena.

## v0.5.0 — data exata não registrada
- Introdução de efeitos próprios para os itens.
- Ações especiais condicionadas à posse de itens.
- Ações de tiro disponíveis somente para quem possui pistola.
- Consumo de munição e sinalizadores em ações específicas.
- Colete capaz de absorver uma falha fatal, sendo consumido ao proteger o jogador.
- Seleção da dificuldade dos zumbis pelo anfitrião e encerramento manual da campanha.

## v0.4.1 — data exata não registrada
- Revisão intermediária do pacote multiplayer v0.4. O arquivo preservado não contém um changelog detalhado que permita atribuir alterações específicas com segurança.

## v0.4.0 — data exata não registrada
- Integração da interface com servidor Node.js e Socket.IO.
- Salas privadas por código para 2 a 8 jogadores.
- Distribuição individual de atributos, escolhas simultâneas, resolução de probabilidades no servidor e resultados sincronizados.
- Confirmação coletiva antes de avançar, reconexão por token local e publicação via Render.

## v0.3 — 12/11/2026 (data dos arquivos preservados)
- Primeira versão preservada com servidor, interface web e configuração de execução Node.js.
- O pacote contém `server.js`, `public/index.html` e `package.json`; os registros disponíveis não permitem detalhar com segurança todas as funcionalidades dessa versão.

## v0.2 — detalhes não preservados
- Há referência a um protótipo HTML anterior, mas não foi preservado um changelog ou pacote suficiente para descrever as mudanças com precisão.

## v0.1 — protótipo inicial
- Protótipo local do jogo de escolhas de sobrevivência, com atributos, cenas ilustradas, inventário, probabilidades e jogadores simulados/bots.
- O multiplayer real foi planejado como evolução posterior, com necessidade de servidor e sincronização.
