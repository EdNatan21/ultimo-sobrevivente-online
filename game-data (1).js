// Dados compartilhados entre navegador e servidor.
const ATTRS=[
 ['Pontaria','Tiros e ataques precisos'],['Velocidade','Corridas e fugas'],['Força','Luta e obstáculos'],['Furtividade','Silêncio e esconderijo'],['Vigor','Resistência e ferimentos']
];
// Itens têm funções distintas: bônus, munição, proteção ou acesso a ações especiais.
const ITEM={
 pistola:{name:'Pistola',attr:'Pontaria',bonus:12,type:'weapon'},
 municao:{name:'Munição',attr:'Pontaria',bonus:25,type:'consumivel'},
 pe:{name:'Pé de cabra',attr:'Força',bonus:12,type:'permanente'},
 tenis:{name:'Tênis de corrida',attr:'Velocidade',bonus:12,type:'permanente'},
 sinal:{name:'Sinalizadores',attr:'Furtividade',bonus:18,type:'consumivel'},
 lanterna:{name:'Lanterna',attr:'Furtividade',bonus:12,type:'permanente'},
 colete:{name:'Colete',attr:'Vigor',bonus:8,type:'defensivo'},
 kit:{name:'Kit de primeiros socorros',attr:'Vigor',bonus:20,type:'consumivel'}
};
const ZOMBIE_DIFFICULTIES={
 facil:{label:'Fácil',modifier:10},
 normal:{label:'Normal',modifier:0},
 dificil:{label:'Difícil',modifier:-10}
};
const STAGE_MODIFIERS=[0,0,0,0,-5,-5,-8,-8,-15,-20];
const S=[
 {title:'A festa vira caos',threat:'ZUMBIS LENTOS',story:'Na cobertura, um convidado cai, se contorce e morde o homem ao lado. As luzes piscam. A multidão corre para a saída — e os primeiros infectados se levantam.',opts:[['Correr ao escritório e pegar a pistola','Velocidade','dificil','pistola'],['Escapar pela cozinha sem chamar atenção','Furtividade','medio',null,{usesSignal:true}],['Abrir caminho pela multidão até a porta','Força','facil']]},
 {title:'A escadaria',threat:'ZUMBIS LENTOS',story:'A escadaria está tomada por convidados cambaleantes. O elevador de serviço está aberto, mas faz barulho. Uma janela dá para o toldo do térreo.',opts:[['Empurrar os infectados e descer','Força','facil'],['Descer pelo elevador de serviço em silêncio','Furtividade','medio',null,{usesSignal:true}],['Saltar pela janela até o toldo e pegar o colete','Vigor','dificil','colete']]},
 {title:'A garagem',threat:'ZUMBIS LENTOS',story:'Alarmes disparam entre os carros. Há um porta-malas aberto com um pé de cabra. Os gemidos se aproximam pelo acesso da rua.',opts:[['Pegar o pé de cabra no porta-malas','Força','dificil','pe'],['Acionar um alarme distante e passar escondido','Furtividade','facil',null,{usesSignal:true}],['Correr entre os carros até a saída','Velocidade','medio']]},
 {title:'A praça',threat:'ZUMBIS LENTOS',story:'A praça está tomada. Uma loja de esportes teve a vitrine quebrada; um túnel de manutenção parece vazio, mas está mergulhado na escuridão.',opts:[['Entrar na loja e pegar tênis de corrida','Furtividade','dificil','tenis'],['Atravessar o túnel escuro sem ser visto','Furtividade','medio',null,{usesSignal:true}],['Forçar passagem pela praça','Vigor','facil']]},
 {title:'A sirene',threat:'ZUMBIS RÁPIDOS',story:'Uma sirene corta a noite. Os infectados mudam de comportamento: agora correm. Uma viatura está abandonada no meio da avenida.',opts:[['Pegar sinalizadores no porta-luvas','Velocidade','dificil','sinal'],['Atirar nos primeiros corredores para ganhar tempo','Pontaria','medio',null,{requiresItem:'pistola',usesAmmo:true}],['Subir em um ônibus e bloquear as portas','Força','facil']]},
 {title:'O mercado',threat:'ZUMBIS RÁPIDOS',story:'As prateleiras estão no chão. Passos velozes ecoam pelos corredores. Na sala dos funcionários pode haver uma lanterna; uma saída de manutenção fica no alto.',opts:[['Encontrar a lanterna na sala dos funcionários','Furtividade','dificil','lanterna'],['Se esconder no frigorífico e esperar','Vigor','facil'],['Escalar as prateleiras até a saída superior','Velocidade','medio']]},
 {title:'O metrô',threat:'ZUMBIS RÁPIDOS',story:'A estação é um atalho para o porto. Está escura. Um policial caído ainda carrega munição no cinto, mas os infectados já invadiram a plataforma.',opts:[['Pegar a munição do policial','Pontaria','dificil','municao'],['Correr pelos trilhos até a próxima saída','Velocidade','medio'],['Avançar rente à parede sem fazer ruído','Furtividade','facil',null,{usesSignal:true}]]},
 {title:'A mordida',threat:'ZUMBIS RÁPIDOS',story:'Na saída, um infectado ferido agarra seu braço. Um kit médico está caído perto do ponto de ônibus. Você sente que não há tempo para hesitar.',opts:[['Se soltar e alcançar o kit médico','Vigor','dificil','kit'],['Afastar o infectado com um chute','Força','medio'],['Desviar e correr em direção ao cais','Velocidade','facil']]},
 {title:'O pátio do porto',threat:'CHEFE: O ANFITRIÃO',story:'Entre os contêineres surge o anfitrião da festa. O corpo está deformado, enorme, mas o terno ainda é reconhecível. O navio apita ao fundo.',opts:[['Atirar nos olhos para cegá-lo','Pontaria','dificil',null,{requiresItem:'pistola',usesAmmo:true}],['Contornar os contêineres em silêncio','Furtividade','medio',null,{usesSignal:true}],['Correr pelo corredor entre os contêineres','Velocidade','medio']]},
 {title:'A rampa do navio',threat:'CHEFE: ÚLTIMO CONFRONTO',story:'O Anfitrião alcança o cais. A rampa está subindo e o motor já está ligado. É agora ou nunca: embarcar ou desaparecer com a cidade.',opts:[['Acertar um tiro preciso para detê-lo','Pontaria','dificil',null,{requiresItem:'pistola',usesAmmo:true}],['Derrubar uma estrutura metálica sobre ele','Força','dificil'],['Correr e saltar para a rampa do navio','Velocidade','dificil']]}
];
// A quarta opção só aparece quando o jogador possui o item indicado e ele ainda está disponível.
const SPECIAL_OPTIONS={
 1:{pistola:['Disparar para abrir passagem entre os infectados','Pontaria','medio',null,{specialItem:'pistola',usesAmmo:true}]},
 3:{pe:['Usar o pé de cabra para abrir o portão de manutenção','Força','medio',null,{specialItem:'pe'}]},
 4:{tenis:['Usar os tênis para cruzar a avenida antes dos corredores alcançarem vocês','Velocidade','medio',null,{specialItem:'tenis'}]},
 6:{lanterna:['Usar a lanterna para iluminar os trilhos e localizar uma saída segura','Furtividade','facil',null,{specialItem:'lanterna'}]},
 7:{municao:['Recarregar a pistola e cobrir a fuga do grupo','Pontaria','medio',null,{specialItem:'municao',requiresItem:'pistola',consumes:['municao']}]},
 8:{kit:['Usar o kit médico para tratar os ferimentos antes do confronto','Vigor','medio',null,{specialItem:'kit',consumes:['kit']}]},
 9:{colete:['Firmar o colete e aguentar a investida do Anfitrião','Vigor','medio',null,{specialItem:'colete',consumeOnSuccess:true}]}
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
if (typeof module !== "undefined") module.exports = { ATTRS, ITEM, S, SCENE_CONTEXT, SPECIAL_OPTIONS, ZOMBIE_DIFFICULTIES, STAGE_MODIFIERS };
