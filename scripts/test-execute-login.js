import https from 'https';

const email = 'terrassaimoveis@gmail.com';
const password = 'Mirian08*';
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function testExecuteLogin() {
    const url1 = 'https://signin.valuegaia.com.br/Handlers/ExecuteLogin.ashx';
    const postData1 = { email, password, provider: 'imob', callback: null, captcha: undefined, ipOrigin: '' };

    try {
        const res1 = await fetch(url1, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': userAgent,
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Origin': 'https://signin.valuegaia.com.br',
                'Referer': 'https://signin.valuegaia.com.br/?provider=imob',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(postData1)
        });

        let cookiesStr = res1.headers.get('set-cookie') || '';
        console.log('Step 1 status:', res1.status);

        const url2 = 'https://imob.valuegaia.com.br/login-valida.aspx';
        const postData2 = new URLSearchParams({
            email: email,
            password: password,
            page: '',
            value: '',
            gaiaads_accesstoken: '',
            gaiaads_refreshtoken: ''
        });

        const res2 = await fetch(url2, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Origin': 'https://signin.valuegaia.com.br',
                'Referer': 'https://signin.valuegaia.com.br/',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-site',
                'Sec-Fetch-User': '?1'
            },
            body: postData2.toString(),
            redirect: 'manual'
        });

        console.log('Step 2 login-valida.aspx status:', res2.status);
        console.log('Location 2:', res2.headers.get('location'));
        const html2 = await res2.text();
        console.log('HTML start 2:', html2.substring(0, 300));

        if (res2.status === 200 && html2.includes('Ocorreu um erro')) {
            console.log('FAILED AGAIN: Probably blocking by GoCache or bot detection.');
        } else if (res2.status === 302 || res2.status === 301) {
            console.log('SUCCESS! Redirects to:', res2.headers.get('location'));
            console.log('Cookies to keep:', res2.headers.get('set-cookie'));
        }

    } catch (error) {
        console.error('Error logging in:', error);
    }
}

testExecuteLogin();
