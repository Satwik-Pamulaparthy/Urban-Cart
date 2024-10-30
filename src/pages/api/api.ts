import {
    collection,
    getFirestore,
    connectFirestoreEmulator,
    getDocs,
    query,
    where,
    orderBy,
    addDoc,
    deleteDoc,
    limit,
    doc,
} from 'firebase/firestore'
import type { Product } from '../../utils/types'
import { app } from '../../firebase/client'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const db = getFirestore(app)

if (import.meta.env.PUBLIC_EMULATOR === '1')
    connectFirestoreEmulator(db, 'localhost', 8080)

export const register = async (email: string, password: string) => {
    const auth = getAuth(app);

    try {
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user; // Returns the created user information
    } catch (error) {
        if (error instanceof Error) {
            
            throw new Error(`Error registering user: ${error.message}`);
        } else {
            
            throw new Error('Unknown error occurred during registration.');

        }
    }
        
        
};


export const fetchProducts = async (
    queryStr = '',
    pageSize = 10
): Promise<{ products: Product[]; totalPages: number }> => {
    const productsRef = collection(db, 'products')
    let productsQuery;

    if (queryStr) {
        productsQuery = query(
            productsRef,
            where('name', '>=', queryStr),
            where('name', '<=', queryStr + '\uf8ff'),
            orderBy('name'),
            orderBy('id')
        );
    } else {
        productsQuery = query(productsRef, orderBy('id'));
    }

    const snapshot = await getDocs(productsQuery);
    const products: Product[] = [];

    snapshot.forEach((doc) => {
        const productData = doc.data();
        products.push({
            id: productData.id,
            name: productData.name,
            image_url: productData.image_url,
            deleted: productData.deleted
        } as Product);
    });
    

    const totalPages = Math.ceil(products.length / pageSize);

    return { products, totalPages };
}

export const addProduct = async (product: Omit<Product, 'id'>) => {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(query(productsRef, orderBy('id', 'desc'), limit(1)));
    
    let newID = 1; // Default to 1 if no products exist
    if (!snapshot.empty) {
        newID = (snapshot.docs[0].data() as Product).id + 1;
    }

    const newProduct = { id: newID, ...product };
    await addDoc(productsRef, newProduct);

    return newProduct;
}

export const deleteProduct = async (productId: number) => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('id', '==', productId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const docToDelete = snapshot.docs[0];
        await deleteDoc(doc(db, 'products', docToDelete.id));
        return { id: productId };
    } else {
        throw new Error('Product not found');
    }
}