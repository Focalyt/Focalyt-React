import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Search, Check, AlertCircle, Users, Shield, Eye, Edit, Plus, Trash2, Globe, Target, FolderOpen, ArrowRight, Info, CheckCircle, UserPlus, CheckSquare, Send } from 'lucide-react';

const DynamicRoleCreator = () => {
    const [roleName, setRoleName] = useState('Regional Manager');
    const [roleDescription, setRoleDescription] = useState('Can manage multiple centers across different regions');
    const [openDropdown, setOpenDropdown] = useState(null);
    const [showSummary, setShowSummary] = useState(true);
    const [showDemo, setShowDemo] = useState(false);

    // Permission types and their states
    const [permissions, setPermissions] = useState({
        view: { type: 'contextual', entities: { centers: [2, 5] } }, // Pre-selected some centers for demo
        add: { type: 'global', entities: {} },
        edit: { type: 'contextual', entities: {} },
        delete: { type: 'contextual', entities: {} },
        assign_leads: { type: 'contextual', entities: {} },
        verify: { type: 'contextual', entities: {} },
        verify_permissions: { type: 'contextual', entities: {} }, 
        publish: { type: 'contextual', entities: {} }
    });

    const [searchTerms, setSearchTerms] = useState({
        verticals: '',
        projects: '',
        centers: '',
        courses: '',
        batches: ''
    });

    const [validationErrors, setValidationErrors] = useState({});

    // Comprehensive sample data with realistic Indian context
    const sampleData = {
        verticals: [
            { id: 1, name: 'Information Technology' },
            { id: 2, name: 'Healthcare & Medical Sciences' },
            { id: 3, name: 'Banking & Financial Services' },
            { id: 4, name: 'Education & Training' },
            { id: 5, name: 'Manufacturing & Engineering' },
            { id: 6, name: 'Retail & E-commerce' }
        ],
        projects: [
            { id: 1, name: 'Digital Banking Platform', verticalIds: [3] },
            { id: 2, name: 'AI Healthcare Solutions', verticalIds: [2, 1] },
            { id: 3, name: 'E-learning Management System', verticalIds: [4, 1] },
            { id: 4, name: 'Industrial IoT Solutions', verticalIds: [5, 1] },
            { id: 5, name: 'Fintech Mobile Apps', verticalIds: [3, 1] },
            { id: 6, name: 'Telemedicine Platform', verticalIds: [2] },
            { id: 7, name: 'E-commerce Analytics', verticalIds: [6, 1] },
            { id: 8, name: 'Smart Manufacturing', verticalIds: [5] }
        ],
        centers: [
            { id: 1, name: 'Delhi NCR Tech Hub', projectIds: [1, 2, 3, 5] },
            { id: 2, name: 'Mumbai Financial Center', projectIds: [1, 5, 7] },
            { id: 3, name: 'Bangalore Innovation Lab', projectIds: [2, 3, 4] },
            { id: 4, name: 'Hyderabad IT Center', projectIds: [1, 3, 7] },
            { id: 5, name: 'Pune Manufacturing Hub', projectIds: [4, 8] },
            { id: 6, name: 'Chennai Medical Center', projectIds: [2, 6] },
            { id: 7, name: 'Kolkata Education Center', projectIds: [3] },
            { id: 8, name: 'Ahmedabad Business Center', projectIds: [1, 7] }
        ],
        courses: [
            { id: 1, name: 'Full Stack Web Development', centerIds: [1, 3, 4] },
            { id: 2, name: 'Data Science & AI Fundamentals', centerIds: [1, 2, 3] },
            { id: 3, name: 'Mobile App Development (Flutter)', centerIds: [2, 4] },
            { id: 4, name: 'Digital Banking Systems', centerIds: [1, 2] },
            { id: 5, name: 'Healthcare Data Analytics', centerIds: [3, 6] },
            { id: 6, name: 'IoT & Embedded Systems', centerIds: [3, 5] },
            { id: 7, name: 'Financial Technology Basics', centerIds: [2, 8] },
            { id: 8, name: 'E-learning Platform Development', centerIds: [4, 7] },
            { id: 9, name: 'Industrial Automation', centerIds: [5] },
            { id: 10, name: 'Telemedicine Solutions', centerIds: [6] }
        ],
        batches: [
            { id: 1, name: 'WebDev-2024-Jan-Morning', courseIds: [1] },
            { id: 2, name: 'WebDev-2024-Jan-Evening', courseIds: [1] },
            { id: 3, name: 'DataScience-2024-Feb-Intensive', courseIds: [2] },
            { id: 4, name: 'DataScience-2024-Feb-Weekend', courseIds: [2] },
            { id: 5, name: 'Flutter-2024-Mar-Batch1', courseIds: [3] },
            { id: 6, name: 'Flutter-2024-Mar-Batch2', courseIds: [3] },
            { id: 7, name: 'Banking-2024-Apr-Professional', courseIds: [4] },
            { id: 8, name: 'Healthcare-2024-May-Analytics', courseIds: [5] },
            { id: 9, name: 'IoT-2024-Jun-Advanced', courseIds: [6] },
            { id: 10, name: 'Fintech-2024-Jul-Beginner', courseIds: [7] },
            { id: 11, name: 'Elearning-2024-Aug-Dev', courseIds: [8] },
            { id: 12, name: 'Automation-2024-Sep-Pro', courseIds: [9] },
            { id: 13, name: 'Telemedicine-2024-Oct-Basic', courseIds: [10] }
        ]
    };

    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get all parent entities for automatic access
    const getParentEntities = (entityType, entityId) => {
        const parents = {
            verticals: [],
            projects: [],
            centers: [],
            courses: []
        };

        switch (entityType) {
            case 'batches':
                const batch = sampleData.batches.find(b => b.id === entityId);
                if (batch) {
                    parents.courses = batch.courseIds;
                    batch.courseIds.forEach(courseId => {
                        const course = sampleData.courses.find(c => c.id === courseId);
                        if (course) {
                            parents.centers = [...new Set([...parents.centers, ...course.centerIds])];
                        }
                    });
                }
            case 'courses':
                if (entityType === 'courses') {
                    const course = sampleData.courses.find(c => c.id === entityId);
                    if (course) {
                        parents.centers = course.centerIds;
                    }
                }
                parents.centers.forEach(centerId => {
                    const center = sampleData.centers.find(c => c.id === centerId);
                    if (center) {
                        parents.projects = [...new Set([...parents.projects, ...center.projectIds])];
                    }
                });
            case 'centers':
                if (entityType === 'centers') {
                    const center = sampleData.centers.find(c => c.id === entityId);
                    if (center) {
                        parents.projects = center.projectIds;
                    }
                }
                parents.projects.forEach(projectId => {
                    const project = sampleData.projects.find(p => p.id === projectId);
                    if (project) {
                        parents.verticals = [...new Set([...parents.verticals, ...project.verticalIds])];
                    }
                });
                break;
            case 'projects':
                const project = sampleData.projects.find(p => p.id === entityId);
                if (project) {
                    parents.verticals = project.verticalIds;
                }
                break;
        }

        return parents;
    };

    // Get all entities user has view access to (including automatic parent access)
    const getAllViewAccessEntities = () => {
        if (!permissions.view || permissions.view.type === 'global') {
            return {
                verticals: sampleData.verticals.map(v => v.id),
                projects: sampleData.projects.map(p => p.id),
                centers: sampleData.centers.map(c => c.id),
                courses: sampleData.courses.map(c => c.id),
                batches: sampleData.batches.map(b => b.id)
            };
        }

        const viewEntities = permissions.view.entities || {};
        const allAccess = {
            verticals: new Set(),
            projects: new Set(),
            centers: new Set(),
            courses: new Set(),
            batches: new Set()
        };

        // Add directly selected entities
        Object.keys(viewEntities).forEach(level => {
            if (viewEntities[level]) {
                viewEntities[level].forEach(id => allAccess[level].add(id));
            }
        });

        // Add automatic parent access
        Object.keys(viewEntities).forEach(level => {
            if (viewEntities[level]) {
                viewEntities[level].forEach(entityId => {
                    const parents = getParentEntities(level, entityId);
                    Object.keys(parents).forEach(parentLevel => {
                        parents[parentLevel].forEach(parentId => {
                            allAccess[parentLevel].add(parentId);
                        });
                    });
                });
            }
        });

        // Convert Sets back to arrays
        Object.keys(allAccess).forEach(level => {
            allAccess[level] = Array.from(allAccess[level]);
        });

        return allAccess;
    };

    // Get the highest level of direct view access (master access level)
    const getMasterAccessLevel = () => {
        if (!permissions.view || permissions.view.type === 'global') {
            return 'verticals'; // Global access means can add at any level
        }

        const viewEntities = permissions.view.entities || {};
        const levels = ['verticals', 'projects', 'centers', 'courses', 'batches'];

        // Find the highest level where user has direct access
        for (const level of levels) {
            if (viewEntities[level] && viewEntities[level].length > 0) {
                return level;
            }
        }

        return null;
    };

    // Get allowed levels for add/edit/delete based on master access level
    const getAllowedLevelsForPermission = (permissionType) => {
        if (permissionType === 'view') {
            return ['verticals', 'projects', 'centers', 'courses', 'batches'];
        }

        // Safety check for permission existence
        if (!permissions[permissionType]) {
            return [];
        }

        // Special rules for business-specific permissions
        if (permissionType === 'assign_leads') {
            // Lead assignment typically happens at Course and Batch level
            const masterLevel = getMasterAccessLevel();
            if (!masterLevel) return [];

            const allLevels = ['verticals', 'projects', 'centers', 'courses', 'batches'];
            const masterIndex = allLevels.indexOf(masterLevel);
            const allowedLevels = allLevels.slice(masterIndex);

            // Filter to only show levels where lead assignment makes sense
            return allowedLevels.filter(level => ['courses', 'batches'].includes(level));
        }

        if (permissionType === 'verify') {
            // Verification can happen at multiple levels
            const masterLevel = getMasterAccessLevel();
            if (!masterLevel) return [];

            const allLevels = ['verticals', 'projects', 'centers', 'courses', 'batches'];
            const masterIndex = allLevels.indexOf(masterLevel);

            return allLevels.slice(masterIndex);
        }

        if (permissionType === 'publish') {
            // Publishing typically for courses and batches
            const masterLevel = getMasterAccessLevel();
            if (!masterLevel) return [];

            const allLevels = ['verticals', 'projects', 'centers', 'courses', 'batches'];
            const masterIndex = allLevels.indexOf(masterLevel);
            const allowedLevels = allLevels.slice(masterIndex);

            // Filter to only show levels where publishing makes sense
            return allowedLevels.filter(level => ['courses', 'batches'].includes(level));
        }

        if (permissions[permissionType].type === 'global') {
            // For global add/edit/delete, user can work at their master access level + children
            const masterLevel = getMasterAccessLevel();
            if (!masterLevel) return [];

            const allLevels = ['verticals', 'projects', 'centers', 'courses', 'batches'];
            const masterIndex = allLevels.indexOf(masterLevel);

            // Return master level + all child levels
            return allLevels.slice(masterIndex);
        }

        // For contextual permissions, same logic - master level + children only
        const masterLevel = getMasterAccessLevel();
        if (!masterLevel) return [];

        const allLevels = ['verticals', 'projects', 'centers', 'courses', 'batches'];
        const masterIndex = allLevels.indexOf(masterLevel);

        return allLevels.slice(masterIndex);
    };

    const getPermissionIcon = (type) => {
        const icons = {
            view: Eye,
            add: Plus,
            edit: Edit,
            delete: Trash2,
            assign_leads: UserPlus,
            verify: CheckSquare,
            verify_permissions: Shield,
            publish: Send
        };
        return icons[type];
    };

    const getPermissionColor = (type) => {
        const colors = {
            view: 'text-primary',
            add: 'text-success',
            edit: 'text-warning',
            delete: 'text-danger',
            assign_leads: 'text-secondary',
            verify: 'text-info',
             verify_permissions: 'text-orange',
            publish: 'text-dark'
        };
        return colors[type];
    };

    const getPermissionTitle = (type) => {
        const titles = {
            view: 'View Permissions',
            add: 'Add Permissions',
            edit: 'Edit Permissions',
            delete: 'Delete Permissions',
            verify_permissions: 'Verification Permissions',
            assign_leads: 'Lead Assignment Permissions',
            verify: 'Verification Documents',
            publish: 'Publish Permissions'
        };
        return titles[type];
    };

    const getPermissionDescription = (type) => {
        const descriptions = {
            view: 'Select entities user can view. Parent folders are automatically accessible.',
            add: 'Global: Can add child entities anywhere with View access. Contextual: Specific entities only.',
            edit: 'Can modify entities (limited to View access scope)',
            delete: 'Can remove entities (limited to View access scope)',
            verify_permissions: 'Can verify/approve batches, courses and other entities for activation',
            assign_leads: 'Can assign leads to batches and courses within View access scope',
            verify: 'Can verify Documents, courses and other entities for activation',
            publish: 'Can publish courses and batches to make them live for students'
        };
        return descriptions[type];
    };

    const updatePermissionType = (permissionType, accessType) => {
        setPermissions(prev => ({
            ...prev,
            [permissionType]: {
                type: accessType,
                entities: accessType === 'global' ? {} : (prev[permissionType]?.entities || {})
            }
        }));

        setValidationErrors(prev => ({
            ...prev,
            [permissionType]: null
        }));
    };

    const getFilteredData = (level, permissionType) => {
        let data = sampleData[level];
        const search = searchTerms[level].toLowerCase();

        // Apply search filter
        if (search) {
            data = data.filter(item => item.name.toLowerCase().includes(search));
        }

        // For add/edit/delete permissions, only show entities where user has view access
        if (permissionType !== 'view' && permissions[permissionType] && permissions[permissionType].type === 'contextual') {
            if (permissions.view && permissions.view.type === 'global') {
                return data;
            }

            const viewAccess = getAllViewAccessEntities();
            data = data.filter(item => viewAccess[level].includes(item.id));
        }

        return data;
    };

    const handleEntityToggle = (permissionType, level, itemId) => {
        setPermissions(prev => {
            const currentPermission = prev[permissionType] || { type: 'contextual', entities: {} };
            const currentEntities = currentPermission.entities[level] || [];
            const updatedEntities = currentEntities.includes(itemId)
                ? currentEntities.filter(id => id !== itemId)
                : [...currentEntities, itemId];

            return {
                ...prev,
                [permissionType]: {
                    ...currentPermission,
                    entities: {
                        ...currentPermission.entities,
                        [level]: updatedEntities
                    }
                }
            };
        });
    };

    const removeSelectedEntity = (permissionType, level, itemId) => {
        handleEntityToggle(permissionType, level, itemId);
    };

    const getSelectedEntityNames = (permissionType, level) => {
        const permission = permissions[permissionType];
        if (!permission || !permission.entities) return [];

        const entities = permission.entities[level] || [];
        return entities.map(id => {
            const item = sampleData[level].find(item => item.id === id);
            return item ? { id, name: item.name } : null;
        }).filter(Boolean);
    };

    const getTotalSelectedCount = (permissionType) => {
        // Safety check for permission existence
        if (!permissions[permissionType]) {
            return 'Permission not configured';
        }

        if (permissions[permissionType].type === 'global') {
            if (permissionType === 'view') {
                return 'All entities (including future additions)';
            }
            return 'Can ' + permissionType.replace('_', ' ') + ' in all entities with View access';
        }

        const entities = permissions[permissionType].entities || {};
        const counts = Object.keys(entities).reduce((total, level) => {
            return total + (entities[level]?.length || 0);
        }, 0);

        if (permissionType === 'view' && counts > 0) {
            const allAccess = getAllViewAccessEntities();
            const totalWithParents = Object.keys(allAccess).reduce((total, level) => {
                return total + allAccess[level].length;
            }, 0);
            return `${counts} direct + ${totalWithParents - counts} automatic parent access`;
        }

        return counts > 0 ? `${counts} entities selected` : 'No entities selected';
    };

    const validateRole = () => {
        const errors = {};

        if (!roleName.trim()) {
            errors.roleName = 'Role name is required';
        }

        if (permissions.view && permissions.view.type === 'contextual') {
            const viewEntities = permissions.view.entities || {};
            const hasViewEntities = Object.keys(viewEntities).some(level =>
                viewEntities[level] && viewEntities[level].length > 0
            );

            if (!hasViewEntities) {
                errors.view = 'At least one entity must be selected for View permission when using Contextual access';
            }
        }

        // Validate business-specific permissions
        const businessPermissions = ['assign_leads', 'verify', 'publish'];
        businessPermissions.forEach(permType => {
            const permission = permissions[permType];
            if (permission && permission.type === 'contextual') {
                const entities = permission.entities || {};
                const allowedLevels = getAllowedLevelsForPermission(permType);

                if (allowedLevels.length === 0 && Object.keys(entities).some(level => entities[level]?.length > 0)) {
                    errors[permType] = `No entities available for ${permType.replace('_', ' ')} permission at current access level`;
                }
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = () => {
        if (validateRole()) {
            const roleData = {
                roleName,
                roleDescription,
                permissions,
                calculatedViewAccess: getAllViewAccessEntities()
            };
            console.log('Role saved successfully:', roleData);

            // Show success message
            alert(`Role "${roleName}" created successfully!\n\nView Access: ${JSON.stringify(roleData.calculatedViewAccess, null, 2)}`);
        }
    };

    const loadDemoData = () => {
        setRoleName('Batch Operations Manager');
        setRoleDescription('Manages batch operations, lead assignments and verifications at Mumbai Financial Center');
        setPermissions({
            view: { type: 'contextual', entities: { centers: [2] } }, // Mumbai Financial Center only
            add: { type: 'global', entities: {} }, // Global add within center scope
            edit: { type: 'contextual', entities: { courses: [4, 7] } }, // Banking & Fintech courses
            delete: { type: 'contextual', entities: {} },
             verify_permissions: { type: 'contextual', entities: {} },
            assign_leads: { type: 'contextual', entities: { batches: [7, 10] } }, // Specific batches for lead assignment
            verify: { type: 'global', entities: {} }, // Can verify anything in their view scope
            publish: { type: 'contextual', entities: { courses: [4] } } // Can publish banking course
        });
        setShowDemo(true);
    };

    const clearDemoData = () => {
        setRoleName('');
        setRoleDescription('');
        setPermissions({
            view: { type: 'global', entities: {} },
            add: { type: 'global', entities: {} },
            edit: { type: 'contextual', entities: {} },
            delete: { type: 'contextual', entities: {} },
             verify_permissions: { type: 'contextual', entities: {} },
            assign_leads: { type: 'contextual', entities: {} },
            verify: { type: 'contextual', entities: {} },
            publish: { type: 'contextual', entities: {} }
        });
        setShowDemo(false);
    };

    const AutoAccessDisplay = () => {
        const allViewAccess = getAllViewAccessEntities();

        if (!permissions.view || permissions.view.type === 'global') {
            return (
                <div className="alert alert-success border-0 mb-3" style={{ backgroundColor: '#d1ecf1', borderColor: '#bee5eb' }}>
                    <h6 className="text-success mb-2 d-flex align-items-center">
                        <Globe className="me-2" size={16} />
                        Global View Access Active
                    </h6>
                    <small className="text-success">
                        User has access to all current entities plus any new entities that will be added in the future.
                    </small>
                </div>
            );
        }

        const hasAutoAccess = Object.keys(allViewAccess).some(level =>
            allViewAccess[level].length > 0
        );

        if (!hasAutoAccess) return null;

        return (
            <div className="alert alert-success border-0 mb-3" style={{ backgroundColor: '#d1ecf1', borderColor: '#bee5eb' }}>
                <h6 className="text-success mb-2 d-flex align-items-center">
                    <FolderOpen className="me-2" size={16} />
                    Calculated Access (Direct + Automatic Parent Access)
                </h6>
                <div className="row g-2">
                    {Object.keys(allViewAccess).map(level => {
                        const directCount = (permissions.view?.entities?.[level])?.length || 0;
                        const totalCount = allViewAccess[level].length;
                        const autoCount = totalCount - directCount;

                        if (totalCount === 0) return null;

                        return (
                            <div key={level} className="col-6">
                                <div className="d-flex justify-content-between align-items-center text-success bg-light px-2 py-1 rounded" style={{ fontSize: '0.75rem' }}>
                                    <span className="fw-bold text-capitalize">{level}:</span>
                                    <span>
                                        {directCount > 0 && `${directCount} direct`}
                                        {directCount > 0 && autoCount > 0 && ' + '}
                                        {autoCount > 0 && `${autoCount} auto`}
                                        {' = '}{totalCount}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const PermissionSection = ({ permissionType, title, description }) => {
        const IconComponent = getPermissionIcon(permissionType);
        const permission = permissions[permissionType] || { type: 'contextual', entities: {} };
        const isContextual = permission.type === 'contextual';

        return (
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                        <div className="bg-light rounded d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>
                            <IconComponent className={`${getPermissionColor(permissionType)}`} size={16} />
                        </div>
                        <div>
                            <h5 className="card-title mb-1">{title}</h5>
                            <small className="text-muted">{description}</small>
                        </div>
                    </div>

                    {validationErrors[permissionType] && (
                        <div className="alert alert-danger d-flex align-items-center mb-3">
                            <AlertCircle className="me-2" size={16} />
                            <small>{validationErrors[permissionType]}</small>
                        </div>
                    )}

                    {/* Special notes */}
                    {permissionType === 'view' && (
                        <div className="alert alert-success mb-3">
                            <small>
                                <strong>Global View:</strong> Access to all current + future entities (new verticals, projects, etc.)
                                <br />
                                <strong>Contextual View:</strong> Access to selected entities + automatic parent folder access
                            </small>
                        </div>
                    )}

                    {permissionType === 'add' && (
                        <div className="alert alert-info mb-3">
                            <small>
                                <strong>Global Add:</strong> Can add child entities at your master access level and below
                                <br />
                                <strong>Contextual Add:</strong> Can add only in specifically selected entities
                                <br />
                                <strong>Example:</strong> Center access → Can add Courses in that Center, Batches in those Courses
                            </small>
                        </div>
                    )}

                    {(permissionType === 'edit' || permissionType === 'delete') && (
                        <div className="alert alert-warning mb-3">
                            <small>
                                <strong>Scope Limited:</strong> Can only {permissionType} entities at your master access level and below
                                <br />
                                <strong>Master Access:</strong> {getMasterAccessLevel() ?
                                    getMasterAccessLevel().charAt(0).toUpperCase() + getMasterAccessLevel().slice(0, -1) :
                                    'None selected'}
                            </small>
                        </div>
                    )}
                    {permissionType === ' verify_permissions' && (
                        <div className="alert alert-info mb-3">
                            <small>
                                <strong>Verification Rights:</strong> Approve/verify entities before they go live
                                <br />
                                <strong>Business Use:</strong> Quality check for courses, batches, content before activation
                                <br />
                                <strong>Global Verify:</strong> Can verify all entities within your view access scope
                            </small>
                        </div>
                    )}

                    {permissionType === 'assign_leads' && (
                        <div className="alert alert-secondary mb-3">
                            <small>
                                <strong>Lead Assignment:</strong> Assign leads to Courses and Batches within your view access
                                <br />
                                <strong>Business Use:</strong> Sales teams can assign potential students to specific learning programs
                                <br />
                                <strong>Scope:</strong> Only Courses and Batches are available for lead assignment
                            </small>
                        </div>
                    )}

                    {permissionType === 'verify' && (
                        <div className="alert alert-info mb-3">
                            <small>
                                <strong>Verification Rights:</strong> Approve/verify entities before they go live
                                <br />
                                <strong>Business Use:</strong> Quality check for courses, batches, content before activation
                                <br />
                                <strong>Global Verify:</strong> Can verify all entities within your view access scope
                            </small>
                        </div>
                    )}

                    {permissionType === 'publish' && (
                        <div className="alert alert-dark mb-3">
                            <small>
                                <strong>Publishing Rights:</strong> Make courses and batches live for student enrollment
                                <br />
                                <strong>Business Use:</strong> Control when courses/batches become available to students
                                <br />
                                <strong>Scope:</strong> Only Courses and Batches can be published
                            </small>
                        </div>
                    )}

                    <div className="mb-3">
                        <div className="d-flex gap-4 mb-2">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name={`${permissionType}-access`}
                                    id={`${permissionType}-global`}
                                    value="global"
                                    checked={permission.type === 'global'}
                                    onChange={() => updatePermissionType(permissionType, 'global')}
                                />
                                <label className="form-check-label d-flex align-items-center" htmlFor={`${permissionType}-global`}>
                                    <Globe className="me-2" size={16} />
                                    Global Access
                                </label>
                            </div>

                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name={`${permissionType}-access`}
                                    id={`${permissionType}-contextual`}
                                    value="contextual"
                                    checked={permission.type === 'contextual'}
                                    onChange={() => updatePermissionType(permissionType, 'contextual')}
                                />
                                <label className="form-check-label d-flex align-items-center" htmlFor={`${permissionType}-contextual`}>
                                    <Target className="me-2" size={16} />
                                    {permissionType === 'view' ? 'Select Specific Entities' : 'Contextual Access'}
                                </label>
                            </div>
                        </div>

                        <small className="text-muted">
                            {permission.type === 'global' ?
                                `${permissionType === 'view' ? 'All entities (current + future)' : `Can ${permissionType.replace('_', ' ')} anywhere user has View access`}` :
                                `Select specific entities for ${permissionType.replace('_', ' ')} permission`
                            }
                        </small>
                    </div>

                    {/* Show automatic access for view permissions */}
                    {permissionType === 'view' && <AutoAccessDisplay />}

                    {/* Contextual Selection */}
                    <div className={`${isContextual ? '' : 'd-none'}`}>
                        {isContextual && (
                            <div className="pt-3 border-top">
                                {permissionType !== 'view' && (
                                    <div className="alert alert-warning mb-3">
                                        <div className="d-flex align-items-center">
                                            <Info className="me-2" size={16} />
                                            <small>
                                                <strong>Master Access Level:</strong> {getMasterAccessLevel() ?
                                                    getMasterAccessLevel().charAt(0).toUpperCase() + getMasterAccessLevel().slice(0, -1) :
                                                    'None'} - Only this level and below are available for {permissionType} permissions
                                            </small>
                                        </div>
                                    </div>
                                )}

                                {getAllowedLevelsForPermission(permissionType).map((level) => (
                                    <MultiSelectDropdown
                                        key={level}
                                        level={level}
                                        permissionType={permissionType}
                                        label={level.charAt(0).toUpperCase() + level.slice(0, -1)}
                                        placeholder={`Select ${level.charAt(0).toUpperCase() + level.slice(0, -1)}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const MultiSelectDropdown = ({ level, permissionType, label, placeholder }) => {
        const filteredData = getFilteredData(level, permissionType);
        const isOpen = openDropdown === `${permissionType}-${level}`;
        const selectedItems = getSelectedEntityNames(permissionType, level);
        const permission = permissions[permissionType];
        const selectedIds = permission?.entities?.[level] || [];

        return (
            <div className="mb-3">
                <label className="form-label">
                    {label}
                    <small className="text-muted ms-1">({filteredData.length} available)</small>
                    {permissionType !== 'view' && permissions.view && permissions.view.type !== 'global' && (
                        <small className="text-muted ms-2">
                            (Limited to master access level and below)
                        </small>
                    )}
                    {permissionType !== 'view' && permissions.view && permissions.view.type === 'global' && (
                        <small className="text-success ms-2">
                            (All entities available - Global View access)
                        </small>
                    )}
                </label>

                <div className="position-relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setOpenDropdown(isOpen ? null : `${permissionType}-${level}`)}
                        className={`btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center ${filteredData.length === 0 ? 'disabled' : ''
                            }`}
                        disabled={filteredData.length === 0}
                    >
                        <span className={selectedItems.length > 0 ? "text-dark" : "text-muted"}>
                            {selectedItems.length > 0 ? `${selectedItems.length} selected` : placeholder}
                        </span>
                        <ChevronDown className={`text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
                    </button>

                    {isOpen && filteredData.length > 0 && (
                        <div className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg" style={{ zIndex: 1050 }}>
                            <div className="p-3 border-bottom">
                                <div className="position-relative">
                                    <Search className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" size={16} />
                                    <input
                                        type="text"
                                        placeholder={`Search ${label.toLowerCase()}...`}
                                        value={searchTerms[level]}
                                        onChange={(e) => setSearchTerms(prev => ({ ...prev, [level]: e.target.value }))}
                                        className="form-control ps-5"
                                    />
                                </div>
                            </div>

                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {filteredData.length > 0 ? (
                                    filteredData.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleEntityToggle(permissionType, level, item.id)}
                                            className="d-flex align-items-center px-3 py-2 cursor-pointer"
                                            style={{ cursor: 'pointer' }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            <div className={`me-3 d-flex align-items-center justify-content-center ${selectedIds.includes(item.id)
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'border border-secondary'
                                                }`} style={{ width: '16px', height: '16px', borderRadius: '2px' }}>
                                                {selectedIds.includes(item.id) && (
                                                    <Check size={12} />
                                                )}
                                            </div>
                                            <small>{item.name}</small>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-2">
                                        <small className="text-muted">
                                            {permissionType !== 'view' && permissions.view.type !== 'global' ?
                                                'No entities with View access found' :
                                                `No ${label.toLowerCase()} found`
                                            }
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {selectedItems.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mt-2">
                        {selectedItems.map(({ id, name }) => (
                            <span
                                key={id}
                                className="badge bg-primary d-flex align-items-center"
                                title={name}
                            >
                                {name.length > 25 ? `${name.substring(0, 25)}...` : name}
                                <button
                                    type="button"
                                    onClick={() => removeSelectedEntity(permissionType, level, id)}
                                    className="btn-close btn-close-white ms-2"
                                    style={{ fontSize: '0.6rem' }}
                                    aria-label="Remove"
                                />
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const PermissionSummary = () => {
        const allViewAccess = getAllViewAccessEntities();

        return (
            <div className="card border-primary">
                <div className="card-body">
                    <h5 className="card-title d-flex align-items-center text-primary">
                        <Shield className="me-2" size={20} />
                        Permission Summary
                    </h5>

                    <div className="mt-3">
                        {/* Core Permissions */}
                        <div className="text-muted mb-2" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #dee2e6', paddingBottom: '4px' }}>
                            Core Permissions
                        </div>
                        {['view', 'add', 'edit', 'delete'].map((permissionType) => {
                            const IconComponent = getPermissionIcon(permissionType);
                            const count = getTotalSelectedCount(permissionType);

                            return (
                                <div key={permissionType} className="d-flex align-items-start justify-content-between py-1">
                                    <div className="d-flex align-items-center">
                                        <IconComponent className={`me-2 ${getPermissionColor(permissionType)}`} size={16} />
                                        <small className="fw-medium text-capitalize">{permissionType}</small>
                                    </div>
                                    <small className="text-muted text-end" style={{ maxWidth: '120px', fontSize: '0.7rem' }}>{count}</small>
                                </div>
                            );
                        })}

                        {/* Business Permissions */}
                        <div className="text-muted mb-2 mt-3" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #dee2e6', paddingBottom: '4px' }}>
                            Business Permissions
                        </div>
                        {['assign_leads', 'verify', 'verify_permissions', 'publish'].map((permissionType) => {
                            const IconComponent = getPermissionIcon(permissionType);
                            const count = getTotalSelectedCount(permissionType);

                            return (
                                <div key={permissionType} className="d-flex align-items-start justify-content-between py-1">
                                    <div className="d-flex align-items-center">
                                        <IconComponent className={`me-2 ${getPermissionColor(permissionType)}`} size={16} />
                                        <small className="fw-medium text-capitalize">
                                            {permissionType.replace('_', ' ')}
                                        </small>
                                    </div>
                                    <small className="text-muted text-end" style={{ maxWidth: '120px', fontSize: '0.7rem' }}>{count}</small>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detailed breakdown for View access */}
                    {permissions.view && permissions.view.type === 'contextual' && permissions.view.entities && Object.keys(permissions.view.entities).length > 0 && (
                        <div className="mt-3 pt-3 border-top">
                            <h6 className="text-primary mb-2" style={{ fontSize: '0.9rem' }}>
                                Master Access Level: {getMasterAccessLevel()?.charAt(0).toUpperCase() + getMasterAccessLevel()?.slice(0, -1) || 'None'}
                            </h6>
                            <div className="mb-2">
                                {Object.keys(allViewAccess).map(level => {
                                    const count = allViewAccess[level].length;
                                    if (count === 0) return null;

                                    const directCount = permissions.view.entities[level]?.length || 0;
                                    const autoCount = count - directCount;
                                    const isMasterLevel = level === getMasterAccessLevel();

                                    return (
                                        <div key={level} className="d-flex justify-content-between text-primary" style={{ fontSize: '0.75rem' }}>
                                            <span className="text-capitalize d-flex align-items-center">
                                                {level}:
                                                {isMasterLevel && <span className="ms-1 badge bg-primary" style={{ fontSize: '0.6rem' }}>Master</span>}
                                            </span>
                                            <span>
                                                {directCount > 0 && `${directCount} direct`}
                                                {directCount > 0 && autoCount > 0 && ' + '}
                                                {autoCount > 0 && `${autoCount} auto`}
                                                {' = '}{count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="pt-2 border-top" style={{ fontSize: '0.7rem', color: '#6c757d' }}>
                                Add/Edit/Delete permissions only available at Master level and below
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-vh-100 bg-light p-3">
            <div className="container-fluid" style={{ maxWidth: '1400px' }}>
                {/* Header with Demo Controls */}
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h1 className="h2 fw-bold d-flex align-items-center mb-2">
                                    <Users className="me-3 text-primary" size={24} />
                                    Dynamic Role Creator - Business Operations Demo
                                </h1>
                                <p className="text-muted mb-0">
                                    Complete role management with Core + Business permissions (Lead Assignment, Verification, Publishing)
                                </p>
                            </div>
                            <div className="d-flex gap-2">

                                <button
                                    onClick={clearDemoData}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={() => setShowSummary(!showSummary)}
                                    className="btn btn-outline-primary btn-sm"
                                >
                                    {showSummary ? 'Hide' : 'Show'} Summary
                                </button>
                            </div>
                        </div>

                        {showDemo && (
                            <div className="alert alert-success mt-3 mb-0">
                                <div className="d-flex align-items-center">
                                    <CheckCircle className="me-2" size={16} />
                                    <span className="fw-medium">Demo Data Loaded:</span>
                                    <span className="ms-2">Batch Operations Manager - Center level access</span>
                                </div>
                                <div className="mt-2" style={{ fontSize: '0.8rem' }}>
                                    ✓ View: Mumbai Financial Center (+ auto parent access)
                                    <br />
                                    ✓ Add: Global within Center scope | Edit: Banking & Fintech courses
                                    <br />
                                    ✓ Assign Leads: Specific batches | Verify: Global | Publish: Banking course
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="row">
                    {/* Main Content */}
                    <div className="col-xl-12">
                        {/* Role Details */}
                        <div className="card shadow-sm border-0 mb-4">
                            <div className="card-body p-4">
                                <h4 className="card-title mb-3">Role Information</h4>

                                <div className="row">
                                    <div className="col-12 mb-3">
                                        <label className="form-label fw-medium">
                                            Role Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={roleName}
                                            onChange={(e) => setRoleName(e.target.value)}
                                            placeholder="Enter role name (e.g., Center Manager, Course Instructor)"
                                            className={`form-control ${validationErrors.roleName ? 'is-invalid' : ''}`}
                                        />
                                        {validationErrors.roleName && (
                                            <div className="invalid-feedback">{validationErrors.roleName}</div>
                                        )}
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-medium">
                                            Description
                                        </label>
                                        <textarea
                                            value={roleDescription}
                                            onChange={(e) => setRoleDescription(e.target.value)}
                                            placeholder="Describe the role and its responsibilities"
                                            rows={3}
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Permission Sections */}
                        <PermissionSection
                            permissionType="view"
                            title={getPermissionTitle('view')}
                            description={getPermissionDescription('view')}
                        />

                        <PermissionSection
                            permissionType="add"
                            title={getPermissionTitle('add')}
                            description={getPermissionDescription('add')}
                        />

                        <PermissionSection
                            permissionType="edit"
                            title={getPermissionTitle('edit')}
                            description={getPermissionDescription('edit')}
                        />

                        <PermissionSection
                            permissionType="delete"
                            title={getPermissionTitle('delete')}
                            description={getPermissionDescription('delete')}
                        />

                        {/* Business-Specific Permissions */}
                        <div className="card border-0 mb-4" style={{ background: 'linear-gradient(135deg, #f8f9ff 0%, #fef7ff 100%)' }}>
                            <div className="card-body p-4">
                                <h4 className="card-title d-flex align-items-center mb-2">
                                    <Users className="me-2 text-secondary" size={20} />
                                    Business-Specific Permissions
                                </h4>
                                <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
                                    Additional permissions for specific business operations like lead management, verification and publishing
                                </p>

                                <div>
                                    <PermissionSection
                                        permissionType="assign_leads"
                                        title={getPermissionTitle('assign_leads')}
                                        description={getPermissionDescription('assign_leads')}
                                    />

                                    <PermissionSection
                                        permissionType="verify"
                                        title={getPermissionTitle('verify')}
                                        description={getPermissionDescription('verify')}
                                    />

                                    <PermissionSection
                                        permissionType="publish"
                                        title={getPermissionTitle('publish')}
                                        description={getPermissionDescription('publish')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="col-xl-12">
                        <div className={`sticky-top ${showSummary ? '' : 'd-none d-xl-block'}`} style={{ top: '20px' }}>
                            <PermissionSummary />

                            {/* Action Buttons */}
                            <div className="mt-3 d-grid gap-2">
                                <button
                                    onClick={handleSave}
                                    className="btn btn-primary"
                                >
                                    Create Role
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DynamicRoleCreator;