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
        {kicker ? (
          <p className="page-kicker">
            {kicker}
          </p>
        ) : null}

        <h1 className="page-title">
          {title}
        </h1>

        {subtitle ? (
          <p className="page-subtitle">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action}
    </div>
  );
}

PageHeader.propTypes = {
  kicker: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
};

PageHeader.defaultProps = {
  kicker: "",
  subtitle: "",
  action: null,
};
