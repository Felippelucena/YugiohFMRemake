// Classe base para templates de turno
export class TurnTemplate {
  constructor(game) {
    this.game = game;
    this.name = "base";
    this.displayName = "Base";
    this.eventListeners = [];
  }

  // Template method - define o fluxo da fase
  execute() {
    this.updateUI();
    this.onEnter();
    this.setupBehaviors();
    this.setupButtons();
    this.updateUI();
  }

  // Métodos que devem ser implementados pelas subclasses
  onEnter() {
    // Lógica executada ao entrar na fase
  }

  setupBehaviors() {
    // Configurar comportamentos específicos da fase
  }

  setupButtons() {
    // Configurar botões disponíveis na fase
  }

  onExit() {
    // Lógica executada ao sair da fase
    this.removeBehaviors();
    this.removeButtons();
    // Remove todos os listeners registrados
    this.eventListeners.forEach(({ target, type, listener }) => {
      target.removeEventListener(type, listener);
    });
    this.eventListeners = [];
  }

  removeBehaviors() {
    // Remover comportamentos específicos da fase
  }

  drawPlayerField(slot, index) {
    // Desenhar o campo do jogador
  }

  drawCardElement(cardDiv, card) {
    // Desenhar o elemento da carta
  }

  createButton(id, text, className, onClick) {
    let button = document.getElementById(id);
    if (!button) {
      button = document.createElement("button");
      button.id = id;
      button.className = `btn ${className} phase-button me-1`;
      const controlsArea = document.getElementById("game-controls");
      if (controlsArea) {
        controlsArea.appendChild(button);
      }
    }

    button.textContent = text;
    button.style.display = "inline-block";
    button.onclick = onClick;
  }

  createContextMenu(event, options) {
    event.preventDefault();

    const existingMenus = document.querySelectorAll(".context-menu");
    existingMenus.forEach((menu) => menu.remove());

    const contextMenu = document.createElement("div");
    contextMenu.className = "context-menu";
    contextMenu.style.position = "absolute";
    contextMenu.style.top = `${event.pageY}px`;
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.backgroundColor = "#fff";
    contextMenu.style.border = "1px solid #ccc";
    contextMenu.style.padding = "5px";
    contextMenu.style.zIndex = "1000";

    options.forEach((option) => {
      const optionElement = document.createElement("div");
      optionElement.textContent = option.label;
      optionElement.style.cursor = "pointer";
      optionElement.onclick = () => {
        option.action();
        if (document.body.contains(contextMenu)) {
          document.body.removeChild(contextMenu);
        }
      };
      contextMenu.appendChild(optionElement);
    });

    document.body.appendChild(contextMenu);

    document.addEventListener(
      "click",
      () => {
        if (document.body.contains(contextMenu)) {
          document.body.removeChild(contextMenu);
        }
      },
      { once: true }
    );
  }

  removeButtons() {
    // Destruir botões da fase atual ".phase-button"
    const buttons = document.querySelectorAll(".phase-button");
    buttons.forEach((btn) => {
      btn.remove();
    });
  }

  updateUI() {
    this.game.updateUI();
  }

  // Método para verificar se pode avançar para próxima fase
  canAdvance() {
    return true;
  }
}
