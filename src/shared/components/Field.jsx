import PropTypes from "prop-types";

export default function Field({
  type = "text",
  name,
  value,
  onChange,
  label,
  iconClass,
  required = true,
  error = "",
}) {
  return (
    <div className="field-group">
      <div className="field-wrapper">
        <input
          type={type}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
        />
        <label>{label}</label>
        <i className={iconClass}></i>
      </div>

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

Field.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  iconClass: PropTypes.string.isRequired,
  required: PropTypes.bool,
  error: PropTypes.string,
};