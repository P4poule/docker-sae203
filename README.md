# 🐍 Lancer Notre Jeu Snake Multijoueur avec Docker – Guide Simple

## 🛠️ Étape 1 : Construction de l'image Docker

Pour commencer, nous devons créer une image Docker de notre jeu. Cette image contiendra tout le nécessaire pour faire fonctionner l'application.

**Commande à exécuter :**
```bash
docker build -t snake-multi .

docker run -d -p 8023:8023 snake-multi

```
## Si vous avez modifier des fichiers faites :
```
docker build -t snake-multi .
```
