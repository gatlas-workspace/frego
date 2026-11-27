// Cấu hình chính ở app.json; file này chỉ thêm phần cần đọc biến môi trường.
// Google Maps key cho Android (bản build cài máy thật). Expo Go và iOS (Apple Maps) không cần key.
// Không commit key: đặt GOOGLE_MAPS_ANDROID_KEY trong apps/mobile/.env hoặc biến môi trường EAS.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY ?? '' }],
  ],
});
