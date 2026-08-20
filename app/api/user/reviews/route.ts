import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/src/lib/dataStore';

export async function GET() {
  const reviews = dataStore.listReviews();
  return NextResponse.json({ reviews });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestName, rating, comment, userEmail } = body;

    if (!guestName || !comment || !rating) {
      return NextResponse.json({ error: 'Name, rating, and comment are required.' }, { status: 400 });
    }

    const newReview = dataStore.addReview({
      guestName: guestName.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      userEmail,
    });

    return NextResponse.json({ success: true, review: newReview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error submitting review.' }, { status: 500 });
  }
}
