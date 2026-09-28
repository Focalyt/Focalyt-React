import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Choices from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';
import { resolveMediaUrl } from '../../../../utils/resolveMediaUrl';

const BENEFIT_OPTIONS = [
  'Health Insurance', 'Overtime', 'Accomodation', 'Transport', 'PF',
  'Joining Bonus', 'Fuel Allowance', 'Travel Allowance', 'Laptop', 'Mobile', 'Others',
];

function initChoicesInContainer(container, { options, selected, placeholder, onChange }) {
  if (!container) return { instance: null, cleanup: () => {} };

  container.innerHTML = '';
  const select = document.createElement('select');
  select.className = 'form-control';
  select.multiple = true;
  options.forEach((item) => {
    const option = document.createElement('option');
    const value = typeof item === 'object' ? String(item._id ?? item.value ?? '') : String(item);
    const label = typeof item === 'object' ? (item.name || item.label || value) : String(item);
    option.value = value;
    option.textContent = label;
    option.classList.add('text-capitalize');
    select.appendChild(option);
  });
  container.appendChild(select);

  const instance = new Choices(select, {
    removeItemButton: true,
    shouldSort: false,
    searchEnabled: true,
    placeholder: true,
    placeholderValue: placeholder,
    itemSelectText: '',
    position: 'bottom',
    shouldSortItems: false,
  });

  const selectedValues = (selected || []).map(String).filter(Boolean);
  if (selectedValues.length) instance.setChoiceByValue(selectedValues);

  const handleChange = () => {
    const values = instance.getValue(true);
    onChange(Array.isArray(values) ? values : []);
  };
  select.addEventListener('change', handleChange);

  return {
    instance,
    cleanup: () => {
      select.removeEventListener('change', handleChange);
      try { instance.destroy(); } catch (err) { /* ignore */ }
      if (container) container.innerHTML = '';
    },
  };
}

function EditJob({ readOnly = false }) {
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  const token = userData.token;
  const navigate = useNavigate();
  const { id } = useParams();

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const razorpayKey = process.env.REACT_APP_MIPIE_RAZORPAY_KEY;

  const authHeaders = { headers: { 'x-auth': token } };

  // ---------- reference / dropdown data ----------
  const [company, setCompany] = useState({ name: '', creditLeft: 0 });
  const [companyList, setCompanyList] = useState([]);
  const [industryList, setIndustryList] = useState([]);
  const [qualificationList, setQualificationList] = useState([]);
  const [subQualificationList, setSubQualificationList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [techSkillsList, setTechSkillsList] = useState([]);
  const [nonTechSkillsList, setNonTechSkillsList] = useState([]);
  const [coinsRequired, setCoinsRequired] = useState({ contactcoins: 0 });
  const [coinOffers, setCoinOffers] = useState([]);
  const [verticals, setVerticals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [centers, setCenters] = useState([]);

  // ---------- form state (mirrors `jd`) ----------
  const [form, setForm] = useState({
    vertical: '',
    project: '',
    center: '',
    _company: '',
    displayCompanyName: '',
    title: '',
    _industry: '',
    experience: '',
    experienceMonths: '',
    _qualification: '',
    _subQualification: [],
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
    _techSkills: [],
    _nonTechSkills: [],
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
    isedited: false,
  });

  const [questionAnswers, setQuestionAnswers] = useState([
    { question: 'Do you offer safe working environment ?', answer: 'Yes we do offer as we are ISO certified' },
  ]);
  const [docsRequired, setDocsRequired] = useState([]);

  const [existingVideo, setExistingVideo] = useState('');
  const [existingThumbnail, setExistingThumbnail] = useState('');
  const [jobVideo, setJobVideo] = useState(null);
  const [jobVideoThumbnail, setJobVideoThumbnail] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');

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

  const asArray = (value) => (Array.isArray(value) ? value : []);
  const toId = (value) => {
    if (value == null || value === '') return '';
    if (typeof value === 'object') return String(value._id || '');
    return String(value);
  };
  const toIdList = (value) => asArray(value).map(toId).filter(Boolean);
  const toDateInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const updateField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const updateMappingField = (name, value) => {
    setForm((prev) => {
      if (name === 'vertical') return { ...prev, vertical: value, project: '', center: '' };
      if (name === 'project') return { ...prev, project: value, center: '' };
      return { ...prev, [name]: value };
    });
  };

  const streamOptions = asArray(subQualificationList).filter(
    (item) => toId(item._qualification) === String(form._qualification || '')
  );
  const hasStreamOptions = streamOptions.length > 0;

  const handleQualificationChange = (e) => {
    const qualificationId = e.target.value;
    setForm((prev) => ({
      ...prev,
      _qualification: qualificationId,
      _subQualification: [],
    }));
  };

  const selectedStreams = () => {
    const fromChoices = streamChoicesRef.current?.getValue(true);
    if (Array.isArray(fromChoices) && fromChoices.length) return fromChoices.map(String);
    return asArray(form._subQualification).map(String);
  };

  const streamLabel = streamOptions
    .filter((item) => selectedStreams().includes(String(item._id)))
    .map((item) => item.name)
    .join(', ');
  const benefitsLabel = asArray(form.benifits).filter(Boolean).join(', ');

  // ---------- initial reference data ----------
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/job/form-data`, authHeaders);
        const data = res.data?.data || {};

        setCompany({ name: data.college?.name || '', creditLeft: 0, _id: data.college?._id });
        setCompanyList(asArray(data.companies));
        setIndustryList(asArray(data.industry));
        setQualificationList(asArray(data.qualification));
        setSubQualificationList(asArray(data.subQualification));
        setStateList(asArray(data.state));
        setCoinsRequired({ contactcoins: 0 });
        if (data.college?.name) {
          setForm((prev) => ({ ...prev, displayCompanyName: prev.displayCompanyName || data.college.name }));
        }
      } catch (err) {
        console.error('Failed loading form reference data:', err.message);
        setIndustryList([]);
        setQualificationList([]);
        setSubQualificationList([]);
        setStateList([]);
      }

      try {
        const [techSkillsRes, nonTechSkillsRes] = await Promise.all([
          axios.get(`${backendUrl}/company/techSkills`, authHeaders),
          axios.get(`${backendUrl}/company/nonTechSkills`, authHeaders),
        ]);
        setTechSkillsList(asArray(techSkillsRes.data?.techskills || techSkillsRes.data));
        setNonTechSkillsList(asArray(nonTechSkillsRes.data?.nontechskills || nonTechSkillsRes.data));
      } catch (err) {
        console.error('Failed loading skills:', err.message);
        setTechSkillsList([]);
        setNonTechSkillsList([]);
      }
    };
    fetchInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchVerticals = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/getVerticals`, authHeaders);
        setVerticals(asArray(res.data?.data));
      } catch (err) {
        console.error('Failed loading verticals:', err.message);
        setVerticals([]);
      }
    };
    fetchVerticals();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchProjects = async () => {
      if (!form.vertical) {
        setProjects([]);
        return;
      }
      try {
        const res = await axios.get(
          `${backendUrl}/college/list-projects?vertical=${form.vertical}`,
          authHeaders
        );
        setProjects(asArray(res.data?.data));
      } catch (err) {
        console.error('Failed loading projects:', err.message);
        setProjects([]);
      }
    };
    fetchProjects();
  }, [form.vertical]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchCenters = async () => {
      if (!form.project) {
        setCenters([]);
        return;
      }
      try {
        const res = await axios.get(
          `${backendUrl}/college/list-centers?projectId=${form.project}`,
          authHeaders
        );
        setCenters(asArray(res.data?.data));
      } catch (err) {
        console.error('Failed loading centers:', err.message);
        setCenters([]);
      }
    };
    fetchCenters();
  }, [form.project]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- load the job being edited ----------
  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${backendUrl}/college/job/details/${id}`, authHeaders);
        const jd = res.data?.jd || res.data?.vacancy || res.data;
        if (!jd || typeof jd !== 'object') return;

        const stateId = toId(jd.state);
        setForm((prev) => ({
          ...prev,
          vertical: toId(jd.vertical),
          project: toId(jd.project),
          center: toId(jd.center),
          _company: toId(jd._company),
          displayCompanyName: jd.displayCompanyName || prev.displayCompanyName || '',
          title: jd.title || '',
          _industry: toId(jd._industry),
          experience: jd.experience?.toString() || '',
          experienceMonths: jd.experienceMonths?.toString() || '',
          _qualification: toId(jd._qualification),
          _subQualification: toIdList(jd._subQualification),
          validity: toDateInput(jd.validity),
          state: stateId,
          city: toId(jd.city),
          place: jd.place || '',
          latitude: jd.latitude || '',
          longitude: jd.longitude || '',
          noOfPosition: jd.noOfPosition || '',
          genderPreference: jd.genderPreference || 'no preference',
          jobType: jd.jobType || '',
          compensation: jd.compensation || '',
          pay: jd.pay || '',
          ageMin: jd.ageMin || 18,
          ageMax: jd.ageMax || 70,
          shift: jd.shift || '',
          shiftTimingFrom: jd.shiftTimingFrom || '',
          shiftTimingTo: jd.shiftTimingTo || '',
          work: jd.work || '',
          benifits: asArray(jd.benifits),
          remarks: jd.remarks || '',
          payOut: jd.payOut || '',
          _techSkills: toIdList(jd._techSkills),
          _nonTechSkills: toIdList(jd._nonTechSkills),
          requirement: jd.requirement || '',
          isFixed: jd.isFixed === true ? 'true' : jd.isFixed === false ? 'false' : '',
          amount: jd.amount || '',
          min: jd.min || '',
          max: jd.max || '',
          isPublic: jd.postingType === 'Private' ? 'false' : 'true',
          collegeAcNo: Array.isArray(jd.collegeAcNo)
            ? jd.collegeAcNo
            : jd.collegeAcNo
            ? [jd.collegeAcNo]
            : [''],
          isContact: jd.isContact ? 'true' : 'false',
          nameof: jd.nameof || '',
          phoneNumberof: jd.phoneNumberof || '',
          whatsappNumberof: jd.whatsappNumberof || '',
          emailof: jd.emailof || '',
          jobDescription: jd.jobDescription || prev.jobDescription,
          duties: jd.duties || '',
          isedited: jd.isedited || false,
        }));

        if (stateId) fetchCities(stateId);
        const answers = jd.questionsAnswers || jd.questionAnswers;
        if (answers?.length) {
          setQuestionAnswers(
            answers.map((qa) => ({
              question: qa.Question || qa.question || '',
              answer: qa.Answer || qa.answer || '',
            }))
          );
        }
        setExistingVideo(jd.jobVideo || '');
        setExistingThumbnail(jd.jobVideoThumbnail || '');
        if (Array.isArray(jd.docsRequired) && jd.docsRequired.length) {
          setDocsRequired(
            jd.docsRequired.map((doc) => ({
              name: doc.Name || doc.name || '',
              mandatory: !!doc.mandatory,
            }))
          );
        }
      } catch (err) {
        console.error('Failed loading job:', err.message);
        alert(err.response?.data?.message || (readOnly ? 'Unable to load this job' : 'Unable to load this job for editing'));
      }
    };
    fetchJob();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (readOnly) return undefined;
    const container = benefitsRef.current;
    if (!container) return undefined;

    const { instance, cleanup } = initChoicesInContainer(container, {
      options: BENEFIT_OPTIONS,
      selected: form.benifits,
      placeholder: 'Select Additional Benefits',
      onChange: (values) => updateField('benifits', values),
    });
    benefitsChoicesRef.current = instance;
    return () => {
      cleanup();
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
    if (readOnly) return undefined;
    const container = streamRef.current;
    if (!container) return undefined;

    if (!hasStreamOptions) {
      container.innerHTML = '';
      streamChoicesRef.current = null;
      return undefined;
    }

    const { instance, cleanup } = initChoicesInContainer(container, {
      options: streamOptions,
      selected: form._subQualification,
      placeholder: 'Select Stream',
      onChange: (values) => updateField('_subQualification', values.map(String)),
    });
    streamChoicesRef.current = instance;
    return () => {
      cleanup();
      streamChoicesRef.current = null;
    };
  }, [hasStreamOptions, form._qualification, streamOptions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const instance = streamChoicesRef.current;
    const selected = asArray(form._subQualification).map(String);
    if (!instance || !selected.length) return;
    instance.setChoiceByValue(selected);
  }, [form._subQualification]);

  // ---------- cities on state change ----------
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
    if (readOnly) return undefined;
    const scriptId = 'google-maps-script';
    if (document.getElementById(scriptId)) {
      initAutocomplete();
      return;
    }
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_AUTH_KEY_GOOGLE}&libraries=places&v=weekly`;
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

  const revealNewRow = (selector) => {
    window.setTimeout(() => {
      document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 40);
  };

  const addDocumentField = () => {
    setDocsRequired((prev) => [...prev, { name: '', mandatory: false }]);
    revealNewRow('#studentDocsRequired .requiredDocsRow.qa-row-enter');
  };

  const removeDocumentField = (index) =>
    setDocsRequired((prev) => prev.filter((_, i) => i !== index));

  const updateDocumentField = (index, value, field) => {
    setDocsRequired((prev) =>
      prev.map((doc, i) => {
        if (i !== index) return doc;
        if (field === 'name') return { ...doc, name: value };
        if (field === 'mandatory') return { ...doc, mandatory: value === 'true' };
        return doc;
      })
    );
  };

  // ---------- Q&A rows ----------
  const addQuestionAnswer = () => {
    setQuestionAnswers((prev) => [...prev, { question: '', answer: '' }]);
    revealNewRow('#editJobForm .qa-row.qa-row-enter');
  };

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

  // ---------- benefits / skills multi-select ----------
  const toggleInArray = (field, value) =>
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));

  // ---------- file validation ----------
  const validateVideoFile = (file) => {
    if (!file) return true;
    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['mp4', 'mov', 'avi'];
    const maxSize = 50 * 1024 * 1024;
    if (!allowed.includes(ext)) {
      alert('Invalid file format! Only MP4, MOV, and AVI files are allowed.');
      return false;
    }
    if (file.size > maxSize) {
      alert('File size too large! Maximum allowed size is 50MB.');
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
    if (validateVideoFile(file)) setJobVideo(file || null);
    else e.target.value = '';
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (validateImageFile(file)) setJobVideoThumbnail(file || null);
    else e.target.value = '';
  };

  useEffect(() => {
    if (!jobVideo) {
      setVideoPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(jobVideo);
    setVideoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [jobVideo]);

  useEffect(() => {
    if (!jobVideoThumbnail) {
      setThumbnailPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(jobVideoThumbnail);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [jobVideoThumbnail]);

  const getKeyFromS3Url = (url) => {
    const s3BaseUrl = 'https://mipie-bucket.s3.ap-south-1.amazonaws.com/';
    return url.replace(s3BaseUrl, '');
  };

  const removeExistingVideo = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/deleteSingleFile`,
        { key: getKeyFromS3Url(existingVideo) },
        authHeaders
      );
      await axios.post(`${backendUrl}/company/removeVideoJd/${id}`, {}, authHeaders);
      setExistingVideo('');
    } catch (err) {
      console.error(err.message);
    }
  };

  const removeExistingThumbnail = async () => {
    try {
      await axios.post(
        `${backendUrl}/api/deleteSingleFile`,
        { key: getKeyFromS3Url(existingThumbnail) },
        authHeaders
      );
      await axios.post(`${backendUrl}/company/removeVideoThuumbnailJd/${id}`, {}, authHeaders);
      setExistingThumbnail('');
    } catch (err) {
      console.error(err.message);
    }
  };

  // ---------- validation ----------
  const validate = () => {
    const newErrors = {};

    if (!form.vertical) newErrors.vertical = 'Please select a vertical';
    if (!form.project) newErrors.project = 'Please select a project';
    if (!form.center) newErrors.center = 'Please select a center';
    if (!form.title.trim()) newErrors.title = 'Enter job title';
    if (!form.place?.trim() && !workLocRef.current?.value?.trim()) {
      newErrors.location = 'Select a work location from the suggestions';
    }
    if (!form._industry) newErrors.industry = 'Please select an industry';
    if (!form.experience) newErrors.experience = 'Please select experience';
    if (!form._qualification) newErrors.qualification = 'Please select qualification';
    if (hasStreamOptions && form._subQualification.length === 0)
      newErrors.subQualification = 'Please select a stream';
    if (!form.validity) newErrors.validity = 'Please select validity date';
    if (!form.state) newErrors.state = 'Please select state';
    if (!form.city) newErrors.city = 'Please select city';
    if (form.ageMin && form.ageMax && Number(form.ageMin) > Number(form.ageMax))
      newErrors.ageGroup = 'Enter a valid age group';
    if (!form.jobType) newErrors.jobType = 'Please select job type';
    if (!form.shiftTimingFrom || !form.shiftTimingTo) newErrors.shiftTiming = 'Please enter shift timing';
    if (!form.compensation) newErrors.compensation = 'Please select compensation';
    if (!form.pay) newErrors.pay = 'Please select pay type';
    if (!form.work) newErrors.work = 'Please select work type';
    if (!form.isFixed) newErrors.salaryRange = 'Please choose fixed or a defined range';
    if (!form._company) newErrors.company = 'Please select a company';
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
    if (Object.keys(newErrors).length) {
      alert('Please fill the required fields before saving.');
      return false;
    }
    return true;
  };

  // ---------- submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;

    const creditsLeft = Number(company.creditLeft || 0);
    const coinsNeeded = Number(coinsRequired?.contactcoins || 0);
    const isContactChecked = form.isContact === 'true';

    if (creditsLeft < coinsNeeded && !isContactChecked && !form.isedited) {
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
        if (key === '_subQualification') {
          selectedStreams().forEach((v) => formData.append(`${key}[]`, v));
        } else if (['benifits', 'collegeAcNo', '_techSkills', '_nonTechSkills'].includes(key)) {
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
      formData.append(
        'docsRequired',
        JSON.stringify(
          docsRequired
            .filter((doc) => doc.name.trim())
            .map((doc) => ({
              Name: doc.name.trim(),
              mandatory: !!doc.mandatory,
            }))
        )
      );
      if (jobVideo) formData.append('jobVideo', jobVideo);
      if (jobVideoThumbnail) formData.append('jobVideoThumbnail', jobVideoThumbnail);

      const res = await axios.post(`${backendUrl}/college/job/edit/${id}`, formData, {
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status || res.status === 200) {
        navigate('/institute/viewjob');
      } else {
        alert(res.data?.message || 'Failed to update job');
      }
    } catch (err) {
      console.error('Error updating the job:', err.message);
      alert(err.response?.data?.message || err.message || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  // ---------- coin offers / voucher / razorpay ----------
  const loadCoinOffers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/company/getCoinOffers`, authHeaders);
      setCoinOffers(asArray(res.data));
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
        if (res.data.amount === 0) window.location.reload();
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
    if (!voucher.trim()) makePayment();
    else checkVoucher();
  };

  return (
    <div className="content-body" id="editJobPage">
      <div className="job-page-header">
        <div className="job-page-header__main">
          <div className="job-page-header__icon">
            <i className="fa fa-briefcase"></i>
          </div>
          <div>
            <h2>{readOnly ? 'View Job' : 'Edit Job'}</h2>
            <p>
              <a href="/institute/dashboard">Home</a>
              <span>›</span>
              <span>{readOnly ? 'View Job' : 'Edit Job'}</span>
            </p>
          </div>
        </div>
        <div className="job-page-header__actions">
          <button
            type="button"
            className="job-page-header__link"
            onClick={() => navigate('/institute/viewjob')}
          >
            All Job Details
          </button>
          {!readOnly && (
            <button
              type="button"
              className="job-page-header__save"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Saving...' : 'Update Job'}
            </button>
          )}
        </div>
      </div>
      <form onSubmit={handleSubmit} id="editJobForm">
        <fieldset disabled={readOnly} style={readOnly ? { border: 0, padding: 0, margin: 0 } : undefined}>
        <section>
          <div className="row">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card mt-2">
                <div className="card-header border border-top-0 border-left-0 border-right-0">
                  <h4 className="card-title pb-1">{readOnly ? 'View Job Description' : 'Edit Job Description'}</h4>
                </div>
                <div className="card-content" id="jd-info">
                  <div className="card-body">
                    <div className="row">
                      <div className={`col-xl-3 mb-1 ${errors.vertical ? 'error' : ''}`}>
                        <label>Vertical</label><span className="mandatory"> *</span>
                        <select
                          className="form-control"
                          value={form.vertical}
                          onChange={(e) => updateMappingField('vertical', e.target.value)}
                          disabled={readOnly}
                        >
                          <option value="">Select Vertical</option>
                          {asArray(verticals).map((item) => (
                            <option key={item._id || item.id} value={item._id || item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.project ? 'error' : ''}`}>
                        <label>Project</label><span className="mandatory"> *</span>
                        <select
                          className="form-control"
                          value={form.project}
                          onChange={(e) => updateMappingField('project', e.target.value)}
                          disabled={readOnly || !form.vertical}
                        >
                          <option value="">Select Project</option>
                          {asArray(projects).map((item) => (
                            <option key={item._id || item.id} value={item._id || item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.center ? 'error' : ''}`}>
                        <label>Center</label><span className="mandatory"> *</span>
                        <select
                          className="form-control"
                          value={form.center}
                          onChange={(e) => updateMappingField('center', e.target.value)}
                          disabled={readOnly || !form.project}
                        >
                          <option value="">Select Center</option>
                          {asArray(centers).map((item) => (
                            <option key={item._id || item.id} value={item._id || item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.company ? 'error' : ''}`}>
                        <label>Company</label><span className="mandatory"> *</span>
                        <select
                          className="form-control"
                          value={form._company}
                          onChange={(e) => updateField('_company', e.target.value)}
                          disabled={readOnly}
                        >
                          <option value="">Select company</option>
                          {asArray(companyList).map((item) => (
                            <option key={item._id} value={item._id} className="text-capitalize">
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.organizationName ? 'error' : ''}`}>
                        <label>Display Organization Name</label><span className="mandatory"> *</span>
                        <input
                          className="form-control"
                          type="text"
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

                      <div className="col-xl-3 mb-1">
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
                          onChange={handleQualificationChange}
                        >
                          <option value="">Select option</option>
                          {asArray(qualificationList).map((item) => (
                            <option key={item._id} value={item._id} className="text-capitalize">
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`col-xl-3 mb-1 ${errors.subQualification ? 'error' : ''}`}>
                        <label>Stream</label>
                        {hasStreamOptions && !readOnly ? <span className="mandatory"> *</span> : null}
                        {readOnly ? (
                          <input
                            type="text"
                            className="form-control"
                            disabled
                            value={streamLabel || '—'}
                          />
                        ) : (
                          <>
                            <div ref={streamRef} style={{ display: hasStreamOptions ? 'block' : 'none' }} />
                            {!hasStreamOptions && (
                              <input
                                type="text"
                                className="form-control"
                                disabled
                                placeholder={form._qualification ? 'No stream available for this qualification' : 'Select qualification first'}
                              />
                            )}
                          </>
                        )}
                      </div>

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
                      <div className="work-location-field">
                        <i className="fas fa-location-dot" aria-hidden="true"></i>
                        <input
                          type="text"
                          ref={workLocRef}
                          className="form-control"
                          value={form.place}
                          id="work-loc"
                          placeholder="Search work location"
                          onChange={(e) => updateField('place', e.target.value)}
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
                      {errors.ageGroup && <div className="text-danger">{errors.ageGroup}</div>}
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
                    <div className="col-xl-3 mb-1">
                      <div className="demo-inline-spacing">
                        <label>Shift</label>
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

                    <div className={`col-xl-3 mb-1 ${errors.shiftTiming ? 'error' : ''}`} id="shift-field">
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
                      {readOnly ? (
                        <input
                          type="text"
                          className="form-control"
                          disabled
                          value={benefitsLabel || '—'}
                        />
                      ) : (
                        <div ref={benefitsRef} />
                      )}
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

          {/* ---------- Payout / skills / salary ---------- */}
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
                      <label>Tech Skills Required</label>
                      <select
                        className="form-control"
                        multiple
                        value={form._techSkills}
                        onChange={(e) =>
                          updateField('_techSkills', Array.from(e.target.selectedOptions, (o) => o.value))
                        }
                      >
                        {asArray(techSkillsList).map((item) => (
                          <option key={item._id} value={item._id} className="text-capitalize">
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-xl-3 mb-1">
                      <label>Non Tech Skills Required</label>
                      <select
                        className="form-control"
                        multiple
                        value={form._nonTechSkills}
                        onChange={(e) =>
                          updateField('_nonTechSkills', Array.from(e.target.selectedOptions, (o) => o.value))
                        }
                      >
                        {asArray(nonTechSkillsList).map((item) => (
                          <option key={item._id} value={item._id} className="text-capitalize">
                            {item.name}
                          </option>
                        ))}
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
                        <input
                          className="form-control"
                          placeholder="Fixed amount"
                          type="number"
                          value={form.amount}
                          onChange={(e) => {
                            if (e.target.value.length <= 10) updateField('amount', e.target.value);
                          }}
                        />
                      )}
                    </div>

                    {form.isFixed === 'false' && (
                      <div className="col-xl-3">
                        <br />
                        <label>&nbsp;</label>
                        <input
                          className="form-control mb-1"
                          placeholder="Minimum"
                          type="number"
                          value={form.min}
                          onChange={(e) => {
                            if (e.target.value.length <= 10) updateField('min', e.target.value);
                          }}
                        />
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
                    )}
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
                    <label className="px-1 h1 col-6">Do you want job public ?</label>
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

          <section id="studentDocsRequired">
            <div className="row">
              <div className="col-xl-12 col-lg-12 px-3">
                <div className="card mt-1">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Student Documents Required</h4>
                  </div>
                  <div className="card-content">
                    <div className="card-body">
                      <div id="documentContainer">
                        {docsRequired.map((doc, index) => (
                          <div className={`row requiredDocsRow${index === docsRequired.length - 1 ? ' qa-row-enter' : ''}`} key={index}>
                            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 mb-1">
                              <label>Document Name</label>
                              <input
                                type="text"
                                className="form-control docsName"
                                value={doc.name}
                                onChange={(e) => updateDocumentField(index, e.target.value, 'name')}
                              />
                            </div>
                            <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 mb-1">
                              <label>Mandatory</label>
                              <select
                                name="mandatory-doc"
                                className="form-control"
                                value={String(!!doc.mandatory)}
                                onChange={(e) => updateDocumentField(index, e.target.value, 'mandatory')}
                              >
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            </div>
                            <div className="col-xl-2 col-lg-2 col-md-4 col-sm-12 mb-1 d-flex align-items-end">
                              <button
                                type="button"
                                onClick={() => removeDocumentField(index)}
                                style={{
                                  background: 'white',
                                  color: '#ef4444',
                                  border: '1.5px solid #ef4444',
                                  borderRadius: '8px',
                                  padding: '8px 14px',
                                  fontWeight: 600,
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <i className="fa fa-trash" style={{ marginRight: '5px' }}></i>
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="d-flex justify-content-end mt-1">
                        <button
                          type="button"
                          className="btn btn-success text-white add-another-button"
                          onClick={addDocumentField}
                        >
                          {docsRequired.length > 0 ? 'Add Another' : 'Add Document'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- Questions & Answers ---------- */}
          <div className="row">
            <div className="col-xl-12 col-lg-12 px-3">
              <div className="card mt-1">
                <div className="card-body">
                  {questionAnswers.map((qa, index) => (
                    <div className={`row qa-row${index === questionAnswers.length - 1 ? ' qa-row-enter' : ''}`} key={index}>
                      <div className="col-12 col-xl-6 mb-1">
                        <label>Question</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={qa.question}
                          onChange={(e) => updateQuestionAnswer(index, 'question', e.target.value)}
                        />
                      </div>
                      <div className="col-12 col-xl-6 mb-1">
                        <label>Answer</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={qa.answer}
                          onChange={(e) => updateQuestionAnswer(index, 'answer', e.target.value)}
                        />
                      </div>
                      {questionAnswers.length > 1 && (
                        <div className="col-12 mb-2 d-flex justify-content-end">
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeQuestionAnswer(index)}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="d-flex justify-content-end mt-1">
                    <button type="button" className="btn btn-success text-white add-another-button" onClick={addQuestionAnswer}>
                      + Add Another
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Job description + media ---------- */}
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

          <section id="jobAddDocs">
            <div className="row">
              <div className="col-xl-12 col-lg-12 px-3">
                <div className="card mt-1">
                  <div className="card-header border border-top-0 border-left-0 border-right-0">
                    <h4 className="card-title pb-1">Add Docs</h4>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 mb-1">
                        <div className="job-upload-card">
                          <h5>Videos</h5>
                          <div className="job-upload-preview">
                            {videoPreview || existingVideo ? (
                              <div className="position-relative w-100">
                                <video controls style={{ width: '100%', maxHeight: '130px', borderRadius: '5px' }}>
                                  <source src={videoPreview || existingVideo} type="video/mp4" />
                                </video>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger position-absolute"
                                  style={{ right: '5px', top: '5px', zIndex: 10 }}
                                  onClick={() => (videoPreview ? setJobVideo(null) : removeExistingVideo())}
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </div>
                            ) : (
                              <p>No videos uploaded</p>
                            )}
                          </div>
                          <label htmlFor="jobVideo">{videoPreview || existingVideo ? 'Replace Video' : 'Add Video'}</label>
                          <input
                            id="jobVideo"
                            accept="video/mp4, video/mov, video/avi"
                            type="file"
                            onChange={handleVideoChange}
                          />
                        </div>
                      </div>
                      <div className="col-xl-3 col-lg-3 col-md-6 col-sm-12 mb-1">
                        <div className="job-upload-card">
                          <h5>Thumbnails</h5>
                          <div className="job-upload-preview">
                            {thumbnailPreview || existingThumbnail ? (
                              <div className="position-relative w-100">
                                <img
                                  src={thumbnailPreview || existingThumbnail}
                                  alt="Thumbnail"
                                  style={{ width: '100%', maxHeight: '130px', objectFit: 'cover', borderRadius: '5px' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger position-absolute"
                                  style={{ right: '5px', top: '5px', zIndex: 10 }}
                                  onClick={() => (thumbnailPreview ? setJobVideoThumbnail(null) : removeExistingThumbnail())}
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </div>
                            ) : (
                              <p>No thumbnails uploaded</p>
                            )}
                          </div>
                          <label htmlFor="jobThumbnail">{thumbnailPreview || existingThumbnail ? 'Replace Thumbnail' : 'Add New Thumbnail'}</label>
                          <input
                            id="jobThumbnail"
                            accept="image/*"
                            type="file"
                            onChange={handleThumbnailChange}
                          />
                        </div>
                      </div>
                    </div>
                    {!readOnly && (
                      <div className="col-xl-12 mb-1 px-0 text-right">
                        <button
                          type="submit"
                          className="btn btn-success waves-effect waves-light text-white"
                          disabled={loading}
                        >
                          {loading ? 'Saving...' : 'Update Job'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
        </fieldset>
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
                      {asArray(coinOffers).map((offer) => (
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
      <style>{`
        #editJobPage,
        #editJobPage label,
        #editJobPage .form-control,
        #editJobPage .card-title,
        #editJobPage button,
        #editJobPage p,
        #editJobPage h2,
        #editJobPage h4,
        #editJobPage h5,
        #editJobPage textarea,
        #editJobPage select,
        #editJobPage option {
          font-family: 'Open Sans', sans-serif !important;
        }
        #editJobPage {
          background: #f1f5f9;
          min-height: 100vh;
        }
        #editJobPage .job-page-header {
          background: linear-gradient(90deg, #E11D48, #ff5770);
          border-radius: 16px;
          padding: 24px 32px;
          margin: 0 12px 28px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 10px 25px rgba(252, 43, 90, 0.35);
        }
        #editJobPage .job-page-header__main,
        #editJobPage .job-page-header__actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        #editJobPage .job-page-header__icon {
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 22px;
        }
        #editJobPage .job-page-header h2 {
          margin: 0 !important;
          font-weight: 700 !important;
          font-size: 22px !important;
          letter-spacing: -0.02em;
          color: white !important;
        }
        #editJobPage .job-page-header p {
          margin: 4px 0 0 !important;
          opacity: 0.85;
          font-size: 13px !important;
          line-height: 1.4 !important;
          color: white !important;
        }
        #editJobPage .job-page-header p a {
          color: rgba(255,255,255,0.85);
          text-decoration: none;
        }
        #editJobPage .job-page-header p span {
          margin: 0 8px;
          opacity: 0.7;
        }
        #editJobPage .job-page-header__link {
          background: rgba(255,255,255,0.16);
          color: white !important;
          border: 1.5px solid rgba(255,255,255,0.7);
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 13px !important;
          font-weight: 600;
        }
        #editJobPage .job-page-header__save,
        #editJobPage button[type="submit"] {
          background: white !important;
          color: #E11D48 !important;
          border: none !important;
          border-radius: 10px !important;
          padding: 8px 16px !important;
          font-size: 13px !important;
          font-weight: 700 !important;
        }
        #editJobPage .card {
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04) !important;
          margin-bottom: 24px !important;
        }
        #editJobPage .card-header {
          display: flex !important;
          align-items: center !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 20px 24px 16px !important;
          background: transparent !important;
        }
        #editJobPage .card-title {
          font-size: 0.95rem !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          letter-spacing: -0.01em !important;
          margin-bottom: 0 !important;
          padding-left: 14px !important;
          position: relative !important;
        }
        #editJobPage .card-title::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 18px;
          background: linear-gradient(135deg, #FC2B5A, #764ba2);
          border-radius: 4px;
        }
        #editJobPage .card-body {
          padding: 20px 24px 24px !important;
        }
        #editJobPage label {
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #64748b !important;
          margin-bottom: 6px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        #editJobPage .mandatory {
          color: #ef4444 !important;
          font-size: 12px !important;
          text-transform: none !important;
        }
        #editJobPage .form-control,
        #editJobPage textarea.form-control,
        #editJobPage select.form-control {
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 10px !important;
          padding: 9px 14px !important;
          height: auto !important;
          min-height: 42px !important;
          font-size: 14px !important;
          color: #1e293b !important;
          background: #f8fafc !important;
          box-shadow: none !important;
        }
        #editJobPage .form-control:focus {
          border-color: #FC2B5A !important;
          box-shadow: 0 0 0 3px rgba(252, 43, 90, 0.12) !important;
          background: #ffffff !important;
        }
        #editJobPage .add-another-button {
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease !important;
        }
        #editJobPage .add-another-button:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }
        #editJobPage .add-another-button:active {
          transform: scale(0.98);
        }
        @keyframes qaSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        #editJobPage .qa-row-enter {
          animation: qaSlideIn 0.35s ease;
        }
        #editJobPage .work-location-field {
          position: relative;
          margin-bottom: 8px;
        }
        #editJobPage .work-location-field i {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #E11D48;
          font-size: 16px;
          z-index: 2;
          pointer-events: none;
        }
        #editJobPage .work-location-field .form-control {
          padding-left: 38px !important;
        }
        #jd-info,
        #jd-info .card,
        #jd-info .card-body,
        #jd-info .card-content,
        .choices {
          overflow: visible !important;
        }
        .choices__list--dropdown,
        .choices__list[aria-expanded] {
          z-index: 1100 !important;
          max-height: 220px;
          overflow: auto;
        }
        fieldset[disabled] .form-control,
        fieldset[disabled] .form-check-input {
          background-color: #f3f3f3 !important;
          pointer-events: none;
        }

        #studentDocsRequired .card {
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04) !important;
        }
        #studentDocsRequired .card-header {
          display: flex !important;
          align-items: center !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 20px 24px 16px !important;
          background-color: transparent !important;
        }
        #studentDocsRequired .card-title {
          font-family: 'Open Sans', sans-serif !important;
          font-size: 0.95rem !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          letter-spacing: -0.01em !important;
          margin-bottom: 0 !important;
          padding-left: 14px !important;
          position: relative !important;
        }
        #studentDocsRequired .card-title::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 18px;
          background: linear-gradient(135deg, #FC2B5A, #764ba2);
          border-radius: 4px;
        }
        #studentDocsRequired label {
          font-family: 'Open Sans', sans-serif !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #64748b !important;
          margin-bottom: 6px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        #studentDocsRequired .form-control {
          font-family: 'Open Sans', sans-serif !important;
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 10px !important;
          padding: 9px 14px !important;
          height: auto !important;
          min-height: 42px !important;
          font-size: 14px !important;
          color: #1e293b !important;
          background: #f8fafc !important;
          box-shadow: none !important;
        }
        #studentDocsRequired .add-another-button {
          background: linear-gradient(135deg, #10b981, #059669) !important;
          border: none !important;
          border-radius: 10px !important;
          padding: 9px 20px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          font-family: 'Open Sans', sans-serif !important;
          color: white !important;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3) !important;
        }
        #studentDocsRequired .requiredDocsRow {
          border-bottom: 1px solid #f1f5f9 !important;
          padding-bottom: 12px !important;
          margin-bottom: 4px !important;
        }

        #jobAddDocs .card {
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04) !important;
        }
        #jobAddDocs .card-header {
          display: flex !important;
          align-items: center !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 20px 24px 16px !important;
          background: transparent !important;
        }
        #jobAddDocs .card-title {
          font-family: 'Open Sans', sans-serif !important;
          font-size: 0.95rem !important;
          font-weight: 700 !important;
          color: #1e293b !important;
          margin-bottom: 0 !important;
          padding-left: 14px !important;
          position: relative !important;
        }
        #jobAddDocs .card-title::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 18px;
          background: linear-gradient(135deg, #FC2B5A, #764ba2);
          border-radius: 4px;
        }
        #jobAddDocs .job-upload-card {
          border-radius: 14px;
          border: 2px dashed #cbd5e1;
          background: #fafbfc;
          padding: 8px 10px 12px;
          height: 100%;
        }
        #jobAddDocs .job-upload-card h5 {
          font-size: 13px !important;
          font-weight: 700 !important;
          color: #475569 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.06em !important;
          text-align: center;
          margin: 8px 0 10px !important;
        }
        #jobAddDocs .job-upload-preview {
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 14px;
          text-align: center;
        }
        #jobAddDocs .job-upload-preview p {
          margin: 0 !important;
          color: #64748b !important;
          font-size: 14px !important;
          line-height: 1.4 !important;
        }
        #jobAddDocs label {
          font-family: 'Open Sans', sans-serif !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #64748b !important;
          margin: 8px 0 6px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
        #jobAddDocs input[type="file"] {
          font-size: 12px !important;
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          background: white !important;
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}

export default EditJob;