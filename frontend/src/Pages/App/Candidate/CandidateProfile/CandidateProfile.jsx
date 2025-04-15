import React, { useState, useEffect, useRef } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import axios from 'axios';

const CandidateProfile = () => {
  // State for audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // State for multi-step form
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    'Personal Information',
    'Qualifications',
    'Experience',
    'Skills',
    'Additional Information'
  ];

  // State for dynamic arrays
  const [skills, setSkills] = useState([{ skillName: '', skillPercent: 0 }]);
  const [certifications, setCertifications] = useState([{ certificateName: '', orgName: '', year: '' }]);
  const [languages, setLanguages] = useState([{ lname: '', level: 0 }]);
  const [projects, setProjects] = useState([{ projectName: '', proyear: '', proDescription: '' }]);
  const [interests, setInterests] = useState(['']);
  const [qualifications, setQualifications] = useState([{ 
    Qualification: '', 
    subQualification: '', 
    QualificationCourse: '', 
    College: '', 
    UniversityName: '',
    PassingYear: '',
    location: {
      city: '',
      state: '',
      fullAddress: ''
    }
  }]);
  const [experiences, setExperiences] = useState([{ 
    Industry_Name: '', 
    SubIndustry_Name: '', 
    Company_Name: '', 
    Company_State: '', 
    Company_City: '', 
    Comments: '', 
    FromDate: '', 
    ToDate: '' 
  }]);
  const [jobLocations, setJobLocations] = useState([{ state: '', city: '' }]);

  // Handle audio recording
  const startRecording = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.addEventListener('dataavailable', event => {
          audioChunksRef.current.push(event.data);
        });

        mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioURL(audioUrl);
          
          // Here you can upload the audio if you want
          // uploadAudio(audioBlob);
        });

        mediaRecorder.start();
        setIsRecording(true);
        
        // Start timer
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime(prevTime => prevTime + 1);
        }, 1000);
      })
      .catch(error => {
        console.error('Error accessing the microphone:', error);
      });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop timer
      clearInterval(timerRef.current);
    }
  };

  const uploadAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.mp3');
    
    try {
      const response = await axios.post('/api/upload-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.url) {
        formik.setFieldValue('personalInfo.profilevideo', response.data.url);
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  // Formik setup
  const validationSchema = Yup.object({
    personalInfo: Yup.object({
      name: Yup.string().required('Name is required'),
      mobile: Yup.number().required('Mobile number is required'),
      email: Yup.string().email('Invalid email format').required('Email is required'),
      // Add more validations for other fields
    }),
    // Add more validations for other sections
  });

  const formik = useFormik({
    initialValues: {
      personalInfo: {
        name: '',
        mobile: '',
        email: '',
        place: '',
        profilevideo: '',
        sex: '',
        dob: '',
        whatsapp: '',
        resume: '',
        linkedInUrl: '',
        facebookUrl: '',
        twitterUrl: '',
        professionalTitle: '',
        professionalSummary: '',
        location: {
          latitude: '',
          longitude: '',
          city: '',
          state: '',
          fullAddress: ''
        },
        image: '',
        declaration: {
          isChecked: false
        }
      },
      qualifications: [],
      experiences: [],
      isExperienced: false,
      highestQualification: '',
      isProfileCompleted: false
    },
    validationSchema,
    onSubmit: async (values) => {
      // Add dynamic arrays to the form values
      values.personalInfo.skill = skills;
      values.personalInfo.certification = certifications;
      values.personalInfo.language = languages;
      values.personalInfo.projects = projects;
      values.personalInfo.interest = interests;
      values.personalInfo.jobLocationPreferences = jobLocations;
      values.qualifications = qualifications;
      values.experiences = experiences;
      
      try {
        const response = await axios.post('/api/candidate/profile', values);
        alert('Profile saved successfully!');
        console.log(response.data);
      } catch (error) {
        alert('Error saving profile');
        console.error('Error:', error);
      }
    },
  });

  // Handle next and previous steps
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  // Form sections based on active step
  const renderFormSection = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="personalInfo.name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.personalInfo?.name && formik.errors.personalInfo?.name ? (
                  <div className="text-red-500">{formik.errors.personalInfo.name}</div>
                ) : null}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="email"
                  name="personalInfo.email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.personalInfo?.email && formik.errors.personalInfo?.email ? (
                  <div className="text-red-500">{formik.errors.personalInfo.email}</div>
                ) : null}
              </div>

              <div className="form-group">
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <input
                  type="text"
                  id="mobile"
                  name="personalInfo.mobile"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.mobile}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.personalInfo?.mobile && formik.errors.personalInfo?.mobile ? (
                  <div className="text-red-500">{formik.errors.personalInfo.mobile}</div>
                ) : null}
              </div>

              <div className="form-group">
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                <input
                  type="text"
                  id="whatsapp"
                  name="personalInfo.whatsapp"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.whatsapp}
                  onChange={formik.handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  id="sex"
                  name="personalInfo.sex"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.sex}
                  onChange={formik.handleChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  id="dob"
                  name="personalInfo.dob"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.dob}
                  onChange={formik.handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="place" className="block text-sm font-medium text-gray-700">Place</label>
                <input
                  type="text"
                  id="place"
                  name="personalInfo.place"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.place}
                  onChange={formik.handleChange}
                />
              </div>

              <div className="form-group col-span-2">
                <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700">Full Address</label>
                <textarea
                  id="fullAddress"
                  name="personalInfo.location.fullAddress"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.location.fullAddress}
                  onChange={formik.handleChange}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  id="city"
                  name="personalInfo.location.city"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.location.city}
                  onChange={formik.handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  id="state"
                  name="personalInfo.location.state"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.location.state}
                  onChange={formik.handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="professionalTitle" className="block text-sm font-medium text-gray-700">Professional Title</label>
                <input
                  type="text"
                  id="professionalTitle"
                  name="personalInfo.professionalTitle"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.professionalTitle}
                  onChange={formik.handleChange}
                  placeholder="e.g. Senior Software Developer"
                />
              </div>

              <div className="form-group col-span-2">
                <label htmlFor="professionalSummary" className="block text-sm font-medium text-gray-700">Professional Summary</label>
                <textarea
                  id="professionalSummary"
                  name="personalInfo.professionalSummary"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.professionalSummary}
                  onChange={formik.handleChange}
                  rows="4"
                  placeholder="Brief summary about your professional background"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="linkedInUrl" className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
                <input
                  type="text"
                  id="linkedInUrl"
                  name="personalInfo.linkedInUrl"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.linkedInUrl}
                  onChange={formik.handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="facebookUrl" className="block text-sm font-medium text-gray-700">Facebook URL</label>
                <input
                  type="text"
                  id="facebookUrl"
                  name="personalInfo.facebookUrl"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.facebookUrl}
                  onChange={formik.handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="twitterUrl" className="block text-sm font-medium text-gray-700">Twitter URL</label>
                <input
                  type="text"
                  id="twitterUrl"
                  name="personalInfo.twitterUrl"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={formik.values.personalInfo.twitterUrl}
                  onChange={formik.handleChange}
                />
              </div>
                
              <div className="form-group col-span-2">
                <label htmlFor="resume" className="block text-sm font-medium text-gray-700">Upload Resume</label>
                <input
                  type="file"
                  id="resume"
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                  onChange={(event) => {
                    // Here you would handle file upload to a server
                    // and set the returned URL to formik.values.personalInfo.resume
                  }}
                  accept=".pdf,.doc,.docx"
                />
              </div>

              <div className="form-group col-span-2">
                <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">Profile Image</label>
                <input
                  type="file"
                  id="profileImage"
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                  onChange={(event) => {
                    // Here you would handle file upload to a server
                    // and set the returned URL to formik.values.personalInfo.image
                  }}
                  accept="image/*"
                />
              </div>

              <div className="form-group col-span-2 mt-6">
                <label className="block text-lg font-medium text-gray-700 mb-2">Profile Video/Audio</label>
                
                <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md ${isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    <div className="flex items-center">
                      {isRecording ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          Start Recording
                        </>
                      )}
                    </div>
                  </button>
                  
                  {isRecording && (
                    <div className="flex items-center text-red-600">
                      <span className="animate-pulse">●</span>
                      <span className="ml-2">Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}
                </div>
                
                {audioURL && (
                  <div className="mt-4">
                    <audio controls src={audioURL} className="w-full"></audio>
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-700 mt-6 mb-3">Preferred Job Locations</h3>
            
            {jobLocations.map((location, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded mb-4">
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={location.state}
                    onChange={(e) => {
                      const newLocations = [...jobLocations];
                      newLocations[index].state = e.target.value;
                      setJobLocations(newLocations);
                    }}
                  >
                    <option value="">Select State</option>
                    {/* Add states from API */}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={location.city}
                    onChange={(e) => {
                      const newLocations = [...jobLocations];
                      newLocations[index].city = e.target.value;
                      setJobLocations(newLocations);
                    }}
                  >
                    <option value="">Select City</option>
                    {/* Add cities from API based on selected state */}
                  </select>
                </div>
                
                <div className="col-span-2 flex justify-end">
                  {jobLocations.length > 1 && (
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => {
                        setJobLocations(jobLocations.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800"
              onClick={() => setJobLocations([...jobLocations, { state: '', city: '' }])}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Another Location
            </button>

            <div className="form-group mt-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="declaration"
                    name="personalInfo.declaration.isChecked"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={formik.values.personalInfo.declaration.isChecked}
                    onChange={formik.handleChange}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="declaration" className="font-medium text-gray-700">Declaration</label>
                  <p className="text-gray-500">I hereby declare that all the information provided above is true to the best of my knowledge.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Qualifications</h2>
            
            {qualifications.map((qualification, index) => (
              <div key={index} className="p-4 border rounded mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">Qualification</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={qualification.Qualification}
                      onChange={(e) => {
                        const newQualifications = [...qualifications];
                        newQualifications[index].Qualification = e.target.value;
                        setQualifications(newQualifications);
                      }}
                    >
                      <option value="">Select Qualification</option>
                      {/* Add qualifications from API */}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">Sub Qualification</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={qualification.subQualification}
                      onChange={(e) => {
                        const newQualifications = [...qualifications];
                        newQualifications[index].subQualification = e.target.value;
                        setQualifications(newQualifications);
                      }}
                    >
                      <option value="">Select Sub Qualification</option>
                      {/* Add sub qualifications from API based on selected qualification */}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">Course</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={qualification.QualificationCourse}
                      onChange={(e) => {
                        const newQualifications = [...qualifications];
                        newQualifications[index].QualificationCourse = e.target.value;
                        setQualifications(newQualifications);
                      }}
                    >
                      <option value="">Select Course</option>
                      {/* Add courses from API based on selected sub qualification */}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">College/Institute</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={qualification.College}
                      onChange={(e) => {
                        const newQualifications = [...qualifications];
                        newQualifications[index].College = e.target.value;
                        setQualifications(newQualifications);
                      }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">University</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={qualification.UniversityName}
                      onChange={(e) => {
                        const newQualifications = [...qualifications];
                        newQualifications[index].UniversityName = e.target.value;
                        setQualifications(newQualifications);
                      }}
                    >
                      <option value="">Select University</option>
                      {/* Add universities from API */}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">Passing Year</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={qualification.PassingYear}
                      onChange={(e) => {
                        const newQualifications = [...qualifications];
                        newQualifications[index].PassingYear = e.target.value;
                        setQualifications(newQualifications);
                      }}
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={qualification.location.city}
                      onChange={(e) => {
                        const newQualifications = [...qualifications];
                        newQualifications[index].location.city = e.target.value;
                        setQualifications(newQualifications);
                      }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={qualification.location.state}
                      onChange={(e) => {
                        const newQualifications = [...qualifications];
                        newQualifications[index].location.state = e.target.value;
                        setQualifications(newQualifications);
                      }}
                    />
                  </div>
                  
                  <div className="form-group col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={qualification.location.fullAddress}
                      onChange={(e) => {
                        const newQualifications = [...qualifications];
                        newQualifications[index].location.fullAddress = e.target.value;
                        setQualifications(newQualifications);
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  {qualifications.length > 1 && (
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => {
                        setQualifications(qualifications.filter((_, i) => i !== index));
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button
              type="button"
              className="flex items-center text-indigo-600 hover:text-indigo-800"
              onClick={() => setQualifications([...qualifications, { 
                Qualification: '', 
                subQualification: '', 
                QualificationCourse: '', 
                College: '', 
                UniversityName: '',
                PassingYear: '',
                location: {
                  city: '',
                  state: '',
                  fullAddress: ''
                }
              }])}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Another Qualification
            </button>
            
            <div className="mt-6">
              <div className="flex items-center">
                <input
                  id="isExperienced"
                  name="isExperienced"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={formik.values.isExperienced}
                  onChange={(e) => {
                    formik.setFieldValue('isExperienced', e.target.checked);
                  }}
                />
                <label htmlFor="isExperienced" className="ml-2 block text-sm font-medium text-gray-700">
                  I have work experience
                </label>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Experience</h2>
            
            {!formik.values.isExperienced ? (
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-yellow-700">You have indicated that you don't have any work experience. You can skip this section or go back and check "I have work experience" if you want to add experience details.</p>
              </div>
            ) : (
              <>
                {experiences.map((experience, index) => (
                  <div key={index} className="p-4 border rounded mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700">Industry</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          value={experience.Industry_Name}
                          onChange={(e) => {
                            const newExperiences = [...experiences];
                            newExperiences[index].Industry_Name = e.target.value;
                            setExperiences(newExperiences);
                          }}
                        >
                          <option value="">Select Industry</option>
                          {/* Add industries from API */}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700">Sub Industry</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          value={experience.SubIndustry_Name}
                          onChange={(e) => {
                            const newExperiences = [...experiences];
                            newExperiences[index].SubIndustry_Name = e.target.value;
                            setExperiences(newExperiences);
                          }}
                        >
                          <option value="">Select Sub Industry</option>
                          {/* Add sub industries from API based on selected industry */}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          value={experience.Company_Name}
                          onChange={(e) => {
                            const newExperiences = [...experiences];
                            newExperiences[index].Company_Name = e.target.value;
                            setExperiences(newExperiences);
                          }}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          value={experience.Company_State}
                          onChange={(e) => {
                            const newExperiences = [...experiences];
                            newExperiences[index].Company_State = e.target.value;
                            setExperiences(newExperiences);
                          }}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          value={experience.Company_City}
                          onChange={(e) => {
                            const newExperiences = [...experiences];
                            newExperiences[index].Company_City = e.target.value;
                            setExperiences(newExperiences);
                          }}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700">From Date</label>
                        <input
                          type="month"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          value={experience.FromDate}
                          onChange={(e) => {
                            const newExperiences = [...experiences];
                            newExperiences[index].FromDate = e.target.value;
                            setExperiences(newExperiences);
                          }}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700">To Date</label>
                        <input
                          type="month"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          value={experience.ToDate}
                          onChange={(e) => {
                            const newExperiences = [...experiences];
                            newExperiences[index].ToDate = e.target.value;
                            setExperiences(newExperiences);
                          }}
                        />
                      </div>
                      
                      <div className="form-group col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Comments</label>
                        <textarea
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          rows="3"
                          value={experience.Comments}
                          onChange={(e) => {
                            const newExperiences = [...experiences];
                            newExperiences[index].Comments = e.target.value;
                            setExperiences(newExperiences);
                          }}
                          placeholder="Describe your responsibilities and achievements"
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      {experiences.length > 1 && (
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => {
                            setExperiences(experiences.filter((_, i) => i !== index));
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="flex items-center text-indigo-600 hover:text-indigo-800"
                  onClick={() => setExperiences([...experiences, { 
                    Industry_Name: '', 
                    SubIndustry_Name: '', 
                    Company_Name: '', 
                    Company_State: '', 
                    Company_City: '', 
                    Comments: '', 
                    FromDate: '', 
                    ToDate: '' 
                  }])}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add Another Experience
                </button>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Skills</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Skills</h3>
              
              {skills.map((skill, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center mb-3">
                  <div className="md:col-span-3 form-group">
                    <label className="block text-sm font-medium text-gray-700">Skill Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={skill.skillName}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[index].skillName = e.target.value;
                        setSkills(newSkills);
                      }}
                    />
                  </div>
                  
                  <div className="md:col-span-2 form-group">
                    <label className="block text-sm font-medium text-gray-700">Proficiency (%)</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      className="mt-1 block w-full"
                      value={skill.skillPercent}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[index].skillPercent = parseInt(e.target.value);
                        setSkills(newSkills);
                      }}
                    />
                    <div className="text-center mt-1">{skill.skillPercent}%</div>
                  </div>
                  
                  <div className="flex justify-end items-end h-full">
                    {skills.length > 1 && (
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 mt-6"
                        onClick={() => {
                          setSkills(skills.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
                onClick={() => setSkills([...skills, { skillName: '', skillPercent: 0 }])}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Another Skill
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Certifications</h3>
              
              {certifications.map((certification, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 border rounded mb-3">
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">Certificate Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={certification.certificateName}
                      onChange={(e) => {
                        const newCertifications = [...certifications];
                        newCertifications[index].certificateName = e.target.value;
                        setCertifications(newCertifications);
                      }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={certification.orgName}
                      onChange={(e) => {
                        const newCertifications = [...certifications];
                        newCertifications[index].orgName = e.target.value;
                        setCertifications(newCertifications);
                      }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={certification.year}
                      onChange={(e) => {
                        const newCertifications = [...certifications];
                        newCertifications[index].year = e.target.value;
                        setCertifications(newCertifications);
                      }}
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year.toString()}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-3 flex justify-end">
                    {certifications.length > 1 && (
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          setCertifications(certifications.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
                onClick={() => setCertifications([...certifications, { certificateName: '', orgName: '', year: '' }])}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Another Certification
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Languages</h3>
              
              {languages.map((language, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center mb-3">
                  <div className="md:col-span-3 form-group">
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={language.lname}
                      onChange={(e) => {
                        const newLanguages = [...languages];
                        newLanguages[index].lname = e.target.value;
                        setLanguages(newLanguages);
                      }}
                    />
                  </div>
                  
                  <div className="md:col-span-2 form-group">
                    <label className="block text-sm font-medium text-gray-700">Proficiency Level</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={language.level}
                      onChange={(e) => {
                        const newLanguages = [...languages];
                        newLanguages[index].level = parseInt(e.target.value);
                        setLanguages(newLanguages);
                      }}
                    >
                      <option value="1">Beginner</option>
                      <option value="2">Intermediate</option>
                      <option value="3">Advanced</option>
                      <option value="4">Fluent</option>
                      <option value="5">Native</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end items-end h-full">
                    {languages.length > 1 && (
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          setLanguages(languages.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
                onClick={() => setLanguages([...languages, { lname: '', level: 1 }])}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Another Language
              </button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Additional Information</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Projects</h3>
              
              {projects.map((project, index) => (
                <div key={index} className="p-3 border rounded mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700">Project Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={project.projectName}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].projectName = e.target.value;
                          setProjects(newProjects);
                        }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700">Year</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={project.proyear}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].proyear = parseInt(e.target.value);
                          setProjects(newProjects);
                        }}
                      >
                        <option value="">Select Year</option>
                        {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        rows="3"
                        value={project.proDescription}
                        onChange={(e) => {
                          const newProjects = [...projects];
                          newProjects[index].proDescription = e.target.value;
                          setProjects(newProjects);
                        }}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-2">
                    {projects.length > 1 && (
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          setProjects(projects.filter((_, i) => i !== index));
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
                onClick={() => setProjects([...projects, { projectName: '', proyear: '', proDescription: '' }])}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Another Project
              </button>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Interests</h3>
              
              {interests.map((interest, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={interest}
                    onChange={(e) => {
                      const newInterests = [...interests];
                      newInterests[index] = e.target.value;
                      setInterests(newInterests);
                    }}
                    placeholder="e.g. Reading, Playing Guitar, Traveling"
                  />
                  
                  {interests.length > 1 && (
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => {
                        setInterests(interests.filter((_, i) => i !== index));
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                className="flex items-center text-indigo-600 hover:text-indigo-800 mt-2"
                onClick={() => setInterests([...interests, ''])}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Another Interest
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">Candidate Profile</h1>
      
      <div className="mb-6">
        <div className="flex overflow-x-auto">
          <div className="flex space-x-4 p-2">
            {steps.map((step, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  activeStep === index 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setActiveStep(index)}
              >
                {index + 1}. {step}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <form onSubmit={formik.handleSubmit}>
        {renderFormSection()}
        
        <div className="flex justify-between mt-6">
          {activeStep > 0 && (
            <button
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg"
              onClick={handleBack}
            >
              Previous
            </button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <button
              type="button"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg ml-auto"
              onClick={handleNext}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg ml-auto"
            >
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CandidateProfile;