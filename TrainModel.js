const fs = require('fs'); // ca c est pour enregister le JSON (q Table)

class PongGame {
    constructor() {
        this.gameWidth = 800; 
        this.gameHeight = 600;
        this.resetGameState();

        // Paramètres Q-learning
        this.QTable = {}; // Table Q
        this.learningRate = 0.5; // le taux d'apprentissage, il sert a calculer la nouvelle valeur de la récompense
        this.discountFactor = 0.98; // le facteur de réduction, il sert a calculer la valeur future de la récompense
        this.epsilon = 0.2; // le taux d'exploration, il sert a déterminer si on explore ou on exploite
        this.actions = ["stay", "moveDown", "moveUp"];
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
        this.ballSpeedIncrease = 2;
    }

    resetBall(lastPointWinner) {
        this.ballX = this.gameWidth / 2;
        this.ballY = this.gameHeight / 2;
        this.ballSpeedX = lastPointWinner === 'A' ? -3 : 3;
        this.ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * 3;
    }

    update() { // c est la que tout se passe, mise a jour de la position de la balle, des raquettes, des scores, etc.
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
        this.updatePaddleA(); //joueur automatique pour paddleA
        
       //si la balle part vers la gauche, on fais rien

        this.updatePaddleB(); // IA pour paddleB

        // Vérifier les scores
        this.checkScore();

        // Vérifier si le jeu est terminé
        this.checkGameOver();
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
            if (this.ballSpeedX >= -4 && this.ballSpeedX <= 4)
            {

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
            if (this.ballSpeedX >= -4 && this.ballSpeedX <= 4)
            {

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
        this.paddleAY = Math.max(0, Math.min(this.gameHeight - this.paddleHeight, this.paddleAY)); 
        // ca va permettre de pas sortir de l ecran
    }

    updatePaddleB() {
        if (this.ballTouchedByPaddleA) {
            // Première décision : où se positionner
            let positionState = this.getCurrentPositionState();
            let positionAction = this.choosePositionAction(positionState);
            this.paddleBY = this.executePositionAction(this.paddleBY, positionAction);
    
            // Deuxième décision : comment frapper la balle
            // let hitState = this.getCurrentHitState();
            // let hitAction = this.chooseHitAction(hitState);
            // Gérer l'action de frappe (ajuster l'angle de rebond, etc.)
    
            let reward = this.calculateReward();
            let nextState = this.getCurrentState(); // Mise à jour après l'action de frappe
            this.updateQTable(positionState, positionAction, reward, nextState);
    
            this.ballTouchedByPaddleA = false;
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
    
    getCurrentState() { // fournit toutes les infos qui faut pour que l ia puisse prendre une decision ( la vitesse de la balle, la position de la raquette, etc.)
        let futureBallY = this.calculateFutureBallPosition(this.ballX, this.ballY, this.ballSpeedX, this.ballSpeedY);
        return `_paddleBY:${Math.round(this.paddleBY)}_futureBallY:${Math.round(futureBallY)}`;   
    }

    chooseAction(state) { // choisir l action a effectuer (monter, descendre, stay)
        if (!this.QTable[state]) { // Si l'état n'existe pas dans la table Q, l'ajouter (debut de la partie)
            this.QTable[state] = {};
            this.actions.forEach(a => this.QTable[state][a] = 0);
        }
        if (Math.random() < this.epsilon) { // Exploration (choisir une action au hasard grace a epsilon a 20% (1 chance sur 5 de choisir une action au hasard))
            console.log("random action");
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        } else { //Equation de Bellman (pour calculer la nouvelle valeur de la récompense, j ai rien compris mais ca marche)
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
    
    // getCurrentHitState() {
    //     let ballRelativePosition = this.ballY - this.paddleBY;
    //     if (ballRelativePosition < -this.paddleHeight / 3) {
    //         return "ballTop";
    //     } else if (ballRelativePosition > this.paddleHeight / 3) {
    //         return "ballBottom";
    //     } else {
    //         return "ballMiddle";
    //     }
    // }

    // chooseHitAction(hitState) {
    //     let hitActions = ["hitTop", "hitMiddle", "hitBottom"];
    
    //     // Vérifier si l'état existe dans la table Q et l'initialiser si nécessaire
    //     if (!this.QTable[hitState]) {
    //         this.QTable[hitState] = {};
    //         hitActions.forEach(action => {
    //             this.QTable[hitState][action] = 0; // Initialiser à 0
    //         });
    //     }
    
    //     // Décision basée sur l'exploration ou l'exploitation
    //     if (Math.random() < this.epsilon) {
    //         // Exploration: choisir une action de frappe au hasard
    //         return hitActions[Math.floor(Math.random() * hitActions.length)];
    //     } else {
    //         // Exploitation: choisir la meilleure action de frappe basée sur la table Q
    //         let maxQValue = Math.max(...Object.values(this.QTable[hitState]));
    //         let bestHitActions = hitActions.filter(action => this.QTable[hitState][action] === maxQValue);
    //         return bestHitActions[Math.floor(Math.random() * bestHitActions.length)];
    //     }
    // }
    
    updateQTable(state, action, reward, nextState) { // mettre a jour la table Q
        // va enregistrer la nouvelle valeur de la récompense dans la table Q, grace a l equation de Bellman 
        let oldQValue = this.QTable[state][action];
        let maxFutureQ = nextState in this.QTable ? Math.max(...Object.values(this.QTable[nextState])) : 0;
        let newQValue = oldQValue + this.learningRate * (reward + this.discountFactor * maxFutureQ - oldQValue);
        this.QTable[state][action] = newQValue;
    }

    calculateDistanceThreshold() { // calculer la distance entre la balle et la raquette , c est pour la récompense
        // (plus la balle est proche de la raquette, plus la récompense est grande), c est pour que l ia apprenne a se rapprocher de la balle
        // c'est un calcul pour s adapter a la taille de l ecran ( meme si la on peut que le mettre a 800x600)
        const screenFactor = 20;
        const speedFactor = 5;
        let threshold = this.gameHeight / screenFactor;
        threshold += Math.abs(this.ballSpeedY) / speedFactor;
        return threshold;
    }

    calculateReward() { // calculer la récompense
        const HIT_REWARD = 1;
        const MISS_PENALTY = -1;
        const PROXIMITY_REWARD = 0.5;
        const DISTANCE_PENALTY = -0.5;
        const DISTANCE_THRESHOLD = this.calculateDistanceThreshold(); // calculer la distance entre la balle et la raquette , c est pour la récompense

        let reward = 0;

        // Balle manquée par Paddle B
        if (this.ballX + this.ballSize >= this.gameWidth) {
            reward += MISS_PENALTY;
            console.log("Missed!");
            console.log("ballY: " + this.ballY + " paddleBY: " + this.paddleBY);
        }

        // Balle touchée par Paddle B
        if (this.ballX + this.ballSize >= this.paddleBX &&
            this.ballY + this.ballSize >= this.paddleBY &&
            this.ballY <= this.paddleBY + this.paddleHeight) {
            console.log("Hit!");
            reward += HIT_REWARD;
        }

        //Proximité de la balle
        let futureBallY = this.calculateFutureBallPosition(this.ballX, this.ballY, this.ballSpeedX, this.ballSpeedY);
        let paddleCenterY = this.paddleBY + this.paddleHeight / 2;
        let distanceToFutureBallY = Math.abs(futureBallY - paddleCenterY);
    
        // Récompense ou pénalité basée sur la proximité
        if (this.paddleBY <= futureBallY && futureBallY <= (this.paddleBY + this.paddleHeight)) {
            reward += PROXIMITY_REWARD;
        } else {
            reward += DISTANCE_PENALTY;
        }
        console.log("reward: " + reward);
    
        return reward;    
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

    saveQTableToFile(filename) { // sauvegarder la table Q dans un fichier JSON
        let dataToWrite = '';
        const qTableJson = JSON.stringify(this.QTable, null, 2);
    
        // Vérifier si le fichier existe
        if (fs.existsSync(filename)) {
            // Le fichier existe, lire le contenu actuel et l'ajouter
            const existingContent = fs.readFileSync(filename, 'utf8');
            const updatedContent = JSON.parse(existingContent);
            Object.assign(updatedContent, this.QTable); // Fusionner l'ancien contenu avec le nouveau
            dataToWrite = JSON.stringify(updatedContent, null, 2);
        } else {
            // Le fichier n'existe pas, préparez simplement les données actuelles de la table Q
            dataToWrite = qTableJson;
        }
    
        // Écrire ou mettre à jour le fichier
        fs.writeFileSync(filename, dataToWrite, 'utf8');
    }
    
    runSimulation(numGames) {
        const saveInterval = 100; // Sauvegarde toutes les 1000 simulations ( car si on sauvegarde tout d un coup ca plante (trop de donnees))
        const filename = 'tableQ.json'; // Nom du fichier de sauvegarde 
    
        for (let i = 0; i < numGames; i++) {
            this.resetGameState();
            while (!this.isGameOver) {
                this.update();
            }
            console.log(`Game ${i + 1}: Score A: ${this.scoreA}, Score B: ${this.scoreB}`);
    
            // Vérifiez si c'est le moment de sauvegarder la table Q
            if ((i + 1) % saveInterval === 0 || i === numGames - 1) {
                this.saveQTableToFile(filename); // Sauvegarder dans le même fichier
                this.epsilon *= 0.90; // Diminuer le taux d'exploration\
                console.log("epsilon: " + this.epsilon);
            }
        }
    }
    
}

// Exemple d'utilisation
let pongGame = new PongGame();
pongGame.runSimulation(3300); // Exécuter 50000 simulations (c est beaucoup)