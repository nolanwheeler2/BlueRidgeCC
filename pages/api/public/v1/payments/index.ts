// pages/api/public/v1/payments/index.ts
// ============================================
// POST /api/public/v1/payments   (scope: book, module: by type)
// Idempotency-Key: <unique per booking>
// { "type": "tee_time" | "simulator" | "court" | "lodging", ...the same
//   fields as that type's booking endpoint }
//
// Starts a CARD payment for a booking (commit 363) - what the booking
// endpoints turn away with payment_required. It is the same flow the club's
// own pages use (lib/reservationPayments.ts):
//
//   1. This call: the club's price is quoted IN THE DATABASE and a Stripe
//      payment is made for exactly that, carrying what is being booked.
//      Nothing is booked yet. The response has what the integration's own
//      web page needs to take the card with Stripe.js: the publishable key,
//      the client secret, and the connected account for a direct charge.
//      Card details never touch Verde's API or the club's server.
//   2. The page confirms the card with Stripe.
//   3. POST /payments/<id>/complete: Stripe is asked whether it went through,
//      the booking is made from the payment at the price paid (refunded in
//      full if the time was taken meanwhile), and returned. Verde's Stripe
//      webhook does the same, so an integration that never calls /complete
//      still ends up with the booking.
//
// The club is always the key's club - a course_id in the body is ignored.
// ============================================

import { withPublicApi, withIdempotency, apiFail } from '../../../../../lib/publicApi';
import { startReservationPayment } from '../../../../../lib/reservationPayments';
import { VenueIntentError } from '../../../../../lib/venueIntent';

const MODULE: Record<string, string> = { tee_time: 'tee_times', simulator: 'simulators', court: 'courts', lodging: 'lodging', event_entry: 'events', package: 'packages' };

/* The API's field names, mapped onto the flow's. */
function toFlow(type: string, b: any, courseId: string): any {
  const person = { name: b.name, email: b.email, phone: b.phone };
  if (type === 'tee_time') return { course_id: courseId, club_course_id: b.course_id, start: b.start, players: b.players, cart: b.cart, player_names: b.player_names, ...person };
  if (type === 'simulator') return { course_id: courseId, bay_id: b.bay_id, start: b.start, duration: b.duration, party_size: b.party_size, ...person };
  /* A paid event entry (commit 398): the fee is the event's, decided on the server. */
  /* A package (commit 408): the whole stay, booked when the payment completes. */
  if (type === 'package') return { course_id: courseId, package_id: b.package_id, arrival: b.arrival, guests: b.guests,
    tee_times: b.tee_times, club_course_id: b.course_id, requests: b.requests, ...person };
  if (type === 'event_entry') return { course_id: courseId, event_id: b.event_id, ...person };
  if (type === 'court') return { course_id: courseId, court_id: b.court_id, start: b.start, duration: b.duration, players: b.players, paddles: b.paddles, balls: b.balls, ...person };
  return { course_id: courseId, room_id: b.room_id, check_in: b.check_in, check_out: b.check_out, guests: b.guests, requests: b.requests, ...person };
}

export default withPublicApi(async (req, res, ctx) => {
  await withIdempotency(req, res, ctx, async () => {
    const b = req.body || {};
    const type = String(b.type || '');
    if (!MODULE[type]) apiFail(400, 'invalid_type', 'type must be tee_time, simulator, court, lodging, event_entry or package.');
    try {
      /* A signed-in member (commit 386) pays as themselves for simulators,
         courts and rooms: the booking is made by the member function at the
         price paid - tee times too, since 387. */
      const asMember = ctx.memberId || null;
      const flow = toFlow(type, b, ctx.courseId);
      if (asMember && (!flow.name || !flow.email)) {
        const { memberSummary } = await import('../../../../../lib/apiMembers');
        const who = await memberSummary(ctx.db, asMember);
        flow.name = flow.name || who.name || 'Member'; flow.email = flow.email || who.email;
      }
      /* A SIGNED-IN MEMBER'S TEE TIME IS A GROUP (commit 526). A member sends
         who's playing - the members and guests with them - not a player
         count, and toFlow's tee_time fields (players, player_names) dropped
         the group, so every member's card payment reached the checkout with
         no valid player count and was refused ("That booking is not valid").
         The group checkout (tee_group - the club app's, with the club's
         member rates, limits and fair booking) takes exactly what a member
         sends; the response still says type 'tee_time'. */
      const memberGroup = type === 'tee_time' && !!asMember;
      const started = memberGroup
        ? await startReservationPayment('tee_group', {
            course_id: ctx.courseId, club_course_id: b.course_id || null, start: b.start, cart: !!b.cart,
            guests: Array.isArray(b.guests) ? b.guests : [], members: Array.isArray(b.members) ? b.members : [],
            expected_total: b.expected_total_cents ?? b.expected_total ?? null,
          }, { source: 'booking_api', profileId: asMember })
        : await startReservationPayment(type, flow, { source: 'booking_api', profileId: asMember });
      return { status: 201, body: { payment: {
        id: started.payment_intent_id,
        type,
        amount_cents: started.amount_cents,
        /* A deposit (commit 400): amount_cents is today's charge, total_cents the whole price. */
        ...((started as any).deposit ? { deposit: true, total_cents: (started as any).total_cents } : {}),
        status: 'requires_payment_method',
        client_secret: started.client_secret,
        stripe_account: started.use_direct_charges ? started.connected_account_id : null,
        /* The key for THIS payment's mode (commit 519): a club in test mode is
           paid on Verde's test account, so the card form needs the test key,
           and the site should say so (test: true). */
        publishable_key: (started as any).publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
        test: (started as any).test === true,
      } } };
    } catch (e: any) {
      if (e instanceof VenueIntentError) apiFail(e.status === 400 ? 400 : 409, e.status === 400 ? 'invalid_booking' : 'payment_refused', e.message);
      throw e;
    }
  });
}, { methods: ['POST'], module: (req) => MODULE[String((req.body || {}).type || '')] || 'tee_times' });
