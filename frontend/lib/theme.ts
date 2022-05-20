import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  components: {
    Avatar: {
      baseStyle: {
        font: "Open Sans, sans-serif",
      },
    },
    Button: {
      baseStyle: {
        _hover: { bg: "teal.600" },
        borderRadius: "4px",
      },
      variants: {
        base: {
          bg: "#41B3A3",
          color: "#FFFFFF",
        },
        outline: {
          bg: "gray.50",
        },
      },
      defaultProps: {
        variant: "base",
      },
    },
  },
});

export default theme;
