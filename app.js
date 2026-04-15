const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const dotenv = require('dotenv');
const helmet = require('helmet');

dotenv.config();

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: SESSION_SECRET não definida em produção. Defina a variável de ambiente.');
  process.exit(1);
}

const authRoutes = require('./src/routes/authRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
const agendamentoRoutes = require('./src/routes/agendamentoRoutes');
const clinicaRoutes = require('./src/routes/clinicaRoutes');
const dentistaRoutes = require('./src/routes/dentistaRoutes');
const servicoRoutes = require('./src/routes/servicoRoutes');
const historicoRoutes = require('./src/routes/historicoRoutes');
const reciboRoutes = require('./src/routes/reciboRoutes');
const relatorioRoutes = require('./src/routes/relatorioRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const hotmartWebhookController = require('./src/controllers/hotmartWebhookController');
const { attachUserToViews } = require('./src/middlewares/auth');
const { runMigrations } = require('./src/config/migrations');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use(attachUserToViews);

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/venda');
});

app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/webhooks', webhookRoutes);
app.post('/api/webhook-hotmart', hotmartWebhookController.receive);
app.use('/dashboard', dashboardRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/agendamentos', agendamentoRoutes);
app.use('/clinicas', clinicaRoutes);
app.use('/dentistas', dentistaRoutes);
app.use('/servicos', servicoRoutes);
app.use('/historico', historicoRoutes);
app.use('/recibos', reciboRoutes);
app.use('/relatorios', relatorioRoutes);
app.use('/usuarios', usuarioRoutes);

app.use((req, res) => {
  res.status(404).render('partials/error', {
    title: 'Página não encontrada',
    message: 'A página que você tentou acessar não existe.'
  });
});

const PORT = process.env.PORT || 3000;
const MIGRATIONS_STRICT = String(process.env.MIGRATIONS_STRICT || 'false').toLowerCase() === 'true';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && !process.env.HOTMART_WEBHOOK_TOKEN) {
    console.warn('AVISO DE SEGURANÇA: HOTMART_WEBHOOK_TOKEN não definida. O endpoint de webhook aceita qualquer requisição.');
  }

  try {
    const migrationResult = await runMigrations();
    if (migrationResult.executed > 0) {
      console.log(`Migrations aplicadas: ${migrationResult.executed}/${migrationResult.total}`);
    }
  } catch (error) {
    console.error('Falha ao inicializar aplicação (migrations):', error);
    if (MIGRATIONS_STRICT) {
      process.exit(1);
    }
    console.warn('Aplicação iniciada sem bloquear por falha de migração (MIGRATIONS_STRICT=false).');
  }

  app.listen(PORT, () => {
    console.log(`Já Agendou! rodando em http://localhost:${PORT}`);
  });
}

bootstrap();
