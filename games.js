class PongGame {
    constructor() {
        this.gameWidth = 800;
        this.gameHeight = 600;
        this.resetGameState();

        this.actions = ["stay", "moveDown", "moveUp"];
        this.hitActions = ["hitTop", "hitMiddle", "hitBottom"];

        this.paddleAElement = document.getElementById('paddleA');
        this.paddleBElement = document.getElementById('paddleB');
        this.ballElement = document.getElementById('ball');
        this.scoreAElement = document.getElementById('scoreA');
        this.scoreBElement = document.getElementById('scoreB');
    }

    resetGameState() {
        this.ballX = this.gameWidth / 2;
        this.ballY = this.gameHeight / 2;
        this.ballSpeedX = 3;
        this.ballSpeedY = 3;
        this.paddleAX = 10; // Position X de la raquette A
        this.paddleAY = this.gameHeight / 2;
        this.paddleBX = this.gameWidth - 30; // Position X de la raquette B
        this.paddleBY = this.gameHeight / 2;
        this.scoreA = 0;
        this.scoreB = 0;
        this.paddleHeight = 50; // Hauteur des raquettes
        this.paddleWidth = 10; // Largeur des raquettes
        this.paddleSpeed = 5;
        this.ballSize = 10;
        this.maxScore = 5;
        this.isGameOver = false;
        this.ballTouchedByPaddleA = false;
        this.ballSpeedIncrease = 1.1;
        this.maxBallSpeed = 6;
    }

    resetBall(lastPointWinner) {
        this.ballX = this.gameWidth / 2;
        this.ballY = this.gameHeight / 2;
        this.ballSpeedX = lastPointWinner === 'A' ? -3 : 3;
        this.ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * 3;
    }


    update() {
        if (this.isGameOver) return;

        // Mise à jour de la position de la balle
        this.ballX += this.ballSpeedX;
        this.ballY += this.ballSpeedY;

        // Gestion des rebonds verticaux de la balle
        if (this.ballY <= 0 || this.ballY >= this.gameHeight - this.ballSize) {
            this.ballSpeedY *= -1;
        }

        // Collision avec les raquettes
        this.checkPaddleCollision();

        // Mise à jour des raquettes
        this.updatePaddleA(); // IA ou joueur automatique pour paddleA
        this.updatePaddleB(); // IA pour paddleB
        
        // Vérifier les scores
        this.checkScore();

        // Vérifier si le jeu est terminé
        this.checkGameOver();
        
        // Mise à jour graphique
        this.paddleAElement.style.top = `${this.paddleAY}px`;
        this.paddleBElement.style.top = `${this.paddleBY}px`;
        this.ballElement.style.left = `${this.ballX}px`;
        this.ballElement.style.top = `${this.ballY}px`;
        this.scoreAElement.textContent = this.scoreA;
        this.scoreBElement.textContent = this.scoreB;
    }


    checkPaddleCollision() {
        // Collision avec paddleA
        if (this.ballX <= this.paddleAX + this.paddleWidth &&
            this.ballY + this.ballSize >= this.paddleAY &&
            this.ballY <= this.paddleAY + this.paddleHeight) {
            // Calculez le point de contact normalisé (-1 en haut de la raquette, 1 en bas)
            let hitSpot = (this.ballY - (this.paddleAY + this.paddleHeight / 2)) / (this.paddleHeight / 2);

            // Calculez l'angle de rebond en fonction du point de contact
            let angle = hitSpot * Math.PI / 4; // Cela vous donne un angle entre -45 et 45 degrés
    
            // Mettez à jour la vitesse de la balle
            this.ballSpeedX *= -1;
            this.ballSpeedY = 5 * Math.sin(angle);
            this.ballTouchedByPaddleA = true;
            if (Math.abs(this.ballSpeedX) < this.maxBallSpeed) {
                this.ballSpeedX *= this.ballSpeedIncrease;
                this.ballSpeedY *= this.ballSpeedIncrease;
            }
            console.log("Hit by paddle A");

        }

        // Collision avec paddleB
        if (this.ballX >= this.paddleBX - this.ballSize &&
            this.ballY + this.ballSize >= this.paddleBY &&
            this.ballY <= this.paddleBY + this.paddleHeight) {
            let hitSpot = (this.ballY - (this.paddleBY + this.paddleHeight / 2)) / (this.paddleHeight / 2);
            let angle = hitSpot * Math.PI / 4; // Cela vous donne un angle entre -45 et 45 degrés
    
            // Mettez à jour la vitesse de la balle
            this.ballSpeedX *= -1;
            this.ballSpeedY = 5 * Math.sin(angle);
            if (Math.abs(this.ballSpeedX) < this.maxBallSpeed) {
                this.ballSpeedX *= this.ballSpeedIncrease;
                this.ballSpeedY *= this.ballSpeedIncrease;
            }
        }
    }


updatePaddleA() {
    // Stratégie simple pour paddleA (juste suivre la balle)
    if (this.ballY > this.paddleAY + this.paddleHeight / 2) {
        this.paddleAY += this.paddleSpeed;
    } else if (this.ballY < this.paddleAY + this.paddleHeight / 2) {
        this.paddleAY -= this.paddleSpeed;
    }

    // Ajouter une variation aléatoire
    let randomAdjustment = (Math.random() - 0.5) * 10; // variation aléatoire de +/- 5 pixels
    this.paddleAY += randomAdjustment;

    // Assurer que la raquette reste dans les limites du jeu
    this.paddleAY = Math.max(0, Math.min(this.gameHeight - this.paddleHeight, this.paddleAY));
}

    updatePaddleB() {
        if (this.ballTouchedByPaddleA) {
            let currentState = this.getCurrentState();
            let action = this.chooseAction(currentState);
            this.paddleBY = this.executeAction(this.paddleBY, action);

            // Deuxième décision : comment frapper la balle
            let hitState = this.getCurrentHitState();
            let hitAction = this.chooseHitAction(hitState);
            this.paddleBY = this.executeHitAction(this.paddleBY, hitAction);
            this.ballTouchedByPaddleA = false;  // Réinitialiser après avoir réagi
        }
    }

    calculateFutureBallPosition(currentBallX, currentBallY, speedX, speedY) {
        // pour predire excactement la ou la balle va aller (en Y)
        let futureBallX = currentBallX;
        let futureBallY = currentBallY;
        let futureSpeedX = speedX;
        let futureSpeedY = speedY;
    
        while (futureBallX + this.ballSize < this.gameWidth) {
            futureBallX += futureSpeedX;
            futureBallY += futureSpeedY;
    
            // Gérer les rebonds verticaux
            if (futureBallY <= 0 || futureBallY >= this.gameHeight - this.ballSize) {
                futureSpeedY = -futureSpeedY;
            }
    
            // Si la balle atteint le côté gauche, inverser la direction horizontale
            if (futureBallX <= 0) {
                futureSpeedX = -futureSpeedX;
            }
        }
    
        return futureBallY;
    }
    
    getCurrentState() {
        let futureBallY = this.calculateFutureBallPosition(this.ballX, this.ballY, this.ballSpeedX, this.ballSpeedY);
        console.log("future ball Y", futureBallY, "balle Y", this.ballY)
        return `_paddleBY:${Math.round(this.paddleBY)}_futureBallY:${Math.round(futureBallY)}`;
        }

    chooseAction(state) {
        if (!this.QTable[state]) {
            this.QTable[state] = {};
            this.actions.forEach(a => this.QTable[state][a] = 0);
        }
        if (Math.random() < this.epsilon) {
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        } else {
            let maxQValue = Math.max(...Object.values(this.QTable[state]));
            let bestActions = this.actions.filter(a => this.QTable[state][a] === maxQValue);
            return bestActions[Math.floor(Math.random() * bestActions.length)];
        }
    }

    calculateOptimalMove() {
        // Cette méthode doit calculer la distance optimale que la raquette doit parcourir
        // pour atteindre la position prévue de la balle. Cela pourrait être basé sur la vitesse de la balle,
        // la direction, et la distance actuelle entre la raquette et la position future prévue de la balle.
    
        // Exemple de calcul simplifié (à affiner selon vos besoins) :
        let futureBallY = this.calculateFutureBallPosition(this.ballX, this.ballY, this.ballSpeedX, this.ballSpeedY);
        let distanceToFutureBallY = Math.abs(futureBallY - (this.paddleBY + this.paddleHeight / 2));
    
        return distanceToFutureBallY;
    }

    executeAction(paddleBY, action) {
        let optimalMove = this.calculateOptimalMove();
    
        if (action === "moveDown") {
            paddleBY = Math.min(paddleBY + optimalMove, this.gameHeight - this.paddleHeight);
        }
        if (action === "moveUp") {
            paddleBY = Math.max(paddleBY - optimalMove, 0);
        }
        console.log("future ballY: " + this.calculateFutureBallPosition(this.ballX, this.ballY, this.ballSpeedX, this.ballSpeedY))
        console.log("new paddleBY: " + paddleBY)
        return paddleBY;
    }


    getCurrentHitState() {
        let futureBallY = this.calculateFutureBallPosition(this.ballX, this.ballY, this.ballSpeedX, this.ballSpeedY);
        let paddleCenterY = this.paddleBY + this.paddleHeight / 2;
        let ballRelativePosition = futureBallY - paddleCenterY;
    
        if (ballRelativePosition < -this.paddleHeight / 3) {
            return "ballTop";
        } else if (ballRelativePosition > this.paddleHeight / 3) {
            return "ballBottom";
        } else {
            return "ballMiddle";
        }
    }

    chooseHitAction(hitState) {
        // Vérifier si l'état existe dans la table Q et l'initialiser si nécessaire
        if (!this.QTable[hitState]) {
            this.QTable[hitState] = {};
            this.hitActions.forEach(a => this.QTable[hitState][a] = 0);
        }

        // Choisir une action en fonction de la table Q
        if (Math.random() < this.epsilon) {
            return this.hitActions[Math.floor(Math.random() * this.hitActions.length)];
        } else {
            let maxQValue = Math.max(...Object.values(this.QTable[hitState]));
            let bestActions = this.hitActions.filter(a => this.QTable[hitState][a] === maxQValue);
            return bestActions[Math.floor(Math.random() * bestActions.length)];
        }
    }
    
    executeHitAction(paddleBY, hitAction) {
        let adjustment = 0;
        
        console.log("hitAction: " + hitAction);
        switch (hitAction) {
            case "hitTop":
                // Déplacer la raquette vers le haut pour frapper avec le haut de la raquette
                // Si la raquette est déjà en haut, ne pas monter plus haut
                if (paddleBY > 50) {
                    adjustment = -this.paddleHeight / 5;
                }
                break;
            case "hitMiddle":
                // Pas besoin de déplacer la raquette pour un coup au milieu
                adjustment = 0;
                break;
            case "hitBottom":
                // Déplacer la raquette vers le bas pour frapper avec le bas de la raquette
                // Si la raquette est déjà en bas, ne pas descendre plus bas
                if (paddleBY < this.gameHeight - this.paddleHeight) {
                    adjustment = this.paddleHeight / 5;
                }
                break;
            default:
                // En cas d'action inconnue, ne pas déplacer la raquette
                adjustment = 0;
                break;
        }
    
        if (paddleBY + adjustment < 0 || paddleBY + adjustment > this.gameHeight ) {
            return paddleBY;
        }
        // Appliquer l'ajustement tout en veillant à ce que la raquette reste dans les limites du jeu
        paddleBY = paddleBY + adjustment;
        console.log("new paddleBY after action top or bottom : " + paddleBY);
        return paddleBY;
    }

    checkScore() {
        if (this.ballX <= 0) {
            this.scoreB++;
            this.resetBall('B');
        } else if (this.ballX >= this.gameWidth - this.ballSize) {
            this.scoreA++;
            this.resetBall('A');
        }
    }

    checkGameOver() {
        if (this.scoreA >= this.maxScore || this.scoreB >= this.maxScore) {
            this.isGameOver = true;
            console.log(`Game Over. Winner: ${this.scoreA > this.scoreB ? 'Player A' : 'Player B'}`);
        }
    }

    async loadQTable() {
        try {
            const response = await fetch('tableQ.json');
            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }
            this.QTable = await response.json();
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }

    startGame() {
        this.loadQTable().then(() => {
            this.run();
        });
    }

    run() {
        setInterval(() => {
            if (!this.isGameOver) {
                this.update();
                //this.render();
            }
        }, 1000 / 60);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const pongGame = new PongGame();
    pongGame.startGame();
});