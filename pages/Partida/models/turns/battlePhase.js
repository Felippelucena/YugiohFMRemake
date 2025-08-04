import { TurnTemplate } from "./turnTemplate.js";

// Fase de Batalha
export class BattlePhase extends TurnTemplate {
  constructor(game) {
    super(game);
    this.name = "battle";
    this.displayName = "Batalha";
    this.selectedCard = null;
    this.selectedOpponentCard = null;
    this.alreadyAttacked = [];
  }

  onEnter() {
        // Se for turno da IA, executar automaticamente
    if (this.game.turnSystem.currentPlayer === this.game.opponent) {
      setTimeout(() => {
        this.game.opponent.makeAttacks(this.game);
      }, 1000);
    }

  }

  setupBehaviors() {
    if (this.game.turnSystem.currentPlayer === this.game.player) {
      this.setupBattleBehaviors();
    }
  }

  selectCard(card) {
    if (this.game.turnSystem.currentPlayer !== this.game.player) return;
    this.selectedCard = card;
    this.updateUI();
  }

  drawCardElement(cardDiv, card, isInHand, isOpponent = false) {
    if (this.selectedCard === card || this.selectedOpponentCard === card) {
      cardDiv.classList.add("selected");
    }

    if (this.alreadyAttacked.includes(card)) {
      cardDiv.classList.add("attacked");
    }
  }

  setupBattleBehaviors() {
    const fieldContainer = document.getElementById("player-field");
    if (!fieldContainer) return;

    // Listener para ESC
    const escListener = (event) => {
      if (event.key === "Escape") {
        this.selectedCard = null;
        this.selectedOpponentCard = null;
        this.game.updateUI();
      }
    };
    document.addEventListener("keydown", escListener);
    this.eventListeners.push({ target: document, type: "keydown", listener: escListener });

    // Listener para selecionar carta do campo
    const clickListener = (e) => {
      const cardElement = e.target.closest(".card-in-game");
      if (!cardElement) return;

      const card = this.getCardFromField(cardElement, this.game.player.field);
      this.selectCard(card);
    };
    fieldContainer.addEventListener("click", clickListener);
    this.eventListeners.push({ target: fieldContainer, type: "click", listener: clickListener });

    // Listener para selecionar carta do oponente
    const opponentFieldContainer = document.getElementById("opponent-field");
    if (!opponentFieldContainer) return;
    const opponentClickListener = async (e) => {
      const cardElement = e.target.closest(".card-in-game");
      if (!cardElement) return;

      const card = this.getCardFromField(cardElement, this.game.opponent.field);
      if (this.selectedCard && this.selectedOpponentCard === card) {
        await this.battleMonsters(this.selectedCard, card);
        this.selectedCard = null;
        this.selectedOpponentCard = null;
        this.game.updateUI();
      } else {
        this.selectedOpponentCard = card;
        this.updateUI();
      }
    };
    opponentFieldContainer.addEventListener("click", opponentClickListener);
    this.eventListeners.push({ target: opponentFieldContainer, type: "click", listener: opponentClickListener });

    // Listener para ataque direto
    opponentFieldContainer.addEventListener("click", (e) => {
      if (this.selectedCard && this.selectedOpponentCard === null && this.game.opponent.field.every((card) => !card)) {
        this.directAttack(this.selectedCard, this.game.opponent);
        this.selectedCard = null;
        this.game.updateUI();
      }
    });
  }

  async battleMonsters(attacker, defender) {
    const damage = Math.abs(attacker.attack - defender.attack);

    // Verifica se o atacante já atacou
    if (this.alreadyAttacked.includes(attacker)) {
      this.game.log(`${attacker.name} já atacou este turno.`);
      return;
    }

    let resultMessage = "";
    if (attacker.attack > defender.attack) {
      this.removeMonsterFromField(defender);
      defender.owner.takeDamage(damage);
      resultMessage = `${attacker.name} destruiu ${defender.name}! ${defender.owner.name} perdeu ${damage} LP.`;
      this.game.log(resultMessage);
    } else if (attacker.attack < defender.attack) {
      this.removeMonsterFromField(attacker);
      attacker.owner.takeDamage(damage);
      resultMessage = `${defender.name} destruiu ${attacker.name}! ${attacker.owner.name} perdeu ${damage} LP.`;
      this.game.log(resultMessage);
    } else {
      this.removeMonsterFromField(attacker);
      this.removeMonsterFromField(defender);
      resultMessage = `${attacker.name} e ${defender.name} se destruíram mutuamente!`;
      this.game.log(resultMessage);
    }

    // Executar animação da batalha
    await this.runanimationBattle(attacker, defender, resultMessage);

    this.alreadyAttacked.push(attacker);
    this.selectedCard = null;
    this.selectedOpponentCard = null;
    this.game.checkGameEnd();
    this.game.updateUI();
  }

    async runanimationBattle(attacker, defender, result) {
    return new Promise((resolve) => {
      // cria uma div que ocupa toda a tela
      const bgAnimation = document.createElement("div");
      bgAnimation.className = "bg-animation";
      document.body.appendChild(bgAnimation);
      // Criar o modal
      const modal = document.createElement("div");
      modal.className = "animate-modal";

      // Adicionar conteúdo ao modal com pausa
      modal.innerHTML += `
      <h2>⚔️ Batalha em Progresso! ⚔️</h2>
    `;
      setTimeout(() => {
        modal.innerHTML += `
        <p>${attacker.name} (ATK: ${attacker.attack}) VS ${defender.name} (ATK: ${defender.attack})</p>
      `;
      }, 600);
      setTimeout(() => {
        modal.innerHTML += `
        <p>Resultado: <strong>${result}</strong></p>
      `;
      }, 2000);

      // Adicionar o modal ao corpo
      document.body.appendChild(modal);

      // Remover o modal após 3 segundos e resolver a Promise
      setTimeout(() => {
        modal.remove();
        bgAnimation.remove();
        resolve(); // Resolve a Promise após o tempo definido
      }, 5300);
    });
  }

  directAttack(attackerCard, target) {
    if (this.alreadyAttacked.includes(attackerCard)) {
      this.game.log(`${attackerCard.name} já atacou este turno.`);
      return;
    }

    target.takeDamage(attackerCard.attack);
    this.game.log(`${attackerCard.name} atacou diretamente! ${target.name} perdeu ${attackerCard.attack} LP.`);
    this.alreadyAttacked.push(attackerCard);
    this.selectedCard = null;
    this.selectedOpponentCard = null;
    this.game.checkGameEnd();
    this.game.updateUI();
  }

  removeMonsterFromField(card) {
    const owner = card.owner;
    const fieldIndex = owner.field.indexOf(card);
    if (fieldIndex > -1) {
      owner.field[fieldIndex] = null;
    }
  }

  removeBehaviors() {
    this.selectedCard = null;
    this.selectedOpponentCard = null;
    this.alreadyAttacked = [];
  }

  setupButtons() {
    if (this.game.turnSystem.currentPlayer === this.game.player) {
      // Botão Finalizar Turno
      this.createButton("end-turn-btn", "Finalizar Turno", "btn-outline-primary", () => {
        this.game.turnSystem.nextPhase();
      });
      // Botão Atacar
      this.createButton("battle-btn", "Atacar", "btn-danger", async () => {
        if (this.selectedCard && this.selectedOpponentCard) {
          await this.battleMonsters(this.selectedCard, this.selectedOpponentCard);
          this.selectedCard = null;
          this.selectedOpponentCard = null;
          this.game.updateUI();
        }
        if (this.selectedCard && this.selectedOpponentCard === null && this.game.opponent.field.every((card) => !card)) {
          this.directAttack(this.selectedCard, this.game.opponent);
          this.selectedCard = null;
          this.game.updateUI();
        }
      });
    }
  }

  getCardFromField(cardElement, field) {
    const cardUniqueIdDeck = Number(cardElement.dataset.id);
    return field.find((card) => card && card.uniqueIdDeck === cardUniqueIdDeck);
  }
}
