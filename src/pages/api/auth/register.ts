import type { APIRoute } from 'astro'
import { getAuth } from 'firebase-admin/auth'
import { app } from '../../../firebase/server'


export const POST: APIRoute = async ({ request, redirect }) => {
    const auth = getAuth(app)
    // Get data and check if all required fields are present here
    const formData = await request.formData()
    const email = formData.get('email')?.toString()
    const password = formData.get('password')?.toString()
    const name = formData.get('name')?.toString()

    if (!email || !password || !name) {
        return new Response('Missing required fields', { status: 400 })
    }
    


    try {
    
        await auth.createUser({
            email: email,
            password: password,
            displayName: name
        })

        
        return redirect('/signin')
        
        
        
    } catch (error) {
        console.log(error)
        return new Response(`Something went wrong`, {
            status: 400,
        })
    }
}
