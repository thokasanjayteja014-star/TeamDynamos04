import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateBasicsData, generateBasicsQuiz } from '../gemini';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/* ─────────────────────────────────────────────
   STATIC LANGUAGE DATA
───────────────────────────────────────────── */
const LANG_META = {
  Telugu: {
    flag: '🌺', color: 'from-yellow-500 to-orange-500', accent: '#f59e0b', ttsLang: 'te-IN',
    script: 'Telugu Script',
    fact: 'Telugu is called the "Italian of the East" — almost every word ends in a vowel.',
    alphabet: ['అ', 'ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ', 'ఋ', 'ఎ', 'ఏ', 'ఐ', 'ఒ', 'ఓ', 'ఔ', 'అం', 'అః'],
    consonants: ['క', 'ఖ', 'గ', 'ఘ', 'చ', 'ఛ', 'జ', 'ఝ', 'ట', 'ఠ', 'డ', 'ఢ', 'త', 'థ', 'ద', 'ధ', 'న', 'ప', 'ఫ', 'బ', 'భ', 'మ', 'య', 'ర', 'ల', 'వ', 'శ', 'ష', 'స', 'హ', 'ళ', 'క్ష'],
    structure: 'Subject → Object → Verb',
    structureEx: 'నేను అన్నం తింటాను', structureGloss: 'I  rice  eat',
    scriptFact: 'Telugu and Kannada scripts share ~80% of their letter shapes — both descended from the Kadamba script.',
    tips: ['Every word ends in a vowel sound', 'Agglutinative: suffixes change meaning', 'SOV order (opposite of English)', 'No articles like "a" or "the"', 'Respectful "you" = మీరు, casual = నువ్వు'],
    coreWords: [
      { word: 'నమస్కారం', roman: 'Namaskaram', meaning: 'Hello / Greetings', category: 'Greeting' },
      { word: 'ధన్యవాదాలు', roman: 'Dhanyavaadaalu', meaning: 'Thank you', category: 'Polite' },
      { word: 'అవును', roman: 'Avunu', meaning: 'Yes', category: 'Basic' },
      { word: 'కాదు', roman: 'Kaadu', meaning: 'No', category: 'Basic' },
      { word: 'నేను', roman: 'Nenu', meaning: 'I / Me', category: 'Pronoun' },
      { word: 'మీరు', roman: 'Meeru', meaning: 'You (respectful)', category: 'Pronoun' },
      { word: 'అతను', roman: 'Atanu', meaning: 'He', category: 'Pronoun' },
      { word: 'ఆమె', roman: 'Aame', meaning: 'She', category: 'Pronoun' },
      { word: 'నీళ్ళు', roman: 'Neellu', meaning: 'Water', category: 'Food' },
      { word: 'అన్నం', roman: 'Annam', meaning: 'Rice / Food', category: 'Food' },
      { word: 'ఇల్లు', roman: 'Illu', meaning: 'House / Home', category: 'Place' },
      { word: 'పాఠశాల', roman: 'Paathashaala', meaning: 'School', category: 'Place' },
    ],
    numbers: ['ఒకటి', 'రెండు', 'మూడు', 'నాలుగు', 'అయిదు', 'ఆరు', 'ఏడు', 'ఎనిమిది', 'తొమ్మిది', 'పది'],
  },
  Hindi: {
    flag: '🌸', color: 'from-orange-500 to-amber-500', accent: '#f97316', ttsLang: 'hi-IN',
    script: 'Devanagari Script',
    fact: 'Hindi is written in Devanagari — almost entirely phonetic, you read exactly what you see.',
    alphabet: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'],
    consonants: ['क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'झ', 'ट', 'ठ', 'ड', 'ढ', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह'],
    structure: 'Subject → Object → Verb',
    structureEx: 'मैं खाना खाता हूँ', structureGloss: 'I  food  eat',
    scriptFact: 'The horizontal line on Devanagari letters (शिरोरेखा) is the "headline" — letters hang from it like clothes on a washing line.',
    tips: ['Nearly phonetic — read what you see', 'Nouns have gender (masculine/feminine)', 'SOV word order', 'Uses postpositions, not prepositions', 'Verb agrees with subject\'s gender'],
    coreWords: [
      { word: 'नमस्ते', roman: 'Namaste', meaning: 'Hello', category: 'Greeting' },
      { word: 'धन्यवाद', roman: 'Dhanyavaad', meaning: 'Thank you', category: 'Polite' },
      { word: 'हाँ', roman: 'Haan', meaning: 'Yes', category: 'Basic' },
      { word: 'नहीं', roman: 'Nahin', meaning: 'No', category: 'Basic' },
      { word: 'मैं', roman: 'Main', meaning: 'I / Me', category: 'Pronoun' },
      { word: 'आप', roman: 'Aap', meaning: 'You (formal)', category: 'Pronoun' },
      { word: 'वह', roman: 'Vah', meaning: 'He / She', category: 'Pronoun' },
      { word: 'हम', roman: 'Hum', meaning: 'We', category: 'Pronoun' },
      { word: 'पानी', roman: 'Paani', meaning: 'Water', category: 'Food' },
      { word: 'खाना', roman: 'Khaana', meaning: 'Food', category: 'Food' },
      { word: 'घर', roman: 'Ghar', meaning: 'Home', category: 'Place' },
      { word: 'स्कूल', roman: 'Skool', meaning: 'School', category: 'Place' },
    ],
    numbers: ['एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस'],
  },
  Tamil: {
    flag: '🌴', color: 'from-red-500 to-rose-600', accent: '#ef4444', ttsLang: 'ta-IN',
    script: 'Tamil Script',
    fact: 'Tamil is one of the world\'s oldest classical languages with over 2,000 years of recorded literature.',
    alphabet: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ'],
    consonants: ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'],
    structure: 'Subject → Object → Verb',
    structureEx: 'நான் சாப்பிடுகிறேன்', structureGloss: 'I  (food)  eat',
    scriptFact: 'Tamil has exactly 247 characters — 12 vowels × 18 consonants = 216 combined, plus standalone letters.',
    tips: ['One of the world\'s oldest languages', 'SOV word order', 'No aspirated consonants', 'Formal written vs spoken Tamil differ greatly', 'Verb encodes subject via suffixes'],
    coreWords: [
      { word: 'வணக்கம்', roman: 'Vanakkam', meaning: 'Hello', category: 'Greeting' },
      { word: 'நன்றி', roman: 'Nandri', meaning: 'Thank you', category: 'Polite' },
      { word: 'ஆம்', roman: 'Aam', meaning: 'Yes', category: 'Basic' },
      { word: 'இல்லை', roman: 'Illai', meaning: 'No', category: 'Basic' },
      { word: 'நான்', roman: 'Naan', meaning: 'I / Me', category: 'Pronoun' },
      { word: 'நீங்கள்', roman: 'Neengal', meaning: 'You (formal)', category: 'Pronoun' },
      { word: 'அவன்', roman: 'Avan', meaning: 'He', category: 'Pronoun' },
      { word: 'அவள்', roman: 'Aval', meaning: 'She', category: 'Pronoun' },
      { word: 'தண்ணீர்', roman: 'Thanneer', meaning: 'Water', category: 'Food' },
      { word: 'சாப்பாடு', roman: 'Saappaadu', meaning: 'Food / Meal', category: 'Food' },
      { word: 'வீடு', roman: 'Veedu', meaning: 'House', category: 'Place' },
      { word: 'பள்ளி', roman: 'Palli', meaning: 'School', category: 'Place' },
    ],
    numbers: ['ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது', 'பத்து'],
  },
  Kannada: {
    flag: '🌻', color: 'from-yellow-400 to-red-500', accent: '#eab308', ttsLang: 'kn-IN',
    script: 'Kannada Script',
    fact: 'Kannada script is also used for Sanskrit and has one of the oldest writing traditions in South India.',
    alphabet: ['ಅ', 'ಆ', 'ಇ', 'ಈ', 'ಉ', 'ಊ', 'ಎ', 'ಏ', 'ಐ', 'ಒ', 'ಓ', 'ಔ'],
    consonants: ['ಕ', 'ಖ', 'ಗ', 'ಘ', 'ಚ', 'ಛ', 'ಜ', 'ಝ', 'ಟ', 'ಠ', 'ಡ', 'ಢ', 'ತ', 'ಥ', 'ದ', 'ಧ', 'ನ', 'ಪ', 'ಫ', 'ಬ', 'ಭ', 'ಮ', 'ಯ', 'ರ', 'ಲ', 'ವ', 'ಶ', 'ಷ', 'ಸ', 'ಹ', 'ಳ'],
    structure: 'Subject → Object → Verb',
    structureEx: 'ನಾನು ಊಟ ತಿನ್ನುತ್ತೇನೆ', structureGloss: 'I  food  eat',
    scriptFact: 'Kannada and Telugu scripts look very similar — learning one makes the other 30% easier to recognise.',
    tips: ['Very similar to Telugu script', 'SOV word order', 'Agglutinative language', 'Words typically end in vowels', 'Two levels of formality in pronouns'],
    coreWords: [
      { word: 'ನಮಸ್ಕಾರ', roman: 'Namaskara', meaning: 'Hello', category: 'Greeting' },
      { word: 'ಧನ್ಯವಾದ', roman: 'Dhanyavaada', meaning: 'Thank you', category: 'Polite' },
      { word: 'ಹೌದು', roman: 'Houdu', meaning: 'Yes', category: 'Basic' },
      { word: 'ಇಲ್ಲ', roman: 'Illa', meaning: 'No', category: 'Basic' },
      { word: 'ನಾನು', roman: 'Naanu', meaning: 'I / Me', category: 'Pronoun' },
      { word: 'ನೀವು', roman: 'Neevu', meaning: 'You (formal)', category: 'Pronoun' },
      { word: 'ಅವನು', roman: 'Avanu', meaning: 'He', category: 'Pronoun' },
      { word: 'ಅವಳು', roman: 'Avalu', meaning: 'She', category: 'Pronoun' },
      { word: 'ನೀರು', roman: 'Neeru', meaning: 'Water', category: 'Food' },
      { word: 'ಊಟ', roman: 'Oota', meaning: 'Food / Meal', category: 'Food' },
      { word: 'ಮನೆ', roman: 'Mane', meaning: 'Home', category: 'Place' },
      { word: 'ಶಾಲೆ', roman: 'Shaale', meaning: 'School', category: 'Place' },
    ],
    numbers: ['ಒಂದು', 'ಎರಡು', 'ಮೂರು', 'ನಾಲ್ಕು', 'ಐದು', 'ಆರು', 'ಏಳು', 'ಎಂಟು', 'ಒಂಬತ್ತು', 'ಹತ್ತು'],
  },
  English: {
    flag: '🗺️', color: 'from-blue-500 to-indigo-600', accent: '#6366f1', ttsLang: 'en-US',
    script: 'Latin Script',
    fact: 'English has borrowed words from over 350 languages, making it one of the most irregular vocabularies.',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    consonants: 'BCDFGHJKLMNPQRSTVWXYZ'.split(''),
    structure: 'Subject → Verb → Object',
    structureEx: 'I eat rice', structureGloss: 'I  eat  rice',
    scriptFact: 'English spelling is irregular because it absorbed words from French, Latin, Norse, and German over 1,000+ years.',
    tips: ['SVO word order', 'Not phonetic — spelling ≠ pronunciation', 'No gendered nouns', 'Uses articles: a, an, the', '12 verb tenses'],
    coreWords: [
      { word: 'Hello', roman: 'Hello', meaning: 'Greeting', category: 'Greeting' },
      { word: 'Thank you', roman: 'Thank you', meaning: 'Gratitude', category: 'Polite' },
      { word: 'Yes', roman: 'Yes', meaning: 'Affirmation', category: 'Basic' },
      { word: 'No', roman: 'No', meaning: 'Negation', category: 'Basic' },
      { word: 'I', roman: 'I', meaning: 'First person', category: 'Pronoun' },
      { word: 'You', roman: 'You', meaning: 'Second person', category: 'Pronoun' },
      { word: 'He', roman: 'He', meaning: 'Male pronoun', category: 'Pronoun' },
      { word: 'She', roman: 'She', meaning: 'Female pronoun', category: 'Pronoun' },
      { word: 'Water', roman: 'Water', meaning: 'H₂O', category: 'Food' },
      { word: 'Food', roman: 'Food', meaning: 'Nourishment', category: 'Food' },
      { word: 'Home', roman: 'Home', meaning: 'Residence', category: 'Place' },
      { word: 'School', roman: 'School', meaning: 'Learning place', category: 'Place' },
    ],
    numbers: ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'],
  },
};
const DEFAULT_META = {
  flag: '🌐', color: 'from-gray-500 to-gray-600', accent: '#6b7280', ttsLang: 'en-US',
  script: '', fact: '', alphabet: [], consonants: [], structure: '', structureEx: '',
  structureGloss: '', scriptFact: '', tips: [], coreWords: [], numbers: [],
};

/* ── speak helper ── */
const speak = (text, lang) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang || 'en-US'; u.rate = 0.82;
  const vs = window.speechSynthesis.getVoices();
  const match = vs.find(v => v.lang === lang) || vs.find(v => v.lang.startsWith((lang || '').split('-')[0]));
  if (match) u.voice = match;
  window.speechSynthesis.speak(u);
};

/* ── category badge colours ── */
const CAT = {
  Greeting: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  Polite: 'bg-pink-500/15   text-pink-300   border-pink-500/25',
  Basic: 'bg-blue-500/15   text-blue-300   border-blue-500/25',
  Pronoun: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  Food: 'bg-amber-500/15  text-amber-300  border-amber-500/25',
  Place: 'bg-cyan-500/15   text-cyan-300   border-cyan-500/25',
  Travel: 'bg-sky-500/15    text-sky-300    border-sky-500/25',
  Dining: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
  Emergency: 'bg-red-500/15    text-red-300    border-red-500/25',
};
const catCls = c => CAT[c] || 'bg-gray-500/15 text-gray-300 border-gray-500/25';

/* ── AlphaTile ── */
const AlphaTile = ({ char, color, ttsLang }) => {
  const [pop, setPop] = useState(false);
  const click = () => {
    speak(char, ttsLang); setPop(true);
    setTimeout(() => setPop(false), 600);
  };
  return (
    <button onClick={click}
      className={`w-11 h-11 rounded-xl font-black text-base flex items-center justify-center
        bg-gradient-to-br ${color} text-white border border-white/15 shadow-md
        transition-all duration-150 hover:scale-125 select-none
        ${pop ? 'scale-150 ring-2 ring-white/50' : ''}`}>
      {char}
    </button>
  );
};

/* ── CoreWordCard ── */
const CoreWordCard = ({ word, roman, meaning, category, color, ttsLang, showRoman }) => {
  const [active, setActive] = useState(false);
  const onSpeak = e => {
    e.stopPropagation(); speak(word, ttsLang);
    setActive(true); setTimeout(() => setActive(false), 700);
  };
  return (
    <div className={`rounded-2xl p-4 border transition-all duration-200 group cursor-default
      ${active ? 'border-white/25 bg-white/10 scale-105' : 'border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.05]'}`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${catCls(category)}`}>{category}</span>
        <button onClick={onSpeak}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all flex-shrink-0
            ${active ? 'bg-white/25 scale-110' : 'bg-white/8 hover:bg-white/15'}`}>
          🔊
        </button>
      </div>
      <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent mb-1 leading-tight`}>{word}</p>
      {showRoman && <p className="text-[11px] text-gray-500 font-semibold italic">{roman}</p>}
      <p className="text-xs font-semibold text-gray-400 mt-2 group-hover:text-gray-300 transition-colors">{meaning}</p>
    </div>
  );
};

/* ── FlashCard (3D flip) ── */
const FlashCard = ({ term, definition, category, ttsLang }) => {
  const [flipped, setFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const onSpeak = e => {
    e.stopPropagation(); speak(term, ttsLang);
    setSpeaking(true); setTimeout(() => setSpeaking(false), 1500);
  };
  return (
    <div className="relative h-52 cursor-pointer" style={{ perspective: '1000px' }}
      onClick={() => setFlipped(f => !f)}>
      <div className="w-full h-full transition-all duration-500"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}>
        {/* front */}
        <div className="absolute inset-0 rounded-2xl border border-white/[0.08] bg-white/[0.03] flex flex-col items-center justify-center gap-3 p-5"
          style={{ backfaceVisibility: 'hidden' }}>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${catCls(category)}`}>{category}</span>
          <p className="text-xl font-black text-white text-center leading-snug">{term}</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button onClick={onSpeak}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all
                ${speaking ? 'bg-white/25 text-white' : 'bg-white/8 text-gray-400 hover:bg-white/15'}`}>
              {speaking ? '🔊 Playing…' : '🔊 Hear'}
            </button>
            <span className="text-[11px] text-gray-600 font-medium">tap to flip →</span>
          </div>
        </div>
        {/* back */}
        <div className="absolute inset-0 rounded-2xl border border-violet-500/25 flex flex-col items-center justify-center gap-3 p-5"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg,#5b21b6,#7c3aed)' }}>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-white/15 text-white`}>{category}</span>
          <p className="text-2xl font-black text-white text-center">{definition}</p>
          <p className="text-xs text-violet-200 font-semibold">✓ meaning · tap to flip back</p>
        </div>
      </div>
    </div>
  );
};

/* ── PhrasesTab ── */
const PhrasesTab = ({ flashcards, ttsLang, meta }) => {
  const [cat, setCat] = useState('All');
  const cats = ['All', ...Array.from(new Set(flashcards.map(f => f.category).filter(Boolean)))];
  const items = cat === 'All' ? flashcards : flashcards.filter(f => f.category === cat);

  if (!flashcards.length) return (
    <div className="text-center py-16 text-gray-600">
      <p className="text-5xl mb-4">📡</p>
      <p className="font-black text-base text-gray-500">No phrases loaded yet.</p>
      <p className="text-sm mt-2 font-medium">Re-visit Basics from Dashboard to regenerate AI phrases.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black">Survival Phrases</h2>
        <p className="text-xs text-gray-500 font-medium mt-1">🔊 Tap to hear · Tap card to reveal meaning</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-black transition-all border ${cat === c
                ? `bg-gradient-to-r ${meta.color} text-white border-transparent shadow-lg`
                : 'bg-white/[0.03] border-white/[0.08] text-gray-500 hover:text-gray-300 hover:bg-white/[0.06]'
              }`}>
            {c} {c !== 'All' && `(${flashcards.filter(f => f.category === c).length})`}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((fc, i) => (
          <FlashCard key={i} term={fc.term} definition={fc.definition} category={fc.category} ttsLang={ttsLang} />
        ))}
      </div>
      <div className="rounded-2xl p-4 bg-amber-500/8 border border-amber-500/15 flex gap-3">
        <span className="text-lg">💡</span>
        <p className="text-xs text-amber-200 font-semibold">
          <span className="font-black text-amber-400">Practice tip:</span> Hear → flip → say aloud. Repeat 3 times for retention!
        </p>
      </div>
    </div>
  );
};

/* ── AIQuizTab ── */
const AIQuizTab = ({ learningLang, nativeLang, ttsLang }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qError, setQError] = useState('');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExp, setShowExp] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [history, setHistory] = useState([]);

  const loadQuiz = useCallback(async () => {
    setLoading(true); setQError('');
    setIdx(0); setSelected(null); setShowExp(false);
    setScore(0); setDone(false); setHistory([]);
    try {
      const data = await generateBasicsQuiz(learningLang, nativeLang);
      if (!data?.questions?.length) throw new Error('No questions');
      // cap at 5-6 questions
      setQuestions(data.questions.slice(0, 6));
    } catch { setQError('Failed to generate quiz. Please try again.'); }
    finally { setLoading(false); }
  }, [learningLang, nativeLang]);

  const pick = (opt) => {
    if (selected) return;
    const q = questions[idx];
    const correct = opt === q.correct;
    setSelected(opt); setShowExp(true);
    if (correct) setScore(s => s + 1);
    setHistory(h => [...h, { ...q, chosen: opt, isCorrect: correct }]);
  };

  const next = () => {
    if (idx + 1 >= questions.length) { setDone(true); return; }
    setIdx(i => i + 1); setSelected(null); setShowExp(false);
  };

  /* START */
  if (!loading && !questions.length && !qError) return (
    <div className="text-center py-12 max-w-sm mx-auto">
      <div className="text-6xl mb-4">🧠</div>
      <h2 className="text-xl font-black mb-2">AI Vocabulary Quiz</h2>
      <p className="text-gray-500 text-sm font-medium mb-5">
        5–6 questions generated live — no stories, just vocabulary for the Basics section.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {['Greetings', 'Numbers', 'Pronouns', 'Food', 'Places'].map(t => (
          <span key={t} className="text-xs font-black px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">{t}</span>
        ))}
      </div>
      <button onClick={loadQuiz}
        className="px-8 py-4 rounded-2xl font-black text-white text-sm shadow-xl transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 8px 32px rgba(124,58,237,0.35)' }}>
        Generate Quiz ✨
      </button>
    </div>
  );

  if (loading) return (
    <div className="text-center py-16">
      <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-400 font-semibold text-sm">Generating quiz with AI…</p>
    </div>
  );

  if (qError) return (
    <div className="text-center py-12">
      <p className="text-5xl mb-4">⚠️</p>
      <p className="text-red-400 font-black mb-4">{qError}</p>
      <button onClick={loadQuiz} className="px-6 py-3 rounded-xl font-black text-sm bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all">Retry</button>
    </div>
  );

  /* DONE screen */
  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center rounded-3xl p-8 border border-white/[0.06]"
          style={{ background: `linear-gradient(135deg, ${pct >= 70 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}, transparent)` }}>
          <div className="text-5xl mb-3">{pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : '💪'}</div>
          <div className="text-4xl font-black mb-1">{score}/{questions.length}</div>
          <p className="text-gray-400 font-semibold text-sm">{pct}% correct</p>
        </div>
        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={i} className={`rounded-2xl p-4 border text-sm ${h.isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
              }`}>
              <p className="font-black text-xs text-gray-400 mb-2">{h.question}</p>
              {h.word_in_learning_lang && (
                <p className="font-black text-base mb-1">{h.word_in_learning_lang}</p>
              )}
              <p className={`font-semibold ${h.isCorrect ? 'text-emerald-400' : 'text-red-400 line-through'}`}>
                {h.isCorrect ? '✓' : '✗'} {h.chosen}
              </p>
              {!h.isCorrect && (
                <p className="text-emerald-400 font-black text-sm mt-1">✓ {h.correct}</p>
              )}
            </div>
          ))}
        </div>
        <button onClick={loadQuiz}
          className="w-full py-4 rounded-2xl font-black text-white text-sm transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
          Try Again ↺
        </button>
      </div>
    );
  }

  /* QUESTION */
  const q = questions[idx];
  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((idx + 1) / questions.length) * 100}%`, background: 'linear-gradient(90deg,#7c3aed,#4f46e5)' }} />
        </div>
        <span className="text-xs font-black text-gray-500">{idx + 1}/{questions.length}</span>
      </div>

      {/* question card */}
      <div className="rounded-3xl p-6 border border-white/[0.07] bg-white/[0.02]">
        {q.type === 'word_to_meaning'
          ? <><p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">What does this mean?</p>
            <button onClick={() => speak(q.word_in_learning_lang, ttsLang)}
              className="text-4xl font-black mb-4 block hover:scale-105 transition-all">
              {q.word_in_learning_lang} 🔊
            </button>
            <p className="text-sm text-gray-500 font-medium">{q.question}</p></>
          : <><p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">How do you say this?</p>
            <p className="text-2xl font-black mb-2">{q.word_in_learning_lang || q.question}</p>
            <p className="text-sm text-gray-500 font-medium">{q.question}</p></>
        }
      </div>

      {/* options */}
      <div className="grid grid-cols-2 gap-3">
        {q.options?.map((opt, i) => {
          const isCorrect = opt === q.correct;
          const isPicked = opt === selected;
          return (
            <button key={i} onClick={() => pick(opt)} disabled={!!selected}
              className={`p-4 rounded-2xl font-black text-sm text-left transition-all border ${!selected
                  ? 'border-white/[0.08] bg-white/[0.03] hover:border-violet-500/40 hover:bg-violet-500/8 hover:scale-[1.02] cursor-pointer'
                  : isCorrect ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 cursor-default'
                    : isPicked ? 'border-red-500/50 bg-red-500/10 text-red-300 cursor-default'
                      : 'border-white/[0.04] bg-transparent text-gray-600 cursor-default opacity-50'
                }`}>
              <span className="mr-2 text-gray-600 text-[11px]">{String.fromCharCode(65 + i)}.</span>
              {opt}
              {selected && isCorrect && <span className="ml-1">✓</span>}
              {selected && isPicked && !isCorrect && <span className="ml-1">✗</span>}
            </button>
          );
        })}
      </div>

      {/* explanation */}
      {showExp && (
        <div className={`rounded-2xl p-4 border text-sm font-semibold ${selected === q.correct
            ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-300'
            : 'border-red-500/20 bg-red-500/8 text-red-300'
          }`}>
          {selected === q.correct ? '✓ Correct! ' : `✗ Correct: "${q.correct}". `}
          <span className="text-gray-400">{q.explanation}</span>
        </div>
      )}

      {selected && (
        <button onClick={next}
          className="w-full py-4 rounded-2xl font-black text-white text-sm transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 6px 24px rgba(124,58,237,0.3)' }}>
          {idx + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
        </button>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN BasicsPage
───────────────────────────────────────────── */
const SECTIONS = [
  { id: 'overview', label: '📖 Overview' },
  { id: 'alphabet', label: '🔤 Alphabet' },
  { id: 'words', label: '📝 Words' },
  { id: 'phrases', label: '💬 Phrases' },
  { id: 'quiz', label: '🧠 Quiz' },
];

const BasicsPage = () => {
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [userData, setUserData] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRoman, setShowRoman] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const user = auth.currentUser;
        if (!user) { navigate('/'); return; }
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists()) { navigate('/onboarding'); return; }
        const ud = snap.data();
        setUserData(ud);

        /* load cached phrases */
        if (ud.cached_basics) {
          try {
            const parsed = typeof ud.cached_basics === 'string'
              ? JSON.parse(ud.cached_basics) : ud.cached_basics;
            if (parsed?.phrases?.length) setFlashcards(parsed.phrases);
          } catch { }
        }
      } catch (e) { setError('Failed to load. ' + e.message); }
      finally { setLoading(false); }
    };
    load();
  }, [navigate]);

  /* generate AI phrases */
  const generatePhrases = useCallback(async () => {
    if (!userData) return;
    setGenLoading(true); setError('');
    try {
      const data = await generateBasicsData(userData.learning_lang, userData.native_lang);
      if (!data?.phrases?.length) throw new Error('No phrases returned');
      setFlashcards(data.phrases);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        cached_basics: JSON.stringify({ phrases: data.phrases, ts: Date.now() }),
      });
    } catch (e) { setError('Failed to generate phrases: ' + e.message); }
    finally { setGenLoading(false); }
  }, [userData]);

  useEffect(() => {
    if (userData && section === 'phrases' && !flashcards.length && !genLoading) {
      generatePhrases();
    }
  }, [section, userData, flashcards.length, genLoading, generatePhrases]);

  if (loading) return (
    <div className="min-h-screen bg-[#080a12] flex items-center justify-center" style={{ fontFamily: "'Sora','DM Sans',sans-serif" }}>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm font-semibold">Loading Basics…</p>
      </div>
    </div>
  );

  const learningLang = userData?.learning_lang || 'Telugu';
  const nativeLang = userData?.native_lang || 'English';
  const meta = LANG_META[learningLang] || DEFAULT_META;

  return (
    <div className="min-h-screen w-full bg-[#080a12] text-white pb-28"
      style={{ fontFamily: "'Sora','DM Sans',sans-serif" }}>

      {/* error */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
          bg-red-950/90 border border-red-500/30 text-red-300 rounded-2xl px-5 py-3.5 shadow-2xl text-sm font-semibold max-w-[90vw]">
          ⚠️ {error}
          <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-300 font-black">✕</button>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#080a12]/90 backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all border border-white/[0.06]">
              ←
            </button>
            <div>
              <h1 className="font-black text-sm leading-tight">{learningLang} Basics</h1>
              <p className="text-[10px] text-gray-600 font-medium">{meta.script}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-full px-4 py-2">
            <span className="text-sm font-black" style={{ backgroundImage: `linear-gradient(90deg, #f59e0b, #f97316)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {meta.flag} {learningLang}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowRoman(s => !s)}
              className="hidden sm:flex text-xs font-black px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-gray-400 hover:text-gray-200 transition-all">
              {showRoman ? '👁️ Hide' : '👁️ Roman'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 mt-6">
        {/* ── HERO BANNER ── */}
        <div className="relative mb-6 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-900/50 via-purple-900/30 to-fuchsia-900/20 border border-violet-500/15 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-fuchsia-500/8 rounded-full blur-3xl pointer-events-none translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10">
            <span className="inline-block bg-white/10 text-violet-300 text-xs font-black px-3 py-1 rounded-full mb-3 uppercase tracking-widest border border-white/5">
              {meta.script}
            </span>
            <h1 className="text-3xl md:text-5xl font-black mb-3">
              Learn <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">{learningLang}</span>
            </h1>
            <p className="text-white/70 max-w-lg font-semibold text-sm leading-relaxed">
              {meta.fact}
            </p>
          </div>
          <div className="relative z-10 text-8xl select-none shrink-0 filter drop-shadow-[0_0_40px_rgba(139,92,246,0.3)]">
            {meta.flag}
          </div>
        </div>

        {/* section tabs */}
        <div className="flex gap-1 bg-white/5 border border-white/8 rounded-2xl p-1 mb-8 overflow-x-auto scrollbar-hide">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all ${section === s.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {section === 'overview' && (
          <div className="space-y-5">
            <div className="rounded-3xl p-6 border border-white/[0.07] bg-white/[0.02] grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-black text-sm text-gray-300 mb-3">📐 Sentence Structure</h3>
                <div className="flex items-center gap-2 mb-3">
                  {meta.structure.split(' → ').map((part, i, arr) => (
                    <React.Fragment key={part}>
                      <span className="px-3 py-1.5 rounded-xl text-xs font-black border"
                        style={{ background: `${meta.accent}15`, borderColor: `${meta.accent}30`, color: meta.accent }}>
                        {part}
                      </span>
                      {i < arr.length - 1 && <span className="text-gray-700 text-xs">→</span>}
                    </React.Fragment>
                  ))}
                </div>
                <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-lg font-black mb-0.5">{meta.structureEx}</p>
                  <p className="text-xs text-gray-600 font-mono font-medium">{meta.structureGloss}</p>
                </div>
              </div>
              <div>
                <h3 className="font-black text-sm text-gray-300 mb-3">💡 Quick Tips</h3>
                <ul className="space-y-2">
                  {meta.tips.map((tip, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-xs text-gray-400 font-semibold">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: `${meta.accent}25`, color: meta.accent }}>
                        {i + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* numbers */}
            <div className="rounded-3xl p-6 border border-white/[0.07] bg-white/[0.02]">
              <h3 className="font-black text-sm text-gray-300 mb-4">🔢 Numbers 1–10 <span className="text-gray-600 font-semibold">(tap to hear)</span></h3>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {meta.numbers.map((n, i) => (
                  <button key={i} onClick={() => speak(n, meta.ttsLang)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center font-black text-sm text-white shadow-md hover:scale-110 active:scale-95 transition-all bg-gradient-to-br ${meta.color}`}>
                    <span className="text-base">{n}</span>
                    <span className="text-[9px] opacity-50">{i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ ALPHABET ══ */}
        {section === 'alphabet' && (
          <div className="space-y-5">
            <div className="rounded-2xl p-4 bg-sky-500/8 border border-sky-500/15 flex gap-3">
              <span className="text-lg">🔊</span>
              <p className="text-xs text-sky-200 font-semibold">
                <span className="font-black text-sky-400">Click any character to hear it!</span> Best on mobile devices with Indian language voices installed.
              </p>
            </div>

            <div className="rounded-3xl p-6 border border-white/[0.07] bg-white/[0.02]">
              <h2 className="text-lg font-black mb-4">Vowels <span className="text-gray-600 font-semibold text-sm">({meta.alphabet.length})</span></h2>
              <div className="flex flex-wrap gap-2">
                {meta.alphabet.map((c, i) => <AlphaTile key={i} char={c} color={meta.color} ttsLang={meta.ttsLang} />)}
              </div>
            </div>

            <div className="rounded-3xl p-6 border border-white/[0.07] bg-white/[0.02]">
              <h2 className="text-lg font-black mb-4">Consonants <span className="text-gray-600 font-semibold text-sm">({meta.consonants.length})</span></h2>
              <div className="flex flex-wrap gap-2">
                {meta.consonants.map((c, i) => <AlphaTile key={i} char={c} color="from-gray-600 to-gray-700" ttsLang={meta.ttsLang} />)}
              </div>
            </div>

            <div className="rounded-2xl p-4 bg-amber-500/8 border border-amber-500/15 flex gap-3">
              <span className="text-lg">🤔</span>
              <div>
                <p className="font-black text-amber-400 text-sm mb-0.5">Script Fun Fact</p>
                <p className="text-xs text-gray-400 font-semibold">{meta.scriptFact}</p>
              </div>
            </div>
          </div>
        )}

        {/* ══ WORDS ══ */}
        {section === 'words' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-black">Core Vocabulary</h2>
                <p className="text-xs text-gray-500 font-medium mt-1">Tap 🔊 on any card to hear pronunciation</p>
              </div>
              <button onClick={() => setShowRoman(s => !s)}
                className="text-xs font-black px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all text-gray-400 hover:text-gray-200">
                {showRoman ? '👁️ Hide Romanization' : '👁️ Show Romanization'}
              </button>
            </div>

            {['Greeting', 'Polite', 'Basic', 'Pronoun', 'Food', 'Place'].map(cat => {
              const words = meta.coreWords.filter(w => w.category === cat);
              if (!words.length) return null;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-white/[0.05]" />
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border ${catCls(cat)}`}>{cat}</span>
                    <div className="flex-1 h-px bg-white/[0.05]" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {words.map((w, i) => (
                      <CoreWordCard key={i} {...w} color={meta.color} ttsLang={meta.ttsLang} showRoman={showRoman} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PHRASES ══ */}
        {section === 'phrases' && (
          genLoading
            ? <div className="text-center py-16">
              <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm font-semibold">Generating AI survival phrases…</p>
              <p className="text-gray-600 text-xs font-medium mt-2">Travel · Dining · Emergency contexts</p>
            </div>
            : <PhrasesTab flashcards={flashcards} ttsLang={meta.ttsLang} meta={meta} />
        )}

        {/* ══ QUIZ ══ */}
        {section === 'quiz' && (
          <AIQuizTab learningLang={learningLang} nativeLang={nativeLang} ttsLang={meta.ttsLang} />
        )}
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#080a12]/95 backdrop-blur-2xl border-t border-white/[0.05] px-4 py-4 z-50">
        <div className="max-w-5xl mx-auto flex gap-3 justify-center">
          <button onClick={() => navigate('/test')}
            className="flex-1 max-w-xs py-3.5 rounded-xl font-black text-sm text-black transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
            ⚡ Placement Test (+20 🪙)
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 max-w-xs py-3.5 rounded-xl font-black text-sm text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
            🗺️ Go to Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasicsPage;