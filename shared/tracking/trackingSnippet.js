// Builds the HTML snippet an agency pastes on its website to load the widget.
//
// Pure function: it lived in the project service, which the Project model had
// to import for its pre-save hook, so a model depended on a service that
// itself depended on the model.

export const buildTrackingSnippet = (projectId) => {
  const isLocal = process.env.ENVIRONMENT === "local";
  const source = isLocal
    ? `http://${process.env.RECORD_HOST}:${process.env.RECORD_PORT}/record.js`
    : `${process.env.RECORD_HOST}/record.js`;

  return (
    `<script src='${source}' defer type='module'></script>` +
    `<script id='rrweb-init' data-project='${projectId}'></script>`
  );
};

export default buildTrackingSnippet;
