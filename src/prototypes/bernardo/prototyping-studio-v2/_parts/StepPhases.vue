<script setup lang="ts">
import Icon from './Icon.vue'

const phases = [
  {
    version: 'v1',
    title: 'Provar o ciclo',
    tone: 'violet',
    items: [
      'Primeiro o glossário: Product, Screen, View, Lab, Source (o mesmo nome nas pastas e nos comandos)',
      'Camada Produto (um só, sem seletor)',
      'Context e Skills no Produto, com os do sistema por cima',
      'Fonte conectada; atualização manual (“Pull now”)',
      'Começar com 3 telas; depois chegar a 10 ou 15',
      'Dados de exemplo escritos pelo agente e revisados pela engenharia',
      'Explorar uma tela → View que lembra a origem',
      'No canvas, uma foto da tela de quando você começou',
      'Aviso ↻ e comparação; manter ou recomeçar',
      'Lab: variações e experimentos; proposta = um resumo para quem cuida do sistema',
      'Link de entrega com resumo do agente',
    ],
  },
  {
    version: 'v2',
    title: 'Deixar vivo',
    tone: 'sky',
    items: [
      'Aviso automático quando o app muda',
      'Tela do app ao vivo no canvas',
      'Agente traz a mudança para a sua cópia (você revisa)',
      'Comentar direto numa tela, sem copiar',
      'Lab: painel de teste e o experimento visto nas telas reais',
      'Uma só forma de revisar: antes e depois, aprovar ou recusar (propostas do Lab, mudanças trazidas pelo agente e entregas)',
    ],
  },
  {
    version: 'v3',
    title: 'Crescer',
    tone: 'emerald',
    items: [
      'O próprio app publica a lista de telas e os dados de exemplo',
      'Mais telas sem trabalho manual',
      'Vários produtos, com seletor',
      'Mais de um repositório por produto',
    ],
  },
]
</script>

<template>
  <div class="phases">
    <div class="columns">
      <section v-for="p in phases" :key="p.version" class="phase" :class="p.tone">
        <div class="version">{{ p.version }}</div>
        <h2 class="title">{{ p.title }}</h2>
        <ul class="items">
          <li v-for="item in p.items" :key="item">
            <Icon name="chevron-right" :size="14" class="chevron" />{{ item }}
          </li>
        </ul>
      </section>
    </div>
    <section class="out">
      <h2 class="out-title">Fora, de propósito</h2>
      <p class="out-text">
        Juntar mudanças do app na sua cópia sem você revisar · escrever no repositório do app · puxar as 78
        telas de uma vez · congelar também os componentes dentro de uma cópia.
      </p>
    </section>
  </div>
</template>

<style scoped>
.phases {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.columns {
  display: grid;
  gap: 16px;
}
@media (min-width: 768px) {
  .columns {
    grid-template-columns: repeat(3, 1fr);
  }
}
.phase {
  border-radius: 12px;
  border: 1px solid;
  padding: 16px;
}
.violet {
  border-color: var(--violet-300);
  background: var(--violet-50);
}
.sky {
  border-color: var(--sky-300);
  background: var(--sky-50);
}
.emerald {
  border-color: var(--emerald-300);
  background: var(--emerald-50);
}
.version {
  font-size: 12px;
  font-weight: 600;
  color: var(--zinc-500);
}
.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--zinc-900);
}
.items {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--zinc-800);
}
.items li {
  display: flex;
  gap: 6px;
}
.chevron {
  margin-top: 3px;
  color: var(--zinc-400);
}
.out {
  border-radius: 12px;
  border: 1px solid var(--zinc-200);
  padding: 16px;
  font-size: 13px;
}
.out-title {
  font-weight: 600;
  color: var(--zinc-900);
}
.out-text {
  color: var(--zinc-700);
  margin-top: 4px;
}
</style>
