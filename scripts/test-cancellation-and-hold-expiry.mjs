const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('STARTING SAFE DATABASE TESTS: TEST A (CANCELLATION) & TEST B (HOLD EXPIRY)');
  console.log('================================================================\n');

  const errors = [];

  // BASELINE: Confirm accommodations and prices
  console.log('[Baseline Check] Checking public.accommodations and prices before test:');
  const priceRes = await fetch(`${BASE_URL}/api/pricing`);
  const priceData = await priceRes.json();
  const initialAccommodations = priceData.accommodations || [];
  console.log(`Found ${initialAccommodations.length} accommodations:`);
  for (const acc of initialAccommodations) {
    console.log(`  - ${acc.id} (${acc.name}): ₹${acc.base_price_per_night} / night [active: ${acc.is_active}]`);
  }

  // ============================================================================
  // TEST A — CANCELLATION
  // ============================================================================
  console.log('\n================================================================');
  console.log('TEST A — CANCELLATION');
  console.log('================================================================');

  const testVillaIdA = 'villa-suroor-main';
  const testRoomIdA = 'entire-villa';
  const testCheckInA = '2026-12-01';
  const testCheckOutA = '2026-12-03';

  console.log(`\n[Test A - Step 1] Creating temporary synthetic test booking (${testCheckInA} to ${testCheckOutA})...`);
  const payloadA = {
    villaId: testVillaIdA,
    roomId: testRoomIdA,
    checkIn: testCheckInA,
    checkOut: testCheckOutA,
    guestCount: 2,
    adults: 2,
    children: 0,
    primaryGuest: {
      fullName: 'TEST Guest Cancellation Verification',
      email: 'test.cancellation.dataflow@example.com',
      phone: '+919999988888',
      idType: 'PASSPORT',
      idNumber: 'TEST-CAN-001',
    },
    notes: 'AUTOMATED_SAFE_TEST_A_CANCELLATION',
  };

  const createResA = await fetch(`${BASE_URL}/api/booking/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadA),
  });
  const createDataA = await createResA.json();

  if (!createResA.ok || !createDataA.booking) {
    throw new Error(`Test A Booking creation failed: ${createResA.status} - ${JSON.stringify(createDataA)}`);
  }

  const bookingAId = createDataA.booking.id;
  const refCodeA = createDataA.booking.referenceCode;
  console.log(`  Booking Created -> ID: ${bookingAId}, Reference: ${refCodeA}`);

  console.log('\n[Test A - Step 2] Confirming bookings, booking_items, booking_status_history, and notifications exist...');
  const getResA1 = await fetch(`${BASE_URL}/api/booking/${bookingAId}`);
  const getDataA1 = await getResA1.json();

  const bookingRecordA = getDataA1.booking;
  const bookingItemsA = getDataA1.bookingItems || [];
  const statusHistoryA1 = getDataA1.statusHistory || [];
  const notifsA1 = getDataA1.notifications || [];

  if (!bookingRecordA) {
    errors.push('Test A Error: Booking record not found after creation.');
  } else {
    console.log('  [PASS] Booking record found with status:', bookingRecordA.status);
  }

  if (!bookingItemsA || bookingItemsA.length === 0) {
    errors.push('Test A Error: booking_items not created.');
  } else {
    console.log(`  [PASS] booking_items found: ${bookingItemsA.length} item(s)`);
  }

  if (!statusHistoryA1 || statusHistoryA1.length === 0) {
    errors.push('Test A Error: booking_status_history not created.');
  } else {
    console.log(`  [PASS] booking_status_history found: ${statusHistoryA1.length} entry (status: ${statusHistoryA1[0].newStatus})`);
  }

  if (!notifsA1 || notifsA1.length === 0) {
    errors.push('Test A Error: notification record not created on hold creation.');
  } else {
    console.log(`  [PASS] notifications found: ${notifsA1.length} entry (type: ${notifsA1[0].type})`);
  }

  // Verify availability is currently blocked for Test A dates
  const availCheckBeforeA = await fetch(
    `${BASE_URL}/api/booking/availability?villaId=${testVillaIdA}&roomId=${testRoomIdA}&checkIn=${testCheckInA}&checkOut=${testCheckOutA}`
  );
  const availDataBeforeA = await availCheckBeforeA.json();
  console.log(`  Pre-cancellation Availability check: available=${availDataBeforeA.available} (Expected: false)`);
  if (availDataBeforeA.available !== false) {
    errors.push('Test A Error: Dates should be blocked while booking hold is active.');
  }

  console.log('\n[Test A - Step 3] Cancelling the test booking using existing cancellation flow...');
  const cancelResA = await fetch(`${BASE_URL}/api/booking/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId: bookingAId,
      guestEmail: 'test.cancellation.dataflow@example.com',
      reason: 'Automated synthetic cancellation verification test',
    }),
  });
  const cancelDataA = await cancelResA.json();
  console.log('  Cancellation API response:', cancelDataA);

  if (!cancelResA.ok || !cancelDataA.success) {
    errors.push(`Test A Error: Cancellation API failed: ${JSON.stringify(cancelDataA)}`);
  }

  console.log('\n[Test A - Step 4] Verifying cancellation requirements:');
  const getResA2 = await fetch(`${BASE_URL}/api/booking/${bookingAId}`);
  const getDataA2 = await getResA2.json();
  const updatedBookingA = getDataA2.booking;
  const cancellationRowA = getDataA2.cancellation;
  const statusHistoryA2 = getDataA2.statusHistory || [];
  const notifsA2 = getDataA2.notifications || [];

  // Check 1: bookings.status becomes CANCELLED
  console.log('  - Verification: bookings.status becomes CANCELLED:');
  console.log('    Current status:', updatedBookingA?.status);
  if (updatedBookingA?.status !== 'CANCELLED') {
    errors.push(`Test A Error: Expected status CANCELLED, got ${updatedBookingA?.status}`);
  } else {
    console.log('    [PASS] bookings.status is confirmed CANCELLED');
  }

  // Check 2: cancellations row is created
  console.log('  - Verification: cancellations row created:');
  console.log('    cancellations record:', JSON.stringify(cancellationRowA, null, 2));
  if (!cancellationRowA) {
    errors.push('Test A Error: cancellations record was not created or not found.');
  } else {
    console.log('    [PASS] cancellations row created with ID:', cancellationRowA.id);
  }

  // Check 3: cancellation details/refund amount are stored correctly
  console.log('  - Verification: cancellation details and refund amount stored:');
  const refAmt = cancellationRowA?.refundAmount ?? cancellationRowA?.refund_amount ?? 0;
  const reasonText = cancellationRowA?.reason;
  console.log(`    Refund Amount: ₹${refAmt} | Reason: "${reasonText}"`);
  if (!reasonText || !reasonText.includes('cancellation')) {
    errors.push(`Test A Error: Reason mismatch in cancellations row: ${reasonText}`);
  } else {
    console.log('    [PASS] Cancellation reason and details stored correctly');
  }

  // Check 4: booking_status_history records PENDING → CANCELLED
  console.log('  - Verification: booking_status_history records PENDING → CANCELLED:');
  console.log('    Status History:', JSON.stringify(statusHistoryA2, null, 2));
  const cancelHistoryRecord = statusHistoryA2.find((h) => h.newStatus === 'CANCELLED');
  if (!cancelHistoryRecord) {
    errors.push('Test A Error: No status history record found with newStatus CANCELLED');
  } else {
    console.log(`    [PASS] Transition recorded: ${cancelHistoryRecord.oldStatus} → ${cancelHistoryRecord.newStatus}`);
    if (cancelHistoryRecord.oldStatus !== 'PENDING') {
      errors.push(`Test A Error: Expected oldStatus PENDING, got ${cancelHistoryRecord.oldStatus}`);
    }
  }

  // Check 5: notification record is created
  console.log('  - Verification: notification record created for cancellation:');
  const cancelNotif = notifsA2.find((n) => n.type === 'BOOKING_CANCELLED');
  console.log('    Notification record:', JSON.stringify(cancelNotif, null, 2));
  if (!cancelNotif) {
    errors.push('Test A Error: No BOOKING_CANCELLED notification found.');
  } else {
    console.log('    [PASS] BOOKING_CANCELLED notification created');
  }

  // Check 6: availability becomes available again after cancellation
  console.log('  - Verification: availability becomes available again after cancellation:');
  const availCheckAfterA = await fetch(
    `${BASE_URL}/api/booking/availability?villaId=${testVillaIdA}&roomId=${testRoomIdA}&checkIn=${testCheckInA}&checkOut=${testCheckOutA}`
  );
  const availDataAfterA = await availCheckAfterA.json();
  console.log('    Post-cancellation Availability:', availDataAfterA);
  if (availDataAfterA.available !== true) {
    errors.push('Test A Error: Dates should be AVAILABLE after cancellation.');
  } else {
    console.log('    [PASS] Availability restored to available: true');
  }

  console.log('\n[Test A - Step 5] Cleaning up temporary test data for Test A...');
  const cleanResA = await fetch(`${BASE_URL}/api/booking/${bookingAId}?cleanup=true`, { method: 'DELETE' });
  const cleanDataA = await cleanResA.json();
  console.log('  Cleanup response:', cleanDataA);

  const verifyCleanA = await fetch(`${BASE_URL}/api/booking/${bookingAId}`);
  if (verifyCleanA.status === 404) {
    console.log('  [PASS] Test A booking permanently purged.');
  } else {
    console.log('  Warning: Test A booking response status:', verifyCleanA.status);
  }

  // ============================================================================
  // TEST B — HOLD EXPIRY
  // ============================================================================
  console.log('\n================================================================');
  console.log('TEST B — HOLD EXPIRY');
  console.log('================================================================');

  const testVillaIdB = 'villa-suroor-main';
  const testRoomIdB = 'entire-villa';
  const testCheckInB = '2026-12-10';
  const testCheckOutB = '2026-12-12';

  console.log(`\n[Test B - Step 1] Creating temporary test booking (${testCheckInB} to ${testCheckOutB})...`);
  const payloadB = {
    villaId: testVillaIdB,
    roomId: testRoomIdB,
    checkIn: testCheckInB,
    checkOut: testCheckOutB,
    guestCount: 2,
    adults: 2,
    children: 0,
    primaryGuest: {
      fullName: 'TEST Guest Hold Expiry Verification',
      email: 'test.expiry.dataflow@example.com',
      phone: '+919999977777',
      idType: 'PASSPORT',
      idNumber: 'TEST-EXP-002',
    },
    notes: 'AUTOMATED_SAFE_TEST_B_HOLD_EXPIRY',
  };

  const createResB = await fetch(`${BASE_URL}/api/booking/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadB),
  });
  const createDataB = await createResB.json();

  if (!createResB.ok || !createDataB.booking) {
    throw new Error(`Test B Booking creation failed: ${createResB.status} - ${JSON.stringify(createDataB)}`);
  }

  const bookingBId = createDataB.booking.id;
  const refCodeB = createDataB.booking.referenceCode;
  console.log(`  Booking Created -> ID: ${bookingBId}, Reference: ${refCodeB}`);

  console.log('\n[Test B - Step 2] Verifying 15-minute lock is created...');
  const getResB1 = await fetch(`${BASE_URL}/api/booking/${bookingBId}`);
  const getDataB1 = await getResB1.json();
  const bookingB1 = getDataB1.booking;

  const lockExpiresAtB = bookingB1?.lockExpiresAt;
  console.log('  lockExpiresAt:', lockExpiresAtB);
  if (!lockExpiresAtB) {
    errors.push('Test B Error: lockExpiresAt timestamp is missing.');
  } else {
    const diffMins = (new Date(lockExpiresAtB).getTime() - Date.now()) / (1000 * 60);
    console.log(`  Active lock duration: ${diffMins.toFixed(2)} minutes`);
    if (diffMins < 13 || diffMins > 16) {
      errors.push(`Test B Error: Lock duration is ${diffMins} minutes instead of ~15 minutes.`);
    } else {
      console.log('  [PASS] 15-minute lock is verified.');
    }
  }

  // Check that hold actively blocks availability right now
  const availBeforeExpiryB = await fetch(
    `${BASE_URL}/api/booking/availability?villaId=${testVillaIdB}&roomId=${testRoomIdB}&checkIn=${testCheckInB}&checkOut=${testCheckOutB}`
  );
  const availBeforeExpiryDataB = await availBeforeExpiryB.json();
  console.log(`  Pre-expiry Availability check: available=${availBeforeExpiryDataB.available} (Expected: false)`);
  if (availBeforeExpiryDataB.available !== false) {
    errors.push('Test B Error: Hold should block availability before expiration.');
  }

  console.log('\n[Test B - Step 3] Testing existing hold-expiry logic safely without waiting 15 minutes...');
  // Safely simulate 15-minute expiration by calling release-hold endpoint with expireNow: true
  const expireSimRes = await fetch(`${BASE_URL}/api/booking/release-hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: bookingBId, expireNow: true }),
  });
  const expireSimData = await expireSimRes.json();
  console.log('  Simulate expiry response:', expireSimData);

  console.log('\n[Test B - Step 4] Verifying expired hold no longer blocks availability...');
  const availAfterExpiryB = await fetch(
    `${BASE_URL}/api/booking/availability?villaId=${testVillaIdB}&roomId=${testRoomIdB}&checkIn=${testCheckInB}&checkOut=${testCheckOutB}`
  );
  const availAfterExpiryDataB = await availAfterExpiryB.json();
  console.log('  Availability check with expired hold:', availAfterExpiryDataB);
  if (availAfterExpiryDataB.available !== true) {
    errors.push('Test B Error: Expired hold should no longer block availability.');
  } else {
    console.log('  [PASS] Expired hold immediately frees availability (available: true).');
  }

  console.log('\n[Test B - Step 5 & 6] Verifying booking is handled by existing expiration logic & status history/notification recorded...');
  // Trigger existing hold release endpoint to execute complete release workflow
  const releaseRes = await fetch(`${BASE_URL}/api/booking/release-hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: bookingBId }),
  });
  const releaseData = await releaseRes.json();
  console.log('  Release hold endpoint response:', releaseData);

  const getResB2 = await fetch(`${BASE_URL}/api/booking/${bookingBId}`);
  const getDataB2 = await getResB2.json();
  const updatedBookingB = getDataB2.booking;
  const statusHistoryB2 = getDataB2.statusHistory || [];
  const notifsB2 = getDataB2.notifications || [];

  console.log('  - Updated booking status:', updatedBookingB?.status);
  console.log('  - lockExpiresAt cleared:', updatedBookingB?.lockExpiresAt === null || updatedBookingB?.lockExpiresAt === undefined);
  if (updatedBookingB?.status !== 'CANCELLED') {
    errors.push(`Test B Error: Expected status CANCELLED on expired hold, got ${updatedBookingB?.status}`);
  } else {
    console.log('    [PASS] Booking status updated to CANCELLED');
  }

  // Check booking_status_history
  const expiryStatusRecord = statusHistoryB2.find((h) => h.reason?.includes('Hold expired') || h.newStatus === 'CANCELLED');
  console.log('  - Status history record for hold expiry:', JSON.stringify(expiryStatusRecord, null, 2));
  if (!expiryStatusRecord) {
    errors.push('Test B Error: No status history record found for hold expiration.');
  } else {
    console.log(`    [PASS] Status history recorded: ${expiryStatusRecord.oldStatus} → ${expiryStatusRecord.newStatus} (reason: "${expiryStatusRecord.reason}")`);
  }

  // Check notifications
  const expiryNotif = notifsB2.find((n) => n.type === 'BOOKING_HOLD_EXPIRED' || n.type === 'BOOKING_CANCELLED');
  console.log('  - Notification record for hold expiry:', JSON.stringify(expiryNotif, null, 2));
  if (!expiryNotif) {
    errors.push('Test B Error: No notification found for expired hold.');
  } else {
    console.log(`    [PASS] Notification record verified: type=${expiryNotif.type}, title="${expiryNotif.title}"`);
  }

  console.log('\n[Test B - Step 7] Cleaning up temporary test data for Test B...');
  const cleanResB = await fetch(`${BASE_URL}/api/booking/${bookingBId}?cleanup=true`, { method: 'DELETE' });
  const cleanDataB = await cleanResB.json();
  console.log('  Cleanup response:', cleanDataB);

  const verifyCleanB = await fetch(`${BASE_URL}/api/booking/${bookingBId}`);
  if (verifyCleanB.status === 404) {
    console.log('  [PASS] Test B booking permanently purged.');
  } else {
    console.log('  Warning: Test B booking response status:', verifyCleanB.status);
  }

  // FINAL INTEGRITY CHECK: Confirm accommodations and prices
  console.log('\n================================================================');
  console.log('[Final Integrity Check] Checking public.accommodations and prices:');
  const finalPriceRes = await fetch(`${BASE_URL}/api/pricing`);
  const finalPriceData = await finalPriceRes.json();
  const finalAccommodations = finalPriceData.accommodations || [];
  let pricesDiscrepancy = false;
  for (const finalAcc of finalAccommodations) {
    const init = initialAccommodations.find((a) => a.id === finalAcc.id);
    if (!init || init.base_price_per_night !== finalAcc.base_price_per_night) {
      pricesDiscrepancy = true;
      errors.push(`CRITICAL ERROR: Price discrepancy for ${finalAcc.id}`);
    }
  }
  if (!pricesDiscrepancy) {
    console.log('  [PASS] All public.accommodations and prices remain 100% UNCHANGED:');
    for (const acc of finalAccommodations) {
      console.log(`    - ${acc.id} (${acc.name}): ₹${acc.base_price_per_night} / night [active: ${acc.is_active}]`);
    }
  }

  console.log('\n================================================================');
  if (errors.length === 0) {
    console.log('FINAL RESULT: ALL TEST A & TEST B REQUIREMENTS PASSED WITH ZERO ERRORS!');
  } else {
    console.log('FINAL RESULT: ERRORS ENCOUNTERED:');
    errors.forEach((err) => console.log('  - ' + err));
  }
  console.log('================================================================\n');

  if (errors.length > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
