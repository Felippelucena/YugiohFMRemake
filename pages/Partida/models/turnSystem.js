// turnSystem.js - Sistema de Turnos Refatorado
import { DrawPhase } from './turns/drawphase.js';
import { MainPhase } from './turns/mainPhase.js';
import { BattlePhase } from './turns/battlePhase.js';
import { EndPhase } from './turns/endPhase.js';


// Sistema de Turnos Refatorado
export class TurnSystem {
    constructor(game) {
        this.game = game;
        this.currentPlayer = null;
        this.turnCount = 1;
        
        // Criar instâncias das fases
        this.phases = {
            draw: new DrawPhase(game),
            main: new MainPhase(game),
            battle: new BattlePhase(game),
            end: new EndPhase(game)
        };
        
        this.currentPhase = this.phases.draw;
        this.phaseOrder = ["draw", "main", "battle"];
        this.currentPhaseIndex = 0;
    }

    executeCurrentPhase() {
        if (this.currentPhase) {
            this.currentPhase.execute();
        }
    }

    nextPhase() {
        // Executar onExit da fase atual
        if (this.currentPhase) {
            this.currentPhase.onExit();
        }

        // Avançar para próxima fase
        this.currentPhaseIndex++;

        // Ignorar fase de batalha no turno 1
        if (this.turnCount === 1 && this.phaseOrder[this.currentPhaseIndex] === "battle") {
            this.currentPhaseIndex++; // Pular fase de batalha
        }

        // Verificar se o índice excedeu o número de fases
        if (this.currentPhaseIndex >= this.phaseOrder.length) {
            // Fim do turno, ir para próximo jogador
            this.nextTurn();
            return;
        }

        // Definir nova fase atual
        const phaseName = this.phaseOrder[this.currentPhaseIndex];
        this.currentPhase = this.phases[phaseName];

        // Executar nova fase
        this.executeCurrentPhase();
    }

    nextTurn() {
        // Trocar jogador
        this.currentPlayer = this.currentPlayer === this.game.player ? this.game.opponent : this.game.player;
        this.turnCount++;
        this.currentPhaseIndex = 0;
        this.currentPhase = this.phases.draw;
        
        this.game.log(`--- Turno ${this.turnCount}: ${this.currentPlayer.name} ---`);
        
        // Executar fase de compra do novo turno
        this.executeCurrentPhase();
        
    }

    getCurrentPhase() {
        return this.currentPhase;
    }

    getPhaseDisplay() {
        return this.currentPhase ? this.currentPhase.displayName : "Preparação";
    }

    getCurrentPhaseName() {
        return this.currentPhase ? this.currentPhase.name : "draw";
    }
}