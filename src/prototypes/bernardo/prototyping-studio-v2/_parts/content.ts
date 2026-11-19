// The walkthrough's words and sample data, from the council's final mockup
// (.scratch/design-studio-v2/mockups/studio-final.jsx).

// Names in one place: renaming any concept is a one-line change.
export const N = {
  product: 'Product',
  screens: 'Screens',
  screen: 'Screen',
  view: 'View',
  prototypes: 'Prototypes',
  prototype: 'Prototype',
  lab: 'Lab',
  system: 'Design system',
  source: 'Source',
  prod: 'App',
} as const

export type StepId =
  | 'map'
  | 'home'
  | 'screens'
  | 'screen'
  | 'canvas'
  | 'update'
  | 'lab'
  | 'handoff'
  | 'connect'
  | 'phases'

export const STEPS: { id: StepId; label: string }[] = [
  { id: 'map', label: '1 · O mapa' },
  { id: 'home', label: '2 · Casa do produto' },
  { id: 'screens', label: '3 · Telas reais' },
  { id: 'screen', label: '4 · Explorar uma tela' },
  { id: 'canvas', label: '5 · No canvas' },
  { id: 'update', label: '6 · O app mudou' },
  { id: 'lab', label: '7 · Lab' },
  { id: 'handoff', label: '8 · Entregar à engenharia' },
  { id: 'connect', label: '9 · Conectar a fonte' },
  { id: 'phases', label: '10 · Fases' },
]

export const NOTES: Record<StepId, string> = {
  map: 'O Produto vira a casa de tudo. Uma regra guia o resto: Screen é o que existe no app (só leitura); View é o que você propõe (editável, dentro de um Protótipo). A Fonte é o repositório do app, que alimenta as telas e os componentes. O Lab é a bancada dos componentes.',
  home: 'A página do produto responde três perguntas: o que mudou no app, quais protótipos foram afetados (o sinal ↻) e o que o time está explorando. Mudança no app é notícia, não erro: por isso o sinal é azul e calmo.',
  screens:
    'As telas vêm do app, mas só as escolhidas: cada uma precisa de dados de exemplo para aparecer. Uma tela que não dá para mostrar aparece com aviso. Uma tela que saiu do app continua aqui enquanto algum protótipo usar. Experimente o filtro “Updated”.',
  screen:
    'Cada tela mostra seus estados de exemplo, o histórico e onde já foi usada. “Explore” cria uma View dentro de um Protótipo, carimbada com a origem e a data em que a tela foi trazida do app.',
  canvas:
    'No canvas, a tela do app tem moldura azul e o selo APP. As Views de cada pessoa têm a cor dela. Na v1, a tela do app aparece como uma foto de quando você começou; na v2, ao vivo. O ↻ avisa que o app mudou depois disso.',
  update:
    'O seu layout nunca muda sozinho. Os componentes dentro dele seguem o design system (um aviso separado conta quando o sistema muda). Quando o app muda, o agente explica a mudança em palavras simples e você escolhe o que fazer. Experimente os botões.',
  lab: 'Cada componente tem uma bancada com variações e experimentos. Cada experimento é um protótipo por baixo, então comentários e links funcionam igual. Na v1, “Propose” manda um resumo para quem cuida do sistema; o painel de teste e a visão nas telas reais chegam na v2.',
  handoff:
    'Para entregar à engenharia: um único link com o app ao lado da proposta, os estados e um resumo escrito pelo agente, incluindo os comentários que você escolher. Nada é enviado para o código do app.',
  connect:
    'A Fonte é configurada uma vez por produto, por quem cuida do sistema. Você escolhe quais telas entram. O agente escreve os dados de exemplo de cada uma e alguém da engenharia revisa, como qualquer outra mudança. Na v1, as atualizações são trazidas à mão.',
  phases:
    'Começar pequeno: a v1 prova o ciclo com 3 telas e depois chega a 10 ou 15. Em seguida vêm o aviso automático, a tela ao vivo no canvas, os experimentos vistos nas telas reais e uma cobertura maior.',
}

export type Tone = 'zinc' | 'amber' | 'sky' | 'emerald' | 'violet' | 'rose'
export type ThumbKind = 'table' | 'cards' | 'profile' | 'form' | 'drawer' | 'dash'
export type ScreenStatus = 'ok' | 'changed' | 'new' | 'broken' | 'removed'

export interface Screen {
  title: string
  route: string
  kind: ThumbKind
  status: ScreenStatus
  /** How many prototypes explore it. */
  used: number
  area: string
}

export const SCREENS: Screen[] = [
  { title: 'Cohort overview', route: '/leader/programs/:id/cohorts/:id', kind: 'table', status: 'changed', used: 3, area: 'Leader' },
  { title: 'Programs list', route: '/leader/programs', kind: 'cards', status: 'changed', used: 1, area: 'Leader' },
  { title: 'Program page', route: '/programs/:id', kind: 'dash', status: 'changed', used: 0, area: 'Learner' },
  { title: 'Leader dashboard', route: '/leader/dashboard', kind: 'dash', status: 'ok', used: 2, area: 'Leader' },
  { title: 'Game users', route: '/leader/games/:id/users', kind: 'table', status: 'broken', used: 0, area: 'Games' },
  { title: 'Profile', route: '/profile/:username', kind: 'profile', status: 'ok', used: 1, area: 'Profile' },
  { title: 'AI literacy', route: '/leader/dashboard/ai-literacy', kind: 'dash', status: 'new', used: 0, area: 'Leader' },
  { title: 'Sign up (old)', route: '/signup/legacy', kind: 'form', status: 'removed', used: 2, area: 'Sign in & up' },
]

export const AREAS = ['All', 'Leader', 'Learner', 'Profile', 'Games', 'Sign in & up']

export const STATUS: Record<ScreenStatus, { tone: Tone; label: string }> = {
  ok: { tone: 'emerald', label: 'Up to date' },
  changed: { tone: 'sky', label: '↻ Updated' },
  new: { tone: 'violet', label: 'New in app' },
  broken: { tone: 'rose', label: 'Needs a sample' },
  removed: { tone: 'zinc', label: 'Removed from app' },
}

export const SAMPLES = ['Full cohort', 'Empty cohort', 'Missing consent']
