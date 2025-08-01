export default function projectService() {
  const getProjectScript = async (tracking_id, project_id) => {
    const protocol = process.env.ENVIRONMENT == "local" ? "http" : "https";
    return `<script src='${protocol}://${process.env.RECORD_HOST}:${process.env.RECORD_PORT}/record.js' defer type='module'></script><script id='rrweb-init' data-project='${project_id}'></script>`;
  };
  return { getProjectScript };
}
