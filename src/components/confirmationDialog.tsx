import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
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
};

export default ConfirmationDialog;
