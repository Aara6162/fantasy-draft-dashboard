import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Mock database of players to draft
const AVAILABLE_PLAYERS = [
  { id: 1, name: "Virat Kohli", role: "Batsman", price: 10.5 },
  { id: 2, name: "Jasprit Bumrah", role: "Bowler", price: 9.5 },
  { id: 3, name: "Rashid Khan", role: "All-Rounder", price: 9.0 },
  { id: 4, name: "MS Dhoni", role: "Wicketkeeper", price: 8.5 },
  { id: 5, name: "Ben Stokes", role: "All-Rounder", price: 10.0 },
  { id: 6, name: "Trent Boult", role: "Bowler", price: 8.5 },
  { id: 7, name: "Suryakumar Yadav", role: "Batsman", price: 9.0 },
];

const MAX_BUDGET = 50.0;
const MAX_PLAYERS = 5;

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [draftedTeam, setDraftedTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  // READ: Fetch user's saved team from Firestore on load
  useEffect(() => {
    const fetchTeam = async () => {
      if (!currentUser) return;
      try {
        const docRef = doc(db, "userTeams", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDraftedTeam(docSnap.data().players || []);
        }
      } catch (err) {
        console.error("Error fetching team:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, [currentUser]);

  // ADVANCED HOOK: useMemo to efficiently calculate remaining budget
  const { totalSpent, remainingBudget } = useMemo(() => {
    const spent = draftedTeam.reduce((total, player) => total + player.price, 0);
    return {
      totalSpent: spent,
      remainingBudget: (MAX_BUDGET - spent).toFixed(1)
    };
  }, [draftedTeam]);

  // CREATE / UPDATE: Add player to local state
  const draftPlayer = (player) => {
    if (draftedTeam.length >= MAX_PLAYERS) {
      alert("Squad full! Maximum 5 players allowed for this format.");
      return;
    }
    if (draftedTeam.find(p => p.id === player.id)) {
      alert("Player already drafted!");
      return;
    }
    if (remainingBudget - player.price < 0) {
      alert("Insufficient budget!");
      return;
    }
    setDraftedTeam([...draftedTeam, player]);
    setSaveStatus('Unsaved changes');
  };

  // DELETE: Remove player from local state
  const removePlayer = (playerId) => {
    setDraftedTeam(draftedTeam.filter(p => p.id !== playerId));
    setSaveStatus('Unsaved changes');
  };

  // PERSIST: Save to Firestore
  const saveTeamToDB = async () => {
    setSaveStatus('Saving...');
    try {
      await setDoc(doc(db, "userTeams", currentUser.uid), {
        players: draftedTeam,
        updatedAt: new Date().toISOString()
      });
      setSaveStatus('All changes saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error("Error saving team:", err);
      setSaveStatus('Error saving');
    }
  };

  if (loading) return <div className="p-8 text-white">Loading your dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <header className="flex justify-between items-center pb-6 border-b border-slate-700 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Pro Draft Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Logged in as: {currentUser.email}</p>
        </div>
        <button 
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-600"
        >
          Sign Out
        </button>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Available Players */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-slate-200">Scouting Pool</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AVAILABLE_PLAYERS.map(player => (
              <div key={player.id} className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex justify-between items-center hover:border-indigo-500 transition-colors">
                <div>
                  <p className="font-bold text-white">{player.name}</p>
                  <p className="text-xs text-slate-400">{player.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-indigo-400">${player.price}M</span>
                  <button 
                    onClick={() => draftPlayer(player)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md transition-colors"
                  >
                    Draft
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Your Squad & Budget */}
        <div className="space-y-6">
          
          {/* Budget Card */}
          <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Franchise Budget</h2>
            <div className="flex justify-between items-end mb-2">
              <span className="text-slate-400">Remaining Funds</span>
              <span className={`text-2xl font-mono font-bold ${remainingBudget < 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                ${remainingBudget}M
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(totalSpent / MAX_BUDGET) * 100}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-right">
              Squad Size: {draftedTeam.length} / {MAX_PLAYERS}
            </p>
          </div>

          {/* Active Roster */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-200">Active Roster</h2>
              {saveStatus && <span className="text-xs text-indigo-400 italic">{saveStatus}</span>}
            </div>
            
            <div className="space-y-3 min-h-[200px]">
              {draftedTeam.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-500 text-sm italic py-8">
                  No players drafted yet.
                </div>
              ) : (
                draftedTeam.map(player => (
                  <div key={player.id} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-700/50">
                    <span className="text-sm font-medium text-slate-300">{player.name}</span>
                    <button 
                      onClick={() => removePlayer(player.id)}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      Drop
                    </button>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={saveTeamToDB}
              disabled={draftedTeam.length === 0}
              className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors"
            >
              Lock In Roster
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}