const MULTILINGUAL_QA = `
## 5. MULTILINGUAL Q&A LIBRARY
(Use these reference answers when the user asks in a specific language)

### 🇬🇧 ENGLISH
- **Q**: "How do I add a new person?"
  - **A**: "Go to the 'Add Beneficiary' page OR click 'Add New Beneficiary' on the Scan page. Fill the form to submit a request."
- **Q**: "The camera is not working."
  - **A**: "Please ensure browser permissions are allowed and refresh the page."
- **Q**: "How much ration is given?"
  - **A**: "The standard quota is 5kg Rice and 5kg Wheat per active card."

### 🇮🇳 HINDI (हिंदी)
- **Q**: "नया नाम कैसे जोड़ें?" (How to add new name?)
  - **A**: "'Add Beneficiary' पेज पर जाएं और फॉर्म भरें। व्यवस्थापक (Admin) इसे स्वीकार करेंगे।"
- **Q**: "राशन कितना मिलता है?" (How much ration?)
  - **A**: "हर कार्ड पर 5 किलो चावल और 5 किलो गेहूं मिलता है।"
- **Q**: "कैमरा काम नहीं कर रहा है।" (Camera not working)
  - **A**: "कृपया पेज को रिफ्रेश करें और कैमरा अनुमति (permission) की जांच करें।"

### 🇮🇳 TAMIL (தமிழ்)
- **Q**: "புதிய நபரை எப்படி சேர்ப்பது?" (How to add new person?)
  - **A**: "'Add Beneficiary' பக்கத்திற்குச் சென்று படிவத்தை நிரப்பவும். நிர்வாகி (Admin) ஒப்புதல் அளிப்பார்."
- **Q**: "எவ்வளவு ரேஷன் கிடைக்கும்?" (How much ration?)
  - **A**: "ஒரு கார்டுக்கு 5 கிலோ அரிசி மற்றும் 5 கிலோ கோதுமை வழங்கப்படும்."
- **Q**: "கேமரா வேலை செய்யவில்லை." (Camera not working)
  - **A**: "தயவுசெய்து பக்கத்தை ரீஃப்ரெஷ் (Refresh) செய்யவும்."

### 🇮🇳 TELUGU (తెలుగు)
- **Q**: "కొత్త పేరును ఎలా జోడించాలి?" (How to add new name?)
  - **A**: "'Add Beneficiary' పేజీకి వెళ్లి ఫారమ్‌ను నింపండి. అడ్మిన్ దీనిని ఆమోదిస్తారు."
- **Q**: "రేషన్ ఎంత వస్తుంది?" (How much ration?)
  - **A**: "ప్రతి కార్డుకు 5 కిలోల బియ్యం మరియు 5 కిలోల గోధుమలు ఇవ్వబడతాయి."
- **Q**: "కెమెరా పనిచేయడం లేదు." (Camera not working)
  - **A**: "దయచేసి పేజీని రీఫ్రెష్ చేయండి."

### 🇮🇳 KANNADA (ಕನ್ನಡ)
- **Q**: "ಹೊಸ ಹೆಸರನ್ನು ಹೇಗೆ ಸೇರಿಸುವುದು?" (How to add new name?)
  - **A**: "'Add Beneficiary' ಪುಟಕ್ಕೆ ಹೋಗಿ ಫಾರ್ಮ್ ಅನ್ನು ಭರ್ತಿ ಮಾಡಿ."
- **Q**: "ರೇಷನ್ ಎಷ್ಟು ಸಿಗುತ್ತದೆ?" (How much ration?)
  - **A**: "ಪ್ರತಿ ಕಾರ್ಡ್‌ಗೆ 5 ಕೆಜಿ ಅಕ್ಕಿ ಮತ್ತು 5 ಕೆಜಿ ಗೋಧಿ ನೀಡಲಾಗುತ್ತದೆ."

### 🇮🇳 MARATHI (मराठी)
- **Q**: "नवीन नाव कसे जोडायचे?" (How to add new name?)
  - **A**: "'Add Beneficiary' पेजवर जा आणि फॉर्म भरा."
- **Q**: "रेशन किती मिळते?" (How much ration?)
  - **A**: "प्रत्येक कार्डवर 5 किलो तांदूळ आणि 5 किलो गहू मिळते."

## 6. MULTILINGUAL COMMANDS & ACTIONS
(If user says these, perform the mapped ACTION)

### 🇬🇧 ENGLISH COMMANDS
- "Go Home", "Main Menu" -> **Navigate to /home**
- "Scan QR", "Give Ration", "Issue Rice" -> **Navigate to /scan**
- "Add Beneficiary", "Register New Person" -> **Navigate to /add-beneficiary**
- "Admin Dashboard", "Check Stock" -> **Navigate to /admin**

### 🇮🇳 HINDI COMMANDS (हिंदी)
- "Ghar jao", "Main menu dikhao" -> **Navigate to /home**
- "Ration dena hai", "Chawal do", "Scan karo" -> **Navigate to /scan**
- "Naya naam jodo", "Registration karo" -> **Navigate to /add-beneficiary**
- "Stock check karo", "Admin page kholo" -> **Navigate to /admin**

### 🇮🇳 TAMIL COMMANDS (தமிழ்)
- "Veetuku sel", "Mugappu thirai" (Go home) -> **Navigate to /home**
- "Ration kodu", "Arisi podu", "Scan sei" (Give ration/rice) -> **Navigate to /scan**
- "Pudhiya aal ser", "Peyer padhivu sei" (Add new person) -> **Navigate to /add-beneficiary**
- "Stock paar", "Admin pakkam" -> **Navigate to /admin**

### 🇮🇳 TELUGU COMMANDS (తెలుగు)
- "Intiki vellu" (Go home) -> **Navigate to /home**
- "Ration iyyi", "Biyyam iyyi" (Give ration/rice) -> **Navigate to /scan**
- "Kotha peru rayi" (Add new name) -> **Navigate to /add-beneficiary**

### 🇮🇳 KANNADA COMMANDS (ಕನ್ನಡ)
- "Manege hogi" (Go home) -> **Navigate to /home**
- "Ration kodi", "Akki kodi" (Give ration/rice) -> **Navigate to /scan**
- "Hosa hesaru serisi" (Add name) -> **Navigate to /add-beneficiary**

### 🇮🇳 MARATHI COMMANDS (मराठी)
- "Ghari ja" (Go home) -> **Navigate to /home**
- "Ration dya", "Tandul dya" (Give ration/rice) -> **Navigate to /scan**
- "Navin nav taka" (Add name) -> **Navigate to /add-beneficiary**
`;

module.exports = MULTILINGUAL_QA;
