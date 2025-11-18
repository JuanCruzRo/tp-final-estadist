import React from "react";
import { Button } from "primereact/button";

export default function PageLayout({ title, subtitle, actions, children }) {
  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="page-header-right">
          {actions &&
            actions.map((action, i) => (
              <Button
                key={i}
                label={action.label}
                icon={action.icon}
                className={action.secondary ? "p-button-secondary" : "p-button-primary"}
                onClick={action.onClick}
              />
            ))}
        </div>
      </div>

      {children}
    </>
  );
}
