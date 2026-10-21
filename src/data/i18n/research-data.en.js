// FILE: src/data/i18n/research-data.en.js  (BARU)
// ============================================================
// Terjemahan English untuk data halaman Riset, Fabrikasi (Manufaktur),
// dan Future. Data asli tetap berbahasa Indonesia; file ini hanya dipakai
// saat bahasa aktif = English. Lihat research-localize.js untuk cara pakainya.
//
// Kunci = id dari research.data.js, material-plants.data.js, future-panels.data.js.
// ============================================================

export const RESEARCH_DATA_EN = {
    categories: {
        display: 'Display',
        camera: 'Camera',
        battery: 'Battery',
        chip: 'Chip',
        network: 'Network',
        body: 'Body',
        sensor: 'Sensors',
        audio: 'Audio & Features'
    },

    // Judul dan hint jalur R&D Lanjutan (RND_TRACKS).
    rnd: {
        display: { title: 'Display', hint: 'Brightness, color accuracy, panel efficiency' },
        camera:  { title: 'Camera',  hint: 'Sensor, optics, and image processing' },
        battery: { title: 'Battery', hint: 'Cell density, fast charging, power management' },
        chip:    { title: 'Chip',    hint: 'Efficiency, performance, and thermals' },
        network: { title: 'Network', hint: 'Antenna, modem, and signal stability' },
        body:    { title: 'Body',    hint: 'Materials, weight, and durability' },
        sensor:  { title: 'Sensors', hint: 'Biometric accuracy and security features' },
        audio:   { title: 'Audio',   hint: 'Sound quality, connectivity, and features' }
    },

    nodes: {
        layar_mono: { name: 'Monochrome Display', description: 'Simple black-and-white display for early feature phones.' },
        layar_color_tft: { name: 'TFT Color', description: 'The first color display with moderate power consumption.' },
        layar_touch_res: { name: 'Resistive Touchscreen', description: 'Resistive touchscreen, common on early PDAs and phones.' },
        layar_touch_cap: { name: 'Capacitive Multitouch', description: 'Modern capacitive touchscreen with multitouch.' },
        layar_ips: { name: 'IPS / Retina Display', description: 'High pixel density with wide viewing angles.' },
        layar_amoled: { name: 'AMOLED', description: 'High-contrast, power-efficient OLED panel.' },
        layar_hfr: { name: '90/120 Hz Display', description: 'High refresh rate for smooth animations.' },
        layar_foldable: { name: 'Foldable Display', description: 'Flexible panel for foldable phones.' },

        cam_vga: { name: 'VGA Camera', description: 'The first 0.3 MP camera for phones.' },
        cam_1mp: { name: '1 MP Camera', description: 'The first megapixel camera with better detail.' },
        cam_2mp: { name: '2 MP Camera', description: 'Standard phone camera of the mid-2000s.' },
        cam_5mp: { name: '5 MP Camera', description: 'High-resolution camera with autofocus.' },
        cam_8mp: { name: '8 MP Camera', description: '8 MP camera with HD video recording.' },
        cam_12mp: { name: '12 MP Camera', description: 'Main camera with optical image stabilization.' },
        cam_dual: { name: 'Dual Camera', description: 'Two cameras for bokeh effects and optical zoom.' },
        cam_48mp: { name: '48 MP Camera', description: 'Large sensor with pixel binning.' },
        cam_var_aperture: { name: 'Variable Aperture', description: 'A lens aperture that changes to control light.' },
        cam_periscope: { name: 'Periscope Zoom', description: 'Periscope lens for 5x-10x optical zoom without a thick body.' },
        cam_gimbal: { name: 'Gimbal Stabilization', description: 'Micro mechanical stabilizer for super-smooth video.' },

        bat_nimh: { name: 'NiMH Battery', description: 'Early-generation nickel-metal hydride battery.' },
        bat_liion: { name: 'Li-Ion Battery', description: 'Lithium-ion battery with higher energy density.' },
        bat_lipo: { name: 'Li-Po Battery', description: 'Flexible polymer battery for slim designs.' },
        bat_large: { name: 'High-Capacity Battery', description: '2500+ mAh cell for modern smartphones.' },
        bat_fast: { name: 'Fast Charging', description: 'Quick charging with a dedicated protocol.' },
        bat_usbc: { name: 'USB Type-C Cable & Port', description: 'The new standard reversible connector for data and charging. The retail box now includes a USB Type-C cable.' },
        bat_wireless: { name: 'Wireless Charging', description: 'Qi standard wireless charging.' },
        bat_big5000: { name: '5000 mAh Battery', description: 'Large capacity for all-day use.' },
        bat_sicarbon: { name: 'Silicon-Carbon (Si/C) Battery', description: 'Silicon anode for high capacity in a thin body.' },
        bat_graphene: { name: 'Graphene Battery', description: 'Future technology with extreme energy density.' },
        bat_wireless_50w: { name: '50W Wireless Charging', description: 'Ultra-fast wireless charging.' },
        bat_200w: { name: '200W Super Fast Charging', description: 'Charges fully in under 10 minutes.' },
        bat_solidstate: { name: 'Solid-State Battery', description: 'Future battery with no liquid electrolyte. Very safe and dense.' },

        chip_single: { name: 'Single-core Chip', description: 'Single-core processor for basic features.' },
        chip_dual: { name: 'Dual-core Chip', description: 'Two cores for early multitasking.' },
        chip_quad: { name: 'Quad-core Chip', description: 'Four cores, the modern smartphone standard.' },
        chip_64bit: { name: '64-bit Chip', description: '64-bit ARM architecture for better efficiency.' },
        chip_octa: { name: 'Octa-core Chip', description: 'Eight cores with advanced power management.' },
        chip_npu: { name: 'AI NPU', description: 'Neural Processing Unit for on-device AI.' },
        chip_5nm: { name: '5nm Process', description: '5nm fabrication for high power efficiency.' },
        chip_3nm: { name: '3nm Process', description: 'The most advanced fabrication for maximum performance.' },

        net_gsm: { name: 'GSM', description: '2G cellular network for calls and SMS.' },
        net_gprs: { name: 'GPRS', description: 'The first 2.5G packet data for phones.' },
        net_edge: { name: 'EDGE', description: '2.75G data speed upgrade.' },
        net_3g: { name: '3G', description: 'Third-generation cellular data and video calls.' },
        net_hspa: { name: 'HSPA', description: '3.5G upgrade for streaming.' },
        net_4g: { name: '4G LTE', description: 'High-speed fourth-generation network.' },
        net_5g: { name: '5G', description: 'Fifth-generation network with low latency.' },
        net_wifi6: { name: 'Wi-Fi 6 / eSIM', description: 'Modern connectivity with a built-in eSIM.' },
        net_uwb: { name: 'Ultra-Wideband (UWB)', description: 'High-precision position tracking (like AirTag).' },
        net_satellite: { name: 'Satellite SOS', description: 'Emergency messages via satellite when there is no cellular signal.' },

        body_plastic: { name: 'ABS Plastic', description: 'A sturdy plastic body for early feature phones.' },
        body_aluminum: { name: 'Anodized Aluminum', description: 'Lightweight, premium metal body.' },
        body_glass: { name: 'Tempered Glass', description: 'Strong glass with an oleophobic coating.' },
        body_steel: { name: 'Stainless Steel 316L', description: 'Corrosion-resistant steel. Very sturdy and luxurious.' },
        body_ceramic: { name: 'Zirconia Ceramic', description: 'Scratch-resistant, elegant ceramic body.' },
        body_titanium: { name: 'Grade 5 Titanium', description: 'Aerospace-grade material, light and super strong.' },
        body_vegan_leather: { name: 'Vegan Leather', description: 'Premium synthetic leather that is non-slip and durable.' },
        body_aramid: { name: 'Aramid Fiber', description: 'Light, strong carbon-style fiber, typical of gaming phones.' },

        sensor_accel: { name: 'Accelerometer', description: 'Motion sensor for automatic screen rotation.' },
        sensor_gyro: { name: 'Gyroscope & Compass', description: 'Precise 6-axis orientation sensor.' },
        sensor_fp_rear: { name: 'Rear Fingerprint', description: 'Fast capacitive fingerprint sensor.' },
        sensor_face3d: { name: 'Face ID (3D Scanner)', description: 'Face scanning with infrared dot projection.' },
        sensor_indisplay: { name: 'In-Display Fingerprint', description: 'Hidden optical sensor beneath the screen.' },
        sensor_lidar: { name: 'LiDAR Sensor', description: '3D depth scanner for the environment.' },

        audio_jack: { name: '3.5mm Audio Jack', description: 'Standard headphone connector.' },
        audio_bt: { name: 'Bluetooth 2.0', description: 'File transfer and wireless headsets.' },
        audio_stereo: { name: 'Stereo Speakers', description: 'Dual left-and-right speakers.' },
        audio_nfc: { name: 'NFC (Payments)', description: 'Short-range communication chip.' },
        audio_esim: { name: 'eSIM', description: 'Digital SIM card with no physical card.' },
        audio_spatial: { name: 'Spatial Audio', description: '3D surround sound with head tracking.' }
    },

    plants: {
        battery: {
            name: 'Battery Plant',
            description: 'In-house Li-Ion and Li-Po cells. Lowers the battery cost of every phone you design.',
            levels: { 1: 'Pilot Line', 2: 'Production Line', 3: 'Small Gigafactory', 4: 'Gigafactory' }
        },
        display: {
            name: 'Display Plant',
            description: 'In-house LCD, TFT, and AMOLED panels. Requires an established chip fab.',
            levels: { 1: 'Pilot Line', 2: 'Production Line', 3: 'Large Display Fab', 4: 'Industrial Display Fab' }
        }
    },

    future: {
        f_ai: { name: 'F-AI', description: 'The next generation of AI models for the whole company: a sharper business advisor, design suggestions, and AI-based OS features.' },
        dev_tools: { name: 'Developer Tools', description: 'SDK and toolkit for third-party app developers. Connects the OS to its app ecosystem.' },
        game_engine: { name: 'Game Engine', description: 'Graphics and performance engine for games on phones. Depends on chip quality and the app ecosystem.' },
        user_control: { name: 'User Control', description: 'Privacy settings, usage limits, and controls held by the user. Affects public opinion and the market.' }
    },

    futureSystems: {
        advisor: 'Business Advisor',
        os: 'OS',
        design: 'Phone Design',
        products: 'Products',
        chip: 'Chip',
        opinion: 'Public Opinion',
        market: 'Market',
        team: 'Team'
    }
};
