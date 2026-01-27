import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useNavigate } from 'react-router-dom';
import { Mic, Volume2, X } from 'lucide-react';
import { useVoiceCommands } from '../context/VoiceCommandContext';

const VoiceAssistant = () => {
    const [isAwake, setIsAwake] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [responseMsg, setResponseMsg] = useState('');
    const [isSpellingMode, setIsSpellingMode] = useState(false);
    const [spelledName, setSpelledName] = useState("");
    const [isConfirmingName, setIsConfirmingName] = useState(false);
    const [pendingName, setPendingName] = useState("");
    const [pendingData, setPendingData] = useState(null);
    const isSpeakingRef = React.useRef(false);
    const [pendingLetter, setPendingLetter] = useState(null);
    const fallbackTimerRef = React.useRef(null);

    // --- LANGUAGES SUPPORT ---
    const [selectedLang, setSelectedLang] = useState('en-IN');
    const languages = [
        { code: 'en-IN', name: 'English (Indian)' },
        { code: 'ta-IN', name: 'Tamil (தமிழ்)' },
        { code: 'hi-IN', name: 'Hindi (हिंदी)' },
        { code: 'te-IN', name: 'Telugu (తెలుగు)' },
        { code: 'kn-IN', name: 'Kannada (कन्नड़)' },
        { code: 'mr-IN', name: 'Marathi (मराठी)' }
    ];

    // TRANSLATIONS
    const translations = {
        'en-IN': {
            welcome: "Please select your language. Say English, Tamil, or Hindi.",
            listening: "Listening...",
            processing: "Thinking...",
            home_ctx: "Home Screen. You are at the main menu. You can say 'Distribute Rations', 'Make Payment', or 'Add Beneficiary'.",
            scan_ctx: "Distribution Mode Open. Camera is active. To start, say 'Scan QR' or 'Simulate Scan'.",
            add_ctx: "Registration Form Open. Say 'My name is Ramesh' or 'Spell Name'.",
            pay_ctx: "Payment Screen. You can record transactions here.",
            admin_ctx: "Admin Dashboard. You can check Stock or Reports.",
            ready: "I am ready. Tell me what to do.",
            nav_home: "Navigating to Home",
            nav_scan: "Opening Scanner",
            nav_pay: "Opening Payment Page",
            nav_add: "Opening Registration Page",
            nav_admin: "Opening Admin Dashboard",
            lang_ta: "Tamil Selected. Pesalam.",
            lang_hi: "Hindi Selected. Namaste.",
            lang_en: "English Selected.",
            spell_mode: "Spelling Mode. Say letters one by one.",
            spell_done: "Done. Name updated.",
            spell_cancel: "Cancelled spelling.",
            confirm_yes: "Added. Next?",
            confirm_discard: "Discarded. Say again.",
            ask_confirm: "Did you say ",
            val_taken: "Taken ",
            login_req: "Please log in first."
        },
        'ta-IN': {
            welcome: "மொழியை தேர்ந்தெடுக்கவும். தமிழ், ஆங்கிலம் அல்லது இந்தி என்று சொல்லுங்கள்.",
            listening: "கவனிக்கிறேன்...",
            processing: "யோசிக்கிறேன்...",
            home_ctx: "முகப்பு திரை. நீங்கள் 'ரேஷன் விநியோகம்', 'பணம் செலுத்துதல்' அல்லது 'புதிய பயனாளி' என்று சொல்லலாம்.",
            scan_ctx: "விநியோக முறை. கேமரா ஆய்வில் உள்ளது. 'QR ஸ்கேன்' என்று சொல்லுங்கள்.",
            add_ctx: "பதிவு படிவம். உங்கள் பெயரைச் சொல்லுங்கள்.",
            pay_ctx: "கட்டண திரை. பரிவர்த்தனைகளை இங்கே பார்க்கலாம்.",
            admin_ctx: "நிர்வாக திரை. சரக்கு விவரங்களை பார்க்கலாம்.",
            ready: "நான் தயார். என்ன செய்ய வேண்டும்?",
            nav_home: "முகப்பு திரைக்கு செல்கிறேன்",
            nav_scan: "ஸ்கேனர் திறக்கிறேன்",
            nav_pay: "கட்டண பக்கத்திற்கு செல்கிறேன்",
            nav_add: "பதிவு பக்கத்திற்கு செல்கிறேன்",
            nav_admin: "நிர்வாக பக்கத்திற்கு செல்கிறேன்",
            lang_ta: "தமிழ் தேர்ந்தெடுக்கப்பட்டது. பேசலாம்.",
            lang_hi: "இந்தி.",
            lang_en: "ஆங்கிலம்.",
            spell_mode: "எழுத்து கூட்டு முறை. ஒவ்வொரு எழுத்தாக சொல்லுங்கள்.",
            spell_done: "முடிந்தது. பெயர் மாற்றப்பட்டது.",
            spell_cancel: "ரத்து செய்யப்பட்டது.",
            confirm_yes: "சேர்க்கப்பட்டது. அடுத்து?",
            confirm_discard: "நீக்கப்பட்டது. மீண்டும் சொல்லுங்கள்.",
            ask_confirm: "நீங்கள் சொன்னது ",
            val_taken: "எடுத்துக்கொள்ளப்பட்டது ",
            login_req: "தயவுசெய்து உள்நுழையவும்."
        },
        'hi-IN': {
            welcome: "अपनी भाषा चुनिए. अंग्रेजी, तमिल, या हिंदी बोलिए.",
            listening: "सुन रहा हूँ...",
            processing: "सोच रहा हूँ...",
            home_ctx: "मुख्य मेनू. आप 'राशन वितरण' या 'भुगतान' बोल सकते हैं.",
            scan_ctx: "वितरण मोड. कैमरा चालू है. 'QR स्कैन' बोलिए.",
            add_ctx: "पंजीकरण फॉर्म. अपना नाम बताएं.",
            pay_ctx: "भुगतान स्क्रीन. लेन-देन यहाँ देखें.",
            admin_ctx: "एडमिन डैशबोर्ड. स्टॉक चेक करें.",
            ready: "मैं तैयार हूँ. बताइए क्या करना है.",
            nav_home: "होम पर जा रहा हूँ",
            nav_scan: "स्कैनर खोल रहा हूँ",
            nav_pay: "भुगतान पेज पर जा रहा हूँ",
            nav_add: "पंजीकरण पेज खोल रहा हूँ",
            nav_admin: "एडमिन डैशबोर्ड खोल रहा हूँ",
            lang_ta: "तमिल.",
            lang_hi: "हिंदी चुनी गई. नमस्ते.",
            lang_en: "अंग्रेजी.",
            spell_mode: "स्पेलिंग मोड. एक एक अक्षर बोलिए.",
            spell_done: "हो गया. नाम अपडेट हो गया.",
            spell_cancel: "रद्द किया गया.",
            confirm_yes: "जोड़ा गया. अगला?",
            confirm_discard: "हटा दिया. फिर से बोलिए.",
            ask_confirm: "क्या आपने कहा ",
            val_taken: "लिया गया ",
            login_req: "कृपया लॉगिन करें."
        },
        'te-IN': {
            welcome: "దయచేసి మీ భాషను ఎంచుకోండి. తెలుగు, హిందీ లేదా ఇంగ్లీష్ అని చెప్పండి.",
            listening: "వింటున్నాను...",
            processing: "ఆలోచిస్తున్నాను...",
            home_ctx: "హోమ్ స్క్రీన్. మీరు 'రేషన్ పంపిణీ' లేదా 'చెల్లింపు' అని చెప్పవచ్చు.",
            scan_ctx: "పంపిణీ విధానం. కెమెరా ఆన్‌లో ఉంది. 'QR స్కాన్' అని చెప్పండి.",
            add_ctx: "రిజిస్ట్రేషన్ ఫారం. దయచేసి పేరు చెప్పండి.",
            pay_ctx: "చెల్లింపు స్క్రీన్. మీరు లావాదేవీలను ఇక్కడ చూడవచ్చు.",
            admin_ctx: "అడ్మిన్ డాష్‌బోర్డ్. స్టాక్ లేదా నివేదికలను తనిఖీ చేయండి.",
            ready: "నేను సిద్ధంగా ఉన్నాను. ఏం చేయాలో చెప్పండి.",
            nav_home: "హోమ్‌కి వెళ్తున్నాను",
            nav_scan: "స్కానర్ తెరుస్తున్నాను",
            nav_pay: "చెల్లింపు పేజీని తెరుస్తున్నాను",
            nav_add: "రిజిస్ట్రేషన్ పేజీని తెరుస్తున్నాను",
            nav_admin: "అడ్మిన్ పేజీని తెరుస్తున్నాను",
            lang_te: "తెలుగు ఎంపిక చేయబడింది. నమస్కారం.",
            spell_mode: "స్పెల్లింగ్ విధానం. అక్షరాలను ఒక్కొక్కటిగా చెప్పండి.",
            spell_done: "పూర్తయింది. పేరు నవీకరించబడింది.",
            spell_cancel: "రద్దు చేయబడింది.",
            confirm_yes: "జోడించబడింది. తరువాత?",
            confirm_discard: "తీసివేయబడింది. మళ్ళీ చెప్పండి.",
            ask_confirm: "మీరు చెప్పింది ",
            val_taken: "తీసుకోబడింది ",
            login_req: "దయచేసి లాగిన్ అవ్వండి."
        },
        'kn-IN': {
            welcome: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್ ಅಥವಾ ಹಿಂದಿ ಎಂದು ಹೇಳಿ.",
            listening: "ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ...",
            processing: "ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ...",
            home_ctx: "ಮುಖಪುಟ. ನೀವು 'ರೇಷನ್ ವಿತರಣೆ' ಅಥವಾ 'ಪಾವತಿ' ಎಂದು ಹೇಳಬಹುದು.",
            scan_ctx: "ವಿತರಣೆ ಮೋಡ್. ಕ್ಯಾಮೆರಾ ಆನ್ ಆಗಿದೆ. 'QR ಸ್ಕ್ಯಾನ್' ಎಂದು ಹೇಳಿ.",
            add_ctx: "ನೋಂದಣಿ ಫಾರ್ಮ್. ದಯವಿಟ್ಟು ಹೆಸರನ್ನು ಹೇಳಿ.",
            pay_ctx: "ಪಾವತಿ ಪರದೆ. ನೀವು ವಹಿವಾಟುಗಳನ್ನು ಇಲ್ಲಿ ನೋಡಬಹುದು.",
            admin_ctx: "ನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್. ದಾಸ್ತಾನು ಪರಿಶೀಲಿಸಿ.",
            ready: "ನಾನು ಸಿದ್ಧವಾಗಿದ್ದೇನೆ. ಏನು ಮಾಡಬೇಕೆಂದು ಹೇಳಿ.",
            nav_home: "ಮುಖಪುಟಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದೇನೆ",
            nav_scan: "ಸ್ಕ್ಯಾನರ್ ತೆರೆಯುತ್ತಿದ್ದೇನೆ",
            nav_pay: "ಪಾವತಿ ಪುಟಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದೇನೆ",
            nav_add: "ನೋಂದಣಿ ಪುಟಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದೇನೆ",
            nav_admin: "ನಿರ್ವಾಹಕ ಪುಟಕ್ಕೆ ಹೋಗುತ್ತಿದ್ದೇನೆ",
            lang_kn: "ಕನ್ನಡ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ. ನಮಸ್ಕಾರ.",
            spell_mode: "ಕಾಗುಣಿತ ಮೋಡ್. ಅಕ್ಷರಗಳನ್ನು ಒಂದೊಂದಾಗಿ ಹೇಳಿ.",
            spell_done: "ಮುಗಿದಿದೆ. ಹೆಸರು ನವೀಕರಿಸಲಾಗಿದೆ.",
            spell_cancel: "ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.",
            confirm_yes: "ಸೇರಿಸಲಾಗಿದೆ. ಮುಂದೆ?",
            confirm_discard: "ತೆಗೆದುಹಾಕಲಾಗಿದೆ. ಮತ್ತೆ ಹೇಳಿ.",
            ask_confirm: "ನೀವು ಹೇಳಿದ್ದು ",
            val_taken: "ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ ",
            login_req: "ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ."
        },
        'mr-IN': {
            welcome: "कृपया आपली भाषा निवडा. मराठी, इंग्रजी किंवा हिंदी बोला.",
            listening: "ऐकत आहे...",
            processing: "विचार करत आहे...",
            home_ctx: "होम स्क्रीन. आपण 'रेशन वाटप' किंवा 'पेमेंट' बोलू शकता.",
            scan_ctx: "वितरण मोड. कॅमेरा चालू आहे. 'QR स्कॅन' बोला.",
            add_ctx: "नोंदणी फॉर्म. कृपया नाव सांगा.",
            pay_ctx: "पेमेंट स्क्रीन. आपण व्यवहार येथे पाहू शकता.",
            admin_ctx: "डॅशबोर्ड. स्टॉक तपासा.",
            ready: "मी तयार आहे. काय करायचे ते सांगा.",
            nav_home: "होम वर जात आहे",
            nav_scan: "स्कॅनर उघडत आहे",
            nav_pay: "पेमेंट पेज वर जात आहे",
            nav_add: "नोंदणी पेज उघडत आहे",
            nav_admin: "डॅशबोर्ड उघडत आहे",
            lang_mr: "मराठी निवडले आहे. नमस्कार.",
            spell_mode: "स्पेलिंग मोड. एक एक अक्षर बोला.",
            spell_done: "झाले. नाव अपडेट झाले.",
            spell_cancel: "रद्द केले.",
            confirm_yes: "जोडले. पुढे?",
            confirm_discard: "काढून टाकले. पुन्हा बोला.",
            ask_confirm: "तुम्ही म्हणालात ",
            val_taken: "घेतले ",
            login_req: "कृपया लॉगिन करा."
        }
    };

    // Helper: Get Translation
    const t = (key) => {
        const langData = translations[selectedLang] || translations['en-IN'];
        return langData[key] || translations['en-IN'][key] || key;
    };

    const { transcript, resetTranscript, browserSupportsSpeechRecognition, listening } = useSpeechRecognition();
    const navigate = useNavigate();
    const { dispatchCommand } = useVoiceCommands();

    const letterMap = {
        'alpha': 'a', 'hey': 'a', 'ah': 'a',
        'beta': 'b', 'be': 'b', 'bee': 'b',
        'see': 'c', 'sea': 'c',
        'dee': 'd', 'the': 'd',
        'eee': 'e',
        'eff': 'f',
        'jee': 'g', 'gee': 'g',
        'haitch': 'h',
        'eye': 'i',
        'jay': 'j',
        'kay': 'k',
        'el': 'l',
        'em': 'm', 'am': 'm',
        'en': 'n', 'an': 'n',
        'oh': 'o',
        'pee': 'p', 'pea': 'p',
        'cue': 'q', 'queue': 'q',
        'are': 'r', 'our': 'r',
        'ess': 's', 'yes': 's',
        'tea': 't', 'tee': 't',
        'you': 'u',
        'vee': 'v', 'we': 'v',
        'double': 'w',
        'ex': 'x',
        'why': 'y',
        'zee': 'z', 'zed': 'z'
    };

    // Startup: Ask for Language
    useEffect(() => {
        const timer = setTimeout(() => {
            const msg = t('welcome');
            const utterance = new SpeechSynthesisUtterance(msg);
            const voices = window.speechSynthesis.getVoices();
            const engVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US'));
            if (engVoice) utterance.voice = engVoice;
            window.speechSynthesis.speak(utterance);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Start listening
    useEffect(() => {
        if (browserSupportsSpeechRecognition && !listening) {
            SpeechRecognition.startListening({
                continuous: true,
                language: selectedLang
            }).catch(e => console.log("Mic restart:", e));
        }
    }, [browserSupportsSpeechRecognition, listening, selectedLang]);

    // Handle Speech Logic
    useEffect(() => {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        if (!transcript) return;
        const lowerTranscript = transcript.toLowerCase();

        // E. WAKE WORD LOGIC
        if (!isAwake) {
            const wakeWords = ['hello', 'hey', 'start', 'begin', 'vanakkam', 'namaste', 'namaskaram', 'listen', 'wake up'];
            const hasWakeWord = wakeWords.some(w => lowerTranscript.includes(w));

            if (hasWakeWord) {
                activateAssistant();
            }
            return; // Ignore everything else if sleeping
        }

        // A. SYSTEM COMMANDS
        if (lowerTranscript.includes('stop') || lowerTranscript.includes('shut up') || lowerTranscript.includes('quiet') || lowerTranscript.includes('exit') || lowerTranscript.includes('sleep')) {
            window.speechSynthesis.cancel();
            isSpeakingRef.current = false;
            deactivateAssistant();
            return;
        }

        // B. LANGUAGE SWITCHING
        if (lowerTranscript.includes("tamil")) {
            setSelectedLang('ta-IN');
            speak(translations['ta-IN'].lang_ta);
            resetTranscript();
            return;
        }
        if (lowerTranscript.includes("english")) {
            setSelectedLang('en-IN');
            speak(translations['en-IN'].lang_en);
            resetTranscript();
            return;
        }
        if (lowerTranscript.includes("hindi") || lowerTranscript.includes("hindi language")) {
            setSelectedLang('hi-IN');
            speak(translations['hi-IN'].lang_hi);
            resetTranscript();
            return;
        }
        if (lowerTranscript.includes("telugu") || lowerTranscript.includes("telugu language")) {
            setSelectedLang('te-IN');
            speak(translations['te-IN'].lang_te);
            resetTranscript();
            return;
        }
        if (lowerTranscript.includes("kannada") || lowerTranscript.includes("kannada language")) {
            setSelectedLang('kn-IN');
            speak(translations['kn-IN'].lang_kn);
            resetTranscript();
            return;
        }
        if (lowerTranscript.includes("marathi") || lowerTranscript.includes("marathi language")) {
            setSelectedLang('mr-IN');
            speak(translations['mr-IN'].lang_mr);
            resetTranscript();
            return;
        }

        // C. SPELLING LOOP
        if (isSpellingMode) {
            const clean = lowerTranscript.replace(/[^a-z0-9]/g, '');
            if (lowerTranscript.includes("done") || lowerTranscript.includes("finish")) {
                setIsSpellingMode(false);
                setPendingLetter(null);
                if (spelledName.length > 0) {
                    const formatted = spelledName.charAt(0).toUpperCase() + spelledName.slice(1);
                    dispatchCommand('FORM_FILL', { name: formatted });
                    speak(t('spell_done'));
                } else {
                    speak(t('spell_cancel'));
                }
                setSpelledName("");
                resetTranscript();
                return;
            }
            if (pendingLetter) {
                if (lowerTranscript.includes('yes') || lowerTranscript.includes('ok')) {
                    setSpelledName(prev => prev + pendingLetter);
                    speak(t('confirm_yes'));
                    setPendingLetter(null);
                }
                else if (lowerTranscript.includes('no') || lowerTranscript.includes('wrong')) {
                    speak(t('confirm_discard'));
                    setPendingLetter(null);
                }
                resetTranscript();
                return;
            }
            if (clean.length > 0) {
                let candidate = clean;
                if (clean.length > 1 && letterMap[clean]) candidate = letterMap[clean];
                else if (clean.length > 1) {
                    if (clean === 'space') {
                        setSpelledName(prev => prev + " ");
                        speak("Space");
                        resetTranscript();
                        return;
                    }
                    if (clean.includes("delete")) {
                        setSpelledName(prev => prev.slice(0, -1));
                        speak("Delete");
                        resetTranscript();
                        return;
                    }
                    if (clean.length < 5) candidate = clean.charAt(0);
                    else return;
                }

                if (candidate.length === 1) {
                    setPendingLetter(candidate);
                    speak(t('ask_confirm') + candidate.toUpperCase() + "?");
                    resetTranscript();
                }
            }
            return;
        }

        // B. SPELLING MODE ENTRY
        if (lowerTranscript.includes("spell name") || lowerTranscript.includes("spell")) {
            window.speechSynthesis.cancel();
            isSpeakingRef.current = false;
            setIsSpellingMode(true);
            setSpelledName("");
            speak(t('spell_mode'));
            resetTranscript();
            return;
        }

        // D. FORM FILLING 
        const nameMatch = lowerTranscript.match(/(?:add|fill|set)\s+name\s+(?:is|to|as)?\s?([a-z\s]+)/i);
        if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 0) {
            const val = nameMatch[1].trim();
            if (val !== 'spell') {
                const formattedName = val.charAt(0).toUpperCase() + val.slice(1);
                dispatchCommand('FORM_FILL', { name: formattedName });
                speak(t('val_taken') + formattedName);
                resetTranscript();
                return;
            }
        }

        // 4. GLOBAL READ ALOUD
        if (lowerTranscript.includes("read page") || lowerTranscript.includes("what can i do")) {
            const msg = getPageContext(window.location.pathname);
            speak(msg);
            resetTranscript();
        }

        // 5. GENERAL QUERY
        else {
            if (lowerTranscript.length > 3 && window.location.pathname !== '/' && !isProcessing) {
                fallbackTimerRef.current = setTimeout(() => {
                    if (isAwake) askBackend(lowerTranscript);
                }, 600);
            }
        }

    }, [transcript, isAwake, dispatchCommand, isSpellingMode, spelledName, isConfirmingName, pendingData, pendingName, selectedLang]);


    const askBackend = async (text) => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                speak(t('login_req'));
                setIsProcessing(false);
                return;
            }

            const res = await fetch('http://localhost:5000/api/chat/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: text })
            });

            if (res.status === 401) { navigate('/'); return; }

            const data = await res.json();

            if (data.action === 'FORM_FILL') {
                dispatchCommand('FORM_FILL', data.data);
                speak(t('val_taken'));
            } else if (data.action === 'NAVIGATION') {
                navigate(data.target);
                if (data.target === '/home') speak(t('nav_home'));
                else if (data.target === '/scan') speak(t('nav_scan'));
                else if (data.target === '/payment') speak(t('nav_pay'));
                else if (data.target === '/add-beneficiary') speak(t('nav_add'));
                else if (data.target === '/admin') speak(t('nav_admin'));
                else speak(t('processing'));
            } else if (data.reply) {
                speak(data.reply);
            }
        } catch (e) {
            speak("Error.");
        } finally {
            setIsProcessing(false);
            resetTranscript();
        }
    };

    const getPageContext = (path) => {
        if (path === '/home') return t('home_ctx');
        if (path === '/scan') return t('scan_ctx');
        if (path === '/add-beneficiary') return t('add_ctx');
        if (path === '/payment') return t('pay_ctx');
        if (path === '/admin') return t('admin_ctx');
        return t('ready');
    };

    const playSound = (type) => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        if (type === 'activate') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'deactivate') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        }
    };

    useEffect(() => {
        let timeout;
        if (isAwake && !isSpeakingRef.current) {
            timeout = setTimeout(() => { deactivateAssistant(true); }, 8000);
        }
        return () => clearTimeout(timeout);
    }, [transcript, isAwake]);

    const activateAssistant = () => { playSound('activate'); setIsAwake(true); resetTranscript(); };
    const deactivateAssistant = (silent = false) => {
        if (!silent) speak("Goodbye");
        else playSound('deactivate');
        setIsAwake(false);
        setResponseMsg('');
        resetTranscript();
    };

    const speak = (text) => {
        isSpeakingRef.current = true;
        window.speechSynthesis.cancel();
        setResponseMsg(text);
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        // Use exact match or best prefix match
        const voice = voices.find(v => v.lang === selectedLang) ||
            voices.find(v => v.lang.startsWith(selectedLang.split('-')[0]));
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
            setTimeout(() => { isSpeakingRef.current = false; resetTranscript(); }, 150);
        };
        utterance.onerror = () => { isSpeakingRef.current = false; };
        window.speechSynthesis.speak(utterance);
    };

    const speakAndNavigate = (text, path) => {
        navigate(path);
        setTimeout(() => {
            const contextMsg = getPageContext(path);
            speak(contextMsg);
        }, 300);
        resetTranscript();
    };

    if (!browserSupportsSpeechRecognition) return null;

    return (
        <div className="fixed bottom-8 right-8 flex flex-col items-end z-50 font-sans transition-all duration-500">
            {/* Chat Interface (Always Visible but Dimmed when Asleep) */}
            <div className={`
                mb-4 w-80 bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden 
                transition-all duration-500 ease-in-out ring-1 ring-black/5 origin-bottom-right
                ${isAwake ? 'opacity-100 scale-100 translate-y-0' : 'opacity-80 scale-95 translate-y-4 grayscale-[0.8] hover:opacity-100 hover:grayscale-0'}
            `}>

                {/* Header */}
                <div className={`
                        p-3 flex items-center justify-between text-white shadow-sm transition-colors duration-500
                        ${isAwake ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-600'}
                    `}>
                    <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-sm">
                            <Volume2 size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold tracking-wide">
                            {languages.find(l => l.code === selectedLang)?.name.split(' ')[0] || 'Smart'} Assistant
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => speak(getPageContext(window.location.pathname))}
                            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                            title="Read Screen">
                            <Volume2 size={14} />
                        </button>
                        <button onClick={() => deactivateAssistant(true)}
                            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                            title="Close">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* Body - Blurred/Hidden when Asleep */}
                <div className={`p-4 space-y-4 max-h-[300px] overflow-y-auto transition-all ${isAwake ? '' : 'blur-sm select-none'}`}>

                    {/* Bot Message */}
                    <div className="flex gap-3 items-start">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAwake ? 'bg-indigo-100' : 'bg-slate-200'}`}>
                            <span className="text-xs font-bold text-indigo-600">AI</span>
                        </div>
                        <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700 shadow-sm border border-slate-200">
                            <p>{isAwake ? (responseMsg || t('listening')) : "Say 'Hello' or 'Start' to wake me..."}</p>
                        </div>
                    </div>

                    {/* User Transcript (Live) */}
                    <div className="flex gap-3 items-end justify-end">
                        <div className={`
                                max-w-[85%] rounded-2xl rounded-tr-none p-3 text-sm shadow-sm border
                                ${transcript
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent'
                                : 'bg-white border-slate-100 text-slate-400 italic'}
                            `}>
                            <p>{transcript || "..."}</p>
                        </div>
                    </div>
                </div>

                {/* Footer / Controls */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    {/* Language Selector (Pill) */}
                    <div className="relative group">
                        <select
                            value={selectedLang}
                            onChange={(e) => {
                                setSelectedLang(e.target.value);
                                resetTranscript();
                                window.speechSynthesis.cancel();
                            }}
                            className="appearance-none bg-white border border-slate-200 text-slate-600 text-xs font-semibold py-1.5 pl-3 pr-8 rounded-full shadow-sm cursor-pointer hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        >
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="border-t-[4px] border-t-slate-400 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent"></div>
                        </div>
                    </div>

                    {/* Status Indicator */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-100 shadow-sm transition-colors ${isAwake ? '' : 'opacity-70'}`}>
                        <div className={`w-2 h-2 rounded-full ${isAwake ? (isProcessing ? 'bg-amber-500 animate-ping' : 'bg-green-500 animate-pulse') : 'bg-slate-400'}`}></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {isAwake ? (isProcessing ? 'Thinking' : 'Active') : 'Sleep Mode'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Floating Button (FAB) */}
            <button
                onClick={() => isAwake ? deactivateAssistant() : activateAssistant()}
                className={`
                group relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all duration-500 cursor-pointer
                ${isAwake
                        ? 'bg-gradient-to-br from-red-500 to-pink-600 ring-[6px] ring-red-500/20 rotate-180'
                        : 'bg-gradient-to-br from-indigo-600 to-blue-600 hover:scale-110 hover:shadow-indigo-500/30'}
            `}>

                {/* Ping Effect Ring */}
                {!isAwake && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 animate-ping"></span>
                )}

                {/* Icon */}
                <span className={`transition-transform duration-500 ${isAwake ? 'rotate-180' : ''}`}>
                    {isAwake ? <X className="text-white w-6 h-6" /> : <Mic className="text-white w-7 h-7" />}
                </span>

                {!isAwake && (
                    <div className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-sky-500"></span>
                    </div>
                )}
            </button>
        </div>
    );
};

export default VoiceAssistant;
