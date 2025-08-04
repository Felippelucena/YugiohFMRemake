import { TurnTemplate } from "./turnTemplate.js";

// Fase Final
export class EndPhase extends TurnTemplate {
    constructor(game) {
        super(game);
        this.name = "end";
        this.displayName = "Final";
    }

    onEnter() {
        this.game.log(`O jogo Acabou, veja o resultado!`);
    }

    setupBehaviors() {
        // Nenhum comportamento especial na fase final
    }

    setupButtons() {
        // Novo Jogo
        this.createButton("new-game-btn", "Novo Jogo", "btn-game", () => {
            this.game.pageTemplate.restartGame();
        });
    }
}