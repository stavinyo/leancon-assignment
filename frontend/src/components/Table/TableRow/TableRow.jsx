import React from 'react';
import './TableRow.css';

function TableRow({ row, levels, isActive, onRowClick }) {
    return (
        <tr
            className={`building-table-row ${isActive ? 'active-row' : ''}`}
            onClick={onRowClick}
        >
            <td className="type-cell">{row.type}</td>
            <td className="unit-cell">{row.unit}</td>
            {levels.map(level => (
                <td key={level} className="value-cell">
                    {row.levels[level] ? row.levels[level].toFixed(2) : '-'}
                </td>
            ))}
            <td className="total-cell">{row.total.toFixed(2)}</td>
        </tr>
    );
}

export default TableRow;
