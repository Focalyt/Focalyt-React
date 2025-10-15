import React, { useState, useEffect, useRef } from 'react'
import DatePicker from 'react-date-picker';
import axios from 'axios';
// import * as bootstrap from 'bootstrap';

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
    const dropdownRef = useRef(null);

    useEffect(() => {
        setSelectedValues(value || []);
    }, [value]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

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
        <div className="multiselect-dropdown position-relative" ref={dropdownRef}>
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
                    {options?.length > 0 &&
                        options?.map((option) => (
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

    // Modal refs
    const modalRef = useRef(null);
    const closeModalRef = useRef(null);

    // Helper function to close modal
    const closeModal = () => {
     if(closeModalRef.current){
        closeModalRef.current.click();
     }
    };

    const [showPopup, setShowPopup] = useState(false);
    const [popupIndex, setPopupIndex] = useState(null);
    const [rules, setRules] = useState([]);
    const [modalMode, setModalMode] = useState('add');
    const [isEditing, setIsEditing] = useState(false);
    const [editRule, setEditRule] = useState({});


    const [statuses, setStatuses] = useState([]);
    const [subStatuses, setSubStatuses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedSubStatus, setSelectedSubStatus] = useState('');
    const [verticals, setVerticals] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedVertical, setSelectedVertical] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [centers, setCenters] = useState([]);
    const [courseName, setCourseName] = useState([]);
    const [batches, setBatches] = useState([]);
    const [leadOwner, setLeadOwner] = useState([]);
    const [registeredBy, setRegisteredBy] = useState([]);
    const [jobName, setJobName] = useState([]);

    const [whatappTemplateField, setWhatappTemplateField] = useState(false);
    const [whatsappTemplates, setWhatsappTemplates] = useState([]);

    useEffect(() => {
        fetchRules();
        fetchStatuses();
        fetchCourses();
        fetchBatches();
        fetchleadOwnwer();
        fetchJobData();
        fetchWhatsappTemplates();
    }, []);

    // Cleanup modal on component unmount
    // useEffect(() => {
    //     return () => {
    //         forceCloseModal();
    //     };
    // }, []);


    useEffect(() => {
        fetchVerticals();
    }, [token]);

    const [dropdownStates, setDropdownStates] = useState({
        verticals: false,
        projects: false,
        statuses: false,
        subStatuses: false
    });

    const [ruleData, setRuleData] = useState(
        {
            _id: null,
            startDate: '',
            startTime: '',
            endTime: '',
            name: '',
            conditionBlocks: [],
            interBlockLogicOperator: 'and',
            // actionsPerformed: {
            primaryAction: {
                activityType: '',
                values: [],
            },
            additionalActions: []
            ,
            communication: {
                executionType: '',
                mode: '',
                occurrenceCount: '',
                communications: [
                    {
                        templateId: '',
                        timing: '',
                        order: 1
                    }
                ],
                recipient: '',
            },
        });

    const clearRuleData = () => {
        setRuleData(
            {
                _id: null,
                startDate: '',
                startTime: '',
                endTime: '',
                name: '',
                conditionBlocks: [],
                interBlockLogicOperator: 'and',
                // actionsPerformed: {
                primaryAction: {
                    activityType: '',
                    values: [],
                },
                additionalActions: []
                ,
                communication: {
                    executionType: '',
                    mode: '',
                    occurrenceCount: '',
                    communications: [
                        {
                            templateId: '',
                            timing: '',
                            order: 1
                        }
                    ],
                    recipient: '',
                },
            });
    }


    useEffect(() => {
        // Only fetch projects if we have verticals loaded and a token
        if (verticals.length > 0 && token) {
            // Initially fetch all projects (no vertical selected)
            fetchProjects();
        }
    }, [verticals, token]);

    useEffect(() => {
        fetchCenters();
    }, [])
    const handleVerticalChange = (verticalId) => {

        const selectedVertical = verticals.find(v => v.id === verticalId);
        setSelectedVertical(selectedVertical);

    };

    // Function to clear vertical selection and fetch all projects
    const clearVerticalSelection = () => {
        setSelectedVertical(null);
        setProjects([]);
        fetchProjects();
        setCenters([]);
    };

    // Function to handle occurrence count change and create communication blocks
    const handleOccurrenceCountChange = (count) => {
        const numCount = parseInt(count) || 1;
        const newCommunications = [];

        for (let i = 1; i <= numCount; i++) {
            newCommunications.push({
                templateId: '',
                timing: '',
                order: i
            });
        }

        setRuleData(prev => ({
            ...prev,
            communication: {
                ...prev.communication,
                occurrenceCount: count,
                communications: newCommunications
            }
        }));
    };

    // Function to update individual communication
    const updateCommunication = (index, field, value) => {
        setRuleData(prev => ({
            ...prev,
            communication: {
                ...prev.communication,
                communications: prev.communication.communications.map((comm, i) =>
                    i === index ? { ...comm, [field]: value } : comm
                )
            }
        }));
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
                    code: v.code,
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


        if (!token) {
            console.warn('No authentication token available');
            setError('Authentication required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // let url = `${backendUrl}/college/dripmarketing/list-projects`;
            let url = `${backendUrl}/college/dripmarketing/list_all_projects`;


            if (verticalId) {
                url += `?vertical=${verticalId}`;
            }




            const response = await axios.get(url, {
                headers: {
                    'x-auth': token,
                    'Content-Type': 'application/json'
                }
            });



            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                setProjects(response.data.data);

            } else {

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

    const fetchCenters = async () => {
        // Get projectId from selectedProject prop or URL (for refresh cases)
        const projectId = selectedProject?._id;

        setLoading(true);
        setError(null);
        try {

            const response = await fetch(`${backendUrl}/college/dripmarketing/list-centers`, {
                headers: {
                    'x-auth': token,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch centers');

            const data = await response.json();

            if (data.success) {
                setCenters(data.data);

            } else {
                setError('Failed to load centers');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const fetchCourses = async () => {
        try {
            const response = await axios.get(`${backendUrl}/college/dripmarketing/all_courses`, {
                headers: { 'x-auth': token }
            });
            if (response.data.success) {
                setCourseName(response.data.data);

            }
        }
        catch (error) {
            console.error('Error fetching courses:', error);
        }
    }
    const fetchBatches = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.get(`${backendUrl}/college/dripmarketing/get_batches`, {

                headers: {
                    'x-auth': token  // Pass the token in the headers for authentication
                }
            });

            if (response.data.success) {
                setBatches(response.data.data);
            } else {
                setError('Failed to fetch batches');
            }
        } catch (err) {
            console.error('Error fetching batches:', err);
            setError('Server error');
        } finally {
            setLoading(false);
        }
    };

    const fetchleadOwnwer = async () => {
        try {
            if (!token) {
                console.warn('No token found in session storage.');
                return;
            }

            const response = await axios.get(`${backendUrl}/college/dripmarketing/leadowner`, {
                headers: { 'x-auth': token }
            });

            if (response.data.success) {
                setLeadOwner(response.data.concernPersons);
                setRegisteredBy(response.data.concernPersons);

            } else {
                console.error('Failed to fetch concern persons:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching concern persons:', error);
        }
    };

    const fetchJobData = async () => {
        try {



            if (!token) {
                console.warn('No token found in session storage.');
                return;
            }

            const response = await axios.get(`${backendUrl}/college/dripmarketing/joblisting`, {
                headers: { 'x-auth': token }
            });

            setJobName(response.data.data);

        } catch (error) {
            console.error("Error fetching course data:", error);
        }
    };

    const fetchWhatsappTemplates = async () => {
        try {
            if (!token) {
                console.warn('No token found in session storage.');
                return;
            }

            const response = await axios.get(`${backendUrl}/college/whatsapp/templates`, {
                headers: { 'x-auth': token }
            });



            if (response.data.success) {
                setWhatsappTemplates(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching WhatsApp templates:', error);
        }
    };

    // Fetch all statuses

    const fetchStatuses = async () => {
        try {
            if (!token) {
                console.warn('No token found in session storage.');
                return;
            }

            const response = await axios.get(`${backendUrl}/college/dripmarketing/status`, {
                headers: { 'x-auth': token }
            });

            if (response.data.success) {
                setStatuses(response.data.data);

            }
        } catch (error) {
            console.error('Error fetching statuses:', error);
        }
    };
    useEffect(() => {
        fetchSubStatuses();
    }, []);
    // Fetch sub-statuses based on selected status
    const fetchSubStatuses = async () => {
        try {


            const response = await axios.get(`${backendUrl}/college/dripmarketing/substatus`, {
                headers: { 'x-auth': token }
            });

            if (response.data.success) {
                setSubStatuses(response.data.data);

            }
        } catch (error) {
            console.error('Error fetching sub-statuses:', error);
        }
    };

    // Handle status change
    const handleStatusChange = (statusId) => {
        setSelectedStatus(statusId);

    };


    const handleAddRule = async () => {
        try {

            const requestData = {
                name: ruleData.name,
                startDate: ruleData.startDate,
                startTime: ruleData.startTime,
                conditionBlocks: ruleData.conditionBlocks.map(block => ({
                    conditions: block.conditions.filter(condition =>
                        condition.activityType && condition.operator && condition.values.length > 0
                    ).map(condition => ({
                        activityType: condition.activityType,
                        operator: condition.operator,
                        values: condition.values,
                    })),
                    intraBlockLogicOperator: block.intraBlockLogicOperator || 'and',
                })).filter(block => block.conditions.length > 0),
                interBlockLogicOperator: ruleData.interBlockLogicOperator || 'and',

                primaryAction: {
                    activityType: ruleData.primaryAction.activityType,
                    values: ruleData.primaryAction.values,
                },
                additionalActions: ruleData.additionalActions.filter(action =>
                    action.activityType && action.values.length > 0
                ).map(action => ({
                    activityType: action.activityType,
                    values: action.values,
                }))
                ,
                communication: {
                    executionType: ruleData.communication.executionType,
                    mode: ruleData.communication.mode,
                    occurrenceCount: ruleData.communication.occurrenceCount,
                    communications: ruleData.communication.communications.map(comm => ({
                        templateId: comm.templateId,
                        timing: comm.timing,
                        order: comm.order
                    })),
                    recipient: ruleData.communication.recipient,
                },


            };

            console.log(requestData, 'requestData')

            const responseData = await axios.post(`${backendUrl}/college/dripmarketing/create-dripmarketing-rule`, requestData, {
                headers: {
                    'x-auth': token
                }
            });

            if (responseData.data.success) {
                alert('Rule created successfully!');
                setRuleData({
                    startDate: '',
                    startTime: '',
                    name: '',
                    conditionBlocks: [],
                    interBlockLogicOperator: 'and',
                    actionsPerformed: [],
                    primaryAction: {
                        activityType: '',
                        values: [],
                    },
                    additionalActions: [
                        {
                            activityType: '',
                            values: [],
                        },
                    ],
                    communication: {
                        executionType: '',
                        mode: '',
                        occurrenceCount: '',
                        communications: [
                            {
                                templateId: '',
                                timing: '',
                                order: 1
                            }
                        ],
                        recipient: '',
                    },


                });

                // Close the modal
                // closeModal();
            }

            // console.log('responseData', responseData)

        }
        catch (error) {
            console.error('Error adding rule:', error);
            setError('Error creating rule. Please try again.');
        }
        finally {
            fetchRules();
        }


    }

    const fetchRules = async () => {

        try {
            const response = await axios.get(`${backendUrl}/college/dripmarketing/get-dripmarketing-rule`, {
                headers: { 'x-auth': token }
            });
            // console.log(response.data.data, 'response.data.data')
            if (response.data.success) {
                setRules(response.data.data);
                response.data.data.forEach(rule => {
                    if (rule.communication.occurrenceCount) {
                        rule.communication.occurrenceCount = rule.communication.occurrenceCount.toString();
                    }
                });
            }
        }
        catch (error) {
            console.error('Error fetching rules:', error);
        }
    }

    const handleUpdateRule = async (ruleId) => {
        let updatedRules = [...rules];
        try {
            const updateData = {
                name: ruleData.name,
                startDate: ruleData.startDate,
                startTime: ruleData.startTime,
                conditionBlocks: ruleData.conditionBlocks.map(block => ({
                    conditions: block.conditions.filter(condition =>
                        condition.activityType && condition.operator && condition.values.length > 0
                    ).map(condition => ({
                        activityType: condition.activityType,
                        operator: condition.operator,
                        values: condition.values,
                    })),
                    intraBlockLogicOperator: block.intraBlockLogicOperator || 'and',
                })).filter(block => block.conditions.length > 0),
                interBlockLogicOperator: ruleData.interBlockLogicOperator || 'and',

                primaryAction: {
                    activityType: ruleData.primaryAction.activityType,
                    values: ruleData.primaryAction.values,
                },
                additionalActions: ruleData.additionalActions.filter(action =>
                    action.activityType && action.values.length > 0
                ).map(action => ({
                    activityType: action.activityType,
                    values: action.values,
                }))
                ,
                communication: {
                    executionType: ruleData.communication.executionType,
                    mode: ruleData.communication.mode,
                    occurrenceCount: ruleData.communication.occurrenceCount,
                    communications: ruleData.communication.communications.map(comm => ({
                        templateId: comm.templateId,
                        timing: comm.timing,
                        order: comm.order
                    })),
                    recipient: ruleData.communication.recipient,
                },


            };

            const response = await axios.put(`${backendUrl}/college/dripmarketing/update-dripmarketing-rule/${ruleData._id}`, updateData, {
                headers: { 'x-auth': token }

            });

            if (response.data.success) {
                clearRuleData();

                const UpdatedRuleData = response.data.data;
                
              
                alert('Rule updated successfully');
                setIsEditing(false);
                setModalMode('');
                setEditRule({});

                // Close the modal
                closeModal();

            }
            // console.log('response', response)
        } catch (err) {
            console.error('Error updating rule:', err);
            setError('Error updating rule. Please try again.');
        }
        finally{
            fetchRules();

        }
    }

    const handleStatusUpdate = async (ruleId, status) => {
        try {
            const response = await axios.put(`${backendUrl}/college/dripmarketing/status-update/${ruleId}`, { status }, {
                headers: { 'x-auth': token }
            });

            if (response.data.success) {

                const updatedRules = [...rules];

                updatedRules.forEach(rule => {
                    if (rule._id === ruleId) {


                        rule.isActive = status;
                    }
                });
                setRules(updatedRules);

                alert('Rule status updated successfully');
            }
            else {
                alert('Error updating rule status. Please try again.');
            }
        } catch (err) {
            console.error('Error updating rule status:', err);
            setError('Error updating rule status. Please try again.');
        }
    }

    const loadRuleForEdit = (ruleId) => {

        const ruleToEdit = rules.find(rule => rule._id === ruleId);

        if (ruleToEdit) {
            // Convert 12-hour format to 24-hour format for time input
            let timeForInput = ruleToEdit.startTime || '';
            if (timeForInput && timeForInput.includes(' ')) {
                const [time, ampm] = timeForInput.split(' ');
                const [hours, minutes] = time.split(':');
                let hour24 = parseInt(hours);

                if (ampm === 'PM' && hour24 !== 12) {
                    hour24 += 12;
                } else if (ampm === 'AM' && hour24 === 12) {
                    hour24 = 0;
                }

                timeForInput = `${hour24.toString().padStart(2, '0')}:${minutes}`;
            }

            setRuleData({
                _id: ruleToEdit._id || null,
                name: ruleToEdit.name || '',
                description: ruleToEdit.description || '',
                startDate: ruleToEdit.startDate ? new Date(ruleToEdit.startDate) : '',
                startTime: timeForInput,
                endTime: ruleToEdit.endTime || '',
                // conditionBlocks: ruleToEdit.conditionBlocks || [],
                // conditionBlock: ruleToEdit.conditionBlocks.map
                conditionBlocks: (ruleToEdit.conditionBlocks || []).map(block => ({
                    ...block,
                    conditions: (block.conditions || []).map(condition => ({
                        activityType: condition.activityType || '',
                        operator: condition.operator || '',
                        values: condition.values || [],
                    })),
                    intraBlockLogicOperator: block.intraBlockLogicOperator || 'and',
                })),
                interBlockLogicOperator: ruleToEdit.interBlockLogicOperator || 'and',
                primaryAction: ruleToEdit.primaryAction || { activityType: '', values: [] },
                additionalActions: ruleToEdit.additionalActions || [],
                communication: {
                    executionType: ruleToEdit.communication?.executionType || '',
                    mode: ruleToEdit.communication?.mode || '',
                    occurrenceCount: ruleToEdit.communication?.occurrenceCount || '',
                    communications: ruleToEdit.communication?.communications || [{
                        templateId: '',
                        timing: '',
                        order: 1
                    }],
                    recipient: ruleToEdit.communication?.recipient || ''
                }
            });


            if (ruleToEdit.conditionBlocks && ruleToEdit.conditionBlocks.length > 0) {

                const conditionArray = [];
                const conditionsArray = [];
                const conditionSelectionsArray = [];
                const conditionOperatorsArray = [];
                const conditionValuesArray = [];
                const subConditionSelectionsArray = [];


                ruleToEdit.conditionBlocks.forEach((block, blockIndex) => {

                    conditionArray.push({
                        blockIndex: blockIndex,
                        blockId: block._id || `block-${blockIndex}`
                    });

                    if (block.conditions && block.conditions.length > 0) {
                        const blockConditions = [];
                        const blockSelections = [];
                        const blockOperators = [];
                        const blockValues = [];
                        const blockSubSelections = [];

                        block.conditions.forEach((condition, conditionIndex) => {
                            blockConditions.push(condition);
                            blockSelections.push(condition.activityType || '');
                            blockOperators.push(condition.operator || '');
                            blockValues.push(condition.values || []);
                            blockSubSelections.push([]);
                        });

                        conditionsArray.push(blockConditions);
                        conditionSelectionsArray.push(blockSelections);
                        conditionOperatorsArray.push(blockOperators);
                        conditionValuesArray.push(blockValues);
                        subConditionSelectionsArray.push(blockSubSelections);
                    } else {

                        conditionsArray.push([]);
                        conditionSelectionsArray.push([]);
                        conditionOperatorsArray.push([]);
                        conditionValuesArray.push([]);
                        subConditionSelectionsArray.push([]);
                    }
                });


                setCondition(conditionArray);
                setConditions(conditionsArray);
                setConditionSelections(conditionSelectionsArray);
                setConditionOperators(conditionOperatorsArray);
                setConditionValues(conditionValuesArray);
                setSubConditionSelections(subConditionSelectionsArray);
            } else {

                setCondition([]);
                setConditions([]);
                setConditionSelections([]);
                setConditionOperators([]);
                setConditionValues([]);
                setSubConditionSelections([]);
            }
        }
    };

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
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [conditionBlocks, setConditionBlocks] = useState([]);
    const [interBlockLogicOperator, setInterBlockLogicOperator] = useState('and');
    const [primaryAction, setPrimaryAction] = useState({});
    const [additionalActions, setAdditionalActions] = useState([]);
    const [communication, setCommunication] = useState({});

    // Mapping of activity types to their corresponding value options
    const activityTypeValueOptions = {

        state: [
            { value: "andaman-nicobar", label: "Andaman and Nicobar Islands" },
            { value: "andhra-pradesh", label: "Andhra Pradesh" },
            { value: "arunachal-pradesh", label: "Arunachal Pradesh" },
            { value: "assam", label: "Assam" },
            { value: "bihar", label: "Bihar" },
            { value: "chandigarh", label: "Chandigarh" },
            { value: "chhattisgarh", label: "Chhattisgarh" },
            { value: "dadra-nagar-haveli", label: "Dadra and Nagar Haveli" },
            { value: "daman-diu", label: "Daman and Diu" },
            { value: "delhi", label: "Delhi" },
            { value: "goa", label: "Goa" },
            { value: "gujarat", label: "Gujarat" },
            { value: "haryana", label: "Haryana" },
            { value: "himachal-pradesh", label: "Himachal Pradesh" },
            { value: "jammu-kashmir", label: "Jammu and Kashmir" },
            { value: "jharkhand", label: "Jharkhand" },
            { value: "karnataka", label: "Karnataka" },
            { value: "kerala", label: "Kerala" },
            { value: "ladakh", label: "Ladakh" },
            { value: "lakshadweep", label: "Lakshadweep" },
            { value: "madhya-pradesh", label: "Madhya Pradesh" },
            { value: "maharashtra", label: "Maharashtra" },
            { value: "manipur", label: "Manipur" },
            { value: "meghalaya", label: "Meghalaya" },
            { value: "mizoram", label: "Mizoram" },
            { value: "nagaland", label: "Nagaland" },
            { value: "odisha", label: "Odisha" },
            { value: "puducherry", label: "Puducherry" },
            { value: "punjab", label: "Punjab" },
            { value: "rajasthan", label: "Rajasthan" },
            { value: "sikkim", label: "Sikkim" },
            { value: "tamil-nadu", label: "Tamil Nadu" },
            { value: "telangana", label: "Telangana" },
            { value: "tripura", label: "Tripura" },
            { value: "uttar-pradesh", label: "Uttar Pradesh" },
            { value: "uttarakhand", label: "Uttarakhand" },
            { value: "west-bengal", label: "West Bengal" }
        ],
        status: [],
        subStatus: [],
        leadOwner: [],
        registeredBy: [],
        courseName: [],
        jobName: [],
        // email: [],
        // mobile: [],
        project: [],
        vertical: [],
        center: [],
        course: [],
        batch: []
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
        } else if (activityType === 'batch') {
            return batches.map(batch => ({
                value: batch._id,
                label: batch.name
            }));
        } else if (activityType === 'center') {
            return centers.map(center => ({
                value: center._id,
                label: center.name
            }));
        } else if (activityType === 'course') {
            return courseName.map(course => ({
                value: course._id,
                label: course.name
            }));
        } else if (activityType === 'leadOwner') {
            return leadOwner.map(owner => ({
                value: owner._id,
                label: owner.name
            }));
        } else if (activityType === 'registeredBy') {
            return registeredBy.map(registeredBy => ({
                value: registeredBy._id,
                label: registeredBy.name
            }));
        } else if (activityType === 'jobName') {
            return jobName?.map(job => ({
                value: job?._id,
                label: job?.title
            }));
        }
        return activityTypeValueOptions[activityType] || [];
    };

    // Mapping for THEN section value options
    const thenValueOptions = {
        state: [
            { value: "andaman-nicobar", label: "Andaman and Nicobar Islands" },
            { value: "andhra-pradesh", label: "Andhra Pradesh" },
            { value: "arunachal-pradesh", label: "Arunachal Pradesh" },
            { value: "assam", label: "Assam" },
            { value: "bihar", label: "Bihar" },
            { value: "chandigarh", label: "Chandigarh" },
            { value: "chhattisgarh", label: "Chhattisgarh" },
            { value: "dadra-nagar-haveli", label: "Dadra and Nagar Haveli" },
            { value: "daman-diu", label: "Daman and Diu" },
            { value: "delhi", label: "Delhi" },
            { value: "goa", label: "Goa" },
            { value: "gujarat", label: "Gujarat" },
            { value: "haryana", label: "Haryana" },
            { value: "himachal-pradesh", label: "Himachal Pradesh" },
            { value: "jammu-kashmir", label: "Jammu and Kashmir" },
            { value: "jharkhand", label: "Jharkhand" },
            { value: "karnataka", label: "Karnataka" },
            { value: "kerala", label: "Kerala" },
            { value: "ladakh", label: "Ladakh" },
            { value: "lakshadweep", label: "Lakshadweep" },
            { value: "madhya-pradesh", label: "Madhya Pradesh" },
            { value: "maharashtra", label: "Maharashtra" },
            { value: "manipur", label: "Manipur" },
            { value: "meghalaya", label: "Meghalaya" },
            { value: "mizoram", label: "Mizoram" },
            { value: "nagaland", label: "Nagaland" },
            { value: "odisha", label: "Odisha" },
            { value: "puducherry", label: "Puducherry" },
            { value: "punjab", label: "Punjab" },
            { value: "rajasthan", label: "Rajasthan" },
            { value: "sikkim", label: "Sikkim" },
            { value: "tamil-nadu", label: "Tamil Nadu" },
            { value: "telangana", label: "Telangana" },
            { value: "tripura", label: "Tripura" },
            { value: "uttar-pradesh", label: "Uttar Pradesh" },
            { value: "uttarakhand", label: "Uttarakhand" },
            { value: "west-bengal", label: "West Bengal" }
        ],
        status: [],
        subStatus: [],
        leadOwner: [],
        registeredBy: [],
        courseName: [],
        jobName: [],
        project: [],
        vertical: [],
        center: [],
        course: [],
        batch: []
    };

    // Function to get THEN value options
    const getThenValueOptions = (activityType) => {
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
        } else if (activityType === 'batch') {
            return batches.map(batch => ({
                value: batch._id,
                label: batch.name
            }));
        } else if (activityType === 'center') {
            return centers.map(center => ({
                value: center._id,
                label: center.name
            }));
        } else if (activityType === 'course') {
            return courseName.map(course => ({
                value: course._id,
                label: course.name
            }));
        } else if (activityType === 'leadOwner') {
            return leadOwner.map(owner => ({
                value: owner._id,
                label: owner.name
            }));
        } else if (activityType === 'registeredBy') {
            return registeredBy.map(registeredBy => ({
                value: registeredBy._id,
                label: registeredBy.name
            }));
        } else if (activityType === 'jobName') {
            return jobName?.map(job => ({
                value: job?._id,
                label: job?.title
            }));
        }
        return thenValueOptions[activityType] || [];
    };

    const thenFirstValueOptions = {
        state: [
            { value: "andaman-nicobar", label: "Andaman and Nicobar Islands" },
            { value: "andhra-pradesh", label: "Andhra Pradesh" },
            { value: "arunachal-pradesh", label: "Arunachal Pradesh" },
            { value: "assam", label: "Assam" },
            { value: "bihar", label: "Bihar" },
            { value: "chandigarh", label: "Chandigarh" },
            { value: "chhattisgarh", label: "Chhattisgarh" },
            { value: "dadra-nagar-haveli", label: "Dadra and Nagar Haveli" },
            { value: "daman-diu", label: "Daman and Diu" },
            { value: "delhi", label: "Delhi" },
            { value: "goa", label: "Goa" },
            { value: "gujarat", label: "Gujarat" },
            { value: "haryana", label: "Haryana" },
            { value: "himachal-pradesh", label: "Himachal Pradesh" },
            { value: "jammu-kashmir", label: "Jammu and Kashmir" },
            { value: "jharkhand", label: "Jharkhand" },
            { value: "karnataka", label: "Karnataka" },
            { value: "kerala", label: "Kerala" },
            { value: "ladakh", label: "Ladakh" },
            { value: "lakshadweep", label: "Lakshadweep" },
            { value: "madhya-pradesh", label: "Madhya Pradesh" },
            { value: "maharashtra", label: "Maharashtra" },
            { value: "manipur", label: "Manipur" },
            { value: "meghalaya", label: "Meghalaya" },
            { value: "mizoram", label: "Mizoram" },
            { value: "nagaland", label: "Nagaland" },
            { value: "odisha", label: "Odisha" },
            { value: "puducherry", label: "Puducherry" },
            { value: "punjab", label: "Punjab" },
            { value: "rajasthan", label: "Rajasthan" },
            { value: "sikkim", label: "Sikkim" },
            { value: "tamil-nadu", label: "Tamil Nadu" },
            { value: "telangana", label: "Telangana" },
            { value: "tripura", label: "Tripura" },
            { value: "uttar-pradesh", label: "Uttar Pradesh" },
            { value: "uttarakhand", label: "Uttarakhand" },
            { value: "west-bengal", label: "West Bengal" }
        ],
        status: [],
        subStatus: [],
        leadOwner: [],
        registeredBy: [],
        courseName: [],
        jobName: [],
        project: [],
        vertical: [],
        center: [],
        course: [],
        batch: []
    };

    const getThenFirstValueOptions = (activityType) => {
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
        } else if (activityType === 'batch') {
            return batches.map(batch => ({
                value: batch._id,
                label: batch.name
            }));
        } else if (activityType === 'center') {
            return centers.map(center => ({
                value: center._id,
                label: center.name
            }));
        } else if (activityType === 'course') {
            return courseName.map(course => ({
                value: course._id,
                label: course.name
            }));
        } else if (activityType === 'leadOwner') {
            return leadOwner.map(owner => ({
                value: owner._id,
                label: owner.name
            }));
        } else if (activityType === 'registeredBy') {
            return registeredBy.map(registeredBy => ({
                value: registeredBy._id,
                label: registeredBy.name
            }));
        } else if (activityType === 'jobName') {
            return jobName?.map(job => ({
                value: job?._id,
                label: job?.title
            }));
        }
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

    const resetFormData = () => {
        // Reset ruleData to initial state
        setRuleData({
            startDate: '',
            startTime: '',
            endTime: '',
            description: '',
            name: '',
            conditionBlocks: [],
            interBlockLogicOperator: 'and',
            primaryAction: {
                activityType: '',
                values: [],
            },
            additionalActions: [],
            communication: {
                executionType: '',
                mode: '',
                occurrenceCount: '',
                communications: [
                    {
                        templateId: '',
                        timing: '',
                        order: 1
                    }
                ],
                recipient: '',
            },
        });

        // Reset all condition-related state
        setCondition([]);
        setConditions([]);
        setConditionSelections([]);
        setConditionOperators([]);
        setConditionValues([]);
        setSubConditionSelections([]);
        setSubConditionOperators([]);
        setSubConditionValues([]);

        // Reset then-related state
        setThenCondition([]);
        setThenConditions([]);
        setThenConditionSelections([]);
        setThenSubConditionSelections([]);

        // Reset other state
        setSubLogicOperator('and');
        setEditRule({});
        setIsEditing(false);
    };

    const handleAddCondition = () => {
        setCondition(prev => [...prev, {}]);
        setConditions(prev => [...prev, [{}]]);
        setConditionSelections(prev => [...prev, ['']]);
        setConditionOperators(prev => [...prev, ['']]);
        setConditionValues(prev => [...prev, ['']]);
        setSubConditionSelections(prev => [...prev, []]);

        // Add new condition block to ruleData
        setRuleData(prev => ({
            ...prev,
            conditionBlocks: [
                ...prev.conditionBlocks,
                {
                    conditions: [{
                        activityType: '',
                        operator: '',
                        values: []
                    }],
                    intraBlockLogicOperator: 'and'
                }
            ]
        }));
    }

    const handleAddThenCondition = () => {
        // Add a new then condition with default values
        const newAction = { activityType: '', values: [] };

        setThenCondition(prev => [...prev, newAction]);
        setThenConditions(prev => [...prev, [{}]]);
        setThenConditionSelections(prev => [...prev, ['']]);
        setThenSubConditionSelections(prev => [...prev, []]);


        setRuleData(prev => ({
            ...prev,
            additionalActions: [...prev.additionalActions, newAction]
        }));
    }

    const handleRemoveThenCondition = (indexToRemove) => {
        setThenCondition(prev => prev.filter((_, i) => i !== indexToRemove));
        setThenConditions(prev => prev.filter((_, i) => i !== indexToRemove));
        setThenConditionSelections(prev => prev.filter((_, i) => i !== indexToRemove));
        setThenSubConditionSelections(prev => prev.filter((_, i) => i !== indexToRemove));

        //  Remove from ruleData.additionalActions
        setRuleData(prev => ({
            ...prev,
            additionalActions: prev.additionalActions.filter((_, i) => i !== indexToRemove)
        }));
    }

    const handleThenConditionChange = (index, field, value) => {
        setThenCondition(prev => prev.map((condition, i) =>
            i === index ? { ...condition, [field]: value } : condition
        ));

        // Update ruleData.additionalActions
        setRuleData(prev => ({
            ...prev,
            additionalActions: prev.additionalActions.map((action, i) =>
                i === index ? { ...action, [field]: value } : action
            )
        }));
    }

    const handleRemoveCondition = (indexToRemove) => {
        setCondition(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditions(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditionSelections(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditionOperators(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditionValues(prev => prev.filter((_, i) => i !== indexToRemove));
        setSubConditionSelections(prev => prev.filter((_, i) => i !== indexToRemove));

        // Remove condition block from ruleData
        setRuleData(prev => ({
            ...prev,
            conditionBlocks: prev.conditionBlocks.filter((_, i) => i !== indexToRemove)
        }));
    };

    const handleAddSubCondition = (blockIndex) => {
        setConditions(prev => {
            const next = [...prev];
            const currentBlock = next[blockIndex] || [];
            next[blockIndex] = [...currentBlock, {}];
            return next;
        });
        setConditionSelections(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            rows.push('');
            next[blockIndex] = rows;
            return next;
        });
        setConditionOperators(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            rows.push('');
            next[blockIndex] = rows;
            return next;
        });
        setConditionValues(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            rows.push('');
            next[blockIndex] = rows;
            return next;
        });

        // Add new condition to existing block in ruleData
        setRuleData(prev => {
            const newRuleData = { ...prev };
            if (newRuleData.conditionBlocks[blockIndex]) {
                newRuleData.conditionBlocks[blockIndex] = {
                    ...newRuleData.conditionBlocks[blockIndex],
                    conditions: [
                        ...newRuleData.conditionBlocks[blockIndex].conditions,
                        {
                            activityType: '',
                            operator: '',
                            values: []
                        }
                    ]
                };
            }
            return newRuleData;
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
        setConditionSelections(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            if (rows.length > subIndex) {
                rows.splice(subIndex, 1);
                next[blockIndex] = rows;
            }
            return next;
        });
        setConditionOperators(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            if (rows.length > subIndex) {
                rows.splice(subIndex, 1);
                next[blockIndex] = rows;
            }
            return next;
        });
        setConditionValues(prev => {
            const next = [...prev];
            const rows = [...(next[blockIndex] || [])];
            if (rows.length > subIndex) {
                rows.splice(subIndex, 1);
                next[blockIndex] = rows;
            }
            return next;
        });

        // Remove condition from ruleData
        setRuleData(prev => {
            const newRuleData = { ...prev };
            if (newRuleData.conditionBlocks[blockIndex] && newRuleData.conditionBlocks[blockIndex].conditions) {

                const conditionIndex = subIndex + 1;
                newRuleData.conditionBlocks[blockIndex].conditions = newRuleData.conditionBlocks[blockIndex].conditions.filter((_, i) => i !== conditionIndex);
            }
            return newRuleData;
        });
    };



    const handleSelectChange = (blockIndex, selectIndex, value) => {
        setConditionSelections(prev => {
            const next = [...prev];
            const current = [...(next[blockIndex] || [''])];

            while (current.length <= selectIndex) {
                current.push('');
            }

            current[selectIndex] = value;



            next[blockIndex] = current;
            return next;
        });

        // Update ruleData conditionBlocks
        setRuleData(prev => {
            const newRuleData = { ...prev };
            if (!newRuleData.conditionBlocks[blockIndex]) {
                newRuleData.conditionBlocks[blockIndex] = {
                    conditions: [{ activityType: '', operator: '', values: [] }],
                    intraBlockLogicOperator: 'and'
                };
            }

            // Ensure conditions array is long enough
            while (newRuleData.conditionBlocks[blockIndex].conditions.length <= selectIndex) {
                newRuleData.conditionBlocks[blockIndex].conditions.push({
                    activityType: '',
                    operator: '',
                    values: []
                });
            }

            // Update the specific condition
            newRuleData.conditionBlocks[blockIndex].conditions[selectIndex].activityType = value;

            // Only clear operator and values if this is a new selection
            // Don't clear if user is just changing the activity type
            if (value === '') {
                newRuleData.conditionBlocks[blockIndex].conditions[selectIndex].operator = '';
                newRuleData.conditionBlocks[blockIndex].conditions[selectIndex].values = [];
            }

            return newRuleData;
        });

        // Only clear subsequent dropdowns if this is the first condition and activity type is cleared
        if (selectIndex === 0 && value === '') {
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
        }
    };

    const handleOperatorChange = (blockIndex, selectIndex, value) => {
        setConditionOperators(prev => {
            const next = [...prev];
            const current = [...(next[blockIndex] || [''])];

            // Ensure the array is long enough
            while (current.length <= selectIndex) {
                current.push('');
            }

            current[selectIndex] = value;

            // Don't automatically add new operators - only update the current one
            // New operators will be added only when + button is clicked

            next[blockIndex] = current;
            return next;
        });

        // Update ruleData conditionBlocks
        setRuleData(prev => {
            const newRuleData = { ...prev };
            if (!newRuleData.conditionBlocks[blockIndex]) {
                newRuleData.conditionBlocks[blockIndex] = {
                    conditions: [{ activityType: '', operator: '', values: [] }],
                    intraBlockLogicOperator: 'and'
                };
            }

            // Ensure conditions array is long enough
            while (newRuleData.conditionBlocks[blockIndex].conditions.length <= selectIndex) {
                newRuleData.conditionBlocks[blockIndex].conditions.push({
                    activityType: '',
                    operator: '',
                    values: []
                });
            }

            // Update the specific condition
            newRuleData.conditionBlocks[blockIndex].conditions[selectIndex].operator = value;

            // Only clear values if operator is cleared
            if (value === '') {
                newRuleData.conditionBlocks[blockIndex].conditions[selectIndex].values = [];
            }

            return newRuleData;
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

            // Ensure the array is long enough
            while (current.length <= selectIndex) {
                current.push('');
            }

            // Handle both single values and arrays (for multiselect)
            current[selectIndex] = value;

            // Don't automatically add new values - only update the current one
            // New values will be added only when + button is clicked

            next[blockIndex] = current;
            return next;
        });

        // Update ruleData conditionBlocks
        setRuleData(prev => {
            const newRuleData = { ...prev };
            if (!newRuleData.conditionBlocks[blockIndex]) {
                newRuleData.conditionBlocks[blockIndex] = {
                    conditions: [{ activityType: '', operator: '', values: [] }],
                    intraBlockLogicOperator: 'and'
                };
            }

            // Ensure conditions array is long enough
            while (newRuleData.conditionBlocks[blockIndex].conditions.length <= selectIndex) {
                newRuleData.conditionBlocks[blockIndex].conditions.push({
                    activityType: '',
                    operator: '',
                    values: []
                });
            }

            // Update the specific condition
            newRuleData.conditionBlocks[blockIndex].conditions[selectIndex].values = Array.isArray(value) ? value : [value];

            return newRuleData;
        });

        // Check if this is a status value selection and fetch sub-statuses
        const activityType = (conditionSelections[blockIndex] || [''])[0];


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

        setRuleData(prev => {
            const newRuleData = { ...prev };

            if (!newRuleData.conditionBlocks[blockIndex]) {
                newRuleData.conditionBlocks[blockIndex] = {
                    conditions: [],
                    intraBlockLogicOperator: 'and'
                };
            }

            const conditionIndex = rowIndex + 1;

            if (!newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex]) {
                newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex] = { activityType: '', operator: '', values: [] };
            }

            newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex].activityType = value;
            newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex].operator = '';
            newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex].values = [];

            return newRuleData;
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

        setRuleData(prev => {
            const newRuleData = { ...prev };
            if (!newRuleData.conditionBlocks[blockIndex]) {
                newRuleData.conditionBlocks[blockIndex] = {
                    conditions: [],
                    intraBlockLogicOperator: 'and'
                };
            }

            const conditionIndex = rowIndex + 1;

            if (!newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex]) {
                newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex] = { activityType: '', operator: '', values: [] };
            }
            newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex].operator = value;

            return newRuleData;
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
            setRuleData(prev => {
                const newRuleData = { ...prev };
                const conditionIndex = rowIndex + 1;
                if (newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex]) {
                    newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex].values = [];
                }
                return newRuleData;
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

        setRuleData(prev => {
            const newRuleData = { ...prev };

            if (!newRuleData.conditionBlocks[blockIndex]) {
                newRuleData.conditionBlocks[blockIndex] = {
                    conditions: [],
                    intraBlockLogicOperator: 'and'
                };
            }


            const conditionIndex = rowIndex + 1;

            if (!newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex]) {
                newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex] = { activityType: '', operator: '', values: [] };
            }

            let updatedValues = [];

            if (Array.isArray(value)) {
                // Multiselect dropdown already gives you the full list (after add/remove)
                updatedValues = value;
            } else {
                // Single select
                if (value === "") {
                    // Handle "deselect" → clear values
                    updatedValues = [];
                } else {
                    // Update the single value
                    updatedValues = [value];
                }
            }

            newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex] = {
                ...newRuleData.conditionBlocks[blockIndex].conditions[conditionIndex],
                values: updatedValues
            };

            return newRuleData;
        });


        // Check if this is a status value selection in sub-condition and fetch sub-statuses
        const activityType = (subConditionSelections[blockIndex]?.[rowIndex] || [''])[0];


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

            <div className="row justify-content-between align-items-center mb-4">
                <div className="col-12 col-lg-6">
                    <div className="mb-3 mb-lg-0">
                        <h3 className="display-5 fw-bold text-dark mb-2" style={{ fontSize: '1.9rem' }}>DRIP MARKETING RULES</h3>
                    </div>
                </div>
                <div className="col-12 col-lg-6">
                    <div className="d-flex gap-3 justify-content-lg-end justify-content-start align-items-center">
                        {/* Search Input */}
                        <div className="input-group" style={{ maxWidth: '300px', width: '100%' }}>
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
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <td width={200}>
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
                                    {/* <td width='20'>Count</td> */}

                                    <td width={50}>
                                    </td>

                                </tr>
                            </thead>
                            <tbody>
                            {rules?.length > 0 && (
                                rules.map((rule, index) => (
                                    <tr className='driprule' key={rule.id || index}>
                                        <td>
                                            {rule.name}
                                        </td>                                        
                                        <td>
                                            {rule.createdBy.name}
                                        </td>
                                        <td>
                                            {/* {rule.createdAt.toString().split('T')[0]} &nbsp; {rule.createdAt.toString().split('T')[1]} */}
                                            {new Date(rule.createdAt).toLocaleDateString("en-GB")}
                                        </td>
                                        <td>
                                            {new Date(rule.startDate).toLocaleDateString("en-GB")} &nbsp; {rule.startTime}
                                        </td>
                                        <td>
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={rule.isActive}
                                                    // onChange={() => {
                                                    //     const updatedRules = [...rules];
                                                    //     updatedRules[index].active = !updatedRules[index].active;
                                                    //     setRules(updatedRules);
                                                    // }}
                                                    onChange={() => handleStatusUpdate(rule._id, !rule.isActive)}


                                                />
                                            </div>
                                        </td>
                                        {/* <td>{rule.communication?.communications?.length || 0}</td> */}

                                        <td className='ellipsis' onClick={() => handleDropdown(index)}>
                                            <i className="fas fa-ellipsis-v"></i>

                                            {showPopup && popupIndex === index && (
                                                <div className="drip_dropdowp">
                                                    <ul className="drip_droplist">
                                                        <li data-bs-toggle="modal" data-bs-target="#staticBackdropEditRuleModel" onClick={() => {
                                                            // Handle edit logic
                                                            setModalMode('edit');

                                                            // Convert 12-hour format to 24-hour format for time input
                                                            let timeForInput = rule.startTime || '';
                                                            if (timeForInput && timeForInput.includes(' ')) {
                                                                const [time, ampm] = timeForInput.split(' ');
                                                                const [hours, minutes] = time.split(':');
                                                                let hour24 = parseInt(hours);

                                                                if (ampm === 'PM' && hour24 !== 12) {
                                                                    hour24 += 12;
                                                                } else if (ampm === 'AM' && hour24 === 12) {
                                                                    hour24 = 0;
                                                                }

                                                                timeForInput = `${hour24.toString().padStart(2, '0')}:${minutes}`;
                                                            }

                                                            setRuleData({
                                                                ...rule,
                                                                startDate: rule.startDate ? new Date(rule.startDate) : '',
                                                                startTime: timeForInput
                                                            });
                                                            setShowPopup(false);
                                                            setPopupIndex(null);

                                                        }}>
                                                            Edit
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
            </div>



            <div className="btn_add_segement">
                <a href="#" data-bs-toggle="modal" data-bs-target="#staticBackdropRuleModel" onClick={() => {
                    setModalMode('add');
                    resetFormData();
                }}><i className="fa-solid fa-plus"></i></a>
            </div>

            <div className="add_rule_section">
                <div className="modal fade" id="staticBackdropRuleModel" ref={modalRef} data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5" id="staticBackdropLabel">{modalMode === 'edit' ? 'Edit Rule' : 'Add Rule'}</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-12">
                                        <p className='ruleInfo'>{modalMode === 'edit' ? 'Do you want to update the rule?' : 'A new rule can be added using this dialog, you need to select Rules and actions to be performed based on the Rules'}</p>
                                        <div className="row">
                                            <div className="col-md-6 col-12">
                                                <input
                                                    type="text"
                                                    name='ruleName'
                                                    placeholder='Name of the Rule'
                                                    value={ruleData.name}
                                                    onChange={(e) => setRuleData(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="col-md-6 col-12">
                                                <div className="row">
                                                    <div className="col-6">
                                                        <div className="datePickerSection">
                                                            <DatePicker
                                                                className={`form-control border-0 bgcolor `}
                                                                name="startDate"
                                                                format="dd/MM/yyyy"
                                                                value={ruleData.startDate}
                                                                onChange={(date) => setRuleData(prev => ({ ...prev, startDate: date }))}
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
                                                                value={ruleData.startTime}
                                                                onChange={(e) => setRuleData(prev => ({ ...prev, startTime: e.target.value }))}
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
                                                            <div className={`toggle-container ${ruleData.interBlockLogicOperator === 'or' ? 'or-active' : ''}`} id="toggleButton">
                                                                <div className="toggle-slider"></div>
                                                                <div
                                                                    className={`toggle-option ${ruleData.interBlockLogicOperator === 'and' ? 'active' : ''}`}
                                                                    data-value="and"
                                                                    onClick={() => setRuleData(prev => ({ ...prev, interBlockLogicOperator: 'and' }))}
                                                                >
                                                                    And
                                                                </div>
                                                                <div
                                                                    className={`toggle-option ${ruleData.interBlockLogicOperator === 'or' ? 'active' : ''}`}
                                                                    data-value="or"
                                                                    onClick={() => setRuleData(prev => ({ ...prev, interBlockLogicOperator: 'or' }))}
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
                                                                    {ruleData.interBlockLogicOperator}
                                                                </div>
                                                            )}

                                                            <div className="ifBlock mb-2 ">


                                                                {(subConditionSelections[index]?.length || 0) > 0 && (
                                                                    <div className={`mb-2 toggle-container ${subLogicOperator === 'or' ? 'or-active' : ''}`} id="toggleButtons">
                                                                        <div className="toggle-slider"></div>
                                                                        <div
                                                                            className={`toggle-option ${subLogicOperator === 'and' ? 'active' : ''}`}
                                                                            data-value="and"
                                                                            onClick={() => {
                                                                                setSubLogicOperator('and');
                                                                                setRuleData(prev => ({
                                                                                    ...prev,
                                                                                    conditionBlocks: prev.conditionBlocks.map((block, i) =>
                                                                                        i === index
                                                                                            ? { ...block, intraBlockLogicOperator: 'and' }
                                                                                            : block
                                                                                    ),
                                                                                }));
                                                                            }}

                                                                        >
                                                                            And
                                                                        </div>
                                                                        <div
                                                                            className={`toggle-option ${subLogicOperator === 'or' ? 'active' : ''}`}
                                                                            data-value="or"
                                                                            onClick={() => {
                                                                                setSubLogicOperator('or');

                                                                                setRuleData(prev => ({
                                                                                    ...prev,
                                                                                    conditionBlocks: prev.conditionBlocks.map((block, i) =>
                                                                                        i === index
                                                                                            ? { ...block, intraBlockLogicOperator: 'or' }
                                                                                            : block
                                                                                    ),
                                                                                }));
                                                                            }}

                                                                        >
                                                                            Or
                                                                        </div>
                                                                    </div>
                                                                )}


                                                                {/* Render all conditions for this block */}
                                                                {(conditionSelections[index] || []).map((_, conditionIdx) => (
                                                                    <div key={`condition-${index}-${conditionIdx}`} className="row mb-3 pb-3">
                                                                        <div className="col-10">
                                                                            <div className="row">
                                                                                {/* Activity Type Dropdown - Always visible */}
                                                                                <div className="col-4">
                                                                                    <select
                                                                                        className='form-select'
                                                                                        value={(conditionSelections[index] || [''])[conditionIdx] || ''}
                                                                                        onChange={(e) => handleSelectChange(index, conditionIdx, e.target.value)}
                                                                                    >
                                                                                        <option value="">Activity type</option>


                                                                                        <option value="state">State</option>
                                                                                        <option value="status">Status</option>
                                                                                        <option value="subStatus">Sub Status</option>
                                                                                        <option value="leadOwner">Lead Owner</option>
                                                                                        <option value="registeredBy">Registered By</option>

                                                                                        <option value="jobName">Job Name</option>
                                                                                        <option value="project">Project</option>
                                                                                        <option value="vertical">Vertical</option>
                                                                                        <option value="batch">Batch</option>
                                                                                        <option value="center">Center</option>
                                                                                        <option value="course">Course</option>
                                                                                    </select>
                                                                                </div>

                                                                                {/* Operator Dropdown - Only show if Activity Type is selected */}
                                                                                {(conditionSelections[index] || [''])[conditionIdx] && (
                                                                                    <div className="col-4">
                                                                                        <select
                                                                                            className='form-select'
                                                                                            value={(conditionOperators[index] || [''])[conditionIdx] || ''}
                                                                                            onChange={(e) => handleOperatorChange(index, conditionIdx, e.target.value)}
                                                                                        >
                                                                                            <option value="">Select Operator</option>
                                                                                            <option value="equals">Equals</option>
                                                                                            <option value="not_equals">Not Equals</option>
                                                                                        </select>
                                                                                    </div>
                                                                                )}

                                                                                {/* Value Dropdown - Only show if Operator is selected */}
                                                                                {(conditionOperators[index] || [''])[conditionIdx] && (conditionSelections[index] || [''])[conditionIdx] && (
                                                                                    <div className="col-4">
                                                                                        {(() => {
                                                                                            const multiValues = ['all', 'status', 'subStatus', 'vertical', 'project']
                                                                                            const activityType = (conditionSelections[index] || [''])[conditionIdx] || '';
                                                                                            const isMultiselect = multiValues.includes('all')
                                                                                                ? true
                                                                                                : multiValues.includes(activityType);
                                                                                            const valueOptions = getValueOptions(activityType);
                                                                                            const currentValue = (conditionValues[index] || [''])[conditionIdx] || '';

                                                                                            if (isMultiselect) {
                                                                                                return (
                                                                                                    <MultiselectDropdown
                                                                                                        options={valueOptions}
                                                                                                        value={Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : [])}
                                                                                                        onChange={(values) => handleValueChange(index, conditionIdx, values)}
                                                                                                        placeholder="Select values"

                                                                                                    />
                                                                                                );
                                                                                            } else {
                                                                                                return (
                                                                                                    <select
                                                                                                        className='form-select'
                                                                                                        value={Array.isArray(currentValue) ? '' : currentValue}
                                                                                                        onChange={(e) => handleValueChange(index, conditionIdx, e.target.value)}
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
                                                                                {conditionIdx === (conditionSelections[index] || []).length - 1 && (
                                                                                    <button onClick={() => handleAddSubCondition(index)}>
                                                                                        <i className="fa-solid fa-plus"></i>
                                                                                    </button>
                                                                                )}
                                                                                {(conditionSelections[index] || []).length > 1 && conditionIdx > 0 && (
                                                                                    <button onClick={() => handleRemoveSubCondition(index, conditionIdx)}>
                                                                                        <i className="fa-solid fa-xmark"></i>
                                                                                    </button>
                                                                                )}
                                                                                {conditionIdx === 0 && (
                                                                                    <button onClick={() => handleRemoveCondition(index)}>
                                                                                        <i className="fa-solid fa-xmark"></i>
                                                                                    </button>
                                                                                )}
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
                                                                            <select className='form-select' value={ruleData.activityType} onChange={(e) => {
                                                                                setRuleData(prev => ({
                                                                                    ...prev,
                                                                                    primaryAction: {
                                                                                        ...prev.primaryAction,
                                                                                        activityType: e.target.value,
                                                                                        values: []
                                                                                    }
                                                                                }));
                                                                            }}>
                                                                                <option value="">Activity Type</option>
                                                                                <option value="state">State</option>
                                                                                <option value="status">Status</option>
                                                                                <option value="subStatus">Sub Status</option>
                                                                                <option value="leadOwner">Lead Owner</option>
                                                                                <option value="registeredBy">Registered By</option>

                                                                                <option value="jobName">Job Name</option>
                                                                                <option value="project">Project</option>
                                                                                <option value="vertical">Vertical</option>
                                                                                <option value="batch">Batch</option>
                                                                                <option value="center">Center</option>
                                                                                <option value="course">Course</option>
                                                                            </select>
                                                                        </div>
                                                                        {ruleData.primaryAction.activityType !== '' && (
                                                                            <div className="col-6">
                                                                                <div className="d-flex align-items-center">
                                                                                    <label className="me-2">Should be</label>
                                                                                    <div className="flex-grow-1">
                                                                                        <MultiselectDropdown
                                                                                            options={getThenValueOptions(ruleData.primaryAction.activityType)}
                                                                                            value={Array.isArray(ruleData.primaryAction.values) ? ruleData.primaryAction.values : (ruleData.primaryAction.values ? [ruleData.primaryAction.values] : [])}
                                                                                            onChange={(values) => setRuleData(prev => ({
                                                                                                ...prev,
                                                                                                primaryAction: {
                                                                                                    ...prev.primaryAction,
                                                                                                    values: values
                                                                                                }
                                                                                            }))}
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


                                                            {ruleData.additionalActions && ruleData.additionalActions.length > 0 ? (
                                                                ruleData.additionalActions.map((action, index) => (
                                                                    <div className="row my-3 border p-3" key={`then-${index}`}>
                                                                        <div className="col-10">
                                                                            <div className="row">
                                                                                <div className="col-4">
                                                                                    <select
                                                                                        className='form-select'
                                                                                        value={action.activityType || ''}
                                                                                        onChange={(e) => {
                                                                                            handleThenConditionChange(index, 'activityType', e.target.value);
                                                                                            handleThenConditionChange(index, 'values', []); // Clear values when activity type changes
                                                                                        }}
                                                                                    >
                                                                                        <option value="">Activity Type</option>
                                                                                        <option value="state">State</option>
                                                                                        <option value="status">Status</option>
                                                                                        <option value="subStatus">Sub Status</option>
                                                                                        <option value="leadOwner">Lead Owner</option>
                                                                                        <option value="registeredBy">Registered By</option>
                                                                                        <option value="jobName">Job Name</option>
                                                                                        <option value="project">Project</option>
                                                                                        <option value="vertical">Vertical</option>
                                                                                        <option value="batch">Batch</option>
                                                                                        <option value="center">Center</option>
                                                                                        <option value="course">Course</option>
                                                                                    </select>
                                                                                </div>
                                                                                {action.activityType && (
                                                                                    <div className="col-6">
                                                                                        <div className="d-flex align-items-center">
                                                                                            <label className="me-2">Should be</label>
                                                                                            <div className="flex-grow-1">
                                                                                                <MultiselectDropdown
                                                                                                    options={getThenValueOptions(action.activityType)}
                                                                                                    value={Array.isArray(action.values) ? action.values : (action.values ? [action.values] : [])}
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
                                                                ))
                                                            ) : (
                                                                ''
                                                            )}


                                                            <div className="toggle-container-then my-3" id="toggleButtonthen">

                                                                <div className="toggle-option active" data-value="and">And</div>

                                                            </div>
                                                            <div className="row my-3 border p-3">
                                                                <div className="col-10">
                                                                    <div className="row">
                                                                        <h1 style={{ fontSize: '1rem' }}>Select Communication</h1>
                                                                        <>
                                                                            <div className="col-4">
                                                                                <select className='form-select'
                                                                                    value={ruleData.communication.executionType}
                                                                                    onChange={(e) => {
                                                                                        const v = e.target.value;
                                                                                        setRuleData(prev => ({
                                                                                            ...prev,
                                                                                            communication: {
                                                                                                ...prev.communication,
                                                                                                executionType: v,
                                                                                                mode: v === 'immediate' ? prev.communication.mode : '',
                                                                                                occurrenceCount: v === 'occurrences' ? prev.communication.occurrenceCount : ''
                                                                                            }
                                                                                        }));
                                                                                    }}
                                                                                >
                                                                                    <option value="">Select</option>
                                                                                    <option value="immediate">Immediate</option>
                                                                                    <option value="occurrences">No of Occurences</option>
                                                                                </select>
                                                                            </div>

                                                                            {(ruleData.communication.executionType === 'occurrences' || ruleData.communication.executionType === 'immediate') && (
                                                                                <div className="col-4">
                                                                                    <select className='form-select' value={ruleData.communication.mode} onChange={(e) => setRuleData(prev => ({
                                                                                        ...prev,
                                                                                        communication: {
                                                                                            ...prev.communication,
                                                                                            mode: e.target.value
                                                                                        }
                                                                                    }))}>
                                                                                        <option value="">Select Communication Mode</option>
                                                                                        {/* <option value="sms">SMS</option> */}
                                                                                        <option value="email">Email</option>
                                                                                        <option value="whatsapp">Whatapp</option>
                                                                                    </select>
                                                                                </div>
                                                                            )}
                                                                            {ruleData.communication.mode && (ruleData.communication.executionType === 'occurrences' || ruleData.communication.executionType === 'immediate') && (
                                                                                <div className="col-4">
                                                                                    <div className='d-flex'>
                                                                                        <label htmlFor="" className="noOfCom" >No. Of Communication</label>
                                                                                        <input type="number" min="1" className="noOfComInput" value={ruleData.communication.occurrenceCount} onChange={(e) => handleOccurrenceCountChange(e.target.value)} />
                                                                                    </div>
                                                                                </div>
                                                                            )}


                                                                            {(ruleData.communication.executionType === 'occurrences' || ruleData.communication.executionType === 'immediate') && ruleData.communication.occurrenceCount && ruleData.communication.occurrenceCount > 0 && ruleData.communication.mode && (
                                                                                <div className="col-12 mt-4">
                                                                                    <h3 className='studentResponse'>Select a user to receive students response</h3>

                                                                                    <div class='d-flex gap-3 mb-3'>
                                                                                        <div class="sender">
                                                                                            <input
                                                                                                type="radio"
                                                                                                name='whatapp'
                                                                                                value="sender"
                                                                                                id="sender"
                                                                                                checked={ruleData.communication.recipient === 'sender'}
                                                                                                onChange={(e) => setRuleData(prev => ({
                                                                                                    ...prev,
                                                                                                    communication: {
                                                                                                        ...prev.communication,
                                                                                                        recipient: e.target.value
                                                                                                    }
                                                                                                }))}
                                                                                            />
                                                                                            <label for="sender">Sender</label>
                                                                                        </div>
                                                                                        <div class="leadOwner">
                                                                                            <input
                                                                                                type="radio"
                                                                                                name='whatapp'
                                                                                                value="leadOwner"
                                                                                                id="leadOwner"
                                                                                                checked={ruleData.communication.recipient === 'leadOwner'}
                                                                                                onChange={(e) => setRuleData(prev => ({
                                                                                                    ...prev,
                                                                                                    communication: {
                                                                                                        ...prev.communication,
                                                                                                        recipient: e.target.value
                                                                                                    }
                                                                                                }))}
                                                                                            />
                                                                                            <label for="leadOwner">Lead Owner</label>
                                                                                        </div>
                                                                                    </div>
                                                                                    {/* <div>
                                                                                        <h3>Select WhatsApp Templates</h3>
                                                                                        <div class='d-flex gap-3'>
                                                                                        <div class="sender">
                                                                                            <input type="checkbox" name='whatapp' id=""  />
                                                                                            <label for="sender">Primary Mobile</label>
                                                                                        </div>
                                                                                        <div class="leadOwner">
                                                                                            <input type="checkbox" name='whatapp' id="" />
                                                                                            <label for="leadOwner">Lead Owner</label>
                                                                                        </div>
                                                                                        <div class="leadOwner">
                                                                                            <input type="checkbox" name='whatapp' id="" />
                                                                                            <label for="leadOwner">Lead Owner</label>
                                                                                        </div>
                                                                                        <div class="leadOwner">
                                                                                            <input type="checkbox" name='whatapp' id="" />
                                                                                            <label for="leadOwner">Lead Owner</label>
                                                                                        </div>
                                                                                    </div>
                                                                                    </div> */}


                                                                                    <div className="col-12">
                                                                                        <div className="row">
                                                                                            {ruleData.communication.communications && ruleData.communication.communications.map((comm, index) => (
                                                                                                <div key={index} className="col-6 mb-3">
                                                                                                    <h3 className="studentResponse">{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Communication</h3>

                                                                                                    {ruleData.communication.mode === 'email' ? (
                                                                                                        <div className="alert alert-info" role="alert">
                                                                                                            <div className="d-flex align-items-center">
                                                                                                                {/* <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div> */}
                                                                                                                <strong>Work in Progress</strong>
                                                                                                            </div>
                                                                                                            <div className="mt-2">
                                                                                                                Email communication templates are being developed. This feature will be available soon.
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className="row">
                                                                                                            <div className="col-4">
                                                                                                                <select
                                                                                                                    className='form-select'
                                                                                                                    // value={comm.templateId}
                                                                                                                    value={ruleData.communication.communications[index].templateId}
                                                                                                                    onChange={(e) => updateCommunication(index, 'templateId', e.target.value)}
                                                                                                                >
                                                                                                                    <option value="">Select Template</option>
                                                                                                                    {whatsappTemplates.length > 0 && whatsappTemplates?.map((template) => (
                                                                                                                        <option key={template?._id} value={template?._id}>
                                                                                                                            {template?.template?.name || ''}
                                                                                                                        </option>
                                                                                                                    ))}
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="col-4">
                                                                                                                <select
                                                                                                                    className='form-select'
                                                                                                                    // value={comm.timing}
                                                                                                                    value={ruleData.communication.communications[index].timing}
                                                                                                                    onChange={(e) => updateCommunication(index, 'timing', e.target.value)}
                                                                                                                >
                                                                                                                    <option value="">Select Timing</option>
                                                                                                                    <option value="1hrs">1hrs</option>
                                                                                                                    <option value="2hrs">2hrs</option>
                                                                                                                    <option value="3hrs">3hrs</option>
                                                                                                                    <option value="4hrs">4hrs</option>
                                                                                                                    <option value="5hrs">5hrs</option>
                                                                                                                    <option value="8hrs">8hrs</option>
                                                                                                                    <option value="1day">1day</option>
                                                                                                                    <option value="2days">2days</option>
                                                                                                                    <option value="3days">3days</option>
                                                                                                                    <option value="4days">4days</option>
                                                                                                                    <option value="5days">5days</option>
                                                                                                                    <option value="8days">8days</option>
                                                                                                                </select>
                                                                                                            </div>
                                                                                                            <div className="col-4"></div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>


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
                                <button ref={closeModalRef} type="button" className="btn btn-secondary" data-bs-dismiss="modal" >Close</button>
                                {/* <button type="button" className="btn btn-primary" onClick={handleAddRule}>Understood</button> */}
                                <button type="submit" className="btn btn-primary" onClick={modalMode === 'add' ? handleAddRule : handleUpdateRule}>{modalMode === 'add' ? 'Add Rule' : 'Update Rule'}</button>
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
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={() => {
                                setEditRule({});
                                setIsEditing(false);
                                setModalMode('');
                            }}>No</button>
                            <button type="button" className="btn btn-primary" data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#staticBackdropRuleModel" onClick={() => {
                                setModalMode('edit');


                                loadRuleForEdit(ruleData._id);


                            }}>Yes</button>
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
    font-size:0.9rem
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

.sender, .leadOwner {
 display: flex;
 align-items: center;
 cursor: pointer;
 font-size: 14px;
 color: #333;
}

.sender input[type="radio"],
.leadOwner input[type="radio"] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #ccc;
  border-radius: 50%;
  margin-right: 8px;
  position: relative;
  cursor: pointer;
 transition: all 0.2s ease;
}
.sender input[type="radio"]:hover,
leadOwner input[type="radio"]:hover {
   border-color: #ff6b35;
}

/* Checked state */
.sender input[type="radio"]:checked,
.leadOwner input[type="radio"]:checked {
    border-color: #ff6b35;
    background-color: #ff6b35;
}

 /* Inner dot for checked state */
.sender input[type="radio"]:checked::after,
.leadOwner input[type="radio"]:checked::after {
  content: '';
   width: 6px;
   height: 6px;
   border-radius: 50%;
   background-color: white;
   position: absolute;
   top: 50%;
   left: 50%;
   transform: translate(-50%, -50%);
}

/* Focus state for accessibility */
.sender input[type="radio"]:focus,
.leadOwner input[type="radio"]:focus {
    outline: 2px solid #ff6b35;
    outline-offset: 2px;
}
.whatappTemplate{
margin-top:20px;

}
.studentResponse{
font-size:0.9rem;
}
.noOfCom{
font-size:0.9rem!important;
margin-right:10px;
}
.noOfComInput{
width:25%;
padding-left:5px;
}
/* Mobile Responsive Styles */
@media (max-width: 768px) {
    html body .content .content-wrapper {
    padding: 1.8rem 0.8rem 0!important;
}
    .input-group {
        max-width: 100% !important;
        float: none !important;
    }
    
    /* Table responsive with horizontal scroll */
    .table-responsive {
        border: none;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    table {
        font-size: 12px;
        min-width: 600px;
        width: 100%;
        margin-bottom: 0;
    }
    
    table td {
        padding: 8px 6px !important;
        font-size: 11px;
        white-space: nowrap;
        vertical-align: middle;
    }
    
    table thead td {
        padding: 12px 6px !important;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
    }
    
    /* Ensure minimum widths for better mobile experience */
    table td:first-child {
        min-width: 150px;
    }
    
    table td:nth-child(2) {
        min-width: 100px;
    }
    
    table td:nth-child(3),
    table td:nth-child(4) {
        min-width: 120px;
    }
    
    table td:nth-child(5) {
        min-width: 80px;
    }
    
    table td:nth-child(6) {
        min-width: 50px;
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
        margin-left:40px;
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
    
    /* Table scroll indicator */
    .table-responsive::after {
        content: "← Scroll horizontally to see more →";
        display: block;
        text-align: center;
        font-size: 10px;
        color: #6c757d;
        padding: 5px;
        background: #f8f9fa;
        border-top: 1px solid #dee2e6;
    }
    
    /* Dropdown positioning for mobile */
    .drip_dropdowp {
        right: 10px !important;
        min-width: 100px;
        z-index: 1050;
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