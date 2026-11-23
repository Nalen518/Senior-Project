'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { createModels } = require('./models');
const { createCrisisService } = require('./services/crisisService');
const { createNlpService } = require('./services/nlpService');
const { createInsightService } = require('./services/insightService');
const { createCheckinService } = require('./services/checkinService');
const { apiRouter } = require('./api');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { requestLog } = require('./middleware/requestLog');
const { rateLimit } = require('./middleware/rateLimit');

// Builds the Express app. `db` is a pg Pool; tests pass a test database.
function createApp({ db, config, logger = console, fetchImpl }) {
  const models = createModels(db);
  const crisis = createCrisisService({ models, logger });
  const nlp = createNlpService({ config, models, logger, fetchImpl });
  const insights = createInsightService({ models, config });
  const checkins = createCheckinService({ models, crisis, nlp, insights, config });
  const deps = { models, crisis, nlp, insights, checkins };

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy ?? false);
  app.use(requestLog(logger));
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins.length > 0 ? config.corsOrigins : true,
      allowedHeaders: ['Content-Type', 'X-Anon-Token'],
    }),
  );
  app.use(express.json({ limit: '32kb' }));

  // Health check for the host's monitor (not part of the frontend contract).
  app.get('/health', async (req, res) => {
    await db.query('SELECT 1');
    res.json({ status: 'ok', nlp: nlp.enabled ? 'on' : 'off' });
  });

  // Support must stay reachable (FR-07), so the public resources list is never rate limited.
  const limiter = rateLimit({ ...(config.rateLimit ?? { limit: 60, windowMs: 60_000 }), skip: (req) => req.path === '/resources' });
  app.use('/api', limiter);

  app.use('/api', apiRouter(deps));
  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}

module.exports = { createApp };
