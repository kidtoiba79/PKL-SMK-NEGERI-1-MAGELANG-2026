@echo off
title SiPKL Server - SMK N 1 Magelang
color 0B

echo ========================================================
echo          SiPKL - Sistem Informasi PKL
echo             SMK N 1 MAGELANG
echo ========================================================
echo.
echo Pastikan Anda sudah menjalankan 'npm install' jika ini
echo adalah kali pertama Anda membuka project ini.
echo.
echo Sedang menghidupkan server...
echo Browser akan otomatis terbuka.
echo.
echo (Tekan Ctrl+C untuk mematikan server)
echo ========================================================

call npm run dev -- --open

pause
