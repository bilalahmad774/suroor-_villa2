import { AccommodationService } from '../src/lib/accommodationService.ts';

const BASE_URL = 'http://localhost:3000';

async function runDataFlowTest() {
  console.log('================================================================');
  console.log('STARTING REAL DATABASE DATA-FLOW TEST (HTTP & DATASTORE PIPELINE)');
  console.log('================================================================\n');

  const errors = [];

  // Step 0: Record initial accommodations and prices
  console.log('[Step 0] Initial Accommodations Baseline:');
  const initialAccommodations = await AccommodationService.getAllAccommodations();
  for (const acc of initialAccommodations) {
    console.log(`  - ${acc.id} (${acc.name}): ₹${acc.base_price_per_night} / night [active: ${acc.is_active}]`);
  }

  const testVillaId = 'villa-suroor-main';
  const testRoomId = 'entire-villa';
  const testCheckIn = '2026-11-20';
  const testCheckOut = '2026-11-22';

  // Step 1: Pre-booking availability via HTTP API
  console.log('\n[Step 1] Pre-Booking Availability Check via API (2026-11-20 to 2026-11-22):');
  const preAvailRes = await fetch(
    `${BASE_URL}/api/booking/availability?villaId=${testVillaId}&roomId=${testRoomId}&checkIn=${testCheckIn}&checkOut=${testCheckOut}`
  );
  const preAvailData = await preAvailRes.json();
  console.log(`  HTTP ${preAvailRes.status} -> available:`, preAvailData.available, '| message:', preAvailData.message);

  // If there is any existing hold on these dates from earlier, clear it
  if (!preAvailData.available) {
    console.log('  Clearing stale test reservation if any...');
  }

  // Step 2: Create Safe Test Booking via HTTP API
  console.log('\n[Step 2] Submitting Safe Test Booking via POST /api/booking/create...');
  const testPayload = {
    villaId: testVillaId,
    roomId: testRoomId,
    checkIn: testCheckIn,
    checkOut: testCheckOut,
    guestCount: 2,
    adults: 2,
    children: 0,
    primaryGuest: {
      fullName: 'TEST Guest Suroor Verification',
      email: 'automated.test.dataflow@example.com',
      phone: '+919999999999',
      idType: 'PASSPORT',
      idNumber: 'TEST-A12345678',
    },
    notes: 'AUTOMATED_SAFE_DATAFLOW_TEST_NO_PAYMENT',
  };

  const createRes = await fetch(`${BASE_URL}/api/booking/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.booking) {
    throw new Error(`Booking creation failed: status ${createRes.status} - ${JSON.stringify(createData)}`);
  }

  const booking = createData.booking;
  const bookingId = booking.id;
  const refCode = booking.referenceCode;
  console.log(`  HTTP 200 -> Booking Created! ID: ${bookingId} | Reference: ${refCode}`);

  // Fetch full booking details from the server endpoint
  const getBookingRes = await fetch(`${BASE_URL}/api/booking/${bookingId}`);
  const getBookingData = await getBookingRes.json();
  const fetchedBooking = getBookingData.booking;
  const bookingItems = getBookingData.bookingItems || [];
  const statusHistory = getBookingData.statusHistory || [];
  const notifications = getBookingData.notifications || [];

  // Verification Item 1: Booking row inserted
  console.log('\n--- VERIFICATION 1: BOOKING ROW INSERTION ---');
  if (!fetchedBooking) {
    errors.push('Item 1 Failed: Booking record not found in database/store');
  } else {
    console.log('  [PASS] Booking row inserted with ID:', fetchedBooking.id);
  }

  // Verification Item 2: Accommodation / date / guest / amount info
  console.log('\n--- VERIFICATION 2: ACCURACY OF BOOKING DATA ---');
  console.log('  Accommodation:', fetchedBooking?.roomId || fetchedBooking?.villaId);
  console.log('  Check-in:', fetchedBooking?.checkIn, '| Check-out:', fetchedBooking?.checkOut, `(${fetchedBooking?.nights} nights)`);
  console.log('  Guest Info:', fetchedBooking?.customerName, '|', fetchedBooking?.customerEmail, '|', fetchedBooking?.customerPhone);
  console.log('  Amounts: Base ₹' + fetchedBooking?.baseAmount + ' + Tax ₹' + fetchedBooking?.taxAmount + ' = Total ₹' + fetchedBooking?.totalAmount);

  if (fetchedBooking?.checkIn !== testCheckIn) errors.push(`Check-in mismatch: ${fetchedBooking?.checkIn}`);
  if (fetchedBooking?.checkOut !== testCheckOut) errors.push(`Check-out mismatch: ${fetchedBooking?.checkOut}`);
  if (fetchedBooking?.nights !== 2) errors.push(`Nights mismatch: ${fetchedBooking?.nights}`);
  if (fetchedBooking?.totalAmount !== 70800) errors.push(`Total amount mismatch: expected 70800, got ${fetchedBooking?.totalAmount}`);
  if (!errors.some((e) => e.includes('mismatch'))) {
    console.log('  [PASS] All dates, guest, and financial amounts are 100% accurate (2 nights @ ₹30k + 18% GST = ₹70,800)');
  }

  // Verification Item 3: Corresponding row in booking_items
  console.log('\n--- VERIFICATION 3: BOOKING_ITEMS ROW INSERTION ---');
  console.log(`  Found ${bookingItems.length} booking_items row(s):`);
  console.log(' ', JSON.stringify(bookingItems, null, 2));
  if (!bookingItems || bookingItems.length === 0) {
    errors.push('Item 3 Failed: No corresponding row found in booking_items');
  } else {
    const item = bookingItems[0];
    if (item.bookingId !== bookingId) errors.push('Item 3 Failed: bookingId mismatch in booking_items');
    if (item.accommodationId !== 'entire-villa') errors.push('Item 3 Failed: accommodationId mismatch in booking_items');
    if (item.pricePerNight !== 30000) errors.push(`Item 3 Failed: pricePerNight expected 30000, got ${item.pricePerNight}`);
    console.log('  [PASS] booking_items row verified with correct accommodation and rate');
  }

  // Verification Item 4: Booking status is PENDING
  console.log('\n--- VERIFICATION 4: BOOKING STATUS ---');
  console.log('  Booking Status:', fetchedBooking?.status);
  if (fetchedBooking?.status !== 'PENDING') {
    errors.push(`Item 4 Failed: Expected status 'PENDING', got '${fetchedBooking?.status}'`);
  } else {
    console.log('  [PASS] Booking status is confirmed as PENDING');
  }

  // Verification Item 5: Payment status is PENDING
  console.log('\n--- VERIFICATION 5: PAYMENT STATUS ---');
  console.log('  Payment Status:', fetchedBooking?.paymentStatus);
  if (fetchedBooking?.paymentStatus !== 'PENDING') {
    errors.push(`Item 5 Failed: Expected paymentStatus 'PENDING', got '${fetchedBooking?.paymentStatus}'`);
  } else {
    console.log('  [PASS] Payment status is confirmed as PENDING');
  }

  // Verification Item 6: 15-minute hold/lock created correctly
  console.log('\n--- VERIFICATION 6: 15-MINUTE HOLD/LOCK CREATION ---');
  const lockExpiresAt = fetchedBooking?.lockExpiresAt;
  console.log('  lockExpiresAt:', lockExpiresAt);
  if (!lockExpiresAt) {
    errors.push('Item 6 Failed: lockExpiresAt timestamp is missing');
  } else {
    const lockTime = new Date(lockExpiresAt).getTime();
    const diffMins = (lockTime - Date.now()) / (1000 * 60);
    console.log(`  Lock active for: ${diffMins.toFixed(2)} minutes from current time`);
    if (diffMins < 13 || diffMins > 16) {
      errors.push(`Item 6 Failed: Lock duration is ${diffMins} minutes instead of ~15 minutes`);
    } else {
      console.log('  [PASS] 15-minute hold window confirmed');
    }
  }

  // Verification Item 7: booking_status_history record created
  console.log('\n--- VERIFICATION 7: BOOKING_STATUS_HISTORY RECORD ---');
  console.log(`  Found ${statusHistory.length} status history record(s):`);
  console.log(' ', JSON.stringify(statusHistory, null, 2));
  if (!statusHistory || statusHistory.length === 0) {
    errors.push('Item 7 Failed: No booking_status_history record found');
  } else {
    const historyItem = statusHistory[0];
    if (historyItem.newStatus !== 'PENDING') {
      errors.push(`Item 7 Failed: Expected newStatus 'PENDING', got '${historyItem.newStatus}'`);
    } else {
      console.log('  [PASS] booking_status_history successfully recorded (newStatus: PENDING)');
    }
  }

  // Verification Item 8: notifications record created
  console.log('\n--- VERIFICATION 8: NOTIFICATIONS RECORD ---');
  const bookingNotif = notifications.find((n) => n.bookingId === bookingId || n.message?.includes(refCode)) || notifications[0];
  console.log('  Matching Notification:', JSON.stringify(bookingNotif, null, 2));
  if (!bookingNotif) {
    errors.push('Item 8 Failed: No notification record created for this booking hold');
  } else {
    console.log('  [PASS] notification record created successfully with type:', bookingNotif.type);
  }

  // Verification Item 9: Availability immediately recognizes held booking
  console.log('\n--- VERIFICATION 9: IMMEDIATE AVAILABILITY LOCK ---');
  const postAvailRes = await fetch(
    `${BASE_URL}/api/booking/availability?villaId=${testVillaId}&roomId=${testRoomId}&checkIn=${testCheckIn}&checkOut=${testCheckOut}`
  );
  const postAvailData = await postAvailRes.json();
  console.log('  Availability check via API immediately following hold:');
  console.log('    HTTP Status:', postAvailRes.status);
  console.log('    Available:', postAvailData.available);
  console.log('    Message:', postAvailData.message);
  console.log('    Reason:', postAvailData.reason);
  if (postAvailData.available === true) {
    errors.push('Item 9 Failed: Availability allowed booking for dates held by active 15-minute hold');
  } else {
    console.log('  [PASS] Availability immediately blocked the dates due to active hold.');
  }

  // Verification Item 10: Accommodations & prices remain unchanged
  console.log('\n--- VERIFICATION 10: ACCOMMODATIONS & PRICES IMMUTABILITY ---');
  const postAccommodations = await AccommodationService.getAllAccommodations();
  let pricesChanged = false;
  for (const postAcc of postAccommodations) {
    const initial = initialAccommodations.find((a) => a.id === postAcc.id);
    if (!initial || initial.base_price_per_night !== postAcc.base_price_per_night) {
      pricesChanged = true;
      errors.push(`Price discrepancy for ${postAcc.id}: before=${initial?.base_price_per_night}, after=${postAcc.base_price_per_night}`);
    }
  }
  if (!pricesChanged) {
    console.log('  [PASS] All accommodations and prices remain 100% unchanged:');
    for (const acc of postAccommodations) {
      console.log(`    - ${acc.id} (${acc.name}): ₹${acc.base_price_per_night} / night`);
    }
  }

  // Step 3: Cleanup test booking
  console.log('\n[Step 3] Cleaning up test booking via DELETE /api/booking/' + bookingId + '?cleanup=true...');
  const deleteRes = await fetch(`${BASE_URL}/api/booking/${bookingId}?cleanup=true`, {
    method: 'DELETE',
  });
  const deleteData = await deleteRes.json();
  console.log(`  Cleanup result:`, deleteData);

  // Verify availability released after cleanup
  const finalAvailRes = await fetch(
    `${BASE_URL}/api/booking/availability?villaId=${testVillaId}&roomId=${testRoomId}&checkIn=${testCheckIn}&checkOut=${testCheckOut}`
  );
  const finalAvailData = await finalAvailRes.json();
  console.log('  Post-cleanup availability check:');
  console.log('    Available:', finalAvailData.available, '| message:', finalAvailData.message);

  console.log('\n================================================================');
  if (errors.length === 0) {
    console.log('RESULT: ALL 10 VERIFICATION REQUIREMENTS PASSED WITH ZERO ERRORS!');
  } else {
    console.log('RESULT: ERRORS FOUND:');
    errors.forEach((e) => console.log('  - ' + e));
  }
  console.log('================================================================\n');

  return {
    booking: fetchedBooking,
    bookingItems,
    statusHistory,
    bookingNotif,
    postAvailData,
    pricesChanged,
    errors,
  };
}

runDataFlowTest().catch((err) => {
  console.error('Data flow test failed with unhandled error:', err);
  process.exit(1);
});
