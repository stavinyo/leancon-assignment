import React from 'react';
import './Table.css';
import TableRow from './TableRow/TableRow';

function Table({ data, activeLabel, onTypeClick, onLevelClick }) {
    if (!data?.levels?.length || !data?.rows?.length) return null;

    return (
        <div className="table-wrapper">
            <table className="building-table">
                <thead>
                    <tr>
                        <th className="sticky-col">Element Type</th>
                        <th className="unit-header">Unit</th>
                        {data.levels.map(level => (
                            <th
                                key={level}
                                className={`clickable-header ${activeLabel === level ? 'active-level' : ''}`}
                                onClick={() => onLevelClick(level)}
                            >
                                {level}
                            </th>
                        ))}
                        <th className="total-header">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.rows.map(row => (
                        <TableRow
                            key={row.type}
                            row={row}
                            levels={data.levels}
                            isActive={activeLabel === row.type}
                            onRowClick={() => onTypeClick(row)}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Table;
