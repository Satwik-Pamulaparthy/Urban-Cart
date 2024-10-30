import { chromium } from 'playwright'
import { describe, expect, beforeAll, afterAll, test } from 'vitest'
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import type { Browser, Page } from 'playwright'
import 'dotenv/config'
import serviceAccount from '../server-credentials.json'

let browser: Browser
let page: Page
const testUID: string[] = []
const addedProducts: string[] = []

process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099'
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080'

const app = initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
})
const auth = getAuth(app)
const db = getFirestore(app)

function makeRandomString(lengthOfString: number) {
    let randomString = ''
    const charactersString =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = charactersString.length
    let i
    for (i = 0; i < lengthOfString; i++) {
        randomString += charactersString.charAt(
            Math.floor(Math.random() * charactersLength)
        )
    }
    return randomString
}

function generateUserCredentials() {
    const testName = makeRandomString(5)
    const testEmail =
        makeRandomString(8).toLowerCase() +
        '@' +
        makeRandomString(4).toLowerCase() +
        '.com'
    const testPassword = makeRandomString(8)

    return { name: testName, email: testEmail, password: testPassword }
}

async function createAndLoginUser(credentials: {
    name: string
    email: string
    password: string
}) {
    const createdUser = await auth.createUser({
        email: credentials.email,
        password: credentials.password,
        displayName: credentials.name,
    })

    testUID.push(createdUser.uid)

    await page.goto('http://localhost:3000/')
    await page.waitForURL('http://localhost:3000/signin')
    // should navigate to signin page
    expect(page.url()).toBe('http://localhost:3000/signin')

    await page.fill('#emailId', credentials.email)

    await page.fill('#password', credentials.password)

    await page.click('#loginButton')
}

beforeAll(async () => {
    try {
        browser = await chromium.launch()
        page = await browser.newPage()
        await page.goto('http://localhost:3000/')
    } catch (error) {
        throw new Error(error as string)
    }
})

afterAll(async () => {
    for (const uid of testUID) {
        await auth.deleteUser(uid)
    }

    for (const id of addedProducts) {
        await db.collection('products').doc(id).delete()
    }
    await page.close()
    await browser.close()
})

describe('Homework 3 Integration Tests', () => {
    test('(10pts) 1. Unauthenticated user cannot access dashboard', async () => {
        await page.goto('http://localhost:3000')
        await page.waitForURL('http://localhost:3000/signin')
        expect(page.url()).toBe('http://localhost:3000/signin')

        await page.goto('http://localhost:3000/dashboard')
        await page.waitForURL('http://localhost:3000/signin')
        expect(page.url()).toBe('http://localhost:3000/signin')
    })

    test('(10pts) 2. Register a user successfully', async () => {
        const testName = makeRandomString(5)
        const testEmail =
            makeRandomString(8).toLowerCase() +
            '@' +
            makeRandomString(4).toLowerCase() +
            '.com'
        const testPassword = makeRandomString(8)

        await page.goto('http://localhost:3000/')
        await page.waitForURL('http://localhost:3000/signin')

        // should navigate to signin page
        expect(page.url()).toBe('http://localhost:3000/signin')
        await page.click("a[href='/register']")

        // should navigate to register page
        await page.waitForURL('http://localhost:3000/register')
        expect(page.url()).toBe('http://localhost:3000/register')
        await page.fill('#name', testName)
        await page.fill('#email', testEmail)
        await page.fill('#password', testPassword)

        await page.click('#createUserButton')

        // should navigate to signin page
        await page.waitForURL('http://localhost:3000/signin')
        expect(page.url()).toBe('http://localhost:3000/signin')

        const dump = await auth.listUsers()
        let uid
        for (const user of dump.users) {
            if (user.email === testEmail) {
                uid = user.uid
                testUID.push(uid)
                break
            }
        }

        expect(uid).toBeDefined()
    })

    test('(3pts) 3. Register a user with missing form data', async () => {
        const testEmail =
            makeRandomString(8).toLowerCase() +
            '@' +
            makeRandomString(4).toLowerCase() +
            '.com'
        const testPassword = makeRandomString(8)

        await page.goto('http://localhost:3000/')
        await page.waitForURL('http://localhost:3000/signin')

        // should navigate to signin page
        expect(page.url()).toBe('http://localhost:3000/signin')
        await page.click("a[href='/register']")

        // should navigate to register page
        await page.waitForURL('http://localhost:3000/register')
        expect(page.url()).toBe('http://localhost:3000/register')
        await page.fill('#email', testEmail)
        await page.fill('#password', testPassword)

        const responsePromise = page.waitForResponse(
            (response) =>
                response.url().includes('/register') &&
                response.status() === 400
        )
        await page.click('#createUserButton')

        // Should receive a 400 status code
        expect((await responsePromise).status()).toBe(400)
    })

    test('(10pts) 4. Authenticate a user successfully', async () => {
        const testUser = generateUserCredentials()

        await createAndLoginUser(testUser)

        await page.waitForURL('http://localhost:3000/dashboard')
        expect(page.url()).toBe('http://localhost:3000/dashboard')

        await page.click('#logout')

        await page.waitForURL('http://localhost:3000/signin')
        expect(page.url()).toBe('http://localhost:3000/signin')
    })
    test('(10pts) 5. Displays products on the home page', async () => {
        const testUser = generateUserCredentials()
        await createAndLoginUser(testUser)

        await page.waitForURL('http://localhost:3000/dashboard')
        expect(page.url()).toBe('http://localhost:3000/dashboard')

        await page.waitForSelector('.product-card', { state: 'visible' })
        const productCards = await page.$$('.product-card')
        expect(productCards.length).toBe(10)

        const paginationLinks = await page.$$('.pagination a')
        expect(paginationLinks.length).toBeGreaterThan(0)
    })
    test('(10pts) 6.Navigates through pages and displays correct products', async () => {
        const getProductNames = async () => {
            await page.waitForSelector('.product-card h3')
            return await page.$$eval('.product-card h3', (elements) =>
                elements.map((el) => el.textContent?.trim()).filter(Boolean)
            )
        }

        const getTotalPages = async () => {
            const paginationLinks = await page.$$('.pagination a')
            return paginationLinks.length
        }

        // Get total number of pages
        const totalPages = await getTotalPages()

        // Select three random pages
        const pagesToCheck = []
        for (let i = 0; i < 3; i++) {
            pagesToCheck.push(Math.floor(Math.random() * totalPages) + 1)
        }

        for (const pageNumber of pagesToCheck) {
            // Navigate to the page
            await page.click(`.pagination a:nth-child(${pageNumber})`)
            await page.waitForFunction((pageNum) => {
                const activeElement = document.querySelector(
                    '.pagination a.active'
                )
                return (
                    activeElement &&
                    activeElement.textContent === pageNum.toString()
                )
            }, pageNumber)

            await page.waitForSelector('.product-card', { state: 'visible' })

            // Get products from the page
            const currentProducts = await getProductNames()

            // firestore check
            const dbProducts = await db
                .collection('products')
                .where('deleted', '==', false)
                .orderBy('id', 'asc')
                .limit(10)
                .offset((pageNumber - 1) * 10)
                .get()

            const dbProductNames = dbProducts.docs.map((doc) =>
                doc.data().name.trim()
            )

            expect(currentProducts).toEqual(dbProductNames)

            // Additional check: ensure the correct page is marked as active
            const activePage = await page.$eval(
                '.pagination a.active',
                (el) => el.textContent
            )
            expect(activePage).toBe(pageNumber.toString())
        }
    })
    test('(10pts) 7. Returns correct number of products for pagination', async () => {
        // Get total number of products from the database
        const totalProductsResult = await db
            .collection('products')
            .where('deleted', '==', false)
            .get()

        const totalProducts = totalProductsResult.size

        // Get number of pages from the UI
        const totalPages = await page.$$eval(
            '.pagination a',
            (elements) => elements.length
        )
        const expectedPages = Math.ceil(totalProducts / 10)
        expect(totalPages).toBe(expectedPages)

        // Test for accessing a page beyond the total number of pages
        await page.goto(`http://localhost:3000/?page=${totalPages + 100}`)

        await page.waitForSelector('p', { state: 'visible' })
        const p = await page.textContent('p')
        expect(p).toMatch('No products found.')

        const activePageNumber = await page.$eval(
            '.pagination a.active',
            (el) => el.textContent
        )
        expect(activePageNumber).toBe('1')
    })
    test('(10pts) 8. Adds a new product and confirms it appears on the page', async () => {
        const maxId = (
            await db.collection('products').orderBy('id', 'desc').limit(1).get()
        ).docs[0].data().id

        const newProductName = makeRandomString(10)
        const newProductImage = 'http://localhost:3000/placeholder.png'
        await page.goto('http://localhost:3000/dashboard')
        await page.waitForURL('http://localhost:3000/dashboard')
        // Click on the Add Product icon
        await page.click('header a.header-link img[alt="Add Product"]')
        // Wait for the add product form to be visible
        await page.waitForSelector('form', { state: 'visible' })

        // Check that the title is correct
        const title = await page.$eval('h2', (el) => el.textContent)
        expect(title).toBe('Add New Product')

        // Fill in the form
        await page.fill('#name', newProductName)
        await page.fill('#imageUrl', newProductImage)

        // Submit the form
        const button = await page.waitForSelector('#submitButton')
        await button.click()

        // Verify automatic navigation to homepage
        await page.waitForSelector('.product-list')

        // Verify the product was added to the database
        const addedProduct = await db
            .collection('products')
            .where('name', '==', newProductName)
            .where('deleted', '==', false)
            .get()

        expect(addedProduct.docs.length).toBe(1)
        expect(addedProduct.docs[0].data().name).toBe(newProductName)
        expect(addedProduct.docs[0].data().image_url).toBe(newProductImage)
        expect(addedProduct.docs[0].data().id).toBe(maxId + 1)

        addedProducts.push(addedProduct.docs[0].id)

        // Verify that the product is visible on the page
        const totalProductsResult = await db
            .collection('products')
            .where('deleted', '==', false)
            .get()
        const totalProducts = totalProductsResult.size
        const productsPerPage = 10
        const lastPage = Math.ceil(totalProducts / productsPerPage)
        await page.click(`.pagination a:nth-child(${lastPage})`)

        expect(
            await page
                .getByRole('heading', { name: newProductName, level: 3 })
                .count()
        ).toBe(1)
    }, 10000)

    test('(10pts) 9. Searches for a product and displays the results', async () => {
        const radix = makeRandomString(5)
        const newProductName = radix + makeRandomString(5)
        const newProductImage = 'http://localhost:3000/placeholder.png'

        const q = await db
            .collection('products')
            .orderBy('id', 'desc')
            .limit(1)
            .get()
        const maxId = q.docs.length > 0 ? q.docs[0].data().id : 0

        // Add a new product for this test
        const addedProduct = await db.collection('products').add({
            name: newProductName,
            image_url: newProductImage,
            deleted: false,
            id: maxId + 1,
        })
        addedProducts.push(addedProduct.id)
        // Click on the Home icon to go back to the product list
        await page.click('header a.header-link img[alt="Home"]')

        // Write a wrong query and verify that the items are not displayed
        let query = makeRandomString(5)
        await page.fill('#search-query', query)
        // Verify that the value is set correctly
        expect(
            await page.$eval(
                '#search-query',
                (el) => (el as HTMLInputElement).value
            )
        ).toBe(query)

        let count = await page
            .getByRole('heading', { name: newProductName, level: 3 })
            .count()
        expect(count).toBe(0)
        // Verify that the error message is displayed
        await page.waitForSelector('p', { state: 'visible' })
        const p = await page.textContent('p')
        expect(p).toMatch('No products found.')

        // Write the correct query and verify that the items are displayed
        query = radix
        await page.fill('#search-query', query)
        await page.waitForSelector('.product-card', { state: 'visible' })
        count = await page
            .getByRole('heading', { name: newProductName, level: 3 })
            .count()
        expect(count).toBe(1)
        count = await page.getByText('No products found.').count()
        expect(count).toBe(0)

        // Delete the product after the test
        await db.collection('products').doc(addedProduct.id).delete()
    }, 10000)

    test('(10pts) 10. Deletes a product and confirms it is not visible', async () => {
        const newProductName = makeRandomString(10)
        const newProductImage = 'http://localhost:5173/placeholder.png'

        // Found greatest ID
        const q = await db
            .collection('products')
            .orderBy('id', 'desc')
            .limit(1)
            .get()
        const maxId = q.docs.length > 0 ? q.docs[0].data().id : 0

        const addedProduct = await db.collection('products').add({
            name: newProductName,
            image_url: newProductImage,
            deleted: false,
            id: maxId + 1,
        })
        addedProducts.push(addedProduct.id)

        // Click on the Delete Product icon
        await page.click('header a.header-link img[alt="Delete Product"]')
        await page.waitForSelector('form', { state: 'visible' })

        // Check that the title is correct
        const title = await page.$eval('h2', (el) => el.textContent?.trim())
        expect(title).toBe('Delete Product')

        // Fill in the delete form with the product ID
        await page.fill('#productId', (maxId + 1).toString())

        // Submit the delete form
        const button = await page.getByRole('button', {
            name: 'Delete Product',
        })
        //Take a screenshot

        await button.click({ force: true })
        await page.waitForSelector('.product-list')

        const isDeleted = await db
            .collection('products')
            .where('name', '==', newProductName)
            .get()
        expect(isDeleted.docs.length).toBe(0)

        // Calculate the number of pages and directly navigate to the last page
        const totalProductsResult = await db
            .collection('products')
            .where('deleted', '==', false)
            .get()
        const totalProducts = totalProductsResult.size
        const productsPerPage = 10
        const lastPage = Math.ceil(totalProducts / productsPerPage)
        await page.click(`.pagination a:nth-child(${lastPage})`)

        expect(
            await page
                .getByRole('heading', { name: newProductName, level: 3 })
                .count()
        ).toBe(0)
    }, 20000)
})
