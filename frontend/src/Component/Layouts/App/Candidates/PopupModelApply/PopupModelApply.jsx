import React from 'react'

const PopupModelApply = () => {
    return (
        <>

            <div className="modal-content">
                <div className="modal-header">
                    <h5 className="modal-title text-white text-uppercase" id="exampleModalLongTitle">COMPLETE PROFILE</h5>
                    <button
                        type="button"
                        className="close"
                        onClick={() => {
                            document.getElementById('apply').classList.remove('show');
                            document.getElementById('apply').style.display = 'none';
                            document.body.classList.remove('modal-open');
                            document.getElementsByClassName('modal-backdrop')[0]?.remove();
                        }}
                    >
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="modal-body pt-1" id="popup-body">
                    <h5 className="pb-1 mb-0">
                        Please complete your profile before applying
                    </h5>
                    <p>You need to complete your profile details to apply for this course.</p>
                </div>
                <div className="row">


                    <div className="form-group mb-2">
                        <select className="form-control" value="" >
                            <option value="">Your Gender / आपका लिंग</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div className="form-group  mb-2">
                        <input type="date" className="form-control" value="" placeholder="Date of Birth / जन्म तिथि" />
                    </div>
                    <div className="form-group mb-2">
                        <select className="form-control" value="" >
                            <option value="">Experience / अनुभव</option>
                            <option value="0">Fresher</option>

                        </select>
                    </div>
                    <div className="form-group mb-2">
                        <select className="form-control" value="" >
                            <option value="">Highest Qualification / उच्चतम योग्यता</option>

                        </select>
                    </div>

                </div>
                <div className="modal-footer">
                    <button className="btn btn-primary" onClick="">Update and Apply</button>
                </div>

            </div>

        </>
    )
}

export default PopupModelApply
