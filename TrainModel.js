

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
        this.hitActions = ["hitTop", "hitMiddle", "hitBottom"];
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
    
        // Ajouter une variation aléatoire, en veillant à ne pas sortir des limites
        let randomAdjustment = (Math.random() - 0.5) * 30; // variation aléatoire de +/- 5 pixels
        let newPaddleY = this.paddleAY + randomAdjustment;
        newPaddleY = Math.max(0, Math.min(this.gameHeight - this.paddleHeight, newPaddleY));

        // Appliquer le déplacement uniquement si cela ne force pas la raquette à sortir des limites
        if (newPaddleY !== this.paddleAY) {
            this.paddleAY = newPaddleY;
        }
    }

    updatePaddleB() {
        if (this.ballTouchedByPaddleA) {
            // Première décision : où se positionner
            this.paddleBY = this.executeAction(this.paddleBY);
    
            // Deuxième décision : comment frapper la balle
            let hitState = this.getCurrentHitState();
            let hitAction = this.chooseHitAction(hitState);
            this.paddleBY = this.executeHitAction(this.paddleBY, hitAction);
            //Gérer l'action de frappe (ajuster l'angle de rebond, etc.)
    
            let reward = this.calculateReward();
            let nextState = this.getCurrentState(); // Mise à jour après l'action de frappe
            this.updateQTable(hitState, hitAction, reward, nextState);
    
            this.ballTouchedByPaddleA = false;
            console.log("\n")
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

    calculateOptimalMove(futureBallY) {
        let distanceToFutureBallY = Math.abs(futureBallY - (this.paddleBY + this.paddleHeight / 2));

        
    
        return distanceToFutureBallY;
    }

    executeAction(paddleBY) {
        let futureBallY = this.calculateFutureBallPosition(this.ballX, this.ballY, this.ballSpeedX, this.ballSpeedY);
        console.log("1) la balle va aller en Y : " + futureBallY)
        console.log("2) la raquette est en Y : " + paddleBY)

        let optimalMove = this.calculateOptimalMove(futureBallY);
        console.log("3) elle doit donc se deplacer de  : " + optimalMove + " pixels")
        let paddleCenterY = paddleBY + this.paddleHeight / 2;
    
        if (futureBallY > paddleCenterY) {
            // La balle est trop basse, déplacer la raquette vers le bas
            paddleBY = Math.min(paddleBY + optimalMove, this.gameHeight - this.paddleHeight);
        }
        else {
            // La balle est trop haute, déplacer la raquette vers le haut
            paddleBY = Math.max(paddleBY - optimalMove, 0);
        }
        console.log("4)new paddleBY after action : " + paddleBY);
    
        // Assurez-vous que paddleBY est toujours dans les limites
        paddleBY = Math.max(0, Math.min(paddleBY, this.gameHeight - this.paddleHeight));
    
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
    
        console.log("5) je choisis de taper vers: " + hitAction);
        switch (hitAction) {
            case "hitTop":
                if (paddleBY > 0) {
                    adjustment = -this.paddleHeight / 5;
                }
                break;
            case "hitMiddle":
                // Pas de changement pour "hitMiddle"
                break;
            case "hitBottom":
                if (paddleBY < this.gameHeight - this.paddleHeight) {
                    adjustment = this.paddleHeight / 5;
                }
                break;
            default:
                break;
        }
    
        // Calculer la nouvelle position en tenant compte de l'ajustement
        console.log("6) pour etre sur voici ma position " + paddleBY);
        let newPaddleBY = paddleBY + adjustment;
    
        // Assurez-vous que la raquette reste dans les limites

        newPaddleBY = Math.max(0, Math.min(newPaddleBY, this.gameHeight - this.paddleHeight));
    
        console.log("7) nouvelle position apres ajustement : " + newPaddleBY);
        return newPaddleBY;
    }
    

    calculateBallLandingPositionAfterBounce() {
        let impactYOnB = this.calculateFutureBallPosition(this.ballX, this.ballY, this.ballSpeedX, this.ballSpeedY); // A to B
    
        // Calculer le point de contact et l'angle de rebond sur la raquette B
        let hitSpot = (impactYOnB - (this.paddleBY + this.paddleHeight / 2)) / (this.paddleHeight / 2);
        let angle = hitSpot * Math.PI / 4; // Angle entre -45 et 45 degrés
    
        // Vitesse de la balle après le rebond sur la raquette B
        let newBallSpeedX = -this.ballSpeedX; // La vitesse X est inversée après le rebond
        let newBallSpeedY = 5 * Math.sin(angle); // Nouvelle vitesse Y en fonction de l'angle
        if (Math.abs(this.ballSpeedX) < this.maxBallSpeed) {
            this.ballSpeedX *= this.ballSpeedIncrease;
            this.ballSpeedY *= this.ballSpeedIncrease;
        }
    
        // S'assurer que newBallSpeedX est négatif pour se diriger vers le mur gauche
        newBallSpeedX = Math.abs(newBallSpeedX) * -1;
    
        // Position initiale de la balle après le rebond
        let newBallX = this.paddleBX - this.ballSize; // Position X juste après le rebond
        let newBallY = impactYOnB;
    
        // Simuler le mouvement de la balle jusqu'à ce qu'elle atteigne le mur gauche
        while (newBallX > 0) {
            newBallX += newBallSpeedX;
            newBallY += newBallSpeedY;
    
            // Gérer les rebonds verticaux
            if (newBallY <= 0 || newBallY >= this.gameHeight - this.ballSize) {
                newBallSpeedY *= -1;
            }
    
            // Inverser la direction horizontale si la balle atteint le côté gauche
            if (newBallX <= 0) {
                newBallSpeedX *= -1;
            }
        }
    
        console.log("Position de la balle après rebond: X=" + newBallX + ", Y=" + newBallY);
        return newBallY; 
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


    calculateReward() {
        let reward = 0;
    
        // Proximité de la balle
        let futureBallY = this.calculateFutureBallPosition(this.ballX, this.ballY, this.ballSpeedX, this.ballSpeedY);
        let paddleCenterY = this.paddleBY + this.paddleHeight / 2;
        let distanceToFutureBallY = Math.abs(futureBallY - paddleCenterY);
        
        // Récompense ou pénalité basée sur la proximité
        if (distanceToFutureBallY < this.paddleHeight / 2) {
            // Calculer la position prévue de la balle après le rebond
            let predictedLandingPosition = this.calculateBallLandingPositionAfterBounce();
        
            // Position de la raquette A
            let paddleAPositionY = this.paddleAY + this.paddleHeight / 2;
        
            // Calculer la distance entre la position prévue de la balle et la raquette A
            let distanceToPaddleA = Math.abs(predictedLandingPosition - paddleAPositionY);
        
            // Récompense basée sur l'éloignement de la raquette A
            reward = -Math.log(1 + distanceToPaddleA / this.gameHeight);
        } else {
            reward = -1; // Pénalité si la balle est loin de la raquette B
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
pongGame.runSimulation(10000); // Exécuter 50000 simulations (c est beaucoup)