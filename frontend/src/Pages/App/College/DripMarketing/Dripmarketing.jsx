import React, { useState, useEffect } from 'react'
import DatePicker from 'react-date-picker';
import axios from 'axios';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

// Add CSS styles for multiselect
const multiselectStyles = `
    .multiselect-dropdown .dropdown-arrow {
        transition: transform 0.2s ease;
        font-size: 12px;
    }
    .multiselect-dropdown .dropdown-arrow.open {
        transform: rotate(180deg);
    }
    .multiselect-option:hover {
        background-color: #f8f9fa;
    }
    .multiselect-options {
        max-height: 200px;
        overflow-y: auto;
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = multiselectStyles;
    document.head.appendChild(styleSheet);
}

// Multiselect Component
const MultiselectDropdown = ({ options, value, onChange, placeholder = "Select options" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValues, setSelectedValues] = useState(value || []);

    useEffect(() => {
        setSelectedValues(value || []);
    }, [value]);

    const handleToggle = (optionValue) => {
        const newValues = selectedValues.includes(optionValue)
            ? selectedValues.filter(val => val !== optionValue)
            : [...selectedValues, optionValue];

        setSelectedValues(newValues);
        onChange(newValues);
    };

    const getSelectedLabels = () => {
        return selectedValues.map(val => {
            const option = options.find(opt => opt.value === val);
            return option ? option.label : val;
        });
    };

    return (
        <div className="multiselect-dropdown position-relative">
            <div
                className="form-select d-flex align-items-center justify-content-between"
                style={{ cursor: 'pointer' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>
                    {selectedValues.length === 0
                        ? placeholder
                        : selectedValues.length === 1
                            ? getSelectedLabels()[0]
                            : `${selectedValues.length} selected`
                    }
                </span>
                <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </div>

            {isOpen && (
                <div className="multiselect-options position-absolute w-100 bg-white border rounded shadow" style={{ zIndex: 10, top: '100%' }}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className="multiselect-option p-2 d-flex align-items-center"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleToggle(option.value)}
                        >
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(option.value)}
                                onChange={() => { }} 
                                className="me-2"
                            />
                            <span>{option.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const DripMarketing = () => {
    // Backend configuration
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;

    const [showPopup, setShowPopup] = useState(false);
    const [popupIndex, setPopupIndex] = useState(null);
    const [rules, setRules] = useState([]);
    const [modalMode, setModalMode] = useState('add');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    
    const [statuses, setStatuses] = useState([]);
    const [subStatuses, setSubStatuses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedSubStatus, setSelectedSubStatus] = useState('');
    const [verticals, setVerticals] = useState([]);
    const [projects , setProjects] = useState([]);
    const [selectedVertical, setSelectedVertical] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);



    useEffect(() => {
        fetchRules();
        fetchStatuses();
    }, []);

    // Clear sub-statuses when statuses change
    useEffect(() => {
        setSubStatuses([]);
        setSelectedSubStatus('');
    }, [statuses]);

    useEffect(() => {
        fetchVerticals();
    }, [token]);

 const [dropdownStates, setDropdownStates] = useState({
  verticals: false,
  projects: false,
  statuses: false,
  subStatuses: false
 });

  // Add this useEffect to handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any multi-select dropdown
      const isMultiSelectClick = event.target.closest('.multiselect-dropdown');

      if (!isMultiSelectClick) {
        // Close all dropdowns
        setDropdownStates(prev =>
          Object.keys(prev).reduce((acc, key) => {
            acc[key] = false;
            return acc;
          }, {})
        );
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


    useEffect(() => {
        // Only fetch projects if we have verticals loaded and a token
        if (verticals.length > 0 && token) {
            // Initially fetch all projects (no vertical selected)
            fetchProjects();
        }
    }, [verticals, token]);


    const handleVerticalChange = (verticalId) => {
        console.log('handleVerticalChange called with verticalId:', verticalId);
        
        const selectedVertical = verticals.find(v => v.id === verticalId);
        setSelectedVertical(selectedVertical);
        
        // Clear current projects and fetch new ones for the selected vertical
        setProjects([]);
        if (verticalId) {
            fetchProjects(verticalId);
        } else {
            // If no vertical selected, fetch all projects
            fetchProjects();
        }
    };

    // Function to clear vertical selection and fetch all projects
    const clearVerticalSelection = () => {
        setSelectedVertical(null);
        setProjects([]);
        fetchProjects(); // Fetch all projects
    };

    
    const fetchVerticals = async () => {
        try {
            if (!token) {
                console.warn('No token found in session storage.');
                return;
            }

            const newVertical = await axios.get(`${backendUrl}/college/dripmarketing/getVerticals`, { headers: { 'x-auth': token } });
    
    
            // Check if data exists and is an array
            if (newVertical.data && newVertical.data.data && Array.isArray(newVertical.data.data)) {
                const verticalList = newVertical.data.data.map(v => ({
                    id: v._id,
                    name: v.name,
                    status: v.status === true ? 'active' : 'inactive',
                    code: v.description,
                    projects: v.projects, 
                    createdAt: v.createdAt
                }));
    
                setVerticals(verticalList);
            } else {
                console.warn('No verticals data found or data is not an array');
                setVerticals([]);
            }
        } catch (error) {
            console.error('Error fetching verticals:', error);
            setVerticals([]);
        }
    };

    const fetchProjects = async (selectedVerticalId = null) => {
              
        // Use the passed parameter or fall back to selectedVertical
        let verticalId = selectedVerticalId || selectedVertical?.id;
        
        console.log('Using verticalId:', verticalId);
        
        if (!token) {
            console.warn('No authentication token available');
            setError('Authentication required');
            return;
        }
    
        setLoading(true);
        setError(null);
    
        try {
            let url = `${backendUrl}/college/dripmarketing/list-projects`;

            // Only add vertical parameter if a specific vertical is selected
            if (verticalId) {
                url += `?vertical=${verticalId}`;
            }
           
            
            console.log('Fetching projects from URL:', url);
            
            const response = await axios.get(url, {
                headers: {
                    'x-auth': token,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('Projects API response:', response.data);
            
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                setProjects(response.data.data);
                console.log(`Projects set successfully: ${response.data.data.length} projects found`);
            } else {
                console.warn('Unexpected response format:', response.data);
                setProjects([]);
                setError('No projects found');
            }
        } catch (err) {
            console.error('Fetch projects error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load projects');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };
    
    // const fetchCenters = async () => {
    //     // Get projectId from selectedProject prop or URL (for refresh cases)
    //     const projectId = selectedProject?._id || new URLSearchParams(window.location.search).get('projectId');
        
    //     if (!projectId) {
    //         console.warn('No projectId available from selectedProject or URL');
    //         setCenters([]);
    //         setError('No project context available');
    //         return;
    //     }

    //     setLoading(true);
    //     setError(null);
    //     try {
    //         const response = await fetch(`${backendUrl}/college/list-centers?projectId=${projectId}`, {
    //             headers: {
    //                 'x-auth': token,
    //             },
    //         });
    //         if (!response.ok) throw new Error('Failed to fetch centers');

    //         const data = await response.json();
    //         if (data.success) {
    //             setCenters(data.data);
    //         } else {
    //             setError('Failed to load centers');
    //         }
    //     } catch (err) {
    //         setError(err.message);
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    // Fetch all statuses
   
    const fetchStatuses = async () => {
        try {
            if (!token) {
                console.warn('No token found in session storage.');
                return;
            }

            const response = await axios.get(`${backendUrl}/college/status`, {
                headers: { 'x-auth': token }
            });

            if (response.data.success) {
                setStatuses(response.data.data);
                console.log('Statuses fetched:', response.data.data);
            }
        } catch (error) {
            console.error('Error fetching statuses:', error);
        }
    };

    // Fetch sub-statuses based on selected status
    const fetchSubStatuses = async (statusId) => {
        try {
            if (!statusId || !token) {
                setSubStatuses([]);
                return;
            }

            const response = await axios.get(`${backendUrl}/college/status/${statusId}/substatus`, {
                headers: { 'x-auth': token }
            });

            if (response.data.success) {
                setSubStatuses(response.data.data);
                console.log('Sub-statuses fetched:', response.data.data);
            }
        } catch (error) {
            console.error('Error fetching sub-statuses:', error);
        }
    };

    // Handle status change
    const handleStatusChange = (statusId) => {
        setSelectedStatus(statusId);
        setSelectedSubStatus(''); 
        fetchSubStatuses(statusId);
    };

    const fetchRules = async () => {
        setRules([
            {
                id: 0,
                description: "Webinar for International Nursing Jobs",
                createdBy: "Mr. Parveen Bansal",
                createdOn: "Aug 8, 2024 5:51 PM",
                startTime: "Aug 8, 2024 6:30 PM",
                active: true
            },
            {
                id: 1,
                description: "Webinar for International Nursing Jobs",
                createdBy: "Mr. Parveen Bansal",
                createdOn: "Aug 8, 2024 5:51 PM",
                startTime: "Aug 8, 2024 6:30 PM",
                active: true
            }
        ]);
    }


    const [activeTab, setActiveTab] = useState({});
    const [condition, setCondition] = useState([]);
    const [conditions, setConditions] = useState([]);

    const handleDropdown = (index) => {
        setShowPopup(!showPopup);
        setPopupIndex(index);

    }

    const [activetab, setActivetab] = useState('rule');
    const [logicOperator, setLogicOperator] = useState('and');

    const [subLogicOperator, setSubLogicOperator] = useState('and');
    const [conditionSelections, setConditionSelections] = useState([]);
    const [conditionOperators, setConditionOperators] = useState([]);
    const [conditionValues, setConditionValues] = useState([]);
    const [subConditionSelections, setSubConditionSelections] = useState([]);
    const [subConditionOperators, setSubConditionOperators] = useState([]);
    const [subConditionValues, setSubConditionValues] = useState([]);
    const [thenFirst, setThenFirst] = useState('');
    const [thenShouldBe, setThenShouldBe] = useState([]);
    const [thenExecType, setThenExecType] = useState('');
    const [thenMode, setThenMode] = useState('');
    const [thenCount, setThenCount] = useState('');
    const [thenCondition, setThenCondition] = useState([]);
    const [thenConditions, setThenConditions] = useState([]);
    const [thenConditionSelections, setThenConditionSelections] = useState([]);
    const [thenSubConditionSelections, setThenSubConditionSelections] = useState([]);

    const [startDate, setStartDate] = useState(null);
    const [startTime, setStartTime] = useState('');

    // Mapping of activity types to their corresponding value options
    const activityTypeValueOptions = {
        campaign: [
            { value: "nursing_campaign", label: "Nursing Campaign" },
            { value: "healthcare_campaign", label: "Healthcare Campaign" },
            { value: "education_campaign", label: "Education Campaign" }
        ],
        channels: [
            { value: "facebook", label: "Facebook" },
            { value: "instagram", label: "Instagram" },
            { value: "google_ads", label: "Google Ads" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "email", label: "Email" }
        ],
        city: [
            { value: "mumbai", label: "Mumbai" },
            { value: "delhi", label: "Delhi" },
            { value: "bangalore", label: "Bangalore" },
            { value: "chennai", label: "Chennai" },
            { value: "kolkata", label: "Kolkata" }
        ],
        state: [
            { value: "maharashtra", label: "Maharashtra" },
            { value: "delhi", label: "Delhi" },
            { value: "karnataka", label: "Karnataka" },
            { value: "tamil_nadu", label: "Tamil Nadu" },
            { value: "west_bengal", label: "West Bengal" }
        ],
        status: [],
        subStatus: [], 
        leadOwner: [
            { value: "john_doe", label: "John Doe" },
            { value: "jane_smith", label: "Jane Smith" },
            { value: "mike_johnson", label: "Mike Johnson" }
        ],
        registeredBy: [
            { value: "website", label: "Website" },
            { value: "mobile_app", label: "Mobile App" },
            { value: "walk_in", label: "Walk In" },
            { value: "referral", label: "Referral" }
        ],
        courseName: [
            { value: "nursing_course", label: "Nursing Course" },
            { value: "healthcare_course", label: "Healthcare Course" },
            { value: "medical_course", label: "Medical Course" }
        ],
        jobName: [
            { value: "nurse", label: "Nurse" },
            { value: "doctor", label: "Doctor" },
            { value: "pharmacist", label: "Pharmacist" },
            { value: "lab_technician", label: "Lab Technician" }
        ],
        email: [
            { value: "has_email", label: "Has Email" },
            { value: "no_email", label: "No Email" },
            { value: "verified_email", label: "Verified Email" }
        ],
        mobile: [
            { value: "has_mobile", label: "Has Mobile" },
            { value: "no_mobile", label: "No Mobile" },
            { value: "verified_mobile", label: "Verified Mobile" }
        ],
        createdDate: [
            { value: "today", label: "Today" },
            { value: "yesterday", label: "Yesterday" },
            { value: "this_week", label: "This Week" },
            { value: "this_month", label: "This Month" }
        ],
        modificationDate: [
            { value: "today", label: "Today" },
            { value: "yesterday", label: "Yesterday" },
            { value: "this_week", label: "This Week" },
            { value: "this_month", label: "This Month" }
        ],
        project: [],
        vertical: [],
        batch: [
            { value: "batch_1", label: "Batch 1" },
            { value: "batch_2", label: "Batch 2" },
            { value: "batch_3", label: "Batch 3" }
        ]
    };

    // Function to get value options based on selected activity type
    const getValueOptions = (activityType) => {
        if (activityType === 'status') {
            return statuses.map(status => ({
                value: status._id,
                label: status.title
            }));
        } else if (activityType === 'subStatus') {
            return subStatuses.map(subStatus => ({
                value: subStatus._id,
                label: subStatus.title
            }));
        } else if (activityType === 'vertical') {
            return verticals.map(vertical => ({
                value: vertical.id,
                label: vertical.name
            }));
        } else if (activityType === 'project') {
            return projects.map(project => ({
                value: project._id,
                label: project.name
            }));
        }
        return activityTypeValueOptions[activityType] || [];
    };

    // Mapping for THEN section value options
    const thenValueOptions = {
        campaign: [ // Campaign
            { value: "bulk_upload", label: "Bulk Upload" },
            { value: "digital_organic", label: "Digital Organic" },
            { value: "social_media", label: "Social Media" },
            { value: "email_marketing", label: "Email Marketing" }
        ],
        channel: [ // Channel
            { value: "facebook_ads", label: "Facebook Ads" },
            { value: "google_ads", label: "Google Ads" },
            { value: "instagram", label: "Instagram" },
            { value: "whatsapp", label: "WhatsApp" },
            { value: "sms", label: "SMS" }
        ]
    };

    // Function to get THEN value options
    const getThenValueOptions = (activityType) => {
        return thenValueOptions[activityType] || [];
    };

    const thenFirstValueOptions = {
        campaign: [
            { value: "nursing_campaign", label: "Nursing Campaign" },
            { value: "healthcare_campaign", label: "Healthcare Campaign" },
            { value: "education_campaign", label: "Education Campaign" }
        ],
        channels: [
            { value: "Bulk Upload" },
            { value: "Digital Organic" }
        ]


    };

    const getThenFirstValueOptions = (activityType) => {
        return thenFirstValueOptions[activityType] || [];
    };


    const tabs = [
        'IF',
        'THEN',
    ];

    const handleTabClick = (tabIndex, profileKey) => {
        setActivetab(profileKey);
        setActiveTab(prevTabs => ({
            ...prevTabs,
            [profileKey]: tabIndex
        }));
    };


    const handleAddCondition = () => {
        setCondition(prev => [...prev, {}]);
        setConditions(prev => [...prev, [{}]]);
        setConditionSelections(prev => [...prev, ['']]);
        setConditionOperators(prev => [...prev, ['']]);
        setConditionValues(prev => [...prev, ['']]);
        setSubConditionSelections(prev => [...prev, []]);
    }

    const handleAddThenCondition = () => {
        // Add a new then condition with default values
        setThenCondition(prev => [...prev, { activityType: '', values: [] }]);
        setThenConditions(prev => [...prev, [{}]]);
        setThenConditionSelections(prev => [...prev, ['']]);
        setThenSubConditionSelections(prev => [...prev, []]);
    }

    const handleRemoveThenCondition = (indexToRemove) => {
        setThenCondition(prev => prev.filter((_, i) => i !== indexToRemove));
        setThenConditions(prev => prev.filter((_, i) => i !== indexToRemove));
        setThenConditionSelections(prev => prev.filter((_, i) => i !== indexToRemove));
        setThenSubConditionSelections(prev => prev.filter((_, i) => i !== indexToRemove));
    }

    const handleThenConditionChange = (index, field, value) => {
        setThenCondition(prev => prev.map((condition, i) =>
            i === index ? { ...condition, [field]: value } : condition
        ));
    }

    const handleRemoveCondition = (indexToRemove) => {
        setCondition(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditions(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditionSelections(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditionOperators(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditionValues(prev => prev.filter((_, i) => i !== indexToRemove));
        setSubConditionSelections(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    const handleAddSubCondition = (blockIndex) => {
        setConditions(prev => {
            const next = [...prev];
            const currentBlock = next[blockIndex] || [];
            next[blockIndex] = [...currentBlock, {}];
            return next;
        });
        setSubConditionSelections(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            rows.push(['']);
            next[blockIndex] = rows;
            return next;
        });
        setSubConditionOperators(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            rows.push(['']);
            next[blockIndex] = rows;
            return next;
        });
        setSubConditionValues(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            rows.push(['']);
            next[blockIndex] = rows;
            return next;
        });
    };

    const handleRemoveSubCondition = (blockIndex, subIndex) => {
        // Remove from conditions (account for first main item at index 0)
        setConditions(prev => {
            const next = [...prev];
            const currentBlock = [...(next[blockIndex] || [])];
            if (currentBlock.length > subIndex + 1) {
                currentBlock.splice(subIndex + 1, 1);
                next[blockIndex] = currentBlock;
            }
            return next;
        });

        // Remove corresponding select state row
        setSubConditionSelections(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            if (rows.length > subIndex) {
                rows.splice(subIndex, 1);
                next[blockIndex] = rows;
            }
            return next;
        });
        setSubConditionOperators(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            if (rows.length > subIndex) {
                rows.splice(subIndex, 1);
                next[blockIndex] = rows;
            }
            return next;
        });
        setSubConditionValues(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            if (rows.length > subIndex) {
                rows.splice(subIndex, 1);
                next[blockIndex] = rows;
            }
            return next;
        });
    };

    const handleSelectChange = (blockIndex, selectIndex, value) => {
        setConditionSelections(prev => {
            const next = [...prev];
            const current = [...(next[blockIndex] || [''])];

            current[selectIndex] = value;

            const isLast = selectIndex === current.length - 1;
            const canAddMore = current.length < 3;

            if (isLast && value !== '' && canAddMore) {
                current.push('');
            }

            // Trim trailing empties to keep only one empty tail
            while (current.length > 1 && current[current.length - 1] === '' && current[current.length - 2] === '') {
                current.pop();
            }


            if (current.length === 0) {
                current.push('');
            }

            next[blockIndex] = current;
            return next;
        });

        // Clear subsequent dropdowns when Activity Type changes
        setConditionOperators(prev => {
            const next = [...prev];
            next[blockIndex] = [''];
            return next;
        });
        setConditionValues(prev => {
            const next = [...prev];
            next[blockIndex] = [''];
            return next;
        });

        // If status is selected, fetch sub-statuses
        if (selectIndex === 0 && value === 'status') {
            // This will be handled when user selects a specific status value
        }
    };

    const handleOperatorChange = (blockIndex, selectIndex, value) => {
        setConditionOperators(prev => {
            const next = [...prev];
            const current = [...(next[blockIndex] || [''])];

            current[selectIndex] = value;

            const isLast = selectIndex === current.length - 1;
            const canAddMore = current.length < 3;

            if (isLast && value !== '' && canAddMore) {
                current.push('');
            }

            // Trim trailing empties to keep only one empty tail
            while (current.length > 1 && current[current.length - 1] === '' && current[current.length - 2] === '') {
                current.pop();
            }

            // Ensure at least one select exists
            if (current.length === 0) {
                current.push('');
            }

            next[blockIndex] = current;
            return next;
        });

        // Clear Value dropdown when Operator changes
        if (value === '') {
            setConditionValues(prev => {
                const next = [...prev];
                next[blockIndex] = [''];
                return next;
            });
        }
    };

    const handleValueChange = (blockIndex, selectIndex, value) => {
        setConditionValues(prev => {
            const next = [...prev];
            const current = [...(next[blockIndex] || [''])];

            // Handle both single values and arrays (for multiselect)
            current[selectIndex] = value;

            const isLast = selectIndex === current.length - 1;
            const canAddMore = current.length < 3;

            // For multiselect, check if it's an array and has values
            const hasValue = Array.isArray(value) ? value.length > 0 : value !== '';

            if (isLast && hasValue && canAddMore) {
                current.push('');
            }

            // Trim trailing empties to keep only one empty tail
            while (current.length > 1 && current[current.length - 1] === '' && current[current.length - 2] === '') {
                current.pop();
            }

            // Ensure at least one select exists
            if (current.length === 0) {
                current.push('');
            }

            next[blockIndex] = current;
            return next;
        });

        // Check if this is a status value selection and fetch sub-statuses
        const activityType = (conditionSelections[blockIndex] || [''])[0];
        if (activityType === 'status' && value && !Array.isArray(value)) {
            // If a specific status is selected, fetch its sub-statuses
            fetchSubStatuses(value);
        }
        
        // Check if this is a vertical value selection
        if (activityType === 'vertical' && value) {
            if (Array.isArray(value)) {
                // Handle multiselect for vertical
                if (value.includes('all') || value.length === 0) {
                    // If "All Verticals" is selected or no selection, clear vertical selection and fetch all projects
                    clearVerticalSelection();
                } else if (value.length === 1) {
                    // If only one vertical is selected, use that vertical
                    handleVerticalChange(value[0]);
                } else {
                    // If multiple verticals are selected, clear selection and fetch all projects
                    clearVerticalSelection();
                }
            } else {
                // Handle single select for vertical
                if (value === 'all') {
                    // If "All Verticals" is selected, clear vertical selection and fetch all projects
                    clearVerticalSelection();
                } else {
                    // If a specific vertical is selected, update vertical selection and fetch its projects
                    handleVerticalChange(value);
                }
            }
        }
    };

    const handleSubSelectChange = (blockIndex, rowIndex, selectIndex, value) => {
        setSubConditionSelections(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            const current = [...(rows[rowIndex] || [''])];

            current[selectIndex] = value;

            const isLast = selectIndex === current.length - 1;
            const canAddMore = current.length < 3;
            if (isLast && value !== '' && canAddMore) {
                current.push('');
            }

            while (current.length > 1 && current[current.length - 1] === '' && current[current.length - 2] === '') {
                current.pop();
            }

            if (current.length === 0) {
                current.push('');
            }

            rows[rowIndex] = current;
            next[blockIndex] = rows;
            return next;
        });

        // Clear subsequent dropdowns when Activity Type changes (selectIndex 0)
        if (selectIndex === 0) {
            setSubConditionOperators(prev => {
                const next = [...prev];
                const rows = [...(next[blockIndex] || [])];
                rows[rowIndex] = [''];
                next[blockIndex] = rows;
                return next;
            });
            setSubConditionValues(prev => {
                const next = [...prev];
                const rows = [...(next[blockIndex] || [])];
                rows[rowIndex] = [''];
                next[blockIndex] = rows;
                return next;
            });
        }
    };

    const handleSubOperatorChange = (blockIndex, rowIndex, selectIndex, value) => {
        setSubConditionOperators(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            const current = [...(rows[rowIndex] || [''])];

            current[selectIndex] = value;

            const isLast = selectIndex === current.length - 1;
            const canAddMore = current.length < 3;
            if (isLast && value !== '' && canAddMore) {
                current.push('');
            }

            while (current.length > 1 && current[current.length - 1] === '' && current[current.length - 2] === '') {
                current.pop();
            }

            if (current.length === 0) {
                current.push('');
            }

            rows[rowIndex] = current;
            next[blockIndex] = rows;
            return next;
        });

        // Clear Value dropdown when Operator changes
        if (value === '') {
            setSubConditionValues(prev => {
                const next = [...prev];
                const rows = [...(next[blockIndex] || [])];
                rows[rowIndex] = [''];
                next[blockIndex] = rows;
                return next;
            });
        }
    };

    const handleSubValueChange = (blockIndex, rowIndex, selectIndex, value) => {
        setSubConditionValues(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            const current = [...(rows[rowIndex] || [''])];

            current[selectIndex] = value;

            const isLast = selectIndex === current.length - 1;
            const canAddMore = current.length < 3;
            if (isLast && value !== '' && canAddMore) {
                current.push('');
            }

            while (current.length > 1 && current[current.length - 1] === '' && current[current.length - 2] === '') {
                current.pop();
            }

            if (current.length === 0) {
                current.push('');
            }

            rows[rowIndex] = current;
            next[blockIndex] = rows;
            return next;
        });

        // Check if this is a status value selection in sub-condition and fetch sub-statuses
        const activityType = (subConditionSelections[blockIndex]?.[rowIndex] || [''])[0];
        if (activityType === 'status' && value && !Array.isArray(value)) {
            // If a specific status is selected, fetch its sub-statuses
            fetchSubStatuses(value);
        }
        
        // Check if this is a vertical value selection in sub-condition
        if (activityType === 'vertical' && value) {
            if (Array.isArray(value)) {
                // Handle multiselect for vertical
                if (value.includes('all') || value.length === 0) {
                    // If "All Verticals" is selected or no selection, clear vertical selection and fetch all projects
                    clearVerticalSelection();
                } else if (value.length === 1) {
                    // If only one vertical is selected, use that vertical
                    handleVerticalChange(value[0]);
                } else {
                    // If multiple verticals are selected, clear selection and fetch all projects
                    clearVerticalSelection();
                }
            } else {
                // Handle single select for vertical
                if (value === 'all') {
                    // If "All Verticals" is selected, clear vertical selection and fetch all projects
                    clearVerticalSelection();
                } else {
                    // If a specific vertical is selected, update vertical selection and fetch its projects
                    handleVerticalChange(value);
                }
            }
        }
    };



    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa' }}>

            <div className="row justify-content-between">
                <div className="col-6">
                    <div className="mb-4">
                        <h3 className="display-5 fw-bold text-dark mb-2" style={{ fontSize: '1.9rem' }}>DRIP MARKETING RULES</h3>
                    </div>
                </div>
                <div className="col-6">
                    <div className="d-flex gap-3 justify-content-end align-items-center">
                        
                        
                        {/* Search Input */}
                        <div className="input-group" style={{ maxWidth: '300px' }}>
                            <span className="input-group-text bg-white border-end-0 input-height">
                                <i className="fas fa-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                name="name"
                                className="form-control border-start-0 m-0"
                                placeholder="Quick search..."
                            />
                            <button
                                className="btn btn-outline-secondary border-start-0"
                                type="button"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>

            </div>



            {/* drip table start  */}

            <div className="row">
                <div className="col-12">

                    <table>
                        <thead>
                            <tr>
                                <td width={400}>
                                    Description
                                </td>

                                <td width={150}>
                                    Created By
                                </td>
                                <td width={200}>
                                    Created On
                                </td>
                                <td width={200}>
                                    Start Time
                                </td>
                                <td width={100}>
                                    Active
                                </td>
                                <td width={50}>

                                </td>
                            </tr>
                        </thead>

                        <tbody>
                            {rules?.length > 0 && (
                                rules.map((rule, index) => (
                                    <tr className='driprule' key={rule.id || index}>
                                        <td>
                                            {rule.description}
                                        </td>
                                        <td>
                                            {rule.createdBy}
                                        </td>
                                        <td>
                                            {rule.createdOn}
                                        </td>
                                        <td>
                                            {rule.startTime}
                                        </td>
                                        <td>
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={rule.active}
                                                    onChange={() => {
                                                        // Handle toggle logic here
                                                        const updatedRules = [...rules];
                                                        updatedRules[index].active = !updatedRules[index].active;
                                                        setRules(updatedRules);
                                                    }}
                                                />
                                            </div>
                                        </td>
                                        <td className='ellipsis' onClick={() => handleDropdown(index)}>
                                            <i className="fas fa-ellipsis-v"></i>

                                            {showPopup && popupIndex === index && (
                                                <div className="drip_dropdowp">
                                                    <ul className="drip_droplist">
                                                        <li data-bs-toggle="modal" data-bs-target="#staticBackdropEditRuleModel" onClick={() => {
                                                            // Handle edit logic
                                                            setModalMode('edit');
                                                            setIsEditing(true);
                                                            setEditingId(rule.id ?? index);
                                                            setShowPopup(false);
                                                            setPopupIndex(null);

                                                        }}>
                                                            Edit
                                                        </li>
                                                        <li onClick={() => {
                                                            // Handle delete logic
                                                            const updatedRules = rules.filter((_, i) => i !== index);
                                                            setRules(updatedRules);
                                                            setShowPopup(false);
                                                            setPopupIndex(null);
                                                        }}>
                                                            Delete
                                                        </li>
                                                    </ul>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>

                </div>
            </div>

           

            <div className="btn_add_segement">
                <a href="#" data-bs-toggle="modal" data-bs-target="#staticBackdropRuleModel" onClick={() => { setModalMode('add'); setIsEditing(false); setEditingId(null); }}><i className="fa-solid fa-plus"></i></a>
            </div>

            <div className="add_rule_section">
                <div className="modal fade" id="staticBackdropRuleModel" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5" id="staticBackdropLabel">{modalMode === 'edit' ? 'Edit Rule' : 'Add Rule'}</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-12">
                                        <p className='ruleInfo'>{modalMode === 'edit' ? 'Do you want to update the rule?' : 'A new rule can be added using this dialog, you need to select Rules and actions to be performed based on the Rules'}</p>
                                        <div className="row">
                                            <div className="col-md-6 col-12">
                                                <input type="text" name='ruleName' placeholder='Name of the Rule' />
                                            </div>
                                            <div className="col-md-6 col-12">
                                                <div className="row">
                                                    <div className="col-6">
                                                        <div className="datePickerSection">
                                                            <DatePicker
                                                                className={`form-control border-0 bgcolor `}
                                                                name="startDate"
                                                                format="dd/MM/yyyy"
                                                                value={startDate}
                                                                onChange={(date) => setStartDate(date)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="timePickerSection">
                                                            <input
                                                                name="startTime"
                                                                type="time"
                                                                className={`form-control border-0 bgcolor`}
                                                                id="actionTime"
                                                                style={{ backgroundColor: '#f1f2f6', height: '42px', paddingInline: '10px' }}
                                                                value={startTime}
                                                                onChange={(e) => setStartTime(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="tab_add_segment">
                                            <ul className="nav nav-tabs">
                                                {tabs.map((tab, tabIndex) => (
                                                    <li className="nav-item" key={tabIndex}>
                                                        <button
                                                            className={`nav-link ${(activeTab[activetab] || 0) === tabIndex ? 'active' : ''}`}
                                                            onClick={() => handleTabClick(tabIndex, activetab)}
                                                        >
                                                            {tab}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="tab-content">


                                            {/* {IF === 0 && ( */}
                                            {(activeTab[activetab] || 0) === 0 && (
                                                <div className="tab-pane active" id="if">
                                                    <div className="row">
                                                        <div className="col-3">
                                                            <button onClick={() => handleAddCondition()}>
                                                                <i className="fa-solid fa-plus"></i> Add Condition
                                                            </button>
                                                        </div>
                                                        <div className="col-1">
                                                            <div className={`toggle-container ${logicOperator === 'or' ? 'or-active' : ''}`} id="toggleButton">
                                                                <div className="toggle-slider"></div>
                                                                <div
                                                                    className={`toggle-option ${logicOperator === 'and' ? 'active' : ''}`}
                                                                    data-value="and"
                                                                    onClick={() => setLogicOperator('and')}
                                                                >
                                                                    And
                                                                </div>
                                                                <div
                                                                    className={`toggle-option ${logicOperator === 'or' ? 'active' : ''}`}
                                                                    data-value="or"
                                                                    onClick={() => setLogicOperator('or')}
                                                                >
                                                                    Or
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {condition.map((_, index) => (
                                                        <React.Fragment key={index}>
                                                            {index > 0 && (
                                                                <div className='mb-2' style={{
                                                                    backgroundColor: '#ff6b35',
                                                                    color: '#fff',
                                                                    display: 'inline',
                                                                    padding: '5px 10px',
                                                                    fontSize: '14px'
                                                                  }}
                                                                  >
                                                                    {logicOperator}
                                                                </div>
                                                            )}

                                                            <div className="ifBlock mb-2 ">


                                                                {(subConditionSelections[index]?.length || 0) > 0 && (
                                                                    <div className={`mb-2 toggle-container ${subLogicOperator === 'or' ? 'or-active' : ''}`} id="toggleButtons">
                                                                        <div className="toggle-slider"></div>
                                                                        <div
                                                                            className={`toggle-option ${subLogicOperator === 'and' ? 'active' : ''}`}
                                                                            data-value="and"
                                                                            onClick={() => setSubLogicOperator('and')}
                                                                        >
                                                                            And
                                                                        </div>
                                                                        <div
                                                                            className={`toggle-option ${subLogicOperator === 'or' ? 'active' : ''}`}
                                                                            data-value="or"
                                                                            onClick={() => setSubLogicOperator('or')}
                                                                        >
                                                                            Or
                                                                        </div>
                                                                    </div>
                                                                )}


                                                                <div className="row mb-3 pb-3">
                                                                    <div className="col-10">
                                                                        <div className="row">
                                                                            {/* Activity Type Dropdown - Always visible */}
                                                                            <div className="col-4">
                                                                                <select
                                                                                    className='form-select'
                                                                                    value={(conditionSelections[index] || [''])[0] || ''}
                                                                                    onChange={(e) => handleSelectChange(index, 0, e.target.value)}
                                                                                >
                                                                                    <option value="">Activity type</option>
                                                                                    <option value="campaign">Campaign</option>
                                                                                    <option value="channels">Channels</option>
                                                                                    <option value="city">City</option>
                                                                                    <option value="state">State</option>
                                                                                    <option value="status">Status</option>
                                                                                    <option value="subStatus">Sub Status</option>
                                                                                    <option value="leadOwner">Lead Owner</option>
                                                                                    <option value="registeredBy">Registered By</option>
                                                                                    <option value="courseName">Course Name</option>
                                                                                    <option value="jobName">Job Name</option>
                                                                                    <option value="email">Email</option>
                                                                                    <option value="mobile">Mobile</option>
                                                                                    <option value="createdDate">Created Date</option>
                                                                                    <option value="modificationDate">Modification Date</option>
                                                                                    <option value="project">Project</option>
                                                                                    <option value="vertical">Vertical</option>
                                                                                    <option value="batch">Batch</option>
                                                                                </select>
                                                                            </div>

                                                                            {/* Operator Dropdown - Only show if Activity Type is selected */}
                                                                            {(conditionSelections[index] || [''])[0] && (
                                                                                <div className="col-4">
                                                                                    <select
                                                                                        className='form-select'
                                                                                        value={(conditionOperators[index] || [''])[0] || ''}
                                                                                        onChange={(e) => handleOperatorChange(index, 0, e.target.value)}
                                                                                    >
                                                                                        <option value="">Select Operator</option>
                                                                                        <option value="equals">Equals</option>
                                                                                        <option value="not_equals">Not Equals</option>
                                                                                    </select>
                                                                                </div>
                                                                            )}

                                                                            {/* Value Dropdown - Only show if Operator is selected */}
                                                                            {(conditionOperators[index] || [''])[0] && (conditionSelections[index] || [''])[0] && (
                                                                                <div className="col-4">
                                                                                    {(() => {
                                                                                        const multiValues = ['all', 'status', 'subStatus', 'vertical', 'project']
                                                                                        const activityType = (conditionSelections[index] || [''])[0] || '';
                                                                                        const isMultiselect = multiValues.includes('all')
                                                                                            ? true
                                                                                            : multiValues.includes(activityType);
                                                                                        const valueOptions = getValueOptions(activityType);
                                                                                        const currentValue = (conditionValues[index] || [''])[0] || '';

                                                                                        if (isMultiselect) {
                                                                                            return (
                                                                                                <MultiselectDropdown
                                                                                                    options={valueOptions}
                                                                                                    value={Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : [])}
                                                                                                    onChange={(values) => handleValueChange(index, 0, values)}
                                                                                                    placeholder="Select values"
                                                                                                    
                                                                                                />
                                                                                            );
                                                                                        } else {
                                                                                            return (
                                                                                                <select
                                                                                                    className='form-select'
                                                                                                    value={Array.isArray(currentValue) ? '' : currentValue}
                                                                                                    onChange={(e) => handleValueChange(index, 0, e.target.value)}
                                                                                                >
                                                                                                    <option value="">Select value</option>
                                                                                                    {valueOptions.map((option) => (
                                                                                                        <option key={option.value} value={option.value}>
                                                                                                            {option.label}
                                                                                                        </option>
                                                                                                    ))}
                                                                                                </select>
                                                                                            );
                                                                                        }
                                                                                    })()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-2">
                                                                        <div className="addMore">
                                                                            <button onClick={() => handleAddSubCondition(index)}>
                                                                                <i className="fa-solid fa-plus"></i>
                                                                            </button>
                                                                            <button onClick={() => handleRemoveCondition(index)}>
                                                                                <i className="fa-solid fa-xmark"></i>
                                                                            </button>
                                                                        </div>
                                                                    </div>


                                                                </div>



                                                                {(conditions[index] || []).length > 1 && (conditions[index] || []).slice(1).map((_, subIdx) => (
                                                                    <div key={`sub-${index}-${subIdx}`}>
                                                                        {/* AND/OR Logic Button */}
                                                                        <div className="mb-2">
                                                                            <button 
                                                                                className="btn btn-sm me-2"
                                                                                style={{
                                                                                    backgroundColor: '#ff6b35',
                                                                                    color: '#fff',
                                                                                    border: 'none',
                                                                                    padding: '5px 10px',
                                                                                    fontSize: '14px',
                                                                                    borderRadius: '4px'
                                                                                }}
                                                                                onClick={() => {
                                                                                    // Toggle between 'and' and 'or'
                                                                                    const newOperator = subLogicOperator === 'and' ? 'or' : 'and';
                                                                                    setSubLogicOperator(newOperator);
                                                                                }}
                                                                            >
                                                                                {subLogicOperator}
                                                                            </button>
                                                                        </div>

                                                                        {/* Sub-condition Row */}
                                                                        <div className="row mb-3 pb-3">
                                                                            <div className="col-10">
                                                                                <div className="row">
                                                                                    {/* Sub-condition Activity Type Dropdown - Always visible */}
                                                                                    <div className="col-4">
                                                                                        <select
                                                                                            className='form-select'
                                                                                            value={(subConditionSelections[index]?.[subIdx] || [''])[0] || ''}
                                                                                            onChange={(e) => handleSubSelectChange(index, subIdx, 0, e.target.value)}
                                                                                        >
                                                                                            <option value="">Activity type</option>
                                                                                            <option value="campaign">Campaign</option>
                                                                                            <option value="channels">Channels</option>
                                                                                            <option value="city">City</option>
                                                                                            <option value="state">State</option>
                                                                                            <option value="status">Status</option>
                                                                                            <option value="subStatus">Sub Status</option>
                                                                                            <option value="leadOwner">Lead Owner</option>
                                                                                            <option value="registeredBy">Registered By</option>
                                                                                            <option value="courseName">Course Name</option>
                                                                                            <option value="jobName">Job Name</option>
                                                                                            <option value="email">Email</option>
                                                                                            <option value="mobile">Mobile</option>
                                                                                            <option value="createdDate">Created Date</option>
                                                                                            <option value="modificationDate">Modification Date</option>
                                                                                            <option value="project">Project</option>
                                                                                            <option value="vertical">Vertical</option>
                                                                                            <option value="batch">Batch</option>
                                                                                        </select>
                                                                                    </div>

                                                                                    {/* Sub-condition Operator Dropdown - Only show if Activity Type is selected */}
                                                                                    {(subConditionSelections[index]?.[subIdx] || [''])[0] && (
                                                                                        <div className="col-4">
                                                                                            <select
                                                                                                className='form-select'
                                                                                                value={(subConditionOperators[index]?.[subIdx] || [''])[0] || ''}
                                                                                                onChange={(e) => handleSubOperatorChange(index, subIdx, 0, e.target.value)}
                                                                                            >
                                                                                                <option value="">Select Operator</option>
                                                                                                <option value="equals">Equals</option>
                                                                                                <option value="not_equals">Not Equals</option>
                                                                                            </select>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Sub-condition Value Dropdown - Only show if Operator is selected */}
                                                                                    {(subConditionOperators[index]?.[subIdx] || [''])[0] && (subConditionSelections[index]?.[subIdx] || [''])[0] && (
                                                                                        <div className="col-4">
                                                                                            {(() => {
                                                                                                const multiValues = ['all', 'status', 'subStatus', 'vertical', 'project']
                                                                                                const activityType = (subConditionSelections[index]?.[subIdx] || [''])[0] || '';
                                                                                                const isMultiselect = multiValues.includes('all')
                                                                                                    ? true
                                                                                                    : multiValues.includes(activityType);
                                                                                                const valueOptions = getValueOptions(activityType);
                                                                                                const currentValue = (subConditionValues[index]?.[subIdx] || [''])[0] || '';

                                                                                                if (isMultiselect) {
                                                                                                    return (
                                                                                                        <MultiselectDropdown
                                                                                                            options={valueOptions}
                                                                                                            value={Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : [])}
                                                                                                            onChange={(values) => handleSubValueChange(index, subIdx, 0, values)}
                                                                                                            placeholder="Select values"
                                                                                                        />
                                                                                                    );
                                                                                                } else {
                                                                                                    return (
                                                                                                        <select
                                                                                                            className='form-select'
                                                                                                            value={Array.isArray(currentValue) ? '' : currentValue}
                                                                                                            onChange={(e) => handleSubValueChange(index, subIdx, 0, e.target.value)}
                                                                                                        >
                                                                                                            <option value="">Select value</option>
                                                                                                            {valueOptions.map((option) => (
                                                                                                                <option key={option.value} value={option.value}>
                                                                                                                    {option.label}
                                                                                                                </option>
                                                                                                            ))}
                                                                                                        </select>
                                                                                                    );
                                                                                                }
                                                                                            })()}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-2">
                                                                                <div className="addMore">
                                                                                    <button onClick={() => handleAddSubCondition(index)}>
                                                                                        <i className="fa-solid fa-plus"></i>
                                                                                    </button>
                                                                                    <button onClick={() => handleRemoveSubCondition(index, subIdx)}>
                                                                                        <i className="fa-solid fa-xmark"></i>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>


                                                        </React.Fragment>


                                                    ))}
                                                </div>

                                            )}


                                            {/* {THEN === 1 && ( */}
                                            {(activeTab[activetab] || 0) === 1 && (
                                                <div className="tab-pane active" id="then">
                                                    <div className="lead-attribute-body">
                                                        <div className="thenBlock">
                                                            <div className="row my-3 border p-3">
                                                                <div className="col-10">
                                                                    <div className="row">



                                                                        <div className="col-4">
                                                                            <select className='form-select' value={thenFirst} onChange={(e) => {
                                                                                setThenFirst(e.target.value);
                                                                                setThenShouldBe([]); // Clear multiselect when activity type changes
                                                                            }}>
                                                                                <option value="">Activity Type</option>
                                                                                <option value="campaign">Campaign</option>
                                                                                <option value="channel">Channel</option>
                                                                            </select>
                                                                        </div>
                                                                        {thenFirst !== '' && (
                                                                            <div className="col-6">
                                                                                <div className="d-flex align-items-center">
                                                                                    <label className="me-2">Should be</label>
                                                                                    <div className="flex-grow-1">
                                                                                        <MultiselectDropdown
                                                                                            options={getThenValueOptions(thenFirst)}
                                                                                            value={Array.isArray(thenShouldBe) ? thenShouldBe : (thenShouldBe ? [thenShouldBe] : [])}
                                                                                            onChange={(values) => setThenShouldBe(values)}
                                                                                            placeholder="Select options"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                </div>
                                                                <div className="col-2">
                                                                    <div className='d-flex gap-2'>
                                                                        <button
                                                                            onClick={() => handleAddThenCondition()}
                                                                            className="btn btn-outline-success btn-sm"
                                                                            title="Add new condition"
                                                                        >
                                                                            <i className="fa-solid fa-plus"></i>
                                                                        </button>

                                                                        {/* <button
                                                                            onClick={() => handleRemoveThenCondition(index)}
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            title="Remove condition"
                                                                        >
                                                                            <i className="fa-solid fa-trash"></i>
                                                                        </button> */}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {thenCondition.map((condition, index) => (
                                                                <div className="row my-3 border p-3" key={`then-${index}`}>
                                                                    <div className="col-10">
                                                                        <div className="row">
                                                                            <div className="col-4">
                                                                                <select
                                                                                    className='form-select'
                                                                                    value={condition.activityType || ''}
                                                                                    onChange={(e) => {
                                                                                        handleThenConditionChange(index, 'activityType', e.target.value);
                                                                                        handleThenConditionChange(index, 'values', []); // Clear values when activity type changes
                                                                                    }}
                                                                                >
                                                                                    <option value="">Activity Type</option>
                                                                                    <option value="campaign">Campaign</option>
                                                                                    <option value="channel">Channel</option>
                                                                                </select>
                                                                            </div>
                                                                            {condition.activityType && (
                                                                                <div className="col-6">
                                                                                    <div className="d-flex align-items-center">
                                                                                        <label className="me-2">Should be</label>
                                                                                        <div className="flex-grow-1">
                                                                                            <MultiselectDropdown
                                                                                                options={getThenValueOptions(condition.activityType)}
                                                                                                value={Array.isArray(condition.values) ? condition.values : (condition.values ? [condition.values] : [])}
                                                                                                onChange={(values) => handleThenConditionChange(index, 'values', values)}
                                                                                                placeholder="Select options"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-2">
                                                                        <div className='d-flex gap-2'>
                                                                            <button
                                                                                onClick={() => handleAddThenCondition()}
                                                                                className="btn btn-outline-success btn-sm"
                                                                                title="Add new condition"
                                                                            >
                                                                                <i className="fa-solid fa-plus"></i>
                                                                            </button>

                                                                            <button
                                                                                onClick={() => handleRemoveThenCondition(index)}
                                                                                className="btn btn-outline-danger btn-sm"
                                                                                title="Remove condition"
                                                                            >
                                                                                <i className="fa-solid fa-trash"></i>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            <div className="toggle-container-then my-3" id="toggleButtonthen">

                                                                <div className="toggle-option active" data-value="and">And</div>

                                                            </div>
                                                            <div className="row my-3 border p-3">
                                                                <div className="col-10">
                                                                    <div className="row">

                                                                        <>
                                                                            <div className="col-4">
                                                                                <select className='form-select'
                                                                                    value={thenExecType}
                                                                                    onChange={(e) => {
                                                                                        const v = e.target.value;
                                                                                        setThenExecType(v);
                                                                                        if (v === 'immediate') {
                                                                                            setThenCount('');
                                                                                        } else if (v === 'occurrences') {
                                                                                            setThenMode('');
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <option value="immediate">Immediate</option>
                                                                                    <option value="occurrences">No of Occurences</option>
                                                                                </select>
                                                                            </div>
                                                                            {thenExecType === 'immediate' && (
                                                                                <div className="col-4">
                                                                                    <select className='form-select' value={thenMode} onChange={(e) => setThenMode(e.target.value)}>
                                                                                        <option value="">Select Communication Mode</option>
                                                                                        {/* <option value="sms">SMS</option> */}
                                                                                        <option value="email">Email</option>
                                                                                        <option value="whatsapp">Whatapp</option>
                                                                                    </select>
                                                                                </div>
                                                                            )}
                                                                            {thenExecType === 'occurrences' && (
                                                                                <div className="col-4 d-flex">
                                                                                    <label htmlFor="">No. Of Communication</label>
                                                                                    <input type="number" min="1" value={thenCount} onChange={(e) => setThenCount(e.target.value)} />
                                                                                </div>
                                                                            )}
                                                                        </>

                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>


                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-primary">Understood</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="modal fade" id="staticBackdropEditRuleModel" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5" id="staticBackdropLabel">Edit Drip Marketing Rule</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-12">
                                    <p className='ruleInfo'>Do you want to update the rule?</p>
                                    <p className='ruleInfo'>After editing the rule all the existing lead will not receive communication</p>

                                </div>

                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">No</button>
                            <button type="button" className="btn btn-primary" data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#staticBackdropRuleModel" onClick={() => setModalMode('edit')}>Yes</button>
                        </div>
                    </div>
                </div>
            </div>


            <style>
                {

                    `.form-check-input:checked {
    background-color: #28a745;
    border-color: #28a745;
  }
       
    .ellipsis{
    position: relative;
    cursor: pointer;
    text-align: center;
    }

    .drip_dropdowp{
    // display: none;
    position: absolute;
    top: 65%;
    right: 45%;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    min-width: 120px;
    transition: all 0.2s ease-in-out;
    }
    
    .ellipsis:hover .drip_dropdowp{
    display: block;
    }
    
    .drip_droplist {
    list-style: none;
    margin: 0;
    padding: 0 0!important;
    text-align: left;
    }
    
    .drip_droplist li {
    padding: 8px 16px!important;
    cursor: pointer;
    transition: background-color 0.2s ease;
    }
    
    .drip_droplist li:hover {
    background-color: #f8f9fa;
    }
    
    .driprule{
    height: 70px;
    }
    
    .driprule td{
    height: 70px;
    vertical-align: middle;
    padding: 12px;
    border-bottom: 1px solid #dee2e6;
    }
    
    table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: visible;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    thead td {
    background-color: #f8f9fa;
    font-weight: 600;
    padding: 16px 12px;
    border-bottom: 2px solid #dee2e6;
    color: #495057;
    }

    .btn_add_segement{
     position: absolute;
    top: 85%;
    right: 5%;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #fc2b5a;
    padding: 16px;
   
    }
    .btn_add_segement a{
     display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #fff;
    font-size: 1.4rem;
    width:100%;
    height:100%;
    }
   .btn_add_segment  i {
   font-size:30px;
   color: #fff;
   }
#staticBackdropRuleModel .modal-dialog {
    max-width: 70%;
    width: 70%;
    margin: 1.75rem auto;
}

#staticBackdropRuleModel .modal-content {
    border-radius: 12px;
    border: none;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

#staticBackdropRuleModel .modal-header {
    background: linear-gradient(135deg, #fc2b5a 0%, #fc2b5a 100%);
    color: white;
    border-bottom: none;
    padding: 20px 30px;
    position: relative;
}

#staticBackdropRuleModel .modal-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
}

#staticBackdropRuleModel .btn-close {
    // background: transparent;
    border: none;
    color: white;
    opacity: 0.8;
    font-size: 1.2rem;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
}

#staticBackdropRuleModel .modal-body {
    padding: 30px;
    background: #f8f9fa;
}

#staticBackdropRuleModel .ruleInfo {
    background: #e3f2fd;
    padding: 15px!important;
    border-radius: 8px;
    border-left: 4px solid #fc2b5a;
    margin-bottom: 25px!important;
    color: #fc2b5a;
    font-size: 0.95rem;
    line-height: 1.5;
}

/* Form inputs styling */
#staticBackdropRuleModel input[type="text"] {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    font-size: 0.95rem;
    transition: all 0.3s ease;
    margin-bottom: 15px;
    height:40px;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
}

#staticBackdropRuleModel input[type="text"]:focus {
    outline: none;
    border-color: #fc2b5a;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

#staticBackdropRuleModel input[type="text"]::placeholder {
    color: #9e9e9e;
    font-style: italic;
}

/* Date and time picker styling */
#staticBackdropRuleModel .datePickerSection,
#staticBackdropRuleModel .timePickerSection {
    margin-bottom: 15px;
}

#staticBackdropRuleModel .datePickerSection .react-date-picker,
#staticBackdropRuleModel input[type="time"] {
    width: 100%;
    height: 40px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: transparent;
    padding: 0 15px;
    transition: all 0.3s ease;
}
.react-date-picker__wrapper{
height: 100%;
}
.react-calendar{
width: 250px!important;
}
#staticBackdropRuleModel .datePickerSection .react-date-picker:focus-within,
#staticBackdropRuleModel input[type="time"]:focus {
    border-color: #fc2b5a;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Tab styling */
#staticBackdropRuleModel .tab_add_segment {
    margin: 25px 0;
}

#staticBackdropRuleModel .nav-tabs {
    border-bottom: 2px solid #e9ecef;
    background: white;
    border-radius: 8px 8px 0 0;
    padding: 0;
    overflow: hidden;
}

#staticBackdropRuleModel .nav-tabs .nav-item {
    margin-bottom: 0;
}

#staticBackdropRuleModel .nav-tabs .nav-link {
    border: none;
    padding: 15px 30px;
    font-weight: 600;
    color: #fc2b5a;
    background: transparent;
    border-radius: 0;
    transition: all 0.3s ease;
    position: relative;
}

#staticBackdropRuleModel .nav-tabs .nav-link:hover {
    border: none;
    background: #f8f9fa;
    color: #495057;
}

#staticBackdropRuleModel .nav-tabs .nav-link.active {
    background: #fc2b5a;
    color: white;
    border: none;
}

#staticBackdropRuleModel .nav-tabs .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #fc2b5a;
}

/* Tab content */
#staticBackdropRuleModel .tab-content {
    background: white;
    padding: 25px;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Buttons in IF tab */
#staticBackdropRuleModel .tab-pane button {
 background: #fc2b5a;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

#staticBackdropRuleModel .tab-pane button:hover {

    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

/* Toggle switch styling */
    .toggle-container , .toggle-container-then{
            position: relative;
            display: inline-flex;
            border-radius: 8px;
            padding: 4px;
            cursor: pointer;
            user-select: none;
        }

        .toggle-option , .toggle-container-then .toggle-option{
            position: relative;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 500;
            color: #666;
            transition: color 0.3s ease;
            z-index: 2;
            border-radius: 6px;
            min-width: 40px;
            text-align: center;
        }

        .toggle-option.active , .toggle-container-then .toggle-option.active{
            color: white;
        }
.toggle-container-then .toggle-option.active{
background-color: #ff6b35;
}
        .toggle-slider {
            position: absolute;
            top: 4px;
            left: 4px;
            width: 56px;
            height: 32px;
            background-color: #ff6b35;
            border-radius: 6px;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .toggle-container.or-active .toggle-slider {
            transform: translateX(56px);
        }

        
/* IF Block styling */
#staticBackdropRuleModel .ifBlock {
    background: #f8f9fb;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e8eaed;
    margin-top: 20px;
}

#staticBackdropRuleModel .addMore {
    display: flex;
    gap: 8px;
    align-items: center;
}

#staticBackdropRuleModel .addMore button {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    transition: all 0.3s ease;
}

#staticBackdropRuleModel .addMore button:first-child {
    background: #28a745;
    color: white;
}

#staticBackdropRuleModel .addMore button:first-child:hover {
    background: #218838;
    transform: scale(1.1);
}

#staticBackdropRuleModel .addMore .btn-close {
    background: #dc3545;
    color: white;
    opacity: 1;
}

#staticBackdropRuleModel .addMore .btn-close:hover {
    background: #c82333;
    transform: scale(1.1);
}

/* Multi-select dropdown styling within modal */
#staticBackdropRuleModel .multi-select-container-new {
    margin-bottom: 0;
}

#staticBackdropRuleModel .multi-select-trigger {
    height: 45px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    transition: all 0.3s ease;
}

#staticBackdropRuleModel .multi-select-trigger:focus,
#staticBackdropRuleModel .multi-select-trigger.open {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

#staticBackdropRuleModel .multi-select-options-new {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background: white;
    margin-top: 5px;
}

/* Modal footer */
#staticBackdropRuleModel .modal-footer {
    padding: 20px 30px;
    background: white;
    border-top: 1px solid #e9ecef;
    gap: 15px;
}

#staticBackdropRuleModel .modal-footer .btn {
    padding: 10px 25px;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s ease;
}

#staticBackdropRuleModel .modal-footer .btn-secondary {
    background: #6c757d;
    border-color: #6c757d;
}

#staticBackdropRuleModel .modal-footer .btn-secondary:hover {
    background: #5a6268;
    transform: translateY(-1px);
}

#staticBackdropRuleModel .modal-footer .btn-primary {
    background: #667eea;
    border-color: #667eea;
}

#staticBackdropRuleModel .modal-footer .btn-primary:hover {
    background: #5a67d8;
    transform: translateY(-1px);
}
.input-group {
flex-wrap: nowrap;

}

/* Mobile Responsive Styles */
@media (max-width: 768px) {

    
    .input-group {
        max-width: 100% !important;
        float: none !important;
    }
    
    /* Table responsive */
    table {
        font-size: 12px;
        overflow-x: auto;
        display: block;
        white-space: nowrap;
    }
    
    table thead,
    table tbody,
    table tr {
        display: table;
        width: 100%;
        table-layout: fixed;
    }
    
    table td {
        padding: 8px 6px !important;
        font-size: 11px;
        word-wrap: break-word;
        white-space: normal;
    }
    
    table td:first-child {
        width: 40% !important;
    }
    
    table td:nth-child(2) {
        width: 20% !important;
    }
    
    table td:nth-child(3),
    table td:nth-child(4) {
        width: 15% !important;
    }
    
    table td:nth-child(5) {
        width: 10% !important;
    }
    
    /* Floating add button */
    .btn_add_segement {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        width: 50px !important;
        height: 50px !important;
        z-index: 1000;
    }
    
    /* Modal responsive */
    #staticBackdropRuleModel .modal-dialog {
        width: 95% !important;
        max-width: 95% !important;
        margin: 1rem auto !important;
    }
    
    #staticBackdropRuleModel .modal-body {
        padding: 15px !important;
    }
    
    #staticBackdropRuleModel .modal-header,
    #staticBackdropRuleModel .modal-footer {
        padding: 15px !important;
    }
    
    /* Form inputs mobile */
    #staticBackdropRuleModel input[type="text"] {
        font-size: 14px;
        padding: 10px 12px;
        height: 38px;
    }
    
    /* Date and time picker mobile */
    #staticBackdropRuleModel .datePickerSection,
    #staticBackdropRuleModel .timePickerSection {
        margin-bottom: 10px;
    }
    
    #staticBackdropRuleModel .datePickerSection .react-date-picker,
    #staticBackdropRuleModel input[type="time"] {
        height: 38px;
        font-size: 14px;
    }
    
    /* Tab navigation mobile */
    #staticBackdropRuleModel .nav-tabs .nav-link {
        padding: 12px 20px;
        font-size: 14px;
    }
    
    /* Tab content mobile */
    #staticBackdropRuleModel .tab-content {
        padding: 15px;
    }
    
    /* IF/THEN blocks mobile */
    #staticBackdropRuleModel .ifBlock {
        padding: 15px;
        margin-top: 15px;
    }
    
    /* Form rows mobile */
    #staticBackdropRuleModel .row {
        margin-left: -8px;
        margin-right: -8px;
    }
    
    #staticBackdropRuleModel .row > [class*="col-"] {
        padding-left: 8px;
        padding-right: 8px;
        margin-bottom: 10px;
    }
    
    /* Select dropdowns mobile */
    #staticBackdropRuleModel .form-select {
        font-size: 14px;
        padding: 8px 12px;
        height: 38px;
    }
    
    /* Buttons mobile */
    #staticBackdropRuleModel .tab-pane button {
        padding: 8px 15px;
        font-size: 13px;
    }
    
    #staticBackdropRuleModel .addMore button {
        width: 30px;
        height: 30px;
        font-size: 12px;
    }
    
    /* Toggle switches mobile */
    .toggle-container,
    .toggle-container-then {
        font-size: 12px;
        margin-left:30px;
    }
    
    .toggle-option {
        padding: 6px 12px;
        font-size: 12px;
    }
    
    /* Multiselect dropdown mobile */
    .multiselect-dropdown .form-select {
        font-size: 14px;
        padding: 8px 12px;
    }
    
    .multiselect-options {
        max-height: 150px;
        font-size: 14px;
    }
    
    .multiselect-option {
        padding: 8px 12px !important;
        font-size: 13px;
    }
    
    /* Modal footer buttons mobile */
    #staticBackdropRuleModel .modal-footer .btn {
        padding: 8px 20px;
        font-size: 14px;
    }
    
    /* THEN section mobile adjustments */
    #staticBackdropRuleModel .thenBlock .row {
        margin-bottom: 15px;
    }
    
    #staticBackdropRuleModel .thenBlock .border {
        padding: 15px !important;
    }
    
    /* Logic operator badges mobile */
    .mb-2[style*="background-color: #ff6b35"] {
        font-size: 12px !important;
        padding: 4px 8px !important;
    }
    
    /* Search input mobile */
    .input-group-text {
        padding: 8px 12px;
    }
    
    .input-group input {
        font-size: 14px;
        padding: 8px 12px;
    }
    
    /* Title mobile */
    .display-5 {
        font-size: 1.5rem !important;
    }
}

/* Extra small devices (phones, 480px and down) */
@media (max-width: 480px) {
   
    table td {
        padding: 6px 4px !important;
        font-size: 10px;
    }
    
    .display-5 {
        font-size: 1.3rem !important;
    }
    
    #staticBackdropRuleModel .modal-dialog {
        width: 98% !important;
        margin: 0.5rem auto !important;
    }
    
    #staticBackdropRuleModel .modal-body {
        padding: 10px !important;
    }
    
    #staticBackdropRuleModel .nav-tabs .nav-link {
        padding: 10px 15px;
        font-size: 13px;
    }
    
    #staticBackdropRuleModel .tab-content {
        padding: 10px;
    }
    
    #staticBackdropRuleModel .ifBlock {
        padding: 10px;
    }
    
    .btn_add_segement {
        width: 45px !important;
        height: 45px !important;
        bottom: 15px !important;
        right: 15px !important;
    }
}

`

                }
            </style>

        </div>
    )
}

export default DripMarketing