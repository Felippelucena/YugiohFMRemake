export class FusionSystem {
    constructor() {
        this.fusionData = null;
        this.loadingFusions();
    }

    async loadingFusions() {
        try {
            const response = await fetch('/wp-content/plugins/YugiohFMRemake/db/FUSIONS.json');
            this.fusionData = await response.json();
        } catch (error) {
            console.error('Erro ao carregar dados de fusão:', error);
            this.fusionData = [];
        }
    }

    canFuse(cardIds, cardDatabase) {
        if (cardIds.length !== 2 || !this.fusionData) return null;

        const [cardId1, cardId2] = cardIds;

        // Verificar fusão com a primeira carta como base
        if (this.fusionData[cardId1]) {
            const fusion = this.fusionData[cardId1].find(fusion => fusion.card === cardId2);
            if (fusion) return fusion.result;
        }

        // Verificar fusão com a segunda carta como base
        if (this.fusionData[cardId2]) {
            const fusion = this.fusionData[cardId2].find(fusion => fusion.card === cardId1);
            if (fusion) return fusion.result;
        }

        return null;
    }

    // Método para verificar se os dados de fusão foram carregados
    isLoaded() {
        return this.fusionData !== null;
    }

    // Método para aguardar o carregamento dos dados
    async waitForLoad() {
        while (!this.isLoaded()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}