import express from "express";
import axios from "axios";
const app = express();

app.use(express.json());

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
      {
        inputs: userMessage,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
        },
      }
    );

    const reply = response.data?.[0]?.generated_text || "پاسخی دریافت نشد";
    res.json({ reply });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: "مشکلی پیش آمده است" });
  }
});

 app.get("/", (req, res) => {
  res.send("سرور داره کار میکنه، روت اصلی فعال است");
  res.send(`
    <h2>چت رایگان با مدل HuggingFace</h2>
    <textarea id="input" rows="4" cols="50"></textarea><br>
    <button onclick="sendMessage()">ارسال</button>
    <pre id="response"></pre>

    <script>
      async function sendMessage() {
        const input = document.getElementById("input").value;
        const resBox = document.getElementById("response");
        resBox.innerText = "در حال پاسخ‌گویی...";

        const res = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input }),
        });

        const data = await res.json();
        resBox.innerText = data.reply || "پاسخی دریافت نشد";
      }
    </script>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
