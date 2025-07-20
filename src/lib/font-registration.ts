import { Font } from "@react-pdf/renderer";

Font.register({
  family: 'Poppins',
  fonts: [
    { src: '/fonts/Poppins-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/Poppins-Medium.ttf',  fontWeight: 500 },
    { src: '/fonts/Poppins-SemiBold.ttf',fontWeight: 600 },
    { src: '/fonts/Poppins-Bold.ttf',   fontWeight: 700 },
  ],
});