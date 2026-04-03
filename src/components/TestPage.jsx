import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generatePlacementTest, validateAnswer } from '../gemini';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import DragDropAnswer from './DragDropAnswer';
import LoadingSpinner from './LoadingSpinner';
import ErrorToast from './ErrorToast';
import Popup from './Popup';

const TestPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [resultsData, setResultsData] = useState([]);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchAndGenerate = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const data = userDoc.data();
        setUserData(data);

        // Generate isolated 3-question placement test
        const content = await generatePlacementTest(
          data.learning_lang, 
          data.native_lang
        );
        // We only use the questions array from the response here, and shuffle the options
        const shuffledQs = content.questions.slice(0, 3).map(q => ({
          ...q,
          available_tiles: [...q.available_tiles].sort(() => Math.random() - 0.5)
        }));
        setQuestions(shuffledQs); 
      } catch (err) {
        setError("Failed to generate test. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAndGenerate();
  }, []);

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    setValidating(true);
    let allResults = [];
    let correctCount = 0;

    try {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAnswerArray = answers[q.id] || [];
        const userSentence = userAnswerArray.join(" ");
        const correctSentence = q.correct_answer_tiles.join(" ");
        
        const validation = await validateAnswer(
          userSentence, 
          correctSentence, 
          userData.learning_lang, 
          q.text_native
        );

        if (validation.is_correct) correctCount++;

        allResults.push({
          question: q.text_native,
          yourAnswer: userSentence,
          correctAnswer: correctSentence,
          isCorrect: validation.is_correct,
          score: validation.similarity_score
        });
      }

      setResultsData(allResults);
      setShowResults(true);

      // Give bonus coins regardless of perfect score just for completing the test
      const newCoins = userData.total_coins + 20;
      await updateDoc(doc(db, "users", auth.currentUser.uid), { total_coins: newCoins });

    } catch (err) {
      setError("Failed to validate answers.");
    } finally {
      setValidating(false);
    }
  };

  if (loading) return <LoadingSpinner text="Generating Personalized Test..." />;

  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center bg-[#0d0f1a] text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <ErrorToast message={error} onClose={() => setError('')} />
      
      {/* Back Button */}
      <div className="w-full max-w-2xl mb-4">
        <button onClick={() => navigate('/dashboard')} className="font-bold text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
          ← Back to Dashboard
        </button>
      </div>

      {!showResults && currentQ && (
        <div className="w-full max-w-2xl p-8 rounded-3xl border border-white/10 bg-black/30 backdrop-blur shadow-2xl">
          <div className="flex justify-between items-center mb-6 text-gray-400 font-bold text-sm">
            <span>Assessment Test</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Question {currentIdx + 1} / {questions.length}</span>
          </div>

          <h3 className="text-2xl font-black mb-2 text-white text-center leading-snug">{currentQ.text_native}</h3>
          <p className="text-amber-400/80 mb-6 text-center font-semibold text-sm">Translate this into {userData?.learning_lang}</p>

          <DragDropAnswer 
            availableTiles={currentQ.available_tiles}
            currentAnswer={answers[currentQ.id] || []}
            setCurrentAnswer={(newAns) => setAnswers({...answers, [currentQ.id]: newAns})}
          />

          <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
            <button 
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-all cursor-pointer"
            >
              Back
            </button>
            
            {currentIdx === questions.length - 1 ? (
              <button 
                onClick={handleSubmit}
                disabled={validating}
                className="px-8 py-2.5 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {validating ? 'Validating...' : 'Submit Test ✓'}
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="px-8 py-2.5 rounded-xl font-black text-white bg-amber-500 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}

      {showResults && (
        <Popup title="Test Results" onClose={() => navigate('/dashboard')}>
          <div className="text-center mb-6 text-white">
            <span className="text-6xl mb-4 block animate-bounce">🎉</span>
            <h2 className="text-3xl font-black text-white">Test Completed!</h2>
            <p className="text-amber-400 font-black text-lg mt-2">+20 Bonus Coins Awarded</p>
          </div>
          
          <div className="space-y-4 mb-6">
            {resultsData.map((res, i) => (
              <div key={i} className={`p-4 rounded-xl border-l-4 border-t-0 border-r-0 border-b-0 ${res.isCorrect ? 'bg-emerald-900/20 border-emerald-500/80 text-emerald-100' : 'bg-red-900/20 border-red-500/80 text-rose-100'}`}>
                <p className="font-bold mb-2 text-base text-white">{res.question}</p>
                <div className="space-y-1">
                  <p className="text-sm border-t border-white/10 pt-2">
                    <span className="text-gray-400">Your answer: </span>
                    <span className={`font-bold ${res.isCorrect ? "text-emerald-400" : "text-rose-400 line-through"}`}>{res.yourAnswer || '(Empty)'}</span>
                  </p>
                  {!res.isCorrect && (
                    <p className="text-sm">
                      <span className="text-gray-400">Correct: </span>
                      <span className="text-emerald-400 font-bold">{res.correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 cursor-pointer text-black rounded-xl font-black text-lg shadow-lg shadow-amber-500/20 transition-all"
          >
            Go to Platform
          </button>
        </Popup>
      )}
    </div>
  );
};

export default TestPage;