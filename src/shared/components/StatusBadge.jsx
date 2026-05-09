import PropTypes from "prop-types";

export default function StatusBadge({
  status,
  type = "default",
}) {
  return (
    <span className={`status-pill ${type}`}>
      {status}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  type: PropTypes.string,
};