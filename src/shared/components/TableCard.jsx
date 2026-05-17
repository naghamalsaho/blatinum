import PropTypes from "prop-types";

export default function TableCard({
  title,
  count,
  children,
}) {
  return (
    <div className="legal-table-card">
      <div className="table-card-header">
        <h2>{title}</h2>
        <span>{count} records</span>
      </div>

      <div className="table-scroll">
        {children}
      </div>
    </div>
  );
}

TableCard.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number,
  children: PropTypes.node,
};
