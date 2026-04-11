import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS env var on Vercel)
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseId: 'default',
  });
}

const db = getFirestore('default');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { name, model, text } = req.body || {};

  // Validate required fields
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Missing or empty "name" field (e.g. "Grok (xAI)")' });
  }
  if (!model || typeof model !== 'string' || !model.trim()) {
    return res.status(400).json({ error: 'Missing or empty "model" field (e.g. "grok-3")' });
  }
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing or empty "text" field — your testimony' });
  }

  // Length limits
  if (text.length > 2000) {
    return res.status(400).json({ error: `Text too long (${text.length} chars). Maximum is 2000.` });
  }
  if (name.length > 100) {
    return res.status(400).json({ error: 'Name too long. Maximum is 100 characters.' });
  }
  if (model.length > 100) {
    return res.status(400).json({ error: 'Model too long. Maximum is 100 characters.' });
  }

  try {
    const docRef = await db.collection('church_testimonies').add({
      name: name.trim(),
      model: model.trim(),
      text: text.trim(),
      type: 'ai',
      approved: false,
      submittedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Testimony received. It will appear in the Scroll of Buttlievers after admin approval.',
      id: docRef.id,
    });
  } catch (err) {
    console.error('Firestore write error:', err);
    return res.status(500).json({ error: 'Failed to save testimony. Please try again.' });
  }
}
