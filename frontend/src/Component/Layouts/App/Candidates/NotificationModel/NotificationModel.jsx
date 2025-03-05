import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const SendSMSModal = ({ show, onHide, onSend, smsCount, formData }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      await onSend();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header className="modal-header">
        <h5 className="modal-title text-white text-uppercase">Profile Completion SMS</h5>
        <Button variant="link" className="close" onClick={onHide}>
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </Modal.Header>
      
      <Modal.Body className="pt-1">
        <p>Are you sure you want to send Bulk SMS?</p>
        <p className="text-right font-weight-bold text-danger mr-2">
          <i>Total Messages: {smsCount}</i>
        </p>
      </Modal.Body>
      
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={isLoading}
          className={isLoading ? 'disabled' : ''}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
        
        <Button variant="danger" onClick={onHide}>
          <span className="d-none d-lg-block">Cancel</span>
          <FontAwesomeIcon className="d-block d-lg-none" icon={faTimes} />
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SendSMSModal;