# ShopModerne - Plateforme E-commerce

## 🎯 Vue d'ensemble
Plateforme e-commerce moderne avec 3 niveaux d'accès :
- **Clients** : Navigation et commande sans connexion (panier localStorage)
- **Commerçante** : Gestion des commandes et produits
- **Admin** : Gestion complète + ajout/suppression de produits

## 🔐 Comptes de test

### Admin
- **Email** : admin@shop.com
- **Mot de passe** : admin123
- **Accès** : /admin

### Commerçante
- **Email** : commercante@shop.com
- **Mot de passe** : merchant123
- **Accès** : /merchant

## ✨ Fonctionnalités

### Pour les Clients (sans connexion)
- ✅ Navigation des produits disponibles
- ✅ Ajout au panier (localStorage)
- ✅ Modification des quantités
- ✅ Processus de commande complet
- ✅ Formulaire avec : nom, email, téléphone, adresse
- ✅ Paiement à la livraison

### Pour la Commerçante
- ✅ Visualisation de toutes les commandes
- ✅ Détails clients (nom, email, téléphone, adresse)
- ✅ Acceptation/refus des commandes
- ✅ Marquage commandes comme complétées
- ✅ Gestion du stock des produits
- ✅ Activation/désactivation immédiate des produits
- ✅ Mise à jour automatique du stock

### Pour l'Admin
- ✅ Toutes les fonctionnalités commerçante
- ✅ Ajout de nouveaux produits avec upload d'images
- ✅ Suppression de produits
- ✅ Statistiques : produits, commandes, revenus

## 🔄 Gestion automatique du stock
- Stock décrémenté automatiquement à chaque commande
- Produit marqué "out of stock" quand stock = 0
- Option manuelle pour désactiver un produit immédiatement

## 📧 Emails automatiques (à configurer)
Structure prête pour l'envoi d'emails Gmail lors de :
- Acceptation de commande
- Refus de commande

**Configuration requise** :
1. Ajouter dans `/app/backend/.env` :
   ```
   GMAIL_EMAIL=votre-email@gmail.com
   GMAIL_PASSWORD=votre-mot-de-passe-application
   ```
2. Le code est prêt dans `server.py` (fonction TODO à compléter)

## 🛠️ Architecture technique

### Backend (FastAPI)
- **Base de données** : MongoDB
- **Authentification** : JWT (7 jours)
- **Upload** : Images stockées dans `/app/backend/uploads/`
- **API Endpoints** :
  - `/api/auth/*` : Authentification
  - `/api/products/*` : CRUD produits
  - `/api/orders/*` : Gestion commandes

### Frontend (React)
- **Design** : Shadcn UI + Tailwind CSS
- **Fonts** : Space Grotesk (titres) + Inter (texte)
- **Style** : Moderne avec gradients bleu-vert
- **Panier** : localStorage (pas de connexion requise)

## 📱 Pages principales

### Côté Public
- `/` : Page d'accueil avec catalogue
- `/product/:id` : Détail produit
- `/cart` : Panier
- `/checkout` : Finalisation commande
- `/login` : Connexion

### Côté Commerçante
- `/merchant` : Dashboard avec onglets Commandes/Produits

### Côté Admin
- `/admin` : Dashboard complet + statistiques

## 🚀 Utilisation

### Ajouter un produit (Admin uniquement)
1. Se connecter comme admin
2. Cliquer sur "Ajouter un produit"
3. Remplir : nom, description, prix, stock
4. Upload une image
5. Le produit apparaît immédiatement sur le site

### Passer une commande (Client)
1. Parcourir les produits sur la page d'accueil
2. Cliquer sur "Ajouter au panier"
3. Aller dans le panier
4. Ajuster les quantités si besoin
5. Cliquer "Passer la commande"
6. Remplir les informations de livraison
7. Confirmer

### Gérer une commande (Commerçante)
1. Se connecter comme commerçante
2. Voir toutes les commandes dans l'onglet "Commandes"
3. Cliquer "Accepter" ou "Refuser"
4. Une fois acceptée, marquer comme "Complétée" après livraison

### Gérer le stock (Commerçante)
1. Aller dans l'onglet "Produits"
2. Modifier le nombre en stock
3. Activer/désactiver le produit avec le switch

## 🎨 Design moderne
- Gradients subtils bleu-vert
- Glass-morphism effects
- Animations smooth au hover
- Cards avec ombres élégantes
- Responsive design
- Spacing généreux type Shopify

## 📊 Base de données

### Collections MongoDB
- `users` : Utilisateurs (client/merchant/admin)
- `products` : Produits du catalogue
- `orders` : Commandes avec détails clients

## 🔒 Sécurité
- Mots de passe hashés avec bcrypt
- Tokens JWT avec expiration
- Contrôle d'accès basé sur les rôles
- Validation des données avec Pydantic

## 📝 Notes importantes
- Les clients n'ont PAS besoin de compte pour commander
- Le panier est sauvegardé en localStorage
- Stock mis à jour automatiquement après chaque commande
- Les images sont servies depuis `/uploads/`
- Email automatiques prêts à être configurés avec Gmail

## 🔄 Prochaines étapes suggérées
1. Configurer l'envoi d'emails Gmail
2. Ajouter des catégories de produits
3. Système de recherche/filtres
4. Historique des commandes pour clients enregistrés
5. Notifications push pour nouvelles commandes
