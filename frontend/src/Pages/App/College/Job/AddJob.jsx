import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Choices from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';
import { resolveMediaUrl } from '../../../../utils/resolveMediaUrl';

const BENEFIT_OPTIONS = [
  'Health Insurance', 'Overtime', 'Food + Accomodation', 'Accomodation',
  'Food', 'Transport', 'PF', 'ESI', 'Joining Bonus', 'Fuel Allowance',
  'Travel Allowance', 'Laptop', 'Mobile', 'Others',
];

const QUALIFICATIONS_WITH_STREAM = ['10th', '12th', 'Upto 5th'];

function AddJob() {
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;
  const navigate = useNavigate();
  const { id } = useParams(); // present when editing an existing job

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const razorpayKey = process.env.REACT_APP_MIPIE_RAZORPAY_KEY;

  const authHeaders = { headers: { 'x-auth': token } };

  // ---------- dropdown / reference data ----------
  const [company, setCompany] = useState({ name: '', creditLeft: 0 });
  const [industryList, setIndustryList] = useState([]);
  const [qualificationList, setQualificationList] = useState([]);
  const [subQualificationList, setSubQualificationList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [coinsRequired, setCoinsRequired] = useState({ contactcoins: 0 });
  const [coinOffers, setCoinOffers] = useState([]);

  // ---------- form state ----------
  const [form, setForm] = useState({
    displayCompanyName: '',
    title: '',
    _industry: '',
    experience: '',
    experienceMonths: '',
    _qualification: '',
    _subQualification: [],
    subQualificationText: '',
    validity: '',
    state: '',
    city: '',
    place: '',
    latitude: '',
    longitude: '',
    noOfPosition: '',
    genderPreference: 'no preference',
    jobType: '',
    compensation: '',
    pay: '',
    ageMin: 18,
    ageMax: 70,
    shift: '',
    shiftTimingFrom: '',
    shiftTimingTo: '',
    work: '',
    benifits: [],
    remarks: '',
    payOut: '',
    requirement: '',
    isFixed: '',
    amount: '',
    min: '',
    max: '',
    isPublic: 'true',
    collegeAcNo: [''],
    isContact: 'false',
    nameof: '',
    phoneNumberof: '',
    whatsappNumberof: '',
    emailof: '',
    jobDescription: 'Looking for a hard working and reliable resource for our company.',
    duties: '',
    isEdit: false,
  });

  const [questionAnswers, setQuestionAnswers] = useState([
    { question: 'Do you offer a safe working environment?', answer: '' },
  ]);

  const [jobVideo, setJobVideo] = useState(null);
  const [jobVideoThumbnail, setJobVideoThumbnail] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddCoinsModal, setShowAddCoinsModal] = useState(false);
  const [showCoinOfferModal, setShowCoinOfferModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [voucher, setVoucher] = useState('');
  const [voucherMessage, setVoucherMessage] = useState({ success: '', error: '' });
  const [payAmount, setPayAmount] = useState(null);

  const workLocRef = useRef(null);
  const streamRef = useRef(null);
  const benefitsRef = useRef(null);
  const streamChoicesRef = useRef(null);
  const benefitsChoicesRef = useRef(null);

  // ---------- helpers ----------
  const asArray = (value) => (Array.isArray(value) ? value : []);
  const updateField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const needsStream = QUALIFICATIONS_WITH_STREAM.includes(
    asArray(qualificationList).find((q) => q._id === form._qualification)?.name
  );

  // ---------- initial data load ----------
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/job/form-data`, authHeaders);
        const data = res.data?.data || {};

        setCompany({ name: data.college?.name || '', creditLeft: 0, _id: data.college?._id });
        setIndustryList(asArray(data.industry));
        setQualificationList(asArray(data.qualification));
        setSubQualificationList(asArray(data.subQualification));
        setStateList(asArray(data.state));
        setCoinsRequired({ contactcoins: 0 });
        updateField('displayCompanyName', data.college?.name || '');
      } catch (err) {
        console.error('Failed loading form reference data:', err.message);
        setIndustryList([]);
        setQualificationList([]);
        setSubQualificationList([]);
        setStateList([]);
      }
    };

    fetchInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = benefitsRef.current;
    if (!el) return undefined;

    const instance = new Choices(el, {
      removeItemButton: true,
      shouldSort: false,
      searchEnabled: true,
      placeholder: true,
      placeholderValue: 'Select Additional Benefits',
      itemSelectText: '',
    });
    benefitsChoicesRef.current = instance;

    const selected = asArray(form.benifits);
    if (selected.length) instance.setChoiceByValue(selected);

    const onChange = () => {
      const values = instance.getValue(true);
      updateField('benifits', Array.isArray(values) ? values : []);
    };
    el.addEventListener('change', onChange);

    return () => {
      el.removeEventListener('change', onChange);
      try { instance.destroy(); } catch (err) { /* ignore */ }
      benefitsChoicesRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const instance = benefitsChoicesRef.current;
    const selected = asArray(form.benifits);
    if (!instance || !selected.length) return;
    instance.setChoiceByValue(selected);
  }, [form.benifits]);

  useEffect(() => {
    if (needsStream || !streamRef.current || !asArray(subQualificationList).length) return undefined;

    if (streamChoicesRef.current) {
      try { streamChoicesRef.current.destroy(); } catch (err) { /* ignore */ }
      streamChoicesRef.current = null;
    }

    const el = streamRef.current;
    const instance = new Choices(el, {
      removeItemButton: true,
      shouldSort: false,
      searchEnabled: true,
      placeholder: true,
      placeholderValue: 'Select Stream',
      itemSelectText: '',
    });
    streamChoicesRef.current = instance;

    const selected = asArray(form._subQualification).map(String);
    if (selected.length) instance.setChoiceByValue(selected);

    const onChange = () => {
      const values = instance.getValue(true);
      updateField('_subQualification', Array.isArray(values) ? values : []);
    };
    el.addEventListener('change', onChange);

    return () => {
      el.removeEventListener('change', onChange);
      try { instance.destroy(); } catch (err) { /* ignore */ }
      streamChoicesRef.current = null;
    };
  }, [needsStream, subQualificationList]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const instance = streamChoicesRef.current;
    const selected = asArray(form._subQualification).map(String);
    if (!instance || !selected.length) return;
    instance.setChoiceByValue(selected);
  }, [form._subQualification]);

  // ---------- edit mode: load existing vacancy ----------
  useEffect(() => {
    if (!id) return;
    const fetchVacancy = async () => {
      try {
        const res = await axios.get(`${backendUrl}/company/job/${id}`, authHeaders);
        const vacancy = res.data?.vacancy || res.data;
        if (!vacancy) return;

        setForm((prev) => ({
          ...prev,
          displayCompanyName: vacancy.displayCompanyName || prev.displayCompanyName,
          title: vacancy.title || '',
          _industry: vacancy._industry?.toString() || '',
          experience: vacancy.experience?.toString() || '',
          experienceMonths: vacancy.experienceMonths?.toString() || '',
          _qualification: vacancy._qualification?.toString() || '',
          _subQualification: vacancy._subQualification || [],
          validity: vacancy.validity
            ? new Date(vacancy.validity).toISOString().split('T')[0]
            : '',
          state: vacancy.state?.toString() || '',
          city: vacancy.city?.toString() || '',
          place: vacancy.place || '',
          latitude: vacancy.latitude || '',
          longitude: vacancy.longitude || '',
          noOfPosition: vacancy.noOfPosition || '',
          genderPreference: vacancy.genderPreference || 'no preference',
          jobType: vacancy.jobType || '',
          compensation: vacancy.compensation || '',
          pay: vacancy.pay || '',
          ageMin: vacancy.ageMin || 18,
          ageMax: vacancy.ageMax || 70,
          shift: vacancy.shift || '',
          shiftTimingFrom: vacancy.shiftTimingFrom || '',
          shiftTimingTo: vacancy.shiftTimingTo || '',
          work: vacancy.work || '',
          benifits: vacancy.benifits || [],
          remarks: vacancy.remarks || '',
          payOut: vacancy.payOut || '',
          requirement: vacancy.requirement || '',
          isFixed: vacancy.isFixed === true ? 'true' : vacancy.isFixed === false ? 'false' : '',
          amount: vacancy.amount || '',
          min: vacancy.min || '',
          max: vacancy.max || '',
          isPublic: vacancy.postingType === 'Private' ? 'false' : 'true',
          collegeAcNo: Array.isArray(vacancy.collegeAcNo)
            ? vacancy.collegeAcNo
            : vacancy.collegeAcNo
            ? [vacancy.collegeAcNo]
            : [''],
          isContact: vacancy.isContact ? 'true' : 'false',
          nameof: vacancy.nameof || '',
          phoneNumberof: vacancy.phoneNumberof || '',
          whatsappNumberof: vacancy.whatsappNumberof || '',
          emailof: vacancy.emailof || '',
          jobDescription: vacancy.jobDescription || prev.jobDescription,
          duties: vacancy.duties || '',
          isEdit: true,
        }));

        if (vacancy.state) fetchCities(vacancy.state);
        if (vacancy.questionAnswers?.length) {
          setQuestionAnswers(
            vacancy.questionAnswers.map((qa) => ({ question: qa.Question, answer: qa.Answer }))
          );
        }
      } catch (err) {
        console.error('Failed loading vacancy for edit:', err.message);
      }
    };
    fetchVacancy();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- city dropdown on state change ----------
  const fetchCities = async (stateId) => {
    try {
      const res = await axios.post(
        `${backendUrl}/college/job/cities`,
        { stateId },
        authHeaders
      );
      setCityList(asArray(res.data?.cityValues || res.data));
    } catch (err) {
      console.error('Failed loading cities:', err.message);
    }
  };

  const handleStateChange = (e) => {
    const stateId = e.target.value;
    updateField('state', stateId);
    updateField('city', '');
    if (stateId) fetchCities(stateId);
    else setCityList([]);
  };

  // ---------- Google Places autocomplete ----------
  useEffect(() => {
    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
      initAutocomplete();
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB7DDN_gUp2zyrlElXtYpjTEQobYiUB9Lg&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = initAutocomplete;
    document.body.appendChild(script);

    function initAutocomplete() {
      if (!window.google || !workLocRef.current) return;
      const autocomplete = new window.google.maps.places.Autocomplete(workLocRef.current, {
        componentRestrictions: { country: 'in' },
        types: ['establishment'],
      });
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;
        updateField('place', workLocRef.current.value);
        updateField('latitude', place.geometry.location.lat());
        updateField('longitude', place.geometry.location.lng());
      });
    }
  }, []);

  // ---------- Q&A rows ----------
  const addQuestionAnswer = () =>
    setQuestionAnswers((prev) => [...prev, { question: '', answer: '' }]);

  const removeQuestionAnswer = (index) =>
    setQuestionAnswers((prev) => prev.filter((_, i) => i !== index));

  const updateQuestionAnswer = (index, field, value) =>
    setQuestionAnswers((prev) =>
      prev.map((qa, i) => (i === index ? { ...qa, [field]: value } : qa))
    );

  // ---------- college account numbers ----------
  const addCollegeAcNo = () =>
    setForm((prev) => ({ ...prev, collegeAcNo: [...prev.collegeAcNo, ''] }));

  const removeCollegeAcNo = (index) =>
    setForm((prev) => {
      const updated = prev.collegeAcNo.filter((_, i) => i !== index);
      return { ...prev, collegeAcNo: updated.length ? updated : [''] };
    });

  const updateCollegeAcNo = (index, value) =>
    setForm((prev) => ({
      ...prev,
      collegeAcNo: prev.collegeAcNo.map((v, i) => (i === index ? value : v)),
    }));

  // ---------- benefits multi-select ----------
  const toggleBenefit = (benefit) =>
    setForm((prev) => ({
      ...prev,
      benifits: prev.benifits.includes(benefit)
        ? prev.benifits.filter((b) => b !== benefit)
        : [...prev.benifits, benefit],
    }));

  // ---------- sub qualification multi-select ----------
  const toggleSubQualification = (subId) =>
    setForm((prev) => ({
      ...prev,
      _subQualification: prev._subQualification.includes(subId)
        ? prev._subQualification.filter((s) => s !== subId)
        : [...prev._subQualification, subId],
    }));

  // ---------- file validation ----------
  const validateVideoFile = (file) => {
    if (!file) return true;
    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['mp4', 'mov', 'avi'];
    const maxSize = 9 * 1024 * 1024;
    if (!allowed.includes(ext)) {
      alert('Invalid file format! Only MP4, MOV, and AVI files are allowed.');
      return false;
    }
    if (file.size > maxSize) {
      alert('File size too large! Maximum allowed size is 9MB.');
      return false;
    }
    return true;
  };

  const validateImageFile = (file) => {
    if (!file) return true;
    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png'];
    const maxSize = 10 * 1024 * 1024;
    if (!allowed.includes(ext)) {
      alert('Invalid file format! Only PNG, JPG, and JPEG files are allowed.');
      return false;
    }
    if (file.size > maxSize) {
      alert('File size too large! Maximum allowed size is 10MB.');
      return false;
    }
    return true;
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (validateVideoFile(file)) setJobVideo(file);
    else e.target.value = '';
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (validateImageFile(file)) setJobVideoThumbnail(file);
    else e.target.value = '';
  };

  // ---------- validation ----------
  const validate = () => {
    const newErrors = {};

    if (!form.title.trim()) newErrors.title = 'Enter job title';
    if (!workLocRef.current?.value?.trim() || !form.latitude || !form.longitude || !form.place) {
      newErrors.location = 'Select a work location from the suggestions';
    }
    if (!form._industry) newErrors.industry = 'Please select an industry';
    if (!form.experience || !form.experienceMonths) newErrors.experience = 'Please select experience';
    if (!form._qualification) newErrors.qualification = 'Please select qualification';
    if (needsStream && form._subQualification.length === 0)
      newErrors.subQualification = 'Please select a stream';
    if (!form.validity) newErrors.validity = 'Please select validity date';
    if (!form.state) newErrors.state = 'Please select state';
    if (!form.city) newErrors.city = 'Please select city';
    if (form.ageMin && form.ageMax && Number(form.ageMin) > Number(form.ageMax))
      newErrors.ageGroup = 'Minimum age cannot exceed maximum age';
    if (!form.jobType) newErrors.jobType = 'Please select job type';
    if (!form.shiftTimingFrom || !form.shiftTimingTo) newErrors.shiftTiming = 'Please enter shift timing';
    if (!form.shift) newErrors.shift = 'Please select shift';
    if (!form.compensation) newErrors.compensation = 'Please select compensation';
    if (!form.pay) newErrors.pay = 'Please select pay type';
    if (!form.work) newErrors.work = 'Please select work type';
    if (!form.isFixed) newErrors.salaryRange = 'Please choose fixed or a defined range';
    if (form.isFixed === 'true' && !form.amount) newErrors.fixedAmount = 'Enter a fixed amount';
    if (form.isFixed === 'false' && (!form.min || !form.max))
      newErrors.salaryMinMax = 'Enter both minimum and maximum salary';
    if (!form.displayCompanyName.trim()) newErrors.organizationName = 'Enter company name';
    if (!form.genderPreference) newErrors.genderPreference = 'Please select gender preference';

    if (form.isContact === 'true' && (!form.phoneNumberof || form.phoneNumberof.length !== 10)) {
      newErrors.phoneNumber = 'Enter a valid 10-digit phone number';
    }

    if (form.isPublic === 'false') {
      const hasValid = form.collegeAcNo.some((v) => v.trim() !== '');
      if (!hasValid) newErrors.collegeAcNo = 'Enter at least one college account number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const isContactChecked = form.isContact === 'true';
    if (isContactChecked && Number(coinsRequired.contactcoins) > 0 && Number(company.creditLeft) < Number(coinsRequired.contactcoins)) {
      setShowAddCoinsModal(true);
      return;
    }

    await submitJob();
  };

  const submitJob = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === '_subQualification' || key === 'benifits' || key === 'collegeAcNo') {
          value.forEach((v) => formData.append(`${key}[]`, v));
        } else {
          formData.append(key, value);
        }
      });
      formData.append(
        'questionsAnswers',
        JSON.stringify(
          questionAnswers.filter((qa) => qa.question.trim() && qa.answer.trim())
        )
      );
      if (jobVideo) formData.append('jobVideo', jobVideo);
      if (jobVideoThumbnail) formData.append('jobVideoThumbnail', jobVideoThumbnail);

      const res = await axios.post(`${backendUrl}/college/job/add`, formData, {
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status) {
        navigate('/institute/availablejobs');
      }
    } catch (err) {
      console.error('Error submitting the form:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- coin offers / voucher / razorpay ----------
  const loadCoinOffers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/company/getCoinOffers`, authHeaders);
      setCoinOffers(res.data || []);
      if (res.data?.length) setSelectedOffer(res.data[0]);
    } catch (err) {
      console.error(err.message);
    }
  };

  const openCoinOffers = () => {
    setShowAddCoinsModal(false);
    setShowCoinOfferModal(true);
    loadCoinOffers();
  };

  const proceedToVoucher = () => {
    setShowCoinOfferModal(false);
    setPayAmount(selectedOffer?.payAmount?.$numberDecimal || selectedOffer?.payAmount);
    setShowVoucherModal(true);
  };

  const checkVoucher = async () => {
    try {
      const res = await axios.put(
        `${backendUrl}/company/checkvoucher`,
        { amount: payAmount, code: voucher, offerId: selectedOffer?._id },
        authHeaders
      );
      if (res.data.status) {
        setVoucherMessage({ success: res.data.message, error: '' });
        setPayAmount(res.data.amount);
        if (res.data.amount === 0) {
          window.location.reload();
        }
      } else {
        setVoucher('');
        setVoucherMessage({ success: '', error: res.data.message });
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const makePayment = async () => {
    try {
      const res = await axios.post(
        `${backendUrl}/company/payment`,
        { offerId: selectedOffer?._id, amount: payAmount },
        authHeaders
      );
      const options = {
        key: razorpayKey,
        amount: res.data.order.amount,
        currency: res.data.order.currency,
        name: 'MiPie',
        order_id: res.data.order.id,
        image: resolveMediaUrl('/images/logo/logo.png'),
        handler: async (response) => {
          await axios.post(
            `${backendUrl}/company/paymentStatus`,
            {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              _company: res.data.company._id,
              _offer: selectedOffer?._id,
              amount: payAmount,
              code: voucher,
            },
            authHeaders
          );
          window.location.reload();
        },
        prefill: {
          name: res.data.company.name,
          email: res.data.company.email,
          contact: res.data.company._concernPerson?.mobile,
        },
        theme: { color: '#FC2B5A' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err.message);
    }
  };

  const handlePayClick = () => {
    if (!voucher.trim()) {
      makePayment();
    } else {
      checkVoucher();
    }
  };

  return (
    <div className="content-body">
      <form onSubmit={handleSubmit}>
        <section id="Concerned-Person">
          <div className="row">
            <div className="col-xl-12 px-3 text-right">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => navigate('/company/list/jobs')}
              >
                All Job Details
              </button>
            </div>

            {/* ---------- Basic info ---------- */}
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card mt-2">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">Add Job Description</h4>
                </div>
                <div className="card-content" id="jd-info">
                  <div className="card-body">
                    <div className="row">
                      <div className={`col-xl-3 mb-1 ${errors.organizationName ? 'error' : ''}`}>
                        <label>Display Organization Name</label><span className="mandatory"> *</span>
                        <input
                          className="form-control"
                          type="text"
                          maxLength={50}
                          value={form.displayCompanyName}
                          onChange={(e) => updateField('displayCompanyName', e.target.value)}
                          placeholder="Company Name"
                        />
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.title ? 'error' : ''}`}>
                        <label>Title</label><span className="mandatory"> *</span>
                        <input
                          className="form-control"
                          type="text"
                          maxLength={100}
                          value={form.title}
                          onChange={(e) => updateField('title', e.target.value)}
                          placeholder="Enter the job title"
                        />
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.industry ? 'error' : ''}`}>
                        <label>Industry</label><span className="mandatory"> *</span>
                        <select
                          className="form-control"
                          value={form._industry}
                          onChange={(e) => updateField('_industry', e.target.value)}
                        >
                          <option value="">Select option</option>
                          {asArray(industryList).map((item) => (
                            <option key={item._id} value={item._id} className="text-capitalize">
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.experience ? 'error' : ''}`}>
                        <label>Experience (In Years)</label><span className="mandatory"> *</span>
                        <select
                          className="form-control"
                          value={form.experience}
                          onChange={(e) => updateField('experience', e.target.value)}
                        >
                          <option value="">Select option</option>
                          {Array.from({ length: 26 }, (_, i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.experience ? 'error' : ''}`}>
                        <label>Experience (In Months)</label><span className="mandatory"> *</span>
                        <select
                          className="form-control"
                          value={form.experienceMonths}
                          onChange={(e) => updateField('experienceMonths', e.target.value)}
                        >
                          <option value="">Select option</option>
                          {Array.from({ length: 13 }, (_, i) => (
                            <option key={i} value={i}>{i}</option>
                          ))}
                        </select>
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.qualification ? 'error' : ''}`}>
                        <label>Qualification</label><span className="mandatory"> *</span>
                        <select
                          className="form-control"
                          value={form._qualification}
                          onChange={(e) => updateField('_qualification', e.target.value)}
                        >
                          <option value="">Select option</option>
                          {asArray(qualificationList).map((item) => (
                            <option key={item._id} value={item._id} className="text-capitalize">
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {needsStream ? (
                        <div className="col-xl-3 mb-1">
                          <label>Stream</label><span className="mandatory"> *</span>
                          <input
                            type="text"
                            className="form-control"
                            disabled
                            placeholder="Enter your subQualification"
                          />
                        </div>
                      ) : (
                        <div className={`col-xl-3 mb-1 ${errors.subQualification ? 'error' : ''}`}>
                          <label>Stream</label><span className="mandatory"> *</span>
                          <select
                            ref={streamRef}
                            className="form-control"
                            multiple
                            defaultValue={asArray(form._subQualification)}
                          >
                            {asArray(subQualificationList).map((item) => (
                              <option key={item._id} value={item._id} className="text-capitalize">
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className={`col-xl-3 mb-1 ${errors.validity ? 'error' : ''}`}>
                        <label>Active Till</label><span className="asterisk"> *</span>
                        <input
                          type="date"
                          className="form-control"
                          min={new Date().toISOString().split('T')[0]}
                          value={form.validity}
                          onChange={(e) => updateField('validity', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Location ---------- */}
          <div className="row" id="jd-loc">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card mt-1">
                <div className="card-body">
                  <div className="row">
                    <div className={`col-xl-4 mb-1 ${errors.state ? 'error' : ''}`}>
                      <label>State</label><span className="mandatory"> *</span>
                      <select className="form-control" value={form.state} onChange={handleStateChange}>
                        <option value="">Select option</option>
                        {asArray(stateList).map((item) => (
                          <option key={item._id} value={item._id} className="text-capitalize">
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={`col-xl-4 mb-1 ${errors.city ? 'error' : ''}`}>
                      <label>City</label><span className="mandatory"> *</span>
                      <select
                        className="form-control"
                        value={form.city}
                        onChange={(e) => updateField('city', e.target.value)}
                      >
                        <option value="">Select option</option>
                        {asArray(cityList).map((item) => (
                          <option key={item._id} value={item._id} className="text-capitalize">
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={`col-xl-4 ${errors.location ? 'error' : ''}`} id="loc-field">
                      <label htmlFor="work-loc">Work Location<span className="mandatory"> *</span></label>
                      <div className="input-group mb-2">
                        <div className="input-group-prepend bg-locat">
                          <div className="input-group-text bg-intext">
                            <img src={resolveMediaUrl('/images/isist.png')} alt="" />
                          </div>
                        </div>
                        <input
                          type="text"
                          ref={workLocRef}
                          className="form-control"
                          defaultValue={form.place}
                          id="work-loc"
                        />
                      </div>
                    </div>

                    <div className="col-xl-4 mb-1">
                      <label htmlFor="noOfVacancies">Number of Vacancies</label>
                      <input
                        id="noOfVacancies"
                        className="form-control"
                        type="number"
                        maxLength={3}
                        value={form.noOfPosition}
                        onChange={(e) => {
                          if (e.target.value.length <= 3) updateField('noOfPosition', e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Preferences / compensation ---------- */}
          <div className="row" id="jd-comp">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card mt-1">
                <div className="card-body">
                  <div className="row">
                    <div className={`col-xl-3 mb-1 ${errors.genderPreference ? 'error' : ''}`}>
                      <div className="demo-inline-spacing">
                        <label>Gender Preferences</label><span className="mandatory"> *</span>
                        <br />
                        {['male', 'female', 'no preference'].map((val) => (
                          <div className="form-check form-check-inline" key={val}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="genderPreference"
                              checked={form.genderPreference === val}
                              onChange={() => updateField('genderPreference', val)}
                            />
                            <label className="form-check-label text-capitalize">{val}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`col-xl-3 mb-1 ${errors.jobType ? 'error' : ''}`}>
                      <div className="demo-inline-spacing">
                        <label>Type</label><span className="mandatory"> *</span>
                        <br />
                        {['Full Time', 'Part Time'].map((val) => (
                          <div className="form-check form-check-inline" key={val}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="jobType"
                              checked={form.jobType === val}
                              onChange={() => updateField('jobType', val)}
                            />
                            <label className="form-check-label">{val}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`col-xl-3 mb-1 ${errors.compensation ? 'error' : ''}`}>
                      <div className="demo-inline-spacing">
                        <label>Compensation</label><span className="mandatory"> *</span>
                        <br />
                        {['Fixed', 'Incentive Only', 'Fixed + Incentive'].map((val) => (
                          <div className="form-check form-check-inline" key={val}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="compensation"
                              checked={form.compensation === val}
                              onChange={() => updateField('compensation', val)}
                            />
                            <label className="form-check-label">{val}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`col-xl-3 mb-1 ${errors.pay ? 'error' : ''}`}>
                      <div className="demo-inline-spacing">
                        <label>Pay</label><span className="mandatory"> *</span>
                        <br />
                        {['On Payrol', 'Freelancer/Consultant'].map((val) => (
                          <div className="form-check form-check-inline" key={val}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="pay"
                              checked={form.pay === val}
                              onChange={() => updateField('pay', val)}
                            />
                            <label className="form-check-label">{val}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className={`col-xl-6 mb-1 ${errors.ageGroup ? 'error' : ''}`}>
                      <label>Age Group</label>
                      <div className="row">
                        <div className="col-6">
                          <label className="label-font">From</label>
                          <input
                            type="range"
                            min="18"
                            max="70"
                            value={form.ageMin}
                            onChange={(e) => updateField('ageMin', e.target.value)}
                          />
                          <p>Age: <span>{form.ageMin}</span></p>
                        </div>
                        <div className="col-6">
                          <label className="label-font">To</label>
                          <input
                            type="range"
                            min="18"
                            max="70"
                            value={form.ageMax}
                            onChange={(e) => updateField('ageMax', e.target.value)}
                          />
                          <p>Age: <span>{form.ageMax}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Shift info ---------- */}
          <div className="row" id="jd-shift-info">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card mt-1">
                <div className="card-body">
                  <div className="row">
                    <div className={`col-xl-3 mb-1 ${errors.shift ? 'error' : ''}`}>
                      <div className="demo-inline-spacing">
                        <label>Shift</label><span className="mandatory"> *</span>
                        <br />
                        {['Day Shift', 'Night Shift', 'Rotational', 'NA'].map((val) => (
                          <div className="form-check form-check-inline" key={val}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="shift"
                              checked={form.shift === val}
                              onChange={() => updateField('shift', val)}
                            />
                            <label className="form-check-label">{val}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`col-xl-3 mb-1 ${errors.shiftTiming ? 'error' : ''}`}>
                      <label>Shift Timing</label><span className="mandatory"> *</span>
                      <div className="row">
                        <div className="col-6">
                          <label>From</label>
                          <input
                            type="time"
                            className="form-control"
                            value={form.shiftTimingFrom}
                            onChange={(e) => updateField('shiftTimingFrom', e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label>To</label>
                          <input
                            type="time"
                            className="form-control"
                            value={form.shiftTimingTo}
                            onChange={(e) => updateField('shiftTimingTo', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={`col-xl-3 mb-1 ${errors.work ? 'error' : ''}`}>
                      <div className="demo-inline-spacing">
                        <label>Work Type</label><span className="mandatory"> *</span>
                        <br />
                        {['Work from office', 'Work from home', 'Field', 'NA'].map((val) => (
                          <div className="form-check form-check-inline" key={val}>
                            <input
                              className="form-check-input"
                              type="radio"
                              name="work"
                              checked={form.work === val}
                              onChange={() => updateField('work', val)}
                            />
                            <label className="form-check-label">{val}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="col-xl-3 mb-1">
                      <label>Additional Benefits</label>
                      <select
                        ref={benefitsRef}
                        className="form-control"
                        multiple
                        defaultValue={asArray(form.benifits)}
                      >
                        {BENEFIT_OPTIONS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-xl-3">
                      <label htmlFor="remarks">Remarks</label>
                      <textarea
                        id="remarks"
                        className="form-control"
                        rows={3}
                        maxLength={150}
                        value={form.remarks}
                        onChange={(e) => updateField('remarks', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Payout / salary ---------- */}
          <div className="row" id="jd-skills">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card mt-1">
                <div className="card-body">
                  <div className="row">
                    <div className="col-xl-3 mb-1">
                      <label>Payout</label>
                      <select
                        className="form-control"
                        value={form.payOut}
                        onChange={(e) => updateField('payOut', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="NA">NA</option>
                      </select>
                    </div>

                    <div className="col-xl-3 mb-1">
                      <label>Requirement (If any)</label>
                      <select
                        className="form-control"
                        value={form.requirement}
                        onChange={(e) => updateField('requirement', e.target.value)}
                      >
                        <option value="">Select option</option>
                        <option value="Two Wheeler">Two Wheeler</option>
                        <option value="Four Wheeler">Four Wheeler</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Passport">Passport</option>
                      </select>
                    </div>

                    <div className={`col-xl-3 mb-1 ${errors.salaryRange ? 'error' : ''}`} id="salaryRange-field">
                      <label>Salary Range (Monthly in Rs.)</label><span className="mandatory"> *</span>
                      <br />
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="isFixed"
                          checked={form.isFixed === 'true'}
                          onChange={() => updateField('isFixed', 'true')}
                        />
                        <label className="form-check-label">Fixed</label>
                      </div>
                      <div className="form-check form-check-inline">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="isFixed"
                          checked={form.isFixed === 'false'}
                          onChange={() => updateField('isFixed', 'false')}
                        />
                        <label className="form-check-label">Define Range</label>
                      </div>

                      {form.isFixed === 'true' && (
                        <div className={errors.fixedAmount ? 'error' : ''}>
                          <input
                            className="form-control"
                            placeholder="Fixed amount"
                            type="number"
                            value={form.amount}
                            onChange={(e) => {
                              if (e.target.value.length <= 10) updateField('amount', e.target.value);
                            }}
                          />
                        </div>
                      )}

                      {form.isFixed === 'false' && (
                        <div className={`row ${errors.salaryMinMax ? 'error' : ''}`}>
                          <div className="col-6">
                            <input
                              className="form-control"
                              placeholder="Minimum"
                              type="number"
                              value={form.min}
                              onChange={(e) => {
                                if (e.target.value.length <= 10) updateField('min', e.target.value);
                              }}
                            />
                          </div>
                          <div className="col-6">
                            <input
                              className="form-control"
                              placeholder="Maximum"
                              type="number"
                              value={form.max}
                              onChange={(e) => {
                                if (e.target.value.length <= 10) updateField('max', e.target.value);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Public / Private visibility ---------- */}
          <div className="row">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <label className="px-1 h1 col-6">Do you want this job to be visible to the public?</label>
                    <div className="col-xl-12 col-lg-12 col-12">
                      <div className="form-check-inline">
                        <input
                          type="radio"
                          id="job-public-yes"
                          checked={form.isPublic === 'true'}
                          onChange={() => updateField('isPublic', 'true')}
                        />
                        <label htmlFor="job-public-yes">Yes</label>
                      </div>
                      <div className="form-check-inline">
                        <input
                          type="radio"
                          id="job-public-no"
                          checked={form.isPublic === 'false'}
                          onChange={() => updateField('isPublic', 'false')}
                        />
                        <label htmlFor="job-public-no">No</label>
                      </div>
                    </div>

                    {form.isPublic === 'false' && (
                      <div className={`col-12 ${errors.collegeAcNo ? 'error' : ''}`}>
                        <div className="row">
                          <div className="col-xl-8 col-lg-10 mb-1">
                            <label>College Account Numbers</label><span className="mandatory"> *</span>
                            <small className="form-text text-muted d-block mb-2">
                              <i className="feather icon-info" /> Enter College Account Numbers.
                              This job will be visible to the specified colleges. You can add multiple colleges.
                            </small>
                            <div className="row">
                              {form.collegeAcNo.map((val, index) => (
                                <div className="col-12 col-md-6 col-lg-4 mb-2" key={index}>
                                  <div className="input-group">
                                    <input
                                      type="text"
                                      className="form-control"
                                      placeholder="Enter College Account Number"
                                      value={val}
                                      onChange={(e) => updateCollegeAcNo(index, e.target.value)}
                                    />
                                    <div className="input-group-append">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-danger"
                                        onClick={() => removeCollegeAcNo(index)}
                                      >
                                        <i className="feather icon-trash-2" /> Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button type="button" className="btn btn-sm btn-success mt-2" onClick={addCollegeAcNo}>
                              <i className="feather icon-plus" /> Add College Account Number
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Contact info ---------- */}
          <div className="row">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card">
                <div className="card-body">
                  <div className="row">
                    <label className="px-1 h1 col-6">Do you want the candidate to contact you directly?</label>
                    {form.isContact === 'true' && (
                      <label className="col-6 text-center">
                        This is a service premium. We will deduct {coinsRequired?.contactcoins} coins from your account
                      </label>
                    )}
                    <div className="col-xl-12 col-lg-12 col-12">
                      <div className="form-check-inline">
                        <input
                          type="radio"
                          id="contact-directly-yes"
                          checked={form.isContact === 'true'}
                          onChange={() => updateField('isContact', 'true')}
                        />
                        <label htmlFor="contact-directly-yes">Yes</label>
                      </div>
                      <div className="form-check-inline">
                        <input
                          type="radio"
                          id="contact-directly-no"
                          checked={form.isContact === 'false'}
                          onChange={() => updateField('isContact', 'false')}
                        />
                        <label htmlFor="contact-directly-no">No</label>
                      </div>
                    </div>

                    {form.isContact === 'true' && (
                      <div className="col-12">
                        <div className="row">
                          <div className="col-xl-3 mb-1">
                            <label>Name</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Name"
                              value={form.nameof}
                              onChange={(e) => {
                                if (/^[a-zA-Z\s]*$/.test(e.target.value)) updateField('nameof', e.target.value);
                              }}
                            />
                          </div>
                          <div className={`col-xl-3 mb-1 ${errors.phoneNumber ? 'error' : ''}`}>
                            <label>Phone Number</label><span className="mandatory"> *</span>
                            <input
                              type="tel"
                              className="form-control"
                              placeholder="Phone no"
                              maxLength={10}
                              value={form.phoneNumberof}
                              onChange={(e) => {
                                if (/^\d*$/.test(e.target.value)) updateField('phoneNumberof', e.target.value);
                              }}
                            />
                          </div>
                          <div className="col-xl-3 mb-1">
                            <label>Whatsapp Number</label>
                            <input
                              type="tel"
                              className="form-control"
                              placeholder="Whatsapp Number"
                              maxLength={10}
                              value={form.whatsappNumberof}
                              onChange={(e) => {
                                if (/^\d*$/.test(e.target.value)) updateField('whatsappNumberof', e.target.value);
                              }}
                            />
                          </div>
                          <div className="col-xl-3 mb-1">
                            <label>Email</label>
                            <input
                              className="form-control"
                              type="email"
                              placeholder="Enter your email"
                              value={form.emailof}
                              onChange={(e) => updateField('emailof', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Questions & Answers ---------- */}
          <div className="row">
            <div className="col-xl-6 col-lg-6 px-3">
              <div className="card mt-1">
                <div className="card-body">
                  {questionAnswers.map((qa, index) => (
                    <div className="row" key={index}>
                      <div className="col-xl-6">
                        <label>Question</label>
                        <textarea
                          className="form-control"
                          rows={1}
                          value={qa.question}
                          onChange={(e) => updateQuestionAnswer(index, 'question', e.target.value)}
                        />
                      </div>
                      <div className="col-xl-6">
                        <label>Answer</label>
                        <textarea
                          className="form-control"
                          rows={1}
                          value={qa.answer}
                          onChange={(e) => updateQuestionAnswer(index, 'answer', e.target.value)}
                        />
                      </div>
                      <div className="col-xl-12 mb-1 text-right">
                        {questionAnswers.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm mr-1"
                            onClick={() => removeQuestionAnswer(index)}
                          >
                            Remove
                          </button>
                        )}
                        {index === questionAnswers.length - 1 && (
                          <button
                            type="button"
                            className="btn btn-success text-white"
                            onClick={addQuestionAnswer}
                          >
                            + Add Another
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Job description ---------- */}
          <div className="row">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card mt-1">
                <div className="card-body">
                  <div className="row">
                    <div className="col-xl-4 mb-1">
                      <label>Job Description</label>
                      <textarea
                        className="form-control"
                        rows={5}
                        value={form.jobDescription}
                        onChange={(e) => updateField('jobDescription', e.target.value)}
                      />
                    </div>
                    <div className="col-xl-5">
                      <label>Job Duties</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        maxLength={150}
                        value={form.duties}
                        onChange={(e) => updateField('duties', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Media upload + submit ---------- */}
          <div className="row">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card mt-1">
                <div className="card-body">
                  <div className="row">
                    <div className="col-xl-3 mb-1">
                      <label>Add Video JD</label>
                      <input accept="video/*" className="form-control" type="file" onChange={handleVideoChange} />
                    </div>
                    <div className="col-xl-3 mb-1">
                      <label>Add Thumbnail JD</label>
                      <input accept="image/*" className="form-control" type="file" onChange={handleThumbnailChange} />
                    </div>
                    <div className="col-xl-12 mb-1 text-right">
                      <button
                        type="submit"
                        className="btn btn-success waves-effect waves-light text-white"
                        disabled={loading}
                      >
                        {loading ? 'Submitting...' : 'SUBMIT'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </form>

      {/* ---------- Insufficient coins modal ---------- */}
      {showAddCoinsModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase">Insufficient Coins</h5>
                <button type="button" className="close" onClick={() => setShowAddCoinsModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body pt-1">
                <h5 className="pb-1 mb-0 mt-1">
                  You need {coinsRequired?.contactcoins} Coins to avail this Premium Service
                </h5>
                <ul className="list-unstyled">
                  <li className="mb-1">
                    <span className="credit font-weight-bold">
                      Current Coins Balance: {company.creditLeft}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={openCoinOffers}>Buy Coins</button>
                <button type="button" className="btn btn-outline-light" onClick={() => setShowAddCoinsModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Coin offers modal ---------- */}
      {showCoinOfferModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-white text-uppercase">COIN OFFERS</h5>
                <button type="button" className="close" onClick={() => setShowCoinOfferModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body pt-1">
                <ul className="list-unstyled">
                  <li>
                    <div className="col-xl-8 mx-auto">
                      {coinOffers.map((offer) => (
                        <div className="row inner-border my-2 text-white popup-bg py-1" key={offer._id}>
                          <div className="col-9 pr-0">{offer.displayOffer}</div>
                          <div className="col-3 text-left">
                            <input
                              type="radio"
                              className="radio-size"
                              checked={selectedOffer?._id === offer._id}
                              onChange={() => setSelectedOffer(offer)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </li>
                  <li className="mb-1">
                    <span className="credit font-weight-bold">
                      Current Coins Balance: {company.creditLeft}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary waves-effect waves-light"
                  onClick={proceedToVoucher}
                >
                  Pay Now
                </button>
                <button
                  type="button"
                  className="btn btn-outline-light waves-effect waves-light"
                  onClick={() => setShowCoinOfferModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Voucher / payment modal ---------- */}
      {showVoucherModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content modal-sm">
              <div className="modal-header vchr_header">
                <h5 className="modal-title text-white text-uppercase">Buy Coins</h5>
                <button type="button" className="close color-purple" onClick={() => setShowVoucherModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body mode-dice p-0">
                <div className="my-3">
                  <h3 className="coupon-text">If you have a <strong>Coupon Code</strong>, apply here</h3>
                  <input
                    type="text"
                    className="text-white mt-1"
                    placeholder="Enter Code"
                    value={voucher}
                    onChange={(e) => setVoucher(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && checkVoucher()}
                  />
                  <button
                    type="button"
                    className="voucher-btn btn btn-sm ml-1"
                    disabled={!voucher.trim()}
                    onClick={checkVoucher}
                  >
                    Apply
                  </button>
                </div>
                {voucherMessage.success && (
                  <p className="text-success font-weight-bolder font-italic">{voucherMessage.success}</p>
                )}
                {voucherMessage.error && (
                  <p className="text-danger font-weight-bolder font-italic">{voucherMessage.error}</p>
                )}
              </div>
              <div className="modal-footer text-center">
                <button className="btn button-vchr shadow" onClick={handlePayClick}>
                  {payAmount ? `Pay ₹ ${payAmount}` : 'Apply / Pay Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddJob;