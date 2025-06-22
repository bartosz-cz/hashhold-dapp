import { Backdrop, CircularProgress } from "@mui/material";

const LoadingOverlay = ({ open }: { open: boolean }) => (
  <Backdrop
    open={open}
    sx={{
      color: "#fff",
      zIndex: 50,
      display: "flex",
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
    }}
  >
    <CircularProgress color="inherit" />
  </Backdrop>
);

export default LoadingOverlay;
