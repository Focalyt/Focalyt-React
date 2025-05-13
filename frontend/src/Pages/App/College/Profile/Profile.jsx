import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  
  const [college, setCollege] = useState({
    name: '',
    stateId: '',
    cityId: '',
    place: '',
    _university: '',
    website: '',
    linkedin: '',
    facebook: '',
    zipcode: '',
    address: '',
    description: '',
    logo: '',
    _concernPerson: {
      name: '',
      designation: '',
      email: '',
      mobile: ''
    },
    collegeRepresentatives: [{
      name: '',
      designation: '',
      email: '',
      mobile: ''
    }]
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch initial data
    fetchProfileData();
    // fetchStates();
    // fetchUniversities();
    initializeGoogleMaps();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/profile`, {
        headers: { 'x-auth': localStorage.getItem('token') }
      });
      if (response.data && response.data.college) {
        setCollege(response.data.college);
        if (response.data.college.stateId) {
          fetchCities(response.data.college.stateId);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

//   const fetchStates = async () => {
//     try {
//       const response = await axios.get(`${backendUrl}/states`, {
//         headers: { 'x-auth': localStorage.getItem('token') }
//       });
//       setStates(response.data || []);
//     } catch (error) {
//       console.error('Error fetching states:', error);
//     }
//   };


  

  const fetchCities = async (stateId) => {
    try {
      const response = await axios.get(`${backendUrl}/company/getcitiesbyId`, {
        params: { stateId },
        headers: { 'x-auth': localStorage.getItem('token') }
      });
      setCities(response.data?.cityValues || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

//   const fetchUniversities = async () => {
//     try {
//       const response = await axios.get(`${backendUrl}/universities`, {
//         headers: { 'x-auth': localStorage.getItem('token') }
//       });
//       setUniversities(response.data || []);
//     } catch (error) {
//       console.error('Error fetching universities:', error);
//     }
//   };

  const initializeGoogleMaps = () => {
    if (window.google) {
      const input = document.getElementById('work-loc');
      const options = {
        componentRestrictions: { country: "in" },
        types: ["establishment"]
      };
      
      const autocomplete = new window.google.maps.places.Autocomplete(input, options);
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        setCollege(prev => ({
          ...prev,
          place: input.value,
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        }));
      });
    }
  };

  const handleInputChange = (e, section, index = null) => {
    const { name, value } = e.target;
    
    if (section === 'college') {
      setCollege(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (section === 'concernPerson') {
      setCollege(prev => ({
        ...prev,
        _concernPerson: {
          ...prev._concernPerson,
          [name]: value
        }
      }));
    } else if (section === 'representative' && index !== null) {
      const updatedRepresentatives = [...college.collegeRepresentatives];
      updatedRepresentatives[index] = {
        ...updatedRepresentatives[index],
        [name]: value
      };
      setCollege(prev => ({
        ...prev,
        collegeRepresentatives: updatedRepresentatives
      }));
    }
  };

  const handleStateChange = async (e) => {
    const stateId = e.target.value;
    setCollege(prev => ({
      ...prev,
      stateId,
      cityId: '' // Reset city when state changes
    }));
    if (stateId) {
      fetchCities(stateId);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!checkImageValidation(file.type) || !checkImageSize(file.size)) {
      alert("This format not accepted and each image should be 2MB");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/uploadSingleFile', formData, {
        headers: { 
          'x-auth': localStorage.getItem('token'),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.status) {
        setCollege(prev => ({
          ...prev,
          logo: response.data.data.Key
        }));
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await axios.post('/api/deleteSingleFile', { key: college.logo }, {
        headers: { 'x-auth': localStorage.getItem('token') }
      });
      
      await axios.post(`${backendUrl}/company/removelogo`, { key: college.logo });
      
      setCollege(prev => ({
        ...prev,
        logo: ''
      }));
    } catch (error) {
      console.error('Error removing logo:', error);
    }
  };

  const addRepresentative = () => {
    setCollege(prev => ({
      ...prev,
      collegeRepresentatives: [
        ...prev.collegeRepresentatives,
        { name: '', designation: '', email: '', mobile: '' }
      ]
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!college.name.trim()) errors.collegeName = true;
    if (!college.stateId) errors.state = true;
    if (!college.cityId) errors.city = true;
    if (!college._university) errors.university = true;
    if (!college.place) errors.workLocation = true;
    if (!college._concernPerson.name.trim()) errors.concernName = true;
    if (!college._concernPerson.designation.trim()) errors.concernDesignation = true;
    if (!checkEmail(college._concernPerson.email)) errors.concernEmail = true;
    if (!checkMobile(college._concernPerson.mobile)) errors.concernMobile = true;

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const body = {
        concernedPerson: college._concernPerson,
        collegeInfo: {
          name: college.name,
          stateId: college.stateId,
          cityId: college.cityId,
          place: college.place,
          latitude: college.latitude,
          longitude: college.longitude,
          _university: college._university,
          website: college.website,
          linkedin: college.linkedin,
          facebook: college.facebook,
          zipcode: college.zipcode,
          address: college.address,
          description: college.description,
          logo: college.logo
        },
        representativeInfo: college.collegeRepresentatives.filter(rep => 
          rep.name || rep.designation || rep.email || rep.mobile
        )
      };

      await axios.post(`${backendUrl}/college/myprofile`, body, {
        headers: { 'x-auth': localStorage.getItem('token') }
      });

      window.location.href = "/college/myprofile";
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEmail = (email) => {
    if (!email) return false;
    const emailReg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
    return emailReg.test(email);
  };

  const checkMobile = (number) => {
    return number.length === 10 && !isNaN(number);
  };

  const checkImageSize = (size) => {
    const finalSize = (size / 1024) / 1024;
    return finalSize <= 2;
  };

  const checkImageValidation = (type) => {
    const regex = /(\/jpg|\/jpeg|\/png)$/i;
    return regex.test(type);
  };

  return (
    <>
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">Your Profile</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="#">Your Profile</a>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* College Information Section */}
        <section id="college-info">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">College Information</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>College Name<span className="mandatory"> *</span></label>
                        <input
                          type="text"
                          name="name"
                          className={`form-control ${errors.collegeName ? 'error' : ''}`}
                          value={college.name}
                          onChange={(e) => handleInputChange(e, 'college')}
                          maxLength="30"
                          required
                        />
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>State <span className="mandatory"> *</span></label>
                        <select
                          className={`form-control ${errors.state ? 'error' : ''}`}
                          name="stateId"
                          value={college.stateId}
                          onChange={handleStateChange}
                        >
                          <option value="">Select Option</option>
                          {states.map((state) => (
                            <option key={state._id} value={state._id} className="text-capitalize">
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>City <span className="mandatory"> *</span></label>
                        <select
                          className={`form-control ${errors.city ? 'error' : ''}`}
                          name="cityId"
                          value={college.cityId}
                          onChange={(e) => handleInputChange(e, 'college')}
                        >
                          <option value="">Select City</option>
                          {cities.map((city) => (
                            <option key={city._id} value={city._id} className="text-capitalize">
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label htmlFor="work-loc">Work Location<span className="mandatory"> *</span></label>
                        <div className="input-group mb-2">
                          <div className="input-group-prepend bg-locat">
                            <div className="input-group-text bg-intext">
                              <img src="/Assets/images/isist.png" id="siteforcomp" alt="location" />
                            </div>
                          </div>
                          <input
                            type="text"
                            className={`form-control ${errors.workLocation ? 'error' : ''}`}
                            id="work-loc"
                            value={college.place}
                            onChange={(e) => handleInputChange(e, 'college', null, 'place')}
                          />
                        </div>
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>University <span className="mandatory"> *</span></label>
                        <select
                          className={`form-control ${errors.university ? 'error' : ''}`}
                          name="_university"
                          value={college._university}
                          onChange={(e) => handleInputChange(e, 'college')}
                        >
                          <option value="">Select Option</option>
                          {universities.map((university) => (
                            <option key={university._id} value={university._id} className="text-capitalize">
                              {university.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Website</label>
                        <input
                          type="text"
                          name="website"
                          className="form-control"
                          value={college.website}
                          onChange={(e) => handleInputChange(e, 'college')}
                          maxLength="100"
                        />
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Linkedin URL</label>
                        <input
                          type="text"
                          name="linkedin"
                          className="form-control"
                          value={college.linkedin}
                          onChange={(e) => handleInputChange(e, 'college')}
                        />
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Facebook</label>
                        <input
                          type="text"
                          name="facebook"
                          className="form-control"
                          value={college.facebook}
                          onChange={(e) => handleInputChange(e, 'college')}
                          maxLength="100"
                        />
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Zipcode</label>
                        <input
                          type="number"
                          name="zipcode"
                          className="form-control"
                          value={college.zipcode}
                          onChange={(e) => handleInputChange(e, 'college')}
                          maxLength="6"
                        />
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Address</label>
                        <textarea
                          className="form-control"
                          name="address"
                          value={college.address}
                          onChange={(e) => handleInputChange(e, 'college')}
                          maxLength="150"
                          rows="3"
                        ></textarea>
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Description</label>
                        <textarea
                          className="form-control"
                          name="description"
                          value={college.description}
                          onChange={(e) => handleInputChange(e, 'college')}
                          maxLength="500"
                          rows="3"
                        ></textarea>
                      </div>

                      <div className="col-xl-1 col-lg-1 col-md-6 mb-0 mt-2" style={{ alignSelf: 'center' }}>
                        <div className="image-upload">
                          {college.logo ? (
                            <>
                              <label htmlFor="uploadlogo" style={{ cursor: 'pointer' }}>
                                <img
                                  src={`${bucketUrl}/${college.logo}`}
                                  className="pointer companylogo"
                                  height="auto"
                                  width="60"
                                  alt="College Logo"
                                />
                              </label>
                              <i
                                className="feather icon-x remove_uploaded_pic pointer"
                                style={{ color: 'red' }}
                                onClick={handleRemoveLogo}
                              ></i>
                              College Logo
                            </>
                          ) : (
                            <>
                              <label htmlFor="uploadlogo" style={{ cursor: 'pointer', alignSelf: 'center' }}>
                                <img
                                  className="custom-cursor-pointer default"
                                  src="/Assets/images/add_receipt.png"
                                  width="60"
                                  height="auto"
                                  alt="Upload logo"
                                />
                              </label>
                              <p className="mt-1 custom-cursor-pointer">
                                <label>Upload logo</label>
                              </p>
                            </>
                          )}
                          <input
                            id="uploadlogo"
                            type="file"
                            className="my-logo-uploader form-control"
                            style={{ display: 'none' }}
                            onChange={handleLogoUpload}
                            accept="image/jpeg,image/png,image/jpg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Concerned Person Section */}
        <section id="Concerned-Person">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Concerned Person</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Name <span className="mandatory"> *</span></label>
                        <input
                          type="text"
                          name="name"
                          className={`form-control ${errors.concernName ? 'error' : ''}`}
                          value={college._concernPerson ? college._concernPerson.name : ''}
                          onChange={(e) => handleInputChange(e, 'concernPerson')}
                          maxLength="25"
                          required
                        />
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Designation<span className="mandatory"> *</span></label>
                        <input
                          type="text"
                          name="designation"
                          className={`form-control ${errors.concernDesignation ? 'error' : ''}`}
                          value={college._concernPerson?.designation || ''}
                          onChange={(e) => handleInputChange(e, 'concernPerson')}
                          maxLength="25"
                        />
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Email<span className="mandatory"> *</span></label>
                        <input
                          type="email"
                          name="email"
                          className={`form-control ${errors.concernEmail ? 'error' : ''}`}
                          value={college._concernPerson?.email || ''}
                          onChange={(e) => handleInputChange(e, 'concernPerson')}
                          maxLength="30"
                          required
                        />
                      </div>

                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-1">
                        <label>Contact Number<span className="mandatory"> *</span></label>
                        <input
                          type="number"
                          name="mobile"
                          className={`form-control ${errors.concernMobile ? 'error' : ''}`}
                          value={college._concernPerson?.mobile || ''}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* College Representative Section */}
        <section id="representativeinfo">
          <div className="row">
            <div className="col-xl-12 col-lg-12">
              <div className="card">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">College Representative</h4>
                </div>
                <div className="card-content">
                  <div className="card-body">
                    <div id="representativeList">
                      {college.collegeRepresentatives.map((rep, index) => (
                        <div className="row representativerow" key={index}>
                          <div className="col-xl-2 mb-1">
                            <label>Name</label>
                            <input
                              className="form-control"
                              type="text"
                              name="name"
                              value={rep.name}
                              onChange={(e) => handleInputChange(e, 'representative', index)}
                              maxLength="25"
                            />
                          </div>
                          <div className="col-xl-2 mb-1">
                            <label>Designation</label>
                            <input
                              className="form-control"
                              type="text"
                              name="designation"
                              value={rep.designation}
                              onChange={(e) => handleInputChange(e, 'representative', index)}
                              maxLength="25"
                            />
                          </div>
                          <div className="col-xl-2 mb-1">
                            <label>Email</label>
                            <input
                              className="form-control"
                              type="email"
                              name="email"
                              value={rep.email}
                              onChange={(e) => handleInputChange(e, 'representative', index)}
                              maxLength="30"
                            />
                          </div>
                          <div className="col-xl-2 mb-1">
                            <label>Contact Number</label>
                            <input
                              className="form-control"
                              type="text"
                              name="mobile"
                              value={rep.mobile}
                              onChange={(e) => handleInputChange(e, 'representative', index)}
                              maxLength="10"
                            />
                          </div>
                          {index === 0 && (
                            <div className="col-xl-2 my-auto">
                              <button
                                className="btn btn-success text-white"
                                onClick={addRepresentative}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="row">
                      <div className="col-xl-12 text-right">
                        <button
                          className="btn btn-danger"
                          onClick={() => window.location.href = "/college/myprofile"}
                        >
                          Reset
                        </button>
                        <button
                          className="btn btn-success text-white ml-2"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>

                    {errors.message && (
                      <div className="row">
                        <div className="col-xl-12">
                          <div className="text-danger mt-2">
                            {errors.message}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      
    </>
  );
};

export default Profile;