import type { APIRoute } from 'astro';
import { createClerkClient } from '@clerk/backend';

// Initialize Clerk client
const clerkClient = createClerkClient({
    secretKey: import.meta.env.CLERK_SECRET_KEY,
    publishableKey: import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY,
});

export const POST: APIRoute = async ({ request }) => {
    try {
        const payload = await request.json();
        console.log("Creating Clerk User with payload:", JSON.stringify(payload, null, 2));

        const { email, password, firstName, lastName, publicMetadata } = payload;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password are required' }), { status: 400 });
        }

        // Create the user in Clerk
        const user = await clerkClient.users.createUser({
            emailAddress: [email],
            password: password,
            firstName: firstName || '',
            lastName: lastName || '',
            publicMetadata: publicMetadata || {},
        });

        return new Response(JSON.stringify({
            success: true,
            clerkUserId: user.id
        }), { status: 200 });

    } catch (error: any) {
        console.error("Clerk Create User Error:", error);

        // Check if it's a Clerk API error (usually contains 'errors' array)
        const clerkErrors = error.errors;
        let errorMessage = error.message;

        if (clerkErrors && clerkErrors.length > 0) {
            errorMessage = clerkErrors[0].message || clerkErrors[0].longMessage || errorMessage;
        }

        return new Response(JSON.stringify({ error: errorMessage || 'Failed to create user in Clerk' }), { status: 500 });
    }
};
