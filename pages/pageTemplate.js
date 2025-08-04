export class PageTemplate {
  constructor(container, params = {}, rawTemplate = '') {
    this.container = container;
    this.params = params;
    this.rawTemplate = rawTemplate;
  }

  // Renderiza as chaves do HTML com os dados do contexto
  renderTemplate(context = {}) {
    this.container.innerHTML = this.rawTemplate.replace(/{{\s*(\w+)\s*}}/g, (_, key) => context[key] ?? '');
  }

  // Para sobrescrever nas subclasses
  init() {}

  // Executado automaticamente na troca de rota
  destroy() {}
}
