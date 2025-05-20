"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Trophy, Clock, Keyboard, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';

const TypingRaceGame = () => {
  const [gameState, setGameState] = useState('waiting'); 
  const [countdown, setCountdown] = useState(5);
  const [raceTimer, setRaceTimer] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [currentParagraph, setCurrentParagraph] = useState('');
  const [cars, setCars] = useState([]);
  const [raceResults, setRaceResults] = useState([]);
  const [userProgress, setUserProgress] = useState(0);
  const [wrongWords, setWrongWords] = useState(new Set());
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const [trackTheme, setTrackTheme] = useState('classic'); // classic, desert, snow, night, beach
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Improved paragraphs for typing practice with different themes
  const paragraphsByTheme = {
    classic: [
      "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is perfect for typing practice.",
      "Technology has revolutionized the way we communicate and work. From smartphones to artificial intelligence, innovation continues to shape our future in ways we never imagined.",
      "Nature is filled with incredible beauty and wonder. Mountains reach toward the sky while rivers flow through valleys creating stunning landscapes that inspire artists and poets."
    ],
    racing: [
      "Formula One racing combines speed, strategy and cutting-edge technology. Drivers push their cars to the limit on circuits around the world while teams work to gain every millisecond advantage.",
      "NASCAR evolved from bootleggers racing their modified cars after delivering moonshine. Today it's America's most popular motorsport, featuring close-quarter racing at breathtaking speeds.",
      "The 24 Hours of Le Mans tests both speed and endurance as teams race day and night. Drivers must balance performance with reliability to succeed in this legendary competition."
    ],
    gaming: [
      "Video games have evolved from simple pixelated adventures to complex virtual worlds with photorealistic graphics and immersive storytelling that captivate millions of players globally.",
      "Esports tournaments fill stadiums with fans watching professional gamers compete for massive prize pools. What began as friendly competition has become a billion-dollar industry.",
      "Game developers blend art, music, writing and programming to create interactive experiences that challenge our minds and transport us to fantastic new realms of imagination."
    ],
    travel: [
      "Venice's winding canals and historic architecture create a magical atmosphere unlike anywhere else. Gondolas glide past ancient buildings as visitors explore this unique floating city.",
      "Tokyo blends ultramodern and traditional in a fascinating urban landscape. Neon-lit skyscrapers tower over quiet temple gardens in this city of incredible contrasts and innovation.",
      "The Grand Canyon reveals millions of years of geological history in its colorful rock layers. Standing at its rim, visitors are awestruck by the immense scale of this natural wonder."
    ],
    food: [
      "Italian cuisine celebrates fresh ingredients and regional traditions. From perfect pasta in Rome to seafood risotto in Venice, each dish tells the story of its local culture and history.",
      "Street food markets offer authentic local flavors at affordable prices. Vendors prepare traditional recipes passed down through generations, creating culinary experiences for curious travelers.",
      "Chocolate making is both an art and science. Master chocolatiers carefully select cacao beans, control temperatures, and blend flavors to create confections that delight the senses."
    ]
  };

  // Enhanced car designs with different models
  const carDesigns = [
    { emoji: '🏎️', name: 'Formula Racer', color: '#3B82F6' },
    { emoji: '🚗', name: 'Speed Demon', color: '#EF4444' },
    { emoji: '🚙', name: 'Lightning SUV', color: '#10B981' },
    { emoji: '🏁', name: 'Thunder Bolt', color: '#F59E0B' },
    { emoji: '🚓', name: 'Storm Chaser', color: '#8B5CF6' }
  ];

  // Track theme visual settings
  const trackThemes = {
    classic: {
      name: 'Classic Race',
      bgGradient: 'from-green-500 to-green-400',
      laneColor: 'bg-white bg-opacity-20',
      borderColor: 'border-white border-opacity-30',
      description: 'Traditional racing track with grass and asphalt',
      emoji: '🏁'
    },
    desert: {
      name: 'Desert Rally',
      bgGradient: 'from-yellow-600 to-amber-500',
      laneColor: 'bg-amber-100 bg-opacity-20',
      borderColor: 'border-amber-200 border-opacity-30',
      description: 'Hot sandy terrain with challenging conditions',
      emoji: '🏜️'
    },
    snow: {
      name: 'Ice Circuit',
      bgGradient: 'from-blue-300 to-sky-400',
      laneColor: 'bg-white bg-opacity-40',
      borderColor: 'border-white border-opacity-50',
      description: 'Slippery ice track requiring precise control',
      emoji: '❄️'
    },
    night: {
      name: 'Night Race',
      bgGradient: 'from-gray-900 to-slate-800',
      laneColor: 'bg-indigo-900 bg-opacity-40',
      borderColor: 'border-blue-400 border-opacity-30',
      description: 'Exciting nighttime challenge with neon lights',
      emoji: '🌃'
    },
    beach: {
      name: 'Beach Sprint',
      bgGradient: 'from-blue-400 to-cyan-300',
      laneColor: 'bg-yellow-100 bg-opacity-30',
      borderColor: 'border-yellow-200 border-opacity-40',
      description: 'Coastal race with sand and ocean views',
      emoji: '🏝️'
    }
  };

  // Difficulty settings affect computer car speeds and time limits
  const difficultySettings = {
    easy: {
      computerSpeedMultiplier: 0.35,
      timeMultiplier: 1.5,
      name: 'Beginner',
      description: 'Perfect for new typists - slower cars and more time'
    },
    medium: {
      computerSpeedMultiplier: 0.5,
      timeMultiplier: 1.0,
      name: 'Amateur',
      description: 'Balanced challenge for average typists'
    },
    hard: {
      computerSpeedMultiplier: 0.65,
      timeMultiplier: 0.8,
      name: 'Professional',
      description: 'Test your skills against faster cars with less time'
    },
    extreme: {
      computerSpeedMultiplier: 0.8,
      timeMultiplier: 0.6,
      name: 'Champion',
      description: 'Only for typing masters - maximum challenge!'
    }
  };

  // Properly configured background music
  const backgroundMusic = {
    url: "https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.3/howler.min.js",
    placeholder: "racing-background-music.mp3"
  };

  // Calculate time based on paragraph length and difficulty
  const calculateTimeForParagraph = (paragraph) => {
    const averageWPM = 40; // Average typing speed
    const wordCount = paragraph.split(' ').length;
    const baseTime = Math.ceil((wordCount / averageWPM) * 60) + 20; // Add 20 seconds buffer
    
    return Math.ceil(baseTime * difficultySettings[difficulty].timeMultiplier);
  };

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Choose a theme category randomly
    const themes = Object.keys(paragraphsByTheme);
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    
    // Get paragraphs for that theme
    const themeParagraphs = paragraphsByTheme[randomTheme];
    const randomParagraph = themeParagraphs[Math.floor(Math.random() * themeParagraphs.length)];
    
    setCurrentParagraph(randomParagraph);
    setActiveWordIndex(0);
    
    const calculatedTime = calculateTimeForParagraph(randomParagraph);
    setInitialTime(calculatedTime);
    setRaceTimer(calculatedTime);
    
    // Create cars with enhanced designs and adjusted speeds based on difficulty
    const initialCars = carDesigns.map((design, index) => ({
      id: index,
      name: index === 0 ? 'You' : design.name,
      emoji: design.emoji,
      color: design.color,
      isPlayer: index === 0,
      position: 0,
      speed: index === 0 ? 0 : (Math.random() * 0.3 + difficultySettings[difficulty].computerSpeedMultiplier), // Computer cars speed based on difficulty
      finished: false,
      finishTime: null
    }));
    
    setCars(initialCars);
    setUserInput('');
    setUserProgress(0);
    setWrongWords(new Set());
    setRaceResults([]);
  };

  // Start game countdown
  const startGame = () => {
    setGameState('countdown');
    setCountdown(5);
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRace();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start the actual race
  const startRace = () => {
    setGameState('racing');
    
    // Play background music
    if (audioRef.current && soundEnabled) {
      audioRef.current.volume = 0.5; // Set volume to 50%
      audioRef.current.play().catch(console.error);
    }
    
    // Start race timer
    intervalRef.current = setInterval(() => {
      setRaceTimer((prev) => {
        if (prev <= 1) {
          endRace();
          return 0;
        }
        return prev - 1;
      });
      
      // Update computer cars
      setCars(prevCars => 
        prevCars.map(car => {
          if (!car.isPlayer && !car.finished) {
            const newPosition = Math.min(car.position + car.speed, 100);
            const finished = newPosition >= 100;
            return { 
              ...car, 
              position: newPosition,
              finished: finished,
              finishTime: finished && !car.finishTime ? initialTime - raceTimer : car.finishTime
            };
          }
          return car;
        })
      );
    }, 100);
  };

  // End race and calculate results
  const endRace = () => {
    setGameState('finished');
    clearInterval(intervalRef.current);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Calculate final results - only cars that finished
    const finishedCars = cars.filter(car => car.position >= 100 || car.finished);
    const unfinishedCars = cars.filter(car => car.position < 100 && !car.finished);
    
    // Sort finished cars by finish time (faster finish = better position)
    const sortedFinished = finishedCars.sort((a, b) => {
      if (a.finishTime && b.finishTime) {
        return a.finishTime - b.finishTime; // Lower time = finished earlier = better
      }
      return b.position - a.position;
    });
    
    setRaceResults({ finished: sortedFinished, unfinished: unfinishedCars });
    
    // Update game history
    const playerCar = cars.find(car => car.isPlayer);
    const playerWon = playerCar && (playerCar.position >= 100 || playerCar.finished);
    
    // Record finish position
    let playerPosition = -1;
    if (playerCar && playerCar.finished) {
      playerPosition = sortedFinished.findIndex(car => car.isPlayer) + 1;
    }
    
    setGameHistory(prev => [...prev, { 
      won: playerWon, 
      time: initialTime - (playerCar?.finishTime || 0),
      position: playerPosition,
      track: trackTheme,
      difficulty: difficulty
    }]);
  };

  // Handle user typing with improved word highlighting
  const handleTyping = (e) => {
    if (gameState !== 'racing') return;
    
    const value = e.target.value;
    setUserInput(value);
    
    // Calculate typing accuracy and progress
    const words = currentParagraph.split(' ');
    const typedWords = value.split(' ');
    let correctChars = 0;
    let wrongWordSet = new Set();
    let currentWordIndex = 0;
    
    typedWords.forEach((typedWord, index) => {
      if (index < words.length) {
        // Check if we've completed a word and should move to the next word
        if (typedWord === words[index] && index === typedWords.length - 1) {
          currentWordIndex = index + 1;
        }
        
        // Check if the current typed word is correct so far
        if (words[index].startsWith(typedWord)) {
          correctChars += typedWord.length;
        } else {
          wrongWordSet.add(index);
          // Only add the correct characters
          const correctPart = [...typedWord].filter((char, i) => words[index][i] === char).length;
          correctChars += correctPart;
        }
      }
    });
    
    setWrongWords(wrongWordSet);
    setActiveWordIndex(currentWordIndex);
    
    // Update user car position based on progress
    const progress = Math.min((correctChars / currentParagraph.length) * 100, 100);
    setUserProgress(progress);
    
    // Update player car position
    setCars(prevCars => 
      prevCars.map(car => {
        if (car.isPlayer) {
          const finished = progress >= 100;
          return { 
            ...car, 
            position: progress,
            finished: finished,
            finishTime: finished && !car.finishTime ? initialTime - raceTimer : car.finishTime
          };
        }
        return car;
      })
    );
    
    // Check if race is complete
    if (progress >= 100) {
      setTimeout(endRace, 1000); // End race shortly after completion
    }
  };

  // Restart game
  const restartGame = () => {
    setGameState('waiting');
    initializeGame();
  };

  // Toggle settings panel
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  // Change difficulty level
  const changeDifficulty = (newDifficulty) => {
    setDifficulty(newDifficulty);
  };

  // Change track theme
  const changeTrackTheme = (newTheme) => {
    setTrackTheme(newTheme);
  };

  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Render words with improved highlighting
  const renderTypedText = () => {
    const words = currentParagraph.split(' ');
    const typedWords = userInput.split(' ');
    
    return words.map((word, index) => {
      let className = 'text-gray-400'; // Default - not typed yet
      
      // Active word (next word to type) gets green highlight
      if (index === activeWordIndex) {
        className = 'text-green-600 bg-green-100 px-1 rounded';
      } 
      // Words with errors get red highlight
      else if (index < typedWords.length && wrongWords.has(index)) {
        className = 'text-red-500 bg-red-100 px-1 rounded';
      } 
      // Correctly typed words get blue highlight
      else if (index < typedWords.length && typedWords[index] === word) {
        className = 'text-blue-600 bg-blue-50 px-1 rounded';
      }
      // Partially typed words
      else if (index < typedWords.length) {
        if (word.startsWith(typedWords[index])) {
          className = 'text-purple-600 bg-purple-50 px-1 rounded';
        } else {
          className = 'text-red-500 bg-red-100 px-1 rounded';
        }
      }
      
      return (
        <span key={index} className={`${className} mr-1`}>
          {word}
        </span>
      );
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4`}>
      {/* Background Music */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
      >
        <source src="/api/placeholder/400/320" type="audio/mp3" />
      </audio>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-pink-400 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-blue-400 rounded-full opacity-20 animate-ping"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-6 relative z-10">
        <h1 className="text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3 drop-shadow-lg">
          <Keyboard className="text-yellow-400" />
          🏁 Typing Race Championship
        </h1>
        <p className="text-blue-200 text-lg">Type fast, drive faster, win the race!</p>
        
        <div className="flex justify-center mt-3 gap-3">
          <button 
            onClick={toggleSettings}
            className=" bg-opacity-20 flex gap-1 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
            title="Game Settings"
          >
            <Settings size={24} />
            <h3> Setting</h3>
          </button>
          
          <button 
            onClick={toggleSound}
            className=" bg-opacity-20 hover:bg-opacity-30 text-white gap-1 flex p-2 rounded-full transition-all"
            title={soundEnabled ? "Mute Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            <h3> Sound</h3>
          </button>
        </div>
      </div>

      {showSettings && gameState === 'waiting' && (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">⚙️ Game Settings</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">🏆 Select Difficulty:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(difficultySettings).map(([key, setting]) => (
                <button
                  key={key}
                  onClick={() => changeDifficulty(key)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    difficulty === key 
                      ? 'bg-blue-100 border-blue-500 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="font-bold text-lg">{setting.name}</div>
                  <div className="text-sm text-gray-600">{setting.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Track Theme Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-700">🏎️ Select Race Track:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(trackThemes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => changeTrackTheme(key)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    trackTheme === key 
                      ? 'bg-blue-100 border-blue-500 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-2xl mb-1">{theme.emoji}</div>
                  <div className="font-bold">{theme.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{theme.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Status Bar */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-4 mb-6 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" />
            <span className="font-bold text-lg">
              {gameState === 'racing' ? formatTime(raceTimer) : 
               gameState === 'countdown' ? `Starting in ${countdown}s` : 
               'Ready to Race'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Progress: <span className="font-semibold text-green-600">{Math.round(userProgress)}%</span>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          WPM: <span className="font-semibold text-blue-600">
            {gameState === 'racing' ? Math.round((userInput.length / 5) / ((initialTime - raceTimer) / 60)) || 0 : 0}
          </span>
        </div>
      </div>

      {/* Enhanced Race Track with Selected Theme */}
      <div className={`bg-gradient-to-r ${trackThemes[trackTheme].bgGradient} rounded-xl p-8 mb-6 relative overflow-hidden shadow-2xl`}>
        {/* Track Background Pattern */}
        <div className="absolute inset-0 bg-repeat-x opacity-30" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
               backgroundSize: '60px 60px'
             }}>
        </div>
        
        {/* Track Theme Indicator */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-80 px-3 py-1 rounded-full shadow text-sm font-bold flex items-center gap-1">
          {trackThemes[trackTheme].emoji} {trackThemes[trackTheme].name}
        </div>
        
        {/* Starting Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-white opacity-80"></div>
        
        {/* Race Track Lanes */}
        <div className="relative space-y-3">
          {cars.map((car, index) => (
            <div key={car.id} className="relative">
              {/* Lane Background */}
              <div className={`h-20 ${trackThemes[trackTheme].laneColor} rounded-lg border-2 ${trackThemes[trackTheme].borderColor} relative overflow-hidden`}>
                {/* Lane Markings */}
                <div className="absolute inset-0 flex items-center">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 border-r border-white border-opacity-40 h-full"
                      style={{ borderStyle: 'dashed' }}
                    ></div>
                  ))}
                </div>
                
                {/* Car */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300 ease-out z-10"
                  style={{ 
                    left: `${Math.min(car.position, 95)}%`,
                    transform: 'translateY(-50%) translateX(-50%)'
                  }}
                >
                  <div className="text-center group">
                    {/* Car Body */}
                    <div 
                      className="relative w-16 h-12 rounded-lg shadow-xl flex items-center justify-center transform transition-transform group-hover:scale-110"
                      style={{ 
                        backgroundColor: car.color,
                        background: `linear-gradient(135deg, ${car.color}, ${car.color}dd)`
                      }}
                    >
                      {/* Car Details */}
                      <div className="absolute inset-1 bg-white bg-opacity-20 rounded-md"></div>
                      <span className="text-2xl relative z-10 filter drop-shadow-sm">{car.emoji}</span>
                      
                      {/* Speed Lines (when moving) */}
                      {gameState === 'racing' && car.position > 1 && (
                        <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
                          <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                              <div 
                                key={i}
                                className="w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Finish Checkmark */}
                      {car.finished && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          ✓
                        </div>
                      )}
                    </div>
                    
                    {/* Car Info */}
                    <div className="mt-2">
                      <div className="text-xs font-bold text-white drop-shadow-lg">
                        {car.name}
                      </div>
                      {car.isPlayer && (
                        <div className="text-xs text-yellow-300 font-semibold">
                          YOU
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Position Indicator */}
              <div className="absolute right-2 top-2 text-white text-xs font-bold bg-black bg-opacity-50 px-2 py-1 rounded">
                {Math.round(car.position)}%
              </div>
            </div>
          ))}
        </div>
        
        {/* Finish Line */}
        <div className="absolute right-8 top-0 bottom-0 w-3 bg-gradient-to-b from-red-500 to-red-600 opacity-90 flex items-center justify-center">
          <div className="text-white text-xs font-bold transform -rotate-90">FINISH</div>
        </div>
        
        {/* Checkered Flag Pattern at Finish */}
        <div className="absolute right-6 top-4 w-8 h-8 opacity-80">
          <div className="grid grid-cols-4 grid-rows-4 w-full h-full">
            {[...Array(16)].map((_, i) => (
              <div 
                key={i} 
                className={`${(Math.floor(i/4) + i) % 2 === 0 ? 'bg-black' : 'bg-white'}`}
              ></div>
            ))}
          </div>
        </div>
      </div>

    

      {/* Typing Area */}
      {(gameState === 'racing' || gameState === 'waiting') && (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-3 text-gray-800">🎯 Type the text below:</h3>
            <div className="text-lg leading-relaxed p-6 bg-gray-50 rounded-lg border-2 border-gray-200 min-h-40 shadow-inner">
              {renderTypedText()}
            </div>
          </div>
          
          <textarea
            value={userInput}
            onChange={handleTyping}
            disabled={gameState !== 'racing'}
            placeholder={gameState === 'waiting' ? "🏁 Click Start Race to begin your typing adventure!" : "🚗 Start typing to move your car..."}
            className="w-full h-40 p-4 border-2 border-gray-300 rounded-lg text-lg resize-none focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition-all"
          />
        </div>
      )}

      {/* Control Buttons */}
      <div className="text-center mb-6">
        {gameState === 'waiting' && (
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition-all transform hover:scale-105 shadow-xl"
          >
            <Play size={24} />
            🏁 Start Race
          </button>
        )}
        
        {gameState === 'countdown' && (
          <div className="text-8xl font-bold text-yellow-400 animate-pulse drop-shadow-2xl">
            {countdown > 0 ? countdown : '🚗 GO!'}
          </div>
        )}
        
        {gameState === 'finished' && (
          <button
            onClick={restartGame}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition-all transform hover:scale-105 shadow-xl"
          >
            <RotateCcw size={24} />
            🏁 Race Again
          </button>
        )}
      </div>

      {/* Race Results */}
      {gameState === 'finished' && (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 shadow-xl">
          <h2 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-3">
            <Trophy className="text-yellow-500" />
            🏆 Championship Results
          </h2>
          
          {/* Winners Podium */}
          {raceResults.finished && raceResults.finished.length > 0 ? (
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-green-600">🏁 Race Finishers:</h3>
              <div className="space-y-3">
                {raceResults.finished.map((car, index) => (
                  <div
                    key={car.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transform transition-transform hover:scale-102 ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400 shadow-lg' :
                      index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400 shadow-md' :
                      index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400 shadow-md' :
                      'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl font-bold ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        index === 2 ? 'text-orange-600' :
                        'text-blue-500'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="text-2xl">{car.emoji}</div>
                      <div>
                        <div className="font-bold text-lg">{car.name}</div>
                        <div className="text-sm text-gray-600">
                          {car.isPlayer ? 'You' : 'Computer'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg">{Math.round(car.position)}%</div>
                      <div className="text-sm text-gray-600">Completed</div>
                      {car.finishTime && (
                        <div className="text-xs text-green-600">
                          Finished in {formatTime(initialTime - car.finishTime)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-red-50 rounded-lg border-2 border-red-200 mb-6">
              <h3 className="text-xl font-bold text-red-600 mb-2">😱 No Finishers!</h3>
              <p className="text-red-700">Time ran out before anyone could complete the race!</p>
            </div>
          )}
          
          {/* Did Not Finish */}
          {raceResults.unfinished && raceResults.unfinished.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-600">❌ Did Not Finish:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {raceResults.unfinished.map((car) => (
                  <div
                    key={car.id}
                    className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border border-gray-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl">{car.emoji}</div>
                      <div>
                        <div className="font-semibold">{car.name}</div>
                        <div className="text-xs text-gray-600">
                          {car.isPlayer ? 'You' : 'Computer'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{Math.round(car.position)}%</div>
                      <div className="text-xs text-gray-600">Progress</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Victory Message */}
          {raceResults.finished && raceResults.finished[0]?.isPlayer && (
            <div className="text-center mt-6 p-6 bg-gradient-to-r from-green-100 to-green-200 rounded-lg border-2 border-green-400 shadow-lg">
              <h3 className="text-2xl font-bold text-green-800 mb-2">🎉 VICTORY!</h3>
              <p className="text-green-700 text-lg">Congratulations! You won the championship! 🏆</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TypingRaceGame;