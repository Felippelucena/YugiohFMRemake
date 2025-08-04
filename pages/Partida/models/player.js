// Jogador
export class Player {
    constructor(name, isAI = false) {
        this.name = name;
        this.lifePoints = 8000;
        this.hand = [];
        this.field = [null, null, null, null, null];
        this.isAI = isAI;
        this.deck = null;
    }
    
    drawCard() {
        if (this.deck && !this.deck.isEmpty()) {
            const card = this.deck.draw();
            if (card) {
                card.owner = this;
                this.hand.push(card);
                return card;
            }
        }
        return null;
    }
    
    summonMonster(card, slotIndex) {
        if (slotIndex >= 0 && slotIndex < 5) {
            this.field[slotIndex] = card;
            card.position = 'field';
            const handIndex = this.hand.indexOf(card);
            if (handIndex > -1) {
                this.hand.splice(handIndex, 1);
            }
            return true;
        }
        return false;
    }
    
    takeDamage(damage) {
        this.lifePoints = Math.max(0, this.lifePoints - damage);
    }
    
    getFieldMonsters() {
        return this.field.filter(card => card !== null);
    }
    
    hasEmptyFieldSlot() {
        return this.field.some(slot => slot === null);
    }
    
    getEmptyFieldSlot() {
        return this.field.findIndex(slot => slot === null);
    }
}