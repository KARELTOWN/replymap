self.onmessage = async (e) => {
  const { param, action } = e.data;

  const fd = new FormData();
  for (const key in param.payload) {
    fd.append(key, param.payload[key]);
  }
  console.log('param.attachments', param.attachments)

  for (const file of param.attachments) {
    fd.append('attachments', file);
  }

  async function storeFeedback() {
    try {
      const result = await fetch(`${param.url}`, {
        method: param.method,
        body: fd,
      });
      const response = await result.json();

      if (result.ok) {
        self.postMessage({ type: "done", data: response });
      } else {
        if (result.status === 422 && response.errors) {
          const errors = response.errors.map((e) => e.msg);
          self.postMessage({
            type: "error",
            message: response.message,
            errors,
          });
        } else {
          self.postMessage({ type: "error", message: response.message });
        }
      }
    } catch (err) {
      self.postMessage({ type: "error", error: err.message });
    }
  }

  async function storeFeedbackMember() {
    try {
      const result = await fetch(`${param.url}`, {
        method: param.method,
        headers: {
          Authorization: `Bearer ${param.token}`,
        },
        body: fd,
      });
      const response = await result.json();
      if (result.ok) {
        self.postMessage({ type: "done", data: response });
      } else {
        if (result.status === 422 && response.errors) {
          const errors = response.errors.map((e) => e.msg);
          self.postMessage({
            type: "error",
            message: response.message,
            errors,
          });
        } else {
          self.postMessage({ type: "error", message: response.message });
        }
      }
    } catch (err) {
      self.postMessage({ type: "error", message: err.message });
    }
  }

  if (action == "storeFeedback") {
    await storeFeedback();
  } else if (action == "storeFeedbackMember") {
    await storeFeedbackMember();
  } else {
    self.postMessage({ type: "error", action, error: "Unknown action" });
  }
};
