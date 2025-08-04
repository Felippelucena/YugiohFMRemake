// Classe base para cartas
export class Card {
  constructor(id, name, type, attack, defense, attribute, monsterType, card_images) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.attack = attack;
    this.defense = defense;
    this.attribute = attribute;
    this.monsterType = monsterType;
    this.card_images = card_images;
    this.position = "hand"; // hand, field, fusion
    this.owner = null;
  }

  clone() {
    return new Card(this.id, this.name, this.type, this.attack, this.defense, this.attribute, this.monsterType, this.card_images);
  }
}

// Sistema de Cartas - Banco de dados local
export class CardDatabase {
  constructor() {
    this.cards = [];
    this.isLoaded = false;
  }

  async initializeCards() {
    try {
      // Carrega o arquivo JSON com as cartas
      const response = await fetch('/wp-content/plugins/YugiohFMRemake/db/full_cards_yfm.json');
      const data = await response.json();
      
      // Filtra apenas cartas de monstros (que possuem GuardianStar1, GuardianStar2 e Attribute preenchidos)
      const monsterCards = data.filter(cardData => {
        return cardData.GuardianStar1 && 
               cardData.GuardianStar2 && 
               cardData.Attribute && 
               cardData.GuardianStar1.trim() !== '' && 
               cardData.GuardianStar2.trim() !== '' && 
               cardData.Attribute.trim() !== '';
      });

      // Converte os dados JSON para instâncias da classe Card
      this.cards = monsterCards.map(cardData => {
        return new Card(
          cardData.CardId,
          cardData.CardName,
          cardData.Type,
          cardData.Attack,
          cardData.Defense,
          cardData.Attribute,
          cardData.Type,
          cardData.card_images || []
        );
      });

      this.isLoaded = true;
      console.log(`${this.cards.length} cartas de monstros carregadas.`);
    } catch (error) {
      console.error('Erro ao carregar as cartas:', error);
      this.cards = [];
    }
  }

  getCard(id) {
    return this.cards.find((card) => card.id === id);
  }

  getAllCards() {
    return this.cards;
  }
}
