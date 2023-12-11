const fs = require('fs'); // ca c est pour enregister le JSON (q Table)

class PongGame {
    constructor() {
        this.gameWidth = 800; 
        this.gameHeight = 600;
        this.resetGameState();

        // Paramètres Q-learning
        this.QTable = {}; // Table Q
        this.learningRate = 0.50; // le taux d'apprentissage, il sert a calculer la nouvelle valeur de la récompense
        this.discountFactor = 0.98; // le facteur de réduction, il sert a calculer la valeur future de la récompense
        this.epsilon = 0.1; // le taux d'exploration, il sert a déterminer si on explore ou on exploite
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
            this.ballSpeedX *= -1;
            this.ballX = this.paddleAX + this.paddleWidth;
        }

        // Collision avec paddleB
        if (this.ballX >= this.paddleBX - this.ballSize &&
            this.ballY + this.ballSize >= this.paddleBY &&
            this.ballY <= this.paddleBY + this.paddleHeight) {
            this.ballSpeedX *= -1;
            this.ballX = this.paddleBX - this.ballSize;
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
        let currentState = this.getCurrentState(); // Etat actuel (vitesse de la balle, position de la raquette, etc.)
        let action = this.chooseAction(currentState); // Action à effectuer (monter, descendre, rester)
        this.paddleBY = this.executeAction(this.paddleBY, action); // Mise à jour de la position de la raquette

        // Mise à jour de la table Q
        let reward = this.calculateReward(); // Calcul de la récompense
        let nextState = this.getCurrentState(); // Etat suivant (vitesse de la balle, position de la raquette, etc.)
        this.updateQTable(currentState, action, reward, nextState); 
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
        let ballDirectionY = this.ballSpeedY > 0 ? "down" : "up";
        let distanceToBallY = Math.abs(this.paddleBY - this.ballY);
        return `ballX:${Math.round(this.ballX)}_ballDirectionY:${ballDirectionY}_distanceToBallY:${Math.round(distanceToBallY)}_paddleBY:${Math.round(this.paddleBY)}_futureBallY:${Math.round(futureBallY)}`;
        }

    chooseAction(state) { // choisir l action a effectuer (monter, descendre, stay)
        if (!this.QTable[state]) { // Si l'état n'existe pas dans la table Q, l'ajouter (debut de la partie)
            this.QTable[state] = {};
            this.actions.forEach(a => this.QTable[state][a] = 0);
        }
        if (Math.random() < this.epsilon) { // Exploration (choisir une action au hasard grace a epsilon a 20% (1 chance sur 5 de choisir une action au hasard))
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        } else { //Equation de Bellman (pour calculer la nouvelle valeur de la récompense, j ai rien compris mais ca marche)
            let maxQValue = Math.max(...Object.values(this.QTable[state]));
            let bestActions = this.actions.filter(a => this.QTable[state][a] === maxQValue);
            return bestActions[Math.floor(Math.random() * bestActions.length)];
        }
    }

    executeAction(paddleBY, action) { // mettre a jour la position de la raquette
        if (action === "moveUp") {
            paddleBY = Math.max(paddleBY - this.paddleSpeed, 0);
        } else if (action === "moveDown") {
            paddleBY = Math.min(paddleBY + this.paddleSpeed, this.gameHeight - this.paddleHeight);
        }
        return paddleBY;
    }

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
        if (distanceToFutureBallY < DISTANCE_THRESHOLD) {
            reward += PROXIMITY_REWARD;
        } else {
            reward += DISTANCE_PENALTY;
        }
    
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
        const saveInterval = 1000; // Sauvegarde toutes les 1000 simulations ( car si on sauvegarde tout d un coup ca plante (trop de donnees))
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
            }
        }
    }
    
}

// Exemple d'utilisation
let pongGame = new PongGame();
pongGame.runSimulation(50000); // Exécuter 50000 simulations (c est beaucoup)