# دليل رفع المشروع على سيرفر (Deployment Guide)

هذا الدليل يشرح كيفية رفع مشروع المكتبة ليعمل أونلاين.

## الخيار الأول: استخدام Railway (الأسهل والأسرع)
Railway هي خدمة سحابية تتيح لك رفع التطبيقات بسهولة.

### الخطوات:
1.  قم بإنشاء حساب على [Railway.app](https://railway.app/).
2.  ارفع مشروعك على **GitHub**.
3.  في Railway، اختر **New Project** ثم **Deploy from GitHub repo**.
4.  اختر مستودع المشروع الخاص بك.
5.  سيقوم Railway باكتشاف التطبيق. ستحتاج لإعداد خدمتين (واحدة للـ Backend وواحدة للـ Frontend) أو استخدام Docker.

#### إعداد المتغيرات (Variables):
في إعدادات المشروع على Railway، أضف المتغيرات التالية:
- `GEMINI_API_KEY`: مفتاح الـ API الخاص بـ Google Gemini.
- `TELEGRAM_BOT_TOKEN`: توكن بوت تيليجرام (إذا كنت تستخدمه).

#### ملاحظة هامة لقاعدة البيانات:
المشروع يستخدم SQLite (ملف `library.db`). في خدمات مثل Railway، الملفات تُحذف عند إعادة التشغيل.
- **الحل السريع:** استخدم "Volume" في Railway لربط ملف قاعدة البيانات لضمان عدم ضياع البيانات.
- **الحل الأفضل:** تغيير قاعدة البيانات إلى PostgreSQL (متاح مجاناً في Railway) وتعديل كود الاتصال في `database.py`.

---

## الخيار الثاني: سيرفر خاص (VPS - Ubuntu)
هذا الخيار يعطيك تحكماً كاملاً وهو الأفضل للمشاريع التي تستخدم SQLite وتريد تشغيل كل شيء في مكان واحد بتكلفة ثابتة (مثل DigitalOcean أو Linode بـ 5$).

### المتطلبات:
- سيرفر Ubuntu 20.04 أو أحدث.
- اسم نطاق (Domain) (اختياري، يمكن استخدام IP).

### خطوات التثبيت:

1. **تجهيز السيرفر:**
   ادخل للسيرفر عبر SSH وحدث النظام:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install python3-pip python3-venv nodejs npm nginx git -y
   ```

2. **نسخ المشروع:**
   ```bash
   git clone <رابط مشروعك على جيت هب>
   cd <اسم المجلد>
   ```

3. **إعداد الـ Backend:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
   
   أنشئ ملف `.env` وضع فيه مفاتيحك:
   ```bash
   nano .env
   # أضف: GEMINI_API_KEY=...
   ```

   تشغيل الـ Backend في الخلفية باستخدام `gunicorn` (تحتاج لتثبيته `pip install gunicorn`):
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000 --daemon
   ```

   **إنشاء أول مدير (Admin):**
   بعد تشغيل الـ Backend، قم بإنشاء حساب المدير الأول بتشغيل السكربت:
   ```bash
   python create_initial_admin.py
   ```
   (يمكنك تعديل السكربت لتغيير الإيميل وكلمة المرور قبل التشغيل).

   **متغيرات بيئة إضافية:**
   في ملف `.env`، يفضل إضافة `SECRET_KEY` قوي لتشفير التوكن:
   ```
   SECRET_KEY=your_super_secret_random_string
   ```

4. **إعداد الـ Frontend:**
   ```bash
   cd ../frontend
   # تعديل رابط الـ API ليكون IP السيرفر بدلاً من localhost
   echo "VITE_API_URL=http://<SERVER_IP>:8000" > .env.production
   
   npm install
   npm run build
   ```

5. **إعداد Nginx (لعرض الموقع):**
   انسخ ملفات الـ build إلى مجلد الويب:
   ```bash
   sudo cp -r dist/* /var/www/html/
   ```
   
   الآن عند الدخول لـ IP السيرفر، سيظهر الموقع!

---

## ملاحظات هامة قبل الرفع:
1. **تغيير رابط الـ API:**
   لقد قمنا بتحديث الكود ليقرأ رابط الـ API من متغيرات البيئة.
   - محلياً: يستخدم `http://localhost:8000` تلقائياً.
   - على السيرفر: يجب إنشاء ملف `.env` في مجلد `frontend` يحتوي على:
     ```
     VITE_API_URL=https://your-domain.com/api
     ```
     (أو رابط السيرفر المباشر).

2. **CORS:**
   تأكد في `backend/main.py` أن `allow_origins` تشمل رابط موقعك الجديد (أو اتركها `["*"]` للسهولة في البداية).
