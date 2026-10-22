const { createWebhookService } = require('../../../services/meta/metaWebhook');

const webhook = createWebhookService();

async function verifyMetaWebhook(req, res) {
  const result = webhook.verifySubscription({
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge'],
  });
  if (!result.ok) return res.sendStatus(403);
  return res.status(200).type('text/plain').send(result.challenge);
}

async function receiveMetaWebhook(req, res) {
  try {
    const result = await webhook.receive({
      rawBody: req.rawBody,
      signature: req.get('x-hub-signature-256'),
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: 'persist_failed',
      message: 'The webhook event could not be saved.',
    });
  }
}

module.exports = {
  verifyMetaWebhook,
  receiveMetaWebhook,
  createWebhookHandlers: createWebhookService,
};
