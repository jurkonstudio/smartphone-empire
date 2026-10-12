export function renderEmptyState({ title, description, hint }) {
    return `
        <div style="text-align:center; padding:40px 20px; color:#fff;">
            <h2 style="color:#aaa; margin-bottom:10px; font-size:18px;">${title}</h2>
            <p style="color:#666; margin-bottom:20px; font-size:14px;">${description}</p>
            <span style="background:#333; padding:5px 10px; border-radius:15px; font-size:12px; color:#ff9800;">
                ${hint}
            </span>
        </div>
    `;
}
