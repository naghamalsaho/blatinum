import PropTypes from "prop-types";

export default function StatCard({
  title,
  value,
  note,
  icon: Icon,
}) {
  return (
    <article className="legal-stat-card">
      <div className="legal-stat-icon">
        <Icon size={18} />
      </div>

      <div>
        <p className="legal-stat-title">{title}</p>

        <h3 className="legal-stat-value">
          {value}
        </h3>

        <span className="legal-stat-note">
          {note}
        </span>
      </div>
    </article>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
  note: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
};