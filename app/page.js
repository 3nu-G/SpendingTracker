'use client';

import { useState, useEffect } from 'react';

export default function SpendingTracker() {
  // --- STATE MANAGEMENT ---
  const [transactions, setTransactions] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoaded, setIsLoaded] = useState(false);

  // --- LOAD FROM LOCAL STORAGE ON MOUNT ---
  useEffect(() => {
    const saved = localStorage.getItem('spending_data');
    const snapshot = localStorage.getItem('spending_snapshot');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTransactions(parsed);
        setHistory([parsed]);
        setHistoryIndex(0);
      } catch (e) {
        console.error("Data corrupted, starting fresh.");
      }
    } else {
      // Default empty row
      const initial = [{ id: Date.now(), where: '', amount: '' }];
      setTransactions(initial);
      setHistory([initial]);
      setHistoryIndex(0);
    }

    if (snapshot) {
      try {
        setSavedSnapshot(JSON.parse(snapshot));
      } catch (e) {}
    }
    
    setIsLoaded(true);
  }, []);

  // --- AUTO-SAVE (CRASH PROOFING) ---
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('spending_data', JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  // --- HELPERS ---
  const total = transactions.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const addToHistory = (newState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // --- ACTIONS ---
  const addRow = () => {
    const newRow = { id: Date.now(), where: '', amount: '' };
    const newState = [...transactions, newRow];
    setTransactions(newState);
    addToHistory(newState);
  };

  const updateRow = (id, field, value) => {
    const newState = transactions.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    );
    setTransactions(newState);
    // Debounce history slightly or just do it. Let's do it for precision.
    addToHistory(newState);
  };

  const deleteRow = (id) => {
    if (transactions.length === 1) return; // Keep at least one row
    const newState = transactions.filter(t => t.id !== id);
    setTransactions(newState);
    addToHistory(newState);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTransactions(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTransactions(history[newIndex]);
    }
  };

  const handleSaveState = () => {
    localStorage.setItem('spending_snapshot', JSON.stringify(transactions));
    setSavedSnapshot(transactions);
    alert('State Saved! You can now reset to this point anytime.');
  };

  const handleReset = () => {
    if (savedSnapshot.length === 0 && !localStorage.getItem('spending_snapshot')) {
      alert('No saved snapshot found. Auto-save is active though.');
      return;
    }
    if (confirm('WARNING: This will undo all changes since your last manual save. You sure?')) {
      const snapshot = JSON.parse(localStorage.getItem('spending_snapshot'));
      setTransactions(snapshot);
      addToHistory(snapshot);
    }
  };

  if (!isLoaded) return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Loading your chaos...</div>;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
              Expense Tracker
            </h1>
            <p className="text-neutral-500 text-sm mt-1">Don't spend all your JEE allowance.</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleUndo} 
              disabled={historyIndex <= 0}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-lg text-sm transition"
            >
              ↩ Undo
            </button>
            <button 
              onClick={handleRedo} 
              disabled={historyIndex >= history.length - 1}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-lg text-sm transition"
            >
              Redo ↪
            </button>
          </div>
        </div>

        {/* TOTAL CARD */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 flex justify-between items-center shadow-lg">
          <span className="text-neutral-400 font-medium">Total Balance</span>
          <span className={`text-3xl font-bold ${total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${total.toFixed(2)}
          </span>
        </div>

        {/* LIST */}
        <div className="space-y-3">
          {transactions.map((t, index) => (
            <div key={t.id} className="grid grid-cols-12 gap-3 items-center group">
              <div className="col-span-5 md:col-span-6">
                <input
                  type="text"
                  placeholder="Where? (e.g. Mom, Burger)"
                  value={t.where}
                  onChange={(e) => updateRow(t.id, 'where', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition placeholder:text-neutral-600"
                />
              </div>
              <div className="col-span-5 md:col-span-4">
                <input
                  type="number"
                  placeholder="0.00"
                  value={t.amount}
                  onChange={(e) => updateRow(t.id, 'amount', e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 transition placeholder:text-neutral-600"
                />
              </div>
              <div className="col-span-2 md:col-span-2 flex justify-end">
                <button 
                  onClick={() => deleteRow(t.id)}
                  disabled={transactions.length === 1}
                  className="p-3 text-neutral-600 hover:text-red-400 disabled:opacity-30 transition"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ADD BUTTON */}
        <button 
          onClick={addRow}
          className="w-full py-4 border-2 border-dashed border-neutral-800 text-neutral-500 hover:border-green-500 hover:text-green-500 rounded-xl transition font-medium"
        >
          + Add Entry
        </button>

        {/* CONTROLS */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-neutral-800">
          <button 
            onClick={handleSaveState}
            className="py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-900/20 transition"
          >
            💾 Save State
          </button>
          <button 
            onClick={handleReset}
            className="py-3 bg-neutral-800 hover:bg-red-900/50 text-neutral-300 hover:text-red-400 rounded-lg font-bold transition border border-neutral-700"
          >
            ⚠️ Reset to Save
          </button>
        </div>

        <p className="text-center text-neutral-600 text-xs pt-4">
          Auto-saved locally. Don't clear your cache unless you wanna lose shit.
        </p>
      </div>
    </main>
  );
    }
