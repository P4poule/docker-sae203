# Prendre Debian comme demandé
FROM debian:latest

# Installer Node.js et npm
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Créer un dossier pour l'application
WORKDIR /app

# Copier les fichiers package.json + package-lock.json (s'il existe)
COPY package.json ./

# Installer les dépendances
RUN npm install

# Copier tout le reste (public, server.js etc.)
COPY . .

# Exposer le port utilisé par Node.js
EXPOSE 8023

# Commande pour lancer ton serveur Node.js
CMD ["node", "server.js"]
