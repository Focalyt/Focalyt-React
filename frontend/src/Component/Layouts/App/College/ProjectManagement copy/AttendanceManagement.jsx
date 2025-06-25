import {React ,useState } from 'react'

const AttendanceManagement = () => {
    const [registerCurrentMonth, setRegisterCurrentMonth] = useState(new Date().getMonth());
    const [registerCurrentYear, setRegisterCurrentYear] = useState(new Date().getFullYear());
    const [registerViewMode, setRegisterViewMode] = useState('month'); // 'month', 'week', 'custom'
    const [registerDateRange, setRegisterDateRange] = useState({
      startDate: '',
      endDate: ''
    });
  return (
    <div>
      
    </div>
  )
}

export default AttendanceManagement
