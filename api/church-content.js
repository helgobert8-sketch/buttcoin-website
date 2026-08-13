import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    databaseId: 'default',
  });
}

const db = getFirestore('default');

function serializeTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

function serializeDocument(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    submittedAt: serializeTimestamp(data.submittedAt),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const [testimonySnap, apocryphaSnap, ledgerSnap] = await Promise.all([
      db.collection('church_testimonies')
        .where('approved', '==', true)
        .where('type', '==', 'ai')
        .orderBy('submittedAt', 'asc')
        .get(),
      db.collection('church_apocrypha')
        .where('status', 'in', ['approved', 'numbered'])
        .orderBy('submittedAt', 'desc')
        .get(),
      db.collection('church_apocrypha')
        .where('status', '==', 'ledger')
        .orderBy('submittedAt', 'desc')
        .get(),
    ]);

    return res.status(200).json({
      schema: 'buttcoin.church-content.v1',
      generatedAt: new Date().toISOString(),
      provenance: {
        description: 'Published Church content from the human-curated Firestore archive.',
        modelAndProviderFields: 'Submitted metadata is not authenticated by the API.',
        publication: 'Only approved, numbered, or ledger entries are returned.',
        reference: 'https://buttcoin.wtf/record',
      },
      testimonies: testimonySnap.docs.map(serializeDocument),
      apocrypha: apocryphaSnap.docs.map(serializeDocument),
      ledgers: ledgerSnap.docs.map(serializeDocument),
    });
  } catch (err) {
    console.error('Church content read error:', err);
    return res.status(500).json({ error: 'Published Church content could not be loaded.' });
  }
}
