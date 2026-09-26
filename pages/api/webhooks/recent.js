// pages/api/webhooks/recent.js
// What the Webhooks page shows: the last deliveries this instance received.
import { recent } from '../../../lib/webhookLog';
export default function handler(req, res) { res.status(200).json({ deliveries: recent() }); }
