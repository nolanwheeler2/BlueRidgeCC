// components/CardPayment.js
// ============================================
// Taking a card the way Verde's API expects (see /developers):
//   1. POST /payments  -> client_secret, publishable_key, stripe_account, amount
//   2. Stripe.js Payment Element confirms the card in the browser - card
//      details go to Stripe, never to this site or to Verde
//   3. POST /payments/{id}/complete -> the booking (or a full refund if the
//      time was taken while paying)
// `start` is the body for step 1 (type + the booking's fields).
// ============================================

import { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { api, money, newKey } from '../lib/verdeClient';
import Result from './Result';

export default function CardPayment({ start, onDone, label = 'Pay by Card' }) {
  const [payment, setPayment] = useState(null);
  const [started, setStarted] = useState(null);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const box = useRef(null);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);

  const begin = async () => {
    setBusy(true); setErr(null); setDone(null);
    const r = await api('/payments', { method: 'POST', body: start, key: newKey() });
    setStarted(r);
    if (r.ok) setPayment(r.json.payment); else setErr(r.json?.error?.message || 'The payment could not be started.');
    setBusy(false);
  };

  useEffect(() => {
    if (!payment || !box.current) return;
    let alive = true;
    (async () => {
      const stripe = await loadStripe(payment.publishable_key, payment.stripe_account ? { stripeAccount: payment.stripe_account } : undefined);
      if (!alive || !stripe) return;
      const elements = stripe.elements({ clientSecret: payment.client_secret, appearance: { theme: 'stripe', variables: { colorPrimary: '#1d3450', borderRadius: '10px' } } });
      elements.create('payment').mount(box.current);
      stripeRef.current = stripe; elementsRef.current = elements;
    })();
    return () => { alive = false; };
  }, [payment]);

  const pay = async () => {
    setBusy(true); setErr(null);
    const { error } = await stripeRef.current.confirmPayment({ elements: elementsRef.current, redirect: 'if_required' });
    if (error) { setErr(error.message || 'The card was not accepted.'); setBusy(false); return; }
    const r = await api('/payments/' + payment.id + '/complete', { method: 'POST', body: {} });
    setDone(r); setBusy(false);
    if (r.ok && onDone) onDone(r.json); else if (!r.ok) setErr(r.json?.error?.message || 'The booking could not be finished.');
  };

  return (
    <div>
      {!payment ? (
        <button className="btn ghost" style={{ width: '100%' }} disabled={busy} onClick={begin}>{busy ? 'One Moment\u2026' : label}</button>
      ) : !done?.ok ? (
        <div className="card-box">
          <div ref={box} />
          <button className="btn" style={{ width: '100%', marginTop: 14 }} disabled={busy} onClick={pay}>{busy ? 'Processing\u2026' : 'Pay ' + money(payment.amount_cents)}</button>
        </div>
      ) : null}
      {err ? <div className="notice bad">{err}</div> : null}
      <Result result={started} title="POST /payments" />
      <Result result={done} title="POST /payments/{id}/complete" />
    </div>
  );
}
