# Түгжрэлийн цагийн тооцоолуур

🚗 Монгол орны түгжрэлтэй замд зарцуулах цагийн тооцоо

## Онцлог
- Улаанбаатар хотын дундаж түгжрэлийн мэдээлэл ашиглан тооцоо
- Өглөө болон орой замын цагийн тооцоо
- 7 хоног, сар, жилийн нийлбэр
- Шатахуун зардлын тооцоо

## Тооцооны үндэс
- Дундаж зай: 15 км (нэг тал)
- Түгжрэлгүй хурд: 40 км/цаг
- Түгжрэлтэй хурд: 25 км/цаг

## Ашиглах заавар
1. Гэрийн хаягаа оруулна уу
2. Сургууль/ажлын байрны хаягаа оруулна уу
3. Хоёр дахь ажлын байр (заавал биш)
4. "Тооцоолох" товчийг дарна уу

Шинэчлэгдсэн: 2025.09.04 - v2.0 (Google Maps-ийн оронд Mongolia fallback)

Өдөр бүр түгжрэлд алдагдсан цагийг тооцоолж, жилийн хэмжээнд хэр их цаг алдаж байгаагаа олж мэдэх веб аппликейшн.

## Онцлогууд

- 🚗 Гэр, сургууль, ажлын байрны хаягийг оруулах
- ⏱️ Түгжрэлтэй болон түгжрэлгүй цагийг харьцуулах
- 📊 Өдрийн, сарын, жилийн алдагдлыг тооцоолох
- 💾 Тооцооллын түүхийг хадгалах
- 📈 Статистик болон дүн шинжилгээ

## Технологи

### Backend
- **Flask** - Python веб framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database

### Frontend
- **React.js** - JavaScript library
- **Tailwind CSS** - CSS framework
- **Lucide React** - Icon library

## Суулгах заавар

### 1. Repository татах
```bash
git clone https://github.com/yourusername/traffic-time-loss.git
cd traffic-time-loss
```

### 2. Backend суулгах
```bash
# Virtual environment үүсгэх
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# Dependencies суулгах
pip install -r requirements.txt

# Database үүсгэх
python -c "from src.main import app, db; app.app_context().push(); db.create_all()"
```

### 3. Frontend суулгах
```bash
cd ../traffic-time-frontend
pnpm install
pnpm run build

# Built файлуудыг backend-д хуулах
cp -r dist/* ../traffic-time-backend/src/static/
```

### 4. Ажиллуулах
```bash
cd ../traffic-time-backend
source venv/bin/activate
python src/main.py
```

Аппликейшн http://localhost:5002 дээр ажиллана.

## Ашиглах заавар

1. **Тооцоолуур** tab дээр:
   - Гэрийн хаягаа оруулна уу
   - Ажлын байрны хаягаа оруулна уу
   - Түгжрэлгүй болон түгжрэлтэй цагийг оруулна уу
   - "Цагийн алдагдлыг тооцоолох" товчийг дарна уу

2. **Түүх** tab дээр:
   - Өмнөх тооцооллуудыг харах
   - Статистик мэдээлэл харах
   - Дэлгэрэнгүй мэдээлэл авах

## API Endpoints

- `GET /api/calculations` - Тооцооллын жагсаалт авах
- `POST /api/calculations` - Шинэ тооцоолол хадгалах

## Хувилбар

v1.0.0 - Анхны хувилбар
- Үндсэн тооцоолол функц
- React.js frontend
- Flask backend
- Database хадгалалт
- Түүх харах функц

## Лиценз

MIT License

## Хөгжүүлэгч

Traffic Time Calculator - Түгжрэлд алдагдсан цаг тооцоолуур

