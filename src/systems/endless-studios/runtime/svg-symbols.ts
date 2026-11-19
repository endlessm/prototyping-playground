// composables/useSvgSymbolsContainer.ts, as the app has it, without @vueuse/core: the original takes its element
// through `unrefElement`, and aliasing that package would also replace Nuxt UI's copy. The ref here receives either
// the element or the SVG component's instance, so it reads `$el` the way `unrefElement` does.
import { onScopeDispose } from 'vue';

let symbolsContainer: SVGSVGElement | null = null;
const symbolReferences = new Map<string, number>();

function getOrCreateSymbolsContainer(): SVGSVGElement {
  if (!symbolsContainer) {
    symbolsContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    symbolsContainer.setAttribute('hidden', '');
    // `hidden` alone gives `display: none`, which breaks filters inside the symbols.
    symbolsContainer.classList.add('render-hidden');
    document.body.insertBefore(symbolsContainer, document.body.firstChild);
  }
  return symbolsContainer;
}

function getSymbol(key: string): SVGSymbolElement | null {
  return symbolsContainer?.querySelector(`#${key}`) ?? null;
}

function getOrCreateSymbol(key: string, svg: SVGSVGElement): SVGSymbolElement | null {
  getOrCreateSymbolsContainer();
  const count = symbolReferences.get(key) || 0;
  if (!symbolsContainer) return null;
  let symbol = getSymbol(key);
  if (!symbol) {
    symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol');
    symbol.setAttribute('id', key);
    for (const attr of svg.attributes) {
      if (attr.name !== 'xmlns') symbol.setAttribute(attr.name, attr.value);
    }
    while (svg.firstChild) symbol.appendChild(svg.firstChild);
    symbolsContainer.appendChild(symbol);
  }
  symbolReferences.set(key, count + 1);
  return symbol;
}

function cleanupSymbol(key: string) {
  const count = symbolReferences.get(key) || 0;
  if (!symbolsContainer) return;
  if (count <= 0) {
    getSymbol(key)?.remove();
    symbolReferences.delete(key);
  }
  if (symbolsContainer.children.length === 0) {
    symbolsContainer.remove();
    symbolsContainer = null;
  }
}

function removeSymbol(key: string) {
  symbolReferences.set(key, (symbolReferences.get(key) || 0) - 1);
  cleanupSymbol(key);
}

function elementOf(target: unknown): unknown {
  return target && typeof target === 'object' && '$el' in target ? (target as { $el: unknown }).$el : target;
}

export function useSvgSymbolsContainer(symbolKey: string) {
  onScopeDispose(() => cleanupSymbol(symbolKey));

  return (target: unknown) => {
    if (!target) {
      removeSymbol(symbolKey);
      return;
    }
    const svg = elementOf(target);
    if (!(svg instanceof SVGSVGElement)) return;
    if (!getOrCreateSymbol(symbolKey, svg)) return;
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#${symbolKey}`);
    svg.replaceWith(use);
  };
}
