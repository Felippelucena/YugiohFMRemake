// game.js - Versão atualizada com sistema de turnos refatorado

import { CardDatabase } from "./card.js";
import { FusionSystem } from "./fusionSystem.js";
import { Deck } from "./deck.js";
import { Player } from "./player.js";
import { AIPlayer } from "./aiPlayer.js";
import { TurnSystem } from "./turnSystem.js";

export class Game {
  constructor(pageTemplate) {
    this.cardDatabase = new CardDatabase();
    this.fusionSystem = new FusionSystem();
    this.player = new Player("Jogador");
    this.opponent = new AIPlayer("Oponente");
    this.turnSystem = new TurnSystem(this);
    this.pageTemplate = pageTemplate;
    this.gameOver = false;

    this.initGame();
  }

  async initGame() {
    await this.cardDatabase.initializeCards();

    this.player.deck = new Deck(this.cardDatabase, false);
    this.opponent.deck = new Deck(this.cardDatabase, true);

    for (let i = 0; i < 4; i++) {
      this.player.drawCard();
      this.opponent.drawCard();
    }

    showToast("Jogo Iniciado", "O jogo começou, Você começa!", "success");

    this.turnSystem.currentPlayer = this.player;
    this.turnSystem.executeCurrentPhase();
  }

  checkGameEnd() {
    if (this.player.lifePoints <= 0) {
      this.endGame(this.opponent);
    } else if (this.opponent.lifePoints <= 0) {
      this.endGame(this.player);
    } else if (this.player.deck.isEmpty() && this.player.hand.length === 0) {
      this.endGame(this.opponent);
    } else if (this.opponent.deck.isEmpty() && this.opponent.hand.length === 0) {
      this.endGame(this.player);
    }
  }

  endGame(winner) {
    this.gameOver = true;
    this.log(`🎉 ${winner.name} venceu o duelo! 🎉`);
    showToast("Fim de Jogo", `${winner.name} venceu!`, "success");
    this.turnSystem.currentPhase.onExit();
    this.turnSystem.currentPhase = this.turnSystem.phases.end;
    this.turnSystem.executeCurrentPhase();
  }

  getOpponentOf(player) {
    return player === this.player ? this.opponent : this.player;
  }

  log(message) {
    const logElement = document.getElementById("battle-log");
    if (logElement) {
      const div = document.createElement("div");
      div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
      logElement.appendChild(div);
      logElement.scrollTop = logElement.scrollHeight;
    } else {
      console.log(message);
    }
  }

  updateUI() {
    // Atualizar LP
    this.updateLP();

    // Atualizar mão do jogador
    this.updatePlayerHand();

    // Atualizar campos
    this.updatePlayerField();
    this.updateOpponentField();
  }

  updateLP() {
    // Atualizar LP
    const playerLPElement = document.getElementById("player-lp");
    const opponentLPElement = document.getElementById("opponent-lp");
    const playerDeckCountElement = document.getElementById("player-deck-count");
    const opponentDeckCountElement = document.getElementById("opponent-deck-count");
    const opponentHandCountElement = document.getElementById("opponent-hand-count");
    if (opponentHandCountElement) opponentHandCountElement.textContent = this.opponent.hand.length;
    if (playerLPElement) playerLPElement.textContent = this.player.lifePoints;
    if (opponentLPElement) opponentLPElement.textContent = this.opponent.lifePoints;
    if (playerDeckCountElement) playerDeckCountElement.textContent = this.player.deck.cards.length;
    if (opponentDeckCountElement) opponentDeckCountElement.textContent = this.opponent.deck.cards.length;

    // Atualizar fase e turno
    const currentPhaseElement = document.getElementById("current-phase");
    const currentTurnElement = document.getElementById("current-turn");
    if (currentPhaseElement) currentPhaseElement.textContent = this.turnSystem.getPhaseDisplay();
    if (currentTurnElement) currentTurnElement.textContent = this.turnSystem.currentPlayer.name;
  }

  updatePlayerHand() {
    const handElement = document.getElementById("player-hand");
    if (!handElement) return;

    handElement.innerHTML = "";

    this.player.hand.forEach((card) => {
      const cardDiv = this.createCardElement(card, true);
      handElement.appendChild(cardDiv);
    });
  }

  updatePlayerField() {
    const fieldElement = document.getElementById("player-field");
    if (!fieldElement) return;
    const drawslots = `
      <div class="card-slot" data-slot="0"></div>
      <div class="card-slot" data-slot="1"></div>
      <div class="card-slot" data-slot="2"></div>
      <div class="card-slot" data-slot="3"></div>
      <div class="card-slot" data-slot="4"></div>
    `;

    fieldElement.innerHTML = drawslots;

    const slots = fieldElement.querySelectorAll(".card-slot");

    slots.forEach((slot, index) => {
      slot.innerHTML = "";
      if (this.player.field[index]) {
        const cardDiv = this.createCardElement(this.player.field[index], false);
        if (this.player.field[index].isFaceDown) {
          //adicionar title
          cardDiv.title = `${this.player.field[index].name}: ${this.player.field[index].attack}/${this.player.field[index].defense}`;
        }
        slot.appendChild(cardDiv);
      }

      this.turnSystem.currentPhase.drawPlayerField(slot, index);
    });
  }

  updateOpponentField() {
    const fieldElement = document.getElementById("opponent-field");
    if (!fieldElement) return;
    const drawslots = `
      <div class="card-slot" data-slot="0"></div>
      <div class="card-slot" data-slot="1"></div>
      <div class="card-slot" data-slot="2"></div>
      <div class="card-slot" data-slot="3"></div>
      <div class="card-slot" data-slot="4"></div>
    `;

    fieldElement.innerHTML = drawslots;

    const slots = fieldElement.querySelectorAll(".card-slot");

    slots.forEach((slot, index) => {
      slot.innerHTML = "";
      if (this.opponent.field[index]) {
        const cardDiv = this.createCardElement(this.opponent.field[index], false, true);
        slot.appendChild(cardDiv);
      }
    });
  }

  createModal(options) {
  const {
    id,
    title,
    bodyContent,
    backdrop = "static",
    keyboard = false,
    onShow = null,
    onHide = null
  } = options;

  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = id;
  modal.tabIndex = -1;
  modal.setAttribute("aria-labelledby", `${id}Label`);
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="${id}Label">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          ${bodyContent}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  const bootstrapModal = new bootstrap.Modal(modal, {
    backdrop,
    keyboard,
  });

  // Executar callback personalizado quando o modal é mostrado
  if (onShow) {
    modal.addEventListener('shown.bs.modal', () => onShow(modal));
  }

  // Executar callback personalizado quando o modal é ocultado
  if (onHide) {
    modal.addEventListener('hidden.bs.modal', () => {
      onHide(modal);
      modal.remove();
    });
  } else {
    // Comportamento padrão: remover modal quando oculto
    modal.addEventListener('hidden.bs.modal', () => {
      modal.remove();
    });
  }

  return { modal, bootstrapModal };
}

  createCardElement(card) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card-in-game";
    cardDiv.dataset.id = card.uniqueIdDeck;

    if (card.isFaceDown) {
      cardDiv.innerHTML = `
        <div class="card-back"></div>
      `;
    } else {
    const attributeIcons = {
      "Dark": "https://ms.yugipedia.com//d/de/DARK.svg",
      "Light": "https://ms.yugipedia.com//3/39/LIGHT.svg",
      "Earth": "https://ms.yugipedia.com//a/a1/EARTH.svg",
      "Fire": "https://ms.yugipedia.com//d/d6/FIRE.svg",
      "Water": "https://ms.yugipedia.com//4/40/WATER.svg",
      "Wind": "https://ms.yugipedia.com//0/01/WIND.svg",
    };
    cardDiv.classList.add("p-1");
    cardDiv.innerHTML = `
        <div class="fw-bold text-truncate title">
          <img width="16" height="16" src="${attributeIcons[card.attribute]}" alt="${card.attribute}" title="${card.attribute}" >
          <span title="${card.name}">${card.name}</span>
        </div>
        <div class="card-image" style="background-image: url('${card.card_images[0]?.image_url_cropped}');" alt="${card.name}">
          <div class="info-card">
            <div>${card.monsterType}</div>
          </div>
        </div>
        <div class="stats-card">
        <div class="text-danger text-center">ATK</br><span style="font-size:15px; width:48%">${card.attack}</span></div>
        <div>|</div>
        <div class="text-primary text-center">DEF</br><span style="font-size:15px; width:48%">${card.defense}</span></div>
        </div>
    `;
    }

    if (card.isDefPosition) {
      cardDiv.classList.add("def-position");
    }

    if (card.type == "Fusion Monster") {
      cardDiv.classList.add("fusion-monster");
    } else if (card.type == "Effect Monster") {
      cardDiv.classList.add("effect-monster");
    } else if (card.type == "Ritual Monster") {
      cardDiv.classList.add("ritual-monster");
    }



    this.turnSystem.currentPhase.drawCardElement(cardDiv, card);

    return cardDiv;
  }
}
