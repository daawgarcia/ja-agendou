// Servidor só para pré-visualizar a página /halito-limpo localmente, sem banco de dados.
const path = require('path');
const express = require('express');
const root = path.join(__dirname, '..', '..');
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(root, 'views'));
app.use(express.static(path.join(root, 'public')));
app.get('/bruxismo-do-sono', (req, res) => res.render('public/bruxismo-do-sono', { checkoutUrl: req.query.checkout || '', coupon: req.query.cupom ? { code: req.query.cupom, price: req.query.preco || '147' } : null }));
app.get(['/', '/halito-limpo'], (req, res) => res.render('public/halito-limpo', { checkoutUrl: req.query.checkout || '' }));
app.post('/api/track/checkout-click', (req, res) => res.status(204).end());
app.listen(4123, () => console.log('preview em http://localhost:4123/halito-limpo'));
