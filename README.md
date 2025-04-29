Lancer Notre Jeu Snake Multijoueur avec Docker – Guide Simple
Étape 1 : On construit l’image Docker

Pour commencer, on doit créer une image Docker de notre jeu. C’est une version empaquetée avec tout ce qu’il faut.

On lance cette commande dans le terminal :

docker build -t snake-multi .

Ce qu’elle fait :
Elle demande à Docker de Lancer Notre Jeu Snake Multijoueur avec Docker – Guide Simple
Étape 1 : On construit l’image Docker

On lance cette commande dans le terminal :

docker build -t snake-multi .

Ce qu’elle fait :
Elle demande à Docker de créer une image à partir du dossier actuel (grâce au .) et de l’appeler snake-multi. C’est cette image qu’on utilisera ensuite pour lancer le jeu.

Pendant cette étape, Docker installe tout ce dont le jeu a besoin pour tourner, et copie tous nos fichiers dedans (comme server.js, package.json, etc.).
Étape 2 : On lance le jeu dans un conteneur

Une fois que l’image est prête, on peut démarrer une instance de notre jeu avec :

docker run -d -p 8023:8023 snake-multi


Étape 3 : On accède à notre jeu

Maintenant que le conteneur est lancé, il suffit d’ouvrir un navigateur et d’aller sur :

http://di-docker:8023

Si jamais il y a un souci

    Le port 8023 est déjà pris ?
    On peut simplement en choisir un autre 

