import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Avatar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  Content: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/*const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          backgroundColor: "#2b2b2b",
          borderRadius: 3,
          p: 0,
          color: "#f0f0f0",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: "1.25rem",
          pb: 2,
          textAlign: "center", // ✅ Center title
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent>
        <DialogContentText
          sx={{
            color: "#ccc",
            whiteSpace: "pre-line",
            fontSize: "1rem",
            textAlign: "center", // ✅ Center message text
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          justifyContent: "center", // ✅ Center buttons
        }}
      >
        <Button onClick={onCancel} sx={{ color: "#a58aff" }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          sx={{
            backgroundColor: "#7b61ff",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#6348e3",
            },
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};*/

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title,
  Content,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: (theme) => ({
          backgroundColor: theme.palette.background.paper,
          borderRadius: 3,
          p: 2,
          color: theme.palette.text.primary,
          minWidth: 250,
        }),
      }}
    >
      {/* Górny pasek z tytułem i ikoną zamknięcia */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mx: "auto" }}>
          {title}
        </Typography>
        <IconButton
          onClick={onCancel}
          sx={{ color: "#888", position: "absolute", right: 8 }}
        >
          <CloseIcon></CloseIcon>
        </IconButton>
      </Box>
      {Content}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexDirection="row"
        gap={2}
        borderRadius={2}
      >
        <Button variant="contained" fullWidth onClick={onConfirm}>
          CONFIRM
        </Button>
      </Box>
    </Dialog>
  );
};

export default ConfirmationDialog;
