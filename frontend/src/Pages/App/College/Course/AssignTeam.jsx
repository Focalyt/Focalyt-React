import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const AssignTeam = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  return (
    <div>AssignTeam</div>
  )
}

export default AssignTeam