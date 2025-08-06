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

  drawCardElement(cardDiv, card) {
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

selectFaceModal() {
  if (!this.selectedCard) return;

  let isFaceDown = false;

  const dinamicContent = (modal) => {
    if (!this.selectedCard) return;
    // Fazer clone da carta selecionada
    const cardClone = this.selectedCard.clone();
    cardClone.isFaceDown = isFaceDown;
    const cardDiv = this.game.createCardElement(cardClone);

    // Atualizar apenas o conteúdo da carta, não o modal inteiro
    const cardContainer = modal.querySelector(".card-container");
    if (cardContainer) {
      cardContainer.innerHTML = cardDiv.outerHTML;
    }
  };

  const bodyContent = `
    <div class="d-flex justify-content-around align-items-center">
      <button class="btn btn-primary turn"><</button>
      <div class="card-container">
      </div>
      <button class="btn btn-secondary turn">></button>
    </div>
    <button class="btn btn-secondary" id="confirmPosition">Confirmar</button>
  `;

  const { modal, bootstrapModal } = this.game.createModal({
    id: "selectFaceModal",
    title: "Selecione a posição da carta",
    bodyContent: bodyContent,
    onShow: (modal) => {
      dinamicContent(modal);

      const turnButtons = modal.querySelectorAll(".turn");
      turnButtons.forEach((button) => {
        button.addEventListener("click", () => {
          isFaceDown = !isFaceDown;
          dinamicContent(modal);
        });
      });

      const confirmButton = modal.querySelector("#confirmPosition");
      confirmButton.addEventListener("click", () => {
        this.summonSelected(isFaceDown);
        bootstrapModal.hide();
      });
    }
  });

  bootstrapModal.show();
}

  summonSelected(isFaceDown = false, isDefPosition = false) {
    if (!this.selectedCard) return;

    if (this.selectedSpaceField !== null) {
      this.game.turnSystem.currentPlayer.summonMonster(this.selectedCard, this.selectedSpaceField, isFaceDown, isDefPosition);
      this.game.log(`${this.game.turnSystem.currentPlayer.name} invocou ${this.selectedCard.name} (ATK: ${this.selectedCard.attack})`);
      this.selectedCard = null;
      this.game.turnSystem.nextPhase();
    } else {
      const emptySlot = this.game.turnSystem.currentPlayer.getEmptyFieldSlot();
      if (emptySlot !== -1) {
        this.game.turnSystem.currentPlayer.summonMonster(this.selectedCard, emptySlot, isFaceDown, isDefPosition);
        this.game.log(`${this.game.turnSystem.currentPlayer.name} invocou ${this.selectedCard.name} (ATK: ${this.selectedCard.attack})`);
        this.selectedCard = null;
        this.game.turnSystem.nextPhase();
      } else {
        showToast("Não há espaços vazios no campo", "Selecione uma carta do campo para fundir ou substituir!");
      }
    }
  }

  selectCard(card) {
    if (this.game.turnSystem.currentPlayer !== this.game.player) return;
    if (this.selectedCard === card) {
      this.selectFaceModal();
      return;
    }
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
      showToast("Selecione pelo menos 1 carta para fusão!", "Você precisa selecionar pelo menos uma carta para tentar fundir!", "warning");
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
      showToast("Nenhuma fusão foi possível!", "Tente selecionar outras cartas ou verificar se há cartas no campo!", "warning");
      this.fusionCards = [];
    }
  }

async runanimationFusion(fusionResult, card1, card2) {
  return new Promise((resolve) => {
    // cria uma div que ocupa toda a tela
    const bgAnimation = document.createElement("div");
    bgAnimation.className = "bg-game-modal";
    document.body.appendChild(bgAnimation);
    
    // Criar o modal
    const modal = document.createElement("div");
    modal.className = "game-modal d-flex justify-content-center align-items-center p-4";

    let card1Element, card2Element, resultElement;

    // Primeira carta
    setTimeout(() => {
      card1Element = this.game.createCardElement(card1.clone());
      card1Element.classList.add('fusion-card-left');
      modal.appendChild(card1Element);
    }, 800);

    // Símbolo de mais
    setTimeout(() => {
      const plusElement = document.createElement("div");
      plusElement.className = "text-center text-white font-weight-bold fs-1 fusion-plus";
      plusElement.innerHTML = `+`;
      modal.appendChild(plusElement);
    }, 1200);

    // Segunda carta
    setTimeout(() => {
      card2Element = this.game.createCardElement(card2.clone());
      card2Element.classList.add('fusion-card-right');
      modal.appendChild(card2Element);
    }, 1600);

    // Símbolo de igual
    setTimeout(() => {
      const equalsElement = document.createElement("div");
      equalsElement.className = "text-center text-white font-weight-bold fs-1 fusion-equals";
      equalsElement.innerHTML = `=`;
      modal.appendChild(equalsElement);
    }, 2000);

    // Resultado da fusão
    setTimeout(() => {
      if (fusionResult) {
        resultElement = this.game.createCardElement(fusionResult.clone());
        resultElement.classList.add('fusion-result-success');
        modal.appendChild(resultElement);
      } else {
        // Criar elemento para mostrar falha
        const failElement = document.createElement("div");
        failElement.className = "fusion-fail-placeholder";
        failElement.innerHTML = `
          <div class="fusion-fail-content">
            <div class="fusion-fail-icon">❌</div>
            <div class="fusion-fail-text">FALHA</div>
          </div>
        `;
        modal.appendChild(failElement);
      }
    }, 2400);

    document.body.appendChild(modal);
    setTimeout(() => {
      modal.remove();
      bgAnimation.remove();
      resolve();
    }, 4500);
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
        this.selectFaceModal();
      }
    } else {
      showToast("Selecione uma carta", "Você precisa selecionar uma carta para invocar ou fundir!", "warning");
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
