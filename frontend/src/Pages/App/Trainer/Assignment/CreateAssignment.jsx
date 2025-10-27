import React, { useMemo, useState, useEffect } from 'react';
import { Plus, Trash2, Save, AlertTriangle, Database, Search, Filter, CheckSquare, Square } from 'lucide-react';
import { AssignmentBuilder } from './Assignment';

function CreateAssignment() {
  const [activeTab, setActiveTab] = useState('assignment'); // 'assignment' or 'bank'
  const [meta, setMeta] = useState({
    title: '',
    durationMins: 30,
    passPercent: 40,
    totalMarks: 100,
    negativeMarkPerWrong: 0, // optional
  });

  const [questions, setQuestions] = useState([]);

  // Question Bank State
  const [questionBank, setQuestionBank] = useState([]);
  const [bankSearchTerm, setBankSearchTerm] = useState('');
  const [bankFilterMarks, setBankFilterMarks] = useState('');
  const [selectedBankQuestions, setSelectedBankQuestions] = useState(new Set());
  const [newBankQuestion, setNewBankQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctIndex: null,
    marks: 1
  });

  // Assignment settings in Question Bank
  const [bankAssignmentSettings, setBankAssignmentSettings] = useState({
    title: '',
    durationMins: 30,
    passPercent: 40,
    totalMarks: 100,
    negativeMarkPerWrong: 0
  });

  // Load question bank on component mount
  useEffect(() => {
    const savedBank = localStorage.getItem('questionBank:v1');
    if (savedBank) {
      setQuestionBank(JSON.parse(savedBank));
    }
  }, []);

  const totalAllocated = useMemo(
    () => questions.reduce((sum, q) => sum + Number(q.marks || 0), 0),
    [questions]
  );

  const isQuestionsValid = useMemo(() => {
    if (!questions.length) return false;
    for (const q of questions) {
      if (!q.question?.trim()) return false;
      // Removed correct answer requirement - students can submit without correct answers set
      if (!q.options || q.options.length !== 4) return false;
      for (const op of q.options) {
        if (!op?.trim()) return false;
      }
      if (!q.marks || Number(q.marks) <= 0) return false;
    }
    return true;
  }, [questions]);

  // Filtered question bank
  const filteredQuestionBank = useMemo(() => {
    return questionBank.filter(q => {
      const matchesSearch = !bankSearchTerm || 
        q.question.toLowerCase().includes(bankSearchTerm.toLowerCase());
      const matchesMarks = !bankFilterMarks || 
        Number(q.marks) === Number(bankFilterMarks);
      return matchesSearch && matchesMarks;
    });
  }, [questionBank, bankSearchTerm, bankFilterMarks]);

  const canSave =
    meta.title.trim() &&
    Number(meta.durationMins) > 0 &&
    Number(meta.passPercent) >= 0 &&
    Number(meta.passPercent) <= 100 &&
    questions.length > 0 &&
    isQuestionsValid &&
    Number(totalAllocated) <= Number(meta.totalMarks);

  const handleQuestionChange = (id, value) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, question: value } : q))
    );
  };

  const handleOptionChange = (questionId, optionIndex, value) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const next = [...q.options];
        next[optionIndex] = value;
        return { ...q, options: next };
      })
    );
  };

  const handleCorrectIndexChange = (questionId, index) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, correctIndex: index } : q))
    );
  };

  const handleMarksChange = (questionId, value) => {
    const n = Number(value);
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, marks: isNaN(n) ? 0 : n } : q))
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map((x) => x.id)) + 1 : 1,
        question: '',
        options: ['', '', '', ''],
        correctIndex: null,  // Start with no correct answer selected
        marks: 1,
      },
    ]);
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // Question Bank Functions
  const addToQuestionBank = () => {
    if (!newBankQuestion.question.trim() || newBankQuestion.correctIndex === null) {
      alert('Please fill question and select correct answer');
      return;
    }
    
    const newQuestion = {
      id: questionBank.length ? Math.max(...questionBank.map(q => q.id)) + 1 : 1,
      ...newBankQuestion,
      question: newBankQuestion.question.trim(),
      options: newBankQuestion.options.map(opt => opt.trim()),
      createdAt: new Date().toISOString()
    };
    
    const updatedBank = [...questionBank, newQuestion];
    setQuestionBank(updatedBank);
    localStorage.setItem('questionBank:v1', JSON.stringify(updatedBank));
    
    // Reset form
    setNewBankQuestion({
      question: '',
      options: ['', '', '', ''],
      correctIndex: null,
      marks: 1
    });
    
    alert('Question added to bank successfully!');
  };

  const removeFromQuestionBank = (id) => {
    const updatedBank = questionBank.filter(q => q.id !== id);
    setQuestionBank(updatedBank);
    localStorage.setItem('questionBank:v1', JSON.stringify(updatedBank));
    setSelectedBankQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleBankQuestionSelection = (id) => {
    setSelectedBankQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const addSelectedQuestionsToAssignment = () => {
    const selectedQuestions = questionBank.filter(q => selectedBankQuestions.has(q.id));
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question');
      return;
    }

    // Require assignment title in assignment settings before adding
    if (!bankAssignmentSettings.title || !bankAssignmentSettings.title.trim()) {
      alert('Please provide an Assignment Title in Assignment Settings before adding questions');
      return;
    }

    const newQuestions = selectedQuestions.map((q, index) => ({
      ...q,
      id: Date.now() + index + Math.random(), // Generate unique IDs using timestamp + index + random
      correctIndex: null  // Reset correct answer so you can select it manually in Assignment Builder
    }));

    // Use assignment settings from Question Bank
    setMeta(bankAssignmentSettings);

    setQuestions(prev => [...prev, ...newQuestions]);
    setSelectedBankQuestions(new Set());
    setActiveTab('assignment');
    alert(`${selectedQuestions.length} questions added to assignment!`);
  };

  const handleSave = () => {
    if (!canSave) {
      alert(
        'Please fix errors before saving.\n- Make sure all fields are filled\n- Sum of marks should not exceed total marks'
      );
      return;
    }
    const payload = {
      meta: {
        title: meta.title.trim(),
        durationMins: Number(meta.durationMins),
        passPercent: Number(meta.passPercent),
        totalMarks: Number(meta.totalMarks),
        negativeMarkPerWrong: Number(meta.negativeMarkPerWrong || 0),
      },
      questions,
    };
    localStorage.setItem('assignment:v1', JSON.stringify(payload));
    alert('Assignment saved successfully!');
  };

  return (
    <div className="create-assignment-container">
      <div className="create-assignment-card">
        <h1 className="create-title">Create Assignment</h1>
        
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'assignment' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignment')}
          >
            Assignment Builder
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            <Database size={18} />
            Question Bank
          </button>
        </div>

        {/* Assignment Tab */}
        {activeTab === 'assignment' && (
          <AssignmentBuilder
            meta={meta}
            questions={questions}
            totalAllocated={totalAllocated}
            handleQuestionChange={handleQuestionChange}
            handleOptionChange={handleOptionChange}
            handleCorrectIndexChange={handleCorrectIndexChange}
            handleMarksChange={handleMarksChange}
            handleSave={handleSave}
            canSave={canSave}
          />
        )}

        {/* Question Bank Tab */}
        {activeTab === 'bank' && (
          <>
            {/* Add New Question to Bank */}
            <div className="bank-add-section">
              <h3>Add New Question to Bank</h3>
              <div className="bank-form">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Enter question"
                    value={newBankQuestion.question}
                    onChange={(e) => setNewBankQuestion({...newBankQuestion, question: e.target.value})}
                    className="question-input"
                  />
                </div>
                
                <div className="options-group">
                  {newBankQuestion.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="option-input-group">
                      <input
                        type="text"
                        placeholder={`Option ${optionIndex + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newBankQuestion.options];
                          newOptions[optionIndex] = e.target.value;
                          setNewBankQuestion({...newBankQuestion, options: newOptions});
                        }}
                        className="option-input"
                      />
                      <label className="correct-flag">
                        <input
                          type="radio"
                          name="bank-correct"
                          checked={newBankQuestion.correctIndex === optionIndex}
                          onChange={() => setNewBankQuestion({...newBankQuestion, correctIndex: optionIndex})}
                          className="correct-radio"
                        />
                        Correct
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="bank-meta">
                  <div className="meta-field">
                    <label>Marks</label>
                    <input
                      type="number"
                      min={1}
                      value={newBankQuestion.marks}
                      onChange={(e) => setNewBankQuestion({...newBankQuestion, marks: Number(e.target.value)})}
                    />
                  </div>
                </div>
                
                <button className="add-to-bank-btn" onClick={addToQuestionBank}>
                  <Plus size={18} />
                  Add to Question Bank
                </button>
              </div>
            </div>

            {/* Assignment Settings */}
            {selectedBankQuestions.size > 0 && (
              <div className="assignment-settings-section">
                <h3>Assignment Settings</h3>
                <div className="assignment-settings-grid">
                  <div className="meta-field">
                    <label>Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Week 1 Quiz"
                      value={bankAssignmentSettings.title}
                      onChange={(e) => setBankAssignmentSettings({...bankAssignmentSettings, title: e.target.value})}
                    />
                  </div>
                  <div className="meta-field">
                    <label>Duration (mins)</label>
                    <input
                      type="number"
                      min={1}
                      value={bankAssignmentSettings.durationMins}
                      onChange={(e) => setBankAssignmentSettings({...bankAssignmentSettings, durationMins: Number(e.target.value)})}
                    />
                  </div>
                  <div className="meta-field">
                    <label>Pass %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={bankAssignmentSettings.passPercent}
                      onChange={(e) => setBankAssignmentSettings({...bankAssignmentSettings, passPercent: Number(e.target.value)})}
                    />
                  </div>
                  <div className="meta-field">
                    <label>Total Marks</label>
                    <input
                      type="number"
                      min={1}
                      value={bankAssignmentSettings.totalMarks}
                      onChange={(e) => setBankAssignmentSettings({...bankAssignmentSettings, totalMarks: Number(e.target.value)})}
                    />
                  </div>
                  <div className="meta-field">
                    <label>Negative Mark per wrong (optional)</label>
                    <input
                      type="number"
                      step="0.25"
                      min={0}
                      value={bankAssignmentSettings.negativeMarkPerWrong}
                      onChange={(e) => setBankAssignmentSettings({...bankAssignmentSettings, negativeMarkPerWrong: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Question Bank Management */}
            <div className="bank-management-section">
              <div className="bank-header">
                <h3>Question Bank ({questionBank.length} questions)</h3>
                <div className="bank-filters">
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={bankSearchTerm}
                      onChange={(e) => setBankSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="filter-box">
                    <Filter size={16} />
                    <input
                      type="number"
                      placeholder="Filter by marks"
                      value={bankFilterMarks}
                      onChange={(e) => setBankFilterMarks(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Selected Questions Actions */}
              {selectedBankQuestions.size > 0 && (
                <div className="selected-actions">
                  <span>{selectedBankQuestions.size} questions selected</span>
                   <button
                    className="add-selected-btn"
                    onClick={addSelectedQuestionsToAssignment}
                    disabled={!bankAssignmentSettings.title || !bankAssignmentSettings.title.trim()}
                  >
                    <Plus size={16} />
                    Add to Assignment
                  </button>
                </div>
              )}

              {/* Question Bank List */}
              <div className="bank-questions-list">
                {filteredQuestionBank.map((q) => (
                  <div key={q.id} className="bank-question-card">
                    <div className="question-select">
                      <button
                        className="select-btn"
                        onClick={() => toggleBankQuestionSelection(q.id)}
                      >
                        {selectedBankQuestions.has(q.id) ? 
                          <CheckSquare size={18} /> : 
                          <Square size={18} />
                        }
                      </button>
                    </div>
                    
                    <div className="question-content">
                      <div className="question-text">{q.question}</div>
                      <div className="question-meta">
                        <span className="meta-tag">{q.marks} marks</span>
                        <span className="meta-tag">Correct: {q.options[q.correctIndex]}</span>
                      </div>
                    </div>
                    
                    <div className="question-actions">
                      <button 
                        className="remove-bank-btn"
                        onClick={() => removeFromQuestionBank(q.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {filteredQuestionBank.length === 0 && (
                  <div className="empty-bank">
                    <Database size={48} />
                    <p>No questions found in bank</p>
                    <small>Add questions using the form above</small>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        .create-assignment-container {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }
        .create-assignment-card {
          background-color: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .create-title {
          color: #333;
          font-size: 2rem;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #eee;
        }
        
        /* Tab Navigation */
        .tab-navigation {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          color: #718096;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: #4299e1;
          background: #f7fafc;
        }
        .tab-btn.active {
          color: #4299e1;
          border-bottom-color: #4299e1;
          background: #f7fafc;
        }
        .meta-grid{
          display:grid;
          grid-template-columns: repeat(auto-fit,minmax(180px,1fr));
          gap:1rem;
          margin-bottom: 1rem;
        }
        .meta-field{
          display:flex; flex-direction:column; gap:.5rem;
        }
        .meta-field label{ font-size:.9rem; color:#4a5568;}
        .meta-field input{
          padding:.6rem .75rem; border:1px solid #e2e8f0; border-radius:6px;
        }
        .meta-field input[readonly] {
          background-color: #f7fafc;
          color: #4a5568;
          cursor: not-allowed;
          border-color: #cbd5e0;
        }
        .total-allocated{
          display:flex; align-items:center; gap:.75rem;
          padding:.6rem .9rem; border-radius:8px; margin: .5rem 0 1rem;
          font-size:.95rem;
        }
        .total-allocated.ok{ background:#f0fff4; color:#22543d; border:1px solid #c6f6d5;}
        .total-allocated.bad{ background:#fff5f5; color:#742a2a; border:1px solid #fed7d7;}
        .total-allocated .warn{ display:inline-flex; align-items:center; gap:.4rem; margin-left:.5rem;}
        .question-form {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1rem;
          border:1px solid #edf2f7;
        }
        .question-header {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: .75rem;
          margin-bottom: 1rem;
        }
        .marks-wrap{ display:flex; align-items:center; gap:.5rem;}
        .marks-wrap label{ font-size:.9rem; color:#4a5568;}
        .marks-input{
          width:90px; padding:.5rem .6rem; border:1px solid #e2e8f0; border-radius:6px;
        }
        .marks-input[readonly] {
          background-color: #f7fafc;
          color: #4a5568;
          cursor: not-allowed;
          border-color: #cbd5e0;
        }
        .remove-btn {
          background: none; border: none; color: #e53e3e; cursor: pointer; padding: 0.5rem; border-radius: 4px;
        }
        .remove-btn:hover { background-color: #fff5f5; }
        .form-group { margin-bottom: 1rem; }
        .question-input, .option-input {
          width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 1rem;
        }
        .options-group { display: flex; flex-direction: column; gap: .75rem; }
        .option-input-group { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: .75rem; }
        .correct-flag{ display:flex; align-items:center; gap:.4rem; color:#2b6cb0; }
        .correct-radio { width: 18px; height: 18px; cursor: pointer; }
        .buttons-container { display: flex; justify-content: center; margin-top: 1.25rem; }
        .add-question-btn, .save-btn {
          display: flex; align-items: center; gap: 8px; padding: 0.75rem 1.2rem;
          border-radius: 6px; font-size: 1rem; cursor: pointer; transition: all 0.2s; border: none;
        }
        .add-question-btn { background-color: #48bb78; color: white; }
        .add-question-btn:hover { background-color: #38a169; }
        .save-btn { background-color: #4299e1; color: white; }
        .save-btn:disabled { background:#a0aec0; cursor:not-allowed; }
        .save-btn:not(:disabled):hover { background-color: #3182ce; }
        
        /* No Questions Message */
        .no-questions-message {
          text-align: center;
          padding: 3rem 1rem;
          color: #718096;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin: 1rem 0;
        }
        .no-questions-message h3 {
          color: #4a5568;
          margin: 1rem 0 0.5rem;
          font-size: 1.2rem;
        }
        .no-questions-message p {
          font-size: 1rem;
          margin: 0;
        }
        
        /* Question Bank Styles */
        .bank-add-section {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid #e2e8f0;
        }
        .bank-add-section h3 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }
        .bank-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .bank-meta {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        .add-to-bank-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1.2rem;
          background-color: #48bb78;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          align-self: flex-start;
        }
        .add-to-bank-btn:hover {
          background-color: #38a169;
        }
        
        /* Assignment Settings Styles */
        .assignment-settings-section {
          background: #e6fffa;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid #81e6d9;
        }
        .assignment-settings-section h3 {
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }
        .assignment-settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
        }
        
        .bank-management-section {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }
        .bank-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .bank-header h3 {
          color: #2d3748;
          font-size: 1.2rem;
        }
        .bank-filters {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .search-box, .filter-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
        }
        .search-box input, .filter-box input {
          border: none;
          outline: none;
          font-size: 0.9rem;
          min-width: 150px;
        }
        
        .selected-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: #e6fffa;
          border: 1px solid #81e6d9;
          border-radius: 6px;
          margin-bottom: 1rem;
        }
        .add-selected-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        .add-selected-btn:hover {
          background: #3182ce;
        }
        .add-selected-btn:disabled { background:#a0aec0; cursor:not-allowed; }
        
        .bank-questions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .bank-question-card {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .bank-question-card:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }
        .question-select {
          display: flex;
          align-items: center;
        }
        .select-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #718096;
          padding: 0.25rem;
          border-radius: 4px;
        }
        .select-btn:hover {
          background: #e2e8f0;
          color: #4299e1;
        }
        .question-content {
          flex: 1;
        }
        .question-text {
          font-size: 1rem;
          color: #2d3748;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .question-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .meta-tag {
          background: #e2e8f0;
          color: #4a5568;
          padding: 0.25rem 0.5rem;
          border-radius: 999px;
          font-size: 0.8rem;
        }
        .meta-tag.difficulty {
          background: #fed7d7;
          color: #742a2a;
        }
        .question-actions {
          display: flex;
          align-items: center;
        }
        .remove-bank-btn {
          background: none;
          border: none;
          color: #e53e3e;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
        }
        .remove-bank-btn:hover {
          background-color: #fff5f5;
        }
        
        .empty-bank {
          text-align: center;
          padding: 3rem 1rem;
          color: #718096;
        }
        .empty-bank p {
          font-size: 1.1rem;
          margin: 1rem 0 0.5rem;
        }
        .empty-bank small {
          font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
          .create-assignment-container { padding: 1rem; }
          .create-assignment-card { padding: 1rem; }
          .buttons-container { flex-direction: column; gap: 1rem; }
          .save-btn { width: 100%; justify-content: center; }
          .bank-header { flex-direction: column; align-items: stretch; }
          .bank-filters { flex-direction: column; }
          .bank-question-card { grid-template-columns: 1fr; gap: 0.75rem; }
          .question-meta { justify-content: center; }
        }
      `}</style>
    </div>
  );
}

export default CreateAssignment;