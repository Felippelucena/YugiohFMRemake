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
    if (this.game.turnSystem.currentPlayer !== this.game.player || this.alreadyAttacked.includes(card)) return;
    if (this.selectedCard === card) {
      card.isDefPosition = !card.isDefPosition;
      this.selectedCard = null;
    } else {
      this.selectedCard = card;
    }
    this.updateUI();
  }

  drawCardElement(cardDiv, card) {
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

    if (this.game.turnSystem.turnCount != 1) {
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
  }

  async battleMonsters(attacker, defender) {
    if (this.alreadyAttacked.includes(attacker)) {
      showToast("Calma ai", `${attacker.name} já atacou este turno.`);
      return;
    }
    if (attacker.isDefPosition) return showToast("Carta em Defesa", "Não é possível atacar com uma carta em Posição de Defesa.");

    attacker.isFaceDown = false;
    defender.isFaceDown = false;
    this.game.updateUI();

    let resultMessage = "";

    if (defender.isDefPosition) {
      const damage = Math.abs(attacker.attack - defender.defense);

      if (attacker.attack > defender.defense) {
        this.removeMonsterFromField(defender);
        resultMessage = `${attacker.name} destruiu ${defender.name} em defesa! Nenhum dano foi causado.`;
        this.game.log(resultMessage);
      } else if (attacker.attack < defender.defense) {
        attacker.owner.takeDamage(damage);
        resultMessage = `${defender.name} em defesa resistiu ao ataque! ${attacker.owner.name} perdeu ${damage} LP.`;
        this.game.log(resultMessage);
      } else {
        resultMessage = `${attacker.name} atacou ${defender.name} em defesa, mas nenhum dano foi causado!`;
        this.game.log(resultMessage);
      }
    } else {
      const damage = Math.abs(attacker.attack - defender.attack);

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
    }

    // Executar animação da batalha
    await this.runanimationBattle(attacker, defender);

    this.alreadyAttacked.push(attacker);
    this.selectedCard = null;
    this.selectedOpponentCard = null;
    this.game.checkGameEnd();
    this.game.updateUI();
  }

async runanimationBattle(attacker, defender = null) {
  return new Promise((resolve) => {
    // cria uma div que ocupa toda a tela
    const bgAnimation = document.createElement("div");
    bgAnimation.className = "bg-game-modal";
    document.body.appendChild(bgAnimation);
    
    // Criar o modal
    const modal = document.createElement("div");
    modal.className = "game-modal d-flex justify-content-center align-items-center p-4";

    let attackerElement, defenderElement;

    setTimeout(() => {
      attackerElement = this.game.createCardElement(attacker.clone());
      attackerElement.classList.add('battle-card-attacker');
      modal.appendChild(attackerElement);
    }, 600);

    setTimeout(() => {
      const x = document.createElement("div");
      x.className = "text-center text-white font-weight-bold fs-1 battle-vs";
      x.innerHTML = `VS`;
      modal.appendChild(x);
    }, 1000);

    if (!defender) {
      setTimeout(() => {
        const resultDiv = document.createElement("div");
        resultDiv.className = "text-center text-white font-weight-bold fs-3";
        resultDiv.innerHTML = `
          <p style="font-size: 24px">${attacker.attack}</p>
        `;
        modal.appendChild(resultDiv);
      }, 1500);
    } else {
      setTimeout(() => {
        defenderElement = this.game.createCardElement(defender.clone());
        defenderElement.classList.add('battle-card-defender');
        modal.appendChild(defenderElement);
      }, 1500);

      setTimeout(() => {
        // Verificar se o defender está em posição de defesa
        if (defender.isDefPosition) {
          if (attacker.attack > defender.defense) {
            this.showBattleResult(defenderElement, "X", "damage-text", () => {
              defenderElement.classList.add('card-destroyed');
            });
          } else if (attacker.attack < defender.defense) {
            // Atacante recebe dano reflexo
            const damage = defender.defense - attacker.attack;
            this.showBattleResult(attackerElement, `-${damage} LP`, "damage-text", () => {
              attackerElement.classList.add('card-damaged');
            });
          } else {
            // Empate - nenhum dano
            this.showBattleResult(modal, "/", "tie-text");
          }
        } else {
          // Batalha em posição de ataque
          if (attacker.attack > defender.attack) {
            // Defender destruído e dono perde LP
            const damage = attacker.attack - defender.attack;
            this.showBattleResult(defenderElement, "X", "damage-text", () => {
              defenderElement.classList.add('card-destroyed');
              setTimeout(() => {
                this.showBattleResult(defenderElement, `-${damage} LP`, "lp-damage-text");
              }, 500);
            });
          } else if (attacker.attack < defender.attack) {
            // Atacante destruído e dono perde LP
            const damage = defender.attack - attacker.attack;
            this.showBattleResult(attackerElement, "X", "damage-text", () => {
              attackerElement.classList.add('card-destroyed');
              setTimeout(() => {
                this.showBattleResult(attackerElement, `-${damage} LP`, "lp-damage-text");
              }, 500);
            });
          } else {
            // Empate - ambos destruídos
            this.showBattleResult(attackerElement, "X", "damage-text", () => {
              attackerElement.classList.add('card-destroyed');
            });
            this.showBattleResult(defenderElement, "X", "damage-text", () => {
              defenderElement.classList.add('card-destroyed');
            });
          }
        }
      }, 2000);
    }

    // Adicionar o modal ao corpo
    document.body.appendChild(modal);

    // Remover o modal após 5.3 segundos e resolver a Promise
    setTimeout(() => {
      modal.remove();
      bgAnimation.remove();
      resolve();
    }, 4000);
  });
}

showBattleResult(element, text, className, callback = null) {
  const resultElement = document.createElement("div");
  resultElement.className = `battle-result ${className}`;
  resultElement.textContent = text;
  
  // Posicionar o texto sobre o elemento (centralizado) considerando o scroll
  const rect = element.getBoundingClientRect();
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  resultElement.style.position = 'absolute';
  resultElement.style.left = `${rect.left + scrollX + rect.width / 2}px`;
  resultElement.style.top = `${rect.top + scrollY + rect.height / 2}px`;
  resultElement.style.transform = 'translate(-50%, -50%)';
  resultElement.style.zIndex = '10001';
  
  document.body.appendChild(resultElement);
  
  // Animar aparição
  setTimeout(() => {
    resultElement.classList.add('show');
  }, 100);
  
  // Executar callback se fornecido
  if (callback) {
    setTimeout(callback, 200);
  }
  
  // Remover após animação
  setTimeout(() => {
    resultElement.remove();
  }, 2000);
}

  async directAttack(attackerCard, target) {
    if (this.alreadyAttacked.includes(attackerCard)) {
      this.game.log(`${attackerCard.name} já atacou este turno.`);
      return;
    }
    if (attackerCard.isDefPosition) return showToast("Carta em Defesa", "Não é possível atacar com uma carta em Posição de Defesa.");

    // Aguardar a animação terminar antes de executar os efeitos
    await this.runanimationBattle(attackerCard);
    
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

      if (this.game.turnSystem.turnCount != 1) {
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
  }

  getCardFromField(cardElement, field) {
    const cardUniqueIdDeck = Number(cardElement.dataset.id);
    return field.find((card) => card && card.uniqueIdDeck === cardUniqueIdDeck);
  }
}
