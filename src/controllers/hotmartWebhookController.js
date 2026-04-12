const crypto = require('crypto');
const pool = require('../config/db');

const DEFAULT_APPROVED_EVENTS = new Set([
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE',
  'APPROVED',
]);

function normalizeValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function parseCsvSet(raw, fallbackSet) {
  const value = normalizeValue(raw);
  if (!value) {
    return fallbackSet;
  }

  const parsed = value
    .split(',')
    .map((item) => normalizeValue(item))
    .filter(Boolean)
    .map((item) => String(item).toUpperCase());

  return new Set(parsed.length ? parsed : Array.from(fallbackSet));
}

function parsePlanMappings(raw) {
  const mappings = new Map();
  const value = normalizeValue(raw);

  if (!value) {
    return mappings;
  }

  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    const [left, right] = part.split(':');
    const key = normalizeKey(left);
    const days = Number(right);

    if (!key || !Number.isInteger(days) || days <= 0) {
      continue;
    }

    mappings.set(key, days);
  }

  return mappings;
}

function getDefaultPlanDaysByName(input) {
  const normalized = normalizeKey(input);

  if (!normalized) return null;
  if (normalized.includes('pacote7') || normalized.includes('7dias')) return 7;
  if (normalized.includes('pacote30') || normalized.includes('30dias') || normalized.includes('1mes') || normalized.includes('mensal')) return 30;
  if (normalized.includes('pacote90') || normalized.includes('90dias') || normalized.includes('3meses') || normalized.includes('trimestral')) return 90;
  if (normalized.includes('pacote180') || normalized.includes('180dias') || normalized.includes('6meses') || normalized.includes('semestral')) return 180;
  if (normalized.includes('pacote360') || normalized.includes('360dias') || normalized.includes('12meses') || normalized.includes('1ano') || normalized.includes('anual')) return 360;

  return null;
}

function readNested(source, paths) {
  for (const path of paths) {
    const parts = path.split('.');
    let current = source;

    for (const part of parts) {
      if (!current || typeof current !== 'object') {
        current = null;
        break;
      }
      current = current[part];
    }

    const normalized = normalizeValue(current);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function extractIdentifiers(payload) {
  return [
    readNested(payload, ['offer.code', 'data.offer.code', 'purchase.offer.code', 'data.purchase.offer.code']),
    readNested(payload, ['offer.name', 'data.offer.name', 'purchase.offer.name', 'data.purchase.offer.name']),
    readNested(payload, ['product.ucode', 'data.product.ucode', 'purchase.product.ucode', 'data.purchase.product.ucode']),
    readNested(payload, ['product.id', 'data.product.id', 'purchase.product.id', 'data.purchase.product.id']),
    readNested(payload, ['product.name', 'data.product.name', 'purchase.product.name', 'data.purchase.product.name']),
    readNested(payload, ['subscription.plan.name', 'data.subscription.plan.name']),
  ].filter(Boolean);
}

function resolvePlanDays(payload) {
  const mappings = parsePlanMappings(process.env.HOTMART_PLAN_MAPPINGS);
  const identifiers = extractIdentifiers(payload);

  for (const identifier of identifiers) {
    const mapped = mappings.get(normalizeKey(identifier));
    if (mapped) {
      return mapped;
    }
  }

  for (const identifier of identifiers) {
    const fallback = getDefaultPlanDaysByName(identifier);
    if (fallback) {
      return fallback;
    }
  }

  return null;
}

function parseClinicaId(payload) {
  const raw = readNested(payload, [
    'metadata.clinica_id',
    'data.metadata.clinica_id',
    'purchase.metadata.clinica_id',
    'data.purchase.metadata.clinica_id',
    'custom.clinica_id',
    'data.custom.clinica_id',
    'clinica_id',
    'data.clinica_id',
  ]);

  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

async function findClinicIdFromPayload(payload) {
  const clinicaId = parseClinicaId(payload);
  if (clinicaId) {
    const [rows] = await pool.execute('SELECT id FROM clinicas WHERE id = ? LIMIT 1', [clinicaId]);
    if (rows.length) {
      return rows[0].id;
    }
  }

  const buyerEmail = normalizeValue(readNested(payload, [
    'buyer.email',
    'purchase.buyer.email',
    'data.buyer.email',
    'data.purchase.buyer.email',
    'email',
  ]));

  if (!buyerEmail) {
    return null;
  }

  const [rows] = await pool.execute(
    `SELECT c.id
     FROM clinicas c
     LEFT JOIN usuarios u
       ON u.clinica_id = c.id
      AND u.perfil IN ('admin', 'super_admin')
     WHERE LOWER(c.email) = LOWER(?)
        OR LOWER(u.email) = LOWER(?)
     ORDER BY CASE WHEN LOWER(u.email) = LOWER(?) THEN 0 ELSE 1 END,
              c.id ASC
     LIMIT 1`,
    [buyerEmail, buyerEmail, buyerEmail]
  );

  if (!rows.length) {
    return null;
  }

  return rows[0].id;
}

async function activateLicenseForClinic(clinicId, days) {
  await pool.execute(
    `UPDATE clinicas
     SET status = 'ativo',
         licenca_dias = ?,
         licenca_inicio_em = NOW(),
         licenca_fim_em = DATE_ADD(NOW(), INTERVAL ? DAY),
         desbloqueado_em = NOW()
     WHERE id = ?`,
    [days, days, clinicId]
  );

  await pool.execute(
    "UPDATE usuarios SET status = 'ativo' WHERE clinica_id = ?",
    [clinicId]
  );
}

function buildEventKey(payload, eventName) {
  const explicitKey = readNested(payload, [
    'id',
    'event.id',
    'data.id',
    'data.event_id',
    'purchase.transaction',
    'data.purchase.transaction',
    'transaction',
    'transaction_id',
    'subscription.subscriber_code',
    'data.subscription.subscriber_code',
  ]);

  if (explicitKey) {
    return explicitKey;
  }

  const fallback = JSON.stringify(payload || {});
  return crypto.createHash('sha1').update(`${eventName}|${fallback}`).digest('hex');
}

function isTokenValid(req) {
  const expectedToken = normalizeValue(process.env.HOTMART_WEBHOOK_TOKEN);
  if (!expectedToken) {
    return true;
  }

  const incomingToken = normalizeValue(
    req.body?.hottok
      || req.body?.token
      || req.headers['x-hotmart-hottok']
      || req.headers['x-hotmart-token']
      || req.headers['hotmart-token']
  );

  return incomingToken === expectedToken;
}

async function saveEvent(payload) {
  const eventName = readNested(payload, ['event', 'event.name', 'data.event', 'type']) || 'unknown_event';
  const eventKey = buildEventKey(payload, eventName);
  const transaction = readNested(payload, ['purchase.transaction', 'data.purchase.transaction', 'transaction']);
  const buyerEmail = readNested(payload, [
    'buyer.email',
    'purchase.buyer.email',
    'data.buyer.email',
    'data.purchase.buyer.email',
    'email',
  ]);
  const buyerName = readNested(payload, [
    'buyer.name',
    'purchase.buyer.name',
    'data.buyer.name',
    'data.purchase.buyer.name',
    'name',
  ]);
  const productName = readNested(payload, [
    'product.name',
    'purchase.product.name',
    'data.product.name',
    'data.purchase.product.name',
    'offer.name',
  ]);
  const hottok = readNested(payload, ['hottok', 'token']);

  const [result] = await pool.execute(
    `INSERT INTO hotmart_webhook_events
      (event_key, event_name, hottok, transaction_code, buyer_email, buyer_name, product_name, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE processed_at = processed_at`,
    [
      eventKey,
      eventName,
      hottok,
      transaction,
      buyerEmail,
      buyerName,
      productName,
      JSON.stringify(payload || {}),
    ]
  );

  const inserted = result && result.insertId > 0;
  return {
    inserted,
    eventKey,
    eventName,
  };
}

async function receive(req, res) {
  if (!isTokenValid(req)) {
    return res.status(401).json({
      ok: false,
      message: 'Token do webhook inválido.',
    });
  }

  try {
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    const result = await saveEvent(payload);

    if (!result.inserted) {
      return res.status(200).json({
        ok: true,
        message: 'Evento já processado anteriormente.',
        event: result.eventName,
        eventKey: result.eventKey,
      });
    }

    const approvedEvents = parseCsvSet(process.env.HOTMART_APPROVED_EVENTS, DEFAULT_APPROVED_EVENTS);
    const currentEvent = String(result.eventName || '').toUpperCase();
    const shouldActivateLicense = approvedEvents.has(currentEvent);

    if (!shouldActivateLicense) {
      return res.status(200).json({
        ok: true,
        message: 'Evento registrado sem ação de licença.',
        event: result.eventName,
        eventKey: result.eventKey,
      });
    }

    const licenseDays = resolvePlanDays(payload);
    if (!licenseDays) {
      return res.status(200).json({
        ok: true,
        message: 'Evento aprovado registrado, mas sem mapeamento de plano para dias.',
        event: result.eventName,
        eventKey: result.eventKey,
      });
    }

    const clinicId = await findClinicIdFromPayload(payload);
    if (!clinicId) {
      return res.status(200).json({
        ok: true,
        message: 'Evento aprovado registrado, mas clínica não identificada.',
        event: result.eventName,
        eventKey: result.eventKey,
      });
    }

    await activateLicenseForClinic(clinicId, licenseDays);
    await pool.execute(
      'UPDATE hotmart_webhook_events SET processed_at = NOW() WHERE event_key = ? LIMIT 1',
      [result.eventKey]
    );

    return res.status(200).json({
      ok: true,
      message: 'Webhook recebido e licença aplicada.',
      event: result.eventName,
      eventKey: result.eventKey,
      clinicId,
      licenseDays,
    });
  } catch (error) {
    console.error('ERRO WEBHOOK HOTMART:', error);
    return res.status(500).json({
      ok: false,
      message: 'Falha ao processar webhook da Hotmart.',
    });
  }
}

module.exports = {
  receive,
};
