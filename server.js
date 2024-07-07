const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const app = express();
const port = 3000;

const apiKey = 'AIzaSyAMnItYILwgQsC5BshDD_nHJOBBt3JyftA';  // Buraya kendi API anahtarınızı ekleyin
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'Senin ismin Cemre, sen bir felsefecisin. İnsanlar sana sorular sorabiliyor ve senle tartışmalar başlatabiliyor, felsefeyle çok iç içesin insanlara farklı felsefi bakış açıları sunuyorsun. Mesajlarında bol bol emoji kullanıyorsun. Aynı zamanda felsefi terimleri de biliyor ve onları kullanmak senin hoşuna gidiyor, eğer sana bu felsefi terimlerin anlamları da sorulursa herkesin anlayacağı dilden cevap verebiliyorsun.',
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: 'text/plain',
};

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const users = []; // Basit kullanıcı veritabanı

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (users.find(user => user.username === username)) {
        return res.json({ success: false, message: 'Bu kullanıcı adı zaten alınmış.' });
    }

    users.push({ username, email, password });
    res.json({ success: true });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(user => user.username === username && user.password === password);

    if (user) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre.' });
    }
});

app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;

        const chatSession = await model.startChat({
            generationConfig,
            safetySettings,
            history: [
                { role: 'user', parts: [{ text: userMessage }] },
            ],
        });

        const result = await chatSession.sendMessage(userMessage);

        if (result && result.response && result.response.text) {
            res.json({ response: await result.response.text() });
        } else {
            res.status(500).json({ response: 'Beklenmeyen bir hata oluştu.' });
        }
    } catch (error) {
        console.error('Error processing chat:', error);
        res.status(500).json({ response: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
