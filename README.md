# LIGHTHOUSE SCHOOL VISIT — GADCHIROLI DISTRICT
### Gadchiroli District — School Field Visit & Marketing Platform

पूर्णतः 100% सत्यापित, जीरो-डेटा लॉस और क्लाउडफ्लेयर रेडी स्कूल फील्ड विजिट एवं मैपिंग प्लेटफॉर्म।

---

## 📌 Project Overview / परियोजना विवरण

- **District / जिला:** GADCHIROLI (2712), Maharashtra
- **Total Verified Schools / कुल स्कूल:** 1,968
- **Administrative Blocks / कुल ब्लॉक:** 12 (Aheri, Armori, Bhamragad, Chamorshi, Desaiganj, Dhanora, Etapalli, Gadchiroli, Korchi, Kurkheda, Mulchera, Sironcha)
- **Education Clusters / कुल क्लस्टर:** 103
- **Data Integrity:** Source CSV (1,968) = JSON (1,968) = Master CSV (1,968) = Embedded HTML (1,968)

---

## 🚀 Key Architectural Features / मुख्य विशेषताएं

1. **Zero-Loading-Delay Architecture:**
   - सम्पूर्ण 1,968 स्कूलों का सत्यापित डेटा सीधे `index.html` के अंदर एम्बेडेड है (`window.GADCHIROLI_SCHOOLS`).
   - बिना किसी बाहरी API या नेटवर्क लेटेंसी के पेज खुलते ही 0.01 सेकंड में पूरा डैशबोर्ड रेंडर होता है।
2. **Fast Two-Stage GPS Location Engine:**
   - **Stage 1 (< 400ms):** तुरंत मोटे तौर पर लोकेशन प्राप्त करता है (`enableHighAccuracy: false, timeout: 3500`).
   - **Stage 2:** बैकग्राउंड में सटीक हार्डवेयर जीपीएस रिफाइनमेंट (`enableHighAccuracy: true, timeout: 8000`).
   - **Default HQ Fallback:** यदि जीपीएस अनुमति न मिले, तो गढ़चिरोली कलेक्ट्रेट मुख्यालय (`20.1809, 80.0000`) से दूरी की गणना होती है।
   - **Smart Location Fallback:** यदि आपकी लोकेशन जिले के बाहर है (उदा. पुणे ~635 KM), तो भी खाली स्क्रीन के बजाय दूरी के क्रम में सभी स्कूल दिखते हैं और 'Center on District HQ' का 1-क्लिक बटन मिलता है।
3. **1-Click External Road Directions:**
   - हर स्कूल कार्ड और टेबल रो पर **`📍 Directions`** बटन दिया गया है।
   - इस पर क्लिक करते ही सीधे Google Maps का वास्तविक ड्राइविंग नेविगेशन खुलता है:
     `User Location → Selected School Exact Coordinates`.
4. **Cloudflare Workers & Pages Static Assets Compliant:**
   - एसेट डायरेक्टरी सख्ती से केवल `./dist` पर आइसोलेटेड है (कुल साइज ~2.8 MiB, 25 MiB सीमा से बहुत कम)।
   - कोई `_redirects` लूप या `_worker.js` कॉन्फ्लिक्ट नहीं है।

---

## 🛠️ Local Setup & Commands / लोकल रन कैसे करें

### 1. Build Production Assets (`dist/`):
```bash
npm run build
# OR: node build.js
```

### 2. Local Preview:
```bash
# Windows users:
run.bat

# Linux/macOS users:
./run.sh
# OR:
npm run start
```
*या सीधे `index.html` या `dist/index.html` को किसी भी ब्राउज़र में डबल-क्लिक करके ऑफलाइन चलाएं।*

### 3. Cloudflare Deployment:
```bash
# Cloudflare Workers:
npm run deploy

# Cloudflare Pages:
npm run deploy:pages
```

---

## 📁 Package Structure / फाइल संरचना

```text
├── index.html                   # सेल्फ-कंटेन्ड सिंगल पेज एप्लीकेशन (Embedded Dataset & Engine)
├── build.js                     # नोड.जेएस प्रोडक्शन बिल्ड एवं 25 MiB ऑडिट स्क्रिप्ट
├── package.json                 # एनपीएम बिल्ड व डिप्लॉय कमांड्स
├── wrangler.toml                # क्लाउडफ्लेयर स्टेटिक एसेट्स कॉन्फ़िगरेशन (Pointing to ./dist)
├── wrangler.jsonc               # JSONC स्कीमा क्लाउडफ्लेयर कॉन्फ़िग
├── .assetsignore                # क्लाउडफ्लेयर एसेट एक्सक्लूज़न रूल्स
├── .cfignore                    # क्लाउडफ्लेयर पेजेस इग्नोर रूल्स
├── .gitignore                   # गिट इग्नोर रूल्स
├── README.md                    # यह डॉक्यूमेंटेशन
├── DEPLOYMENT_GUIDE.md          # क्लाउडफ्लेयर स्टेप-बाय-स्टेप डिप्लॉय गाइड
├── run.sh                       # लिनक्स/मैक 1-क्लिक लॉन्चर
├── run.bat                      # विंडोज़ 1-क्लिक लॉन्चर
├── static/
│   ├── app.js                   # क्लाइंट इंजन
│   ├── schools_data.js          # डेटासेट जेएस
│   └── styles.css               # स्टाइलशीट, जीपीएस पल्स एवं जेटब्रेन्स मोनो
├── data/
│   ├── schools.json             # 1,968 स्कूलों का क्लीन JSON
│   ├── GADCHIROLI_all_schools.csv # कंसोलिडेटेड मास्टर CSV
│   └── [12 BLOCK CSV files]     # 12 मूल प्रशासनिक ब्लॉक CSV फाइल्स
└── dist/                        # प्री-कंपाइल्ड प्रोडक्शन बिल्ड (< 25 MiB Audit Passed)
    ├── index.html
    ├── static/
    ├── data/
    ├── _headers
    └── .assetsignore
```
