import React, { useState } from 'react'

const Registration = () => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const [studentData, setStudentData] = useState({
        school: "",
        studentName: "",
        address: "",
        class: "",
        gender: "",
        dob: "",
        parentContact: "",
        interestedTech: "",
        wantsToExploreLab: "",
        exploreReasonOrInterest: "",
        wouldRecommend: ""
    });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudentData({ ...studentData, [name]: value });
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();

    //     try {
    //         const res = await fetch(`${backendUrl}/studentRegistration`, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify(studentData)
    //         });

    //         const result = await res.json();

    //         if (res.status === 201) {
    //             alert("Registration successful!");
    //             window.location.reload();
    //             // optionally clear form
    //             setStudentData({
    //                 school: "",
    //                 studentName: "",
    //                 address: "",
    //                 class: "",
    //                 gender: "",
    //                 dob: "",
    //                 parentContact: "",
    //                 interestedTech: "",
    //                 wantsToExploreLab: "",
    //                 exploreReasonOrInterest: "",
    //                 wouldRecommend: ""
    //             });
    //         } else {
    //             alert(result.message || "Something went wrong");
    //         }
    //     } catch (err) {
    //         alert("Error submitting form.");
    //         console.error(err);
    //     }
    // };
    const [errors, setErrors] = useState({});
    const handleSubmit = async (e) => {
        e.preventDefault();
      
        const newErrors = {};
        if (!studentData.school) newErrors.school = true;
        if (!studentData.studentName) newErrors.studentName = true;
        if (!studentData.class) newErrors.class = true;
        if (!studentData.gender) newErrors.gender = true;
        if (!studentData.dob) newErrors.dob = true;
        if (!studentData.parentContact) newErrors.parentContact = true;
        if (!studentData.interestedTech) newErrors.interestedTech = true;
        if (!studentData.wantsToExploreLab) newErrors.wantsToExploreLab = true;
        if (!studentData.wouldRecommend) newErrors.wouldRecommend = true;
      
        setErrors(newErrors);
      
        if (Object.keys(newErrors).length > 0) {
          alert("Please fill all required fields.");
          return;
        }
      
        try {
          const res = await fetch(`${backendUrl}/studentRegistration`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
          });
      
          const result = await res.json();
      
          if (res.status === 201) {
            alert("Registration successful!");
            window.location.reload();
            setStudentData({
              school: "",
              studentName: "",
              address: "",
              class: "",
              gender: "",
              dob: "",
              parentContact: "",
              interestedTech: "",
              wantsToExploreLab: "",
              exploreReasonOrInterest: "",
              wouldRecommend: ""
            });
          } else {
            alert(result.message || "Something went wrong");
          }
        } catch (err) {
          alert("Error submitting form.");
          console.error(err);
        }
      };
      


    return (
        <>
            <div className="container">
                <div className="Form-header">
                    <div>
                        <h1 className="form-title">STUDENT INFORMATION FORM</h1>
                        <p className="subtitle">FOCALYT FUTURE TECHNOLOGY LAB</p>
                    </div>
                    <div className="logo">
                        <img src="/Assets/images/logo/focalyt_new_logo.png" alt="Focalyt Logo" />
                    </div>
                </div>

                <div className="intro-text">
                    <p><strong>Welcome!</strong> Thanks for showing your interest in future technology lab! Please fill the Form to complete the registration.</p>
                </div>


                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <div className="form-group">
                            <label for="school" className="required-field">School/College/Centre Name:</label>
                            <input type="text" id="school" name="school" placeholder="Enter your institution name" onChange={handleChange} className={errors.school ? 'error-input' : ''} required />
                        </div>
                        <div className="form-group">
                            <label for="name" className="required-field">Student Name:</label>
                            <input type="text" id="name" name="studentName" placeholder="Enter your full name" className={errors.studentName ? 'error-input' : ''} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label for="address">Address:</label>
                            <input type="text" id="address" name="address" onChange={handleChange} placeholder="Enter your address" />
                        </div>

                        <div className="row-group">
                            <div className="col">
                                <div className="form-group">
                                    <label for="class" className="required-field">Class:</label>
                                    <input type="text" id="class" name="class" onChange={handleChange} className={errors.class ? 'error-input' : ''} placeholder="e.g. 10th, 12th, BCA" required />
                                </div>
                            </div>

                            <div className="col">
                                <div className="form-group regGen
                                " style={{
                                        flexDirection: "column",
                                        alignItems: "baseline", marginLeft: "115px"
                                    }}>
                                    <label for="gender" className="required-field">Gender:</label>
                                    <div style={{ display: "flex", gap: "15px" }} className={errors.gender ? 'error-input' : ''}>
                                        <label style={{ width: "auto" }}><input type="radio" name="gender" value="male" onChange={handleChange} required /> Male</label>
                                        <label style={{ width: "auto" }}><input type="radio" name="gender" value="female" onChange={handleChange} /> Female</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row-group">
                            <div className="col">
                                <div className="form-group">
                                    <label htmlFor="dob" className="required-field">Date of Birth:</label>
                                    <input
                                        type="date"
                                        id="dob"
                                        name="dob"
                                        value={studentData.dob}
                                        onChange={handleChange}
                                         className={`form-control ${errors.dob ? 'error-input' : ''}`}
                                        required
                                    />
                                </div>

                            </div>
                            <div className="col">
                                <div className="form-group">
                                    <label for="contact" className="required-field">Parents/Guardian Contact No:</label>
                                    <input type="text" id="contact" name="parentContact"   className={errors.parentContact ? 'error-input' : ''} placeholder="Enter 10-digit mobile number" onChange={handleChange} pattern="^\d{10}$"
  maxLength={10} required />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="question-header">
                            <h3>2. Which Technology you're most interested in?</h3>
                        </div>
                        <div className="options-group">
                            <div className="option-item">
                                <input type="radio" id="ai" name="interestedTech" value="ai" onChange={handleChange} required />
                                <label for="ai">AI (Artificial Intelligence)</label>
                            </div>
                            <div className="option-item">
                                <input type="radio" id="robotics" name="interestedTech" onChange={handleChange} value="robotics" />
                                <label for="robotics">Robotics</label>
                            </div>
                            <div className="option-item">
                                <input type="radio" id="drone" name="interestedTech" onChange={handleChange} value="drone" />
                                <label for="drone">Drone Technology</label>
                            </div>
                            <div className="option-item">
                                <input type="radio" id="iot" name="interestedTech" onChange={handleChange} value="iot" />
                                <label for="iot">IoT (Internet of Things)</label>
                            </div>
                            <div className="option-item">
                                <input type="radio" id="vr" name="interestedTech" onChange={handleChange} value="vr" />
                                <label for="vr">Virtual Reality (AR/VR)</label>
                            </div>
                            <div className="option-item">
                                <input type="radio" id="all" name="interestedTech" onChange={handleChange} value="all" />
                                <label for="all">All of the above</label>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="question-header">
                            <h3>3. Do you want to explore Focalyt Future Technology Lab?</h3>
                        </div>
                        <div className="options-group">
                            <div className="option-item" >
                                <input type="radio" id="explore_yes" name="wantsToExploreLab" onChange={handleChange} value="yes" required />
                                <label for="explore_yes">Yes (Select Below Options)</label>
                            </div>
                            <div className="option-item option-item-width" >
                                <input type="radio" id="explore_no" name="wantsToExploreLab" onChange={handleChange} value="no" />
                                <label for="explore_no">No (Mention Reason Below)</label>
                            </div>
                            <textarea className='option-item-width' onChange={handleChange} placeholder="Please specify your interests or reasons here..." rows="3"></textarea>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="question-header">
                            <h3>4. Would you recommend this Workshop to a friend or family member?</h3>
                        </div>
                        <div className="options-group">
                            <div className="option-item">
                                <input type="radio" id="recommend_yes" name="wouldRecommend" onChange={handleChange} value="yes" required />
                                <label for="recommend_yes">Yes</label>
                            </div>
                            <div className="option-item">
                                <input type="radio" id="recommend_no" name="wouldRecommend" onChange={handleChange} value="no" />
                                <label for="recommend_no">No</label>
                            </div>
                            <div className="option-item">
                                <input type="radio" id="recommend_maybe" name="wouldRecommend" onChange={handleChange} value="maybe" />
                                <label for="recommend_maybe">Maybe</label>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn">Submit Form</button>
                </form>

                <div className="footer">
                    <div className="contact-info">
                        <div>
                            <a href="www.focalyt.com">www.focalyt.com </a></div>
                        <div>
                        <a href="mailto:info@focalyt.com">info@focalyt.com</a>
                        </div>
                    </div>

                </div>


            </div>

 <style>
    {
       `
       .error-input {
  border: 2px solid #e53935 !important;
  background-color: #fff0f0;
}

       .contact-info > div:nth-child(1){
            border-right : 1px solid #f3345a;
            padding-right:10px;
         }
      .contact-info > div > a{
          color:#f3345a;
          text-decoration: #f3345a;
               }
.Form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding: 15px;
  background-color: #f5f9f5;
  border-bottom: 2px solid #eaeaea;
  border-radius: 8px 8px 0 0;
}

.form-title {
  color: #f3345a;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
}

.subtitle {
  color: #424242;
  font-size: 16px;
  text-transform: uppercase;
  margin-top: 5px;
  letter-spacing: 1px;
  font-weight: 600;
}

.logo {
  width: 200px;
  text-align: right;
  padding: 10px;
}
.regGen{
margin-left:0!important;
align-items:baseline;
}
.logo img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  transition: transform 0.3s ease;
}

.logo img:hover {
  transform: scale(1.05);
}

.intro-text {
  margin-bottom: 30px;
  font-size: 16px;
  color: #555;
  background-color: #e8f5e9;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #f3345a;
}

.form-section {
  background-color: #fff;
  padding: 25px;
  margin-bottom: 25px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.form-section:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.form-group label {
  font-size: 15px;
  color: #424242;
  font-weight: 500;
  margin-bottom: 5px;
  width: 200px;
}

.form-group input,
.form-group select,
textarea {
  flex: 1;
  padding: 12px;
  font-size: 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: #f9f9f9;
  transition: border 0.3s, box-shadow 0.3s;
}

.form-group input:focus,
.form-group select:focus,
textarea:focus {
  border-color: #2e7d32;
  box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.2);
  outline: none;
  background-color: #fff;
}

.row-group {
  display: flex;
  gap: 15px;
  width: 100%;
}

.dob-inputs {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dob-inputs input {
  width: 50px;
  text-align: center;
}

.dob-inputs span {
  color: #757575;
  font-size: 14px;
  font-weight: bold;
}

.question-header {
  background-color: #f3345a;
  color: #fff;
  padding: 15px 20px;
  margin: -25px -25px 20px -25px;
  border-radius: 8px 8px 0 0;
}

.question-header h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.options-group {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 15px;
}

.option-item {
  display: flex;
  align-items: center;
  min-width: 180px;
}

.option-item input[type="radio"] {
  margin-right: 10px;
  width: 18px;
  height: 18px;
  accent-color: #2e7d32;
}

.option-item label {
  font-size: 15px;
  margin: 0;
}

textarea {
  width: 100%;
  margin-top: 15px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.required-field::after {
  content: " *";
  color: #e53935;
  font-weight: bold;
}

.submit-btn {
  background-color: #f3345a;
  color: white;
  border: none;
  padding: 14px 28px;
  font-size: 16px;
  border-radius: 50px;
  cursor: pointer;
  margin: 20px auto;
  display: block;
  min-width: 200px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 10px rgba(46, 125, 50, 0.3);
  transition: background-color 0.3s, transform 0.2s;
}

.submit-btn:hover {
//   background-color: #2e7d32;
  transform: translateY(-2px);
//   box-shadow: 0 6px 15px rgba(46, 125, 50, 0.4);
}

.submit-btn:active {
  transform: translateY(1px);
}
.footer {
    display: flex
;
    justify-content: space-between;
    align-items: center;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #eaeaea;
    flex-wrap: wrap;
    gap: 20px;
    background-color: #f5f9f5;
    padding: 20px;
    border-radius: 0 0 8px 8px;
}
    .thank-you {
    margin-top: 30px;
    font-size: 15px;
    color: #424242;
    text-align: center;
    padding: 20px;
    background-color: #e8f5e9;
    border-radius: 8px;
    border-left: 4px solid #f3345a;
    border-right: 4px solid #f3345a;
}
    .thank-you p:first-child {
    font-weight: 600;
    font-size: 18px;
    color: #f3345a;
    margin-bottom: 10px;
}

@media (max-width: 768px) {
.option-item-width{
width:100%}
  .form-group {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom:0px;
  }

  .form-group label,
  .form-group input,
  .form-group select {
    width: 100%;
  }

  .row-group {
    flex-direction: column;
  }

  .submit-btn {
    width: 100%;
  }
}

@media(max-width:768px){
.regGen label{
                   display: flex;
    align-items: center;
}
    .regGen input {
    margin-right:10px}

.question-header h3 {
font-size:16px;}
.form-title {
font-size:24px}
.Form-header{
flex-direction: column-reverse;
    text-align: center;}
    .logo {
width:240px}}
        `
                }
            </style>

        </>
    )
}

export default Registration
