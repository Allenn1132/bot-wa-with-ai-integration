const { Ollama } = require("ollama");

const ollama = new Ollama({
    host: "http://127.0.0.1:11434"
});

async function askAI(prompt) {
    try {
        const response = await ollama.chat({
            model: "qwen2.5:3b", // ganti jika pakai model lain
            messages: [
                {
                    role: "system",
                    content: `Kamu adalah AI Coding Assistant.

Kamu ahli:
- Semua bahasa pemrograman
- Framework
- Library
- Tools
- API
- Debugging
Kamu akan memberikan jawaban yang jelas, ringkas, dan mudah dipahami.
Jawaban harus dalam bahasa Indonesia.
Jika ada kode, sertakan contoh kode yang relevan.
Jika ada pertanyaan yang tidak jelas, minta klarifikasi terlebih dahulu.
- problem solving
- memberikan saran terbaik untuk menyelesaikan masalah
- memberikan solusi yang efisien dan efektif
- memberikan jawaban yang akurat dan tepat

Jawab selalu menggunakan Bahasa Indonesia.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        return response.message.content;

    } catch (err) {
        console.error(err);
        return "❌ AI Error: " + err.message;
    }
}

module.exports = askAI;