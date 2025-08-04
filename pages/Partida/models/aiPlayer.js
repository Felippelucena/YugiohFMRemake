import {Player} from './player.js'

// IA Básica
export class AIPlayer extends Player {
    constructor(name) {
        super(name, true);
    }
    
makeMove(game) {
    const mainPhase = game.turnSystem.currentPhase;
    const randomValue = Math.floor(Math.random() * 100) + 1;

    if (randomValue > 101 && this.hand.length > 1) {
        for (let i = 0; i < this.hand.length; i++) {
            for (let j = i + 1; j < this.hand.length; j++) {
                const card1 = this.hand[i];
                const card2 = this.hand[j];
                const fusionResultId = game.fusionSystem.canFuse([card1.id, card2.id], game.cardDatabase);

                if (fusionResultId) {
                    mainPhase.fusionCards = [card1, card2];
                    console.log(card1)
                    console.log(card2)
                    mainPhase.attemptFusion();
                    return; 
                }
            }
        }
    }

    // Caso não realize fusão, invoca o monstro mais forte disponível
    if (this.hand.length > 0 && this.hasEmptyFieldSlot()) {
        const strongestCard = this.hand.reduce((strongest, card) =>
            card.attack > strongest.attack ? card : strongest
        );

        mainPhase.selectedCard = strongestCard;
        mainPhase.summonSelected();
    }
}
    
   async makeAttacks(game) {
        const battlePhase = game.turnSystem.currentPhase;
        const myMonsters = this.getFieldMonsters();
        
        for (let monster of myMonsters) {
            const enemyMonsters = game.getOpponentOf(this).getFieldMonsters();
            if (enemyMonsters.length === 0) {
                // Ataque direto
               battlePhase.directAttack(monster, game.getOpponentOf(this));
            } else {
                // Ataca o monstro mais fraco do oponente
                const weakestEnemy = enemyMonsters.reduce((weakest, enemy) => 
                    enemy.attack < weakest.attack ? enemy : weakest
                );
                if (monster.attack >= weakestEnemy.attack) {
                   await battlePhase.battleMonsters(monster, weakestEnemy);
                }
            }
            game.updateUI();
        }
        game.turnSystem.nextPhase();
    }
}