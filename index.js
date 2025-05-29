import express from "express";
import axios from "axios";
const app = express();

app.use(express.json());

// چت API
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "مشکلی پیش آمده است" });
  }
});

// صفحه چت ساده
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>ChatGPT Chat</title></head>
    <body>
      <h1>چت با ChatGPT</h1>
      <textarea id="input" rows="4" cols="50" placeholder="سوال خود را بنویس"></textarea><br>
      <button onclick="sendMessage()">ارسال</button>
      <h3>پاسخ:</h3>
      <pre id="response"></pre>

      <script>
        async function sendMessage() {
          const message = document.getElementById('input').value;
          const responseBox = document.getElementById('response');
          responseBox.textContent = "در حال ارسال...";

          try {
            const res = await fetch('/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message })
            });
            const data = await res.json();
            responseBox.textContent = data.reply || "پاسخی دریافت نشد";
          } catch {
            responseBox.textContent = "خطا در ارسال درخواست";
          }
        }
      </script>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
