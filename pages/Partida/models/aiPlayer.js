import { Player } from "./player.js";

// IA Básica
export class AIPlayer extends Player {
  constructor(name) {
    super(name, true);
  }

makeMove(game) {
    const mainPhase = game.turnSystem.currentPhase;
    const randomValue = Math.floor(Math.random() * 100) + 1;

    // Primeiro tenta fazer fusão (60% de chance se tiver cartas)
    if (randomValue > 40 && this.hand.length > 0) {
      const myFieldMonsters = this.getFieldMonsters();
      
      // Tenta fusão entre cartas da mão
      for (let i = 0; i < this.hand.length; i++) {
        for (let j = i + 1; j < this.hand.length; j++) {
          const card1 = this.hand[i];
          const card2 = this.hand[j];
          const fusionResultId = game.fusionSystem.canFuse([card1.id, card2.id], game.cardDatabase);

          if (fusionResultId) {
            mainPhase.fusionCards = [card1, card2];
            console.log(`IA faz fusão entre ${card1.name} e ${card2.name}`);
            mainPhase.attemptFusion();
            return;
          }
        }
      }
      
      // Tenta fusão entre carta da mão e carta do campo
      for (let handCard of this.hand) {
        for (let fieldCard of myFieldMonsters) {
          const fusionResultId = game.fusionSystem.canFuse([handCard.id, fieldCard.id], game.cardDatabase);
          
          if (fusionResultId) {
            // Encontra o índice do slot no campo
            const fieldSlotIndex = this.field.indexOf(fieldCard);
            if (fieldSlotIndex !== -1) {
              mainPhase.fusionCards = [handCard];
              mainPhase.selectedSpaceField = fieldSlotIndex;
              console.log(`IA faz fusão entre ${handCard.name} (mão) e ${fieldCard.name} (campo)`);
              mainPhase.attemptFusion();
              return;
            }
          }
        }
      }
    }

    // Se há cartas na mão para invocar
    if (this.hand.length > 0) {
      const enemyMonsters = game.getOpponentOf(this).getFieldMonsters();
      const myMonsters = this.getFieldMonsters();
      
      // Escolhe a carta mais adequada para a situação
      const bestCard = this.selectBestCardToSummon(enemyMonsters, myMonsters);
      
      if (bestCard) {
        // Verifica se há slot vazio no campo
        if (this.hasEmptyFieldSlot()) {
          // Campo tem espaço - invocação normal
          const summonStrategy = this.decideSummonStrategy(bestCard, enemyMonsters, myMonsters, false);
          
          mainPhase.selectedCard = bestCard;
          
          console.log(`IA invoca ${bestCard.name} - Face Down: ${summonStrategy.faceDown}, Def Position: ${summonStrategy.defPosition}`);
          mainPhase.summonSelected(summonStrategy.faceDown, summonStrategy.defPosition);
        } else {
          // Campo está cheio - verifica se vale a pena substituir
          const weakestMonster = this.findWeakestMonster(myMonsters);
          
          if (this.shouldReplaceMonster(bestCard, weakestMonster, enemyMonsters)) {
            // Substitui o monstro mais fraco
            console.log(`IA substitui ${weakestMonster.name} por ${bestCard.name}`);
            
            // Encontra o índice do slot no campo
            const monsterIndex = this.field.indexOf(weakestMonster);
            if (monsterIndex !== -1) {
              this.field[monsterIndex] = null;
            }
            
            // Invoca a nova carta (não pode ser face down em substituição)
            const summonStrategy = this.decideSummonStrategy(bestCard, enemyMonsters, myMonsters, true);
            mainPhase.selectedCard = bestCard;
            mainPhase.summonSelected(summonStrategy.faceDown, summonStrategy.defPosition);
          }
        }
      }
    }
  }

  // Novo método para encontrar o monstro mais fraco no campo
  findWeakestMonster(myMonsters) {
    if (myMonsters.length === 0) return null;
    
    return myMonsters.reduce((weakest, monster) => {
      // Prioriza monstros virados para baixo como mais fracos
      if (monster.isFaceDown && !weakest.isFaceDown) {
        return monster;
      }
      if (!monster.isFaceDown && weakest.isFaceDown) {
        return weakest;
      }
      
      // Se ambos estão na mesma posição (virado para cima/baixo), compara stats
      const monsterPower = monster.isFaceDown ? 0 : Math.max(monster.attack, monster.defense);
      const weakestPower = weakest.isFaceDown ? 0 : Math.max(weakest.attack, weakest.defense);
      
      return monsterPower < weakestPower ? monster : weakest;
    });
  }

  // Novo método para decidir se vale a pena substituir um monstro
  shouldReplaceMonster(newCard, weakestMonster, enemyMonsters) {
    if (!weakestMonster) return false;
    
    // Se o monstro mais fraco está virado para baixo, geralmente vale substituir
    if (weakestMonster.isFaceDown) {
      return newCard.attack > 1200 || newCard.defense > 1200;
    }
    
    // Compara o poder das cartas
    const newCardPower = Math.max(newCard.attack, newCard.defense);
    const weakestPower = Math.max(weakestMonster.attack, weakestMonster.defense);
    
    // Só substitui se a nova carta for significativamente melhor
    const powerDifference = newCardPower - weakestPower;
    
    // Se há inimigos fortes, precisa de uma diferença maior para justificar a substituição
    const strongestEnemy = enemyMonsters.length > 0 ? 
      Math.max(...enemyMonsters.filter(m => !m.isFaceDown).map(m => m.attack)) : 0;
    
    const requiredDifference = strongestEnemy > 2000 ? 500 : 300;
    
    return powerDifference >= requiredDifference;
  }

  selectBestCardToSummon(enemyMonsters, myMonsters) {
    if (this.hand.length === 0) return null;
    
    // Se o inimigo tem monstros muito fortes, prioriza defesa
    const strongestEnemy = enemyMonsters.length > 0 ? 
      Math.max(...enemyMonsters.map(m => m.attack)) : 0;
    
    // Se eu não tenho monstros e o inimigo tem monstros fortes, prioriza cartas defensivas
    if (myMonsters.length === 0 && strongestEnemy > 1500) {
      return this.hand.reduce((best, card) => 
        card.defense > (best?.defense || 0) ? card : best
      );
    }
    
    // Caso contrário, prioriza ataque
    return this.hand.reduce((strongest, card) => 
      card.attack > strongest.attack ? card : strongest
    );
  }

  decideSummonStrategy(card, enemyMonsters, myMonsters, isFromFusionOrSubstitution = false) {
    const strategy = {
      faceDown: false,
      defPosition: false
    };
    
    // Cartas de fusão ou substituição não podem ser postas com face para baixo
    if (isFromFusionOrSubstitution) {
      strategy.faceDown = false;
      strategy.defPosition = true; // Mas podem ser postas em defesa
      return strategy;
    }
    
    // Analisa situação do campo inimigo (apenas cartas viradas para cima)
    const visibleEnemyMonsters = enemyMonsters.filter(m => !m.isFaceDown);
    const enemyCount = visibleEnemyMonsters.length;
    const faceDownEnemyCount = enemyMonsters.filter(m => m.isFaceDown).length;
    
    const strongestEnemyAttack = enemyCount > 0 ? 
      Math.max(...visibleEnemyMonsters.map(m => m.attack)) : 0;
    const weakestEnemyAttack = enemyCount > 0 ? 
      Math.min(...visibleEnemyMonsters.map(m => m.attack)) : 0;
    
    // Meus monstros no campo
    const myCount = myMonsters.length;
    const myStrongestAttack = myCount > 0 ? 
      Math.max(...myMonsters.map(m => m.attack)) : 0;
    
    // Estratégias baseadas na situação
    
    // 1. Se há cartas viradas para baixo do inimigo, ser mais cauteloso
    if (faceDownEnemyCount > 0) {
      strategy.faceDown = true;
      strategy.defPosition = true;
      return strategy;
    }
    
    // 2. Se não vejo monstros inimigos ou são fracos, prioriza invocar virada para baixo (estratégia defensiva)
    if (enemyCount === 0 || strongestEnemyAttack < card.attack - 300) {
      strategy.faceDown = true;
      strategy.defPosition = true;
      return strategy;
    }
    
    // 3. Se o inimigo tem monstros muito mais fortes, invoca virado para baixo em defesa
    if (strongestEnemyAttack > card.attack + 500 && enemyCount > 0) {
      strategy.faceDown = true;
      strategy.defPosition = true;
      return strategy;
    }
    
    // 4. Se minha carta é fraca comparada ao inimigo mais fraco visível, invoca virada para baixo
    if (enemyCount > 0 && card.attack < weakestEnemyAttack - 200) {
      strategy.faceDown = true;
      strategy.defPosition = true;
      return strategy;
    }
    
    // 5. Se tenho poucos monstros e minha carta tem boa defesa, invoca virada para baixo
    if (myCount < 2 && card.defense >= 1500) {
      strategy.faceDown = true;
      strategy.defPosition = true;
      return strategy;
    }
    
    // 6. Se minha carta é significativamente mais forte que todos os monstros inimigos visíveis, pode invocar virada para cima
    if (enemyCount > 0 && card.attack >= strongestEnemyAttack + 300) {
      strategy.faceDown = false;
      strategy.defPosition = true; // Ainda em defesa, pois não pretende atacar neste turno
      return strategy;
    }
    
    // 7. Situação defensiva padrão - carta virada para baixo em defesa
    if (card.defense >= 1000) {
      strategy.faceDown = true;
      strategy.defPosition = true;
      return strategy;
    }
    
    // 8. Último recurso - carta fraca virada para baixo em defesa
    strategy.faceDown = true;
    strategy.defPosition = true;
    
    return strategy;
  }

async makeAttacks(game) {
    const battlePhase = game.turnSystem.currentPhase;
    const myMonsters = this.getFieldMonsters();

    for (let monster of myMonsters) {
      // Se a carta está virada para baixo, analisa se vale a pena virá-la para atacar
      if (monster.isFaceDown) {
        const shouldFlipToAttack = this.shouldFlipMonsterToAttack(monster, game);
        if (shouldFlipToAttack) {
          monster.isFaceDown = false;
          monster.isDefPosition = false;
          console.log(`IA vira ${monster.name} para modo de ataque (${monster.attack} ATK)`);
        }
      }
      
      // Se a carta não está virada para baixo mas está em defesa, analisa se deve mudar para ataque
      if (!monster.isFaceDown && monster.isDefPosition) {
        const shouldChangeToAttack = this.shouldChangeToAttackPosition(monster, game);
        if (shouldChangeToAttack) {
          monster.isDefPosition = false;
          console.log(`IA muda ${monster.name} para modo de ataque`);
        }
      }
      
      // Só pode atacar se não estiver em posição de defesa
      if (monster.isDefPosition) {
        continue;
      }

      // Pega apenas monstros visíveis do oponente (não virados para baixo)
      const allEnemyMonsters = game.getOpponentOf(this).getFieldMonsters();
      const visibleEnemyMonsters = allEnemyMonsters.filter(enemy => !enemy.isFaceDown);
      const faceDownEnemyMonsters = allEnemyMonsters.filter(enemy => enemy.isFaceDown);

      // Se não há monstros visíveis mas há cartas viradas para baixo
      if (faceDownEnemyMonsters.length > 0) {
        // Só ataca carta virada para baixo se o ataque for alto o suficiente (> 1450)
        if (monster.attack > 1450) {
          const targetFaceDown = faceDownEnemyMonsters[0];
          console.log(`IA ataca carta virada para baixo com ${monster.name} (${monster.attack} ATK)`);
          await battlePhase.battleMonsters(monster, targetFaceDown);
        }
        // Senão, não ataca e continua para o próximo monstro
        continue;
      }
      
      // Se não há monstros no campo inimigo, ataque direto
      if (allEnemyMonsters.length === 0) {
        console.log(`IA faz ataque direto com ${monster.name}`);
        await battlePhase.directAttack(monster, game.getOpponentOf(this)); // Adicionar await aqui
        continue;
      }

      // Analisa apenas monstros visíveis para decidir o melhor alvo
      if (visibleEnemyMonsters.length > 0) {
        let bestTarget = null;
        let bestOutcome = 'none';

        for (let enemy of visibleEnemyMonsters) {
          const outcome = this.analyzeAttackOutcome(monster, enemy);
          
          // Prioridade: kill > damage > safe > none
          if (outcome === 'kill' && bestOutcome !== 'kill') {
            bestTarget = enemy;
            bestOutcome = outcome;
          } else if (outcome === 'damage' && !['kill'].includes(bestOutcome)) {
            bestTarget = enemy;
            bestOutcome = outcome;
          } else if (outcome === 'safe' && !['kill', 'damage'].includes(bestOutcome)) {
            bestTarget = enemy;
            bestOutcome = outcome;
          }
        }

        // Só ataca se encontrou um alvo válido
        if (bestTarget && bestOutcome !== 'none') {
          console.log(`IA ataca ${bestTarget.name} com ${monster.name} - Resultado esperado: ${bestOutcome}`);
          await battlePhase.battleMonsters(monster, bestTarget);
        }
      }
      
      game.updateUI();
    }
    game.turnSystem.nextPhase();
  }

  // Novo método para decidir se deve virar uma carta para atacar
  shouldFlipMonsterToAttack(monster, game) {
    const allEnemyMonsters = game.getOpponentOf(this).getFieldMonsters();
    const visibleEnemyMonsters = allEnemyMonsters.filter(enemy => !enemy.isFaceDown);
    
    // Se não há inimigos visíveis, pode valer a pena virar para ataque direto
    if (allEnemyMonsters.length === 0) {
      return true;
    }
    
    // Se há apenas cartas viradas para baixo e meu ataque é alto, vale virar
    if (visibleEnemyMonsters.length === 0 && monster.attack > 1800) {
      return true;
    }
    
    // Analisa se consegue matar algum inimigo visível
    for (let enemy of visibleEnemyMonsters) {
      const outcome = this.analyzeAttackOutcome(monster, enemy);
      if (outcome === 'kill') {
        return true;
      }
    }
    
    return false;
  }

  // Novo método para decidir se deve mudar uma carta visível para ataque
  shouldChangeToAttackPosition(monster, game) {
    const allEnemyMonsters = game.getOpponentOf(this).getFieldMonsters();
    const visibleEnemyMonsters = allEnemyMonsters.filter(enemy => !enemy.isFaceDown);
    
    // Se não há inimigos, pode atacar diretamente
    if (allEnemyMonsters.length === 0) {
      return true;
    }
    
    // Analisa se consegue matar algum inimigo visível
    for (let enemy of visibleEnemyMonsters) {
      const outcome = this.analyzeAttackOutcome(monster, enemy);
      if (outcome === 'kill') {
        return true;
      }
    }
    
    return false;
  }

  // Método para analisar o resultado de um ataque
  analyzeAttackOutcome(attacker, defender) {
    if (defender.isDefPosition) {
      // Defesa: apenas verifica se consegue destruir sem levar dano
      if (attacker.attack > defender.defense) {
        return 'kill'; // Mata o defensor sem receber dano
      } else if (attacker.attack === defender.defense) {
        return 'safe'; // Empate, nenhum dano
      } else {
        return 'none'; // Tomaria dano reflexo, não vale a pena
      }
    } else {
      // Ataque: verifica se consegue destruir e causar dano aos LP do oponente
      if (attacker.attack > defender.attack) {
        return 'kill'; // Mata o defensor e causa dano aos LP
      } else if (attacker.attack === defender.attack) {
        return 'safe'; // Empate, ambos morrem mas sem dano aos LP
      } else {
        return 'none'; // Perderia o monstro e tomaria dano, não vale a pena
      }
    }
  }
}
