import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// توکن HuggingFace ثابت
const HF_TOKEN = "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";

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/gpt2",
      { inputs: userMessage },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
        },
      }
    );

    console.log("Response from HF:", response.data);

    // مدل GPT2 معمولا پاسخ در فیلد generated_text است
    const reply = response.data?.generated_text || "پاسخی دریافت نشد";
    res.json({ reply });
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ error: "مشکلی پیش آمده است" });
  }
});

app.get("/", (req, res) => {
  res.send(`
    <h2>چت رایگان با مدل GPT-2 روی HuggingFace</h2>
    <textarea id="input" rows="4" cols="50" placeholder="سوال خود را اینجا بنویسید"></textarea><br>
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
