# Projet Pong Apprentissage par Renforcement (Q-Learning)

![Screenshot 2023-12-11 at 17 22 18](https://github.com/Felicien410/Pong-Q-learning/assets/97636902/013ca526-10ff-4454-a80e-b962c67f9003)

## I. Entraînement du Modèle

### I.1 Utiliser Modele predef

Decompressez le Table.json.gz 

```sh
gunzip -k nom_du_fichier.gz
```

passez directement a l'etape II

### I.2 Entrainez votre propre modele


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

Par défaut, cela hébergera vos fichiers sur `http://localhost:![Uploading Screenshot 2023-12-11 at 17.22.18.png…]()
8080` où vous pourrez accéder au jeu depuis votre navigateur web.

