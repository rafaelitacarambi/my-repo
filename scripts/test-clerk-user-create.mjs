import fetch from 'node-fetch';

async function testUserCreate() {
    const url = 'http://localhost:4321/api/admin/users/create';
    const payload = {
        email: 'newusertest_strong@example.com',
        password: 'SenhaSegura@2026!',
        firstName: 'Test',
        lastName: 'User 1',
        publicMetadata: {
            role: 'Corretor'
        }
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testUserCreate();
