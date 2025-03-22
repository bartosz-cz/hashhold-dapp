import { ConfirmationDialogProps } from "../components/confirmationDialog";

export const defaultConfirmationDialogProps: ConfirmationDialogProps = {
  open: false,
  title: "",
  message: "",
  onConfirm: () => {},
  onCancel: () => {},
};
