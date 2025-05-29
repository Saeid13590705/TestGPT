import express from "express";
import axios from "axios";

const app = express();
app.use(express.json());

// توکن HuggingFace - برای استفاده واقعی این را در متغیرهای محیطی قرار دهید
const HF_TOKEN = "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"; 

// روت برای پردازش پیام‌های چت
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "پیام نمی‌تواند خالی باشد" });
  }

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",
      { 
        inputs: userMessage,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
        },
      }
    );

    const reply = response.data?.[0]?.generated_text || "پاسخی دریافت نشد";
    return res.json({ reply });

  } catch (error) {
    console.error("Error from HF:", error?.response?.data || error.message);
    return res.status(500).json({ 
      error: "مشکلی در ارتباط با سرور هوش مصنوعی پیش آمد",
      details: error?.response?.data?.error || error.message
    });
  }
});

// صفحه اصلی با رابط کاربری ساده
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>چت با Falcon-7b</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        h2 {
          color: #333;
          text-align: center;
        }
        #chat-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        #input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          resize: vertical;
          min-height: 100px;
          font-family: inherit;
        }
        button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          margin-top: 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover {
          background-color: #45a049;
        }
        #response {
          margin-top: 20px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 4px;
          border: 1px solid #eee;
          white-space: pre-wrap;
          min-height: 100px;
        }
        .loading {
          color: #666;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div id="chat-container">
        <h2>چت با مدل Falcon-7b</h2>
        <textarea id="input" rows="4" placeholder="پیام خود را اینجا بنویسید..."></textarea><br>
        <button onclick="sendMessage()">ارسال پیام</button>
        <h3>پاسخ:</h3>
        <div id="response">پاسخ اینجا نمایش داده می‌شود...</div>
      </div>

      <script>
        async function sendMessage() {
          const input = document.getElementById("input").value.trim();
          const resBox = document.getElementById("response");
          
          if (!input) {
            alert("لطفاً پیامی وارد کنید!");
            return;
          }

          resBox.innerHTML = '<span class="loading">در حال دریافت پاسخ...</span>';
          
          try {
            const res = await fetch("/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: input }),
            });

            const data = await res.json();
            
            if (data.error) {
              resBox.innerHTML = '<span style="color:red">خطا: ' + data.error + '</span>';
              if (data.details) {
                resBox.innerHTML += '<br><small>' + data.details + '</small>';
              }
            } else {
              resBox.textContent = data.reply;
            }
          } catch (err) {
            resBox.innerHTML = '<span style="color:red">خطا در ارتباط با سرور: ' + err.message + '</span>';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// مدیریت خطاهای 404
app.use((req, res) => {
  res.status(404).send("صفحه مورد نظر یافت نشد");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`سرور در حال اجرا روی پورت ${PORT}`));
