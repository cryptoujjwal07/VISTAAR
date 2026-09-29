# VISTAAR — NPDC Dataset Inspection & Schema Report

> **Notice**: Generated strictly from genuine NPDC/NCPOR supplied files. No synthetic measurements or assumed schemas.

- **Inspection Date**: 2026-09-29T20:21:27.480932
- **Total Source Datasets**: 22
- **Direct CSV Datasets**: 5
- **Instrument Archives (ZIP)**: 17

---

## 1. Direct CSV Datasets Analysis

### himansh.csv
- **Station**: Himansh
- **Region**: Himalayas (Spiti Valley, Chandra Basin)
- **Provider**: NCPOR
- **SHA-256**: `1e310a2e5cae435518b8b90460e64aef0009ffc6605c454f442792481a01e952`
- **Rows**: 1,132
- **Columns (42)**: id, time_stamp, airtemp_max, airtemp_max_date_time, airtemp_min, airtemp_min_date_time, airtemp_avg_date_time, rh_max, rh_max_date_time, rh_min, rh_min_date_time, sup_avg, sdn_avg, sup_max, sup_max_date_time, sup_min, sup_min_date_time, sdn_max, sdn_max_date_time, sdn_min, sdn_min_date_time, lup_max, lup_min, ldn_max, ldn_min, ws_max, ws_max_date_time, ws_min, ws_min_date_time, ws_avg, wind_dir, dbtcdt_avg, tt_c_avg, tt_c_max, tt_c_max_date_time, tt_c_min, tt_c_min_date_time, preci_mm_total, preci_type_max, preci_type_max_date_time, preci_type_min, preci_type_min_date_time
- **Delimiter**: `','` | **Encoding**: `utf-8`
- **Observed Time Range**: 2015-01-10 18:30:00+00 to 2018-12-30 18:30:00+00 (Column: `time_stamp`)
- **Duplicate Rows**: 0

**Column Details & Sample Observations:**

| Column Name | Type | Missing Values | Sample Real Values |
|---|---|---|---|
| `id` | int64 | 0 | 1, 2, 3 |
| `time_stamp` | str | 0 | 2015-10-18 18:30:00+00, 2015-10-19 18:30:00+00, 2015-10-20 18:30:00+00 |
| `airtemp_max` | float64 | 0 | 9.6, 8.67, 4.763999999999999 |
| `airtemp_max_date_time` | str | 0 | 18-10-2015 15:20, 19-10-2015 12:42, 20-10-2015 13:12 |
| `airtemp_min` | float64 | 0 | 0.061, -3.08, -5.3370000000000015 |
| `airtemp_min_date_time` | str | 0 | 18-10-2015 23:57, 19-10-2015 07:27, 20-10-2015 23:37 |
| `airtemp_avg_date_time` | float64 | 0 | 4.086, 1.195, -1.499 |
| `rh_max` | float64 | 0 | 75.79, 92.7, 97.3 |
| `rh_max_date_time` | str | 0 | 18-10-2015 23:58, 19-10-2015 23:19, 20-10-2015 04:50 |
| `rh_min` | float64 | 0 | 19.58, 12.23, 25.84 |
| `rh_min_date_time` | str | 0 | 18-10-2015 15:41, 19-10-2015 11:44, 20-10-2015 12:31 |
| `sup_avg` | float64 | 0 | 44.62, 188.5, 186.6 |
| `sdn_avg` | float64 | 0 | 11.24, 37.2, 60.95 |
| `sup_max` | float64 | 0 | 570.3, 1100.0, 1142.0 |
| `sup_max_date_time` | str | 0 | 18-10-2015 15:09, 19-10-2015 11:39, 20-10-2015 13:05 |
| `sup_min` | float64 | 0 | -5.7010000000000005, -5.702999999999999, -5.135 |
| `sup_min_date_time` | str | 0 | 18-10-2015 21:49, 19-10-2015 00:18, 20-10-2015 23:06 |
| `sdn_max` | float64 | 0 | 120.1, 214.5, 398.8 |
| `sdn_max_date_time` | str | 0 | 18-10-2015 15:09, 19-10-2015 11:39, 20-10-2015 08:38 |
| `sdn_min` | float64 | 0 | 0.772, -1.8, -0.772 |
| `sdn_min_date_time` | str | 0 | 18-10-2015 19:32, 19-10-2015 17:41, 20-10-2015 00:08 |
| `lup_max` | float64 | 0 | 252.8, 299.7, 301.8 |
| `lup_min` | float64 | 0 | 200.2, 213.4, 200.3 |
| `ldn_max` | float64 | 0 | 406.3, 434.3, 392.8 |
| `ldn_min` | float64 | 0 | 307.4, 295.1, 288.0 |
| `ws_max` | float64 | 0 | 9.11, 17.35, 18.17 |
| `ws_max_date_time` | str | 0 | 18-10-2015 19:40, 19-10-2015 12:35, 20-10-2015 15:16 |
| `ws_min` | float64 | 0 | 0.0, 0.0, 0.0 |
| `ws_min_date_time` | str | 0 | 18-10-2015 15:09, 19-10-2015 00:03, 20-10-2015 09:34 |
| `ws_avg` | float64 | 0 | 4.603, 4.672, 4.492 |
| `wind_dir` | float64 | 0 | 181.2, 160.3, 167.7 |
| `dbtcdt_avg` | float64 | 346 | 450.0, 450.0, 450.0 |
| `tt_c_avg` | float64 | 8 | 1.94, 3.3680000000000003, 0.3 |
| `tt_c_max` | float64 | 0 | 16.89, 23.87, 17.93 |
| `tt_c_max_date_time` | str | 0 | 18-10-2015 15:11, 19-10-2015 12:33, 20-10-2015 12:07 |
| `tt_c_min` | float64 | 0 | -3.465, -6.364, -6.803 |
| `tt_c_min_date_time` | str | 0 | 18-10-2015 23:51, 19-10-2015 06:17, 20-10-2015 23:56 |
| `preci_mm_total` | float64 | 1132 |  |
| `preci_type_max` | float64 | 1132 |  |
| `preci_type_max_date_time` | float64 | 1132 |  |
| `preci_type_min` | float64 | 1132 |  |
| `preci_type_min_date_time` | float64 | 1132 |  |

### iig_bharati.csv
- **Station**: Bharati
- **Region**: Antarctica (Larsemann Hills)
- **Provider**: IIG (Indian Institute of Geomagnetism)
- **SHA-256**: `1702bbe9ee02584bfc62e5156127c79c33e41f5b340abe61b8234043ae39b565`
- **Rows**: 38,337
- **Columns (6)**: obstime, tempr, ap, ws, wd, rh
- **Delimiter**: `','` | **Encoding**: `utf-8`
- **Observed Time Range**: 2012-01-28 12:00:00 to 2016-12-31 23:00:00 (Column: `obstime`)
- **Duplicate Rows**: 0

**Column Details & Sample Observations:**

| Column Name | Type | Missing Values | Sample Real Values |
|---|---|---|---|
| `obstime` | str | 0 | 2012-01-28 12:00:00, 2012-01-28 13:00:00, 2012-01-28 14:00:00 |
| `tempr` | float64 | 0 | -0.33, -0.44, 0.02 |
| `ap` | float64 | 0 | 982.0, 982.02, 981.18 |
| `ws` | float64 | 0 | 4.51, 4.19, 4.06 |
| `wd` | float64 | 0 | 155.95, 149.7, 149.46 |
| `rh` | float64 | 0 | 34.24, 38.07, 40.88 |

### imd_bharati_fixed_hour.csv
- **Station**: Bharati
- **Region**: Antarctica (Larsemann Hills)
- **Provider**: IMD (India Meteorological Department)
- **SHA-256**: `baae92f137f420f4728b0f46a0482099e7d35ee94fac016cdd25db2b67726843`
- **Rows**: 15,528
- **Columns (6)**: obstime, tempr, ap, ws, wd, rh
- **Delimiter**: `','` | **Encoding**: `utf-8`
- **Observed Time Range**: 01-01-2016 00:00 to 31-12-2015 23:00 (Column: `obstime`)
- **Duplicate Rows**: 0

**Column Details & Sample Observations:**

| Column Name | Type | Missing Values | Sample Real Values |
|---|---|---|---|
| `obstime` | str | 0 | 06-02-2015 00:00, 06-02-2015 01:00, 06-02-2015 02:00 |
| `tempr` | float64 | 2433 | -1.59, -1.26, -0.57 |
| `ap` | float64 | 2433 | 962.75, 962.64, 962.71 |
| `ws` | float64 | 2485 | 9.2, 8.85, 7.19 |
| `wd` | float64 | 2485 | 119.28, 123.86, 122.56 |
| `rh` | float64 | 8453 | 43.13, 44.22, 43.35 |

### imd_maitri.csv
- **Station**: Maitri
- **Region**: Antarctica (Schirmacher Oasis)
- **Provider**: IMD (India Meteorological Department)
- **SHA-256**: `1916258465883011618b00b2cebfbcf9c052c67b61b9dc640f54a5019ca28074`
- **Rows**: 155,169
- **Columns (6)**: 1985-01-01 00:00:00, -2, 977.2, 12, -999, -999.1
- **Delimiter**: `','` | **Encoding**: `utf-8`
- **Duplicate Rows**: 0

**Column Details & Sample Observations:**

| Column Name | Type | Missing Values | Sample Real Values |
|---|---|---|---|
| `1985-01-01 00:00:00` | str | 0 | 1985-01-01 12:00:00, 1985-01-01 13:00:00, 1985-01-01 14:00:00 |
| `-2` | float64 | 0 | -2.0, -2.0, -2.0 |
| `977.2` | float64 | 0 | 977.8, 977.9, 978.2 |
| `12` | float64 | 0 | 13.0, 14.0, 14.0 |
| `-999` | int64 | 0 | -999, -999, -999 |
| `-999.1` | int64 | 0 | -999, -999, -999 |

### sankalp_sase.csv
- **Station**: Sankalp / SASE Field Post
- **Region**: Western Himalayas
- **Provider**: DGRE / SASE (MoD / NCPOR collaborator)
- **SHA-256**: `ab4db5d0113a35e5e372b42c11b5a18084ef317c2f3200f639513fd6e6725856`
- **Rows**: 83,798
- **Columns (6)**: obstime, tempr, ap, ws, wd, rh
- **Delimiter**: `','` | **Encoding**: `utf-8`
- **Observed Time Range**: 2006-02-23 12:00:00 to 2015-12-31 23:00:00 (Column: `obstime`)
- **Duplicate Rows**: 0

**Column Details & Sample Observations:**

| Column Name | Type | Missing Values | Sample Real Values |
|---|---|---|---|
| `obstime` | str | 0 | 2006-02-23 12:00:00, 2006-02-23 13:00:00, 2006-02-23 14:00:00 |
| `tempr` | float64 | 0 | -4.059, -3.079, -1.473 |
| `ap` | float64 | 0 | 941.0, 941.0, 941.0 |
| `ws` | float64 | 0 | 1.95, 1.347, 0.5 |
| `wd` | float64 | 0 | 159.2, 166.3, 198.7 |
| `rh` | float64 | 0 | 40.02, 37.35, 30.26 |

---

## 2. Instrument & Atmospheric Archive Datasets (ZIP)

### highspeedwinrecorder-data-2015-19.zip
- **Instrument**: High Speed Wind Recorder
- **Station**: Unknown
- **Region**: Polar
- **Provider**: IMD / NCPOR
- **SHA-256**: `edf05fa712cd274870849d57742561e33b382f816b78827cffd35a092200adb6`
- **Compressed Size**: 41.91 MB
- **Internal Files**: 2,008 files (439.88 MB uncompressed)
- **Sample File**: `34/HWSR  DEC 2014/LEGENDS CH1 CH2 ETC.txt`
```text
CH1-----TEMP DRY BULB

CH2---RH

CH3 WIND DIRECTION

```

### micro_rain_radar_2014.zip
- **Instrument**: Micro Rain Radar (MRR-2)
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `e1e697528e51d134157052900b29926312e67451b18641885cae4b3b728753fe`
- **Compressed Size**: 71.98 MB
- **Internal Files**: 300 files (208.28 MB uncompressed)

### micro_rain_radar_2015.zip
- **Instrument**: Micro Rain Radar (MRR-2)
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `86467b7b4b82738c6904c38dd1aef60cacdc350bafa89e3088d7ec563dd307d0`
- **Compressed Size**: 45.68 MB
- **Internal Files**: 249 files (172.87 MB uncompressed)

### micro_rain_radar_2016.zip
- **Instrument**: Micro Rain Radar (MRR-2)
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `66c929371db3fac273d8bee0a2270768e413c3cde1f4a36036b933c36983c230`
- **Compressed Size**: 41.15 MB
- **Internal Files**: 269 files (186.76 MB uncompressed)

### micro_rain_radar_2017.zip
- **Instrument**: Micro Rain Radar (MRR-2)
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `e816d51e138bdf8d13753bd98c88ef81ac31ad2d69dfd669f231cf5096e6a4ab`
- **Compressed Size**: 17.61 MB
- **Internal Files**: 95 files (65.96 MB uncompressed)

### ott_2018.zip
- **Instrument**: OTT-PARSIVEL Optical Disdrometer
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `cbec1a6bc27db42aa961e65f197675d99a8fd24bfe8cba36040bb372b5b6f0fd`
- **Compressed Size**: 1.20 MB
- **Internal Files**: 9 files (12.65 MB uncompressed)
- **Sample File**: `2018/ott_data_04_2018_npdc.csv`
```text
Timestamp,Intensity of precipitation (mm/h),Weather code SYNOP WaWa,Weather code METAR/SPECI,Weather code NWS,MOR Visibility (m),Number of detected particles,Kinetic Energy,Snow intensity (mm/h)
19.04.2018 12:31:00,0,0,NP,C,20000,0,0,0
19.04.2018 12:32:00,0,0,NP,C,20000,0,0,0
19.04.2018 12:33:00,0,0,NP,C,20000,0,0,0
19.04.2018 12:34:00,0,0,NP,C,20000,0,0,0
19.04.2018 12:35:00,0,0,NP,C,20000,0,0,0
```

### ott_2019.zip
- **Instrument**: OTT-PARSIVEL Optical Disdrometer
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `dd157657521334471c5fb413db8e9a90ba3a94d4a1ea6b0b8a9e70614f978856`
- **Compressed Size**: 1.70 MB
- **Internal Files**: 13 files (21.77 MB uncompressed)
- **Sample File**: `2019/ott_data_01_2019_npdc.csv`
```text
Timestamp,Intensity of precipitation (mm/h),Weather code SYNOP WaWa,Weather code METAR/SPECI,Weather code NWS,MOR Visibility (m),Number of detected particles,Kinetic Energy,Snow intensity (mm/h)
01.01.2019 00:00:00,0,0,NP,C,20000,0,0,0
01.01.2019 00:01:00,0,0,NP,C,20000,0,0,0
01.01.2019 00:02:00,0,0,NP,C,20000,0,0,0
01.01.2019 00:03:00,0,0,NP,C,20000,0,0,0
01.01.2019 00:04:00,0,0,NP,C,20000,0,0,0
```

### ott_2020.zip
- **Instrument**: OTT-PARSIVEL Optical Disdrometer
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `4240d754350fef28c56e81cdd869580629dfc429a84f661965ef270f238f51d1`
- **Compressed Size**: 1.15 MB
- **Internal Files**: 10 files (12.69 MB uncompressed)
- **Sample File**: `2020/ott_data_04_2020_npdc_n.csv`
```text
Timestamp,Intensity of precipitation (mm/h),Weather code SYNOP WaWa,Weather code METAR/SPECI,Weather code NWS,MOR Visibility (m),Number of detected particles,Kinetic Energy,Snow intensity (mm/h)
2020-04-15 06:03:00,0,0,NP,C,20000,0,0,0
2020-04-15 06:04:00,0,0,NP,C,20000,0,0,0
2020-04-15 06:05:00,0,0,NP,C,20000,0,0,0
2020-04-15 06:06:00,0,0,NP,C,20000,0,0,0
2020-04-15 06:07:00,0,0,NP,C,20000,0,0,0
```

### ott_2021.zip
- **Instrument**: OTT-PARSIVEL Optical Disdrometer
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `4d2923ce4bb5e9f05f8e1238b9da7c67bf75a25340d9868b2ded5b0e380e8333`
- **Compressed Size**: 2.36 MB
- **Internal Files**: 13 files (29.84 MB uncompressed)
- **Sample File**: `2021/ott_data_apr2021_npdc_n.csv`
```text
Timestamp,Intensity of precipitation (mm/h),Weather code SYNOP WaWa,Weather code METAR/SPECI,Weather code NWS,MOR Visibility (m),Number of detected particles,Kinetic Energy,Snow intensity (mm/h)
01.04.2021 00:00:00,0.267,71,-SN,S-,1192,118,0.36,5
01.04.2021 00:01:00,0.277,71,-SN,S-,2238,165,0.52,1
01.04.2021 00:02:00,0.224,71,-SN,S-,2400,173,0.31,2
01.04.2021 00:03:00,0.431,71,-SN,S-,1889,270,0.96,2
01.04.2021 00:04:00,0.706,71,-SN,S-,951,478,1.36,3
```

### ott_jan_to_june_2019.zip
- **Instrument**: OTT-PARSIVEL Optical Disdrometer
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `484d8329f3283418b67a6d374da5731b1d7e7621c446a75ad00776dcacbfcba8`
- **Compressed Size**: 3.71 MB
- **Internal Files**: 12 files (58.45 MB uncompressed)

### ott_jul_aug_sep_2019.zip
- **Instrument**: OTT-PARSIVEL Optical Disdrometer
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `bbc79e833a1e7a46ef33f2eb70c383555c516d807fa2b6f60f802159661a515b`
- **Compressed Size**: 7.09 MB
- **Internal Files**: 6 files (94.97 MB uncompressed)

### ott_oct_nov_dec_2019.zip
- **Instrument**: OTT-PARSIVEL Optical Disdrometer
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `dc76e77c3202aac65a50ad996d16268eda0a7a7d2cafc2cf95d83f7a30358bb6`
- **Compressed Size**: 11.14 MB
- **Internal Files**: 6 files (142.92 MB uncompressed)

### radiometer_2018.zip
- **Instrument**: Multi-frequency Microwave Radiometer (HATPRO)
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `fe3a87a499504cd4ed75b496759f7e9c7012adcff631de45eca6f0a0143ec2d8`
- **Compressed Size**: 24.33 MB
- **Internal Files**: 12 files (78.68 MB uncompressed)
- **Sample File**: `NyAlesund_Ncpor_Radiometer_2018_06_Zenith_H.csv`
```text
Timestamp,0.00,0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2.0,2.25,2.50,2.75,3.0,3.25,3.50,3.75,4.00,4.25,4.50,4.75,5.0,5.25,5.5,5.75,6.0,6.25,6.5,6.75,7.0,7.25,7.5,7.75,8.0,8.25,8.50,8.75,9.0,9.25,9.50,9.75,10.0,qual
2018-06-12 15:03:34,67.29,75.83,76.47,79.03,82.68,84.85,87.55,91.15,90.30,93.86,96.27,94.88,100.00,98.31,100.00,99.55,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,91.17,76.37,69.56,57.42,45.79,41.56,36.58,36.88,30.29,25.30,23.55,21.64,20.84,22.88,22.17,24.16,20.14,19.96,20.28,24.33,25.34,23.35,21.14,10.56,6.76,4.34,2.51,0
2018-06-12 15:05:47,67.66,77.04,77.70,79.91,83.27,85.69,88.39,92.10,91.29,95.38,97.83,96.40,100.00,98.55,99.44,99.31,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,90.38,75.89,70.40,58.91,48.16,44.09,39.36,39.31,32.53,27.45,25.57,23.77,22.77,24.84,23.69,25.65,22.08,21.83,22.17,25.62,26.42,25.01,22.03,11.85,7.90,5.05,2.85,0
2018-06-12 15:08:00,68.56,76.44,76.86,79.17,82.36,84.92,87.60,91.43,90.69,95.19,97.64,96.92,100.00,99.68,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,91.55,78.33,73.88,62.69,52.03,47.62,42.24,41.91,35.37,30.05,27.77,25.96,24.72,26.45,25.09,26.91,23.40,23.07,22.94,25.93,26.02,24.79,21.94,11.78,7.78,5.01,2.95,0
2018-06-12 15:10:12,67.69,76.65,77.17,79.33,82.56,85.09,87.82,91.58,90.67,95.11,97.52,96.23,100.00,98.64,99.31,99.61,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,91.76,77.97,72.99,61.71,51.16,47.19,42.10,41.89,34.86,29.51,27.43,25.73,24.40,26.31,24.94,26.83,23.40,23.09,23.33,26.37,26.87,25.68,22.50,12.20,8.23,5.18,2.96,0
2018-06-12 15:12:24,67.67,76.70,76.90,79.32,82.64,85.04,87.70,91.32,90.45,94.66,97.34,95.72,100.00,98.15,98.99,99.01,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,100.00,89.21,74.95,69.84,58.11,47.43,43.46,39.02,38.91,32.36,27.17,25.43,23.56,22.60,24.77,23.67,25.38,21.89,21.80,22.48,25.91,27.25,25.69,22.70,12.48,8.51,5.37,2.94,0
```

### radiometer_2019.zip
- **Instrument**: Multi-frequency Microwave Radiometer (HATPRO)
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `912801404ec1f876feee00fef98e27d5a07dd2858ae1348a50110e99a2f0975d`
- **Compressed Size**: 27.98 MB
- **Internal Files**: 18 files (87.43 MB uncompressed)
- **Sample File**: `NyAlesund_Ncpor_Radiometer_2019_11_Zenith_H.csv`
```text
Timestamp,0.00,0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2.0,2.25,2.50,2.75,3.0,3.25,3.50,3.75,4.00,4.25,4.50,4.75,5.0,5.25,5.5,5.75,6.0,6.25,6.5,6.75,7.0,7.25,7.5,7.75,8.0,8.25,8.50,8.75,9.0,9.25,9.50,9.75,10.0,qual
2019-11-01 00:05:31,68.72,66.79,66.35,66.61,66.55,66.88,66.73,65.93,66.89,65.70,65.02,63.98,61.56,58.33,57.53,54.12,52.42,46.88,43.40,42.12,39.78,32.15,26.92,20.68,16.72,14.55,10.61,8.44,6.33,6.16,4.87,3.35,2.53,2.80,2.51,2.66,2.84,2.76,2.69,2.42,2.47,3.35,3.71,3.81,3.87,3.99,4.50,4.00,3.69,2.64,1.85,1.72,1.61,0.52,0.18,0.16,0.21,0.10,0
2019-11-01 00:07:43,69.09,68.48,67.81,67.85,67.68,67.92,67.19,66.25,66.98,65.99,64.82,63.56,60.77,56.59,54.60,50.90,48.82,44.44,40.51,39.72,37.63,31.60,27.66,22.21,18.47,16.35,12.62,10.34,7.93,8.35,6.90,5.11,3.92,4.27,3.91,4.20,4.50,4.47,4.18,3.79,3.79,4.86,5.60,5.63,5.75,5.78,6.48,5.81,5.21,3.84,2.68,2.30,2.07,0.72,0.29,0.25,0.24,0.15,0
2019-11-01 00:09:55,69.20,69.44,69.07,69.34,69.37,69.61,69.47,68.38,69.31,68.42,67.54,66.43,63.82,59.88,58.21,54.26,52.07,46.62,42.17,40.63,37.99,30.60,25.95,20.05,16.31,14.35,10.61,8.57,6.56,6.75,5.55,3.96,3.05,3.42,3.14,3.42,3.68,3.57,3.44,3.09,3.19,4.15,4.75,4.87,4.95,5.00,5.67,5.13,4.68,3.32,2.38,2.11,2.09,0.71,0.26,0.21,0.26,0.15,0
2019-11-01 00:12:08,68.51,68.51,68.17,68.69,68.66,69.10,68.76,68.01,69.15,68.18,67.47,66.17,63.22,59.84,58.30,54.29,52.23,47.22,43.56,41.84,39.42,33.04,28.66,22.94,19.25,16.89,12.79,10.62,8.35,8.38,6.88,5.09,4.00,4.38,3.93,4.18,4.40,4.31,4.13,3.75,3.91,4.87,5.26,5.34,5.52,5.67,6.27,5.60,5.09,3.73,2.92,2.67,2.41,0.91,0.34,0.27,0.30,0.17,0
2019-11-01 00:14:20,67.47,67.42,67.66,67.86,67.82,67.64,67.40,66.52,66.92,65.34,64.04,62.32,59.08,55.92,54.71,51.38,49.51,44.02,40.67,39.97,38.28,31.91,27.33,21.61,17.93,15.85,12.25,10.26,7.94,7.71,6.17,4.35,3.27,3.61,3.21,3.48,3.72,3.45,3.26,2.85,2.93,3.80,4.15,4.29,4.37,4.52,4.99,4.35,3.98,2.77,2.01,1.77,1.61,0.52,0.17,0.14,0.17,0.10,0
```

### radiometer_2020.zip
- **Instrument**: Multi-frequency Microwave Radiometer (HATPRO)
- **Station**: Himadri
- **Region**: Arctic (Ny-Ålesund, Svalbard)
- **Provider**: NCPOR Atmospheric Sciences
- **SHA-256**: `4fe03f975b4d277fb20286d33b9fde142c0412624e82d242a620dc1220906edd`
- **Compressed Size**: 46.16 MB
- **Internal Files**: 23 files (146.58 MB uncompressed)
- **Sample File**: `NyAlesund_Ncpor_Radiometer_2020_01_Zenith_T.csv`
```text
Timestamp,0.00,0.05,0.1,0.15,0.2,0.25,0.3,0.35,0.4,0.45,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2.0,2.25,2.50,2.75,3.0,3.25,3.50,3.75,4.00,4.25,4.50,4.75,5.0,5.25,5.5,5.75,6.0,6.25,6.5,6.75,7.0,7.25,7.5,7.75,8.0,8.25,8.50,8.75,9.0,9.25,9.50,9.75,10.0,qual
2020-01-01 00:05:30,260.96,259.87,260.07,260.05,260.01,259.91,259.87,259.76,259.59,259.55,259.29,259.16,258.86,258.73,258.49,258.34,258.13,257.76,257.30,256.69,255.93,255.06,253.96,253.13,252.65,251.64,249.54,247.45,245.37,242.97,240.82,238.94,237.19,235.35,233.29,231.13,229.19,227.28,225.28,223.28,221.55,219.82,218.28,216.68,215.29,213.92,212.61,211.08,209.63,208.24,206.68,205.12,203.66,201.72,199.39,197.23,195.64,194.25,0
2020-01-01 00:07:43,261.13,260.33,260.59,260.56,260.50,260.34,260.22,260.07,259.81,259.75,259.43,259.09,258.62,258.30,257.92,257.47,257.05,256.55,255.98,255.31,254.59,253.85,252.74,251.98,251.51,250.56,248.59,246.77,244.82,242.54,240.44,238.60,236.99,235.21,233.26,231.12,229.32,227.42,225.51,223.56,221.84,220.12,218.62,217.08,215.75,214.42,213.11,211.60,210.20,208.82,207.32,205.81,204.36,202.38,200.00,197.78,196.08,194.60,0
2020-01-01 00:09:55,261.23,260.28,260.62,260.65,260.70,260.68,260.65,260.60,260.42,260.47,260.22,260.03,259.76,259.52,259.23,258.85,258.60,258.18,257.63,257.08,256.20,255.34,254.11,253.32,252.72,251.60,249.29,247.15,245.02,242.50,240.19,238.15,236.33,234.46,232.39,230.14,228.25,226.23,224.25,222.20,220.40,218.56,217.03,215.49,214.10,212.77,211.44,209.90,208.45,206.99,205.44,203.93,202.48,200.53,198.27,196.15,194.60,193.23,0
2020-01-01 00:12:08,261.37,260.60,260.86,260.84,260.81,260.75,260.68,260.57,260.33,260.32,260.01,259.73,259.38,259.11,258.82,258.45,258.19,257.76,257.21,256.68,255.89,255.14,254.04,253.32,252.84,251.93,250.00,248.15,246.29,243.97,241.81,239.91,238.23,236.47,234.52,232.41,230.63,228.72,226.77,224.75,222.96,221.15,219.63,218.07,216.67,215.30,213.93,212.40,210.98,209.54,207.99,206.49,205.09,203.30,201.15,199.11,197.58,196.23,0
2020-01-01 00:14:21,261.46,260.30,260.55,260.54,260.51,260.36,260.28,260.18,260.00,259.96,259.73,259.48,259.11,258.87,258.50,258.11,257.71,257.19,256.57,255.82,255.05,254.20,252.99,252.14,251.55,250.49,248.28,246.28,244.22,241.84,239.66,237.74,236.07,234.20,232.20,230.05,228.17,226.25,224.31,222.34,220.63,218.89,217.37,215.84,214.51,213.18,211.89,210.39,209.00,207.65,206.20,204.72,203.30,201.33,199.03,196.88,195.28,193.86,0
```

### surface_data_bharati_Dec2018_Nov2022.zip
- **Instrument**: Surface Synoptic / Weather Station
- **Station**: Bharati
- **Region**: Antarctica (Larsemann Hills)
- **Provider**: IMD
- **SHA-256**: `498d43fb740aaacb7b2ca06753fb263d8e684fce0dcbc7c9da69c67654b46db7`
- **Compressed Size**: 0.22 MB
- **Internal Files**: 2 files (1.06 MB uncompressed)
- **Sample File**: `89776_TB2.dat`
```text
897761812010007-052080000      0000000000                                    201
897761812020003-058050000      0000000000                                    201
89776181203-003-079070000      0000000000                                    201
89776181204-011-060100000      0000000000                                    201
897761812050007-058110000      0000000000                                    201
897761812060007-063070000      0000000000                                    201
```

### surface_data_maitri_1990-2019.zip
- **Instrument**: Surface Synoptic / Weather Station
- **Station**: Maitri
- **Region**: Antarctica (Schirmacher Oasis)
- **Provider**: IMD
- **SHA-256**: `5c2b5b4bca6835743bdcf5adde257ef9ddd067583ee1006379fc1480c2215f71`
- **Compressed Size**: 1.66 MB
- **Internal Files**: 2 files (11.86 MB uncompressed)
- **Sample File**: `89514_TB2.dat`
```text
8951489122700920001                                                          191                                             
8951489122800650018                                                          191                                             
895148912290023-002                      0117302300                          191                                             
895148912300027-004              1       01030013300116302130                191                                             
8951489123100520011              1       0123402400                          191                                             
895149001010018-00209            1       01000101300113502400                191MAX. TEMP. RECORDED AT 0800 GMT.             
```

---

## 3. Normalized Scientific Data Model Proposal

Based on actual schema inspection, observations must NOT be force-fit into an artificial single table. Instead, a dual-layer model is adopted:

1. **Common Observation Envelope**:
   - `record_id`: UUID
   - `dataset_id`: Foreign key to `datasets` collection
   - `station_id`: `maitri` | `bharati` | `himansh` | `himadri` | `sankalp`
   - `timestamp`: ISO-8601 UTC
   - `coordinates`: GeoJSON Point `[longitude, latitude, elevation]`
   - `quality_flags`: `{ parameter: "VALID" | "MISSING" | "SUSPICIOUS" | "OUT_OF_RANGE" }`
   - `provenance`: `{ file: string, line: int, raw_checksum: string }`

2. **Domain-Specific Metric Payloads**:
   - **Meteorological / Surface**: Ambient temp, RH, pressure, wind speed, wind direction, dew point, solar radiation, rainfall/snowfall.
   - **Disdrometer (OTT-PARSIVEL)**: Drop diameter distribution, fall velocity classes, precipitation rate, radar reflectivity.
   - **Micro Rain Radar (MRR)**: Height-resolved profiles of radar reflectivity (dBZ), Doppler velocity, liquid water content.
   - **Microwave Radiometer (HATPRO)**: Atmospheric temperature profiles, relative humidity profiles, integrated water vapor (IWV), liquid water path (LWP).
   - **High Speed Wind**: High-frequency anemometer gusts, turbulence metrics, 1-second burst records.
