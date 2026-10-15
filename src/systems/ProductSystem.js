// ============================================================
// VALIDASI NAMA UNIK
// ============================================================
_isNameTaken(name) {
    var norm = (name || '').trim().toLowerCase();
    if (!norm) return false;
    var catalog = this.state.data.products.catalog || [];
    return catalog.some(function (p) {
        return (p.name || '').trim().toLowerCase() === norm;
    });
}
