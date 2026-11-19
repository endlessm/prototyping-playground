<script setup lang="ts">
import MapBox from './MapBox.vue'
import { N } from './content'
</script>

<template>
  <div class="map">
    <div class="columns">
      <section class="today">
        <h2 class="eyebrow">Hoje</h2>
        <div class="stack">
          <MapBox title="Systems" sub="Endless Studios" icon="shapes">
            <MapBox title="Context · Skills" sub="mistura o que é do produto com o que é do kit" />
            <MapBox title="Theme · Assets · Components" />
            <MapBox
              title="Cópia do app real"
              sub="copiada à mão em um dia; já tem 21 arquivos diferentes do app"
              dashed
            />
          </MapBox>
          <MapBox title="Prototypes" sub="cada um aponta para um sistema" icon="pen-tool" />
        </div>
      </section>

      <section class="proposal">
        <h2 class="eyebrow">Proposta</h2>
        <MapBox
          :title="`${N.product} · Endless Studios`"
          sub="a casa de tudo que é sobre este produto"
          tone="violet"
        >
          <MapBox
            :title="N.source"
            sub="o repositório do app real · alimenta as telas e os componentes"
            tone="slate"
            icon="folder-git-2"
          />
          <div class="pair">
            <MapBox
              title="Knowledge"
              sub="Context · Skills do produto (personas, voz, públicos)"
              icon="file-text"
            />
            <MapBox
              :title="N.screens"
              sub="as telas reais · só leitura · com dados de exemplo"
              tone="sky"
              icon="monitor-smartphone"
            />
          </div>
          <MapBox
            :title="`${N.system} (1 ou mais, um padrão)`"
            sub="Theme · Assets · Components + o Context/Skills do kit, por cima do produto"
            icon="shapes"
          />
          <div class="pair">
            <MapBox
              :title="N.prototypes"
              sub="suas Views; podem nascer de uma tela real e lembram a origem"
              tone="amber"
              icon="pen-tool"
            />
            <MapBox
              :title="N.lab"
              sub="experimentos em componentes (cada um é um protótipo por baixo)"
              tone="emerald"
              icon="flask-conical"
            />
          </div>
        </MapBox>
      </section>
    </div>

    <div class="rules">
      <div class="rule sky">
        <div class="rule-title">{{ N.screen }} = o que existe</div>
        <div>Vem do app. Ninguém edita. Atualiza quando a Fonte é puxada.</div>
      </div>
      <div class="rule amber">
        <div class="rule-title">{{ N.view }} = o que você propõe</div>
        <div>
          Uma cópia sua, dentro de um protótipo. O layout nunca muda sozinho; os componentes seguem
          o sistema.
        </div>
      </div>
      <div class="rule emerald">
        <div class="rule-title">{{ N.lab }} = a bancada</div>
        <div>Teste um componente e proponha a mudança ao sistema.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map {
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
    grid-template-columns: repeat(5, 1fr);
  }
  .today {
    grid-column: span 2;
  }
  .proposal {
    grid-column: span 3;
  }
}
.today,
.proposal {
  border-radius: 12px;
  border: 1px solid var(--zinc-200);
  padding: 16px;
  background: var(--zinc-50);
}
.proposal {
  border-color: var(--violet-200);
  background: #fff;
}
.eyebrow {
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  color: var(--zinc-500);
  margin-bottom: 12px;
}
.proposal .eyebrow {
  color: var(--violet-600);
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pair {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}
.rules {
  display: grid;
  gap: 12px;
  font-size: 13px;
  line-height: 1.5;
}
@media (min-width: 640px) {
  .rules {
    grid-template-columns: repeat(3, 1fr);
  }
}
.rule {
  border-radius: 12px;
  border: 1px solid;
  padding: 12px;
}
.rule-title {
  font-weight: 600;
}
.sky {
  border-color: var(--sky-200);
  background: var(--sky-50);
  color: var(--sky-800);
}
.sky .rule-title {
  color: var(--sky-900);
}
.amber {
  border-color: var(--amber-200);
  background: var(--amber-50);
  color: var(--amber-800);
}
.amber .rule-title {
  color: var(--amber-900);
}
.emerald {
  border-color: var(--emerald-200);
  background: var(--emerald-50);
  color: var(--emerald-800);
}
.emerald .rule-title {
  color: var(--emerald-900);
}
</style>
