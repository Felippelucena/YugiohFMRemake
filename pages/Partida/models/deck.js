// Sistema de Deck
export class Deck {
    constructor(cardDatabase, isOpponent = false) {
        this.cards = [];
        this.cardDatabase = cardDatabase;
        this.buildDeck(isOpponent);
        this.shuffle();
    }
    
    buildDeck(isOpponent) {
        // Deck básico com repetições permitidas
        const basicCards = isOpponent ? 
            [[44,3], [52,3], [113,3], [55,3], [63,3], [12,3], [1,3], [2,3], [3,3], [10,3], [11,2], [12,2], [13,2], [14,2], [15,2]] :
            [[356,3], [52,3], [113,3], [55,3], [63,3], [12,3], [1,3], [2,3], [3,3], [10,3], [11,2], [12,2], [13,2], [14,2], [15,2]];
        let cont_id = 0;
        for (let i = 0; i < basicCards.length; i++) {
            const [cardId, quantity] = basicCards[i];
            for (let j = 0; j < quantity; j++) {
                const originalCard = this.cardDatabase.getCard(cardId);

                this.cards.push(originalCard.clone());
                this.cards[cont_id].uniqueIdDeck = cont_id;
                cont_id++;
            }
        }
    }
    
    
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }
    
    draw() {
        return this.cards.pop();
    }
    
    isEmpty() {
        return this.cards.length === 0;
    }
    
    size() {
        return this.cards.length;
    }
}