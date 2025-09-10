import React, { useState, useEffect } from 'react'
import DatePicker from 'react-date-picker';
import axios from 'axios';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';


const DripMarketing = () => {



    const [showPopup, setShowPopup] = useState(false);
    const [popupIndex, setPopupIndex] = useState(null);
    const [rules, setRules] = useState([]);
    const [modalMode, setModalMode] = useState('add');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchRules();
    }, []);

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
    const [subConditionSelections, setSubConditionSelections] = useState([]);
    const [thenFirst, setThenFirst] = useState('');
    const [thenShouldBe, setThenShouldBe] = useState('');
    const [thenExecType, setThenExecType] = useState('');
    const [thenMode, setThenMode] = useState('');
    const [thenCount, setThenCount] = useState('');
    const [thenCondition, setThenCondition] = useState([]);
    const [thenConditions, setThenConditions] = useState([]);
    const [thenConditionSelections, setThenConditionSelections] = useState([]);
    const [thenSubConditionSelections, setThenSubConditionSelections] = useState([]);

    const [startDate, setStartDate] = useState(null);
    const [startTime, setStartTime] = useState('');

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
        setSubConditionSelections(prev => [...prev, []]);
    }

    const handleAddThenCondition = () => {
        setThenCondition(prev => [...prev, {}]);
        setThenConditions(prev => [...prev, [{}]]);
        setThenConditionSelections(prev => [...prev, ['']]);
        setThenSubConditionSelections(prev => [...prev, []]);
    }

    const handleRemoveCondition = (indexToRemove) => {
        setCondition(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditions(prev => prev.filter((_, i) => i !== indexToRemove));
        setConditionSelections(prev => prev.filter((_, i) => i !== indexToRemove));
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

            // Ensure at least one select exists
            if (current.length === 0) {
                current.push('');
            }

            next[blockIndex] = current;
            return next;
        });
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
                    <div className="input-group" style={{ maxWidth: '300px', float: 'right' }}>
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
                                            <div className="col-6">
                                                <input type="text" name='ruleName' placeholder='Name of the Rule' />
                                            </div>
                                            <div className="col-6">
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
                                                                <div className='mb-2'>
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
                                                                            {(conditionSelections[index] || ['']).map((val, selIdx) => (
                                                                                <div className="col-4" key={`sel-${index}-${selIdx}`}>
                                                                                    <select value={val} onChange={(e) => handleSelectChange(index, selIdx, e.target.value)}>
                                                                                        <option value="">Select...</option>
                                                                                        <option value="1">1</option>
                                                                                        <option value="2">2</option>
                                                                                    </select>
                                                                                </div>
                                                                            ))}
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



                                                                {(subConditionSelections[index]?.length || 0) > 0 && (conditions[index] || []).slice(1).map((_, subIdx) => (

                                                                    <>

                                                                        {
                                                                            <div className="mb-2">
                                                                                {subLogicOperator}
                                                                            </div>
                                                                        }
                                                                        <div className="row mb-3 pb-3" key={`sub-${index}-${subIdx}`}>
                                                                            <div className="col-10">
                                                                                <div className="row">
                                                                                    {(subConditionSelections[index]?.[subIdx] || ['']).map((val, selIdx) => (
                                                                                        <div className="col-4" key={`subsel-${index}-${subIdx}-${selIdx}`}>
                                                                                            <select value={val} onChange={(e) => handleSubSelectChange(index, subIdx, selIdx, e.target.value)}>
                                                                                                <option value="">Select...</option>
                                                                                                <option value="1">1</option>
                                                                                                <option value="2">2</option>
                                                                                                <option value="3">3</option>
                                                                                            </select>
                                                                                        </div>
                                                                                    ))}
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
                                                                    </>
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
                                                                            <select value={thenFirst} onChange={(e) => setThenFirst(e.target.value)}>
                                                                                <option value="">Select...</option>
                                                                                <option value="1">1</option>
                                                                                <option value="2">2</option>
                                                                            </select>
                                                                        </div>
                                                                        {thenFirst !== '' && (
                                                                            <div className="col-4">
                                                                                <label className="me-2">Should be</label>
                                                                                <select value={thenShouldBe} onChange={(e) => setThenShouldBe(e.target.value)}>
                                                                                    <option value="">Select...</option>
                                                                                    <option value="1">1</option>
                                                                                    <option value="2">2</option>
                                                                                </select>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                </div>
                                                                <div className="col-2">
                                                                    <button onClick={() => handleAddThenCondition()}><i className="fa-solid fa-plus"></i></button>
                                                                </div>
                                                            </div>

                                                            {
                                                                thenCondition.map((_, index) => (
                                                                    <div className="row my-3 border p-3" key={`then-${index}`}>
                                                                        <div className="col-10">
                                                                            <div className="row">
                                                                                <div className="col-4">
                                                                                    <select value={thenCondition[index]} onChange={(e) => setThenCondition(index, e.target.value)}>
                                                                                        <option value="">Select...</option>
                                                                                        <option value="1">1</option>
                                                                                        <option value="2">2</option>
                                                                                    </select>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-2">
                                                                            <button onClick={() => handleAddThenCondition()}><i className="fa-solid fa-plus"></i></button>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            }

                                                            <div className="toggle-container-then my-3" id="toggleButtonthen">

                                                                <div className="toggle-option active" data-value="and">And</div>

                                                            </div>
                                                            <div className="row my-3 border p-3">
                                                                <div className="col-10">
                                                                    <div className="row">

                                                                        <>
                                                                            <div className="col-4">
                                                                                <select
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
                                                                                    <select value={thenMode} onChange={(e) => setThenMode(e.target.value)}>
                                                                                        <option value="">Select Communication Mode</option>
                                                                                        <option value="sms">SMS</option>
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

@media (max-width: 768px) {
    #staticBackdropRuleModel .modal-dialog {
        width: 95%;
        margin: 1rem auto;
    }
    
    #staticBackdropRuleModel .modal-body {
        padding: 20px;
    }
    
    #staticBackdropRuleModel .modal-header,
    #staticBackdropRuleModel .modal-footer {
        padding: 15px 20px;
    }
}

`

                }
            </style>

        </div>
    )
}

export default DripMarketing