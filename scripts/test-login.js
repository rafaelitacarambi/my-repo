import https from 'https';

const email = 'terrassaimoveis@gmail.com';
const password = 'Mirian08*';

async function testLogin() {
    console.log('Testing Valuegaia login with session...');

    const url = 'https://signin.valuegaia.com.br/?provider=imob';

    try {
        // 1. GET the login page
        const getRes = await fetch(url, {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        // Extract cookies
        const cookies = getRes.headers.get('set-cookie');
        let cookieMap = {};
        if (cookies) {
            // Super basic cookie parsing for __goc_session__ and ASP.NET_SessionId
            cookies.split(', ').forEach(c => {
                const parts = c.split(';')[0].split('=');
                if (parts.length >= 2) cookieMap[parts[0]] = parts[1];
            });
        }
        const cookieHeader = Object.keys(cookieMap).map(k => `${k}=${cookieMap[k]}`).join('; ');
        console.log('Got initial cookies:', cookieHeader);

        const html = await getRes.text();

        // Extract hidden inputs (like __RequestVerificationToken)
        let bodyData = new URLSearchParams({
            email: email,
            password: password,
            provider: 'imob'
        });

        const hiddenInputRegex = /<input[^>]*type=["']hidden["'][^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["']/gi;
        let match;
        while ((match = hiddenInputRegex.exec(html)) !== null) {
            bodyData.set(match[1], match[2]);
            console.log('Found hidden input:', match[1], '=', match[2]);
        }

        // 2. POST the login
        console.log('Submitting login...');
        const postRes = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
                'Cookie': cookieHeader,
                'Referer': url
            },
            body: bodyData.toString(),
            redirect: 'manual'
        });

        console.log('POST Status:', postRes.status);
        console.log('POST Headers:', Object.fromEntries(postRes.headers.entries()));

        const postCookies = postRes.headers.get('set-cookie');
        console.log('POST Cookies Set:', postCookies);

        const postHtml = await postRes.text();

        // If successful, it usually redirects (302) to / or a dashboard.
        // Let's check the response.
        if (postRes.status === 302 || postRes.status === 301) {
            console.log('SUCCESS! Redirecting to:', postRes.headers.get('location'));
        } else {
            console.log('Login failed. Response:', postHtml.substring(0, 500));
            if (postHtml.includes('Inválido') || postHtml.includes('invalida') || postHtml.includes('erro')) {
                console.log('Credentials might be invalid or there is a captcha.');
            }
        }

    } catch (error) {
        console.error('Error logging in:', error);
    }
}

testLogin();
