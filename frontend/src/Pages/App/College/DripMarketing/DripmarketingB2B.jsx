import React, { useState, useEffect, useRef, useMemo } from 'react'
import DatePicker from 'react-date-picker';
import axios from 'axios';
// import * as bootstrap from 'bootstrap';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';

// Add CSS styles for multiselect
const multiselectStyles = `
    .multiselect-dropdown {
        position: relative;
        z-index: 1;
    }
    .multiselect-dropdown.is-open {
        z-index: 1055;
    }
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
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        z-index: 1056 !important;
        left: 0;
        right: 0;
    }
    .multiselect-options.open-down {
        top: calc(100% + 2px);
        bottom: auto;
    }
    .multiselect-options.open-up {
        bottom: calc(100% + 2px);
        top: auto;
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
    const [openUp, setOpenUp] = useState(false);
    const [selectedValues, setSelectedValues] = useState(value || []);
    const dropdownRef = useRef(null);
    const optionsRef = useRef(null);

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

    // Keep option list scroll inside the panel (don't trap modal scroll)
    useEffect(() => {
        if (!isOpen || !dropdownRef.current) return;
        const trigger = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - trigger.bottom;
        const spaceAbove = trigger.top;
        setOpenUp(spaceBelow < 220 && spaceAbove > spaceBelow);

        const el = optionsRef.current;
        if (!el) return;
        const onWheel = (e) => {
            const atTop = el.scrollTop <= 0;
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
            if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) {
                e.preventDefault();
            }
            e.stopPropagation();
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
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
            const option = options.find(opt => String(opt.value) === String(val));
            return option ? option.label : val;
        });
    };

    return (
        <div className={`multiselect-dropdown position-relative${isOpen ? ' is-open' : ''}`} ref={dropdownRef}>
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
                <div
                    ref={optionsRef}
                    className={`multiselect-options position-absolute w-100 bg-white border rounded shadow ${openUp ? 'open-up' : 'open-down'}`}
                >
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
                                    checked={selectedValues.some((v) => String(v) === String(option.value))}
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


const DripMarketingB2B = () => {
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
    const [pendingActivateRuleId, setPendingActivateRuleId] = useState(null);
    const [matchCount, setMatchCount] = useState(0);
    const [matchCountLoading, setMatchCountLoading] = useState(false);
    const [matchCountCapped, setMatchCountCapped] = useState(false);

    const to24HourTime = (timeStr) => {
        let timeForInput = timeStr || '';
        if (timeForInput && timeForInput.includes(' ')) {
            const [time, ampm] = timeForInput.split(' ');
            const [hours, minutes] = time.split(':');
            let hour24 = parseInt(hours, 10);
            if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
            else if (ampm === 'AM' && hour24 === 12) hour24 = 0;
            timeForInput = `${hour24.toString().padStart(2, '0')}:${minutes}`;
        }
        return timeForInput;
    };

    const getDatePartIST = (dateVal) => {
        if (!dateVal) return '';
        // Only treat plain YYYY-MM-DD as calendar date; ISO timestamps must use IST zone
        if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
            return dateVal.trim();
        }
        return new Date(dateVal).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    };

    const buildISTDateTime = (dateVal, timeStr) => {
        const datePart = getDatePartIST(dateVal);
        const time24 = to24HourTime(timeStr);
        if (!datePart || !time24) return null;
        const [y, m, d] = datePart.split('-').map(Number);
        const [hh, mm] = time24.split(':').map(Number);
        return new Date(Date.UTC(y, m - 1, d, hh - 5, mm - 30, 0, 0));
    };

    const isEndDateTimeAfterNowIST = (dateVal, timeStr) => {
        const end = buildISTDateTime(dateVal, timeStr);
        return !!(end && end.getTime() > Date.now());
    };

    const openRuleEditScreen = (ruleId) => {
        setModalMode('edit');
        loadRuleForEdit(ruleId);
        setTimeout(() => {
            const el = document.getElementById('staticBackdropRuleModel');
            if (el && window.bootstrap?.Modal) {
                window.bootstrap.Modal.getOrCreateInstance(el).show();
            }
        }, 50);
    };


    const [statuses, setStatuses] = useState([]);
    const [subStatuses, setSubStatuses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedSubStatus, setSelectedSubStatus] = useState('');
    const [departments, setDepartments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [typeOfB2BList, setTypeOfB2BList] = useState([]);
    const [leadCategories, setLeadCategories] = useState([]);
    const [leadRankings, setLeadRankings] = useState([]);
    const [leadOwner, setLeadOwner] = useState([]);
    const [registeredBy, setRegisteredBy] = useState([]);
    const [permissions, setPermissions] = useState(null);
    const [departmentsAccess, setDepartmentsAccess] = useState([]);
    const [projectsAccess, setProjectsAccess] = useState([]);

    const [whatappTemplateField, setWhatappTemplateField] = useState(false);
    const [whatsappTemplates, setWhatsappTemplates] = useState([]);

    // Admin + empty departments_access → all; otherwise only assigned departments
    const hasRestrictedDepartmentAccess = useMemo(() => {
        const accessIds = (departmentsAccess || []).map((id) => String(id?._id || id)).filter(Boolean);
        const permissionType = permissions?.permission_type || userData?.permissions?.permission_type;
        if (permissionType === 'Admin' && accessIds.length === 0) return false;
        return accessIds.length > 0;
    }, [departmentsAccess, permissions, userData]);

    const accessibleDepartments = useMemo(() => {
        const permissionType = permissions?.permission_type || userData?.permissions?.permission_type;
        const accessIds = (departmentsAccess || []).map((id) => String(id?._id || id)).filter(Boolean);

        if (permissionType === 'Admin' && accessIds.length === 0) {
            return departments;
        }
        if (accessIds.length === 0) {
            return [];
        }
        return departments.filter((dept) => accessIds.includes(String(dept._id)));
    }, [departments, departmentsAccess, permissions, userData]);

    const accessibleDepartmentIds = useMemo(
        () => accessibleDepartments.map((d) => String(d._id)),
        [accessibleDepartments]
    );

    const projectBelongsToAccessibleDept = (project) => {
        if (!hasRestrictedDepartmentAccess) return true;
        const ids = [];
        if (Array.isArray(project?.departments)) {
            project.departments.forEach((d) => ids.push(String(d?._id || d)));
        }
        if (project?.department) {
            ids.push(String(project.department?._id || project.department));
        }
        return ids.some((id) => accessibleDepartmentIds.includes(id));
    };

    const accessibleProjectIds = useMemo(() => {
        const accessIds = (projectsAccess || []).map((id) => String(id?._id || id)).filter(Boolean);
        const permissionType = permissions?.permission_type || userData?.permissions?.permission_type;
        if (permissionType === 'Admin' && accessIds.length === 0) return [];
        return accessIds;
    }, [projectsAccess, permissions, userData]);

    const hasRestrictedProjectAccess = useMemo(
        () => accessibleProjectIds.length > 0,
        [accessibleProjectIds]
    );

    const accessibleProjects = useMemo(
        () => {
            let list = (projects || []).filter(projectBelongsToAccessibleDept);
            if (hasRestrictedProjectAccess) {
                list = list.filter((p) => accessibleProjectIds.includes(String(p._id)));
            }
            return list;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [projects, hasRestrictedDepartmentAccess, accessibleDepartmentIds, hasRestrictedProjectAccess, accessibleProjectIds]
    );

    const accessibleTypeOfB2B = useMemo(() => {
        if (!hasRestrictedDepartmentAccess) return typeOfB2BList;
        return (typeOfB2BList || []).filter((t) => {
            const deptId = String(t?.department?._id || t?.department || '');
            return accessibleDepartmentIds.includes(deptId);
        });
    }, [typeOfB2BList, hasRestrictedDepartmentAccess, accessibleDepartmentIds]);

    const accessibleLeadUsers = useMemo(() => {
        const list = leadOwner || [];
        if (!hasRestrictedDepartmentAccess) return list;
        return list.filter((u) => {
            if (u.permission_type === 'Admin') return true;
            const userDepts = (u.departments_access || []).map((id) => String(id?._id || id));
            return userDepts.some((d) => accessibleDepartmentIds.includes(d));
        });
    }, [leadOwner, hasRestrictedDepartmentAccess, accessibleDepartmentIds]);

    const isAdminUser = useMemo(() => {
        const permissionType = permissions?.permission_type || userData?.permissions?.permission_type;
        return permissionType === 'Admin';
    }, [permissions, userData]);

    // Custom users with department/project access: pre-fill IF conditions. Admin keeps an empty form.
    const getAccessScopedConditionState = () => {
        if (isAdminUser) return null;

        const conditions = [];
        if (hasRestrictedDepartmentAccess && accessibleDepartmentIds.length > 0) {
            conditions.push({
                activityType: 'b2bDepartment',
                operator: 'equals',
                values: [...accessibleDepartmentIds],
            });
        }
        if (hasRestrictedProjectAccess && accessibleProjectIds.length > 0) {
            conditions.push({
                activityType: 'b2bProject',
                operator: 'equals',
                values: [...accessibleProjectIds],
            });
        }
        if (conditions.length === 0) return null;

        return {
            condition: [{}],
            conditions: [conditions.map(() => ({}))],
            conditionSelections: [conditions.map((c) => c.activityType)],
            conditionOperators: [conditions.map((c) => c.operator)],
            conditionValues: [conditions.map((c) => c.values)],
            subConditionSelections: [conditions.length > 1 ? conditions.map(() => []) : []],
            conditionBlocks: [{
                conditions,
                intraBlockLogicOperator: 'and',
            }],
        };
    };

    const isAccessLockedActivity = (activityType) => {
        if (isAdminUser) return false;
        if (activityType === 'b2bDepartment' && hasRestrictedDepartmentAccess) return true;
        if ((activityType === 'b2bProject' || activityType === 'project') && hasRestrictedProjectAccess) return true;
        return false;
    };

    const clampAccessValues = (activityType, values) => {
        const raw = Array.isArray(values) ? values : (values ? [values] : []);
        const ids = raw.map((v) => String(v?._id || v)).filter(Boolean);
        if (activityType === 'b2bDepartment' && hasRestrictedDepartmentAccess) {
            const allowed = ids.filter((id) => accessibleDepartmentIds.includes(id));
            return allowed.length > 0 ? allowed : [...accessibleDepartmentIds];
        }
        if ((activityType === 'b2bProject' || activityType === 'project') && hasRestrictedProjectAccess) {
            const allowed = ids.filter((id) => accessibleProjectIds.includes(id));
            return allowed.length > 0 ? allowed : [...accessibleProjectIds];
        }
        return ids;
    };

    const applyAccessScopeToBlocks = (blocks = []) => {
        if (isAdminUser) return Array.isArray(blocks) ? blocks : [];

        const next = (Array.isArray(blocks) ? blocks : []).map((block) => ({
            ...block,
            conditions: (block.conditions || []).map((c) => {
                if (!isAccessLockedActivity(c.activityType)) return { ...c };
                return {
                    ...c,
                    operator: 'equals',
                    values: clampAccessValues(c.activityType, c.values),
                };
            }),
        }));

        const hasDeptEquals = next.some((b) =>
            (b.conditions || []).some((c) =>
                c.activityType === 'b2bDepartment' && c.operator === 'equals' && (c.values || []).length > 0
            )
        );
        const hasProjectEquals = next.some((b) =>
            (b.conditions || []).some((c) =>
                (c.activityType === 'b2bProject' || c.activityType === 'project') &&
                c.operator === 'equals' &&
                (c.values || []).length > 0
            )
        );

        const toInject = [];
        if (hasRestrictedDepartmentAccess && accessibleDepartmentIds.length > 0 && !hasDeptEquals) {
            toInject.push({
                activityType: 'b2bDepartment',
                operator: 'equals',
                values: [...accessibleDepartmentIds],
            });
        }
        if (hasRestrictedProjectAccess && accessibleProjectIds.length > 0 && !hasProjectEquals) {
            toInject.push({
                activityType: 'b2bProject',
                operator: 'equals',
                values: [...accessibleProjectIds],
            });
        }
        if (toInject.length > 0) {
            if (next.length === 0) {
                next.push({ conditions: toInject, intraBlockLogicOperator: 'and' });
            } else {
                next[0] = {
                    ...next[0],
                    conditions: [...toInject, ...(next[0].conditions || [])],
                };
            }
        }
        return next;
    };

    useEffect(() => {
        fetchPermissions();
        fetchRules();
        fetchStatuses();
        fetchDepartments();
        fetchProjects();
        fetchTypeOfB2B();
        fetchLeadCategories();
        fetchLeadRankings();
        fetchleadOwnwer();
        fetchWhatsappTemplates();
    }, []);

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
            endDate: '',
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

    // Serialize so nested condition edits (activity/operator/values) retrigger count
    const matchCountKey = JSON.stringify({
        blocks: ruleData.conditionBlocks,
        inter: ruleData.interBlockLogicOperator || 'and',
    });

    useEffect(() => {
        const conditionBlocks = applyAccessScopeToBlocks(ruleData.conditionBlocks || []).map((block) => ({
            conditions: (block.conditions || [])
                .filter((c) => c.activityType && c.operator && Array.isArray(c.values) && c.values.length > 0)
                .map((c) => ({
                    activityType: c.activityType,
                    operator: c.operator,
                    values: c.values,
                })),
            intraBlockLogicOperator: block.intraBlockLogicOperator || 'and',
        })).filter((block) => block.conditions.length > 0);

        if (!conditionBlocks.length) {
            setMatchCount(0);
            setMatchCountCapped(false);
            setMatchCountLoading(false);
            return;
        }

        let cancelled = false;
        setMatchCountLoading(true);
        const timer = setTimeout(async () => {
            try {
                const response = await axios.post(
                    `${backendUrl}/college/dripmarketing/preview-match-count`,
                    {
                        leadType: 'b2b',
                        conditionBlocks,
                        interBlockLogicOperator: ruleData.interBlockLogicOperator || 'and',
                    },
                    { headers: { 'x-auth': token } }
                );
                if (cancelled) return;
                if (response.data?.success) {
                    setMatchCount(response.data.count || 0);
                    setMatchCountCapped(!!response.data.capped);
                } else {
                    setMatchCount(0);
                    setMatchCountCapped(false);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Error fetching match count:', err);
                    setMatchCount(0);
                    setMatchCountCapped(false);
                }
            } finally {
                if (!cancelled) setMatchCountLoading(false);
            }
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchCountKey, backendUrl, token]);

    const clearRuleData = () => {
        setRuleData(
            {
                _id: null,
                startDate: '',
                endDate: '',
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


    const handleDepartmentChange = (departmentId) => {
        if (
            hasRestrictedDepartmentAccess &&
            departmentId &&
            !accessibleDepartmentIds.includes(String(departmentId))
        ) {
            return;
        }
        const selected = accessibleDepartments.find(d => d._id === departmentId || d.id === departmentId)
            || departments.find(d => d._id === departmentId || d.id === departmentId);
        setSelectedDepartment(selected || null);
        fetchProjects(departmentId);
        fetchTypeOfB2B(departmentId);
    };

    const clearDepartmentSelection = () => {
        setSelectedDepartment(null);
        // Restricted users: reload options without a single dept; client still filters to assigned depts
        fetchProjects();
        fetchTypeOfB2B();
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


    const fetchPermissions = async () => {
        try {
            if (!token) return;
            const response = await axios.get(`${backendUrl}/college/permission`, {
                headers: { 'x-auth': token }
            });
            if (response.data?.status) {
                setPermissions(response.data.permissions || null);
                setDepartmentsAccess(response.data.departments_access || []);
                setProjectsAccess(response.data.projects_access || []);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            if (!token) return;
            const response = await axios.get(`${backendUrl}/college/b2b/b2b-departments?status=true`, {
                headers: { 'x-auth': token }
            });
            if (response.data?.status && Array.isArray(response.data.data)) {
                setDepartments(response.data.data);
            } else {
                setDepartments([]);
            }
        } catch (error) {
            console.error('Error fetching B2B departments:', error);
            setDepartments([]);
        }
    };

    const fetchProjects = async (departmentId = null) => {
        if (!token) {
            setError('Authentication required');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            let url = `${backendUrl}/college/b2b/b2b-projects?status=true`;
            const deptId = departmentId || selectedDepartment?._id || selectedDepartment?.id;
            if (deptId) url += `&department=${deptId}`;

            const response = await axios.get(url, {
                headers: { 'x-auth': token, 'Content-Type': 'application/json' }
            });

            if (response.data?.status && Array.isArray(response.data.data)) {
                setProjects(response.data.data);
            } else {
                setProjects([]);
            }
        } catch (err) {
            console.error('Fetch B2B projects error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load projects');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTypeOfB2B = async (departmentId = null) => {
        try {
            if (!token) return;
            let url = `${backendUrl}/college/b2b/type-of-b2b?status=true`;
            const deptId = departmentId || selectedDepartment?._id || selectedDepartment?.id;
            if (deptId) url += `&department=${deptId}`;
            const response = await axios.get(url, { headers: { 'x-auth': token } });
            if (response.data?.status && Array.isArray(response.data.data)) {
                setTypeOfB2BList(response.data.data);
            } else {
                setTypeOfB2BList([]);
            }
        } catch (error) {
            console.error('Error fetching type of B2B:', error);
            setTypeOfB2BList([]);
        }
    };

    const fetchLeadCategories = async () => {
        try {
            if (!token) return;
            const response = await axios.get(`${backendUrl}/college/b2b/lead-categories?status=true`, {
                headers: { 'x-auth': token }
            });
            if (response.data?.status && Array.isArray(response.data.data)) {
                setLeadCategories(response.data.data);
            } else {
                setLeadCategories([]);
            }
        } catch (error) {
            console.error('Error fetching lead categories:', error);
            setLeadCategories([]);
        }
    };

    const fetchLeadRankings = async () => {
        try {
            if (!token) return;
            const response = await axios.get(`${backendUrl}/college/b2b/lead-rankings?status=true`, {
                headers: { 'x-auth': token }
            });
            if (response.data?.status && Array.isArray(response.data.data)) {
                setLeadRankings(response.data.data);
            } else {
                setLeadRankings([]);
            }
        } catch (error) {
            console.error('Error fetching lead rankings:', error);
            setLeadRankings([]);
        }
    };

    const fetchleadOwnwer = async () => {
        try {
            if (!token) {
                console.warn('No token found in session storage.');
                return;
            }

            const response = await axios.get(`${backendUrl}/college/users/b2b-users`, {
                headers: { 'x-auth': token }
            });

            if (response.data.success) {
                const users = response.data.data || [];
                setLeadOwner(users);
                setRegisteredBy(users);
            } else {
                console.error('Failed to fetch B2B users:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching B2B users:', error);
        }
    };

    const fetchWhatsappTemplates = async () => {
        try {
            if (!token) {
                console.warn('No token found in session storage.');
                return;
            }

            const response = await axios.get(`${backendUrl}/college/whatsapp/templates`, {
                headers: { 'x-auth': token },
                params: { leadType: 'b2b' }
            });

            if (response.data.success) {
                const list = Array.isArray(response.data.data) ? response.data.data : [];
                const b2bTemplates = list.filter((t) => t.b2bDepartment && !t.vertical);
                const approved = b2bTemplates.filter((t) => String(t?.status || '').toUpperCase() === 'APPROVED');
                setWhatsappTemplates(approved.length > 0 ? approved : b2bTemplates);
            } else {
                console.error('Failed to fetch WhatsApp templates:', response.data.message);
                setWhatsappTemplates([]);
            }
        } catch (error) {
            console.error('Error fetching WhatsApp templates:', error);
            setWhatsappTemplates([]);
        }
    };

    const fetchStatuses = async () => {
        try {
            if (!token) {
                console.warn('No token found in session storage.');
                return;
            }

            const response = await axios.get(`${backendUrl}/college/statusB2b`, {
                headers: { 'x-auth': token }
            });

            if (response.data.success) {
                setStatuses(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching B2B statuses:', error);
        }
    };

    useEffect(() => {
        fetchSubStatuses();
    }, [statuses]);

    const fetchSubStatuses = async (statusId = null) => {
        try {
            if (statusId) {
                const response = await axios.get(`${backendUrl}/college/statusB2b/${statusId}/substatus`, {
                    headers: { 'x-auth': token }
                });
                if (response.data.success) {
                    setSubStatuses(response.data.data || []);
                }
                return;
            }

            // Flatten all substatuses from loaded statuses
            const all = [];
            (statuses || []).forEach((st) => {
                (st.substatuses || []).forEach((sub) => {
                    all.push({ ...sub, parentStatusId: st._id });
                });
            });
            if (all.length) {
                setSubStatuses(all);
            } else if (statuses?.length) {
                setSubStatuses([]);
            }
        } catch (error) {
            console.error('Error fetching B2B sub-statuses:', error);
        }
    };

    // Handle status change
    const handleStatusChange = (statusId) => {
        setSelectedStatus(statusId);

    };


    const handleAddRule = async () => {
        try {
            if (!ruleData.endDate || !ruleData.endTime) {
                alert('Please set end date and end time');
                return;
            }
            if (!isEndDateTimeAfterNowIST(ruleData.endDate, ruleData.endTime)) {
                alert('End date/time must be greater than current Indian Standard Time');
                return;
            }

            const requestData = {
                name: ruleData.name,
                startDate: getDatePartIST(ruleData.startDate),
                endDate: getDatePartIST(ruleData.endDate),
                startTime: ruleData.startTime,
                endTime: ruleData.endTime,
                conditionBlocks: applyAccessScopeToBlocks(ruleData.conditionBlocks).map(block => ({
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
                // B2B drip: THEN is communication-only (no lead field updates)
                primaryAction: null,
                additionalActions: [],
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
                leadType: 'b2b',


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
                    endDate: '',
                    startTime: '',
                    endTime: '',
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
                closeModal();
            }

            // console.log('responseData', responseData)

        }
        catch (error) {
            console.error('Error adding rule:', error);
            const message = error.response?.data?.message || 'Error creating rule. Please try again.';
            alert(message);
            setError(message);
        }
        finally {
            fetchRules();
        }


    }

    const fetchRules = async () => {

        try {
            const response = await axios.get(`${backendUrl}/college/dripmarketing/get-dripmarketing-rule?leadType=b2b`, {
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
            if (!ruleData.endDate || !ruleData.endTime) {
                alert('Please set end date and end time');
                return;
            }
            if (!isEndDateTimeAfterNowIST(ruleData.endDate, ruleData.endTime)) {
                alert('End date/time must be greater than current Indian Standard Time');
                return;
            }

            const updateData = {
                name: ruleData.name,
                startDate: getDatePartIST(ruleData.startDate),
                endDate: getDatePartIST(ruleData.endDate),
                startTime: ruleData.startTime,
                endTime: ruleData.endTime,
                conditionBlocks: applyAccessScopeToBlocks(ruleData.conditionBlocks).map(block => ({
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
                // B2B drip: THEN is communication-only (no lead field updates)
                primaryAction: null,
                additionalActions: [],
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
                leadType: 'b2b',


            };

            const response = await axios.put(`${backendUrl}/college/dripmarketing/update-dripmarketing-rule/${ruleData._id}`, updateData, {
                headers: { 'x-auth': token }

            });

            if (response.data.success) {
                clearRuleData();

                const UpdatedRuleData = response.data.data;
                const shouldActivate = pendingActivateRuleId && pendingActivateRuleId === ruleData._id;

                setIsEditing(false);
                setModalMode('');
                setEditRule({});
                closeModal();

                if (shouldActivate) {
                    setPendingActivateRuleId(null);
                    try {
                        const activateRes = await axios.put(
                            `${backendUrl}/college/dripmarketing/status-update/${ruleData._id}`,
                            { status: true },
                            { headers: { 'x-auth': token } }
                        );
                        if (activateRes.data.success) {
                            alert('Rule updated and activated successfully');
                        } else {
                            alert('Rule updated, but activation failed. Please try the toggle again.');
                        }
                    } catch (activateErr) {
                        console.error('Error activating rule after update:', activateErr);
                        alert(activateErr.response?.data?.message || 'Rule updated, but activation failed. Please try the toggle again.');
                    }
                } else {
                    alert('Rule updated successfully');
                }

            }
            // console.log('response', response)
        } catch (err) {
            console.error('Error updating rule:', err);
            alert(err.response?.data?.message || 'Error updating rule. Please try again.');
            setError('Error updating rule. Please try again.');
        }
        finally{
            fetchRules();

        }
    }

    const handleStatusUpdate = async (ruleId, status) => {
        try {
            if (status === true) {
                const rule = rules.find((r) => r._id === ruleId);
                if (!rule || !isEndDateTimeAfterNowIST(rule.endDate, rule.endTime)) {
                    alert('End date/time has passed or is missing. Please update end date and end time (must be greater than current IST) to activate this rule.');
                    setPendingActivateRuleId(ruleId);
                    openRuleEditScreen(ruleId);
                    return;
                }
            }

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
                alert(response.data.message || 'Error updating rule status. Please try again.');
            }
        } catch (err) {
            console.error('Error updating rule status:', err);
            if (status === true && (err.response?.data?.code === 'END_DATE_PASSED' || err.response?.status === 400)) {
                alert(err.response?.data?.message || 'Please update end date and end time before activating.');
                setPendingActivateRuleId(ruleId);
                openRuleEditScreen(ruleId);
                return;
            }
            setError('Error updating rule status. Please try again.');
        }
    }

    const loadRuleForEdit = (ruleId) => {

        const ruleToEdit = rules.find(rule => rule._id === ruleId);

        if (ruleToEdit) {
            // Convert 12-hour format to 24-hour format for time input
            const to24Hour = (timeStr) => {
                let timeForInput = timeStr || '';
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
                return timeForInput;
            };

            const scopedBlocks = applyAccessScopeToBlocks((ruleToEdit.conditionBlocks || []).map(block => ({
                ...block,
                conditions: (block.conditions || []).map(condition => ({
                    activityType: condition.activityType || '',
                    operator: condition.operator || '',
                    values: condition.values || [],
                })),
                intraBlockLogicOperator: block.intraBlockLogicOperator || 'and',
            })));

            setRuleData({
                _id: ruleToEdit._id || null,
                name: ruleToEdit.name || '',
                description: ruleToEdit.description || '',
                startDate: ruleToEdit.startDate ? new Date(ruleToEdit.startDate) : '',
                endDate: ruleToEdit.endDate ? new Date(ruleToEdit.endDate) : '',
                startTime: to24Hour(ruleToEdit.startTime),
                endTime: to24Hour(ruleToEdit.endTime),
                conditionBlocks: scopedBlocks,
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


            if (scopedBlocks && scopedBlocks.length > 0) {

                const conditionArray = [];
                const conditionsArray = [];
                const conditionSelectionsArray = [];
                const conditionOperatorsArray = [];
                const conditionValuesArray = [];
                const subConditionSelectionsArray = [];


                scopedBlocks.forEach((block, blockIndex) => {

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
        leadCoOwner: [],
        leadAddedBy: [],
        registeredBy: [],
        b2bProject: [],
        b2bDepartment: [],
        typeOfB2B: [],
        leadCategory: [],
        leadRanking: [],
        project: []
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
        } else if (activityType === 'b2bDepartment') {
            return accessibleDepartments.map(d => ({
                value: d._id,
                label: d.name
            }));
        } else if (activityType === 'b2bProject' || activityType === 'project') {
            return accessibleProjects.map(project => ({
                value: project._id,
                label: project.name
            }));
        } else if (activityType === 'typeOfB2B') {
            return accessibleTypeOfB2B.map(t => ({
                value: t._id,
                label: t.name
            }));
        } else if (activityType === 'leadCategory') {
            return leadCategories.map(c => ({
                value: c._id,
                label: c.name
            }));
        } else if (activityType === 'leadRanking') {
            return leadRankings.map(r => ({
                value: r._id,
                label: r.name
            }));
        } else if (activityType === 'leadOwner' || activityType === 'leadCoOwner') {
            return accessibleLeadUsers.map(owner => ({
                value: owner._id,
                label: owner.name
            }));
        } else if (activityType === 'leadAddedBy' || activityType === 'registeredBy') {
            return accessibleLeadUsers.map(user => ({
                value: user._id,
                label: user.name
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
        leadCoOwner: [],
        leadAddedBy: [],
        registeredBy: [],
        b2bProject: [],
        b2bDepartment: [],
        typeOfB2B: [],
        leadCategory: [],
        leadRanking: [],
        project: []
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
        } else if (activityType === 'b2bDepartment') {
            return accessibleDepartments.map(d => ({
                value: d._id,
                label: d.name
            }));
        } else if (activityType === 'b2bProject' || activityType === 'project') {
            return accessibleProjects.map(project => ({
                value: project._id,
                label: project.name
            }));
        } else if (activityType === 'typeOfB2B') {
            return accessibleTypeOfB2B.map(t => ({
                value: t._id,
                label: t.name
            }));
        } else if (activityType === 'leadCategory') {
            return leadCategories.map(c => ({
                value: c._id,
                label: c.name
            }));
        } else if (activityType === 'leadRanking') {
            return leadRankings.map(r => ({
                value: r._id,
                label: r.name
            }));
        } else if (activityType === 'leadOwner' || activityType === 'leadCoOwner') {
            return accessibleLeadUsers.map(owner => ({
                value: owner._id,
                label: owner.name
            }));
        } else if (activityType === 'leadAddedBy' || activityType === 'registeredBy') {
            return accessibleLeadUsers.map(user => ({
                value: user._id,
                label: user.name
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
        leadCoOwner: [],
        leadAddedBy: [],
        registeredBy: [],
        b2bProject: [],
        b2bDepartment: [],
        typeOfB2B: [],
        leadCategory: [],
        leadRanking: [],
        project: []
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
        } else if (activityType === 'b2bDepartment') {
            return accessibleDepartments.map(d => ({
                value: d._id,
                label: d.name
            }));
        } else if (activityType === 'b2bProject' || activityType === 'project') {
            return accessibleProjects.map(project => ({
                value: project._id,
                label: project.name
            }));
        } else if (activityType === 'typeOfB2B') {
            return accessibleTypeOfB2B.map(t => ({
                value: t._id,
                label: t.name
            }));
        } else if (activityType === 'leadCategory') {
            return leadCategories.map(c => ({
                value: c._id,
                label: c.name
            }));
        } else if (activityType === 'leadRanking') {
            return leadRankings.map(r => ({
                value: r._id,
                label: r.name
            }));
        } else if (activityType === 'leadOwner' || activityType === 'leadCoOwner') {
            return accessibleLeadUsers.map(owner => ({
                value: owner._id,
                label: owner.name
            }));
        } else if (activityType === 'leadAddedBy' || activityType === 'registeredBy') {
            return accessibleLeadUsers.map(user => ({
                value: user._id,
                label: user.name
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
        const accessState = getAccessScopedConditionState();

        // Reset ruleData to initial state (pre-select assigned departments/projects for custom users)
        setRuleData({
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
            description: '',
            name: '',
            conditionBlocks: accessState?.conditionBlocks || [],
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
        if (accessState) {
            setCondition(accessState.condition);
            setConditions(accessState.conditions);
            setConditionSelections(accessState.conditionSelections);
            setConditionOperators(accessState.conditionOperators);
            setConditionValues(accessState.conditionValues);
            setSubConditionSelections(accessState.subConditionSelections);
        } else {
            setCondition([]);
            setConditions([]);
            setConditionSelections([]);
            setConditionOperators([]);
            setConditionValues([]);
            setSubConditionSelections([]);
        }
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
        const blockTypes = conditionSelections[indexToRemove] || [];
        if (blockTypes.some((type) => isAccessLockedActivity(type))) {
            return;
        }
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
        const rowType = (conditionSelections[blockIndex] || [])[subIndex];
        if (isAccessLockedActivity(rowType)) {
            return;
        }
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
        const currentType = (conditionSelections[blockIndex] || [])[selectIndex];
        if (isAccessLockedActivity(currentType)) {
            return;
        }
        if (isAccessLockedActivity(value) && currentType !== value) {
            return;
        }
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
        const activityType = (conditionSelections[blockIndex] || [])[selectIndex];
        if (isAccessLockedActivity(activityType) && value !== 'equals') {
            return;
        }
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
        const activityType = (conditionSelections[blockIndex] || [])[selectIndex];
        const nextValue = isAccessLockedActivity(activityType)
            ? clampAccessValues(activityType, value)
            : value;

        setConditionValues(prev => {
            const next = [...prev];
            const current = [...(next[blockIndex] || [''])];

            // Ensure the array is long enough
            while (current.length <= selectIndex) {
                current.push('');
            }

            // Handle both single values and arrays (for multiselect)
            current[selectIndex] = nextValue;

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
            newRuleData.conditionBlocks[blockIndex].conditions[selectIndex].values = Array.isArray(nextValue) ? nextValue : [nextValue];

            return newRuleData;
        });

        // Check if this is a vertical value selection
        if (activityType === 'b2bDepartment' && nextValue) {
            if (Array.isArray(nextValue)) {
                if (nextValue.includes('all') || nextValue.length === 0) {
                    clearDepartmentSelection();
                } else if (nextValue.length === 1) {
                    handleDepartmentChange(nextValue[0]);
                } else {
                    clearDepartmentSelection();
                }
            } else if (nextValue === 'all') {
                clearDepartmentSelection();
            } else {
                handleDepartmentChange(nextValue);
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
        if (activityType === 'b2bDepartment' && value) {
            if (Array.isArray(value)) {
                // Handle multiselect for vertical
                if (value.includes('all') || value.length === 0) {
                    // If "All Verticals" is selected or no selection, clear vertical selection and fetch all projects
                    clearDepartmentSelection();
                } else if (value.length === 1) {
                    // If only one vertical is selected, use that vertical
                    handleDepartmentChange(value[0]);
                } else {
                    // If multiple verticals are selected, clear selection and fetch all projects
                    clearDepartmentSelection();
                }
            } else {
                // Handle single select for vertical
                if (value === 'all') {
                    // If "All Verticals" is selected, clear vertical selection and fetch all projects
                    clearDepartmentSelection();
                } else {
                    // If a specific vertical is selected, update vertical selection and fetch its projects
                    handleDepartmentChange(value);
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
                                        Schedule
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
                                            {new Date(rule.startDate).toLocaleDateString("en-GB")} {rule.startTime}
                                            {rule.endDate && (
                                                <> — {new Date(rule.endDate).toLocaleDateString("en-GB")} {rule.endTime}</>
                                            )}
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
                                                            const to24Hour = (timeStr) => {
                                                                let timeForInput = timeStr || '';
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
                                                                return timeForInput;
                                                            };

                                                            setRuleData({
                                                                ...rule,
                                                                startDate: rule.startDate ? new Date(rule.startDate) : '',
                                                                endDate: rule.endDate ? new Date(rule.endDate) : '',
                                                                startTime: to24Hour(rule.startTime),
                                                                endTime: to24Hour(rule.endTime)
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
                                <h1 className="modal-title fs-5" id="staticBackdropLabel">{modalMode === 'edit' ? 'Edit B2B Rule' : 'Add B2B Rule'}</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-12">
                                        <p className='ruleInfo'>{modalMode === 'edit' ? 'Do you want to update the rule?' : 'A new rule can be added using this dialog, you need to select Rules and actions to be performed based on the Rules'}</p>
                                        <div className="ruleFormHeader ruleFormHeaderInline">
                                            <div className="ruleNameField">
                                                <label className="ruleFieldLabel">Rule Name</label>
                                                <input
                                                    type="text"
                                                    name='ruleName'
                                                    placeholder='Name of the Rule'
                                                    value={ruleData.name}
                                                    onChange={(e) => setRuleData(prev => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>
                                            <div className="ruleScheduleField">
                                                <label className="ruleFieldLabel">Start Date</label>
                                                <div className="datePickerSection">
                                                    <DatePicker
                                                        className="ruleDatePicker"
                                                        name="startDate"
                                                        format="dd/MM/yyyy"
                                                        value={ruleData.startDate}
                                                        onChange={(date) => setRuleData(prev => ({ ...prev, startDate: date }))}
                                                        clearIcon={null}
                                                    />
                                                </div>
                                            </div>
                                            <div className="ruleScheduleField">
                                                <label className="ruleFieldLabel">Start Time</label>
                                                <div className="timePickerSection">
                                                    <input
                                                        name="startTime"
                                                        type="time"
                                                        className="ruleTimeInput"
                                                        id="actionStartTime"
                                                        value={ruleData.startTime}
                                                        onChange={(e) => setRuleData(prev => ({ ...prev, startTime: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="ruleScheduleField">
                                                <label className="ruleFieldLabel">End Date</label>
                                                <div className="datePickerSection">
                                                    <DatePicker
                                                        className="ruleDatePicker"
                                                        name="endDate"
                                                        format="dd/MM/yyyy"
                                                        value={ruleData.endDate}
                                                        onChange={(date) => setRuleData(prev => ({ ...prev, endDate: date }))}
                                                        clearIcon={null}
                                                    />
                                                </div>
                                            </div>
                                            <div className="ruleScheduleField">
                                                <label className="ruleFieldLabel">End Time</label>
                                                <div className="timePickerSection">
                                                    <input
                                                        name="endTime"
                                                        type="time"
                                                        className="ruleTimeInput"
                                                        id="actionEndTime"
                                                        value={ruleData.endTime}
                                                        onChange={(e) => setRuleData(prev => ({ ...prev, endTime: e.target.value }))}
                                                    />
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
                                                        <div className="col-auto ms-auto d-flex align-items-center">
                                                            <span
                                                                className="badge rounded-pill"
                                                                style={{
                                                                    backgroundColor: '#e8f5e9',
                                                                    color: '#1b5e20',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 600,
                                                                    padding: '0.45rem 0.85rem',
                                                                    border: '1px solid #a5d6a7'
                                                                }}
                                                                title="People who currently match these IF conditions"
                                                            >
                                                                {matchCountLoading
                                                                    ? 'Counting people…'
                                                                    : `${matchCount}${matchCountCapped ? '+' : ''} people match`}
                                                            </span>
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
                                                                {(conditionSelections[index] || []).map((_, conditionIdx) => {
                                                                    const activityType = (conditionSelections[index] || [''])[conditionIdx] || '';
                                                                    const isLockedRow = isAccessLockedActivity(activityType);
                                                                    const blockHasLocked = (conditionSelections[index] || []).some((type) => isAccessLockedActivity(type));
                                                                    const showDepartmentOption = !hasRestrictedDepartmentAccess || activityType === 'b2bDepartment';
                                                                    const showProjectOption = !hasRestrictedProjectAccess || activityType === 'b2bProject' || activityType === 'project';
                                                                    return (
                                                                    <div key={`condition-${index}-${conditionIdx}`} className="row mb-3 pb-3">
                                                                        <div className="col-10">
                                                                            <div className="row">
                                                                                {/* Activity Type Dropdown - Always visible */}
                                                                                <div className="col-4">
                                                                                    <select
                                                                                        className='form-select'
                                                                                        value={activityType}
                                                                                        disabled={isLockedRow}
                                                                                        onChange={(e) => handleSelectChange(index, conditionIdx, e.target.value)}
                                                                                    >
                                                                                        <option value="">Activity type</option>
                                                                                        <option value="state">State</option>
                                                                                        <option value="status">Status</option>
                                                                                        <option value="subStatus">Sub Status</option>
                                                                                        <option value="leadOwner">Lead Owner</option>
                                                                                        <option value="leadCoOwner">Lead Co-Owner</option>
                                                                                        <option value="leadAddedBy">Lead Added By</option>
                                                                                        {showProjectOption && <option value="b2bProject">B2B Project</option>}
                                                                                        {showDepartmentOption && <option value="b2bDepartment">B2B Department</option>}
                                                                                        <option value="typeOfB2B">Type of B2B</option>
                                                                                        <option value="leadCategory">Lead Category</option>
                                                                                        <option value="leadRanking">Lead Ranking</option>
                                                                                    </select>
                                                                                </div>

                                                                                {/* Operator Dropdown - Only show if Activity Type is selected */}
                                                                                {activityType && (
                                                                                    <div className="col-4">
                                                                                        <select
                                                                                            className='form-select'
                                                                                            value={(conditionOperators[index] || [''])[conditionIdx] || ''}
                                                                                            disabled={isLockedRow}
                                                                                            onChange={(e) => handleOperatorChange(index, conditionIdx, e.target.value)}
                                                                                        >
                                                                                            <option value="">Select Operator</option>
                                                                                            <option value="equals">Equals</option>
                                                                                            {!isLockedRow && <option value="not_equals">Not Equals</option>}
                                                                                        </select>
                                                                                    </div>
                                                                                )}

                                                                                {/* Value Dropdown - Only show if Operator is selected */}
                                                                                {(conditionOperators[index] || [''])[conditionIdx] && activityType && (
                                                                                    <div className="col-4">
                                                                                        {(() => {
                                                                                            const multiValues = ['all', 'status', 'subStatus', 'vertical', 'project']
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
                                                                                {(conditionSelections[index] || []).length > 1 && conditionIdx > 0 && !isLockedRow && (
                                                                                    <button onClick={() => handleRemoveSubCondition(index, conditionIdx)}>
                                                                                        <i className="fa-solid fa-xmark"></i>
                                                                                    </button>
                                                                                )}
                                                                                {conditionIdx === 0 && !blockHasLocked && (
                                                                                    <button onClick={() => handleRemoveCondition(index)}>
                                                                                        <i className="fa-solid fa-xmark"></i>
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    );
                                                                })}



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
                                                                                                                    {whatsappTemplates.length > 0 && whatsappTemplates.map((template, tIndex) => {
                                                                                                                        const templateName = template?.template?.name || template?.name || '';
                                                                                                                        const templateValue = templateName || template?.id || template?._id || '';
                                                                                                                        if (!templateValue) return null;
                                                                                                                        return (
                                                                                                                            <option key={template?.id || template?._id || tIndex} value={templateValue}>
                                                                                                                                {templateName || templateValue}
                                                                                                                            </option>
                                                                                                                        );
                                                                                                                    })}
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
                            <h1 className="modal-title fs-5" id="staticBackdropLabel">Edit B2B Drip Marketing Rule</h1>
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
    max-height: calc(100vh - 2rem);
}

#staticBackdropRuleModel.modal-dialog-scrollable .modal-content,
#staticBackdropRuleModel .modal-dialog.modal-dialog-scrollable .modal-content,
#staticBackdropRuleModel .modal-content {
    border-radius: 12px;
    border: none;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    max-height: calc(100vh - 2rem);
    display: flex;
    flex-direction: column;
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
    overflow-y: auto !important;
    overflow-x: hidden;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    flex: 1 1 auto;
    min-height: 0;
    max-height: none;
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
    box-shadow: 0 0 0 3px rgba(252, 43, 90, 0.12);
}

#staticBackdropRuleModel input[type="text"]::placeholder {
    color: #9e9e9e;
    font-style: italic;
}

/* Rule header: name + schedule in one line */
#staticBackdropRuleModel .ruleFormHeader {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-bottom: 8px;
}

#staticBackdropRuleModel .ruleFormHeaderInline {
    flex-direction: row;
    align-items: flex-end;
    gap: 12px;
    flex-wrap: nowrap;
}

#staticBackdropRuleModel .ruleNameField {
    flex: 1.4;
    min-width: 0;
}

#staticBackdropRuleModel .ruleFormHeaderInline .ruleScheduleField {
    flex: 1;
    min-width: 0;
}

#staticBackdropRuleModel .ruleNameField input[type="text"] {
    margin-bottom: 0;
    border-radius: 8px;
    height: 42px;
    background: #fff;
}

#staticBackdropRuleModel .ruleFieldLabel {
    display: block;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8a8f98;
    margin-bottom: 6px;
    white-space: nowrap;
}

#staticBackdropRuleModel .datePickerSection,
#staticBackdropRuleModel .timePickerSection {
    margin-bottom: 0;
}

#staticBackdropRuleModel .ruleDatePicker.react-date-picker,
#staticBackdropRuleModel .ruleTimeInput {
    width: 100%;
    height: 42px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    transition: all 0.3s ease;
}

#staticBackdropRuleModel .ruleDatePicker .react-date-picker__wrapper {
    height: 100%;
    border: none !important;
    padding: 0 10px;
    display: flex;
    align-items: center;
    gap: 4px;
}

#staticBackdropRuleModel .ruleDatePicker .react-date-picker__inputGroup {
    min-width: 0;
    flex: 1;
}

#staticBackdropRuleModel .ruleDatePicker .react-date-picker__inputGroup__input {
    outline: none;
    color: #333;
}

#staticBackdropRuleModel .ruleDatePicker .react-date-picker__button {
    padding: 0 2px;
    margin: 0;
}

#staticBackdropRuleModel .ruleDatePicker .react-date-picker__button svg {
    width: 16px;
    height: 16px;
    stroke: #8a8f98;
}

#staticBackdropRuleModel .ruleTimeInput {
    padding: 0 12px;
    font-size: 0.95rem;
    color: #333;
    box-shadow: none;
}

#staticBackdropRuleModel .ruleDatePicker.react-date-picker:focus-within,
#staticBackdropRuleModel .ruleTimeInput:focus {
    outline: none;
    border-color: #fc2b5a;
    box-shadow: 0 0 0 3px rgba(252, 43, 90, 0.12);
}

.react-date-picker__wrapper{
height: 100%;
}
.react-calendar{
width: 250px!important;
}

/* Keep date calendar above And/Or toggles and other modal content */
#staticBackdropRuleModel .ruleFormHeaderInline {
    position: relative;
    z-index: 20;
}

#staticBackdropRuleModel .datePickerSection {
    position: relative;
    z-index: 21;
}

#staticBackdropRuleModel .react-date-picker__calendar,
.react-date-picker__calendar {
    z-index: 9999 !important;
}

#staticBackdropRuleModel .react-date-picker__calendar .react-calendar,
.react-date-picker__calendar .react-calendar {
    z-index: 9999 !important;
    position: relative;
    background: #fff;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border: 1px solid #e0e0e0;
    border-radius: 8px;
}

#staticBackdropRuleModel .tab_add_segment {
    position: relative;
    z-index: 1;
}

/* Date and time picker styling (legacy fallback) */
#staticBackdropRuleModel .datePickerSection .react-date-picker,
#staticBackdropRuleModel input[type="time"] {
    width: 100%;
    height: 42px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    padding: 0 12px;
    transition: all 0.3s ease;
}

#staticBackdropRuleModel .datePickerSection .react-date-picker:focus-within,
#staticBackdropRuleModel input[type="time"]:focus {
    border-color: #fc2b5a;
    box-shadow: 0 0 0 3px rgba(252, 43, 90, 0.12);
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
    padding-bottom: 80px;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    overflow: visible;
}

#staticBackdropRuleModel .tab-pane#if,
#staticBackdropRuleModel .tab-pane#then {
    overflow: visible;
    min-height: 0;
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
    overflow: visible;
    position: relative;
}

#staticBackdropRuleModel .ifBlock .row {
    overflow: visible;
    position: relative;
}

#staticBackdropRuleModel .ifBlock .row.mb-3 {
    margin-bottom: 1.25rem !important;
}

#staticBackdropRuleModel .ifBlock .col-4,
#staticBackdropRuleModel .ifBlock .col-10,
#staticBackdropRuleModel .ifBlock .col-2 {
    overflow: visible;
    position: relative;
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
        margin-bottom: 0;
    }

    #staticBackdropRuleModel .ruleFormHeaderInline {
        flex-wrap: wrap;
        align-items: flex-end;
    }

    #staticBackdropRuleModel .ruleFormHeaderInline .ruleNameField {
        flex: 1 1 100%;
    }

    #staticBackdropRuleModel .ruleFormHeaderInline .ruleScheduleField {
        flex: 1 1 calc(50% - 6px);
    }

    #staticBackdropRuleModel .ruleDatePicker.react-date-picker,
    #staticBackdropRuleModel .ruleTimeInput,
    #staticBackdropRuleModel .datePickerSection .react-date-picker,
    #staticBackdropRuleModel input[type="time"] {
        height: 38px;
        font-size: 14px;
    }

    #staticBackdropRuleModel .ruleNameField input[type="text"] {
        height: 38px;
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

export default DripMarketingB2B