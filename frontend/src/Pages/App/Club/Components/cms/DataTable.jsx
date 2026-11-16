import React from 'react';

export const DataTable = ({ columns, rows, emptyTitle = 'Nothing here yet', emptyBody }) => (
  <div className="admin-table-wrap">
    <table className="admin-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {!rows.length ? (
          <tr>
            <td colSpan={columns.length} className="club-list-page__empty">
              {emptyTitle}
              {emptyBody ? ` ${emptyBody}` : ''}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key] != null && row[col.key] !== '' ? row[col.key] : '—'}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
