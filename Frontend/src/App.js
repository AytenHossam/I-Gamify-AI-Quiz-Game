import axios from "axios";
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [page, setPage] = useState(null);
  const [file, setFile] = useState(null);
  const [numQuestions, setNumQuestions] = useState('');
  const [language, setLanguage] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [originalQuiz, setOriginalQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(null);
  const [quizTimerExpired, setQuizTimerExpired] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showForm, setShowForm] = useState(true);
  const [puzzleQuiz, setPuzzleQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [PuzzleScore, setPuzzleScore] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [puzzleTimeLeft, setPuzzleTimeLeft] = useState(null);
  const [puzzleTimerExpired, setPuzzleTimerExpired] = useState(false);
  const [droppedAnswers, setDroppedAnswers] = useState([]);
  const [puzzleFilter, setPuzzleFilter] = useState('all');
  const [interactiveMode, setInteractiveMode] = useState(false); 
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isSharedQuiz, setIsSharedQuiz] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [puzzleInteractiveMode, setPuzzleInteractiveMode] = useState(false);
  const [sharedPuzzle, setSharedPuzzle] = useState(null);
  const [sharedPuzzleNameInput, setSharedPuzzleNameInput] = useState(false);
  const [sharedPuzzleInteractive, setSharedPuzzleInteractive] = useState(false);
  const [sharedPuzzleUserName, setSharedPuzzleUserName] = useState('');
  
  const questionsSectionRef = useRef(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);
  
  const handleDragStart = (e, answer) => {
    e.dataTransfer.setData('text/plain', answer);
  };
  
  const handleDrop = (e, index) => {
    const draggedAnswer = e.dataTransfer.getData('text');
    setUserAnswers(prev => {
      const prevAnswer = prev[index];
      const updated = { ...prev, [index]: draggedAnswer };
      return updated;
    });
    setDroppedAnswers(prev => {
      // Remove the previous answer for this question if it exists
      const prevAnswer = userAnswers[index];
      let updated = prev.filter(ans => ans !== draggedAnswer);
      if (prevAnswer && prevAnswer !== draggedAnswer) {
        updated = updated.filter(ans => ans !== prevAnswer);
      }
      return [...updated, draggedAnswer];
    });
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };  
  
  const handleSubmitPuzzleQuiz = () => {
    let correct = 0;
    puzzleQuiz.forEach((q, index) => {
      if (userAnswers[index] === q.answer) {
        correct++;
      }
    });
    setPuzzleScore(correct); 
    setQuizSubmitted(true);

    if (window.location.pathname.startsWith('/puzzle/')) {
      const match = window.location.pathname.match(/\/puzzle\/(.+)/);
      if (match) {
        const puzzleId = match[1];
        const storedPuzzle = localStorage.getItem(`puzzle_${puzzleId}`);
        if (storedPuzzle) {
          const puzzleData = JSON.parse(storedPuzzle);
          const scores = puzzleData.scores || [];
          scores.push({
            name: sharedPuzzleUserName,
            score: correct,
            total: puzzleQuiz.length,
            timestamp: new Date().toISOString()
          });
          // Sort scores in descending order
          scores.sort((a, b) => b.score - a.score);
          puzzleData.scores = scores;
          localStorage.setItem(`puzzle_${puzzleId}`, JSON.stringify(puzzleData));
          setLeaderboard(scores);
        }
      }
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setScore(null);
    setShowForm(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_questions', numQuestions);
    formData.append('language', language);

    try {
      const response = await fetch('http://localhost:5002/generate_mcq', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setQuiz(data.quiz);
        setOriginalQuiz(data.quiz);
        setAnswers({});
        setSelectedOptions({});
        setQuizTimerExpired(false);
        setFilter('all');
        setQuizTimeLeft(numQuestions * 60);
        setInteractiveMode(false);
        setShowNameInput(false);
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIndex, selectedOption) => {
    if (!quizTimerExpired) {
      setAnswers((prev) => ({ ...prev, [qIndex]: selectedOption }));
      setSelectedOptions((prev) => ({ ...prev, [qIndex]: selectedOption }));
    }
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;
    let points = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.answer) points++;
    });
    setScore(points);
    setQuizTimerExpired(true);
    setLinkCopied(false);

    // Store the score in localStorage
    const quizId = window.location.pathname.split('/').pop() || 'current_quiz';
    const storedQuiz = localStorage.getItem(`quiz_${quizId}`);
    if (storedQuiz) {
      const quizData = JSON.parse(storedQuiz);
      const scores = quizData.scores || [];
      const newScore = {
        name: userName,
        score: points,
        total: quiz.length,
        timestamp: new Date().toISOString()
      };
      scores.push(newScore);
      // Sort scores in descending order
      scores.sort((a, b) => b.score - a.score);
      quizData.scores = scores;
      localStorage.setItem(`quiz_${quizId}`, JSON.stringify(quizData));
      setLeaderboard(scores);
      setShowLeaderboard(true); // Show leaderboard immediately after submission
    }
  };

  const handleGenerateAnother = () => {
    setFile(null);
    setNumQuestions('');
    setLanguage('');
    setQuiz(null);
    setOriginalQuiz(null);
    setScore(null);
    setQuizTimeLeft(null);
    setQuizTimerExpired(false);
    setAnswers({});
    setSelectedOptions({});
    setFilter('all');
    setInteractiveMode(false);
    setShowForm(true);
  };
  
  const handleGenerateAnotherPuzzle = () => {
    setPuzzleQuiz(null);
    setUserAnswers([]);
    setQuizSubmitted(false);
    setPuzzleScore(null);
    setPuzzleTimeLeft(null);         // Reset the timer
    setPuzzleTimerExpired(false);   // Reset timer state
    setShowForm(true);
    setFile(null);
    setNumQuestions('');
    setLanguage('');
    setError(null);
  };
  

  const handleRetake = () => {
    // Reset all quiz-related state
    setQuiz(originalQuiz);
    setAnswers({});
    setSelectedOptions({});
    setScore(null);
    setQuizTimerExpired(false);
    const timePerQuestion = 60; // 60 seconds per question
    setQuizTimeLeft(quiz.length * timePerQuestion); // Set timer based on number of questions
    setShowLeaderboard(false);
    setShowNameInput(true);
    setInteractiveMode(false);
    setUserName('');
  };

  const handleRetakePuzzle = () => {
    setUserAnswers({});
    setPuzzleScore(null);
    setDroppedAnswers([]); 
    setPuzzleTimeLeft(numQuestions * 60);
    setPuzzleTimerExpired(false);
    setQuizSubmitted(false);
    setUserAnswers(Array(puzzleQuiz.length).fill(null));
  };
  
  const handleRemoveAnswer = (questionIndex) => {
    const updatedAnswers = { ...userAnswers };
    const removed = updatedAnswers[questionIndex];
    updatedAnswers[questionIndex] = null;
    setUserAnswers(updatedAnswers);
  
    // Remove from droppedAnswers
    setDroppedAnswers((prev) => prev.filter((ans) => ans !== removed));
  };
  
  

  const filterQuestions = (quiz, answers, filter) => {
    return quiz
      .map((q, index) => ({ ...q, index }))
      .filter((q) => {
        const userAnswer = answers[q.index];
        switch (filter) {
          case 'correct': return userAnswer === q.answer;
          case 'wrong': return userAnswer && userAnswer !== q.answer;
          case 'unanswered': return !userAnswer;
          default: return true;
        }
      });
  };
  
  const filteredPuzzleQuiz = puzzleQuiz
  ? puzzleQuiz.filter((q, i) => {
      const userAnswer = userAnswers[i];

      if (puzzleFilter === 'correct') return userAnswer === q.answer;
      if (puzzleFilter === 'wrong') return userAnswer && userAnswer !== q.answer;
      if (puzzleFilter === 'unanswered') return !userAnswer;
      return true;
    })
  : [];

  const handlePuzzleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setScore(null);
    setShowForm(false);
    setPuzzleQuiz(null);
    setPuzzleScore(null);
    setUserAnswers({});
    setPuzzleTimerExpired(false);
    setQuizSubmitted(false);
    setPuzzleInteractiveMode(false); // Show static mode after generation
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_questions', numQuestions);
    formData.append('language', language || 'auto');
  
    try {
      const response = await fetch('http://localhost:5006/generate-puzzle', {
        method: 'POST',
        body: formData,
      });
  
      const result = await response.json();
      console.log('Puzzle API result:', result); // Debug log
      if (response.ok && result.status === 'success') {
        const questions = result.data.questions || [];
        const quizData = questions.map((q) => ({
          question: q.question,
          answer: q.answer,
        }));
        setPuzzleQuiz(quizData);
        console.log('Set puzzleQuiz:', quizData);
        setPuzzleTimeLeft(questions.length * 60); // Start timer: 60s per question
      } else {
        throw new Error(result.error || 'Something went wrong');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
   
  
  const filteredQuiz = quiz ? filterQuestions(quiz, answers, filter) : [];

  useEffect(() => {
    if (quizTimeLeft === null || quizTimerExpired) return;
    const interval = setInterval(() => {
      setQuizTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          if (!quizTimerExpired) handleSubmitQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizTimeLeft, quizTimerExpired]);

  useEffect(() => {
    if (!puzzleTimeLeft || quizSubmitted || puzzleTimerExpired) return;

  const interval = setInterval(() => {
    setPuzzleTimeLeft(prev => {
      if (prev === 1) {
        clearInterval(interval);
        setPuzzleTimerExpired(true);
        handleSubmitPuzzleQuiz(); // auto-submit when time runs out
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [puzzleTimeLeft, quizSubmitted, puzzleTimerExpired]);
 

  const renderLandingPage = () => (
    <div className="landing-container">
      <h1 className="main-title">T3allab</h1>
      <h2 className="main-title">Smart Quiz Generator</h2>
      <p className="subtitle">Choose your quiz type to get started</p>
      <div className="card-grid">
        <div className="feature-card">
          <h2>MCQ Quiz Generator</h2>
          <p>
            Upload a PDF or Word document, choose how many multiple-choice questions you want,
            and we'll generate an interactive quiz for you to practice!
          </p>
          {/* Navigate to the form only without showing past quizzes */}
          <button onClick={() => setPage('mcq')}>Go to MCQ Generator</button>
        </div>
  
        <div className="feature-card">
          <h3>Puzzle Quiz Generator</h3>
          <p>
            Turn your PDF or Word file into a fill-in-the-blank style puzzle quiz.
            Select how many questions you'd like and start solving!
          </p>
          <button onClick={() => setPage('puzzle')}>Go to Puzzle Generator</button>
        </div>
      </div>
    </div>
  );
  

  const renderNameInput = () => (
    <div className="name-input-container">
      <h2>Welcome to the Quiz!</h2>
      <div className="name-input-box">
        <input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
          className="name-input"
        />
        <button onClick={handleStartQuiz} className="start-quiz-button">
          Start Quiz
        </button>
      </div>
    </div>
  );

  const renderMCQPage = () => (
    <div className="container">
      {!isSharedQuiz && (
      <button onClick={() => setPage(null)} className="back-button">Back Home</button>
      )}
      <h1 className="title">MCQ Quiz Generator</h1>
  
      {showForm && (
        <form className="form" onSubmit={handleSubmit}>
          <input type="file" onChange={handleFileChange} className="input" required />
          <input
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            className="input"
            placeholder="Enter Number of Questions (max 30)"
            max="30"
            min="1"
            required
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input"
            required
          >
            <option value="" disabled>Select Language</option>
            <option value="english">English</option>
            <option value="arabic">Arabic</option>
          </select>
          <button type="submit">Generate Quiz</button>
        </form>
      )}
  
      {loading && <p className="message">Generating your quiz...</p>}
      {error && <p className="error">{error}</p>}
  
      {quiz && !interactiveMode && !showNameInput && (
        <div className="quiz">
          <div className="action-row">
            <button className="action-button start-button" onClick={() => setShowNameInput(true)}>Start Quiz</button>
          </div>
          <div className="action-row">
            <button className="action-button" onClick={handleCopyQuizLink}>Copy Quiz Link</button>
            <button className="action-button" onClick={handleGenerateAnother}>Generate Another Quiz</button>
          </div>
          {linkCopied && (
            <div className="action-row">
              <button
                className="action-button"
                onClick={() => {
                  if (!showLeaderboard) {
                    // Load leaderboard from localStorage
                    const quizContent = JSON.stringify(quiz);
                    let hash = 0;
                    for (let i = 0; i < quizContent.length; i++) {
                      const char = quizContent.charCodeAt(i);
                      hash = ((hash << 5) - hash) + char;
                      hash = hash & hash;
                    }
                    const quizId = Math.abs(hash).toString(36);
                    const storedQuiz = localStorage.getItem(`quiz_${quizId}`);
                    if (storedQuiz) {
                      const quizData = JSON.parse(storedQuiz);
                      if (quizData.scores) {
                        setLeaderboard(quizData.scores);
                      } else {
                        setLeaderboard([]);
                      }
                    } else {
                      setLeaderboard([]);
                    }
                  }
                  setShowLeaderboard((prev) => !prev);
                }}
              >
                {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
              </button>
            </div>
          )}
          {showLeaderboard && (
            <div className="leaderboard-container">
              <h2>Quiz Leaderboard</h2>
              <div className="leaderboard-list">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, index) => (
                    <div key={index} className="leaderboard-entry">
                      <div className="rank">{index + 1}</div>
                      <div className="name">{entry.name}</div>
                      <div className="score">{entry.score}/{entry.total}</div>
                    </div>
                  ))
                ) : (
                  <p className="no-scores">No scores yet. Share the quiz link to see scores here!</p>
                )}
              </div>
            </div>
          )}
          <h2 className="questions-heading">Questions</h2>
          {quiz.map((q, index) => (
            <div key={index} className="question-box">
              <p className="question">{index + 1}. {q.question}</p>
              <ul className="options">
                {q.options.map((opt, i) => {
                  const key = Object.keys(opt)[0];
                  return (
                    <li key={i} className="option">
                      <strong>{key}</strong>: {opt[key]}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
  
      {showNameInput && renderNameInput()}
  
      {quiz && interactiveMode && !showNameInput && (
        <div className="quiz">
          {!quizTimerExpired && (
            <p className="timer">
              Time left: {Math.floor(quizTimeLeft / 60)}m {quizTimeLeft % 60}s
            </p>
          )}
  
          {quizTimerExpired && score !== null && (
            <div className="message">
              <div className="post-quiz-buttons">
                {!isSharedQuiz && (
                  <>
                <button className="action-button" onClick={handleGenerateAnother}>Generate Another Quiz</button>
                <button className="action-button" onClick={handleRetake}>Retake Quiz</button>
                  </>
                )}
                {isSharedQuiz && (
                  <>
                    <button 
                      className="action-button wide-button" 
                      onClick={() => window.location.href = 'http://localhost:3000'}
                    >
                      Visit T3allab
                    </button>
                    <div className="action-row">
                      <button className="action-button" onClick={handleRetake}>Retake Quiz</button>
                      <button 
                        className="action-button" 
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                      >
                        {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="score-box">
                <div className="score-number">{score}</div> / {quiz.length}
                <div className="score-subtitle">
                  {score === quiz.length ? 'Perfect! Great Job!' : score > quiz.length / 2 ? 'Well Done!' : 'Keep Practicing!'}
                </div>
              </div>
              {showLeaderboard && renderLeaderboard()}
            </div>
          )}
  
          {quizTimerExpired && (
            <div className="filters">
              <button onClick={() => setFilter('correct')}>Correctly Answered</button>
              <button onClick={() => setFilter('wrong')}>Wrongly Answered</button>
              <button onClick={() => setFilter('unanswered')}>Not Answered</button>
              <button onClick={() => setFilter('all')}>Show All</button>
            </div>
          )}
  
          <h2 className="questions-heading">Questions</h2>
  
          {filteredQuiz.map((q, index) => {
            const userAns = answers[q.index];
            const isCorrect = userAns === q.answer;
            const isUnanswered = !userAns;
            return (
            <div key={index} className="question-box">
              <p className="question">{index + 1}. {q.question}</p>
              <ul className="options">
                {q.options.map((opt, i) => {
                  const key = Object.keys(opt)[0];
                  const isSelected = selectedOptions[q.index] === key;
                    const isCorrectOpt = q.answer === key;
                  const isWrong = answers[q.index] && answers[q.index] !== q.answer && answers[q.index] === key;
  
                  let optionClass = '';
                  if (!quizTimerExpired) {
                    optionClass = isSelected ? 'purple' : '';
                  } else {
                      if (answers[q.index] === key && isCorrectOpt) optionClass = 'correct';
                    else if (answers[q.index] === key && isWrong) optionClass = 'wrong';
                  }
  
                  return (
                    <li key={i} className={`option ${optionClass}`}>
                      <label>
                        <input
                          type="radio"
                          name={`question-${q.index}`}
                          value={key}
                          checked={answers[q.index] === key}
                          onChange={() => handleAnswer(q.index, key)}
                          disabled={quizTimerExpired}
                        />{' '}
                        <strong>{key}</strong>: {opt[key]}
                      </label>
                    </li>
                  );
                })}
              </ul>
                {/* Feedback after submission */}
                {quizTimerExpired && score !== null && (
                  <div className={
                    isUnanswered ? 'answer-feedback unanswered-feedback' : isCorrect ? 'answer-feedback correct-feedback' : 'answer-feedback wrong-feedback'
                  }>
                    {isUnanswered && <span>Question unanswered</span>}
                    {!isUnanswered && isCorrect && <span>&#10003; Correct</span>}
                    {!isUnanswered && !isCorrect && (
                      <span>&#10007; Wrong. Correct answer is ({q.answer})</span>
                    )}
            </div>
                )}
              </div>
            );
          })}
  
          {!quizTimerExpired && (
            <button className="submit-button" onClick={handleSubmitQuiz}>Submit Quiz</button>
          )}
        </div>
      )}
    </div>
  ); 
  
  
  const renderPuzzlePage = () => (
    <div className="container">
      <button onClick={() => setPage(null)} className="back-button">Back Home</button>
      <h1 className="title">Puzzle Quiz Generator</h1>
  
      {showForm && (
        <form className="form" onSubmit={handlePuzzleSubmit}>
          <input type="file" onChange={handleFileChange} className="input" required />
          <input
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            className="input"
            placeholder="Enter Number of Questions (max 30)"
            max="30"
            min="1"
            required
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input"
            required
          >
            <option value="" disabled>Select Language</option>
            <option value="english">English</option>
            <option value="arabic">Arabic</option>
          </select>
          <button type="submit">Generate Puzzle</button>
        </form>
      )}
  
      {loading && <p className="message">Generating your puzzle...</p>}
      {error && <p className="error">{error}</p>}
  
      {/* After puzzle is generated, show Copy Puzzle Link and Start Quiz buttons, and static puzzle */}
      {puzzleQuiz && !puzzleInteractiveMode && !quizSubmitted && (
        <div className="quiz">
          {/* Start Quiz wide button */}
          <div className="action-row">
            <button className="action-button start-button wide-button" onClick={handleStartPuzzleQuiz}>Start Quiz</button>
          </div>
          {/* Generate Another Puzzle and Copy Puzzle Link side by side */}
          <div className="action-row">
            <button 
              className="action-button" 
              onClick={() => {
                setPuzzleQuiz(null);
                setUserAnswers({});
                setQuizSubmitted(false);
                setPuzzleScore(null);
                setPuzzleTimeLeft(null);
                setPuzzleTimerExpired(false);
                setShowForm(true);
                setFile(null);
                setNumQuestions('');
                setLanguage('');
                setError(null);
                setDroppedAnswers([]);
                setShowLeaderboard(false);
              }}
            >
              Generate Another Puzzle
            </button>
            <button className="action-button" onClick={handleCopyQuizLink}>Copy Puzzle Link</button>
          </div>
          {/* Show Leaderboard button, only after Copy Puzzle Link is clicked */}
          {linkCopied && (
            <div className="action-row">
              <button
                className="action-button"
                onClick={() => {
                  // Load leaderboard from localStorage for this puzzle
                  const quizContent = JSON.stringify(puzzleQuiz);
                  let hash = 0;
                  for (let i = 0; i < quizContent.length; i++) {
                    const char = quizContent.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                  }
                  const quizId = Math.abs(hash).toString(36);
                  const storedPuzzle = localStorage.getItem(`puzzle_${quizId}`);
                  if (storedPuzzle) {
                    const puzzleData = JSON.parse(storedPuzzle);
                    if (puzzleData.scores) {
                      setLeaderboard(puzzleData.scores);
                    } else {
                      setLeaderboard([]);
                    }
                  } else {
                    setLeaderboard([]);
                  }
                  setShowLeaderboard((prev) => !prev);
                }}
              >
                {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
              </button>
            </div>
          )}
          {/* Leaderboard display */}
          {showLeaderboard && (
            <div className="leaderboard-container">
              <h2>Puzzle Leaderboard</h2>
              <div className="leaderboard-list">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry, index) => (
                    <div key={index} className="leaderboard-entry">
                      <div className="rank">{index + 1}</div>
                      <div className="name">{entry.name}</div>
                      <div className="score">{entry.score}/{entry.total}</div>
                    </div>
                  ))
                ) : (
                  <p className="no-scores">No scores yet. Share the puzzle link to see scores here!</p>
                )}
              </div>
            </div>
          )}
          {/* Answers pool in static mode */}
          <div className="answers-section">
            <h2 className="answers-heading">Answers</h2>
            <div className="answer-grid">
              {puzzleQuiz && puzzleQuiz.map((q, i) => (
                <div
                  key={i}
                  className="answer-box"
                  style={language === 'arabic' || language === 'ar' ? { fontFamily: 'Tajawal, Arial, sans-serif' } : {}}
                  dir={(language === 'arabic' || language === 'ar') ? 'rtl' : 'ltr'}
                >
                  {q.answer}
                </div>
              ))}
            </div>
          </div>
          <h2 className="questions-heading">Questions</h2>
          {puzzleQuiz && puzzleQuiz.map((q, i) => (
            <div key={i} className="question-box">
              <p className="question">{i + 1}. {q.question}</p>
            </div>
          ))}
        </div>
      )}

      {/* Interactive puzzle mode (drag/drop, submit, etc.) */}
      {puzzleQuiz && puzzleInteractiveMode && !quizSubmitted && (
        <div className="quiz">
          {/* Timer */}
          {!puzzleTimerExpired && (
            <p className="timer">
              Time left: {Math.floor(puzzleTimeLeft / 60)}m {puzzleTimeLeft % 60}s
            </p>
          )}
          {/* Answers Section (above questions, only if not empty) */}
          {puzzleQuiz.some((q, i) => !userAnswers[i]) && (
            <div className="answers-section">
              <h2 className="answers-heading">Answers</h2>
              <div className="answer-grid">
                {puzzleQuiz.map((q, i) => {
                  if (Object.values(userAnswers).includes(q.answer)) return null;
                  return (
                    <div
                      key={i}
                      className="answer-box"
                      draggable={!quizSubmitted}
                      onDragStart={(e) => !quizSubmitted && handleDragStart(e, q.answer)}
                      dir={(language === 'arabic' || language === 'ar') ? 'rtl' : 'ltr'}
                      style={language === 'arabic' || language === 'ar' ? { fontFamily: 'Tajawal, Arial, sans-serif' } : {}}
                    >
                      {q.answer}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Questions Section */}
          <div
            className="questions-section"
            ref={questionsSectionRef}
            onDragOver={handleQuestionsDragOver}
          >
            <h2 className="questions-heading">Questions</h2>
            {puzzleQuiz.map((q, questionIndex) => {
              const isCorrect = userAnswers[questionIndex] === q.answer;
              const isIncorrect = userAnswers[questionIndex] && userAnswers[questionIndex] !== q.answer;
              const getDropClass = () => {
                if (!quizSubmitted) return 'drop-zone';
                if (isCorrect) return 'drop-zone correct';
                if (isIncorrect) return 'drop-zone incorrect';
                return 'drop-zone';
              };
              return (
                <div
                  key={questionIndex}
                  className="question-box"
                  onDrop={(e) => !quizSubmitted && handleDrop(e, questionIndex)}
                  onDragOver={(e) => !quizSubmitted && handleDragOver(e)}
                  dir={(language === 'arabic' || language === 'ar') ? 'rtl' : 'ltr'}
                  style={language === 'arabic' || language === 'ar' ? { fontFamily: 'Tajawal, Arial, sans-serif' } : {}}
                >
                  <p className="question">{questionIndex + 1}. {q.question}</p>
                  <div className={`dropped-answer ${getDropClass()}`}>
                    {userAnswers[questionIndex] ? (
                      <strong
                        className="removable-answer"
                        onClick={() => handleRemoveAnswer(questionIndex)}
                        title="Click to remove answer"
                      >
                        {userAnswers[questionIndex]}
                      </strong>
                    ) : (
                      <span className="placeholder">Drop answer here</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Submit Button */}
          <div className="submit-quiz">
            <button onClick={handleSubmitPuzzleQuiz}>Submit Quiz</button>
          </div>
        </div>
      )}
      {/* Post-submit UI for regular puzzle flow */}
      {puzzleQuiz && puzzleInteractiveMode && quizSubmitted && (
        <div className="message">
          {/* Two buttons at the top */}
          <div className="post-quiz-buttons">
            <button className="action-button" onClick={handleRetakePuzzle}>Retake Puzzle</button>
            <button className="action-button" onClick={handleGenerateAnotherPuzzle}>Generate Another Puzzle</button>
          </div>
          {/* Score box */}
          <div className="score-box">
            <div className="score-number">{PuzzleScore}</div> / {puzzleQuiz ? puzzleQuiz.length : 0}
            <div className="score-subtitle">
              {PuzzleScore === (puzzleQuiz ? puzzleQuiz.length : 0)
                ? 'Perfect! Great Job!'
                : PuzzleScore > (puzzleQuiz ? puzzleQuiz.length / 2 : 0)
                ? 'Well Done!'
                : 'Keep Practicing!'}
            </div>
          </div>
          {/* Filters */}
          <div className="filters">
            <button onClick={() => setPuzzleFilter('correct')}>Correctly Answered</button>
            <button onClick={() => setPuzzleFilter('wrong')}>Wrongly Answered</button>
            <button onClick={() => setPuzzleFilter('unanswered')}>Not Answered</button>
            <button onClick={() => setPuzzleFilter('all')}>Show All</button>
          </div>
          {/* Answers Section - Only show if there are answers left */}
          {puzzleQuiz && puzzleQuiz.some((q, i) => !userAnswers[i]) && (
            <div className="answers-section">
              <h2 className="answers-heading">Answers</h2>
              <div className="answer-grid">
                {puzzleQuiz.map((q, i) => {
                  if (Object.values(userAnswers).includes(q.answer)) return null;
                  return (
                    <div
                      key={i}
                      className="answer-box"
                      draggable={false}
                      dir={(language === 'arabic' || language === 'ar') ? 'rtl' : 'ltr'}
                      style={language === 'arabic' || language === 'ar' ? { fontFamily: 'Tajawal, Arial, sans-serif' } : {}}
                    >
                      {q.answer}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Filtered Questions Section */}
          <div
            className="questions-section"
            ref={questionsSectionRef}
          >
            <h2 className="questions-heading">Questions</h2>
            {puzzleQuiz && puzzleQuiz
              .map((q, i) => ({ ...q, index: i }))
              .filter((q) => {
                const userAnswer = userAnswers[q.index];
                if (puzzleFilter === 'correct') return userAnswer && userAnswer === q.answer;
                if (puzzleFilter === 'wrong') return userAnswer && userAnswer !== q.answer;
                if (puzzleFilter === 'unanswered') return !userAnswer;
                return true;
              })
              .map((q) => {
                const questionIndex = q.index;
                const isCorrect = userAnswers[questionIndex] === q.answer;
                const isIncorrect = userAnswers[questionIndex] && userAnswers[questionIndex] !== q.answer;
                const getDropClass = () => {
                  if (!quizSubmitted) return 'drop-zone';
                  if (isCorrect) return 'drop-zone correct';
                  if (isIncorrect) return 'drop-zone incorrect';
                  return 'drop-zone';
                };
                return (
                  <div
                    key={questionIndex}
                    className="question-box"
                    dir={(language === 'arabic' || language === 'ar') ? 'rtl' : 'ltr'}
                    style={language === 'arabic' || language === 'ar' ? { fontFamily: 'Tajawal, Arial, sans-serif' } : {}}
                  >
                    <p className="question">{questionIndex + 1}. {q.question}</p>
                    <div className={`dropped-answer ${getDropClass()}`}>
                      {userAnswers[questionIndex] ? (
                        <strong
                          className="removable-answer"
                          title="Answer"
                        >
                          {userAnswers[questionIndex]}
                        </strong>
                      ) : (
                        <span className="placeholder">No answer</span>
                      )}
                    </div>
                    <div className={
                      !userAnswers[questionIndex]
                        ? 'answer-feedback unanswered-feedback'
                        : userAnswers[questionIndex] === q.answer
                          ? 'answer-feedback correct-feedback'
                          : 'answer-feedback wrong-feedback'
                    }>
                      {!userAnswers[questionIndex] && <span>unanswered question</span>}
                      {userAnswers[questionIndex] === q.answer && <span>correct</span>}
                      {userAnswers[questionIndex] && userAnswers[questionIndex] !== q.answer && (
                        <span>wrong correct answer is ({q.answer})</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );

  const handleCopyQuizLink = async () => {
    try {
      // Use puzzleQuiz if in puzzle mode, otherwise quiz
      const isPuzzle = !!puzzleQuiz && !puzzleInteractiveMode && !quizSubmitted;
      const quizDataToShare = isPuzzle ? puzzleQuiz : quiz;
      if (!quizDataToShare) {
        throw new Error('No quiz or puzzle available to share');
      }

      // Create a consistent ID based on the quiz content
      const quizContent = JSON.stringify(quizDataToShare);
      let hash = 0;
      for (let i = 0; i < quizContent.length; i++) {
        const char = quizContent.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      const quizId = Math.abs(hash).toString(36);
      
      // Store the quiz or puzzle in localStorage with a different key for puzzle
      if (isPuzzle) {
        const puzzleData = {
          puzzle: puzzleQuiz,
          language: language,
          scores: []
        };
        localStorage.setItem(`puzzle_${quizId}`, JSON.stringify(puzzleData));
      } else {
        const quizData = {
          quiz: quiz,
          language: language,
          scores: []
        };
        localStorage.setItem(`quiz_${quizId}`, JSON.stringify(quizData));
      }
      
      // Create the shareable link using the frontend URL
      const quizLink = isPuzzle
        ? `${window.location.origin}/puzzle/${quizId}`
        : `${window.location.origin}/quiz/${quizId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(quizLink);
      setLinkCopied(true); // Set link copied state to true
      alert(`${isPuzzle ? 'Puzzle' : 'Quiz'} link copied to clipboard! You can share this link with others.`);
      
    } catch (error) {
      console.error('Error in handleCopyQuizLink:', error);
      alert(`Error generating ${puzzleQuiz ? 'puzzle' : 'quiz'} link: ${error.message}\n\nPlease make sure you have an active ${puzzleQuiz ? 'puzzle' : 'quiz'}.`);
    }
  };

  // Add useEffect to handle quiz loading from URL
  useEffect(() => {
    const loadQuizFromUrl = async () => {
      const path = window.location.pathname;
      const match = path.match(/\/quiz\/(.+)/);
      
      if (match) {
        const quizId = match[1];
        try {
          const storedQuiz = localStorage.getItem(`quiz_${quizId}`);
          if (!storedQuiz) {
            throw new Error('Quiz not found');
          }

          const quizData = JSON.parse(storedQuiz);
          setQuiz(quizData.quiz);
          setOriginalQuiz(quizData.quiz);
          setLanguage(quizData.language);
          setShowForm(false);
          setPage('mcq');
          setShowNameInput(true);
          setIsSharedQuiz(true);

          if (quizData.scores) {
            setLeaderboard(quizData.scores);
          }
        } catch (error) {
          console.error('Error loading quiz:', error);
          alert('Failed to load quiz. The link may be invalid or expired.');
        }
      }
    };

    loadQuizFromUrl();
  }, []);

  const handleStartQuiz = () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }
    setShowNameInput(false);
    setInteractiveMode(true);
    const timePerQuestion = 60; // 60 seconds per question
    setQuizTimeLeft(quiz.length * timePerQuestion); // Set timer based on number of questions
    setQuizTimerExpired(false);
    setAnswers({});
    setSelectedOptions({});
    setScore(null);
  };

  // Add leaderboard component
  const renderLeaderboard = () => (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>
      <div className="leaderboard-list">
        {leaderboard.map((entry, index) => (
          <div key={index} className="leaderboard-entry">
            <div className="rank">{index + 1}</div>
            <div className="name">{entry.name}</div>
            <div className="score">{entry.score}/{entry.total}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleQuestionsDragOver = (e) => {
    const container = questionsSectionRef.current;
    if (!container) return;
    const { top, bottom } = container.getBoundingClientRect();
    const scrollThreshold = 60; // px from top/bottom to start scrolling
    const scrollSpeed = 10; // px per event

    if (e.clientY - top < scrollThreshold) {
      container.scrollTop -= scrollSpeed;
    } else if (bottom - e.clientY < scrollThreshold) {
      container.scrollTop += scrollSpeed;
    }
  };

  // Add handler for starting the interactive puzzle
  const handleStartPuzzleQuiz = () => {
    setPuzzleInteractiveMode(true);
    setPuzzleTimeLeft(puzzleQuiz.length * 60);
    setPuzzleTimerExpired(false);
    setQuizSubmitted(false);
    setUserAnswers({});
    setDroppedAnswers([]);
  };

  // Add useEffect to handle puzzle loading from URL
  useEffect(() => {
    const loadPuzzleFromUrl = async () => {
      const path = window.location.pathname;
      const match = path.match(/\/puzzle\/(.+)/);
      
      if (match) {
        const puzzleId = match[1];
        try {
          const storedPuzzle = localStorage.getItem(`puzzle_${puzzleId}`);
          if (!storedPuzzle) {
            throw new Error('Puzzle not found');
          }
          const puzzleData = JSON.parse(storedPuzzle);
          setSharedPuzzle(puzzleData.puzzle);
          setLanguage(puzzleData.language);
          setShowForm(false);
          setPage('puzzle');
          setSharedPuzzleNameInput(true);
          setSharedPuzzleInteractive(false);
          setPuzzleQuiz(puzzleData.puzzle);
          setUserAnswers({});
          setDroppedAnswers([]);
          setQuizSubmitted(false);
          setPuzzleScore(null);
          setPuzzleTimeLeft(puzzleData.puzzle.length * 60);
        } catch (error) {
          console.error('Error loading puzzle:', error);
          alert('Failed to load puzzle. The link may be invalid or expired.');
        }
      }
    };
    loadPuzzleFromUrl();
  }, []);

  // Handler for starting shared puzzle
  const handleStartSharedPuzzle = () => {
    if (!sharedPuzzleUserName.trim()) {
      alert('Please enter your name');
      return;
    }
    setSharedPuzzleNameInput(false);
    setSharedPuzzleInteractive(true);
    setPuzzleTimeLeft(sharedPuzzle.length * 60);
    setPuzzleTimerExpired(false);
    setQuizSubmitted(false);
    setUserAnswers({});
    setDroppedAnswers([]);
  };

  // Add shared puzzle name input and interactive puzzle rendering
  const renderSharedPuzzle = () => (
    <div className="container">
      <h1 className="title">Puzzle Quiz Generator</h1>
      {sharedPuzzleNameInput && (
        <div className="name-input-container">
          <h2>Enter your name to start the puzzle</h2>
          <div className="name-input-box">
            <input
              type="text"
              value={sharedPuzzleUserName}
              onChange={e => setSharedPuzzleUserName(e.target.value)}
              placeholder="Enter your name"
              className="name-input"
            />
            <button onClick={handleStartSharedPuzzle} className="start-quiz-button">
              Start Puzzle
            </button>
          </div>
        </div>
      )}
      {sharedPuzzleInteractive && (
        <div className="quiz">
          {/* Timer */}
          {!puzzleTimerExpired && !quizSubmitted && (
            <p className="timer">
              Time left: {Math.floor(puzzleTimeLeft / 60)}m {puzzleTimeLeft % 60}s
            </p>
          )}
          {/* Interactive puzzle mode (answers pool, questions, submit) for shared puzzle link */}
          {!quizSubmitted && (
            <>
              {/* Answers Section (above questions, only if not empty) */}
              {sharedPuzzle.some((q, i) => !userAnswers[i]) && (
                <div className="answers-section">
                  <h2 className="answers-heading">Answers</h2>
                  <div className="answer-grid">
                    {sharedPuzzle.map((q, i) => {
                      if (Object.values(userAnswers).includes(q.answer)) return null;
                      return (
                        <div
                          key={i}
                          className="answer-box"
                          draggable={!quizSubmitted}
                          onDragStart={(e) => !quizSubmitted && handleDragStart(e, q.answer)}
                          dir={(language === 'arabic' || language === 'ar') ? 'rtl' : 'ltr'}
                          style={language === 'arabic' || language === 'ar' ? { fontFamily: 'Tajawal, Arial, sans-serif' } : {}}
                        >
                          {q.answer}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Questions Section */}
              <div
                className="questions-section"
                ref={questionsSectionRef}
                onDragOver={handleQuestionsDragOver}
              >
                <h2 className="questions-heading">Questions</h2>
                {sharedPuzzle.map((q, questionIndex) => {
                  const isCorrect = userAnswers[questionIndex] === q.answer;
                  const isIncorrect = userAnswers[questionIndex] && userAnswers[questionIndex] !== q.answer;
                  const getDropClass = () => {
                    if (!quizSubmitted) return 'drop-zone';
                    if (isCorrect) return 'drop-zone correct';
                    if (isIncorrect) return 'drop-zone incorrect';
                    return 'drop-zone';
                  };
                  return (
                    <div
                      key={questionIndex}
                      className="question-box"
                      onDrop={(e) => !quizSubmitted && handleDrop(e, questionIndex)}
                      onDragOver={(e) => !quizSubmitted && handleDragOver(e)}
                      dir={(language === 'arabic' || language === 'ar') ? 'rtl' : 'ltr'}
                      style={language === 'arabic' || language === 'ar' ? { fontFamily: 'Tajawal, Arial, sans-serif' } : {}}
                    >
                      <p className="question">{questionIndex + 1}. {q.question}</p>
                      <div className={`dropped-answer ${getDropClass()}`}>
                        {userAnswers[questionIndex] ? (
                          <strong
                            className="removable-answer"
                            onClick={() => handleRemoveAnswer(questionIndex)}
                            title="Click to remove answer"
                          >
                            {userAnswers[questionIndex]}
                          </strong>
                        ) : (
                          <span className="placeholder">Drop answer here</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Submit Button */}
              <div className="submit-quiz">
                <button onClick={handleSubmitPuzzleQuiz}>Submit Quiz</button>
              </div>
            </>
          )}
          {/* Score and post-quiz actions */}
          {quizSubmitted && PuzzleScore !== null && (
            <div className="message">
              {/* Visit T3allab button */}
              <div className="action-row">
                <button className="action-button wide-button" onClick={() => window.location.href = 'http://localhost:3000'}>Visit T3allab</button>
              </div>
              {/* Retake and Show/Hide Leaderboard buttons next to each other */}
              <div className="action-row">
                <button className="action-button" onClick={() => {
                  setUserAnswers({});
                  setPuzzleScore(null);
                  setDroppedAnswers([]);
                  setPuzzleTimeLeft(sharedPuzzle.length * 60);
                  setPuzzleTimerExpired(false);
                  setQuizSubmitted(false);
                }}>Retake Puzzle</button>
                <button className="action-button" onClick={() => {
                  // Load leaderboard from localStorage for this puzzle
                  const path = window.location.pathname;
                  const match = path.match(/\/puzzle\/(.+)/);
                  if (match) {
                    const puzzleId = match[1];
                    const storedPuzzle = localStorage.getItem(`puzzle_${puzzleId}`);
                    if (storedPuzzle) {
                      const puzzleData = JSON.parse(storedPuzzle);
                      const scores = puzzleData.scores || [];
                      // Sort scores descending
                      scores.sort((a, b) => b.score - a.score);
                      setLeaderboard(scores);
                    } else {
                      setLeaderboard([]);
                    }
                  }
                  setShowLeaderboard((prev) => !prev);
                }}>
                  {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
                </button>
              </div>
              {/* Leaderboard under buttons */}
              {showLeaderboard && (
                <div className="leaderboard-container">
                  <h2>Puzzle Leaderboard</h2>
                  <div className="leaderboard-list">
                    {leaderboard.length > 0 ? (
                      leaderboard.map((entry, index) => (
                        <div key={index} className="leaderboard-entry">
                          <div className="rank">{index + 1}</div>
                          <div className="name">{entry.name}</div>
                          <div className="score">{entry.score}/{entry.total}</div>
                        </div>
                      ))
                    ) : (
                      <p className="no-scores">No scores yet. Share the puzzle link to see scores here!</p>
                    )}
                  </div>
                </div>
              )}
              {/* Score box */}
              <div className="score-box">
                <div className="score-number">{PuzzleScore}</div> / {sharedPuzzle ? sharedPuzzle.length : 0}
                <div className="score-subtitle">
                  {PuzzleScore === (sharedPuzzle ? sharedPuzzle.length : 0)
                    ? 'Perfect! Great Job!'
                    : PuzzleScore > (sharedPuzzle ? sharedPuzzle.length / 2 : 0)
                    ? 'Well Done!'
                    : 'Keep Practicing!'}
                </div>
              </div>
              {/* Filters */}
              <div className="filters">
                <button onClick={() => setPuzzleFilter('correct')}>Correctly Answered</button>
                <button onClick={() => setPuzzleFilter('wrong')}>Wrongly Answered</button>
                <button onClick={() => setPuzzleFilter('unanswered')}>Not Answered</button>
                <button onClick={() => setPuzzleFilter('all')}>Show All</button>
              </div>
              {/* Answers Section - Only show if there are answers left */}
              {sharedPuzzle && sharedPuzzle.some((q, i) => !userAnswers[i]) && (
                <div className="answers-section">
                  <h2 className="answers-heading">Answers</h2>
                  <div className="answer-grid">
                    {sharedPuzzle.map((q, i) => {
                      if (Object.values(userAnswers).includes(q.answer)) return null;
                      return (
                        <div
                          key={i}
                          className="answer-box"
                          draggable={false}
                          dir={(language === 'arabic' || language === 'ar') ? 'rtl' : 'ltr'}
                          style={language === 'arabic' || language === 'ar' ? { fontFamily: 'Tajawal, Arial, sans-serif' } : {}}
                        >
                          {q.answer}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Filtered Questions Section */}
              <div
                className="questions-section"
                ref={questionsSectionRef}
              >
                <h2 className="questions-heading">Questions</h2>
                {sharedPuzzle && sharedPuzzle
                  .map((q, i) => ({ ...q, index: i }))
                  .filter((q) => {
                    const userAnswer = userAnswers[q.index];
                    if (puzzleFilter === 'correct') return userAnswer && userAnswer === q.answer;
                    if (puzzleFilter === 'wrong') return userAnswer && userAnswer !== q.answer;
                    if (puzzleFilter === 'unanswered') return !userAnswer;
                    return true;
                  })
                  .map((q) => {
                    const questionIndex = q.index;
                    const isCorrect = userAnswers[questionIndex] === q.answer;
                    const isIncorrect = userAnswers[questionIndex] && userAnswers[questionIndex] !== q.answer;
                    const getDropClass = () => {
                      if (!quizSubmitted) return 'drop-zone';
                      if (isCorrect) return 'drop-zone correct';
                      if (isIncorrect) return 'drop-zone incorrect';
                      return 'drop-zone';
                    };
                    return (
                      <div
                        key={questionIndex}
                        className="question-box"
                        dir={(language === 'arabic' || language === 'ar') ? 'rtl' : 'ltr'}
                        style={language === 'arabic' || language === 'ar' ? { fontFamily: 'Tajawal, Arial, sans-serif' } : {}}
                      >
                        <p className="question">{questionIndex + 1}. {q.question}</p>
                        <div className={`dropped-answer ${getDropClass()}`}>
                          {userAnswers[questionIndex] ? (
                            <strong
                              className="removable-answer"
                              title="Answer"
                            >
                              {userAnswers[questionIndex]}
                            </strong>
                          ) : (
                            <span className="placeholder">No answer</span>
                          )}
                        </div>
                        <div className={
                          !userAnswers[questionIndex]
                            ? 'answer-feedback unanswered-feedback'
                            : userAnswers[questionIndex] === q.answer
                              ? 'answer-feedback correct-feedback'
                              : 'answer-feedback wrong-feedback'
                        }>
                          {!userAnswers[questionIndex] && <span>unanswered question</span>}
                          {userAnswers[questionIndex] === q.answer && <span>correct</span>}
                          {userAnswers[questionIndex] && userAnswers[questionIndex] !== q.answer && (
                            <span>wrong correct answer is ({q.answer})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {page === null && renderLandingPage()}
      {page === 'mcq' && renderMCQPage()}
      {page === 'puzzle' && !sharedPuzzle && renderPuzzlePage()}
      {sharedPuzzle && renderSharedPuzzle()}
    </>
  );
  
}

export default App;
