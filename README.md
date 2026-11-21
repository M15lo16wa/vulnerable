# Vulnerable

Application bancaire pédagogique développée avec **Node.js**, **Express**, **PostgreSQL**, **Sequelize** et **EJS**.

> ⚠️ **Projet volontairement éducatif** — il contient des pratiques à corriger avant toute utilisation en production.

## Fonctionnalités

- Création de compte utilisateur
- Authentification par nom d'utilisateur et mot de passe
- Hashage des mots de passe avec bcrypt
- Consultation du solde
- Modification du solde
- Transfert d'argent entre utilisateurs
- Historique des transferts effectués pendant la session du serveur
- Interface rendue avec EJS
- Protection de session avec `express-session`
- Jetons CSRF générés par session
- En-têtes de sécurité HTTP et politique CSP

## Technologies

| Technologie | Rôle |
|---|---|
| Node.js | Exécution JavaScript côté serveur |
| Express 5 | Serveur HTTP et routage |
| EJS | Moteur de templates |
| PostgreSQL | Base de données relationnelle |
| Sequelize | ORM pour PostgreSQL |
| bcrypt | Hashage des mots de passe |
| express-session | Gestion des sessions |
| dotenv | Chargement de la configuration |

## Prérequis

- Node.js 18 ou supérieur
- PostgreSQL
- npm

## Installation

```bash
git clone https://github.com/M15lo16wa/vulnerable.git
cd vulnerable
npm install
```

## Configuration

Créez une base PostgreSQL, puis définissez les variables suivantes dans un fichier `.env` à la racine du projet :

```env
DB_NAME=vulnerable_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
SESSION_SECRET=remplacez_ce_secret
```

La configuration prend les valeurs suivantes par défaut :

- Base : `vulnerable_db`
- Utilisateur : `postgres`
- Hôte : `localhost`
- Port : `3000`
- Hôte HTTP : `0.0.0.0`

> Ne commitez jamais le fichier `.env` ni ses secrets réels.

## Lancement

```bash
npm start
```

Puis ouvrez <http://localhost:3000>.

## Utilisation

1. Accédez à la page d'inscription.
2. Créez un compte.
3. Connectez-vous avec vos identifiants.
4. Consultez votre tableau de bord.
5. Modifiez ou transférez votre solde.
6. Déconnectez-vous depuis le tableau de bord.

## Structure du projet

```text
.
├── app.js              # Serveur Express, routes et modèles Sequelize
├── package.json        # Dépendances et scripts npm
├── public/
│   └── style.css       # Feuilles de styles
├── views/
│   ├── index.ejs       # Page d'accueil
│   ├── login.ejs       # Connexion
│   ├── register.ejs    # Inscription
│   ├── dashboard.ejs   # Tableau de bord
│   └── transfer.ejs    # Interface de transfert
└── README.md
```

## Points de sécurité à améliorer

Ce projet n'est pas destiné à un déploiement public tel quel. Les améliorations prioritaires sont :

- utiliser un secret de session provenant exclusivement de l'environnement
- activer `Secure` et fournir une stratégie HTTPS pour les cookies
- valider et nettoyer toutes les entrées utilisateur
- vérifier les jetons CSRF sur les routes sensibles
- rendre les opérations de transfert atomiques avec des transactions Sequelize
- remplacer les historiques en mémoire par une persistance PostgreSQL
- gérer les limites de tentatives de connexion
- ajouter une journalisation et une gestion centralisée des erreurs
- retirer les détails techniques des réponses d'erreur
- ajouter des tests automatisés
- créer une suite de migrations plutôt que d'utiliser `sequelize.sync({ alter: true })`

## Tests

Aucun test automatisé n'est actuellement configuré. Le script déclaré affiche uniquement une erreur :

```bash
npm test
```

## Licence

Aucune licence n'est actuellement définie pour ce projet.
