import { config } from 'dotenv'
import fs from 'fs/promises'
import {
    collection,
    doc,
    getDocs,
    deleteDoc,
    writeBatch,
} from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import firebaseConfig from './client-credentials.json' with { type: 'json' }

config()

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Connect to Firestore Emulator
if (process.env.PUBLIC_EMULATOR === '1')
    connectFirestoreEmulator(db, 'localhost', 8080)

// Function to delete all documents in the products collection
async function clearProductsCollection() {
    try {
        const productsCollection = collection(db, 'products')
        const productsSnapshot = await getDocs(productsCollection)
        const deletePromises = productsSnapshot.docs.map((doc) =>
            deleteDoc(doc.ref)
        )
        await Promise.all(deletePromises)
        console.log('Products collection cleared')
    } catch (error) {
        console.error('Error clearing products collection:', error)
    }
}

// Add products to Firestore
async function addProducts() {
    try {
        // Read and parse the JSON file
        const data = await fs.readFile('./products.json', 'utf8')
        const products = JSON.parse(data).products

        // Clear existing products
        await clearProductsCollection()

        // Create a batch
        const batch = writeBatch(db)

        for (const id in products) {
            const product = products[id]
            const productRef = doc(collection(db, 'products'))
            batch.set(productRef, {
                id: parseInt(id),
                name: product.name,
                image_url: product.image_url,
                deleted: product.deleted,
            })
        }

        // Commit the batch
        await batch.commit()
        console.log('All products added in batch')
        process.exit(0)
    } catch (error) {
        console.error('Error reading products.json:', error)
        process.exit(1)
    }
}

await addProducts()
