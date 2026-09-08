import HostPaymentProcessor from '../models/HostPaymentProcessor.js';
import User from '../models/User.js';

const currencies = {
  paystack: ['NGN', 'GHS', 'ZAR', 'KES'],
  stripe: ['USD', 'GBP', 'EUR', 'INR', 'CAD', 'JPY', 'BRL', 'AUD'],
};

const safeProcessor = (processor) => ({
  id: processor._id,
  provider: processor.provider,
  status: processor.status,
  accountLegalName: processor.accountLegalName || null,
  currencies: processor.currencies,
  statusReason: processor.statusReason || null,
  connectedAt: processor.connectedAt || null,
});

export const getPayoutProcessors = async (req, res) => {
  try {
    const existing = await HostPaymentProcessor.find({ hostId: req.user.userId });
    const byProvider = new Map(existing.map((processor) => [processor.provider, processor]));
    const result = ['paystack', 'stripe'].map((provider) => byProvider.get(provider) || {
      provider,
      status: 'not_connected',
      currencies: currencies[provider],
    });
    res.json({ processors: result.map(safeProcessor) });
  } catch (error) {
    console.error('Unable to load payout processors:', error);
    res.status(500).json({ error: 'payouts_unavailable' });
  }
};

export const connectPayoutProcessor = async (req, res) => {
  const provider = String(req.body.provider || '').toLowerCase();
  if (!currencies[provider]) return res.status(400).json({ error: 'unsupported_processor' });
  try {
    const processor = await HostPaymentProcessor.findOneAndUpdate(
      { hostId: req.user.userId, provider },
      { $set: { status: 'pending', currencies: currencies[provider], statusReason: null } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json({ processor: safeProcessor(processor), message: 'Verification started.' });
  } catch (error) {
    console.error('Unable to start payout setup:', error);
    res.status(500).json({ error: 'payout_setup_unavailable' });
  }
};

export const disconnectPayoutProcessor = async (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  try {
    const processor = await HostPaymentProcessor.findOneAndUpdate(
      { hostId: req.user.userId, provider },
      { $set: { status: 'not_connected', accountReference: null, accountLegalName: null, connectedAt: null } },
      { new: true },
    );
    if (!processor) return res.status(404).json({ error: 'processor_not_found' });
    res.json({ processor: safeProcessor(processor) });
  } catch (error) {
    console.error('Unable to disconnect payout processor:', error);
    res.status(500).json({ error: 'payout_disconnect_unavailable' });
  }
};
