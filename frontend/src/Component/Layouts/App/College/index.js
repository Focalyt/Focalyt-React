import React, { useState, useEffect, useRef } from 'react'
import { Link, Outlet , useLocation } from "react-router-dom";

import { useNavigate } from "react-router-dom";


const CollegeLayout = ({children}) => {
    const navigate = useNavigate();
    const location = useLocation();
  return (
    <div>
      
    </div>
  )
}

export default CollegeLayout
