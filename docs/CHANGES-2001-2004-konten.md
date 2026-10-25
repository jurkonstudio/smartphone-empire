# Konten 2001–2004 + perbaikan IR/MMS/Wi-Fi (kumulatif; menggantikan fix-2000-2007-konektivitas)
Salin file ke lokasi yang sama (path relatif dari akar repo).
- Fitur OS baru: fw_irda, fw_mms, fw_wifi, fw_fm_radio, fw_email, fw_memcard, fw_mp3_player, fw_file_manager, fw_video_rec, fw_video_player, fw_gps_basic.
- Riset baru: net_irda, net_wifi, net_email, net_streaming, stor_mmc, stor_sd, stor_minisd, stor_microsd, cam_video, sensor_gps, audio_fm, audio_mp3.
- Bug baru/terikat fitur: bug_ir_fail, bug_mms_fail, bug_wifi_drop (diikat ke fitur), bug_email_sync, bug_card_corrupt, bug_mp3_skip, bug_video_codec, bug_gps_fix.
- Komponen: kategori BARU `storage` (opsional, seperti RAM): stor_mmc_16, stor_sd_128, stor_minisd_512, stor_microsd_1g. Wizard desain, ProductSystem (stat+biaya), ProductPanel (spesifikasi) ikut. Produk lama tanpa storageId tetap valid.
- Teks id+en lengkap. Jalur kartu update OS diperbarui.
