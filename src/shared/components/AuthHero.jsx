import PropTypes from "prop-types";

export default function AuthHero({
  line1 = "WELCOME",
  line2 = "BACK!",
}) {
  return (
    <div className="welcome-section">
      <h2>
        {line1}
        <br />
        {line2}
      </h2>
    </div>
  );
}

AuthHero.propTypes = {
  line1: PropTypes.string,
  line2: PropTypes.string,
};