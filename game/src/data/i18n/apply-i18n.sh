#!/usr/bin/env bash
# Salin file hasil i18n ke struktur proyek Smartphone Empire.
# Pemakaian (dari ROOT proyek, mis. folder smartphone-empire-main):
#   bash apply-i18n.sh /path/ke/folder-berisi-file-flat
# Folder sumber berisi: 30 file panel/modal (flat) + ui-batch.i18n.js + index.js
set -e
SRC="${1:?Beri path folder sumber, mis. bash apply-i18n.sh ../sample-SE-main}"
[ -d src ] || { echo "Jalankan dari root proyek (harus ada folder src/)"; exit 1; }
cp_to() { # nama_sumber tujuan
  if [ -f "$SRC/$1" ]; then mkdir -p "$(dirname "$2")"; cp "$SRC/$1" "$2"; echo "OK   $2"; else echo "SKIP $1 (tidak ada di sumber)"; fi
}
cp_to main.js                    src/main.js
cp_to AdminPanel.js              src/ui/panels/AdminPanel.js
cp_to ChipDesignerPanel.js       src/ui/panels/ChipDesignerPanel.js
cp_to CompetitorDetailModal.js   src/ui/panels/CompetitorDetailModal.js
cp_to DebugPanel.js              src/ui/panels/DebugPanel.js
cp_to DesignWizard.js            src/ui/panels/DesignWizard.js
cp_to DevPanel.js                src/ui/panels/DevPanel.js
cp_to ExchangePanel.js           src/ui/panels/ExchangePanel.js
cp_to FabPanel.js                src/ui/panels/FabPanel.js
cp_to NewsArticleModal.js        src/ui/panels/NewsArticleModal.js
cp_to OSPanel.js                 src/ui/panels/OSPanel.js
cp_to ProductPanel.js            src/ui/panels/ProductPanel.js
cp_to ResearchPanel.js           src/ui/panels/ResearchPanel.js
cp_to SettingsPanel.js           src/ui/panels/SettingsPanel.js
cp_to SiliconStorrPanel.js       src/ui/panels/SiliconStorePanel.js   # nama sumber salah ketik (Storr)
cp_to TeamPanel.js               src/ui/panels/TeamPanel.js
cp_to CampusBuildings.js         src/ui/campus/CampusBuildings.js
cp_to CampusInfo.js              src/ui/campus/CampusInfo.js
cp_to ChartZoomModal.js          src/ui/charts/ChartZoomModal.js
cp_to ChipRadarChart.js          src/ui/charts/ChipRadarChart.js
cp_to OsRadarChart.js            src/ui/charts/OsRadarChart.js
cp_to RadarChart.js              src/ui/charts/RadarChart.js
cp_to SilSpeedBar.js             src/ui/components/SilSpeedBar.js
cp_to TechNodeCard.js            src/ui/components/TechNodeCard.js
cp_to MobileNav.js               src/ui/layout/MobileNav.js
cp_to Sidebar.js                 src/ui/layout/Sidebar.js
cp_to OsScreenMockup.js          src/ui/phone/OsScreenMockup.js
cp_to PhoneMockup.js             src/ui/phone/PhoneMockup.js
cp_to PlayerListPanel.js         src/ui/social/PlayerListPanel.js
cp_to PlayerProfileModal.js      src/ui/social/PlayerProfileModal.js
[ -f "$SRC/PlayerProfileModal" ] && [ ! -f "$SRC/PlayerProfileModal.js" ] && cp_to PlayerProfileModal src/ui/social/PlayerProfileModal.js   # sumber tanpa ekstensi
cp_to ui-batch.i18n.js           src/data/i18n/ui-batch.i18n.js
cp_to index.js                   src/data/i18n/index.js
echo "Selesai. Cek: git status, lalu uji di dua bahasa."
