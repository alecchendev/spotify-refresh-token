import React from 'react';

const Checkbox = ({ checked, onClick, label }) => (
  <button type="button" className="bg-slate-600 hover:bg-slate-500 cursor-pointer p-2 flex align-middle" onClick={onClick}>
    <input type="checkbox" checked={checked} className="m-auto" onChange={() => {}} />
    <div className="flex-1 cursor-pointer">{label}</div>
  </button>
);

export default Checkbox;
