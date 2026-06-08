import { useDispatch, useSelector } from "react-redux";
import ApiErrorDialog from "./ApiErrorDialog";
import { closeError } from "@/shared/store/error/error.slice";

export default function GlobalErrorDialog() {
  const dispatch = useDispatch();

  const { open, message } = useSelector(
    (state) => state.error
  );

  return (
    <ApiErrorDialog
      open={open}
      message={message}
      onClose={() => dispatch(closeError())}
    />
  );
}