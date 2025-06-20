import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faXmark, faPlus } from "@fortawesome/free-solid-svg-icons";

const UploadTemplates = () => {
  const [collegeDocs, setCollegeDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  
  useEffect(() => {
    fetchCollegeDocs();
  }, []);

  const fetchCollegeDocs = async () => {
    try {
      const header = { headers: { 'x-auth': localStorage.getItem('token') } };
      const response = await axios.get(`${backendUrl}/college/getTemplates`, header);
      
      if (response.data.status) {
        setCollegeDocs(response.data.data || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching college documents:', error);
      setLoading(false);
    }
  };

  const checkFileSize = (size) => {
    let finalSize = ((size / 1024) / 1024);
    return finalSize <= 2;
  };

  const checkFileValidation = (file) => {
    let regex = /(\/vnd.ms-excel|\/vnd.openxmlformats-officedocument.spreadsheetml.sheet|\/pdf|\/zip)$/i;
    return regex.test(file);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const filename = file.name;
    const type = file.type;
    const size = file.size;

    if (!checkFileSize(size) || !checkFileValidation(type)) {
      alert("This format is not accepted and each file should be 2MB");
      e.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const header = { 
        headers: { 
          'x-auth': localStorage.getItem('token'),
          "Content-Type": "multipart/form-data"
        } 
      };

      const uploadResponse = await axios.post(`${backendUrl}/api/uploadSingleFile`, formData, header);
      
      if (uploadResponse.data.status) {
        const saveResponse = await axios.post(
          `${backendUrl}/college/uploadTemplates`, 
          { 
            path: uploadResponse.data.data.Key,
            name: filename 
          },
          header
        );
        
        if (saveResponse.data.status) {
          fetchCollegeDocs();
          e.target.value = '';
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  const removeFile = async (e, id, path) => {
    try {
      const header = { 
        headers: { 
          'x-auth': localStorage.getItem('token'),
          "Content-Type": "multipart/form-data"
        } 
      };

      const deleteResponse = await axios.post(
        `${backendUrl}/api/deleteSingleFile`, 
        { key: path },
        header
      );

      if (deleteResponse.data.status) {
        await axios.post(`${backendUrl}/college/removeDocument`, { id }, header);
        fetchCollegeDocs();
      }
    } catch (error) {
      console.error('Error removing file:', error);
      alert('Error removing file');
    }
  };

  return (
    <>
      <section id="Concerned-Person">
        <div className="row">
          <div className="col-xl-6 col-lg-6 px-3">
            <div className="card bg-white shadow">
              <div className="card-header bg-white border-bottom">
                <h4>About Focalyt</h4>
              </div>
              <div className="card-body">
                We are one of the growing job portals for First Time Job Seekers.<br />
                We support colleges by offering placement opportunities to their candidates.<br />
                To become part of Focalyt, kindly upload template details in excel, pdf or zip.
              </div>
            </div>
          </div>

          <div className="col-xl-6 col-lg-6 px-3">
            <div className="card-header bg-white p-1">
              <h4>Upload Templates</h4>
            </div>
            <div className="card bg-white shadow">
              <div className="card-body">
                <div className="row mt-2">
                  {loading ? (
                    <div className="col-12 text-center">Loading...</div>
                  ) : collegeDocs && collegeDocs.length > 0 ? (
                    collegeDocs.map((doc) => (
                      <div
                        key={doc._id}
                        className="col-xl-2 col-lg-3 col-md-1 col-sm-1 col-1 mb-1 galleryImage"
                        style={{ alignSelf: 'center' }}
                      >
                        <div className="image-upload d-flex justify-content-center">
                          <label htmlFor={`media-${doc._id}`}>
                            <a 
                              href={`${bucketUrl}/${doc.path}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <FontAwesomeIcon 
                                icon={faFile} 
                                style={{ fontSize: '48px' }} 
                              />
                            </a>
                          </label>
                        </div>
                        <div className="image-upload d-flex justify-content-center text-break">
                          {doc.name}
                        </div>
                        <div className="image-upload d-flex justify-content-center pt-1">
                          <FontAwesomeIcon
                            icon={faXmark}
                            className="fa-2xl cursor-pointer"
                            style={{ color: 'red' }}
                            title="Remove Document"
                            onClick={() => removeFile(null, doc._id, doc.path)}
                          />
                        </div>
                      </div>
                    ))
                  ) : null}

                  <div
                    className="col-xl-2 mb-1"
                    id="uploadgallery"
                    style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}
                  >
                    <div className="image-upload">
                      <label htmlFor="media-group">
                        <img 
                          src="/Assets/images/icons/jd_one.png" 
                          className="pointer img-fluid" 
                          alt="Upload" 
                        />
                      </label>
                      <input
                        id="media-group"
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".xlsx,.xls,.pdf,.zip"
                      />
                    </div>
                    <label>Upload Templates</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default UploadTemplates;