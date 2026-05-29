// Projet Node.js pour débutants - Application bancaire simple
// Utilise Express, Sequelize, PostgreSQL et bcrypt
// À des fins éducatives uniquement - ne pas utiliser en production sans améliorations de sécurité

require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();

// Désactive l'en-tête X-Powered-By pour ne pas divulguer la stack Express
app.disable('x-powered-by');
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');




app.use(session({
  secret: 'de2a5a6a2989999b27eaad966a46397a6a95521b5b307e77d32778aae970414a',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000,
    httpOnly: true,
    secure: false,
    sameSite: 'strict'
  }
}));

// Middleware pour ajouter les headers de sécurité CSP et anti-clickjacking
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self'; " +
    "img-src 'self' data:; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'; " +
    "frame-ancestors 'none'; " +
    "upgrade-insecure-requests;"
  );
  // res.setHeader('X-Frame-Options', 'DENY');
  // res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// ajout de l'en-tête X-Content-Type-Options Header Missing pour les fichiers statiques
app.use(express.static('public', {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;"
    );
  }
}));



// Middleware pour générer un jeton CSRF unique à chaque session
const crypto = require('crypto');
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }

 // On expose le jeton CSRF à toutes les vues EJS
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

const sequelize = new Sequelize(
  process.env.DB_NAME || 'vulnerable_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false
  }
);

const User = sequelize.define('users', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  solde: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login', { error: null, csrfToken: req.session.csrfToken });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = username;
      res.redirect('/dashboard');
    } else {
      res.render('login', { error: 'Invalid credentials' });
    }
  } catch (err) {
    res.render('login', { error: 'Database error' });
  }
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, solde: 0 });
    res.redirect('/login');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.render('register', { error: 'Username already exists' });
    } else {
      console.error('Registration error:', err);
      res.render('register', { error: 'Registration error. Please try again.' });
    }
  }
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  try {
    const user = await User.findOne({ where: { username: req.session.user } });
    if (!user) {
      req.session.destroy(() => {
        res.redirect('/login');
      });
    } else {
      res.render('dashboard', { user: req.session.user, balance: user.solde });
    }
  } catch (err) {
    res.render('dashboard', { user: req.session.user, balance: 0, error: 'Unable to fetch balance' });
  }
  });

// Route simple pour afficher le solde
app.get('/mysolde', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const user = await User.findOne({ where: { username: req.session.user } });
  if (!user) {
    return res.send('Utilisateur introuvable');
  }
  res.send('Votre solde est : ' + user.solde);
});

// Route simple pour enregistrer le solde
app.post('/mysolde', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const montant = parseInt(req.body.montant, 10);
  if (isNaN(montant) || montant < 0) {
    return res.send('Montant invalide');
  }
  try {
    const user = await User.findOne({ where: { username: req.session.user } });
    if (!user) {
      return res.send('Utilisateur introuvable');
    }
    user.solde = montant;
    await user.save();
    res.send('Solde mis à jour : ' + user.solde);
  } catch (error) {
    console.error('Error updating balance:', error);
    // In development, send error details to help debugging
    if (process.env.NODE_ENV !== 'production') {
      res.status(500).send(`Erreur lors de la mise à jour du solde: ${error.message}`);
    } else {
      res.status(500).send('Erreur lors de la mise à jour du solde');
    }
  }
});


// Tableau pour stocker les transferts (mémoire, version débutant)
const listeTransferts = [];

// Route très simple pour transférer de l'argent
app.post('/montransfert', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  const destinataire = req.body.destinataire;
  const montant = parseInt(req.body.montant, 10);
  if (!destinataire || isNaN(montant) || montant <= 0) {
    return res.send('Données invalides');
  }
  try {
    const user = await User.findOne({ where: { username: req.session.user } });
    const autre = await User.findOne({ where: { username: destinataire } });
    if (!user) {
      return res.send('Utilisateur non connecté');
    }
    if (!autre) {
      return res.send('Destinataire introuvable');
    }
    if (user.solde < montant) {
      return res.send('Solde insuffisant');
    }
    user.solde -= montant;
    autre.solde += montant;
    await user.save();
    await autre.save();
    // On ajoute le transfert dans la liste
    listeTransferts.push({ emetteur: req.session.user, destinataire, montant });
    res.send('Transfert effectué. Nouveau solde : ' + user.solde);
  } catch (error) {
    console.error('Error processing transfer:', error);
    if (process.env.NODE_ENV !== 'production') {
      res.status(500).send(`Erreur lors du traitement du transfert: ${error.message}`);
    } else {
      res.status(500).send('Erreur lors du traitement du transfert');
    }
  }
});

// Route GET /montransfert pour afficher les transferts de l'utilisateur
app.get('/montransfert', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  // On filtre les transferts de l'utilisateur
  const mesTransferts = listeTransferts.filter(t => t.emetteur === req.session.user);
  if (mesTransferts.length === 0) {
    return res.send('Aucun transfert effectué.');
  }
  let resultat = 'Mes transferts :\n';
  mesTransferts.forEach(t => {
    resultat += `Vers ${t.destinataire} : ${t.montant}\n`;
  });
  res.type('text').send(resultat);
});


app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});