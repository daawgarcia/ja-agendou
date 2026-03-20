const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./src/routes/authRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
const agendamentoRoutes = require('./src/routes/agendamentoRoutes');
const clinicaRoutes = require('./src/routes/clinicaRoutes');
const { attachUserToViews } = require('./src/middlewares/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'ja-agendou-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use(attachUserToViews);

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/agendamentos', agendamentoRoutes);
app.use('/clinicas', clinicaRoutes);

app.use((req, res) => {
  res.status(404).render('partials/error', {
    title: 'Página não encontrada',
    message: 'A página que você tentou acessar não existe.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Já Agendou! rodando em http://localhost:${PORT}`);
});
