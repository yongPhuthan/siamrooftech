// src/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: '"Sukhumvit Set", Arial, sans-serif',
    h1: {
      fontFamily: '"Sukhumvit Bold"', // Specify the font family for headings if different
      fontWeight: 500, // Medium for titles
    },
    h2: {
      fontFamily: '"Sukhumvit Bold"',
      fontWeight: 500,
    },
    h3: {
      fontFamily: '"Sukhumvit Bold"',
      fontWeight: 500,
    },
    h4: {
      fontFamily: '"Sukhumvit Bold"',
      fontWeight: 500,
    },
    h5: {
      fontFamily: '"Sukhumvit Bold"',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Sukhumvit Set"',
      fontWeight: 'bold',
   
    },
    subtitle1: {
      fontFamily: '"Sukhumvit Set"',
      fontWeight: 400, // Normal weight
    },
    body1: {
      fontFamily: '"Sukhumvit Set"',
      fontWeight: 400, // Normal weight
    },
    fontWeightBold: 700, // Bold weight
    // Add more customizations as needed
  },
  
  // You can also add overrides for MUI components to use your custom fonts
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: '"Sukhumvit Set", Arial, sans-serif',
        },
      },
    },
    // Any other component overrides
  },
});

export default theme;
