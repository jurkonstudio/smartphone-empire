export function renderHeader({ state, activeView }) {
    return `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <h1 style="font-size:18px; font-weight:bold; color:#fff;">${state.companyName}</h1>
            <div style="font-size:14px; color:#4CAF50; font-weight:bold;">
                $${state.cash.toLocaleString()}
            </div>
        </div>
    `;
}
