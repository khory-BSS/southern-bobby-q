require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bcrypt = require('bcryptjs');
const path = require('path');
const { pool, initDb } = require('./db/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new pgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

// make admin flag available in all templates
app.use((req, res, next) => {
  res.locals.isAdmin = !!(req.session && req.session.isAdmin);
  next();
});

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

// ---------- Public routes ----------

app.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date ASC LIMIT 3`
  );
  res.render('home', { upcomingEvents: rows });
});

app.get('/menu', (req, res) => {
  res.render('menu');
});

app.get('/events', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date ASC`
  );
  res.render('events', { events: rows });
});

app.get('/contact', (req, res) => {
  res.render('contact', { submitted: false });
});

app.post('/contact', async (req, res) => {
  const { name, email, phone, message } = req.body;
  if (!name || !email || !message) {
    return res.render('contact', { submitted: false, error: 'Please fill in your name, email, and message.' });
  }
  await pool.query(
    `INSERT INTO contact_submissions (name, email, phone, message) VALUES ($1, $2, $3, $4)`,
    [name, email, phone || null, message]
  );
  res.render('contact', { submitted: true });
});

// ---------- Admin auth ----------

app.get('/admin/login', (req, res) => {
  res.render('admin_login', { error: null });
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUser || !adminHash) {
    return res.render('admin_login', { error: 'Admin account is not configured yet.' });
  }

  if (username === adminUser && bcrypt.compareSync(password, adminHash)) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.render('admin_login', { error: 'Invalid username or password.' });
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// ---------- Admin dashboard ----------

app.get('/admin', requireAdmin, async (req, res) => {
  const events = await pool.query(`SELECT * FROM events ORDER BY event_date ASC`);
  const submissions = await pool.query(`SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 25`);
  res.render('admin_dashboard', { events: events.rows, submissions: submissions.rows });
});

app.post('/admin/events', requireAdmin, async (req, res) => {
  const { title, event_date, start_time, location, description } = req.body;
  if (!title || !event_date) return res.redirect('/admin');
  await pool.query(
    `INSERT INTO events (title, event_date, start_time, location, description) VALUES ($1, $2, $3, $4, $5)`,
    [title, event_date, start_time || null, location || null, description || null]
  );
  res.redirect('/admin');
});

app.post('/admin/events/:id/delete', requireAdmin, async (req, res) => {
  await pool.query(`DELETE FROM events WHERE id = $1`, [req.params.id]);
  res.redirect('/admin');
});

// ---------- Startup ----------

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Southern Bobby-Q site running on port ${PORT}`));
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
