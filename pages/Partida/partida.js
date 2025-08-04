// GamePage.js - Versão atualizada sem event listeners estáticos

import { PageTemplate } from "../pageTemplate.js";
import { Game } from "./models/game.js";

let game = null;

export default class GamePage extends PageTemplate {
  init() {
    this.startGame();
  }

  startGame() {

    try {
      // Criar instância do jogo
      game = new Game(this);

      this.setupGlobalListeners();

    } catch (error) {
      console.error("Erro ao iniciar o jogo:", error);
    }
  }

  restartGame() {
    // Reiniciar o jogo
    game = new Game(this);
  }

  setupGlobalListeners() {
    // Listeners que precisam estar sempre ativos, independente da fase

  }

  showSettings() {
    // Implementar modal de configurações se necessário
    console.log("Mostrar configurações");
  }

  destroy() {
    // Limpar referências e listeners globais
    game = null;

  }
}