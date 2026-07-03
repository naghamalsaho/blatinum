import PropTypes from "prop-types";
import Modal from "@/shared/components/Modal";
import Button from "@/shared/components/Button";
import { getLanguage, t } from "@/shared/i18n";

export default function LogoutConfirm({ open, onClose, onConfirm }) {
  const lang = getLanguage();

  const strings =
    lang === "en"
      ? {
          title: t("confirm_signout_title"),
          description: t("confirm_signout_desc"),
          cancel: t("cancel"),
          confirm: t("sign_out_btn"),
        }
      : {
          title: t("confirm_signout_title"),
          description: t("confirm_signout_desc"),
          cancel: t("cancel"),
          confirm: t("sign_out_btn"),
        };

  return (
    <Modal
      open={open}
      title={strings.title}
      description={strings.description}
      onClose={onClose}
      footer={
        <div className="modal-actions">
          <Button
            type="button"
            className="ghost-filter-btn"
            onClick={onClose}
          >
            {strings.cancel}
          </Button>

          <Button
            type="button"
            className="primary-action-btn"
            onClick={() => {
              onConfirm?.();
            }}
          >
            {strings.confirm}
          </Button>
        </div>
      }
      size="sm"
    />
  );
}

LogoutConfirm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
