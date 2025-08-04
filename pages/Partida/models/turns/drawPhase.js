import { TurnTemplate } from "./turnTemplate.js";
// Fase de Compra
export class DrawPhase extends TurnTemplate {
    constructor(game) {
        super(game);
        this.name = "draw";
        this.displayName = "Compra";
    }

    onEnter() {
        
        // Executar compra automaticamente
        if (this.game.turnSystem.currentPlayer === this.game.player) {
            // comprar cartas até jogador ter 5 cartas na mão
            while (this.game.player.hand.length < 5) {
            const card = this.game.player.drawCard();
            if (card) {
                this.game.log(`Você comprou: ${card.name}`);
            } else {
                this.game.endGame(this.game.opponent);
                return;
            }
            }
        } else {
            while (this.game.opponent.hand.length < 5) {
            const card = this.game.opponent.drawCard();
            if (card) {
                this.game.log(`Oponente comprou uma carta`);
            } else {
                this.game.endGame(this.game.player);
                return;
            }
            }
        }

        // Avançar automaticamente após compra
        setTimeout(() => {
            this.game.turnSystem.nextPhase();
        }, 1000);
    }

    setupBehaviors() {
        // Nenhum comportamento especial durante a compra
    }

    setupButtons() {
    }
}