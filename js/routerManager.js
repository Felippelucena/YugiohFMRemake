export class RouterManager {
  constructor() {
    this.routes = [];
    this.currentInstance = null;
  }

  addRoute(path, config) {
    const paramNames = [];
    const regexPath = path.replace(/:([\w]+)/g, (_, key) => {
      paramNames.push(key);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${regexPath}$`);
    this.routes.push({ path, regex, paramNames, ...config });
  }

  start() {
    this.navigate();
  }

  async navigate() {
    const path = location.hash.slice(1) || '/';
    const match = this.matchRoute(path);

    if (!match) {
      document.getElementById('app').innerHTML = '<h1>404 - Página não encontrada</h1>';
      return;
    }

    const { route, params } = match;

    const rawTemplate = await fetch(route.template).then(res => res.text());
    const container = document.getElementById('app');
    container.innerHTML = rawTemplate; // Temporário, será substituído no init

    if (this.currentInstance && typeof this.currentInstance.destroy === 'function') {
      this.currentInstance.destroy();
      this.currentInstance = null;
    }


    if (!route.script) return;
    
    const moduleURL = new URL(route.script + `?v=${Date.now()}`, import.meta.url).href;
    const module = await import(moduleURL);

    if (module && typeof module.default === 'function') {
      const PageClass = module.default;
      const page = new PageClass(container, params, rawTemplate);
      page.init();
      this.currentInstance = page;
    }
  }

  matchRoute(path) {
    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        const values = match.slice(1);
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = values[i];
        });
        return { route, params };
      }
    }
    return null;
  }
}
