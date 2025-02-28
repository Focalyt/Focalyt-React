import React from 'react'

function AdminHeader() {
  return (
    <>
      <header className="bg-gray-900 text-white p-4">
      <nav>
        <ul className="flex space-x-4">
          <li><a href="/admin/dashboard">Dashboard</a></li>
          <li><a href="/admin/users">Users</a></li>
          <li><a href="/admin/settings">Settings</a></li>
        </ul>
      </nav>
    </header>
    </>
  )
}

export default AdminHeader
