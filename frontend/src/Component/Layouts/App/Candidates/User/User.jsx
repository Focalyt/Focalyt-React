// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import './User.css';

// const User = () => {
//     const [currentStep, setCurrentStep] = useState(1);

//     // For education mapping
//     const [educations, setEducations] = useState([{
//         education: '',         // ObjectId of Qualification (e.g., 10th, UG)
//         universityName: '',
//         boardName: '',
//         collegeName: '',
//         schoolName: '',
//         course: '',            // ObjectId of QualificationCourse
//         specialization: '',
//         passingYear: '',
//         marks: '',
//         universityLocation: {
//             type: 'Point',
//             coordinates: [0, 0],
//             city: '',
//             state: '',
//             fullAddress: ''
//         },
//         collegeLocation: {
//             type: 'Point',
//             coordinates: [0, 0],
//             city: '',
//             state: '',
//             fullAddress: ''
//         },
//         schoolLocation: {
//             type: 'Point',
//             coordinates: [0, 0],
//             city: '',
//             state: '',
//             fullAddress: ''
//         }
//     }]);

//     const [educationList, setEducationList] = useState([]);

//     const [boardSuggestions, setBoardSuggestions] = useState([]);
//     const [suggestionIndex, setSuggestionIndex] = useState(null);
//     const [coursesList, setCoursesList] = useState({});
//     const [specializationsList, setSpecializationsList] = useState({});

//     // Backend URL - replace with your actual backend URL
//     const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

//     const [formData, setFormData] = useState({
//         basicDetails: {
//             completed: false
//         },
//         education: {
//             completed: false
//         },
//         lastStep: {
//             completed: false
//         }
//     });

//     // Fetch education options on component mount
// useEffect(() => {
//   const fetchEducationOptions = async () => {
//     try {
//       const response = await axios.get(`${backendUrl}/api/educationlist`);
//       if (response.data?.status && response.data.data?.educationlist) {
//         setEducationList(response.data.data.educationlist);
//       } else {
//         console.error("Education API error:", response.data.message);
//       }
//     } catch (error) {
//       console.error("Error fetching education options:", error);
//     }
//   };

//   fetchEducationOptions();
// }, [backendUrl]);



//     // Handle continue button click
//     const handleContinue = () => {
//         if (currentStep === 1) {
//             // In a real app, validate basic details here
//             setFormData({
//                 ...formData,
//                 basicDetails: { completed: true }
//             });
//             setCurrentStep(2);
//         } else if (currentStep === 2) {
//             // Validate education selections
//             if (!educations[0].education) {
//                 alert('Please select your highest qualification');
//                 return;
//             }

//             setFormData({
//                 ...formData,
//                 education: { completed: true }
//             });
//             setCurrentStep(3);
//         } else if (currentStep === 3) {
//             // Complete the form
//             setFormData({
//                 ...formData,
//                 lastStep: { completed: true }
//             });
//             // Submit the form or redirect
//             alert('Form completed!');
//         }
//     };

//     // Handle step navigation
//     const goToStep = (stepNumber) => {
//         // Only allow going to steps that are available (completed previous step or current step)
//         if (stepNumber === 1 ||
//             (stepNumber === 2 && formData.basicDetails.completed) ||
//             (stepNumber === 3 && formData.education.completed)) {
//             setCurrentStep(stepNumber);
//         }
//     };

//     // Handle board input change
//     const handleBoardInputChange = async (value, index) => {
//         const updated = [...educations];
//         updated[index].boardName = value;
//         updated[index].board = '';
//         setEducations(updated);

//         if (value.length >= 2) {
//             try {
//                 const res = await axios.get(`${backendUrl}/api/boards?search=${value}`);
//                 setBoardSuggestions(res.data);
//                 setSuggestionIndex(index);
//             } catch (err) {
//                 console.error("Board fetch error:", err);
//                 setBoardSuggestions([]);
//             }
//         } else {
//             setBoardSuggestions([]);
//         }
//     };

//     // Fetch courses by education
//     const fetchCoursesByEducation = async (educationId) => {
//         if (!educationId) return;

//         try {
//             const response = await axios.get(`${backendUrl}/api/courselist/${educationId}`);

//             if (response.data.status) {
//                 return response.data.data.courses;
//             } else {
//                 console.error("Failed to fetch courses:", response.data.message);
//                 return [];
//             }
//         } catch (err) {
//             console.error("Error fetching courses:", err);
//             return [];
//         }
//     };

//     // Fetch specializations by course
//     const fetchSpecializationsByCourse = async (courseId) => {
//         if (!courseId) return;

//         try {
//             const response = await axios.get(`${backendUrl}/api/specializations/${courseId}`);

//             if (response.data.status) {
//                 return response.data.data.specializations;
//             } else {
//                 console.error("Failed to fetch specializations:", response.data.message);
//                 return [];
//             }
//         } catch (err) {
//             console.error("Error fetching specializations:", err);
//             return [];
//         }
//     };

//     // Handle education change
//     const handleEducationChange = async (e, index) => {
//         const educationId = e.target.value;

//         const updated = [...educations];
//         updated[index].education = educationId;
//         updated[index].course = '';
//         updated[index].specialization = '';
//         setEducations(updated);

//         const educationName = educationList.find(ed => ed._id === educationId)?.name;

//         if (educationName === 'ITI') {
//             const courseRes = await fetchCoursesByEducation(educationId);
//             if (courseRes && courseRes.length > 0) {
//                 const itiCourseId = courseRes[0]._id;

//                 // Set course ID in state
//                 updated[index].course = itiCourseId;
//                 setEducations([...updated]);

//                 // Fetch specialization for this course
//                 const specializations = await fetchSpecializationsByCourse(itiCourseId);
//                 setSpecializationsList(prev => ({
//                     ...prev,
//                     [index]: specializations
//                 }));
//             }
//         } else {
//             // Normal flow for other education types
//             const courses = await fetchCoursesByEducation(educationId);
//             setCoursesList(prev => ({
//                 ...prev,
//                 [index]: courses
//             }));
//         }
//     };
//   useEffect(() => {
//     if (educations.length > 0 && educationList.length > 0) {
//       educations.forEach(async (edu, index) => {
//         const educationName = educationList.find(q => q._id === edu.education)?.name;

//         // ✅ If Graduation or other higher education, fetch course list
//         if (educationName && !['Upto 5th', '6th - 9th Class', '10th', '12th', 'ITI'].includes(educationName)) {
//           const courseRes = await fetchCoursesByEducation(edu.education);
//           if (courseRes.length > 0) {
//             setCoursesList(prev => ({
//               ...prev,
//               [index]: courseRes
//             }));
//           }

//           // ✅ Then fetch specialization
//           if (edu.course) {
//             const specRes = await fetchSpecializationsByCourse(edu.course);
//             if (specRes.length > 0) {
//               setSpecializationsList(prev => ({
//                 ...prev,
//                 [index]: specRes
//               }));
//             }
//           }
//         }

//         // ✅ If ITI, handle that case separately
//         if (educationName === 'ITI') {
//           const courseRes = await fetchCoursesByEducation(edu.education);
//           if (courseRes.length > 0) {
//             const itiCourseId = courseRes[0]._id;

//             // Update selected course ID if not already present
//             if (!edu.course) {
//               const updated = [...educations];
//               updated[index].course = itiCourseId;
//               setEducations(updated);
//             }

//             setCoursesList(prev => ({
//               ...prev,
//               [index]: courseRes
//             }));

//             const specRes = await fetchSpecializationsByCourse(itiCourseId);
//             if (specRes.length > 0) {
//               setSpecializationsList(prev => ({
//                 ...prev,
//                 [index]: specRes
//               }));
//             }
//           }
//         }
//       });
//     }
//   }, [educations, educationList]);
  
//     // Handle course change
//     const handleCourseChange = async (e, index) => {
//         const courseId = e.target.value;

//         const updated = [...educations];
//         updated[index].course = courseId;
//         // Reset specialization since course changed
//         updated[index].specialization = '';
//         setEducations(updated);

//         // Fetch specializations
//         if (courseId) {
//             const specializations = await fetchSpecializationsByCourse(courseId);

//             // Store specializations list in state
//             setSpecializationsList(prevState => ({
//                 ...prevState,
//                 [index]: specializations
//             }));
//         }
//     };

//     // Render education fields based on type
//     const renderEducationFields = (edu, index) => {
//         // Get education name based on selected ID
//         const educationName = educationList.find(q => q._id === edu.education)?.name || '';

//         // Case 1: Upto 5th or 6th - 9th Class
//         if (['Upto 5th', '6th - 9th Class'].includes(educationName)) {
//             return null;
//         }

//         // Case 2: 10th Class
//         else if (educationName === '10th') {
//             return (
//                 <>
//                     <div className="form-group">
//                         <label className="form-label">Board</label>
//                         <div className="board-autocomplete-wrapper">
//                             <input
//                                 type="text"
//                                 className="form-input"
//                                 value={edu.boardName || ''}
//                                 onChange={(e) => handleBoardInputChange(e.target.value, index)}
//                             />
//                             {suggestionIndex === index && boardSuggestions.length > 0 && (
//                                 <ul className="suggestion-list board-suggestion-list">
//                                     {boardSuggestions.map((b) => (
//                                         <li
//                                             key={b._id}
//                                             className='board-suggestion-item'
//                                             onClick={() => {
//                                                 const updated = [...educations];
//                                                 updated[index].board = b._id;
//                                                 updated[index].boardName = b.name;
//                                                 setEducations(updated);
//                                                 setBoardSuggestions([]);
//                                                 setSuggestionIndex(null);
//                                             }}
//                                         >
//                                             {b.name} ({b.type})
//                                         </li>
//                                     ))}
//                                 </ul>
//                             )}
//                         </div>
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">School Name</label>
//                         <input
//                             type="text"
//                             id={`school-name-${index}`}
//                             className="form-input"
//                             value={edu.schoolName || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].schoolName = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">Passing Year</label>
//                         <input
//                             type="text"
//                             className="form-input"
//                             value={edu.passingYear || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].passingYear = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">Marks (%)</label>
//                         <input
//                             type="text"
//                             className="form-input"
//                             value={edu.marks || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].marks = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>
//                 </>
//             );
//         }

//         // Case 3: 12th Class
//         else if (educationName === '12th') {
//             return (
//                 <>
//                     <div className="form-group">
//                         <label className="form-label">Board</label>
//                         <div className="board-autocomplete-wrapper">
//                             <input
//                                 type="text"
//                                 className="form-input"
//                                 value={edu.boardName || ''}
//                                 onChange={(e) => handleBoardInputChange(e.target.value, index)}
//                             />
//                             {suggestionIndex === index && boardSuggestions.length > 0 && (
//                                 <ul className="suggestion-list board-suggestion-list">
//                                     {boardSuggestions.map((b) => (
//                                         <li
//                                             key={b._id}
//                                             className='board-suggestion-item'
//                                             onClick={() => {
//                                                 const updated = [...educations];
//                                                 updated[index].boardName = b.name;
//                                                 setEducations(updated);
//                                                 setBoardSuggestions([]);
//                                                 setSuggestionIndex(null);
//                                             }}
//                                         >
//                                             {b.name} ({b.type})
//                                         </li>
//                                     ))}
//                                 </ul>
//                             )}
//                         </div>
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">Specialization</label>
//                         <select
//                             className="form-input"
//                             value={edu.specialization || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].specialization = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         >
//                             <option value="">Select Specialization</option>
//                             <option value="Science (PCM)">Science (PCM)</option>
//                             <option value="Science (PCB)">Science (PCB)</option>
//                             <option value="Science (PCMB)">Science (PCMB)</option>
//                             <option value="Commerce">Commerce</option>
//                             <option value="Commerce with Maths">Commerce with Maths</option>
//                             <option value="Arts/Humanities">Arts/Humanities</option>
//                             <option value="Vocational">Vocational</option>
//                         </select>
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">School Name</label>
//                         <input
//                             type="text"
//                             id={`school-name-${index}`}
//                             className="form-input"
//                             value={edu.schoolName || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].schoolName = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">Passing Year</label>
//                         <input
//                             type="text"
//                             className="form-input"
//                             value={edu.passingYear || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].passingYear = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">Marks (%)</label>
//                         <input
//                             type="text"
//                             className="form-input"
//                             value={edu.marks || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].marks = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>
//                 </>
//             );
//         }

//         // Case 4: ITI
//         else if (educationName === 'ITI') {
//             return (
//                 <>
//                     {specializationsList[index] && specializationsList[index].length > 0 && (
//                         <div className="form-group">
//                             <label className="form-label">Specialization</label>
//                             <select
//                                 className="form-input"
//                                 value={edu.specialization || ''}
//                                 onChange={(e) => {
//                                     const updated = [...educations];
//                                     updated[index].specialization = e.target.value;
//                                     setEducations(updated);
//                                 }}
//                             >
//                                 <option value="">Select Specialization</option>
//                                 {specializationsList[index].map((spec) => (
//                                     <option key={spec._id} value={spec.name}>{spec.name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                     )}

//                     <div className="form-group">
//                         <label className="form-label">ITI Name</label>
//                         <input
//                             id={`iti-name-${index}`}
//                             type="text"
//                             className="form-input"
//                             value={edu.collegeName || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].collegeName = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">Passing Year</label>
//                         <input
//                             type="text"
//                             className="form-input"
//                             value={edu.passingYear || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].passingYear = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">Marks (%)</label>
//                         <input
//                             type="text"
//                             className="form-input"
//                             value={edu.marks || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].marks = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>
//                 </>
//             );
//         }

//         // Case 5: All other education types (like degree courses)
//         else if (educationName) {
//             return (
//                 <>
//                     {coursesList[index] && coursesList[index].length > 0 && (
//                         <div className="form-group">
//                             <label className="form-label">Course</label>
//                             <select
//                                 className="form-input"
//                                 value={edu.course || ''}
//                                 onChange={(e) => handleCourseChange(e, index)}
//                             >
//                                 <option value="">Select Course</option>
//                                 {coursesList[index].map((course) => (
//                                     <option key={course._id} value={course._id}>{course.name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                     )}

//                     {specializationsList[index] && specializationsList[index].length > 0 && (
//                         <div className="form-group">
//                             <label className="form-label">Specialization</label>
//                             <select
//                                 className="form-input"
//                                 value={edu.specialization || ''}
//                                 onChange={(e) => {
//                                     const updated = [...educations];
//                                     updated[index].specialization = e.target.value;
//                                     setEducations(updated);
//                                 }}
//                             >
//                                 <option value="">Select Specialization</option>
//                                 {specializationsList[index].map((spec) => (
//                                     <option key={spec._id} value={spec.name}>{spec.name}</option>
//                                 ))}
//                             </select>
//                         </div>
//                     )}

//                     <div className="form-group">
//                         <label className="form-label">University Name</label>
//                         <input
//                             id={`university-name-${index}`}
//                             type="text"
//                             className="form-input"
//                             placeholder="Search for university or board..."
//                             value={edu.universityName || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].universityName = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">College Name</label>
//                         <input
//                             type="text"
//                             id={`college-name-${index}`}
//                             className="form-input"
//                             value={edu.collegeName || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].collegeName = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">Passing Year</label>
//                         <input
//                             type="text"
//                             className="form-input"
//                             value={edu.passingYear || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].passingYear = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>

//                     <div className="form-group">
//                         <label className="form-label">Marks (%)</label>
//                         <input
//                             type="text"
//                             className="form-input"
//                             value={edu.marks || ''}
//                             onChange={(e) => {
//                                 const updated = [...educations];
//                                 updated[index].marks = e.target.value;
//                                 setEducations(updated);
//                             }}
//                         />
//                     </div>
//                 </>
//             );
//         }

//         return null;
//     };

//     return (
//         <div className="user-container">
//             {/* Step Progress Bar */}
//             <div className="step-progress-container">
//                 <div className="loader">
//                     <div
//                         className="bar"
//                         style={{
//                             width: currentStep === 1 ? '0%' :
//                                 currentStep === 2 ? '50%' : '100%'
//                         }}
//                     ></div>
//                     <div className="check-bar-container">
//                         <div></div>
//                         <div
//                             className={`check ${formData.basicDetails.completed ? 'completed' : currentStep === 1 ? 'active' : ''}`}
//                             onClick={() => goToStep(1)}
//                         >
//                             {formData.basicDetails.completed ? (
//                                 <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
//                                     <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
//                                 </svg>
//                             ) : (
//                                 <span>1</span>
//                             )}
//                         </div>
//                         <div
//                             className={`check ${formData.education.completed ? 'completed' : currentStep === 2 ? 'active' : ''}`}
//                             onClick={() => goToStep(2)}
//                         >
//                             {formData.education.completed ? (
//                                 <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
//                                     <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
//                                 </svg>
//                             ) : (
//                                 <span>2</span>
//                             )}
//                         </div>
//                         <div
//                             className={`check ${formData.lastStep.completed ? 'completed' : currentStep === 3 ? 'active' : ''}`}
//                             onClick={() => goToStep(3)}
//                         >
//                             {formData.lastStep.completed ? (
//                                 <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
//                                     <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
//                                 </svg>
//                             ) : (
//                                 <span>3</span>
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 <div className="step-labels">
//                     <div className={`step-label ${currentStep === 1 ? 'active' : ''}`}>Basic details</div>
//                     <div className={`step-label ${currentStep === 2 ? 'active' : ''}`}>Education</div>
//                     <div className={`step-label ${currentStep === 3 ? 'active' : ''}`}>Last step</div>
//                 </div>
//             </div>

//             {/* Form Content - changes based on current step */}
//             <div className="form-container">
//                 {currentStep === 1 && (
//                     <div className="step-content">
//                         <h2>Education details</h2>
//                         <p className="form-description">These details help recruiters identify your background</p>

//                         {educations.map((edu, index) => (
//                             <div className="education-item" key={`education-${index}`}>
//                                 {index > 0 && (
//                                     <div className="item-controls">
//                                         <button
//                                             className="remove-button"
//                                             onClick={() => {
//                                                 const updated = [...educations];
//                                                 updated.splice(index, 1);
//                                                 setEducations(updated);
//                                             }}
//                                         >
//                                             <i className="bi bi-trash"></i> Remove
//                                         </button>
//                                     </div>
//                                 )}

//                                 <div className="form-group">
//                                     <label className="form-label">Education Level <span className="required">*</span></label>
//                                     <select
//                                         className="form-input"
//                                         value={edu.education || ''}
//                                         onChange={(e) => handleEducationChange(e, index)}
//                                     >
//                                         <option value="">Select Education Level</option>
//                                         {Array.isArray(educationList) && educationList.map((e) => (
//                                             <option key={e._id} value={e._id}>{e.name}</option>
//                                         ))}

//                                     </select>
//                                 </div>

//                                 {/* Render additional fields based on selected education type */}
//                                 {renderEducationFields(edu, index)}

//                             </div>
//                         ))}

//                         <button
//                             className="add-button"
//                             onClick={() => setEducations([...educations, {}])}
//                         >
//                             + Add Education
//                         </button>

//                         <button className="continue-btn" onClick={handleContinue}>
//                             Save and continue
//                         </button>
//                     </div>
//                 )}

//                 {currentStep === 2 && (
//                     <div className="step-content">
//                         <h2>Education details</h2>
//                         <p className="form-description">These details help recruiters identify your background</p>

//                         {educations.map((edu, index) => (
//                             <div className="education-item" key={`education-${index}`}>
//                                 {index > 0 && (
//                                     <div className="item-controls">
//                                         <button
//                                             className="remove-button"
//                                             onClick={() => {
//                                                 const updated = [...educations];
//                                                 updated.splice(index, 1);
//                                                 setEducations(updated);
//                                             }}
//                                         >
//                                             <i className="bi bi-trash"></i> Remove
//                                         </button>
//                                     </div>
//                                 )}

//                                 <div className="form-group">
//                                     <label className="form-label">Education Level <span className="required">*</span></label>
//                                     <select
//                                         className="form-input"
//                                         value={edu.education || ''}
//                                         onChange={(e) => handleEducationChange(e, index)}
//                                     >
//                                         <option value="">Select Education Level</option>
//                                         {educationList.map((e) => (
//                                             <option key={e._id} value={e._id}>{e.name}</option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 {/* Render additional fields based on selected education type */}
//                                 {renderEducationFields(edu, index)}

//                             </div>
//                         ))}

//                         <button
//                             className="add-button"
//                             onClick={() => setEducations([...educations, {}])}
//                         >
//                             + Add Education
//                         </button>

//                         <button className="continue-btn" onClick={handleContinue}>
//                             Save and continue
//                         </button>
//                     </div>
//                 )}

//                 {currentStep === 3 && (
//                     <div className="step-content">
//                         <h2>Last step</h2>
//                         <p className="form-description">Almost done! Just a few more details...</p>

//                         {/* Last step form fields would go here */}
//                         <div className="form-group">
//                             <label className="form-label">Additional Information</label>
//                             <textarea
//                                 className="form-textarea"
//                                 placeholder="Any additional information you'd like to share"
//                             ></textarea>
//                         </div>

//                         <button className="continue-btn" onClick={handleContinue}>
//                             Complete
//                         </button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default User;


import React, { useState } from 'react';
import './User.css';

const User = () => {
    const [currentStep, setCurrentStep] = useState(1);
    
    // Static education options
    const educationList = [
        { _id: "1", name: "10th" },
        { _id: "2", name: "12th" },
        { _id: "3", name: "ITI" },
        { _id: "4", name: "Graduation/Diploma" },
        { _id: "5", name: "Masters/Post-Graduation" },
        { _id: "6", name: "Doctorate/PhD" }
    ];
    
    // Static courses and specializations for demo
    const sampleCourses = [
        { _id: "c1", name: "B.Tech" },
        { _id: "c2", name: "BCA" },
        { _id: "c3", name: "B.Sc" }
    ];
    
    const sampleSpecializations = [
        { _id: "s1", name: "Computer Science" },
        { _id: "s2", name: "Electronics" },
        { _id: "s3", name: "Mechanical" }
    ];

    const [educations, setEducations] = useState([{
        education: '',
        universityName: '',
        boardName: '',
        collegeName: '',
        schoolName: '',
        course: '',
        specialization: '',
        passingYear: '',
        marks: ''
    }]);

    const [formData, setFormData] = useState({
        basicDetails: { completed: false },
        education: { completed: false },
        lastStep: { completed: false }
    });
    
    // For board suggestions
    const [boardSuggestions, setBoardSuggestions] = useState([]);
    const [suggestionIndex, setSuggestionIndex] = useState(null);
    const [coursesList, setCoursesList] = useState({});
    const [specializationsList, setSpecializationsList] = useState({});

    // Handle education change
    const handleEducationChange = (e, index) => {
        const educationId = e.target.value;
        const updated = [...educations];
        updated[index].education = educationId;
        updated[index].course = '';
        updated[index].specialization = '';
        setEducations(updated);
        
        // Add some sample courses based on education
        if (educationId === "4" || educationId === "5") {
            setCoursesList(prev => ({
                ...prev,
                [index]: sampleCourses
            }));
        }
        
        // Handle ITI case
        if (educationId === "3") {
            setCoursesList(prev => ({
                ...prev,
                [index]: [{ _id: "iti1", name: "ITI Course" }]
            }));
            
            setSpecializationsList(prev => ({
                ...prev,
                [index]: [
                    { _id: "itispec1", name: "Electrician" },
                    { _id: "itispec2", name: "Plumber" },
                    { _id: "itispec3", name: "Mechanic" }
                ]
            }));
        }
    };
    
    // Handle course change
    const handleCourseChange = (e, index) => {
        const courseId = e.target.value;
        const updated = [...educations];
        updated[index].course = courseId;
        updated[index].specialization = '';
        setEducations(updated);
        
        // Show sample specializations
        setSpecializationsList(prev => ({
            ...prev,
            [index]: sampleSpecializations
        }));
    };
    
    // Handle board input change with static suggestions
    const handleBoardInputChange = (value, index) => {
        const updated = [...educations];
        updated[index].boardName = value;
        setEducations(updated);
        
        if (value.length >= 2) {
            // Static board suggestions
            setBoardSuggestions([
                { _id: "b1", name: "CBSE", type: "Central" },
                { _id: "b2", name: "ICSE", type: "Central" },
                { _id: "b3", name: "State Board", type: "State" }
            ]);
            setSuggestionIndex(index);
        } else {
            setBoardSuggestions([]);
        }
    };
    
    // Handle continue button click
    const handleContinue = () => {
        if (currentStep === 1) {
            // Set basic details as completed and move to next step
            setFormData({
                ...formData,
                basicDetails: { completed: true }
            });
            setCurrentStep(2);
        } else if (currentStep === 2) {
            // Validate education
            if (!educations[0].education) {
                alert('Please select your highest qualification');
                return;
            }
            
            setFormData({
                ...formData,
                education: { completed: true }
            });
            setCurrentStep(3);
        } else if (currentStep === 3) {
            // Complete the form
            setFormData({
                ...formData,
                lastStep: { completed: true }
            });
            alert('Form completed!');
        }
    };
    
    // Step navigation
    const goToStep = (stepNumber) => {
        if (stepNumber === 1 || 
            (stepNumber === 2 && formData.basicDetails.completed) ||
            (stepNumber === 3 && formData.education.completed)) {
            setCurrentStep(stepNumber);
        }
    };
    
    // Render education fields based on type
    const renderEducationFields = (edu, index) => {
        // Get education name based on selected ID
        const educationName = educationList.find(q => q._id === edu.education)?.name || '';

        // 10th Class
        if (educationName === '10th') {
            return (
                <>
                    <div className="form-group">
                        <label className="form-label">Board</label>
                        <div className="board-autocomplete-wrapper">
                            <input
                                type="text"
                                className="form-input"
                                value={edu.boardName || ''}
                                onChange={(e) => handleBoardInputChange(e.target.value, index)}
                            />
                            {suggestionIndex === index && boardSuggestions.length > 0 && (
                                <ul className="suggestion-list board-suggestion-list">
                                    {boardSuggestions.map((b) => (
                                        <li
                                            key={b._id}
                                            className='board-suggestion-item'
                                            onClick={() => {
                                                const updated = [...educations];
                                                updated[index].boardName = b.name;
                                                setEducations(updated);
                                                setBoardSuggestions([]);
                                                setSuggestionIndex(null);
                                            }}
                                        >
                                            {b.name} ({b.type})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">School Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.schoolName || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].schoolName = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Passing Year</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.passingYear || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].passingYear = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Marks (%)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.marks || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].marks = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>
                </>
            );
        }

        // 12th Class
        else if (educationName === '12th') {
            return (
                <>
                    <div className="form-group">
                        <label className="form-label">Board</label>
                        <div className="board-autocomplete-wrapper">
                            <input
                                type="text"
                                className="form-input"
                                value={edu.boardName || ''}
                                onChange={(e) => handleBoardInputChange(e.target.value, index)}
                            />
                            {suggestionIndex === index && boardSuggestions.length > 0 && (
                                <ul className="suggestion-list board-suggestion-list">
                                    {boardSuggestions.map((b) => (
                                        <li
                                            key={b._id}
                                            className='board-suggestion-item'
                                            onClick={() => {
                                                const updated = [...educations];
                                                updated[index].boardName = b.name;
                                                setEducations(updated);
                                                setBoardSuggestions([]);
                                                setSuggestionIndex(null);
                                            }}
                                        >
                                            {b.name} ({b.type})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Specialization</label>
                        <select
                            className="form-input"
                            value={edu.specialization || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].specialization = e.target.value;
                                setEducations(updated);
                            }}
                        >
                            <option value="">Select Specialization</option>
                            <option value="Science (PCM)">Science (PCM)</option>
                            <option value="Science (PCB)">Science (PCB)</option>
                            <option value="Science (PCMB)">Science (PCMB)</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Commerce with Maths">Commerce with Maths</option>
                            <option value="Arts/Humanities">Arts/Humanities</option>
                            <option value="Vocational">Vocational</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">School Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.schoolName || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].schoolName = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Passing Year</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.passingYear || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].passingYear = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Marks (%)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.marks || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].marks = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>
                </>
            );
        }

        // ITI
        else if (educationName === 'ITI') {
            return (
                <>
                    {specializationsList[index] && specializationsList[index].length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Specialization</label>
                            <select
                                className="form-input"
                                value={edu.specialization || ''}
                                onChange={(e) => {
                                    const updated = [...educations];
                                    updated[index].specialization = e.target.value;
                                    setEducations(updated);
                                }}
                            >
                                <option value="">Select Specialization</option>
                                {specializationsList[index].map((spec) => (
                                    <option key={spec._id} value={spec.name}>{spec.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">ITI Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.collegeName || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].collegeName = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Passing Year</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.passingYear || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].passingYear = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Marks (%)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.marks || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].marks = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>
                </>
            );
        }

        // Graduation, Masters, PhD
        else if (educationName === 'Graduation/Diploma' || educationName === 'Masters/Post-Graduation' || educationName === 'Doctorate/PhD') {
            return (
                <>
                    {coursesList[index] && coursesList[index].length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Course</label>
                            <select
                                className="form-input"
                                value={edu.course || ''}
                                onChange={(e) => handleCourseChange(e, index)}
                            >
                                <option value="">Select Course</option>
                                {coursesList[index].map((course) => (
                                    <option key={course._id} value={course._id}>{course.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {specializationsList[index] && specializationsList[index].length > 0 && (
                        <div className="form-group">
                            <label className="form-label">Specialization</label>
                            <select
                                className="form-input"
                                value={edu.specialization || ''}
                                onChange={(e) => {
                                    const updated = [...educations];
                                    updated[index].specialization = e.target.value;
                                    setEducations(updated);
                                }}
                            >
                                <option value="">Select Specialization</option>
                                {specializationsList[index].map((spec) => (
                                    <option key={spec._id} value={spec.name}>{spec.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">University Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter university name"
                            value={edu.universityName || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].universityName = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">College Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.collegeName || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].collegeName = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Passing Year</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.passingYear || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].passingYear = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Marks (%)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={edu.marks || ''}
                            onChange={(e) => {
                                const updated = [...educations];
                                updated[index].marks = e.target.value;
                                setEducations(updated);
                            }}
                        />
                    </div>
                </>
            );
        }

        return null;
    };

    return (
        <div className="user-container">
            {/* Step Progress Bar */}
            <div className="step-progress-container">
                <div className="loader">
                    <div
                        className="bar"
                        style={{
                            width: currentStep === 1 ? '0%' :
                                currentStep === 2 ? '50%' : '100%'
                        }}
                    ></div>
                    <div className="check-bar-container">
                        <div></div>
                        <div
                            className={`check ${formData.basicDetails.completed ? 'completed' : currentStep === 1 ? 'active' : ''}`}
                            onClick={() => goToStep(1)}
                        >
                            {formData.basicDetails.completed ? (
                                <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
                                    <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
                                </svg>
                            ) : (
                                <span>1</span>
                            )}
                        </div>
                        <div
                            className={`check ${formData.education.completed ? 'completed' : currentStep === 2 ? 'active' : ''}`}
                            onClick={() => goToStep(2)}
                        >
                            {formData.education.completed ? (
                                <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
                                    <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
                                </svg>
                            ) : (
                                <span>2</span>
                            )}
                        </div>
                        <div
                            className={`check ${formData.lastStep.completed ? 'completed' : currentStep === 3 ? 'active' : ''}`}
                            onClick={() => goToStep(3)}
                        >
                            {formData.lastStep.completed ? (
                                <svg stroke="white" strokeWidth="2" viewBox="0 0 24 24" fill="none">
                                    <path d="m4.5 12.75 6 6 9-13.5" strokeLinejoin="round" strokeLinecap="round"></path>
                                </svg>
                            ) : (
                                <span>3</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="step-labels">
                    <div className={`step-label ${currentStep === 1 ? 'active' : ''}`}>Basic details</div>
                    <div className={`step-label ${currentStep === 2 ? 'active' : ''}`}>Education</div>
                    <div className={`step-label ${currentStep === 3 ? 'active' : ''}`}>Last step</div>
                </div>
            </div>

            {/* Form Content */}
            <div className="form-container">
                {currentStep === 1 && (
                    <div className="step-content">
                        <h2>Basic details</h2>
                        <p className="form-description">Fill in your basic information</p>
                        
                        {/* Basic details form fields */}
                        <div className="form-group">
                            <label className="form-label">Full Name <span className="required">*</span></label>
                            <input type="text" className="form-input" placeholder="Enter your full name" />
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Email Address <span className="required">*</span></label>
                            <input type="email" className="form-input" placeholder="Enter your email" />
                        </div>
                        
                        <button className="continue-btn" onClick={handleContinue}>Continue</button>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="step-content">
                        <h2>Education details</h2>
                        <p className="form-description">These details help recruiters identify your background</p>
                        
                        {educations.map((edu, index) => (
                            <div className="education-item" key={`education-${index}`}>
                                {index > 0 && (
                                    <div className="item-controls">
                                        <button
                                            className="remove-button"
                                            onClick={() => {
                                                const updated = [...educations];
                                                updated.splice(index, 1);
                                                setEducations(updated);
                                            }}
                                        >
                                            <i className="bi bi-trash"></i> Remove
                                        </button>
                                    </div>
                                )}
                                
                                <div className="form-group">
                                    <label className="form-label">Education Level <span className="required">*</span></label>
                                    <select
                                        className="form-input"
                                        value={edu.education || ''}
                                        onChange={(e) => handleEducationChange(e, index)}
                                    >
                                        <option value="">Select Education Level</option>
                                        {educationList.map((e) => (
                                            <option key={e._id} value={e._id}>{e.name}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Render additional fields based on selected education type */}
                                {renderEducationFields(edu, index)}
                                
                            </div>
                        ))}
                        
                        <button
                            className="add-button"
                            onClick={() => setEducations([...educations, {}])}
                        >
                            + Add Education
                        </button>
                        
                        <button className="continue-btn" onClick={handleContinue}>
                            Save and continue
                        </button>
                    </div>
                )}
                
                {currentStep === 3 && (
                    <div className="step-content">
                        <h2>Last step</h2>
                        <p className="form-description">Almost done! Just a few more details...</p>
                        
                        {/* Last step form fields */}
                        <div className="form-group">
                            <label className="form-label">Additional Information</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Any additional information you'd like to share"
                            ></textarea>
                        </div>
                        
                        <button className="continue-btn" onClick={handleContinue}>
                            Complete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default User;