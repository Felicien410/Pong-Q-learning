# Projet Pong Apprentissage par Renforcement (Q-Learning)

## I. Entraînement du Modèle

Si vous désirez entraîner le modèle vous-même, une table Q pré-entraînée (`tableQ.json`), issue de 50 000 parties, est déjà fournie dans le dépôt.

Pour démarrer le processus d'entraînement, exécutez la commande suivante dans votre terminal :

```sh
node --max-old-space-size=4096 TrainModel.js
```

Cette commande augmente la mémoire disponible pour Node.js afin de gérer la grande table Q durant l'entraînement.

## II. Lancement du Jeu en Local avec la Table Q

Pour lancer le jeu en utilisant la table Q existante, vous devez démarrer un serveur local. Vous pouvez le faire en exécutant `games.js` avec la commande `http-server`. Si `http-server` n'est pas installé sur votre machine, vous pouvez l'installer globalement via npm avec la commande suivante :

```sh
npm install -g http-server
```

Une fois `http-server` installé, naviguez jusqu'au répertoire de votre projet dans le terminal et démarrez le serveur :

```sh
http-server
```

Par défaut, cela hébergera vos fichiers sur `http://localhost:8080` où vous pourrez accéder au jeu depuis votre navigateur web.
