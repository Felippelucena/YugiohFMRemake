// Sistema de Fusão
export class FusionSystem {
    constructor() {
        this.fusionRecipes = [
            { materials: [1, 6], result: 21 }, // Dragão Azul + Dragão Vermelho = Dragão Flamejante
            { materials: [2, 7], result: 22 }, // Mago Negro + Bruxa Negra = Mago Supremo
            { materials: [5, 9], result: 23 }, // Soldado da Pedra + Mammoth = Gigante de Pedra
            { materials: [1, 16], result: 24 }, // Dragão Azul + Dragão Prata = Dragão Temporal
            { materials: [8, 13], result: 25 }, // Guerreiro Celta + La Jinn = Guerreiro Sombrio
            { materials: [3, 18], result: 26 }, // Fissura + Orc de Batalha = Besta Feroz
            { materials: [1, 4], result: 27 }, // Dragão Azul + Elfo Místico = Dragão Místico
            { materials: [2, 14], result: 28 }, // Mago Negro + Ryu-Kishin = Feiticeiro Negro
            { materials: [5, 17], result: 29 }, // Soldado da Pedra + Ansatsu = Titã de Ferro
            { materials: [21, 24], result: 30 }, // Dragão Flamejante + Dragão Temporal = Imperador Dragão
            
        ];

        this.attributeCombinations = [
            { attributes: ["Light", "Light"], result: 27 }, // Dois monstros Light = Dragão Místico
            { attributes: ["Dark", "Dark"], result: 28 } // Dois monstros Dark = Feiticeiro Negro
        ];

        this.monsterTypeCombinations = [
            { monsterType: "Dragon", minAttack: 1400, result: 30 }, // Dois Dragões fortes = Imperador Dragão
            { monsterType: "Warrior", minAttack: 1400, result: 25 } // Dois Guerreiros fortes = Guerreiro Sombrio
        ];
    }

    canFuse(cardIds, cardDatabase) {
        if (cardIds.length !== 2) return null;

        const [card1, card2] = cardIds.map(id => cardDatabase.getCard(id));
        if (!card1 || !card2) return null;

        // Verificar fusões baseadas em IDs
        const idRecipe = this.fusionRecipes.find(recipe => {
            const sorted1 = [...recipe.materials].sort();
            const sorted2 = [...cardIds].sort();
            return sorted1[0] === sorted2[0] && sorted1[1] === sorted2[1];
        });
        if (idRecipe) return idRecipe.result;

        // Verificar fusões baseadas em atributos
        const attributeRecipe = this.attributeCombinations.find(rule => {
            return (
                (card1.attribute === rule.attributes[0] && card2.attribute === rule.attributes[1]) ||
                (card1.attribute === rule.attributes[1] && card2.attribute === rule.attributes[0])
            );
        });
        if (attributeRecipe) return attributeRecipe.result;

        // Verificar fusões baseadas em tipos de monstro
        const monsterTypeRecipe = this.monsterTypeCombinations.find(rule => {
            return (
                card1.monsterType === rule.monsterType &&
                card2.monsterType === rule.monsterType &&
                card1.attack >= rule.minAttack &&
                card2.attack >= rule.minAttack
            );
        });
        if (monsterTypeRecipe) return monsterTypeRecipe.result;

        return null;
    }
}