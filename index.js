import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

// تنظیمات مدل‌ها
const MODELS = {
  GPT2: 'gpt2',
  GPT2_FA: 'HooshvareLab/gpt2-fa',
  FALCON: 'tiiuae/falcon-7b-instruct',
  MISTRAL: 'mistralai/Mistral-7B-Instruct-v0.1'
};


const HF_TOKEN = "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"; // توکن جدید را اینجا قرار دهید
// میدلور برای بررسی توکن
app.use((req, res, next) => {
  if (!HF_TOKEN || HF_TOKEN === 'your_default_token_here') {
    return res.status(500).json({ 
      error: 'لطفاً توکن Hugging Face را در فایل .env تنظیم کنید'
    });
  }
  next();
});

// روت چت با قابلیت انتخاب مدل
app.post("/chat", async (req, res) => {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",
      { inputs: req.body.message },
      {
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`, // اینجا را بررسی کنید
          "Content-Type": "application/json"
        }
      }
    );
    // ...
  } catch (error) {
    console.error("خطای دقیق:", error.response?.data);
    res.status(500).json({ error: "مشکل در احراز هویت API" });
  }
});

    let reply = response.generated_text.replace(prompt, '').trim();
    
    // بهبود پاسخ‌های فارسی
    if (model === 'GPT2_FA') {
      reply = improvePersianResponse(reply);
    }

    return res.json({ reply });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return handleHuggingFaceError(error, res);
  }
});

// رابط کاربری پیشرفته
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>چت‌بات هوشمند</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { background-color: #f8f9fa; }
        .chat-container { max-width: 800px; margin: 0 auto; }
        .response-box { min-height: 200px; white-space: pre-wrap; }
        .model-selector { cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container py-5">
        <div class="chat-container card shadow">
          <div class="card-header bg-primary text-white">
            <h2 class="text-center">چت‌بات هوشمند</h2>
            <div class="d-flex justify-content-center mt-2">
              ${Object.entries(MODELS).map(([key, _]) => `
                <button class="btn btn-sm btn-outline-light mx-1 model-selector" data-model="${key}">${key}</button>
              `).join('')}
            </div>
          </div>
          <div class="card-body">
            <textarea id="input" class="form-control mb-3" rows="4" 
              placeholder="پیام خود را اینجا بنویسید..."></textarea>
            <button id="send-btn" class="btn btn-primary w-100">ارسال پیام</button>
            <div class="mt-4">
              <h5>پاسخ:</h5>
              <div id="response" class="response-box p-3 bg-light rounded"></div>
            </div>
          </div>
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
      <script>
        let currentModel = 'GPT2_FA';
        
        document.querySelectorAll('.model-selector').forEach(btn => {
          btn.addEventListener('click', () => {
            currentModel = btn.dataset.model;
            document.querySelectorAll('.model-selector').forEach(b => {
              b.classList.toggle('btn-light', b.dataset.model === currentModel);
              b.classList.toggle('btn-outline-light', b.dataset.model !== currentModel);
            });
          });
        });

        document.getElementById('send-btn').addEventListener('click', async () => {
          const input = document.getElementById('input').value.trim();
          const responseBox = document.getElementById('response');
          
          if (!input) {
            alert('لطفاً پیامی وارد کنید!');
            return;
          }

          responseBox.innerHTML = '<div class="text-center text-muted">در حال پردازش...</div>';
          
          try {
            const { data } = await axios.post('/chat', {
              message: input,
              model: currentModel
            });
            
            responseBox.textContent = data.reply;
          } catch (error) {
            const errorMsg = error.response?.data?.error || 'خطا در ارتباط با سرور';
            responseBox.innerHTML = \`<div class="text-danger">\${errorMsg}</div>\`;
            if (error.response?.data?.details) {
              responseBox.innerHTML += \`<div class="text-muted small mt-2">\${error.response.data.details}</div>\`;
            }
          }
        });
      </script>
    </body>
    </html>
  `);
});

// تابع کمکی برای ارتباط با Hugging Face
async function queryHuggingFace({ model, inputs, parameters }) {
  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs, parameters },
      { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
    );
    return response.data[0];
  } catch (error) {
    if (error.response?.status === 503) {
      // مدل در حال بارگذاری است
      await waitForModel(model);
      return queryHuggingFace({ model, inputs, parameters });
    }
    throw error;
  }
}

// تابع کمکی برای انتظار بارگذاری مدل
async function waitForModel(model, retries = 3) {
  try {
    const response = await axios.get(
      `https://api-inference.huggingface.co/models/${model}/status`,
      { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
    );
    
    if (response.data.state !== 'Loaded') {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 ثانیه منتظر بمان
        return waitForModel(model, retries - 1);
      }
      throw new Error('مدل پس از چندین تلاش بارگذاری نشد');
    }
  } catch (error) {
    throw error;
  }
}

// بهبود پاسخ‌های فارسی
function improvePersianResponse(text) {
  // حذف کاراکترهای اضافی
  let improved = text
    .replace(/�/g, '')
    .replace(/\n+/g, '\n')
    .trim();
  
  // اصلاح ساختار جملات
  if (!improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('؟')) {
    improved += '.';
  }
  
  return improved;
}

// مدیریت خطاهای Hugging Face
function handleHuggingFaceError(error, res) {
  const status = error.response?.status || 500;
  let message = 'مشکلی در پردازش پیام پیش آمد';
  
  if (status === 503) {
    message = 'مدل در حال بارگذاری است. لطفاً چند لحظه دیگر تلاش کنید.';
  } else if (status === 429) {
    message = 'محدودیت درخواست. لطفاً کمی صبر کنید.';
  } else if (error.message.includes('timeout')) {
    message = 'زمان انتظار به پایان رسید. لطفاً دوباره تلاش کنید.';
  }
  
  return res.status(status).json({ 
    error: message,
    details: error.response?.data?.error || error.message
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`سرور در حال اجرا روی پورت ${PORT}`);
  console.log('مدل‌های پشتیبانی شده:');
  console.log(Object.entries(MODELS).map(([k, v]) => `- ${k}: ${v}`).join('\n'));
});
