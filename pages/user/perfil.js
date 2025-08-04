import { PageTemplate } from '../pageTemplate.js';

export default class UserPage extends PageTemplate {
  init() {
    const user = {
      id: this.params.id,
      nome: 'Felippe',
      email: 'felippe@example.com',
    };

    this.renderTemplate(user);

    // Exemplo: interações JS
    this.btn = this.container.querySelector('#say-hi');
    if (this.btn) {
      this.btn.addEventListener('click', this.sayHi);
    }
  }

  sayHi = () => {
    alert(`Olá, ${this.params.id}!`);
  }

  destroy() {
    if (this.btn) {
      this.btn.removeEventListener('click', this.sayHi);
    }
  }
}
