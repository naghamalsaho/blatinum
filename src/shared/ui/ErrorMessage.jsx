import PropTypes from 'prop-types';

export default function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <p style={{ color: "red", marginTop: "10px" }}>
      {message}
    </p>
  );
}

ErrorMessage.propTypes = {
  message: PropTypes.string,
};