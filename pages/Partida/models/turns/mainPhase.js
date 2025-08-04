import { TurnTemplate } from "./turnTemplate.js";

// Fase Principal
export class MainPhase extends TurnTemplate {
  constructor(game) {
    super(game);
    this.name = "main";
    this.displayName = "Principal";
    this.selectedCard = null;
    this.selectedSpaceField = null;
    this.fusionCards = [];
  }

  onEnter() {
    // Se for turno da IA, executar automaticamente
    if (this.game.turnSystem.currentPlayer === this.game.opponent) {
      setTimeout(() => {
        this.game.opponent.makeMove(this.game);
      }, 1000);
    }
  }

  setupBehaviors() {
    if (this.game.turnSystem.currentPlayer === this.game.player) {
      this.setupPlayerBehaviors();
    }
  }

  setupPlayerBehaviors() {
    const handContainer = document.getElementById("player-hand");
    if (!handContainer) return;

    // Adicionar listener para ESC
    const escListener = (event) => {
      if (event.key === "Escape") {
        this.selectedCard = null;
        this.fusionCards = [];
        this.selectedSpaceField = null;
        this.game.updateUI();
      }
    };
    document.addEventListener("keydown", escListener);
    this.eventListeners.push({ target: document, type: "keydown", listener: escListener });

    // Listener de clique em cartas da mão
    const clickHandListener = (e) => {
      const cardElement = e.target.closest(".card-in-game");
      if (!cardElement) return;

      const card = this.getCardFromElement(cardElement);
      if (this.fusionCards.length > 0) {
        this.addToFusion(card);
      } else {
        this.selectCard(card);
      }
    };
    handContainer.addEventListener("click", clickHandListener);
    this.eventListeners.push({ target: handContainer, type: "click", listener: clickHandListener });

    // Listener de clique em espaços do campo
    const fieldContainer = document.getElementById("player-field");
    if (!fieldContainer) return;
    const clickFieldListener = (e) => {
      const slotElement = e.target.closest(".card-slot");
      if (!slotElement) return;

      //recuperar o índice do slot em data-slot
      const slotIndex = Number(slotElement.dataset.slot);
      this.selectedSpaceField = slotIndex;
      this.game.updateUI();
    };
    fieldContainer.addEventListener("click", clickFieldListener);
    this.eventListeners.push({ target: fieldContainer, type: "click", listener: clickFieldListener });

    // Listener de clique direito
    const contextMenuListener = (e) => {
      e.preventDefault();
      const cardElement = e.target.closest(".card-in-game");
      if (!cardElement) return;

      const card = this.getCardFromElement(cardElement);
      this.createContextMenu(e, [
        {
          label: "Adicionar para fusão",
          action: () => {
            if (this.fusionCards.length < 5) {
              this.addToFusion(card);
            }
          },
        },
      ]);
    };
    handContainer.addEventListener("contextmenu", contextMenuListener);
    this.eventListeners.push({ target: handContainer, type: "contextmenu", listener: contextMenuListener });
  }

  drawPlayerField(slot, index) {
    if (this.selectedSpaceField == index) {
      slot.classList.add("filled");
    }
  }

  drawCardElement(cardDiv, card, isInHand, isOpponent = false) {
    if (this.selectedCard === card) {
      cardDiv.classList.add("selected");
    }

    if (this.fusionCards.includes(card)) {
      cardDiv.classList.add("in-fusion");
      // Adicionando numero da ordem de fusão
      const fusionIndex = this.fusionCards.indexOf(card) + 1;
      //icone de espiral com indece da fusão
      cardDiv.innerHTML += `
        <div class="fusion-indicator" style="font-size: 15px"> 🔥 ${fusionIndex}</div>
      `;
    }
  }

  summonSelected() {
    if (!this.selectedCard) return;

    if (this.selectedSpaceField !== null) {
      this.game.turnSystem.currentPlayer.summonMonster(this.selectedCard, this.selectedSpaceField);
      this.game.log(`${this.game.turnSystem.currentPlayer.name} invocou ${this.selectedCard.name} (ATK: ${this.selectedCard.attack})`);
      this.selectedCard = null;
      this.game.turnSystem.nextPhase();
    } else {
      const emptySlot = this.game.turnSystem.currentPlayer.getEmptyFieldSlot();
      if (emptySlot !== -1) {
        this.game.turnSystem.currentPlayer.summonMonster(this.selectedCard, emptySlot);
        this.game.log(`${this.game.turnSystem.currentPlayer.name} invocou ${this.selectedCard.name} (ATK: ${this.selectedCard.attack})`);
        this.selectedCard = null;
        this.game.turnSystem.nextPhase();
      } else {
        alert("Não há espaços vazios no campo, selecione uma carta do campo para fundir ou substituir!");
      }
    }
  }

  selectCard(card) {
    if (this.game.turnSystem.currentPlayer !== this.game.player) return;
    this.selectedCard = card;
    this.updateUI();
  }

  addToFusion(card) {
    if (!this.fusionCards.includes(card)) {
      this.fusionCards.push(card);
      this.selectedCard = null;
      this.updateUI();
    } else {
      const index = this.fusionCards.indexOf(card);
      if (index > -1) {
        this.fusionCards.splice(index, 1);
      }
      this.updateUI();
    }
  }

  removeBehaviors() {
    this.selectedCard = null;
    this.fusionCards = [];
    this.selectedSpaceField = null;
  }

  async attemptFusion() {
    if (this.fusionCards.length < 1) {
      alert("Selecione pelo menos 1 carta para fusão!");
      return;
    }

    if (this.selectedSpaceField !== null) {
      const fieldCard = this.game.turnSystem.currentPlayer.field[this.selectedSpaceField];
      if (fieldCard) {
        this.fusionCards.unshift(fieldCard);
      }
    }

    let fusionList = [...this.fusionCards];

    while (fusionList.length > 1) {
      const cardIds = [fusionList[0].id, fusionList[1].id];
      const fusionResultId = this.game.fusionSystem.canFuse(cardIds, this.game.cardDatabase);

      if (fusionResultId) {
        const fusionResult = this.game.cardDatabase.getCard(fusionResultId).clone();
        fusionResult.owner = this.game.turnSystem.currentPlayer;

        await this.runanimationFusion(fusionResult, fusionList[0], fusionList[1]);
        this.game.log(`Fusão bem-sucedida entre ${fusionList[0].name} e ${fusionList[1].name}! ${fusionResult.name} foi criada.`);
        fusionList.splice(0, 2);
        fusionList.unshift(fusionResult);
      } else {
        await this.runanimationFusion(null, fusionList[0], fusionList[1]);
        this.game.log(`Fusão falhou entre ${fusionList[0].name} e ${fusionList[1].name}.`);
        fusionList.shift();
      }
    }

    const finalCard = fusionList[0];

    if (finalCard) {
      this.fusionCards.forEach((card) => {
        const handIndex = this.game.turnSystem.currentPlayer.hand.indexOf(card);
        if (handIndex > -1) {
          this.game.turnSystem.currentPlayer.hand.splice(handIndex, 1);
        }

        const fieldIndex = this.game.turnSystem.currentPlayer.field.indexOf(card);
        if (fieldIndex > -1) {
          this.game.turnSystem.currentPlayer.field[fieldIndex] = null;
        }
      });

      this.fusionCards = [];
      finalCard.uniqueIdDeck = Date.now();

      this.selectedCard = finalCard;
      this.summonSelected();
    } else {
      alert("Nenhuma fusão foi possível!");
      this.fusionCards = [];
    }
  }

  async runanimationFusion(fusionResult, card1, card2) {
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
      <h2>🔥 Fusão em Progresso! 🔥</h2>
    `;
      setTimeout(() => {
        modal.innerHTML += `
      <p>${card1.name} + ${card2.name}</p>
    `;
      }, 600);
      setTimeout(() => {
        modal.innerHTML += `
      <p>Resultado: <strong>${fusionResult ? fusionResult.name : "Fusão Falhou"}</strong></p>
    `;
      }, 2000);
      // Adicionar o modal ao corpo
      document.body.appendChild(modal);

      // Remover o modal após 3 segundos e resolver a Promise
      setTimeout(() => {
        modal.remove();
        bgAnimation.remove();
        resolve(); // Resolve a Promise após o tempo definido
      }, 3300);
    });
  }

  invocarFundir() {
    if (this.fusionCards.length > 0) {
      this.attemptFusion();
    } else if (this.selectedCard) {
      if (this.selectedSpaceField !== null && this.game.player.field[this.selectedSpaceField] !== null) {
        // Tentar fusão com a carta do campo
        this.fusionCards = [this.selectedCard];
        this.attemptFusion();
      } else {
        // Espaço vazio, invocar normalmente
        this.summonSelected();
      }

      // Limpar seleção e fusões
      this.selectedCard = null;
      this.fusionCards = [];
    } else {
      this.game.showToast("Selecione uma carta", "Você precisa selecionar uma carta para invocar ou fundir!", "warning");
    }
  }

  setupButtons() {
    if (this.game.turnSystem.currentPlayer === this.game.player) {
      // Botão Invocar
      this.createButton("summon-btn", "Invocar/Fundir", "btn-game", () => {
        this.invocarFundir();
      });
    }
  }

  getCardFromElement(cardElement) {
    const cardUniqueIdDeck = Number(cardElement.dataset.id);
    return this.game.player.hand.find((card) => card.uniqueIdDeck === cardUniqueIdDeck);
  }
}
