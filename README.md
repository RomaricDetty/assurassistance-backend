# Assur'Assistance Backend

Backend Express.js pour la plateforme Assur'Assistance. API REST avec authentification JWT, documentation Swagger et base MySQL/Sequelize.

## Stack technique

- **Node.js** + **Express 5**
- **Sequelize** + **MySQL2**
- **JWT** (jsonwebtoken) + **bcrypt**
- **Swagger** (documentation API)
- **express-validator**, **multer**, **cors**, **dotenv**

## Prérequis

- Node.js (v18+ recommandé)
- MySQL ou MariaDB
- npm ou yarn

## Installation

```bash
git clone <repo>
cd assurassistance-backend
npm install
```

## Configuration

Créer un fichier `.env` à la racine du projet (ou dans `config/` selon votre chargement) :

```env
# Serveur
PORT=3000
NODE_ENV=development

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=assurassistance_db

# JWT (à personnaliser en production)
JWT_SECRET=votre_secret_jwt
JWT_EXPIRES_IN=7d
```

## Base de données

1. **Créer la base** (une seule fois) :
   ```bash
   npm run db:create
   ```

2. Au démarrage du serveur, les modèles sont synchronisés et le seed (administrateurs par défaut) est exécuté automatiquement.

3. **Lancer le seed manuellement** (optionnel) :
   ```bash
   npm run db:seed
   ```

## Scripts disponibles

| Commande           | Description                          |
|--------------------|--------------------------------------|
| `npm start`        | Démarre le serveur (production)      |
| `npm run dev`      | Démarrage avec nodemon (développement) |
| `npm run db:create`| Crée la base MySQL si elle n'existe pas |
| `npm run db:seed`  | Peuple la base (administrateurs)     |
| `npm run db:migrate` | Exécute les migrations Sequelize   |

## Démarrer l'API

```bash
npm run dev
```

- **API** : http://localhost:3000/api  
- **Documentation Swagger** : http://localhost:3000/api-docs  
- **Health check** : http://localhost:3000/api/health-check  

## Endpoints principaux

- `GET /` — Message de bienvenue et liens utiles
- `GET /api/health-check` — État de santé de l'API
- `/api/administrateurs` — CRUD administrateurs (login, profil, etc.)

Les détails complets sont dans la doc Swagger (`/api-docs`).

## Structure du projet

```
src/
├── config/         # database, swagger
├── controllers/    # logique métier
├── middleware/     # auth, validation
├── models/         # modèles Sequelize
├── routes/         # routes Express
├── scripts/        # createDatabase, seedDatabase
└── server.js       # point d'entrée
```

## Auteur

Detty Romaric GUEU

## Licence

MIT
