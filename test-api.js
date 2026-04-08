const http = require('http');

const data = JSON.stringify({
    topic: 'general knowledge',
    difficulty: 'easy'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/inquizzo/ask',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const startTime = Date.now();
const req = http.request(options, res => {
    let body = '';
    res.on('data', d => { body += d; });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Time: ${Date.now() - startTime}ms`);
        console.log(`Body: ${body}`);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
