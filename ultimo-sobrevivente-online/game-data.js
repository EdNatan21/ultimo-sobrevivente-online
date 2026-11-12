// Dados compartilhados entre navegador e servidor.
const ATTRS=[
 ['Pontaria','Tiros e ataques precisos'],['Velocidade','Corridas e fugas'],['Força','Luta e obstáculos'],['Furtividade','Silêncio e esconderijo'],['Vigor','Resistência e ferimentos']
];
// Itens têm funções distintas: bônus, munição, proteção ou acesso a ações especiais.
const ITEM={
 pistola:{name:'Pistola',description:'Libera escolhas de tiro e concede +5 pontos em testes de Pontaria. Não consome munição por padrão.',attr:'Pontaria',bonus:5,type:'weapon'},
 municao:{name:'Munição',description:'Concede +4 pontos em Pontaria enquanto disponível. É consumida em ações que exigem disparos.',attr:'Pontaria',bonus:4,type:'consumivel'},
 pe:{name:'Pé de cabra',description:'Concede +5 pontos em Força e libera ações especiais para arrombar portas e obstáculos.',attr:'Força',bonus:5,type:'permanente'},
 tenis:{name:'Tênis de corrida',description:'Concede +5 pontos em Velocidade e ajuda em fugas e travessias perigosas.',attr:'Velocidade',bonus:5,type:'permanente'},
 sinal:{name:'Sinalizadores',description:'Concede +6 pontos em Furtividade enquanto disponível. Pode ser consumido para distrair infectados.',attr:'Furtividade',bonus:6,type:'consumivel'},
 lanterna:{name:'Lanterna',description:'Concede +5 pontos em Furtividade e libera uma ação especial em áreas escuras.',attr:'Furtividade',bonus:5,type:'permanente'},
 colete:{name:'Colete',description:'Concede +4 pontos em Vigor. Ao falhar em um teste que causaria sua morte, absorve uma falha e é consumido.',attr:'Vigor',bonus:4,type:'defensivo'},
 kit:{name:'Kit de primeiros socorros',description:'Concede +7 pontos em Vigor enquanto disponível e pode ser consumido para tratar ferimentos em uma ação especial.',attr:'Vigor',bonus:7,type:'consumivel'},
 faca:{name:'Faca de resgate',description:'Equipamento permanente. Concede +5 pontos em testes de Força e libera uma ação especial para atacar o Anfitrião de perto.',attr:'Força',bonus:5,type:'permanente'},
 mascara:{name:'Máscara filtrante',description:'Equipamento permanente. Concede +5 pontos em testes de Vigor e libera uma ação especial para se proteger de fluidos e partículas infectadas.',attr:'Vigor',bonus:5,type:'permanente'},
 radio:{name:'Rádio portátil',description:'Equipamento permanente. Concede +5 pontos em testes de Furtividade e libera uma ação especial para coordenar uma distração à distância.',attr:'Furtividade',bonus:5,type:'permanente'}
};
const ZOMBIE_DIFFICULTIES={
 facil:{label:'Fácil',modifier:5},
 normal:{label:'Normal',modifier:0},
 dificil:{label:'Difícil',modifier:-5}
};
// Probabilidades-base diminuem conforme os infectados evoluem.
const STAGE_BASES=[
 {facil:90,medio:82,dificil:72}, // cenas 1 a 4: infectados lentos
 {facil:80,medio:70,dificil:58}, // cenas 5 a 8: infectados rápidos
 {facil:68,medio:55,dificil:40}  // cenas 9 e 10: chefe
];
const STAGE_MAX_CHANCE=[95,85,70];
const S=[
 {title:'A festa vira caos',threat:'ZUMBIS LENTOS',story:'Na cobertura, um convidado cai, se contorce e morde o homem ao lado. As luzes piscam. A multidão corre para a saída — e os primeiros infectados se levantam.',opts:[
  ['Invadir o escritório e recuperar a pistola','Pontaria','dificil','pistola'],
  ['Escapar pela cozinha sem chamar atenção','Furtividade','medio'],
  ['Abrir caminho pela multidão até a porta','Força','facil'],
  ['Quebrar a janela lateral e sair pelo toldo','Força','dificil','faca'],
  ['Ajudar um convidado ferido a atravessar a sala','Vigor','medio']
 ]},
 {title:'A escadaria',threat:'ZUMBIS LENTOS',story:'A escadaria está tomada por convidados cambaleantes. O elevador de serviço está aberto, mas faz barulho. Uma janela dá para o toldo do térreo.',opts:[
  ['Saltar pela janela até o toldo e recuperar o colete','Vigor','dificil','colete'],
  ['Entrar no depósito de limpeza e pegar uma máscara filtrante','Furtividade','dificil','mascara'],
  ['Descer pelo elevador de serviço em silêncio','Pontaria','medio'],
  ['Empurrar os infectados e descer','Força','facil'],
  ['Descer pelo corrimão externo até o saguão','Velocidade','medio']
 ]},
 {title:'A garagem',threat:'ZUMBIS LENTOS',story:'Alarmes disparam entre os carros. Há um porta-malas aberto com um pé de cabra. Os gemidos se aproximam pelo acesso da rua.',opts:[
  ['Pegar o pé de cabra no porta-malas','Força','dificil','pe'],
  ['Arremessar uma ferramenta contra um alarme distante','Pontaria','medio'],
  ['Correr entre os carros até a saída','Velocidade','medio'],
  ['Usar um carro como cobertura até a saída','Vigor','medio'],
  ['Acionar um alarme distante e passar escondido','Furtividade','facil']
 ]},
 {title:'A praça',threat:'ZUMBIS LENTOS',story:'A praça está tomada. Uma loja de esportes teve a vitrine quebrada; um túnel de manutenção parece vazio, mas está mergulhado na escuridão.',opts:[
  ['Entrar na loja e pegar tênis de corrida','Velocidade','dificil','tenis'],
  ['Invadir a guarita e pegar um rádio portátil','Furtividade','dificil','radio'],
  ['Arremessar uma garrafa para distrair os infectados','Pontaria','medio'],
  ['Forçar passagem pela praça','Vigor','facil'],
  ['Empurrar uma banca para bloquear a passagem','Força','medio']
 ]},
 {title:'A sirene',threat:'ZUMBIS RÁPIDOS',story:'Uma sirene corta a noite. Os infectados mudam de comportamento: agora correm. Uma viatura está abandonada no meio da avenida.',opts:[
  ['Pegar sinalizadores no porta-luvas','Furtividade','dificil','sinal'],
  ['Se esconder dentro da viatura até os corredores passarem','Vigor','medio'],
  ['Subir em um ônibus e bloquear as portas','Força','facil'],
  ['Atingir o mecanismo da cancela para abrir passagem','Pontaria','medio'],
  ['Cruzar a avenida em uma arrancada até a calçada','Velocidade','medio']
 ]},
 {title:'O mercado',threat:'ZUMBIS RÁPIDOS',story:'As prateleiras estão no chão. Passos velozes ecoam pelos corredores. Na sala dos funcionários pode haver uma lanterna; uma saída de manutenção fica no alto.',opts:[
  ['Encontrar a lanterna na sala dos funcionários','Furtividade','dificil','lanterna'],
  ['Se esconder no frigorífico e esperar','Vigor','facil'],
  ['Escalar as prateleiras até a saída superior','Velocidade','medio'],
  ['Derrubar uma pilha de caixas sobre o corredor','Força','medio'],
  ['Acertar o botão do alarme de incêndio à distância','Pontaria','dificil']
 ]},
 {title:'O metrô',threat:'ZUMBIS RÁPIDOS',story:'A estação é um atalho para o porto. Está escura. Um policial caído ainda carrega munição no cinto, mas os infectados já invadiram a plataforma.',opts:[
  ['Pegar a munição do policial','Pontaria','dificil','municao'],
  ['Correr pelos trilhos até a próxima saída','Velocidade','medio'],
  ['Avançar rente à parede sem fazer ruído','Furtividade','facil'],
  ['Forçar a porta técnica da estação','Força','medio'],
  ['Atravessar a plataforma protegendo a respiração','Vigor','medio']
 ]},
 {title:'A mordida',threat:'ZUMBIS RÁPIDOS',story:'Na saída, um infectado ferido agarra seu braço. Um kit médico está caído perto do ponto de ônibus. Você sente que não há tempo para hesitar.',opts:[
  ['Se soltar e alcançar o kit médico','Vigor','dificil','kit'],
  ['Afastar o infectado com um chute','Força','medio'],
  ['Desviar e correr em direção ao cais','Velocidade','facil'],
  ['Arremessar um objeto para afastar o infectado','Pontaria','medio'],
  ['Se fingir de morto até o infectado se afastar','Furtividade','medio']
 ]},
 {title:'O pátio do porto',threat:'CHEFE: O ANFITRIÃO',story:'Entre os contêineres surge o anfitrião da festa. O corpo está deformado, enorme, mas o terno ainda é reconhecível. O navio apita ao fundo.',opts:[
  ['Derrubar uma grade metálica para separar o grupo da criatura','Força','dificil'],
  ['Contornar os contêineres em silêncio','Furtividade','medio'],
  ['Correr pelo corredor entre os contêineres','Velocidade','medio'],
  ['Acertar um ponto fraco da criatura com um objeto','Pontaria','dificil'],
  ['Resistir à investida e proteger o grupo','Vigor','medio']
 ]},
 {title:'A rampa do navio',threat:'CHEFE: ÚLTIMO CONFRONTO',story:'O Anfitrião alcança o cais. A rampa está subindo e o motor já está ligado. É agora ou nunca: embarcar ou desaparecer com a cidade.',opts:[
  ['Prender a criatura com a corrente de carga do cais','Força','dificil'],
  ['Contornar o Anfitrião sem chamar sua atenção','Furtividade','medio'],
  ['Correr e saltar para a rampa do navio','Velocidade','dificil'],
  ['Acertar o mecanismo da rampa para mantê-la aberta','Pontaria','dificil'],
  ['Proteger um companheiro e avançar em conjunto','Vigor','medio']
 ]}
];
const SPECIAL_OPTIONS={
 3:{pe:['Usar o pé de cabra para abrir o portão de manutenção','Força','medio',null,{specialItem:'pe'}]},
 4:{tenis:['Usar os tênis para cruzar a avenida antes dos corredores alcançarem vocês','Velocidade','medio',null,{specialItem:'tenis'}],pistola:['Atirar nos primeiros corredores para ganhar tempo','Pontaria','medio',null,{specialItem:'pistola',usesAmmo:true}]},
 6:{lanterna:['Usar a lanterna para iluminar os trilhos e localizar uma saída segura','Furtividade','facil',null,{specialItem:'lanterna'}]},
 7:{municao:['Recarregar a pistola e cobrir a fuga do grupo','Pontaria','medio',null,{specialItem:'municao',requiresItem:'pistola',consumes:['municao']}],mascara:['Usar a máscara filtrante para evitar os fluidos do infectado','Vigor','medio',null,{specialItem:'mascara'}]},
 8:{kit:['Usar o kit médico para tratar os ferimentos antes do confronto','Vigor','medio',null,{specialItem:'kit',consumes:['kit']}],faca:['Usar a faca de resgate para atingir a perna do Anfitrião','Força','medio',null,{specialItem:'faca'}],pistola:['Atirar nos olhos do Anfitrião para cegá-lo','Pontaria','dificil',null,{specialItem:'pistola',usesAmmo:true}]},
 9:{colete:['Firmar o colete e aguentar a investida do Anfitrião','Vigor','medio',null,{specialItem:'colete',consumeOnSuccess:true}],radio:['Usar o rádio para coordenar uma distração longe da rampa','Furtividade','medio',null,{specialItem:'radio'}],pistola:['Acertar um tiro preciso para deter o Anfitrião','Pontaria','dificil',null,{specialItem:'pistola',usesAmmo:true}]}
};
const SCENE_CONTEXT=[
 {location:'Cobertura do Edifício Aurora, no centro da cidade.',history:'Vocês chegaram juntos à festa de um conhecido. Durante a comemoração, a energia falhou e o primeiro convidado começou a atacar os outros.'},
 {location:'Escadaria de emergência do Edifício Aurora.',history:'A festa virou um tumulto. Vocês conseguiram sair do salão, mas os infectados lentos já bloquearam o caminho principal.'},
 {location:'Garagem subterrânea do edifício.',history:'Depois de descerem pela escadaria, vocês alcançaram a garagem. Alarmes e buzinas atraíram infectados para as entradas.'},
 {location:'Praça Central, a três quarteirões da festa.',history:'Vocês escaparam da garagem e chegaram à rua. A rota principal está bloqueada por carros abandonados e grupos de infectados.'},
 {location:'Avenida Norte, perto do cruzamento com o distrito comercial.',history:'Ao atravessarem a praça, uma sirene de emergência soou. Os infectados começaram a correr — algo mudou no surto.'},
 {location:'Supermercado Estrela, no distrito comercial.',history:'Vocês conseguiram atravessar a avenida, mas os novos infectados rápidos estão perseguindo qualquer pessoa que faça barulho.'},
 {location:'Estação Central do metrô.',history:'A passagem pelo mercado levou vocês até a estação. O metrô parece ser o caminho mais curto para chegar ao porto.'},
 {location:'Saída da estação, no corredor que leva à zona portuária.',history:'Vocês deixaram a plataforma, mas um infectado alcançou o grupo. O cais já pode ser visto ao longe.'},
 {location:'Pátio externo do Porto de Santa Marina.',history:'Depois de atravessarem as últimas ruas, vocês chegaram ao porto. O navio de evacuação está preparado, mas algo enorme bloqueia o caminho.'},
 {location:'Rampa de embarque do navio de evacuação.',history:'O grupo enfrentou a criatura no pátio. O navio começou a recolher a rampa; esta é a última oportunidade de embarcar.'}
];
if (typeof module !== "undefined") module.exports = { ATTRS, ITEM, S, SCENE_CONTEXT, SPECIAL_OPTIONS, ZOMBIE_DIFFICULTIES, STAGE_BASES, STAGE_MAX_CHANCE };
