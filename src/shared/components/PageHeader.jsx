import PropTypes from "prop-types";

export default function PageHeader({
  kicker,
  title,
  subtitle,
  action,
}) {
  return (
    <div className="legal-page-header">
      <div>
        <p className="page-kicker">
          {kicker}
        </p>

        <h1 className="page-title">
          {title}
        </h1>

        <p className="page-subtitle">
          {subtitle}
        </p>
      </div>

      {action}
    </div>
  );
}

PageHeader.propTypes = {
  kicker: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  action: PropTypes.node,
};