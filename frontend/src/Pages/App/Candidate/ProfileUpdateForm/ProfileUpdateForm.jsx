import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProfileUpdateForm = ({ courseId }) => {
  const [formData, setFormData] = useState({
    sex: '',
    dob: '',
    experience: '',
    highestQualification: '',
    state: '',
    city: '',
    pincode: '',
    place: '',
    latitude: '',
    longitude: '',
    address: '',
    whatsapp: '',
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [qualifications, setQualifications] = useState([]);

  useEffect(() => {
    axios.get('/candidate/completeProfile', {
      headers: { 'x-auth': localStorage.getItem('token') }
    }).then(res => {
      const formData = res.data.candidate;
      setFormData(prev => ({
        ...prev,
        sex: formData.sex || '',
        dob: formData.dob || '',
        experience: formData.totalExperience || '',
        highestQualification: formData.highestQualification || '',
        state: formData.state || '',
        city: formData.city || '',
        pincode: formData.pincode || '',
        place: formData.place || '',
        latitude: formData.latitude || '',
        longitude: formData.longitude || '',
        address: formData.address || '',
        whatsapp: formData.whatsapp || formData.mobile
      }));

      setStates(res.data.state);
      setCities(res.data.city);
      setQualifications(res.data.highestQualification);
    });
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const updateAndApply = () => {
    const body = {
      highestQualification: formData.highestQualification,
      personalInfo: {
        sex: formData.sex,
        state: formData.state,
        city: formData.city,
        pincode: formData.pincode,
        place: formData.place,
        longitude: formData.longitude,
        latitude: formData.latitude,
        whatsapp: formData.whatsapp,
        address: formData.address,
        dob: formData.dob,
      },
      totalExperience: formData.experience,
      isExperienced: formData.experience !== '0'
    };

    axios.post('/candidate/myprofile', body, {
      headers: { 'x-auth': localStorage.getItem('token') }
    }).then(() => {
      axios.post(`/candidate/course/${courseId}/apply`, {}, {
        headers: { 'x-auth': localStorage.getItem('token') }
      }).then(() => {
        window.location.reload();
      }).catch(() => window.location.reload());
    });
  };

  return (
    <div>
      <div className="col-xl-12 mb-1">
        <select className="form-control" id="sex" value={formData.sex} onChange={handleChange}>
          <option value="">Your Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
      <div className="col-xl-12 mb-1">
        <input type="date" className="form-control" id="dob" value={formData.dob} onChange={handleChange} />
      </div>
      <div className="col-xl-12 mb-1">
        <select className="form-control" id="experience" value={formData.experience} onChange={handleChange}>
          <option value="">Experience</option>
          <option value="0">Fresher</option>
          {[...Array(15)].map((_, i) => (
            <option key={i+1} value={i+1}>{i+1}</option>
          ))}
        </select>
      </div>
      <div className="col-xl-12 mb-1">
        <select className="form-control" id="highestQualification" value={formData.highestQualification} onChange={handleChange}>
          <option value="">Highest Qualification</option>
          {qualifications.map(q => <option key={q._id} value={q._id}>{q.name}</option>)}
        </select>
      </div>
      {/* Similarly add state, city, place, pincode inputs */}
      <div className="modal-footer">
        <button className="btn btn-primary" onClick={updateAndApply}>Update and Apply</button>
      </div>
    </div>
  );
};

export default ProfileUpdateForm;
