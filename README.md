# 🐍 Lancer Notre Jeu Snake Multijoueur avec Docker – Guide Simple

## 🛠️ Étape 1 : Construction de l'image Docker

Pour commencer, nous devons créer une image Docker de notre jeu. Cette image contiendra tout le nécessaire pour faire fonctionner l'application.

**Commande à exécuter :**

```bash docker build -t snake-multi .```

**Explications :**

  Docker va créer une image à partir du dossier courant (représenté par le .)

  L'image sera nommée snake-multi (option -t)

  Toutes les dépendances nécessaires seront installées automatiquement

  Les fichiers du jeu (server.js, package.json, etc.) seront copiés dans l'image

## 🚀 Étape 2 : Lancement du conteneur

Une fois l'image construite, nous pouvons démarrer le jeu :

Commande :

```bash docker run -d -p 8023:8023 snake-multi ```


** Si vous avez modifier des fichiers faites :**

```bash docker build -t snake-multi . ```


Options :

  -d : Lance le conteneur en mode détaché (en arrière-plan)

  -p 8023:8023 : Redirige le port 8023 du conteneur vers le port 8023 de l'hôte

## 🌐 Étape 3 : Accès au jeu

Le jeu est maintenant accessible via un navigateur web à l'adresse :

**http://di-docker:8023**

## ⚠️ Dépannage
Problème de port déjà utilisé

Si le port 8023 est déjà occupé, vous pouvez :

  Choisir un autre port (par exemple 8024)

  Modifier la commande de lancement :
    ```bash docker run -d -p 8024:8023 snake-multi```

Puis accédez au jeu via :
  ```http://di-docker:8023```

## � Astuce

Pour arrêter le conteneur :
  ```bash docker stop <[ID_CONTAINER] ou [nom_container]>```
  
Pour lister les conteneurs en cours d'exécution :
  ```bash docker ps ```

## Amusez-vous bien avec notre Snake multijoueur ! �🐍

  
  
    
    
