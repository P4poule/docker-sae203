# Utiliser Debian officiel
FROM debian:latest

# Mettre à jour Debian et installer Node.js + npm
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Créer un dossier pour l'app
WORKDIR /app

# Copier le package.json et installer les dépendances
COPY package.json package-lock.json ./
RUN npm install

# Copier tous les fichiers
COPY . .

# Exposer le port du serveur (3000)
EXPOSE 3000

# Commande pour démarrer ton serveur
CMD ["node", "server.js"]
