import React from "react";
import PropTypes from "prop-types";

const STATUSES = ["draft", "active", "completed", "terminated"];

export default function ContractStatusStepper({ currentStatus = "draft" }) {
  const normalizedStatus = (currentStatus || "draft").toLowerCase();
  const currentIndex = STATUSES.indexOf(normalizedStatus);

  return (
    <div className="status-line-wrapper">
      <div className="status-line-container">
        {/* الخط المنقط خلف النقاط */}
        <div className="status-line-track"></div>

        {STATUSES.map((status, index) => {
          const isCompleted = index < currentIndex && normalizedStatus !== "terminated";
          const isCurrent = index === currentIndex;
          const isTerminated = status === "terminated" && normalizedStatus === "terminated";

          let stateClass = "";
          if (isTerminated) stateClass = "terminated";
          else if (isCurrent) stateClass = "current";
          else if (isCompleted) stateClass = "completed";

          return (
            <div key={status} className="status-line-step">
              <div
                className={`status-line-dot ${stateClass}`}
                title={status}
              />
              <span className={`status-line-label ${stateClass}`}>
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ContractStatusStepper.propTypes = {
  currentStatus: PropTypes.string,
};