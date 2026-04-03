import React, { useState, useEffect, useRef } from 'react';

const DragDropAnswer = ({ availableTiles, currentAnswer, setCurrentAnswer }) => {
  const [bankTiles, setBankTiles] = useState([...availableTiles]);
  const [answerTiles, setAnswerTiles] = useState([]);
  const [dragInfo, setDragInfo] = useState(null);
  const [dropZone, setDropZone] = useState(null);
  const [dropIdx, setDropIdx] = useState(null);
  const prevAvail = useRef(availableTiles);

  const accent = '#f59e0b'; // Amber-like for Test Page

  useEffect(() => {
    setCurrentAnswer(answerTiles);
  }, [answerTiles]);

  useEffect(() => {
    if (JSON.stringify(prevAvail.current) !== JSON.stringify(availableTiles)) {
      prevAvail.current = availableTiles;
      setBankTiles([...availableTiles]);
      setAnswerTiles([]);
    }
  }, [availableTiles]);

  const onDragStart = (e, word, source, idx) => {
    setDragInfo({ word, source, idx });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, zone, idx = null) => {
    e.preventDefault();
    setDropZone(zone);
    setDropIdx(idx);
  };

  const onDrop = (e, zone, dIdx = null) => {
    e.preventDefault();
    if (!dragInfo) return;
    const { word, source, idx: fromIdx } = dragInfo;

    if (zone === 'answer') {
      if (source === 'bank') {
        const newBank = bankTiles.filter((_, i) => i !== fromIdx);
        const insertAt = dIdx !== null ? dIdx : answerTiles.length;
        const newAns = [...answerTiles];
        newAns.splice(insertAt, 0, word);
        setBankTiles(newBank);
        setAnswerTiles(newAns);
      } else if (source === 'answer' && fromIdx !== dIdx && dIdx !== null) {
        const newAns = [...answerTiles];
        newAns.splice(fromIdx, 1);
        const insertAt = dIdx > fromIdx ? dIdx - 1 : dIdx;
        newAns.splice(insertAt, 0, word);
        setAnswerTiles(newAns);
      }
    } else if (zone === 'bank' && source === 'answer') {
      setAnswerTiles(answerTiles.filter((_, i) => i !== fromIdx));
      setBankTiles([...bankTiles, word]);
    }

    setDragInfo(null); setDropZone(null); setDropIdx(null);
  };

  const clickTile = (word, source, idx) => {
    if (source === 'bank') {
      setBankTiles(bankTiles.filter((_, i) => i !== idx));
      setAnswerTiles([...answerTiles, word]);
    } else {
      setAnswerTiles(answerTiles.filter((_, i) => i !== idx));
      setBankTiles([...bankTiles, word]);
    }
  };

  const clearAll = () => {
    setBankTiles([...availableTiles]);
    setAnswerTiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Answer zone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Your answer</p>
          {answerTiles.length > 0 && (
            <button onClick={clearAll} className="text-xs text-slate-500 hover:text-rose-400 font-bold transition-colors">
              Clear all ×
            </button>
          )}
        </div>
        <div
          onDragOver={(e) => onDragOver(e, 'answer')}
          onDrop={(e) => onDrop(e, 'answer')}
          className="min-h-[72px] rounded-2xl border-2 border-dashed p-3 flex flex-wrap gap-2 items-center transition-all duration-200"
          style={{
            borderColor: dropZone === 'answer' ? accent : 'rgba(255,255,255,0.12)',
            background: dropZone === 'answer' ? 'rgba(245,158,11,0.08)' : answerTiles.length > 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)',
            boxShadow: answerTiles.length > 0 ? `inset 0 0 30px ${accent}12` : 'none',
          }}
        >
          {answerTiles.length === 0 ? (
            <p className="text-slate-500 text-sm font-semibold mx-auto">
              👆 Tap words below or drag them here
            </p>
          ) : (
            answerTiles.map((word, i) => (
              <div
                key={`a-${word}-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, word, 'answer', i)}
                onDragOver={(e) => { e.preventDefault(); onDragOver(e, 'answer', i); }}
                onDrop={(e) => onDrop(e, 'answer', i)}
                onClick={() => clickTile(word, 'answer', i)}
                className="relative px-4 py-2 rounded-xl font-bold text-sm cursor-pointer select-none transition-all duration-150"
                style={{
                  background: 'rgba(245,158,11,0.2)',
                  border: '1.5px solid rgba(245,158,11,0.45)',
                  color: '#fcd34d',
                  boxShadow: '0 2px 10px rgba(245,158,11,0.15)',
                }}
              >
                {dropZone === 'answer' && dropIdx === i && dragInfo?.source === 'answer' && (
                  <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-white/60 rounded-full" />
                )}
                {word}
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-800 rounded-full text-[9px] flex items-center justify-center text-slate-400 border border-slate-700">✕</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Word bank */}
      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Word bank · tap to place</p>
        <div
          onDragOver={(e) => onDragOver(e, 'bank')}
          onDrop={(e) => onDrop(e, 'bank')}
          className="min-h-[56px] rounded-2xl p-3 flex flex-wrap gap-2 items-start transition-all duration-200"
          style={{
            background: dropZone === 'bank' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {bankTiles.length === 0 ? (
            <p className="text-slate-600 text-sm font-semibold mx-auto py-1">All words placed ✓</p>
          ) : (
            bankTiles.map((word, i) => (
              <div
                key={`b-${word}-${i}`}
                draggable
                onDragStart={(e) => onDragStart(e, word, 'bank', i)}
                onClick={() => clickTile(word, 'bank', i)}
                className="px-4 py-2 rounded-xl font-bold text-sm cursor-pointer select-none transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  color: '#e2e8f0',
                }}
              >
                {word}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DragDropAnswer;