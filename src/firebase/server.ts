import type { ServiceAccount } from 'firebase-admin'
import { initializeApp, cert } from 'firebase-admin/app'
import serviceAccount from '../../server-credentials.json' with { type: 'json' }

if (import.meta.env.PUBLIC_EMULATOR === '1') {
    console.log('Emulator Setting Up')
    process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099'
    process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080'
}

export const app = initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
})
